import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class TokenCacheService {
  private readonly redis: Redis;

  constructor() {
    const url = process.env.REDIS_URL || 'redis://redis:6379';
    this.redis = new Redis(url);
  }

  private buildKey(orgId: string, platform: string, socialAccountId?: string): string {
    return `token_cache:${orgId}:${platform}${socialAccountId ? `:${socialAccountId}` : ''}`;
  }

  async getCachedToken(orgId: string, platform: string, socialAccountId?: string): Promise<string | null> {
    const key = this.buildKey(orgId, platform, socialAccountId);
    return this.redis.get(key);
  }

  async setCachedToken(orgId: string, platform: string, tokenEnc: string, ttlSeconds: number = 300, socialAccountId?: string): Promise<void> {
    const key = this.buildKey(orgId, platform, socialAccountId);
    await this.redis.setex(key, ttlSeconds, tokenEnc);
  }

  async evictTokenCache(orgId: string, platform: string, socialAccountId?: string): Promise<number> {
    if (socialAccountId) {
      const key = this.buildKey(orgId, platform, socialAccountId);
      return this.redis.del(key);
    }
    // Wildcard evict: scan matching keys
    const pattern = `token_cache:${orgId}:${platform}:*`;
    let cursor = '0';
    let total = 0;
    do {
      const [next, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      if (keys.length > 0) total += await this.redis.del(...keys);
    } while (cursor !== '0');
    // Also evict the platform-level key without socialAccountId if used
    total += await this.redis.del(`token_cache:${orgId}:${platform}`);
    return total;
  }
}


