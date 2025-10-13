import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { DbService } from './db.service';
import { decryptToken, encryptToken } from './token.util';
import axios from 'axios';
import { TokenAuditService } from './services/token-audit.service';
import { TokenCacheService } from './token-cache.service';
import { redactToken } from './utils/logger';

export type Provider = 'meta' | 'linkedin' | 'google' | 'youtube';

function mapPlatform(provider: Provider): string {
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

interface TokenRefreshResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: Date;
  scopes?: string | null;
  error?: string;
}

@Injectable()
export class TokenService {
  private redis: Redis;
  private orgId?: string;
  private readonly logger = new Logger(TokenService.name);

  constructor(private readonly db: DbService, private readonly tokenAudit: TokenAuditService, private readonly tokenCache: TokenCacheService) {
    const url = process.env.REDIS_URL || 'redis://redis:6379';
    this.redis = new Redis(url);
  }

  setOrgId(orgId: string) {
    this.orgId = orgId;
  }

  async getValidAccessToken(provider: Provider): Promise<{ accessToken: string; dummy: boolean } | null> {
    const platform = mapPlatform(provider);
    const cacheKey = `token_cache:${this.orgId}:${platform}`;

    // Check cache first
    const cached = this.orgId ? await this.tokenCache.getCachedToken(this.orgId, platform) : null;
    if (cached) {
      const dec = decryptToken(cached);
      return { accessToken: dec, dummy: dec.startsWith('dummy_access_') };
    }

    // Get latest token from DB
    if (!this.orgId) return null;
    if (!this.orgId) return null;
    const rec = await this.db.getLatestTokenForPlatform(this.orgId, platform);
    if (!rec) return null;

    const access = decryptToken(rec.access_token_enc);
    const refresh = rec.refresh_token_enc ? decryptToken(rec.refresh_token_enc) : null;
    const isDummy = access.startsWith('dummy_access_');

    // Check if token needs refresh
    const expiresAt: Date | null = rec.expires_at ? new Date(rec.expires_at) : null;
    const now = Date.now();
    const nearExpiry = expiresAt ? expiresAt.getTime() - now < 15 * 60 * 1000 : false;

    let usable = access;
    if (!isDummy && nearExpiry && refresh) {
      // Proactive refresh
      this.logger.log(`Proactive refresh needed for ${platform}`);
      const refreshResult = await this.refreshAccessToken(provider, refresh);
      if (refreshResult.accessToken) {
        usable = refreshResult.accessToken;
        await this.auditTokenExchange(platform, 'proactive_refresh', true, null);
      } else {
        this.logger.warn(`Proactive refresh failed for ${platform}: ${refreshResult.error}`);
        await this.auditTokenExchange(platform, 'proactive_refresh', false, refreshResult.error || null);
      }
    }

    // Cache for 5 minutes
    if (this.orgId) {
      await this.tokenCache.setCachedToken(this.orgId, platform, encryptToken(usable), 300);
    }
    return { accessToken: usable, dummy: isDummy };
  }

  async refreshAccessToken(provider: Provider, refreshToken: string, correlationId?: string): Promise<TokenRefreshResult> {
    try {
      switch (provider) {
        case 'meta':
          return await this.refreshMetaToken(refreshToken);
        case 'linkedin':
          return await this.refreshLinkedInToken(refreshToken);
        case 'google':
        case 'youtube':
          return await this.refreshGoogleToken(refreshToken);
        default:
          return { accessToken: '', error: 'Unsupported provider' };
      }
    } catch (error) {
      this.logger.error(`Token refresh error for ${provider}:`, error);
      return { accessToken: '', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async refreshMetaToken(refreshToken: string): Promise<TokenRefreshResult> {
    const clientId = process.env.META_APP_ID;
    const clientSecret = process.env.META_APP_SECRET;
    
    if (!clientId || !clientSecret) {
      return { accessToken: '', error: 'Missing Meta credentials' };
    }
    // Meta uses long-lived token exchange; refresh flow varies per asset. Stub for now.
    return { accessToken: '', error: 'Meta refresh not implemented; use long-lived exchange per asset' };
  }

  private async refreshLinkedInToken(refreshToken: string): Promise<TokenRefreshResult> {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return { accessToken: '', error: 'Missing LinkedIn credentials' };
    }
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });
    const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', params.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    };
  }

