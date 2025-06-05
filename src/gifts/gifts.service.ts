// src/gifts/gifts.service.ts

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

@Injectable()
export class GiftsService {
    private readonly cacheKey = 'gifts:all';

    constructor(
        private readonly prisma: PrismaService,
        private readonly cacheService: CacheService,
    ) { }

    // 🔁 Busca do banco de dados
    async findAllFromDb(): Promise<Gift[]> {
        const gifts = await this.prisma.gift.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });

        console.log(gifts);


        return gifts.map((gift) => ({
            ...gift,
            imageUrl: gift.imageUrl ?? null,
            reservedBy: gift.reservedBy ?? null,
        }));
    }

    // 🚀 Retorna os presentes (do cache ou do banco)
    async findAll(): Promise<Gift[]> {
        const cached = await this.cacheService.get<Gift[]>(this.cacheKey);
        if (cached) return cached;

        console.log('Cache não encontrado, buscando do banco de dados...', cached);


        const gifts = await this.findAllFromDb();
        await this.cacheService.set(this.cacheKey, gifts, 60); // TTL de 60 segundos
        return gifts;
    }


    // 💡 Invalida o cache quando necessário
    private async invalidateCache() {
        await this.cacheService.del(this.cacheKey);
    }

    // 🔍 Busca presente por ID
    async findOne(id: string): Promise<Gift> {
        const gift = await this.prisma.gift.findUnique({ where: { id } });
        if (!gift) {
            throw new NotFoundException(`Presente com ID ${id} não encontrado`);
        }
        return gift;
    }

    // ✅ Cria um novo presente
    async create(createGiftDto: CreateGiftDto, adminId: string) {
        try {
            const gift = await this.prisma.gift.create({
                data: {
                    ...createGiftDto,
                    admin: {
                        connect: { id: adminId },
                    },
                },
            });

            await this.invalidateCache(); // Limpa o cache após criar
            return gift;
        } catch (error) {
            console.error('Erro ao criar presente:', error);
            throw new Error('Falha ao adicionar presente');
        }
    }

    // ✏️ Atualiza um presente existente
    async update(id: string, updateGiftDto: UpdateGiftDto) {
        try {
            const updated = await this.prisma.gift.update({
                where: { id },
                data: updateGiftDto,
            });

            await this.invalidateCache(); // Limpa o cache após atualizar
            return updated;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException(`Presente com ID ${id} não encontrado`);
                }
            }
            console.error('Erro no update:', error);
            throw new Error('Erro ao atualizar o presente');
        }
    }

    // 🗑️ Remove um presente
    async remove(id: string) {
        try {
            const removed = await this.prisma.gift.delete({ where: { id } });
            await this.invalidateCache(); // Limpa o cache após excluir
            return removed;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException(`Presente com ID ${id} não encontrado`);
                }
            }
            console.error('Erro ao remover presente:', error);
            throw new Error('Falha ao excluir presente');
        }
    }

    // 🛒 Reserva um presente
    async reserveGift(id: string, reservedBy: string) {
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

        await this.invalidateCache(); // Limpa o cache após reserva
        return updatedGift;
    }
}