import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CSRFMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for GET requests and health checks
    if (req.method === 'GET' || req.path === '/health') {
      return next();
    }

    // Skip CSRF for API key authentication
    const apiKeys = (process.env.API_KEYS || '').split(',').map(s => s.trim()).filter(Boolean);
    const apiKey = req.header('x-api-key');
    if (apiKeys.length > 0 && apiKey && apiKeys.includes(apiKey)) {
      return next();
    }

    // Get CSRF token from header
    const csrfToken = req.header('x-csrf-token');
    const sessionId = req.header('x-session-id');

    if (!csrfToken || !sessionId) {
      return res.status(403).json({
        success: false,
        message: 'CSRF token or session ID missing',
      });
    }

    // In a real implementation, you would validate the CSRF token
    // against a stored token for the session
    // For now, we'll do a basic validation
    if (csrfToken.length < 32) {
      return res.status(403).json({
        success: false,
        message: 'Invalid CSRF token',
      });
    }

    // Add CSRF token to request for downstream use
    (req as any).csrfToken = csrfToken;
    (req as any).sessionId = sessionId;

    next();
  }
}


