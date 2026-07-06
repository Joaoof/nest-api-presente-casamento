// src/cache/cache.service.ts
import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class CacheService {
    private readonly logger = new Logger(CacheService.name);

    constructor(@InjectRedis() private readonly redis: Redis) { }

    async get<T>(key: string): Promise<T | null> {
        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            // Cache indisponível não deve derrubar a request: degrada para null
            // e deixa o chamador cair no fallback do banco.
            this.logger.warn(`Falha ao ler cache "${key}": ${error.message}`);
            return null;
        }
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        try {
            if (ttl) {
                await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
            } else {
                await this.redis.set(key, JSON.stringify(value));
            }
        } catch (error) {
            this.logger.warn(`Falha ao gravar cache "${key}": ${error.message}`);
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch (error) {
            this.logger.warn(`Falha ao remover cache "${key}": ${error.message}`);
        }
    }
}
