import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

@Injectable()
export class AuthRateLimitMiddleware implements NestMiddleware {
  private redis: Redis;
  private readonly windowSec = 15 * 60; // 15 minutes
  private readonly maxAttempts = 5; // 5 attempts per window
  private readonly lockoutSec = 30 * 60; // 30 minutes lockout

  constructor() {
    const url = process.env.REDIS_URL || 'redis://redis:6379';
    this.redis = new Redis(url);
  }

  async use(req: Request, res: Response, next: NextFunction) {
    // Only apply to login and register endpoints
    if (!req.path.includes('/auth/login') && !req.path.includes('/auth/register')) {
      return next();
    }

    try {
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      const email = req.body?.email || 'unknown';
      
      // Create keys for IP and email based rate limiting
      const ipKey = `auth_rate_limit:ip:${clientIp}`;
      const emailKey = `auth_rate_limit:email:${email}`;
      const lockoutKey = `auth_lockout:${clientIp}`;
      
      // Check if IP is currently locked out
      const isLockedOut = await this.redis.get(lockoutKey);
      if (isLockedOut) {
        const remainingTime = await this.redis.ttl(lockoutKey);
        res.setHeader('Retry-After', String(remainingTime));
        return res.status(429).json({
          success: false,
          message: 'Too many failed attempts. Please try again later.',
          retryAfter: remainingTime,
        });
      }

      const now = Math.floor(Date.now() / 1000);
      const windowKey = `${ipKey}:${Math.floor(now / this.windowSec)}`;
      
      // Increment attempt counter
      const attempts = await this.redis.incr(windowKey);
      if (attempts === 1) {
        await this.redis.expire(windowKey, this.windowSec);
      }

      // Check if limit exceeded
      if (attempts > this.maxAttempts) {
        // Lock out the IP
        await this.redis.setex(lockoutKey, this.lockoutSec, '1');
        
        res.setHeader('Retry-After', String(this.lockoutSec));
        return res.status(429).json({
          success: false,
          message: 'Too many failed attempts. IP temporarily locked.',
          retryAfter: this.lockoutSec,
        });
      }

      // Add rate limit info to response headers
      res.setHeader('X-RateLimit-Limit', String(this.maxAttempts));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, this.maxAttempts - attempts)));
      res.setHeader('X-RateLimit-Reset', String((Math.floor(now / this.windowSec) + 1) * this.windowSec));

      // Add rate limit context to request
      (req as any).rateLimitContext = {
        attempts,
        remaining: Math.max(0, this.maxAttempts - attempts),
        resetTime: (Math.floor(now / this.windowSec) + 1) * this.windowSec,
      };

      next();
    } catch (error) {
      // Fail open on rate limiter errors to avoid blocking legitimate users
      console.error('Auth rate limiter error:', error);
      next();
    }
  }
}
