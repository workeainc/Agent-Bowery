import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { GlobalHttpExceptionFilter } from './filters/http-exception.filter';
import { AppModule } from './app.module';
import { json, raw, urlencoded } from 'body-parser';
import { loadEnv } from '../../../packages/config/env';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule);
  
  // Security headers
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    next();
  });
  
  app.enableCors();
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  // Signed cookies for OAuth state
  if (!env.OAUTH_COOKIE_SECRET) {
    // eslint-disable-next-line no-console
    console.error('Missing required env: OAUTH_COOKIE_SECRET');
    process.exit(1);
  }
  app.use(cookieParser(env.OAUTH_COOKIE_SECRET));

  // Validate critical envs
  const requiredInProd = [
    'OAUTH_REDIRECT_ALLOWLIST',
    'REDIS_URL',
  ];
  for (const key of requiredInProd) {
    if (!(env as any)[key]) {
      // eslint-disable-next-line no-console
      console.error(`Missing required env: ${key}`);
      process.exit(1);
    }
  }

  // JSON parsing for general routes
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ extended: true }));

  // Raw body for all webhook signature verification
  app.use('/webhooks', raw({ type: '*/*' }));
  app.use((req: any, _res: any, next: any) => {
    if (req.originalUrl?.startsWith('/webhooks') && req.body && Buffer.isBuffer(req.body)) {
      req.rawBody = req.body;
      try {
        const asString = req.body.toString('utf8');
        req.body = asString ? JSON.parse(asString) : {};
      } catch {}
    }
    next();
  });

  const port = env.PORT ? Number(env.PORT) : 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on ${port}`);
}

bootstrap();