  private async refreshGoogleToken(refreshToken: string): Promise<TokenRefreshResult> {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET || '';
    
    if (!clientId || !clientSecret) {
      return { accessToken: '', error: 'Missing Google credentials' };
    }
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });
    const response = await axios.post('https://oauth2.googleapis.com/token', params.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    };
  }

  async handleTokenRefresh(provider: Provider, oldToken: string, correlationId?: string): Promise<string | null> {
    const platform = mapPlatform(provider);
    this.logger.log(`Reactive refresh triggered for ${platform}`);
    
    // Get refresh token from DB
    if (!this.orgId) return null;
    const rec = await this.db.getLatestTokenForPlatform(this.orgId, platform);
    if (!rec?.refresh_token_enc) {
      await this.auditTokenExchange(platform, 'reactive_refresh', false, 'No refresh token available');
      await this.tokenAudit.record('refresh_failure', { orgId: this.orgId, provider: platform, socialAccountId: rec?.social_account_id || 'unknown', success: false, reason: 'No refresh token available', correlationId });
      return null;
    }

    const refreshToken = decryptToken(rec.refresh_token_enc);
    await this.tokenAudit.record('refresh_attempt', { orgId: this.orgId, provider: platform, socialAccountId: rec.social_account_id || 'unknown', success: true, correlationId, scopes: Array.isArray(rec.scopes) ? rec.scopes.join(' ') : (rec.scopes || null) });
    const refreshResult = await this.refreshAccessToken(provider, refreshToken, correlationId);
    
    if (refreshResult.accessToken) {
      // Store new token version
      await this.storeNewTokenVersion(platform, refreshResult);
      await this.auditTokenExchange(platform, 'reactive_refresh', true, null);
      await this.tokenAudit.record('refresh_success', { orgId: this.orgId, provider: platform, socialAccountId: rec.social_account_id || 'unknown', success: true, correlationId, expiresAt: refreshResult.expiresAt || null, scopes: refreshResult.scopes || null });
      
      // Clear cache
      await this.evictTokenCache(this.orgId, platform, rec.social_account_id);
      
      return refreshResult.accessToken;
    } else {
      await this.auditTokenExchange(platform, 'reactive_refresh', false, refreshResult.error || null);
      await this.tokenAudit.record('refresh_failure', { orgId: this.orgId, provider: platform, socialAccountId: rec.social_account_id || 'unknown', success: false, reason: refreshResult.error, correlationId });
      return null;
    }
  }

  private async storeNewTokenVersion(platform: string, refreshResult: TokenRefreshResult) {
    const socialAccountId = await this.db.upsertSocialAccount(
      this.orgId!, 
      platform, 
      'external_id', 
      'Display Name'
    );

    const expiresAt = refreshResult.expiresAt ?? (refreshResult.expiresIn 
      ? new Date(Date.now() + refreshResult.expiresIn * 1000)
      : null);

    await this.db.insertToken(
      socialAccountId,
      encryptToken(refreshResult.accessToken),
      refreshResult.refreshToken ? encryptToken(refreshResult.refreshToken) : null,
      expiresAt,
      refreshResult.scopes || 'refresh'
    );

    this.logger.log(`New token version stored for ${platform}`);
    await this.evictTokenCache(this.orgId!, platform, socialAccountId);
  }

  encryptToken(plaintext: string): string {
    return encryptToken(plaintext);
  }

  decryptToken(ciphertext: string): string {
    return decryptToken(ciphertext);
  }

  private async auditTokenExchange(platform: string, type: string, success: boolean, error: string | null) {
    try {
      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      const sql = `
        INSERT INTO token_audit (id, organization_id, provider, social_account_id, event, success, reason, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, now())
      `;
      await this.db.query(sql, [auditId, this.orgId, platform, 'unknown', type, success, error]);
      this.logger.log(`Token exchange audit logged: ${platform} ${type} ${success ? 'SUCCESS' : 'FAILED'}`);
    } catch (auditError) {
      this.logger.error('Failed to log token audit:', auditError);
    }
  }

  async evictTokenCache(orgId: string, platform: string, socialAccountId?: string): Promise<void> {
    try {
      await this.tokenCache.evictTokenCache(orgId, platform, socialAccountId);
    } catch (e) {
      this.logger.warn(`Failed to evict token cache for ${platform}`);
    }
  }
}
