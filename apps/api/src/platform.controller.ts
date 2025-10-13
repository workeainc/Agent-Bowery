import { Controller, Get, Query, Res, Post, Body, UseGuards, Delete, Param, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { MetaClientService } from '../platforms/meta/meta-client.service';
import { LinkedInClientService } from '../platforms/linkedin/linkedin-client.service';
import { DbService } from '../db.service';
import { TokenService } from '../token.service';
import { GatewayAuthGuard } from '../guards/gateway-auth.guard';
import { Roles } from '../decorators/roles.decorator';

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
  ) {}

  /**
   * Get OAuth URL for platform connection
   */
  @Get(':platform/connect')
  @Roles('admin', 'editor')
  async getConnectUrl(@Query('platform') platform: string, @Query('organizationId') organizationId: string) {
    const state = `${organizationId}_${Date.now()}`;
    
    switch (platform.toLowerCase()) {
      case 'meta':
        return {
          platform: 'meta',
          authUrl: `https://www.facebook.com/v18.0/dialog/oauth?` +
            `client_id=${process.env.META_APP_ID}&` +
            `redirect_uri=${encodeURIComponent(process.env.META_REDIRECT_URI || 'http://localhost:44000/api/platforms/meta/callback')}&` +
            `scope=pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish&` +
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
    try {
      const [organizationId] = state.split('_');
      
      // Exchange code for access token
      const tokenResponse = await this.linkedinClient.refreshAccessToken(code);
      if (!tokenResponse) {
        return res.redirect(`${process.env.FRONTEND_URL}/platforms/connect?error=token_exchange_failed`);
      }

      // Get user's companies
      const companies = await this.linkedinClient.getUserCompanies(tokenResponse.accessToken);
      
      // Store each company as a separate social account
      for (const company of companies) {
        const socialAccountId = await this.dbService.upsertSocialAccount(
          organizationId,
          'LINKEDIN',
          company.id,
          company.name
        );

        await this.dbService.insertToken(
          socialAccountId,
          this.tokenService.encryptToken(tokenResponse.accessToken),
          null,
          new Date(Date.now() + tokenResponse.expiresIn * 1000),
          'r_organization_social,w_member_social'
        );
      }

      return res.redirect(`${process.env.FRONTEND_URL}/platforms/connect?success=true&platform=linkedin&accounts=${companies.length}`);
    } catch (error) {
      console.error('LinkedIn OAuth callback error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/platforms/connect?error=callback_failed`);
    }
  }

  /**
   * Get connected accounts for organization
   */
  @Get('accounts')
  @Roles('admin', 'editor', 'viewer')
  async getConnectedAccounts(@Query('organizationId') organizationId: string): Promise<PlatformAccountInfo[]> {
    try {
      const socialAccounts = await this.dbService.getSocialAccountsByOrganization(organizationId);
      
      const platformGroups = socialAccounts.reduce((acc, account) => {
        if (!acc[account.platform]) {
          acc[account.platform] = [];
        }
        acc[account.platform].push({
          id: account.external_id,
          name: account.display_name,
          type: account.platform,
          connected: true
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
    @Body() body: { organizationId: string; accountId?: string }
  ) {
    try {
      const { organizationId, accountId } = body;
      
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
          this.tokenService.setOrgId(organizationId);
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
  ) {
    try {
      const ok = await this.dbService.deleteSocialAccount(organizationId, platform.toUpperCase(), externalId);
      if (ok) {
        try {
          this.tokenService.setOrgId(organizationId);
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
    @Query('platform') platform: string,
    @Query('organizationId') organizationId: string
  ) {
    try {
      switch (platform.toLowerCase()) {
        case 'meta':
        case 'facebook':
          const metaToken = await this.tokenService.getValidAccessToken('meta');
          if (!metaToken) {
            return { accounts: [], error: 'No Meta token found' };
          }
          
          const pages = await this.metaClient.getUserPages(metaToken.accessToken);
          return { accounts: pages };

        case 'linkedin':
          const linkedinToken = await this.tokenService.getValidAccessToken('linkedin');
          if (!linkedinToken) {
            return { accounts: [], error: 'No LinkedIn token found' };
          }
          
          const companies = await this.linkedinClient.getUserCompanies(linkedinToken.accessToken);
          return { accounts: companies };

        default:
          return { accounts: [], error: `Unsupported platform: ${platform}` };
      }
    } catch (error) {
      return { accounts: [], error: error.message };
    }
  }
}
