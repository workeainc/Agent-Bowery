import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { TokenService } from './token.service';

@Controller('tokens')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get(':provider/status')
  async getTokenStatus(@Param('provider') provider: string) {
    const result = await this.tokenService.getValidAccessToken(provider as any);
    if (!result) {
      return { 
        ok: false, 
        provider, 
        message: 'No token found for this provider' 
      };
    }
    
    return {
      ok: true,
      provider,
      hasToken: true,
      isDummy: result.dummy,
      tokenPreview: result.accessToken.substring(0, 20) + '...'
    };
  }

  @Post(':provider/refresh')
  async refreshToken(@Param('provider') provider: string, @Body() body: any) {
    const oldToken = body?.oldToken || 'test_token';
    const newToken = await this.tokenService.handleTokenRefresh(provider as any, oldToken);
    
    if (newToken) {
      return {
        ok: true,
        provider,
        message: 'Token refreshed successfully',
        newTokenPreview: newToken.substring(0, 20) + '...'
      };
    } else {
      return {
        ok: false,
        provider,
        message: 'Token refresh failed'
      };
    }
  }

  @Get('audit/:provider')
  async getTokenAudit(@Param('provider') provider: string) {
    // This would query the audit table in a real implementation
    return {
      ok: true,
      provider,
      message: 'Audit endpoint - would return token exchange history',
      note: 'Check logs for audit entries'
    };
  }
}
