import { Controller, Get, Param, Query, Res, UseGuards, Post, Body, HttpStatus, HttpException } from '@nestjs/common';
import type { Response, Request } from 'express';
import crypto, { randomUUID } from 'crypto';
import { OAuthService } from './oauth.service';
import { DbService } from './db.service';
import { TokenAuditService } from './services/token-audit.service';
import { TokenService } from './token.service';
import { encryptToken } from './token.util';
import Redis from 'ioredis';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { GatewayAuthGuard } from './guards/gateway-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { logJson, redactToken } from './utils/logger';
import { MetaClientService } from './platforms/meta/meta-client.service';
import { LinkedInClientService } from './platforms/linkedin/linkedin-client.service';

const supportedProviders = new Set(['meta', 'linkedin', 'google', 'youtube']);

function randomState(): string {
  return crypto.randomBytes(16).toString('hex');
}

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

@UseGuards(GatewayAuthGuard, RolesGuard)
@Controller('oauth')
export class OAuthController {
  private readonly redis: Redis;
  constructor(private readonly oauth: OAuthService, private readonly db: DbService, private readonly audit: TokenAuditService, private readonly tokenService: TokenService, private readonly metaClient: MetaClientService, private readonly linkedinClient: LinkedInClientService) {
    const url = process.env.REDIS_URL || 'redis://redis:6379';
    this.redis = new Redis(url);
  }

  @Get(':provider/start')
  @Roles('editor', 'admin')
  async start(@Param('provider') provider: string, @Res() res: Response) {
    if (!supportedProviders.has(provider)) {
      return res.status(400).json({ error: 'Unsupported provider' });
    }
    const allowlist = (process.env.OAUTH_REDIRECT_ALLOWLIST || '').split(',').map(s => s.trim()).filter(Boolean);
    const base = process.env.OAUTH_REDIRECT_BASE || 'http://localhost:44000/oauth';
    const providerRedirect = `${base}/${provider}/callback`;
    if (!allowlist.includes(providerRedirect)) {
      return res.status(400).json({ error: 'redirect_not_allowlisted' });
    }

    const orgId = (res.req as any)?.user?.orgId || 'unknown_org';
    const nonce = randomUUID();
    const statePayload = { orgId, provider, nonce, exp: Date.now() + 5 * 60 * 1000 };
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

    const codeVerifier = Buffer.from(crypto.randomBytes(32)).toString('base64url');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    const codeChallenge = Buffer.from(new Uint8Array(digest)).toString('base64url').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const ttlSeconds = parseInt(process.env.OAUTH_STATE_TTL_SECONDS || '300', 10);
    const redisKey = `oauth:${provider}:${nonce}`;
    await this.redis.setex(redisKey, ttlSeconds, JSON.stringify({ state, codeVerifier, orgId }));

    // Set signed, httpOnly, sameSite cookie for state (store nonce)
    res.cookie('oauth_state', nonce, {
      httpOnly: true,
      sameSite: 'lax',
      secure: (process.env.NODE_ENV || 'development') !== 'development',
      signed: true,
      maxAge: ttlSeconds * 1000,
      path: `/oauth/${provider}`,
    });

    let redirectUrl = '';

    if (provider === 'meta') {
      const clientId = process.env.META_APP_ID || '';
      const redirectUri = providerRedirect;
      const scope = [
        'pages_manage_posts',
        'pages_read_engagement',
        'pages_manage_metadata',
        'instagram_basic',
        'instagram_content_publish',
        'pages_messaging'
      ].join(',');
      redirectUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}`;
    }

    if (provider === 'linkedin') {
      const clientId = process.env.LINKEDIN_CLIENT_ID || '';
      const redirectUri = providerRedirect;
      const scope = [
        'r_organization_social',
        'w_organization_social',
        'rw_organization_admin',
        'r_ads_reporting'
      ].join(' ');
      redirectUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`;
    }

