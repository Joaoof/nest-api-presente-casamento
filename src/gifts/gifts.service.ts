// gifts/gifts.service.ts
import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGiftDto } from './dto/create-gift.dto';
import { UpdateGiftDto } from './dto/update-gift.dto';

@Injectable()
export class GiftsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createGiftDto: CreateGiftDto, adminId: string) {
        return this.prisma.gift.create({
            data: {
                ...createGiftDto,
                admin: {
                    connect: {
                        id: adminId
                    }
                }
            },
        });
    }

    async findAll() {
        return this.prisma.gift.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findOne(id: string) {
        const gift = await this.prisma.gift.findUnique({ where: { id } });
        if (!gift) {
            throw new NotFoundException(`Gift with ID ${id} not found`);
        }
        return gift;
    }

    async update(id: string, updateGiftDto: UpdateGiftDto) {
        try {
            return await this.prisma.gift.update({
                where: { id },
                data: updateGiftDto,
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException(`Gift with ID ${id} not found`);
                }
            }
            throw error;
        }
    }

    async remove(id: string) {
        try {
            return await this.prisma.gift.delete({ where: { id } });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException(`Gift with ID ${id} not found`);
                }
            }
            throw error;
        }
    }

    async reserveGift(id: string, reservedBy: string) {
        const gift = await this.findOne(id);

        if (gift.status === 'reserved') {
            throw new ConflictException('Presente já reservado');
        }

        return this.prisma.gift.update({
            where: { id },
            data: {
                status: 'reserved',
                reservedBy,
            },
        });
    }
}