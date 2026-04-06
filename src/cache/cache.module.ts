import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: configService.get<string>('REDIS_URL'),
        options: {
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 1000, 20000);
            if (times > 5) {
              console.error('Demasiadas tentativas falhas ao conectar ao Redis');
              return null; // ❗ importante: use null, não undefined
            }
            return delay;
          },
          connectTimeout: 10000,
          maxRetriesPerRequest: null,
        },
      }),
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModuleRedis {}