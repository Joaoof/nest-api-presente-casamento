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
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background-color: #ebebeb;
            min-height: 100vh;
            padding: 20px 0;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        }
        
        .header {
            background: linear-gradient(135deg, #3483fa 0%, #2968c8 100%);
            padding: 30px 40px;
            text-align: center;
            color: white;
        }
        
        .header-icon {
            width: 60px;
            height: 60px;
            background-color: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 28px;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 300;
        }
        
        .status-banner {
            background-color: #00a650;
            color: white;
            padding: 12px 40px;
            text-align: center;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .content {
            padding: 40px;
        }
        
        .gift-card {
            border: 1px solid #e6e6e6;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 30px;
            background-color: #fafafa;
        }
        
        .gift-title {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e6e6e6;
        }
        
        .gift-title-icon {
            width: 32px;
            height: 32px;
            background-color: #fff159;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }
        
        .gift-title h2 {
            font-size: 20px;
            color: #333333;
            font-weight: 600;
        }
        
        .info-grid {
            display: grid;
            gap: 20px;
        }
        
        .info-row {
            display: flex;
            align-items: flex-start;
            gap: 16px;
        }
        
        .info-icon {
            width: 40px;
            height: 40px;
            background-color: #3483fa;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 16px;
            flex-shrink: 0;
        }
        
        .info-details {
            flex: 1;
        }
        
        .info-label {
            font-size: 12px;
            color: #666666;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        
        .info-value {
            font-size: 16px;
            color: #333333;
            font-weight: 500;
            line-height: 1.4;
        }
        
        .thank-you-section {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
            border-left: 4px solid #3483fa;
        }
        
        .thank-you-section h3 {
            font-size: 20px;
            color: #333333;
            margin-bottom: 12px;
            font-weight: 600;
        }
        
        .thank-you-section p {
            font-size: 16px;
            color: #666666;
            line-height: 1.6;
            font-weight: 400;
        }
        
        .cta-section {
            text-align: center;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #3483fa 0%, #2968c8 100%);
            color: white;
            padding: 16px 32px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(52, 131, 250, 0.3);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(52, 131, 250, 0.4);
        }
        
        .footer {
            background-color: #f8f9fa;
            padding: 30px 40px;
            text-align: center;
            border-top: 1px solid #e6e6e6;
        }
        
        .footer p {
            font-size: 14px;
            color: #666666;
            line-height: 1.6;
        }
        
        .footer-logo {
            margin-top: 20px;
            font-size: 12px;
            color: #999999;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 0 10px;
            }
            
            .header, .content, .footer {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .gift-card {
                padding: 20px;
            }
            
            .info-row {
                flex-direction: column;
                gap: 12px;
            }
            
            .info-icon {
                align-self: flex-start;
            }
            
            .thank-you-section {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
         Header 
        <div class="header">
            <div class="header-icon">🎁</div>
            <h1>Presente Reservado!</h1>
            <p>Sua reserva foi confirmada com sucesso</p>
        </div>
        
         Status Banner 
        <div class="status-banner">
            ✓ Confirmado
        </div>
        
         Content 
        <div class="content">
             Gift Information Card 
            <div class="gift-card">
                <div class="gift-title">
                    <div class="gift-title-icon">🎀</div>
                    <h2>${updatedGift.name}</h2>
                </div>
                
                <div class="info-grid">
                    <div class="info-row">
                        <div class="info-icon">🏪</div>
                        <div class="info-details">
                            <div class="info-label">Loja</div>
                            <div class="info-value">Nossa Lar</div>
                        </div>
                    </div>
                    
                    <div class="info-row">
                        <div class="info-icon">📍</div>
                        <div class="info-details">
                            <div class="info-label">Endereço</div>
                            <div class="info-value">Araguaína-TO</div>
                        </div>
                    </div>
                    
                    <div class="info-row">
                        <div class="info-icon">👤</div>
                        <div class="info-details">
                            <div class="info-label">Vendedor Responsável</div>
                            <div class="info-value">Teste</div>
                        </div>
                    </div>
                </div>
            </div>
            
             Thank You Section 
            <div class="thank-you-section">
                <h3>Obrigado por contribuir com o nosso casamento!</h3>
                <p>Sua generosidade torna este momento ainda mais especial.</p>
            </div>
            
             Call to Action 
            <div class="cta-section">
                <a href="https://www.nossalar.com.br" class="cta-button">Visitar Loja</a>
            </div>
        </div>
        
         Footer 
        <div class="footer">
            <p>Este e-mail foi enviado para confirmar a reserva do seu presente.</p>
            <p>Em caso de dúvidas, entre em contato conosco.</p>
            <div class="footer-logo">Nossa Lar</div>
        </div>
    </div>
</body>
</html>
`,
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