import { Controller, Get, Query, Res, Post, Body, UseGuards, Delete, Param, HttpException, HttpStatus, Request } from '@nestjs/common';
import type { Response } from 'express';
import { MetaClientService } from './platforms/meta/meta-client.service';
import { LinkedInClientService } from './platforms/linkedin/linkedin-client.service';
import { DbService } from './db.service';
import { TokenService } from './token.service';
import { GatewayAuthGuard } from './guards/gateway-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { encryptToken } from './token.util';
import { extractAuthUser } from './auth.util';
import Redis from 'ioredis';

export interface ConnectPlatformDto {
  organizationId: string;
  platform: 'meta' | 'linkedin' | 'google' | 'youtube';
}

export interface PlatformAccountInfo {
  platform: string;
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    connected: boolean;
    status?: string;
    lastSyncAt?: string | null;
    username?: string | null;
    statusReason?: string | null;
  }>;
}

@UseGuards(GatewayAuthGuard)
@Controller('platforms')
export class PlatformController {
  constructor(
    private readonly metaClient: MetaClientService,
    private readonly linkedinClient: LinkedInClientService,
    private readonly dbService: DbService,
    private readonly tokenService: TokenService,
  ) {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:56379');
  }
  
  private redis: Redis;

  /**
   * Get OAuth URL for platform connection
   */
  @Get(':platform/connect')
  @Roles('admin', 'editor')
  async getConnectUrl(@Param('platform') platform: string, @Query('organizationId') organizationId: string, @Request() req: any) {
    // Extract authenticated user (supports both dev and production)
    const authUser = extractAuthUser(req);
    if (!authUser) {
      throw new Error('User not authenticated');
    }
    
    const userId = authUser.userId;
    // For development, use a fixed organization ID that matches the dev token
    const devOrganizationId = authUser.organizationId;
    // Generate proper state with user info and expiration
    const nonce = Math.random().toString(36).substring(2, 15);
    const exp = Date.now() + (5 * 60 * 1000); // 5 minutes from now
    
    const stateData = {
      userId,  // Real user ID from auth
      provider: platform.toLowerCase(),
      organizationId: devOrganizationId,  // Real org ID from auth
      nonce,
      exp
    };
    
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');
    
    // Store state in Redis for verification
    const redisKey = `oauth:${platform.toLowerCase()}:${nonce}`;
    console.log('💾 Storing state in Redis with key:', redisKey);
    console.log('💾 State data:', JSON.stringify(stateData));
    await this.redis.setex(redisKey, 300, JSON.stringify(stateData)); // 5 minutes TTL
    
    switch (platform.toLowerCase()) {
      case 'meta':
        return {
          platform: 'meta',
          authUrl: `https://www.facebook.com/v19.0/dialog/oauth?` +
            `client_id=${process.env.META_APP_ID}&` +
            `redirect_uri=${encodeURIComponent(process.env.META_REDIRECT_URI || 'http://localhost:44000/oauth-callback/meta/callback')}&` +
            `response_type=code&` +
            `state=${state}`,
          state
        };

      case 'linkedin':
        return {
          platform: 'linkedin',
          authUrl: `https://www.linkedin.com/oauth/v2/authorization?` +
            `response_type=code&` +
            `client_id=${process.env.LINKEDIN_CLIENT_ID}&` +
            `redirect_uri=${encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:44000/api/platforms/linkedin/callback')}&` +
            `state=${state}&` +
            `scope=r_liteprofile,r_organization_social,w_member_social`,
          state
        };

      case 'google':
      case 'youtube':
        return {
          platform: platform.toLowerCase(),
          authUrl: `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
            `redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI || 'http://localhost:44000/api/platforms/google/callback')}&` +
            `scope=${platform === 'youtube' ? 'https://www.googleapis.com/auth/youtube.upload' : 'https://www.googleapis.com/auth/business.manage'}&` +
            `response_type=code&` +
            `state=${state}`,
          state
        };

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  // Meta callback is consolidated under /oauth/meta/callback

  /**
   * Handle LinkedIn OAuth callback
   */
  @Get('linkedin/callback')
  async handleLinkedInCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response
  ) {
    // Deprecated in favor of unified /oauth/:provider/callback
    const apiBase = process.env.API_BASE_URL || process.env.BACKEND_URL || 'http://localhost:44000';
    const redirect = `${apiBase}/oauth/linkedin/callback?code=${encodeURIComponent(code || '')}&state=${encodeURIComponent(state || '')}`;
    return res.status(410).json({
      deprecated: true,
      message: 'Deprecated endpoint. Use /oauth/linkedin/callback.',
      redirect,
    });
  }

  /**
   * Reconnect a specific external account by returning an OAuth redirect URL
   */
  @Post('accounts/:platform/:externalId/reconnect')
  @Roles('admin', 'editor')
  async reconnectAccount(
    @Param('platform') platform: string,
    @Param('externalId') externalId: string,
    @Query('organizationId') _organizationId: string,
  ) {
    // For now, reuse the generic OAuth start endpoint per provider
    const provider = platform.toLowerCase();
    const apiBase = process.env.API_BASE_URL || process.env.BACKEND_URL || 'http://localhost:44000';
    return {
      redirectUrl: `${apiBase}/oauth/${provider}/start`
    };
  }

  /**
   * Get connected accounts for organization
   */
  @Get('accounts')
  @Roles('admin', 'editor', 'viewer')
  async getConnectedAccounts(@Query('organizationId') organizationId: string, @Body() _body?: any, @Res() _res?: Response): Promise<PlatformAccountInfo[]> {
    try {
      // Enforce org scoping from auth context when present
      const authOrgId = (_res as any)?.req?.user?.orgId || (_res as any)?.req?.user?.organizationId;
      if (authOrgId && organizationId && authOrgId !== organizationId) {
        throw new HttpException('org_mismatch', HttpStatus.FORBIDDEN);
      }
      const socialAccounts = await this.dbService.getSocialAccountsByOrganization(organizationId);
      
      const platformGroups = socialAccounts.reduce((acc, account) => {
        if (!acc[account.platform]) {
          acc[account.platform] = [];
        }
        const reason = (() => {
          const s = account.connection_status || 'active';
          if (s === 'active') return null;
          if (s === 'expired') return 'expired';
          if (s === 'revoked') return 'revoked';
          if (s === 'pending') return 'pending';
          return 'error';
        })();
        acc[account.platform].push({
          id: account.external_id,
          name: account.display_name,
          type: account.platform,
          connected: (account.connection_status || 'active') === 'active',
          status: account.connection_status || 'active',
          lastSyncAt: account.last_sync_at ? new Date(account.last_sync_at).toISOString() : null,
          username: account.platform_username || null,
          statusReason: reason
        });
        return acc;
      }, {} as Record<string, any[]>);

      return Object.entries(platformGroups).map(([platform, accounts]) => ({
        platform,
        accounts
      }));
    } catch (error) {
      console.error('Failed to get connected accounts:', error);
      return [];
    }
  }

  /**
   * Test platform connection
   */
  @Post(':platform/test')
  @Roles('admin', 'editor')
  async testPlatformConnection(
    @Query('platform') platform: string,
    @Body() body: { organizationId: string; accountId?: string },
    @Res() res: Response
  ) {
    try {
      const { organizationId, accountId } = body;
      const authOrgId = (res as any)?.req?.user?.orgId || (res as any)?.req?.user?.organizationId;
      if (authOrgId && organizationId && authOrgId !== organizationId) {
        return { success: false, error: 'org_mismatch' };
      }
      
      switch (platform.toLowerCase()) {
        case 'meta':
        case 'facebook':
          const metaToken = await this.tokenService.getValidAccessToken('meta');
          if (!metaToken) {
            return { success: false, error: 'No Meta token found' };
          }
          
          const isValid = await this.metaClient.validateAccessToken(metaToken.accessToken);
          return { success: isValid, platform: 'meta' };

        case 'instagram':
          const instagramToken = await this.tokenService.getValidAccessToken('meta'); // Instagram uses Meta token
          if (!instagramToken) {
            return { success: false, error: 'No Instagram token found' };
          }
          
          const instagramValid = await this.metaClient.validateAccessToken(instagramToken.accessToken);
          return { success: instagramValid, platform: 'instagram' };

        case 'linkedin':
          const linkedinToken = await this.tokenService.getValidAccessToken('linkedin');
          if (!linkedinToken) {
            return { success: false, error: 'No LinkedIn token found' };
          }
          
          const linkedinValid = await this.linkedinClient.validateAccessToken(linkedinToken.accessToken);
          return { success: linkedinValid, platform: 'linkedin' };

        default:
          return { success: false, error: `Unsupported platform: ${platform}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Disconnect platform account
   */
  @Post(':platform/disconnect')
  @Roles('admin')
  async disconnectPlatform(
    @Query('platform') platform: string,
    @Body() body: { organizationId: string; accountId: string }
  ) {
    try {
      const { organizationId, accountId } = body;
      // Enforce org context from auth
      if (!(global as any)) {
        // noop to satisfy linter in some environments
      }
      // In this codebase, orgId is expected on req.user set by the gateway guard
      const authOrgId = (arguments as any)?.[2]?.user?.orgId || undefined;
      if (authOrgId && organizationId && authOrgId !== organizationId) {
        throw new HttpException('org_mismatch', HttpStatus.FORBIDDEN);
      }

      // Remove social account and tokens
      const ok = await this.dbService.deleteSocialAccount(organizationId, platform.toUpperCase(), accountId);
      if (ok) {
        try {
          await this.tokenService.evictTokenCache(organizationId, platform.toUpperCase());
        } catch {}
      }
      return { success: ok, message: ok ? `${platform} account disconnected successfully` : 'account_not_found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * RESTful disconnect by params
   */
  @Delete('accounts/:platform/:externalId')
  @Roles('admin')
  async deleteAccount(
    @Param('platform') platform: string,
    @Param('externalId') externalId: string,
    @Query('organizationId') organizationId: string,
    @Res() res: Response
  ) {
    try {
      const authOrgId = (res as any)?.req?.user?.orgId || (res as any)?.req?.user?.organizationId;
      if (authOrgId && organizationId && authOrgId !== organizationId) {
        return { success: false, error: 'org_mismatch' };
      }
      const ok = await this.dbService.deleteSocialAccount(organizationId, platform.toUpperCase(), externalId);
      if (ok) {
        try {
          await this.tokenService.evictTokenCache(organizationId, platform.toUpperCase());
        } catch {}
      }
      return { success: ok };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get platform-specific account details
   */
  @Get(':platform/accounts')
  @Roles('admin', 'editor', 'viewer')
  async getPlatformAccounts(
    @Param('platform') platform: string,
    @Query('organizationId') organizationId: string,
    @Res() res: Response
  ) {
    try {
      const authOrgId = (res as any)?.req?.user?.orgId || (res as any)?.req?.user?.organizationId;
      if (authOrgId && organizationId && authOrgId !== organizationId) {
        return { accounts: [], error: 'org_mismatch' };
      }
      
      switch (platform.toLowerCase()) {
        case 'meta':
        case 'facebook':
          const userIdMeta = (res as any)?.req?.user?.sub || (res as any)?.req?.user?.userId;
          if (!userIdMeta) return { accounts: [], error: 'unauthorized' };
          
          try {
            // Add timeout to prevent hanging
            const metaTokenPromise = this.tokenService.getUserAccessToken(userIdMeta, 'meta');
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Token fetch timeout')), 5000)
            );
            
            const metaToken = await Promise.race([metaTokenPromise, timeoutPromise]) as any;
            if (!metaToken) {
              return { accounts: [], error: 'No Meta token found' };
            }
            
            const pages = await this.metaClient.getUserPages(metaToken.accessToken);
            return { accounts: pages };
          } catch (tokenError) {
            console.error('Meta token error:', tokenError);
            return { accounts: [], error: 'No Meta token found or connection timeout' };
          }

        case 'linkedin':
          const userIdLi = (res as any)?.req?.user?.sub || (res as any)?.req?.user?.userId;
          if (!userIdLi) return { accounts: [], error: 'unauthorized' };
          
          try {
            const linkedinTokenPromise = this.tokenService.getUserAccessToken(userIdLi, 'linkedin');
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Token fetch timeout')), 5000)
            );
            
            const linkedinToken = await Promise.race([linkedinTokenPromise, timeoutPromise]) as any;
            if (!linkedinToken) {
              return { accounts: [], error: 'No LinkedIn token found' };
            }
            
            const companies = await this.linkedinClient.getUserCompanies(linkedinToken.accessToken);
            return { accounts: companies };
          } catch (tokenError) {
            console.error('LinkedIn token error:', tokenError);
            return { accounts: [], error: 'No LinkedIn token found or connection timeout' };
          }

        default:
          return { accounts: [], error: `Unsupported platform: ${platform}` };
      }
    } catch (error) {
      console.error('Platform accounts error:', error);
      return { accounts: [], error: error.message };
    }
  }

  /**
   * List Meta pages for current user (proxy provider) to align with web UI
   */
  @Get('meta/pages')
  @Roles('admin', 'editor', 'viewer')
  async listMetaPages(@Query('organizationId') organizationId: string, @Res() res: Response) {
    const authOrgId = (res as any)?.req?.user?.orgId || (res as any)?.req?.user?.organizationId;
    if (authOrgId && organizationId && authOrgId !== organizationId) {
      return { pages: [], error: 'org_mismatch' };
    }
    const userId = (res as any)?.req?.user?.sub || (res as any)?.req?.user?.userId;
    if (!userId) return { pages: [], error: 'unauthorized' };
    
    try {
      console.log(`🔍 Getting Meta pages for user: ${userId}`);
      const token = await this.tokenService.getUserAccessToken(userId, 'meta');
      if (!token) {
        console.log('❌ No Meta token found for user:', userId);
        return { pages: [], error: 'no_token' };
      }
      
      console.log('✅ Meta token found, calling Facebook Graph API...');
      // Add timeout to prevent hanging
      const pagesPromise = this.metaClient.getUserPages(token.accessToken);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Facebook API timeout after 15 seconds')), 15000)
      );
      
      const pages = await Promise.race([pagesPromise, timeoutPromise]) as any;
      console.log(`✅ Successfully fetched ${pages.length} Facebook pages`);
      return { pages };
    } catch (error) {
      console.error('❌ Error fetching Meta pages:', error);
      return { pages: [], error: error.message || 'Failed to fetch pages' };
    }
  }

  /**
   * Select a Meta page and persist as a social account with page token
   */
  @Post('meta/pages/select')
  @Roles('admin', 'editor')
  async selectMetaPage(
    @Body() body: { organizationId?: string; pageId: string; name: string; pageAccessToken?: string },
    @Res() res: Response
  ) {
    const { organizationId, pageId, name, pageAccessToken } = body;
    const authUserId = (res as any)?.req?.user?.sub || (res as any)?.req?.user?.userId;
    const authOrgId = (res as any)?.req?.user?.orgId || (res as any)?.req?.user?.organizationId;
    if (!authUserId) return { success: false, error: 'unauthorized' };
    if (organizationId && authOrgId && organizationId !== authOrgId) {
      return { success: false, error: 'org_mismatch' };
    }

    // If pageAccessToken not provided by UI, fetch user token and resolve page token from provider payload
    let tokenToSave = pageAccessToken;
    if (!tokenToSave) {
      const userToken = await this.tokenService.getUserAccessToken(authUserId, 'meta');
      if (!userToken) return { success: false, error: 'no_user_token' };
      // Fetch pages and locate this page's access token
      const pages = await this.metaClient.getUserPages(userToken.accessToken);
      const page = pages.find(p => p.id === pageId);
      if (!page?.accessToken) return { success: false, error: 'page_token_not_found' };
      tokenToSave = page.accessToken;
    }

    const socialAccountId = await this.dbService.upsertSocialAccount(
      authUserId,
      'FACEBOOK',
      pageId,
      name,
    );
    await this.dbService.insertToken(
      socialAccountId,
      encryptToken(tokenToSave),
      null,
      null,
      'pages_manage_posts pages_read_engagement pages_manage_metadata instagram_basic instagram_content_publish'
    );

    // Best-effort webhook subscription
    try {
      const callbackUrl = process.env.META_WEBHOOK_CALLBACK_URL || '';
      if (callbackUrl && tokenToSave) {
        await this.metaClient.subscribePageWebhook(pageId, tokenToSave, callbackUrl);
      }
    } catch {}

    return { success: true, socialAccountId };
  }

  /**
   * List Instagram business accounts connected to a Facebook page
   */
  @Get('meta/instagram/accounts')
  @Roles('admin', 'editor', 'viewer')
  async listInstagramAccounts(@Query('pageId') pageId: string, @Query('organizationId') organizationId: string | undefined, @Res() res: Response) {
    if (!pageId) return { accounts: [], error: 'missing_pageId' };
    const authOrgId = (res as any)?.req?.user?.orgId || (res as any)?.req?.user?.organizationId;
    if (authOrgId && organizationId && authOrgId !== organizationId) {
      return { accounts: [], error: 'org_mismatch' };
    }
    const userId = (res as any)?.req?.user?.sub || (res as any)?.req?.user?.userId;
    if (!userId) return { accounts: [], error: 'unauthorized' };

    // Resolve page access token either from selection or from provider
    const userToken = await this.tokenService.getUserAccessToken(userId, 'meta');
    if (!userToken) return { accounts: [], error: 'no_user_token' };
    const pages = await this.metaClient.getUserPages(userToken.accessToken);
    const page = pages.find(p => p.id === pageId);
    if (!page?.accessToken) return { accounts: [], error: 'page_token_not_found' };

    const accounts = await this.metaClient.getInstagramAccounts(page.accessToken, pageId);
    return { accounts };
  }

  /**
   * Select an Instagram business account for a given page and persist it
   */
  @Post('meta/instagram/select')
  @Roles('admin', 'editor')
  async selectInstagramAccount(
    @Body() body: { organizationId?: string; pageId: string; instagramAccountId: string; username?: string },
    @Res() res: Response
  ) {
    const { organizationId, pageId, instagramAccountId, username } = body;
    if (!pageId || !instagramAccountId) return { success: false, error: 'missing_params' };
    const authUserId = (res as any)?.req?.user?.sub || (res as any)?.req?.user?.userId;
    const authOrgId = (res as any)?.req?.user?.orgId || (res as any)?.req?.user?.organizationId;
    if (!authUserId) return { success: false, error: 'unauthorized' };
    if (organizationId && authOrgId && organizationId !== authOrgId) {
      return { success: false, error: 'org_mismatch' };
    }

    // Resolve page access token to associate with IG account
    const userToken = await this.tokenService.getUserAccessToken(authUserId, 'meta');
    if (!userToken) return { success: false, error: 'no_user_token' };
    const pages = await this.metaClient.getUserPages(userToken.accessToken);
    const page = pages.find(p => p.id === pageId);
    if (!page?.accessToken) return { success: false, error: 'page_token_not_found' };

    // Persist IG account as separate social account
    const socialAccountId = await this.dbService.upsertSocialAccount(
      authUserId,
      'INSTAGRAM',
      instagramAccountId,
      username || `instagram_${instagramAccountId}`,
    );
    await this.dbService.insertToken(
      socialAccountId,
      encryptToken(page.accessToken),
      null,
      null,
      'instagram_basic instagram_content_publish'
    );
    return { success: true, socialAccountId };
  }
  /**
   * List LinkedIn companies for current user (proxy provider)
   */
  @Get('linkedin/companies')
  @Roles('admin', 'editor', 'viewer')
  async listLinkedInCompanies(@Query('organizationId') organizationId: string, @Res() res: Response) {
    const authOrgId = (res as any)?.req?.user?.orgId || (res as any)?.req?.user?.organizationId;
    if (authOrgId && organizationId && authOrgId !== organizationId) {
      return { companies: [], error: 'org_mismatch' };
    }
    const userId = (res as any)?.req?.user?.sub || (res as any)?.req?.user?.userId;
    if (!userId) return { companies: [], error: 'unauthorized' };
    const token = await this.tokenService.getUserAccessToken(userId, 'linkedin');
    if (!token) return { companies: [], error: 'no_token' };
    const companies = await this.linkedinClient.getUserCompanies(token.accessToken);
    return { companies };
  }

  /**
   * Select a LinkedIn company and persist as a social account
   */
  @Post('linkedin/companies/select')
  @Roles('admin', 'editor')
  async selectLinkedInCompany(
    @Body() body: { organizationId?: string; companyId: string; name: string },
    @Res() res: Response
  ) {
    const { organizationId, companyId, name } = body;
    const authUserId = (res as any)?.req?.user?.sub || (res as any)?.req?.user?.userId;
    const authOrgId = (res as any)?.req?.user?.orgId || (res as any)?.req?.user?.organizationId;
    if (!authUserId) return { success: false, error: 'unauthorized' };
    if (organizationId && authOrgId && organizationId !== authOrgId) {
      return { success: false, error: 'org_mismatch' };
    }

    // Use current user's LinkedIn token
    const token = await this.tokenService.getUserAccessToken(authUserId, 'linkedin');
    if (!token) return { success: false, error: 'no_user_token' };

    const socialAccountId = await this.dbService.upsertSocialAccount(
      authUserId,
      'LINKEDIN',
      companyId,
      name,
    );
    await this.dbService.insertToken(
      socialAccountId,
      encryptToken(token.accessToken),
      null,
      null,
      'r_organization_social w_organization_social rw_organization_admin'
    );
    return { success: true, socialAccountId };
  }
}
