// src/cache/cache.service.ts
import { Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class CacheService {
    constructor(@InjectRedis() private readonly redis: RedisClientType) { }

    async get<T>(key: string): Promise<T | null> {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        await this.redis.set(key, JSON.stringify(value));
        if (ttl) {
            await this.redis.expire(key, ttl);
        }
    }

    async del(key: string): Promise<void> {
        await this.redis.del(key);
    }
}