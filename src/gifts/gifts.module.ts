// src/gifts/gifts.module.ts
import { Module } from '@nestjs/common';
import { GiftsController } from './gifts.controller';
import { GiftsService } from './gifts.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CacheModuleRedis } from 'src/cache/cache.module';
import { CacheService } from 'src/cache/cache.service';
import { MailModule } from 'src/mail/mail.module';
import { CacheModule } from '@nestjs/cache-manager';


@Module({
    imports: [PrismaModule, AuthModule, CacheModuleRedis, MailModule, CacheModule.register({
        ttl: 30,
        max: 100, // Limite de 100 itens no cache
    })],
    controllers: [GiftsController],
    providers: [GiftsService, CacheService],
    exports: [GiftsService],
})
export class GiftsModule { }