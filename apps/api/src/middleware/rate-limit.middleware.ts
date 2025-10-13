import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private redis: Redis;
  private readonly windowSec = Number(process.env.RL_WINDOW_SEC || 60);
  private readonly maxReq = Number(process.env.RL_MAX_RPM || 60);
  private readonly burst = Number(process.env.RL_BURST || 20); // extra tokens allowed per window
  private readonly routeOverrides: Array<{ route: string; windowSec: number; maxReq: number; burst?: number }>;

  constructor() {
    const url = process.env.REDIS_URL || 'redis://redis:6379';
    this.redis = new Redis(url);
    try {
      this.routeOverrides = JSON.parse(process.env.RL_ROUTE_OVERRIDES || '[]');
    } catch {
      this.routeOverrides = [];
    }
  }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const { windowSec, maxReq, burst } = this.resolveLimits(req);
      const key = this.buildKey(req);
      const now = Math.floor(Date.now() / 1000);
      const windowKey = `ratelimit:${req.method}:${req.baseUrl || ''}${req.path}:${key}:${Math.floor(now / windowSec)}`;
      const count = await this.redis.incr(windowKey);
      if (count === 1) {
        await this.redis.expire(windowKey, windowSec);
      }
      const allowed = maxReq + (burst ?? 0);
      if (count > allowed) {
        res.setHeader('Retry-After', String(windowSec));
        return res.status(429).json({ error: 'rate_limited' });
      }
      return next();
    } catch (e) {
      // Fail open on limiter errors
      return next();
    }
  }

  private buildKey(req: Request): string {
    const apiKey = req.header('x-api-key');
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    return apiKey ? `key:${apiKey}` : `ip:${ip}`;
  }

  private resolveLimits(req: Request) {
    const match = this.routeOverrides.find(o => req.originalUrl.startsWith(o.route));
    if (match) {
      return { windowSec: match.windowSec, maxReq: match.maxReq, burst: match.burst ?? this.burst };
    }
    return { windowSec: this.windowSec, maxReq: this.maxReq, burst: this.burst };
    }
}
