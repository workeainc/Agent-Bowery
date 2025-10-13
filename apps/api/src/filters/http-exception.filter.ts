import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { redactToken } from '../utils/logger';
import type { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = (request as any).correlationId as string | undefined;

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = isHttp ? (exception as HttpException).message : 'Internal server error';

    const body: Record<string, unknown> = {
      event: 'http_exception',
      error: isHttp ? exception.constructor.name : 'InternalServerError',
      statusCode: status,
      message,
      correlationId,
      path: request.originalUrl,
      method: request.method,
    };

    // Redact any token-like fields if present
    if ((request.headers as any)['authorization']) {
      (request.headers as any)['authorization'] = `Bearer ${redactToken(String((request.headers as any)['authorization']).replace(/^Bearer\s+/i, ''))}`;
    }
    response.status(status).json(body);
  }
}


