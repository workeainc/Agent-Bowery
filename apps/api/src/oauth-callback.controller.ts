import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { OAuthService } from './oauth.service';
import { DbService } from './db.service';
import { TokenAuditService } from './services/token-audit.service';
import { TokenService } from './token.service';
import { encryptToken } from './token.util';
import { extractAuthUser } from './auth.util';
import Redis from 'ioredis';
import { MetaClientService } from './platforms/meta/meta-client.service';
import { LinkedInClientService } from './platforms/linkedin/linkedin-client.service';
import { redactToken } from './utils/logger';

const supportedProviders = new Set(['meta', 'linkedin', 'google', 'youtube']);

@Controller('oauth-callback')
export class OAuthCallbackController {
  private readonly redis: Redis;
  
  constructor(
    private readonly oauthService: OAuthService,
    private readonly dbService: DbService,
    private readonly tokenAuditService: TokenAuditService,
    private readonly tokenService: TokenService,
    private readonly metaClient: MetaClientService,
    private readonly linkedinClient: LinkedInClientService,
  ) {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:56379');
  }

  @Get(':provider/callback')
  async callback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!supportedProviders.has(provider)) {
      return res.status(400).json({ error: 'Unsupported provider' });
    }

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const base = process.env.OAUTH_REDIRECT_BASE || 'https://nonelicited-naida-multiradiate.ngrok-free.dev/oauth';
    const allowlist = (process.env.OAUTH_REDIRECT_ALLOWLIST || '').split(',').map(s => s.trim()).filter(Boolean);
    const providerRedirect = `${base.replace('/oauth', '/oauth-callback')}/${provider}/callback`;
    
    console.log('OAuth Callback Debug:');
    console.log('Base:', base);
    console.log('Allowlist:', allowlist);
    console.log('Provider Redirect:', providerRedirect);
    console.log('Environment OAUTH_REDIRECT_BASE:', process.env.OAUTH_REDIRECT_BASE);
    console.log('Environment OAUTH_REDIRECT_ALLOWLIST:', process.env.OAUTH_REDIRECT_ALLOWLIST);
    
    // Temporary bypass for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('🚧 Development mode: Bypassing allowlist check');
    } else if (!allowlist.includes(providerRedirect)) {
      console.error('Redirect not allowlisted:', providerRedirect);
      console.error('Allowlist:', allowlist);
      return res.status(400).json({ error: 'redirect_not_allowlisted' });
    }

    try {
      // Parse the state to get user info (state is base64url encoded)
      const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
      const { userId, provider: stateProvider, nonce, exp } = stateData;

      // Verify provider matches
      if (provider !== stateProvider) {
        return res.status(400).json({ error: 'Provider mismatch' });
      }

      // Check expiration
      if (Date.now() > exp) {
        return res.status(400).json({ error: 'State expired' });
      }

      // Verify nonce exists in Redis
      const redisKey = `oauth:${provider}:${nonce}`;
      console.log('🔍 Looking for Redis key:', redisKey);
      console.log('🔍 Nonce from state:', nonce);
      console.log('🔍 Provider:', provider);
      
      const storedState = await this.redis.get(redisKey);
      console.log('🔍 Stored state from Redis:', storedState);
      
      if (!storedState) {
        console.error('❌ State not found in Redis for key:', redisKey);
        return res.status(400).json({ error: 'state_cookie_mismatch' });
      }

      // Exchange code for access token
      let accessToken: string;
      let refreshToken: string | undefined;
      let expiresIn: number | undefined;

      switch (provider) {
        case 'meta':
          const metaTokenResponse = await this.metaClient.exchangeCodeForToken(code, providerRedirect);
          accessToken = metaTokenResponse.access_token;
          refreshToken = metaTokenResponse.refresh_token;
          expiresIn = metaTokenResponse.expires_in;
          break;
        
        case 'linkedin':
          const linkedinTokenResponse = await this.linkedinClient.exchangeCodeForToken(code, providerRedirect);
          accessToken = linkedinTokenResponse.access_token;
          refreshToken = linkedinTokenResponse.refresh_token;
          expiresIn = linkedinTokenResponse.expires_in;
          break;
        
        default:
          return res.status(400).json({ error: 'Provider not implemented' });
      }

      // Store the token using the existing token service
      const encryptedAccessToken = encryptToken(accessToken);
      const encryptedRefreshToken = refreshToken ? encryptToken(refreshToken) : null;

      await this.tokenService.saveUserAccessToken(
        userId,
        provider,
        encryptedAccessToken,
        encryptedRefreshToken,
        expiresIn,
      );

      // Audit the token
      await this.tokenAuditService.record('acquire', {
        userId,
        provider,
        socialAccountId: 'unknown', // We don't have the social account ID yet
        success: true,
        reason: 'OAuth code exchange successful',
        expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
      });

      // Clean up Redis state
      await this.redis.del(redisKey);

      // Redirect to success page
      const successUrl = `${process.env.WEB_APP_URL || 'http://localhost:43000'}/platforms?status=success&provider=${provider}`;
      return res.redirect(successUrl);

    } catch (error) {
      console.error('OAuth callback error:', error);
      
      // Audit the failure
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
        await this.tokenAuditService.record('failure', {
          userId: stateData.userId,
          provider,
          socialAccountId: 'unknown',
          success: false,
          reason: error.message,
        });
      } catch (auditError) {
        console.error('Failed to audit token error:', auditError);
      }

      // Redirect to the web app with error
      const errorUrl = `${process.env.WEB_APP_URL || 'http://localhost:43000'}/platforms?status=error&provider=${provider}&message=${encodeURIComponent(error.message)}`;
      return res.redirect(errorUrl);
    }
  }
}