    if (provider === 'google' || provider === 'youtube') {
      const clientId = process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID || '';
      const redirectUri = providerRedirect;
      const scope = [
        'https://www.googleapis.com/auth/business.manage',
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly'
      ].join(' ');
      redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&access_type=offline&prompt=consent&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`;
    }

    return res.json({ provider, redirectUrl });
  }

  @Get(':provider/callback')
  @Roles('editor', 'admin')
  async callback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!supportedProviders.has(provider)) {
      return res.status(400).json({ error: 'Unsupported provider' });
    }
    const base = process.env.OAUTH_REDIRECT_BASE || 'http://localhost:44000/oauth';
    const allowlist = (process.env.OAUTH_REDIRECT_ALLOWLIST || '').split(',').map(s => s.trim()).filter(Boolean);
    const providerRedirect = `${base}/${provider}/callback`;
    if (!allowlist.includes(providerRedirect)) {
      return res.status(400).json({ error: 'redirect_not_allowlisted' });
    }

    try {
      const parsedState = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as { orgId: string; provider: string; nonce: string; exp: number };
      if (!parsedState || parsedState.provider !== provider || parsedState.exp < Date.now()) {
        return res.status(400).json({ error: 'invalid_state' });
      }
      // Enforce org match between auth context and state
      const authOrgId = (res.req as any)?.user?.orgId as string | undefined;
      if (!authOrgId || authOrgId !== parsedState.orgId) {
        return res.status(403).json({ error: 'org_mismatch' });
      }
      const cookieNonce = (res.req as any)?.signedCookies?.oauth_state as string | undefined;
      if (!cookieNonce || cookieNonce !== parsedState.nonce) {
        res.clearCookie('oauth_state', { path: `/oauth/${provider}` });
        return res.status(400).json({ error: 'state_cookie_mismatch' });
      }
      const redisKey = `oauth:${provider}:${parsedState.nonce}`;
      const stored = await this.redis.get(redisKey);
      if (!stored) return res.status(400).json({ error: 'state_not_found' });
      await this.redis.del(redisKey);
      res.clearCookie('oauth_state', { path: `/oauth/${provider}` });
      const storedObj = JSON.parse(stored);
      if (storedObj.state !== state) return res.status(400).json({ error: 'state_mismatch' });

      // Idempotency: dedupe by provider+code
      const codeKey = `oauth:code:${provider}:${await (async () => {
        const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
        return Buffer.from(new Uint8Array(d)).toString('base64url');
      })()}`;
      const claimed = await this.redis.setnx(codeKey, '1');
      if (claimed === 0) {
        return res.status(200).json({ provider, saved: true, deduped: true });
      }
      await this.redis.expire(codeKey, 300);

      let tokens: any = {};
      if (provider === 'meta') {
        tokens = await this.oauth.exchangeMeta(code, providerRedirect);
      } else if (provider === 'linkedin') {
        tokens = await this.oauth.exchangeLinkedIn(code, providerRedirect, storedObj.codeVerifier);
      } else if (provider === 'google' || provider === 'youtube') {
        tokens = await this.oauth.exchangeGoogle(code, providerRedirect, storedObj.codeVerifier);
      }

      const organizationId = parsedState.orgId;
      const platform = mapPlatform(provider);
      let externalId = 'unknown';
      let displayName = provider;
      try {
        if (provider === 'linkedin') {
          const profile = await this.linkedinClient.getUserProfile(tokens.access_token);
          if (profile?.id) {
            externalId = String(profile.id);
            displayName = profile.localizedFirstName || displayName;
          }
        } else if (provider === 'meta') {
          const pages = await this.metaClient.getUserPages(tokens.access_token);
          if (Array.isArray(pages) && pages.length > 0) {
            externalId = pages[0].id;
            displayName = pages[0].name || displayName;
          }
        }
      } catch {}

      const socialId = await this.db.upsertSocialAccount(organizationId, platform, externalId, displayName);
      const accessEnc = tokens.access_token ? encryptToken(tokens.access_token) : '';
      const refreshEnc = tokens.refresh_token ? encryptToken(tokens.refresh_token) : null;
      const expiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null;
      const scopes = typeof tokens.scope === 'string' ? tokens.scope.trim().replace(/\s+/g, ' ') : null;
      await this.db.insertToken(socialId, accessEnc, refreshEnc, expiresAt, scopes);
      await this.tokenService.evictTokenCache(organizationId, platform, socialId);

      // Scope validation and reporting
      const requiredScopesMeta = [
        'pages_manage_posts',
        'pages_read_engagement',
        'pages_manage_metadata',
        'instagram_basic',
        'instagram_content_publish',
        'pages_messaging',
      ];
      const requiredScopesLinkedIn = [
        'r_organization_social',
        'w_organization_social',
        'rw_organization_admin',
      ];
      const grantedScopesRaw: string | null = typeof tokens.scope === 'string' ? tokens.scope : null;
      const grantedScopes = grantedScopesRaw ? grantedScopesRaw.split(/[ ,]+/).filter(Boolean) : [];
      const missingScopes = provider === 'meta'
        ? requiredScopesMeta.filter(s => !grantedScopes.includes(s))
        : provider === 'linkedin'
          ? requiredScopesLinkedIn.filter(s => !grantedScopes.includes(s))
          : [];

      await this.audit.record('acquire', {
        orgId: organizationId,
        provider,
        socialAccountId: socialId,
        success: true,
        expiresAt,
        scopes,
        correlationId: (res.req as any)?.correlationId,
      });

      logJson(new (require('@nestjs/common').Logger)('OAuthController'), 'log', 'oauth_token_acquired', {
        provider,
        orgId: organizationId,
        socialAccountId: socialId,
        accessPreview: redactToken(tokens.access_token),
        hasRefresh: !!tokens.refresh_token,
      });
      return res.json({ provider, saved: true, has_access: !!tokens.access_token, has_refresh: !!tokens.refresh_token, scopes: { granted: grantedScopes, missing: missingScopes } });
    } catch (err: any) {
      await this.audit.record('failure', {
        orgId: 'unknown',
        provider,
        socialAccountId: 'unknown',
        success: false,
        reason: err?.message,
        correlationId: (res.req as any)?.correlationId,
        expiresAt: null,
        scopes: null,
      });
      logJson(new (require('@nestjs/common').Logger)('OAuthController'), 'error', 'oauth_token_exchange_failed', { error: err?.message });
      return res.status(500).json({ error: 'token_exchange_failed', details: err?.message });
    }
  }

  /**
   * List Facebook Pages available for the current org's connected Meta user token
   */
  @Get('meta/pages')
  @Roles('editor', 'admin')
  async listMetaPages(@Res() res: Response) {
    try {
      const orgId = ((res.req as any)?.user?.orgId) as string | undefined;
      if (!orgId) throw new HttpException('org_not_found', HttpStatus.FORBIDDEN);
      this.tokenService.setOrgId(orgId);
      const t = await this.tokenService.getValidAccessToken('meta');
      if (!t?.accessToken) {
        throw new HttpException('meta_token_not_found', HttpStatus.BAD_REQUEST);
      }
      const pages = await this.metaClient.getUserPages(t.accessToken);
      return res.json({ pages });
    } catch (e: any) {
      throw new HttpException(e?.message || 'failed_to_list_pages', e?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Select a Facebook Page to bind as the organization's posting account
   * Body: { pageId: string }
   */
  @Post('meta/pages/select')
  @Roles('editor', 'admin')
  async selectMetaPage(@Res() res: Response, @Body() body: { pageId: string }) {
    try {
      const orgId = ((res.req as any)?.user?.orgId) as string | undefined;
      if (!orgId) throw new HttpException('org_not_found', HttpStatus.FORBIDDEN);
      const { pageId } = body || ({} as any);
      if (!pageId) throw new HttpException('pageId_required', HttpStatus.BAD_REQUEST);

      // Get user token and fetch pages to find the selected page's access token
      this.tokenService.setOrgId(orgId);
      const t = await this.tokenService.getValidAccessToken('meta');
      if (!t?.accessToken) throw new HttpException('meta_token_not_found', HttpStatus.BAD_REQUEST);
      const pages = await this.metaClient.getUserPages(t.accessToken);
      const page = pages.find(p => p.id === pageId);
      if (!page) throw new HttpException('page_not_accessible', HttpStatus.NOT_FOUND);

      // Upsert social account for the selected page and store the page access token
      const platform = mapPlatform('meta');
      const socialId = await this.db.upsertSocialAccount(orgId, platform, page.id, page.name);
      const accessEnc = encryptToken(page.accessToken);
      const refreshEnc = null;
      const expiresAt = null; // page tokens may rotate separately; we store as non-expiring until refreshed
      const scopes = 'pages_manage_posts pages_read_engagement pages_manage_metadata instagram_basic instagram_content_publish pages_messaging';
      await this.db.insertToken(socialId, accessEnc, refreshEnc, expiresAt, scopes);
      await this.tokenService.evictTokenCache(orgId, platform, socialId);

      await this.audit.record('select_page', {
        orgId,
        provider: 'meta',
        socialAccountId: socialId,
        success: true,
        expiresAt,
        scopes,
        correlationId: (res.req as any)?.correlationId,
      });

      return res.status(HttpStatus.OK).json({ saved: true, platform, socialAccountId: socialId, page: { id: page.id, name: page.name, category: page.category } });
    } catch (e: any) {
      throw new HttpException(e?.message || 'failed_to_select_page', e?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Dev-only: persist a dummy token without performing an actual OAuth exchange
  @Get(':provider/dev-save')
  async devSave(@Param('provider') provider: string, @Res() res: Response) {
    if (!supportedProviders.has(provider)) {
      return res.status(400).json({ error: 'Unsupported provider' });
    }
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'not_found' });
    }
    const organizationId = ((res.req as any)?.user?.orgId) || 'dev_org';
    const platform = mapPlatform(provider);
    const externalId = 'unknown';
    const displayName = provider;

    const socialId = await this.db.upsertSocialAccount(organizationId, platform, externalId, displayName);
    const accessEnc = encryptToken(`dummy_access_${provider}`);
    const refreshEnc = encryptToken(`dummy_refresh_${provider}`);
    const expiresAt = new Date(Date.now() + 3600 * 1000);
    const scopes = 'dev';
    await this.db.insertToken(socialId, accessEnc, refreshEnc, expiresAt, scopes);

    return res.json({ provider, saved: true, dummy: true });
  }
}
