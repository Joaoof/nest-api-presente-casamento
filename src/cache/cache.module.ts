import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
    imports: [
        RedisModule.forRoot({
            type: 'single',
            url: process.env.REDIS_URL,
            options: {
                retryStrategy: (times) => {
                    const delay = Math.min(times * 1000, 20000); // Aumenta o delay entre tentativas
                    if (times > 5) {
                        console.error('Demasiadas tentativas falhas ao conectar ao Redis');
                        return undefined; // Interrompe após 5 tentativas
                    }
                    return delay;
                },
                connectTimeout: 10000, // 10 segundos
                maxRetriesPerRequest: null, // Desativa retry automático
            },
        }),
    ],
    providers: [CacheService],
    exports: [CacheService], // Exporta o serviço pra outros módulos usarem

})
export class CacheModuleRedis { }