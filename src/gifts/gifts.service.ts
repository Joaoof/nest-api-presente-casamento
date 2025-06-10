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

    constructor(
        private readonly prisma: PrismaService,
        private readonly cacheService: CacheService,
        private readonly mailService: MailService,
    ) { }

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
        const cachedData = await this.cacheService.get<any>(cacheKey);
        if (cachedData) return cachedData;

        const skip = (page - 1) * limit;
        let where: any = {};

        switch (filter) {
            case 'available':
                where.status = 'available';
                break;
            case 'reserved':
                where.status = 'reserved';
                break;
            default:
                break;
        }

        if (search && typeof search === 'string') {
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
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            };

            await this.cacheService.set(cacheKey, result, 7200); // 2 horas
            return result;
        } catch (error) {
            console.error('Erro na busca paginada:', error);
            throw new Error('Falha ao carregar lista paginada');
        }
    }

    // Busca todos os presentes (do cache ou do banco)
    async findAll(): Promise<Gift[]> {
        const cached = await this.cacheService.get<Gift[]>(this.cacheKey);
        if (cached) return cached;

        console.log('Cache não encontrado. Buscando do banco...');
        const gifts = await this.findAllFromDb();

        // Atualiza o cache com os dados frescos
        await this.cacheService.set(this.cacheKey, gifts, 3600); // TTL: 1 hora

        return gifts;
    }

    // Busca do banco de dados em background
    async findAllFromDb(): Promise<Gift[]> {
        try {
            const gifts = await this.prisma.gift.findMany({
                orderBy: { createdAt: 'desc' },
            });

            this.updateCacheInBackground();
            return gifts.map((gift) => ({
                ...gift,
                imageUrl: gift.imageUrl ?? null,
                reservedBy: gift.reservedBy ?? null,
            }));
        } catch (error) {
            console.error('Erro ao buscar presentes do banco:', error);
            throw new Error('Falha ao carregar lista de presentes');
        }
    }

    // Atualiza o cache em background (não bloqueia a resposta)
    private async updateCacheInBackground() {
        try {
            const freshData = await this.prisma.gift.findMany({
                orderBy: { createdAt: 'desc' },
            });
            await this.cacheService.set(this.cacheKey, freshData, 3600);
        } catch (error) {
            console.warn('Erro ao atualizar cache em background:', error.message);
        }
    }

    // Invalida o cache quando necessário
    private async invalidateCache() {
        await this.cacheService.del(this.cacheKey);
    }

    // Busca presente por ID
    async findOne(id: string): Promise<Gift> {
        const gift = await this.prisma.gift.findUnique({ where: { id } });
        if (!gift) {
            throw new NotFoundException(`Presente com ID ${id} não encontrado`);
        }
        return gift;
    }

    // Cria um novo presente
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

    // Atualiza um presente existente
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

    // Remove um presente
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

    // Reserva um presente
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

        // Extrai o email do formato "Nome <email@example.com>"
        const match = reservedBy.match(/<(.+?)>/);
        const email = match?.[1];

        if (email) {
            try {
                await this.mailService.sendMail({
                    to: email,
                    subject: `Você reservou: ${updatedGift.name}`,
                    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Presente Reservado - Nossa Lar</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f5f7; /* Fundo suave */
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .confirmation-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            width: 100%;
            overflow: hidden;
            position: relative;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
        }

        .header h2 {
            font-size: 2em;
            color: #333;
            margin-bottom: 10px;
        }

        .gift-icon {
            font-size: 3em;
            color: #ff9f43; /* Cor laranja vibrante */
            margin-bottom: 15px;
        }

        .content {
            padding: 0 20px;
        }

        .gift-info {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .gift-name {
            font-size: 1.4em;
            color: #2d3748;
            font-weight: 700;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .info-item {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
        }

        .info-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }

        .info-icon {
            width: 40px;
            height: 40px;
            background: #ff9f43; /* Cor laranja vibrante */
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.1em;
            margin-right: 15px;
            flex-shrink: 0;
        }

        .info-content {
            flex: 1;
        }

        .info-label {
            font-size: 0.9em;
            color: #718096;
            margin-bottom: 2px;
            font-weight: 500;
        }

        .info-value {
            font-size: 1.1em;
            color: #2d3748;
            font-weight: 600;
        }

        .thank-you {
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            font-size: 1.1em;
            line-height: 1.6;
        }

        .button-container {
            text-align: center;
            margin-top: 20px;
        }

        .cta-button {
            display: inline-block;
            background: #ff9f43; /* Cor laranja vibrante */
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1em;
            font-weight: 600;
            text-decoration: none;
            transition: background 0.3s ease;
        }

        .cta-button:hover {
            background: #e67e22; /* Sombra laranja mais escura */
        }

        @media (max-width: 480px) {
            .confirmation-card {
                margin: 10px;
            }
            
            .header {
                padding: 25px 20px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .gift-info {
                padding: 20px;
            }
            
            .header h2 {
                font-size: 1.8em;
            }
        }

        .status-badge {
            display: inline-block;
            background: #48bb78;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 600;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="confirmation-card">
        <div class="header">
            <div class="gift-icon">🎁</div>
            <h2>Presente Reservado!</h2>
            <div class="status-badge">✓ Confirmado</div>
        </div>
        
        <div class="content">
            <div class="gift-info">
                <div class="gift-name">
                    <span>🎀</span>
                    <span>${updatedGift.name}</span>
                </div>
                
                <div class="info-item">
                    <div class="info-icon">🏪</div>
                    <div class="info-content">
                        <div class="info-label">Loja</div>
                        <div class="info-value">Nossa Lar</div>
                    </div>
                </div>
                
                <div class="info-item">
                    <div class="info-icon">📍</div>
                    <div class="info-content">
                        <div class="info-label">Endereço</div>
                        <div class="info-value">Araguaína-TO</div>
                    </div>
                </div>
                
                <div class="info-item">
                    <div class="info-icon">👤</div>
                    <div class="info-content">
                        <div class="info-label">Vendedor Responsável</div>
                        <div class="info-value">Teste</div>
                    </div>
                </div>
            </div>
            
            <div class="thank-you">
                <strong>Obrigado por contribuir com o nosso casamento!</strong>
                <br>
                Sua generosidade torna este momento ainda mais especial.
            </div>

            <!-- Botão de Ação -->
            <div class="button-container">
                <a href="https://www.nossalar.com.br"  class="cta-button">Visitar Loja</a>
            </div>
        </div>
    </div>
</body>
</html>`,
                });
            } catch (mailError) {
                console.error('Erro ao enviar e-mail de reserva:', mailError);
                // Não interrompe a operação mesmo se o e-mail falhar
            }
        }

        await this.invalidateCache();
        return updatedGift;
    }

    async refreshCache() {
        const gifts = await this.findAllFromDb();
        await this.cacheService.set(this.cacheKey, gifts, 3600); // TTL de 1 hora
        return { message: 'Cache atualizado!' };
    }
}