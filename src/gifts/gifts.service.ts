import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { Gift, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGiftDto } from './dto/create-gift.dto';
import { UpdateGiftDto } from './dto/update-gift.dto';
import { CacheService } from 'src/cache/cache.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class GiftsService {
    private readonly cacheKey = 'gifts:all';
    private readonly paginationCacheTTL = 7200; // 2 horas
    private readonly listCacheTTL = 3600; // 1 hora

    constructor(
        private readonly prisma: PrismaService,
        private readonly cacheService: CacheService,
        private readonly mailService: MailService,
    ) { }

    /**
     * Busca paginada com cache e otimização de performance
     */
    async findAllPaginated(params: {
        page?: number | string;
        limit?: number | string;
        filter?: 'all' | 'available' | 'reserved';
        search?: string;
    }) {
        const page = Math.max(1, parseInt(`${params.page}`, 10) || 1);
        const limit = Math.min(100, parseInt(`${params.limit}`, 10) || 12);
        const { filter = 'all', search } = params;

        const cacheKey = `gifts_pagination:${page}:${limit}:${filter}:${search || 'none'}`;
        const cached = await this.cacheService.get<any>(cacheKey);

        // ✅ Retorna cache mesmo que esteja desatualizado (stale-while-revalidate)
        if (cached) {
            this.refreshPaginationCacheInBackground(cacheKey, filter, search, limit, page);
            return cached;
        }

        const skip = (page - 1) * limit;
        let where: Prisma.GiftWhereInput = {};

        // Filtro por status
        if (filter === 'available') where.status = 'available';
        if (filter === 'reserved') where.status = 'reserved';

        // Busca insensível em name e description
        if (search && typeof search === 'string' && search.trim().length > 0) {
            const term = search.trim();
            where.OR = [
                { name: { contains: term, mode: 'insensitive' } },
                { description: { contains: term, mode: 'insensitive' } },
            ];
        }

        try {
            // 🔥 Evita count pesado: usa "limit + 1" para detectar se tem próxima página
            const gifts = await this.prisma.gift.findMany({
                where,
                skip,
                take: limit + 1, // +1 para verificar hasNextPage
                orderBy: { name: 'asc' },
            });

            const hasNext = gifts.length > limit;
            const data = hasNext ? gifts.slice(0, limit) : gifts;

            const total = skip + data.length; // Aproximação (ou use count se necessário)
            const totalPages = Math.ceil(total / limit);

            const result = {
                data: data.map(gift => ({
                    ...gift,
                    imageUrl: gift.imageUrl ?? null,
                    reservedBy: gift.reservedBy ?? null,
                })),
                meta: {
                    total: hasNext ? 'more' : total, // Ou use count real se precisar exato
                    page,
                    limit,
                    hasNext,
                    totalPages,
                },
            };

            // Armazena no cache
            await this.cacheService.set(cacheKey, result, this.paginationCacheTTL);

            return result;
        } catch (error) {
            console.error('Erro na busca paginada:', error);
            throw new Error('Falha ao carregar lista paginada');
        }
    }

    /**
     * Busca todos os presentes (com fallback no cache)
     */
    async findAll(): Promise<Gift[]> {
        const cached = await this.cacheService.get<Gift[]>(this.cacheKey);
        if (cached) {
            // Atualiza em background sem bloquear
            this.updateCacheInBackground();
            return cached;
        }

        return this.findAllFromDb();
    }

    /**
     * Busca direta do banco (usado em fallback ou atualização)
     */
    async findAllFromDb(): Promise<Gift[]> {
        try {
            const gifts = await this.prisma.gift.findMany({
                orderBy: { createdAt: 'desc' },
            });

            return gifts.map(gift => ({
                ...gift,
                imageUrl: gift.imageUrl ?? null,
                reservedBy: gift.reservedBy ?? null,
            }));
        } catch (error) {
            console.error('Erro ao buscar presentes do banco:', error);
            throw new Error('Falha ao carregar lista de presentes');
        }
    }

    /**
     * Atualiza o cache em background (não bloqueia resposta)
     */
    private async updateCacheInBackground() {
        setImmediate(async () => {
            try {
                const freshData = await this.findAllFromDb();
                await this.cacheService.set(this.cacheKey, freshData, this.listCacheTTL);
            } catch (error) {
                console.warn('Erro ao atualizar cache em background:', error.message);
            }
        });
    }

    /**
     * Invalida cache após alterações
     */
    private async invalidateCache() {
        await this.cacheService.del(this.cacheKey);

        // Também limpa caches de paginação
        await this.cacheService.del('gifts_pagination:*');
    }

    /**
     * Busca por ID
     */
    async findOne(id: string): Promise<Gift> {
        const gift = await this.prisma.gift.findUnique({ where: { id } });
        if (!gift) {
            throw new NotFoundException(`Presente com ID ${id} não encontrado`);
        }
        return gift;
    }

    /**
     * Cria novo presente
     */
    async create(createGiftDto: CreateGiftDto, adminId: string): Promise<Gift> {
        try {
            const gift = await this.prisma.gift.create({
                data: {
                    ...createGiftDto,
                    admin: { connect: { id: adminId } },
                },
            });

            await this.invalidateCache();
            return gift;
        } catch (error) {
            console.error('Erro ao criar presente:', error);
            throw new Error('Falha ao adicionar presente');
        }
    }

    /**
     * Atualiza presente
     */
    async update(id: string, updateGiftDto: UpdateGiftDto): Promise<Gift> {
        try {
            const updatedGift = await this.prisma.gift.update({
                where: { id },
                data: updateGiftDto,
            });

            await this.invalidateCache();
            return updatedGift;
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new NotFoundException(`Presente com ID ${id} não encontrado`);
            }

            console.error('Erro ao atualizar presente:', error);
            throw new Error('Erro ao atualizar o presente');
        }
    }

    /**
     * Remove presente
     */
    async remove(id: string): Promise<Gift> {
        try {
            const removedGift = await this.prisma.gift.delete({ where: { id } });

            await this.invalidateCache();
            return removedGift;
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new NotFoundException(`Presente com ID ${id} não encontrado`);
            }

            console.error('Erro ao remover presente:', error);
            throw new Error('Falha ao excluir presente');
        }
    }

    /**
     * Reserva presente
     */
    async reserveGift(id: string, reservedBy: string): Promise<Gift> {
        const gift = await this.findOne(id);

        if (gift.status === 'reserved') {
            throw new ConflictException('Este presente já foi reservado.');
        }

        const updatedGift = await this.prisma.gift.update({
            where: { id },
            data: {
                status: 'reserved',
                reservedBy,
            },
        });

        // Extrai email do formato "Nome <email@ex.com>"
        const emailMatch = reservedBy.match(/<(.+?)>/);
        const email = emailMatch?.[1];

        if (email) {
            try {
                await this.mailService.sendMail({
                    to: email,
                    subject: `Você reservou: ${updatedGift.name}`,
                    html: this.generateReservationEmailHtml(updatedGift),
                });
            } catch (mailError) {
                console.error('Erro ao enviar e-mail de reserva:', mailError);
            }
        }

        await this.invalidateCache();
        return updatedGift;
    }

    /**
     * HTML do e-mail (extraído para método separado)
     */
    private generateReservationEmailHtml(gift: Gift): string {
        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Presente Reservado - Nossa Lar</title>
<style>
body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
.container { max-width: 600px; margin: auto; background: #fff; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.header { text-align: center; padding: 20px; background: #3483fa; color: #fff; }
.header img { max-height: 60px; margin-bottom: 10px; }
.status { background: #00a650; color: #fff; text-align: center; padding: 10px; font-weight: bold; }
.content { padding: 20px; line-height: 1.6; color: #333; }
.content h2 { margin-bottom: 15px; color: #3483fa; }
.card { background: #fafafa; border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
.info { margin-bottom: 10px; }
.info strong { display: block; font-size: 12px; color: #666; }
.description { background: #fff; border-left: 4px solid #3483fa; padding: 10px 15px; font-size: 14px; color: #555; margin-top: 10px; border-radius: 4px; }
.button { display: inline-block; background: #3483fa; color: #fff; padding: 10px 20px; border-radius: 4px; text-decoration: none; }
.footer { background: #f8f9fa; text-align: center; padding: 15px; font-size: 12px; color: #666; }
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxASkbCxrIE51qABWD9vLiwnb9MPxZ2ql6Lg&s" alt="Nossa Lar Logo">
        <h1>Presente Reservado!</h1>
        <p>Sua reserva foi confirmada com sucesso</p>
    </div>
    <div class="status">✓ Confirmado</div>
    <div class="content">
        <h2>Detalhes do Presente</h2>
        <div class="card">
            <h3>${gift.name}</h3>
            <div class="info"><strong>Loja</strong> Nossa Lar</div>
            <div class="description">${gift.description}</div>
            <div class="info"><strong>Endereço</strong> Araguaína-TO</div>
            <div class="info"><strong>Vendedor</strong> Teste</div>
        </div>
        <div class="thank-you">
            <h3>Obrigado por contribuir com o nosso casamento!</h3>
            <p>Sua generosidade torna este momento ainda mais especial.</p>
        </div>
        <p style="text-align:center;">
            <a class="button" href="https://maps.app.goo.gl/ZbPTCr9dvPB6trNL6?g_st=ipc">Visitar Loja</a>
        </p>
    </div>
    <div class="footer">
        <p>Este e-mail confirma a reserva do seu presente.</p>
        <p>Em caso de dúvidas, entre em contato conosco.</p>
        <p><strong>Nossa Lar</strong></p>
        <p>A BASE DE PREÇO É A VISTA, NO CARTÃO VAI TER OS JUROS</p>
    </div>
</div>
</body>
</html>`;
    }

    /**
     * Atualiza cache manualmente (opcional)
     */
    async refreshCache() {
        const gifts = await this.findAllFromDb();
        await this.cacheService.set(this.cacheKey, gifts, this.listCacheTTL);
        return { message: 'Cache atualizado!' };
    }

    /**
     * Atualiza cache de paginação em background
     */
    private async refreshPaginationCacheInBackground(
        cacheKey: string,
        filter: string,
        search?: string,
        limit?: number,
        page?: number,
    ) {
        setImmediate(async () => {
            const skip = (page ? page - 1 : 0) * (limit ?? 12);
            let where: Prisma.GiftWhereInput = {};

            if (filter === 'available') where.status = 'available';
            if (filter === 'reserved') where.status = 'reserved';
            if (search) {
                const term = search.trim();
                if (term.length > 0) {
                    where.OR = [
                        { name: { contains: term, mode: 'insensitive' } },
                        { description: { contains: term, mode: 'insensitive' } },
                    ];
                }
            }

            try {
                const [gifts, total] = await Promise.all([
                    this.prisma.gift.findMany({
                        where,
                        skip,
                        take: limit,
                        orderBy: { name: 'asc' },
                    }),
                    this.prisma.gift.count({ where }),
                ]);

                const result = {
                    data: gifts.map(gift => ({
                        ...gift,
                        imageUrl: gift.imageUrl ?? null,
                        reservedBy: gift.reservedBy ?? null,
                    })),
                    meta: {
                        total,
                        page,
                        limit: limit ?? 12,
                        totalPages: Math.ceil(total / (limit ?? 12)),
                    },
                };

                await this.cacheService.set(cacheKey, result, this.paginationCacheTTL);
            } catch (error) {
                console.warn('Erro ao atualizar cache de paginação:', error);
            }
        });
    }
}
