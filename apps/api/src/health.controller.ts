import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import client from 'prom-client';
import { DbService } from './db.service';

@Controller()
export class HealthController {
  constructor(private readonly dbService: DbService) {}
  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('metrics')
  async metrics(@Res() res: Response) {
    res.setHeader('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  }

  @Get('health/oauth')
  oauthHealth() {
    const required = {
      META_APP_ID: !!process.env.META_APP_ID,
      META_APP_SECRET: !!process.env.META_APP_SECRET,
      LINKEDIN_CLIENT_ID: !!process.env.LINKEDIN_CLIENT_ID,
      LINKEDIN_CLIENT_SECRET: !!process.env.LINKEDIN_CLIENT_SECRET,
      OAUTH_REDIRECT_BASE: !!process.env.OAUTH_REDIRECT_BASE,
      OAUTH_REDIRECT_ALLOWLIST: !!process.env.OAUTH_REDIRECT_ALLOWLIST,
    };
    const ready = Object.values(required).every(Boolean);
    return {
      ready,
      required,
      dryRun: process.env.DRY_RUN === 'true',
      base: process.env.OAUTH_REDIRECT_BASE || null,
      allowlist: (process.env.OAUTH_REDIRECT_ALLOWLIST || '').split(',').map(s => s.trim()).filter(Boolean),
      providers: {
        meta: required.META_APP_ID && required.META_APP_SECRET,
        linkedin: required.LINKEDIN_CLIENT_ID && required.LINKEDIN_CLIENT_SECRET,
      },
    };
  }

  @Get('health/system')
  async getSystemHealth() {
    try {
      const flags = await this.dbService.getSystemFlags();
      return {
        globalPause: flags.global_pause,
        systemStatus: flags.global_pause ? 'paused' : 'active',
        updatedAt: flags.updated_at,
      };
    } catch (error) {
      return {
        globalPause: false,
        systemStatus: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
