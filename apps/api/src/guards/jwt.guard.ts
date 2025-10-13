import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import jwt from 'jsonwebtoken';

export type Role = 'admin' | 'editor' | 'viewer';

@Injectable()
export class JwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.headers['authorization'] as string | undefined;
    if (!auth || !auth.startsWith('Bearer ')) return false;
    const token = auth.slice('Bearer '.length);
    const secret = process.env.JWT_SECRET || '';
    try {
      const payload = jwt.verify(token, secret) as { sub: string; roles?: Role[] };
      (req as any).user = payload;
      return true;
    } catch {
      return false;
    }
  }
}

export function hasRole(required: Role) {
  return (context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest<Request>();
    const roles = ((req as any).user?.roles as Role[] | undefined) || [];
    return roles.includes(required);
  };
}


