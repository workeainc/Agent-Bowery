import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const configured = (process.env.API_KEYS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (configured.length === 0) return true; // open if not configured
    const key = req.header('x-api-key');
    return Boolean(key && configured.includes(key));
  }
}
