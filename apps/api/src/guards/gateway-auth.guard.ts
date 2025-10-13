import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import jwt from 'jsonwebtoken';

export type Role = 'admin' | 'editor' | 'viewer';

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    // 1) API Key path
    const apiKeys = (process.env.API_KEYS || '').split(',').map(s => s.trim()).filter(Boolean);
    const apiKey = req.header('x-api-key');
    if (apiKeys.length > 0 && apiKey && apiKeys.includes(apiKey)) {
      // API key bypasses role checks (machine-to-machine)
      return true;
    }

    // 2) JWT path
    const auth = req.headers['authorization'] as string | undefined;
    if (!auth || !auth.startsWith('Bearer ')) return false;
    const token = auth.slice('Bearer '.length);
    const secret = process.env.JWT_SECRET || '';
    try {
      const payload = jwt.verify(token, secret) as { sub: string; roles?: Role[] };
      (req as any).user = payload;
      return true; // For now, any valid JWT is allowed
    } catch {
      return false;
    }
  }
}


