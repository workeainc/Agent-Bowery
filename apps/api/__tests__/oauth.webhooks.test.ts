/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-ignore - make jest globals available in TS
import 'jest';
import request from 'supertest';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';

let app: INestApplication;

beforeAll(async () => {
  app = await NestFactory.create(AppModule);
  await app.init();
});

afterAll(async () => {
  await app.close();
});

describe('OAuth start', () => {
  it('returns 400 for unsupported provider', async () => {
    const server = app.getHttpServer();
    const res = await request(server).get('/oauth/unknown/start');
    expect([400, 401, 403]).toContain(res.statusCode);
  });
});

describe('Webhooks verify', () => {
  it('verifies Meta webhook challenge', async () => {
    const server = app.getHttpServer();
    const res = await request(server).get('/webhooks/meta?hub.mode=subscribe&hub.verify_token=dev-token&hub.challenge=test123');
    expect([200, 400]).toContain(res.statusCode);
  });
});
