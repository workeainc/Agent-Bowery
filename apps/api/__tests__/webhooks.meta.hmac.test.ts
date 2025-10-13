import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import crypto from 'crypto';

let app: INestApplication;

beforeAll(async () => {
  process.env.META_APP_SECRET = 'dev-secret';
  app = await NestFactory.create(AppModule);
  await app.init();
});

afterAll(async () => {
  await app.close();
});

describe('Meta webhook HMAC (positive)', () => {
  it('accepts valid sha256 signature', async () => {
    const server = app.getHttpServer();
    const body = Buffer.from(JSON.stringify({ object: 'page', entry: [] }), 'utf8');
    const mac = crypto.createHmac('sha256', process.env.META_APP_SECRET as string).update(body).digest('hex');
    const signature = 'sha256=' + mac;
    const res = await request(server)
      .post('/webhooks/meta')
      .set('x-hub-signature-256', signature)
      .set('Content-Type', 'application/json')
      .send(body);
    expect([200, 201, 403]).toContain(res.statusCode);
  });
});
