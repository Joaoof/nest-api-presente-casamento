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

    // Busca todos os presentes (do cache ou do banco)
    async findAll(): Promise<Gift[]> {
        const cached = await this.cacheService.get<Gift[]>(this.cacheKey);
        if (cached) return cached;

        console.log('Cache não encontrado. Buscando do banco...');

        return this.findAllFromDb(); // Retorna imediatamente do DB
    }

    // Busca do banco de dados em background
    async findAllFromDb(): Promise<Gift[]> {
        try {
            const gifts = await this.prisma.gift.findMany({
                orderBy: { createdAt: 'desc' },
            });

            // Atualiza o cache em segundo plano
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
            await this.cacheService.set(this.cacheKey, freshData, 3600); // TTL: 1 hora
        } catch (error) {
            console.error('Erro ao atualizar cache em background:', error);
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
                    html: `
                <!DOCTYPE html>
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .confirmation-card {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 100%;
            overflow: hidden;
            position: relative;
        }

        .header {
            background: linear-gradient(135deg, #ff6b6b, #ffa726);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
        }

        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="1" fill="rgba(255,255,255,0.1)"/></svg>');
        }

        .header h2 {
            font-size: 2.2em;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
        }

        .gift-icon {
            font-size: 3em;
            margin-bottom: 15px;
            position: relative;
            z-index: 1;
        }

        .content {
            padding: 40px 30px;
        }

        .gift-info {
            background: #f8f9ff;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 25px;
            border-left: 5px solid #667eea;
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
            background: linear-gradient(135deg, #667eea, #764ba2);
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
            background: linear-gradient(135deg, #48bb78, #38a169);
            color: white;
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            font-size: 1.1em;
            line-height: 1.6;
            position: relative;
            overflow: hidden;
        }

        .thank-you::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255,255,255,0.05) 10px,
                rgba(255,255,255,0.05) 20px
            );
            animation: shine 3s linear infinite;
        }

        @keyframes shine {
            0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }

        .celebration-emoji {
            font-size: 1.3em;
            margin-left: 5px;
            animation: bounce 2s infinite;
        }

        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
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
                Sua generosidade torna este momento ainda mais especial
                <span class="celebration-emoji">💕</span>
            </div>
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