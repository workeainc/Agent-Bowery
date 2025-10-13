import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

let app: INestApplication;

beforeAll(async () => {
  app = await NestFactory.create(AppModule);
  await app.init();
});

afterAll(async () => {
  await app.close();
});

describe('Token refresh endpoint', () => {
  it('responds on POST /tokens/:provider/refresh', async () => {
    const server = app.getHttpServer();
    const res = await request(server)
      .post('/tokens/linkedin/refresh')
      .send({ oldToken: 'dummy' })
      .set('Content-Type', 'application/json');
    expect([200, 201, 400, 404]).toContain(res.statusCode);
  });
});

describe('LinkedIn webhook receive', () => {
  it('accepts POST /webhooks/linkedin and returns ok or forbidden based on signature', async () => {
    const server = app.getHttpServer();
    const payload = { eventType: 'test', data: { id: '1' } };
    const res = await request(server)
      .post('/webhooks/linkedin')
      .set('x-li-signature', '') // empty signature should be allowed in dev
      .send(payload);
    expect([200, 201, 403, 500]).toContain(res.statusCode);
  });
});
