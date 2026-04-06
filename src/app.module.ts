// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { GiftsModule } from './gifts/gifts.module';
import { PrismaModule } from '.././prisma/prisma.module';
import { CacheModuleRedis } from './cache/cache.module';
import { MailService } from './mail/mail.service';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    GiftsModule,
    CacheModuleRedis, // Importa o módulo de cache
    MailModule
  ],// Exporta o serviço de email para outros módulos
})
export class AppModule { }