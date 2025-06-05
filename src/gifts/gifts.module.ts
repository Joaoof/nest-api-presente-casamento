// src/gifts/gifts.module.ts
import { Module } from '@nestjs/common';
import { GiftsController } from './gifts.controller';
import { GiftsService } from './gifts.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from 'src/cache/cache.module';
import { CacheService } from 'src/cache/cache.service';
import { MailModule } from 'src/mail/mail.module';

@Module({
    imports: [PrismaModule, AuthModule, CacheModule, MailModule],
    controllers: [GiftsController],
    providers: [GiftsService, CacheService],
    exports: [GiftsService],
})
export class GiftsModule { }