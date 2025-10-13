import { Controller, Get, Param, Post, Body, HttpException, HttpStatus, Req } from '@nestjs/common';
import { DbService } from './db.service';
import { decryptToken } from './token.util';
import { PlatformService } from './platform.service';

function mapPlatform(provider: string): string {
  switch (provider) {
    case 'meta':
      return 'FACEBOOK';
    case 'linkedin':
      return 'LINKEDIN';
    case 'youtube':
      return 'YOUTUBE';
    case 'google':
      return 'GBP';
    default:
      return 'GBP';
  }
}

@Controller('posts')
export class PostsController {
  constructor(private readonly db: DbService, private readonly platforms: PlatformService) {}

  private extractOrganizationId(req: any): string {
    const orgId = req?.user?.orgId || req?.user?.organizationId || req?.user?.sub;
    if (!orgId) {
      throw new HttpException('Organization context required', HttpStatus.BAD_REQUEST);
    }
    return orgId;
  }

  @Get(':provider/test')
  async test(@Param('provider') provider: string, @Req() req: any) {
    const organizationId = this.extractOrganizationId(req);
    const platform = mapPlatform(provider);
    const rec = await this.db.getLatestTokenForPlatform(organizationId, platform);
    if (!rec) {
      return { ok: false, error: 'no_token' };
    }
    const access = decryptToken(rec.access_token_enc);
    const isDummy = access.startsWith('dummy_access_');
    return { ok: true, provider, platform, token_preview: access.slice(0, 12) + '...', dummy: isDummy };
  }

  @Get(':provider/ping')
  async ping(@Param('provider') provider: string, @Req() req: any) {
    const organizationId = this.extractOrganizationId(req);
    const platform = mapPlatform(provider);
    const rec = await this.db.getLatestTokenForPlatform(organizationId, platform);
    if (!rec) return { ok: false, error: 'no_token' };
    const access = decryptToken(rec.access_token_enc);
    if (access.startsWith('dummy_access_')) return { ok: true, dry_run: true };
    return this.platforms.ping(provider, access);
  }

  @Post(':provider/dry-run')
  async dryRun(@Param('provider') provider: string, @Body() body: any, @Req() req: any) {
    const organizationId = this.extractOrganizationId(req);
    const platform = mapPlatform(provider);
    const rec = await this.db.getLatestTokenForPlatform(organizationId, platform);
    if (!rec) return { ok: false, error: 'no_token' };
    const access = decryptToken(rec.access_token_enc);
    const payload = { text: body?.text ?? 'Hello from Agent Bowery (dry-run)' };
    if (access.startsWith('dummy_access_')) return { ok: true, dry_run: true, payload };
    // For safety in dev, we just echo. Real publishing will be added once credentials are present and scopes confirmed.
    return { ok: true, would_post: true, payload };
  }
}
