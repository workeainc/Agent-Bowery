import { Logger } from '@nestjs/common';

export function redactToken(token?: string | null): string {
  if (!token) return '';
  if (token.length <= 8) return '***';
  return `${token.slice(0, 4)}***${token.slice(-4)}`;
}

export function logJson(logger: Logger, level: 'log' | 'warn' | 'error' | 'debug', event: string, data: Record<string, any> = {}) {
  const payload = { event, ...data };
  const msg = JSON.stringify(payload);
  switch (level) {
    case 'log':
      logger.log(msg);
      break;
    case 'warn':
      logger.warn(msg);
      break;
    case 'error':
      logger.error(msg);
      break;
    case 'debug':
      logger.debug(msg);
      break;
  }
}


