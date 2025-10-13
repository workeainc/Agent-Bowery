import { Controller, Get, Query, Res, Post, Body, Headers, HttpException, HttpStatus, Req } from '@nestjs/common';
import type { Response } from 'express';
import crypto, { randomUUID } from 'crypto';
import { DbService } from './db.service';
import { QueueService } from './queue.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly db: DbService, private readonly queue: QueueService) {}
  @Get('meta')
  verifyMeta(@Query('hub.mode') mode: string, @Query('hub.verify_token') token: string, @Query('hub.challenge') challenge: string, @Res() res: Response) {
    const expected = process.env.META_VERIFY_TOKEN || 'dev-token';
    if (mode === 'subscribe' && token === expected) {
      return res.status(200).send(challenge || '');
    }
    return res.status(403).send('Forbidden');
  }

  @Post('meta')
  async receiveMeta(@Req() req: any, @Body() body: any, @Headers('x-hub-signature-256') signature?: string) {
    const appSecret = process.env.META_APP_SECRET || '';
    if (appSecret) {
      const rawPayload: Buffer | undefined = (req.rawBody as Buffer | undefined)
        || (Buffer.isBuffer(body) ? (body as unknown as Buffer) : Buffer.from(JSON.stringify(body || {})));
      if (!this.verifyHmacSha256(rawPayload, signature, appSecret, 'sha256=')) {
        throw new HttpException('Invalid signature', HttpStatus.FORBIDDEN);
      }
    }
    // Idempotency key
    const rawForKey: Buffer | undefined = (req.rawBody as Buffer | undefined)
      || (Buffer.isBuffer(body) ? (body as unknown as Buffer) : Buffer.from(JSON.stringify(body || {})));
    const idemKey = this.computeEventKey(rawForKey, signature);
    const id = randomUUID();
    await this.db.storeWebhookEvent(
      id,
      'unknown',
      'meta',
      body?.object || 'event',
      body,
      req.headers,
      signature || null,
      idemKey,
    );
    await this.db.markWebhookEventProcessed(idemKey);
    await this.queue.enqueueWebhook({ idemKey, provider: 'meta' });
    return { ok: true, idemKey };
  }

  @Get('youtube')
  verifyYouTube(@Query('hub.mode') mode: string, @Query('hub.challenge') challenge: string, @Res() res: Response) {
    if (mode && challenge) {
      return res.status(200).send(challenge);
    }
    return res.status(400).send('Bad Request');
  }

  @Post('youtube')
  receiveYouTube(@Body() _body: any, @Headers() _headers: Record<string, string>) {
    return { ok: true };
  }

  @Post('linkedin')
  async receiveLinkedIn(@Req() req: any, @Body() body: any, @Headers('x-li-signature') signature?: string) {
    const secret = process.env.LINKEDIN_WEBHOOK_SECRET || '';
    if (secret) {
      const rawPayload: Buffer | undefined = (req.rawBody as Buffer | undefined)
        || (Buffer.isBuffer(body) ? (body as unknown as Buffer) : Buffer.from(JSON.stringify(body || {})));
      if (!this.verifyLinkedIn(rawPayload, signature, secret)) {
        throw new HttpException('Invalid signature', HttpStatus.FORBIDDEN);
      }
    }
    const rawForKey: Buffer | undefined = (req.rawBody as Buffer | undefined)
      || (Buffer.isBuffer(body) ? (body as unknown as Buffer) : Buffer.from(JSON.stringify(body || {})));
    const idemKey = this.computeEventKey(rawForKey, signature);
    const id = randomUUID();
    await this.db.storeWebhookEvent(
      id,
      'unknown',
      'linkedin',
      body?.eventType || 'event',
      body,
      req.headers,
      signature || null,
      idemKey,
    );
    await this.db.markWebhookEventProcessed(idemKey);
    await this.queue.enqueueWebhook({ idemKey, provider: 'linkedin' });
    return { ok: true, idemKey };
  }

  @Post('google')
  async receiveGoogle(@Req() req: any, @Body() body: any, @Headers('x-goog-signature') signature?: string) {
    const secret = process.env.GOOGLE_WEBHOOK_SECRET || '';
    if (secret) {
      const rawPayload: Buffer | undefined = (req.rawBody as Buffer | undefined)
        || (Buffer.isBuffer(body) ? (body as unknown as Buffer) : Buffer.from(JSON.stringify(body || {})));
      if (!this.verifyGoogle(rawPayload, signature, secret)) {
        throw new HttpException('Invalid signature', HttpStatus.FORBIDDEN);
      }
    }
    const rawForKey: Buffer | undefined = (req.rawBody as Buffer | undefined)
      || (Buffer.isBuffer(body) ? (body as unknown as Buffer) : Buffer.from(JSON.stringify(body || {})));
    const idemKey = this.computeEventKey(rawForKey, signature);
    const id = randomUUID();
    await this.db.storeWebhookEvent(
      id,
      'unknown',
      'google',
      body?.eventType || 'event',
      body,
      req.headers,
      signature || null,
      idemKey,
    );
    await this.db.markWebhookEventProcessed(idemKey);
    await this.queue.enqueueWebhook({ idemKey, provider: 'google' });
    return { ok: true, idemKey };
  }

  private verifyHmacSha256(raw: Buffer | undefined, signature: string | undefined, secret: string, prefix = ''): boolean {
    if (!raw || !signature || !secret) return false;
    const mac = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    const expected = prefix + mac;
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  private verifyLinkedIn(raw: Buffer | undefined, signature: string | undefined, secret: string): boolean {
    if (!raw || !signature || !secret) return false;
    const mac = crypto.createHmac('sha256', secret).update(raw).digest();
    const expectedB64 = mac.toString('base64');
    return signature === expectedB64;
  }

  private verifyGoogle(raw: Buffer | undefined, signature: string | undefined, secret: string): boolean {
    if (!raw || !signature || !secret) return false;
    const mac = crypto.createHmac('sha256', secret).update(raw).digest();
    const expectedB64 = mac.toString('base64');
    return signature === expectedB64;
  }

  private computeEventKey(raw: Buffer | undefined, signature?: string) {
    const h = crypto.createHash('sha256');
    if (raw) h.update(raw);
    if (signature) h.update(signature);
    return h.digest('hex');
  }
}
