// src/gifts/gifts.module.ts
import { Module } from '@nestjs/common';
import { GiftsController } from './gifts.controller';
import { GiftsService } from './gifts.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from 'src/cache/cache.module';
import { CacheService } from 'src/cache/cache.service';

@Module({
    imports: [PrismaModule, AuthModule, CacheModule],
    controllers: [GiftsController],
    providers: [GiftsService, CacheService],
    exports: [GiftsService],
})
export class GiftsModule { }