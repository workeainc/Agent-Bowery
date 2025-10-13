import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  private redis: Redis;
  private readonly ttlSec = 60 * 10; // 10 minutes
  private readonly replayTtlSec = 60 * 10; // cache response bodies for replays

  constructor() {
    const url = process.env.REDIS_URL || 'redis://redis:6379';
    this.redis = new Redis(url);
  }

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.method !== 'POST') return next();
    const key = req.header('Idempotency-Key');
    if (!key) return next();

    const scope = `${req.method}:${req.originalUrl}`;
    const idemKey = `idem:${scope}:${key}`;
    const existed = await this.redis.set(idemKey, '1', 'EX', this.ttlSec, 'NX');
    if (existed === null) {
      // Attempt replay from cache
      const cacheKey = `idem-resp:${scope}:${key}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        res.setHeader('X-Idempotent-Replay', 'true');
        return res.status(parsed.status || 200).json(parsed.body);
      }
      return res.status(409).json({ error: 'idempotent_replay' });
    }
    // Wrap res.json to capture success payloads
    const originalJson = res.json.bind(res);
    (res as any).json = (body: any) => {
      const status = res.statusCode;
      if (status >= 200 && status < 300) {
        const cacheKey = `idem-resp:${scope}:${key}`;
        void this.redis.set(cacheKey, JSON.stringify({ status, body }), 'EX', this.replayTtlSec);
      }
      return originalJson(body);
    };
    return next();
  }
}
