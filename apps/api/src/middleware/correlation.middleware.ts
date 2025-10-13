import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const header = (req.headers['x-correlation-id'] as string) || '';
    const id = header || randomUUID();
    (req as any).correlationId = id;
    res.setHeader('X-Correlation-Id', id);
    next();
  }
}


