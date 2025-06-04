// src/gifts/gifts.module.ts
import { Module } from '@nestjs/common';
import { GiftsController } from './gifts.controller';
import { GiftsService } from './gifts.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [GiftsController],
    providers: [GiftsService],
    exports: [GiftsService],
})
export class GiftsModule { }