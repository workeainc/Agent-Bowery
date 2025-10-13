import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TokenService } from '../token.service';
import { logJson } from '../utils/logger';
import { TokenAuditService } from '../services/token-audit.service';

@Injectable()
export class TokenRefreshInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TokenRefreshInterceptor.name);

  constructor(private readonly tokenService: TokenService, private readonly tokenAudit: TokenAuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Check if it's a 401 error from a platform API call
        if (error.status === 401 && this.isPlatformApiCall(context)) {
          const provider = this.extractProvider(context);
          if (provider) {
            logJson(this.logger, 'log', 'platform_401_detected', { provider });
            const req = context.switchToHttp().getRequest();
            const correlationId = (req as any)?.correlationId;
            this.tokenAudit.record('refresh_attempt', { orgId: (req as any)?.user?.orgId || 'unknown', provider, socialAccountId: 'unknown', success: false, reason: '401_detected_pre_refresh', correlationId });
            return this.handleTokenRefresh(provider, context, next);
          }
        }
        return throwError(() => error);
      })
    );
  }

  private isPlatformApiCall(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const url = request.url;
    return url.includes('/posts/') || url.includes('/oauth/');
  }

  private extractProvider(context: ExecutionContext): string | null {
    const request = context.switchToHttp().getRequest();
    const url = request.url;
    
    if (url.includes('/posts/meta') || url.includes('/oauth/meta')) return 'meta';
    if (url.includes('/posts/linkedin') || url.includes('/oauth/linkedin')) return 'linkedin';
    if (url.includes('/posts/google') || url.includes('/oauth/google')) return 'google';
    if (url.includes('/posts/youtube') || url.includes('/oauth/youtube')) return 'youtube';
    
    return null;
  }

  private handleTokenRefresh(provider: string, context: ExecutionContext, next: CallHandler): Observable<any> {
    return new Observable(observer => {
      const req = context.switchToHttp().getRequest();
      const correlationId = (req as any)?.correlationId;
      this.tokenService.handleTokenRefresh(provider as any, 'old_token', correlationId)
        .then(newToken => {
          if (newToken) {
            logJson(this.logger, 'log', 'token_refreshed_retrying', { provider, correlationId });
            next.handle().subscribe({
              next: (value) => observer.next(value),
              error: (err) => observer.error(err),
              complete: () => observer.complete(),
            });
          } else {
            logJson(this.logger, 'error', 'token_refresh_failed', { provider });
            observer.error(new Error(`Token refresh failed for ${provider}`));
          }
        })
        .catch(error => {
          logJson(this.logger, 'error', 'token_refresh_error', { provider, error: (error as Error).message });
          observer.error(error);
        });
    });
  }
}
