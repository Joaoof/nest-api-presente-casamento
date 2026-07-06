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
          // Nunca desiste de reconectar: o proxy da Railway derruba conexões
          // ociosas, então retornar null aqui deixaria o cliente fechado para
          // sempre ("Connection is closed" em toda request).
          retryStrategy: (times: number) => {
            return Math.min(times * 200, 5000);
          },
          // Reconecta também quando o servidor responde erros de conexão.
          reconnectOnError: () => true,
          // Mantém a conexão viva contra o idle-timeout do proxy.
          keepAlive: 10000,
          connectTimeout: 10000,
          maxRetriesPerRequest: null,
          enableReadyCheck: true,
        },
      }),
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModuleRedis {}