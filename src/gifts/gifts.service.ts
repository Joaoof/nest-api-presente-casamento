import {
    Injectable,
    NotFoundException,
    ConflictException,
    InternalServerErrorException,
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
     * Atualiza apenas a imagem de um presente
     */
    async updateImage(id: string, imageUrl: string): Promise<Gift> {
        try {
            const updatedGift = await this.prisma.gift.update({
                where: { id },
                data: { imageUrl },
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

            console.error('Erro ao atualizar imagem do presente:', error);
            throw new Error('Erro ao atualizar a imagem do presente');
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
     * HTML do e-mail (ATUALIZADO COM O TEMA DO CASAMENTO)
     */
    private generateReservationEmailHtml(gift: Gift): string {
        // Renderiza a tag de imagem apenas se a URL da imagem existir no banco
        const imageHtml = gift.imageUrl 
            ? `<img src="${gift.imageUrl}" alt="${gift.name}" class="gift-image">` 
            : ``;

        // URL do WhatsApp pré-formatada. IMPORTANTE: Substitua '5500000000000' pelo número real.
        const whatsappMsg = `Olá Luís e Vitória! Acabei de reservar o presente '${gift.name}' para o casamento de vocês!`;
        const whatsappUrl = `https://wa.me/5500000000000?text=${encodeURIComponent(whatsappMsg)}`;

        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Presente Reservado - Luís e Vitória</title>
<style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F5F5DC; margin: 0; padding: 20px; color: #000000; }
    .container { max-width: 600px; margin: auto; background: #FFFFFF; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #D8B56A; }
    .header { text-align: center; padding: 30px 20px; background-color: #A3B8CC; color: #FFFFFF; border-bottom: 3px solid #8B4513; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 2px; }
    .status { background: #D8B56A; color: #000000; text-align: center; padding: 8px; font-weight: bold; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; }
    .content { padding: 30px; line-height: 1.6; }
    .content h2 { margin-top: 0; margin-bottom: 20px; color: #8B4513; font-weight: 400; text-align: center; font-size: 22px; }
    .card { background: #FAFAFA; border: 1px solid #EAEAEA; padding: 20px; margin-bottom: 25px; border-radius: 6px; text-align: center; }
    .gift-image { max-width: 100%; max-height: 250px; border-radius: 8px; margin-bottom: 15px; object-fit: cover; border: 1px solid #D8B56A; }
    .gift-name { font-size: 20px; color: #000000; margin-bottom: 10px; font-weight: bold; }
    .description { font-size: 14px; color: #555; margin-bottom: 15px; font-style: italic; }
    .wedding-info { background: #F5F5DC; border-left: 4px solid #A3B8CC; padding: 15px; font-size: 14px; color: #333; margin-top: 20px; border-radius: 0 6px 6px 0; text-align: left; }
    .wedding-info strong { color: #8B4513; }
    .button-container { text-align: center; margin-top: 35px; }
    .button { display: inline-block; background: #A3B8CC; color: #FFFFFF; padding: 14px 28px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 15px; border: 1px solid #92A8D1; transition: background 0.3s; }
    .button:hover { background: #92A8D1; }
    .footer { background: #FFFFFF; text-align: center; padding: 25px; font-size: 13px; color: #888; border-top: 1px solid #EAEAEA; }
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>Luís & Vitória</h1>
    </div>
    <div class="status">Presente Reservado com Sucesso</div>
    <div class="content">
        <h2>Detalhes do Presente</h2>
        
        <div class="card">
            ${imageHtml}
            <div class="gift-name">${gift.name}</div>
            <div class="description">${gift.description || 'Obrigado por nos presentear com este item especial!'}</div>
        </div>
        
        <div class="wedding-info">
            <strong>Local da Celebração:</strong><br>
            Jardim Botânico do Rio de Janeiro<br>
            Rua Jardim Botânico, 1008 - Rio de Janeiro<br><br>
            <strong>Data e Horário:</strong><br>
            Sábado, 12 de Outubro de 2024 às 16:30h
        </div>

        <div class="button-container">
            <a class="button" href="${whatsappUrl}" target="_blank">Avisar os Noivos (WhatsApp)</a>
        </div>
    </div>
    <div class="footer">
        <p>Sua presença e generosidade tornam este momento ainda mais especial.</p>
        <p>Com carinho,<br><strong>Luís e Vitória</strong></p>
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