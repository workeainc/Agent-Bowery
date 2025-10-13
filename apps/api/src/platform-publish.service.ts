import { Injectable, Logger } from '@nestjs/common';
import { TokenService } from './token.service';
import { DbService } from './db.service';
import { MetaClientService } from './platforms/meta/meta-client.service';
import { LinkedInClientService } from './platforms/linkedin/linkedin-client.service';
import { MediaProcessingService } from './services/media-processing.service';
import { TemplateTuningService } from './services/template-tuning.service';
import axios, { AxiosResponse, AxiosError } from 'axios';

export interface PublishResult {
  success: boolean;
  providerId?: string;
  error?: string;
  retryAfter?: number;
  statusCode?: number;
}

export interface PublishJobData {
  contentItemId: string;
  platform: string;
  scheduledAt: string;
  scheduleId?: string;
  organizationId?: string;
  adaptedContent?: any;
  mediaUrls?: string[];
}

@Injectable()
export class PlatformPublishService {
  private readonly logger = new Logger(PlatformPublishService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly dbService: DbService,
    private readonly metaClient: MetaClientService,
    private readonly linkedinClient: LinkedInClientService,
    private readonly mediaService: MediaProcessingService,
    private readonly templateTuning: TemplateTuningService,
  ) {}

  async publishToPlatform(jobData: PublishJobData): Promise<PublishResult> {
    const { contentItemId, platform, adaptedContent, mediaUrls = [], scheduleId, organizationId } = jobData;
    
    try {
      // Idempotency: check if already published for this schedule
      if (scheduleId) {
        const schedule = await this.dbService.getContentSchedules(contentItemId);
        const current = (schedule || []).find((s: any) => s.id === scheduleId);
        if (current && current.status === 'published') {
          this.logger.log(`Skip publish: already published schedule ${scheduleId}`);
          return { success: true, providerId: current.provider_id, statusCode: 200 };
        }
      }

      // Ensure token context scoped per org when provided
      if (organizationId && (this.tokenService as any).setOrgId) {
        (this.tokenService as any).setOrgId(organizationId);
      }

      // Per-org dry run override
      let isDryRun = process.env.DRY_RUN === 'true';
      if (organizationId && (this.dbService as any).getAutopostSettings) {
        try {
          const settings = await (this.dbService as any).getAutopostSettings(organizationId);
          if (settings && typeof settings.dry_run === 'boolean') {
            isDryRun = settings.dry_run;
          }
          // If autopost is disabled and not dry_run, treat as dry-run (simulate but don't post)
          if (settings && settings.autopost_enabled === false) {
            isDryRun = true;
          }
        } catch {}
      }

      // Get valid access token
      const tokenInfo = await this.tokenService.getValidAccessToken(platform.toLowerCase() as any);
      if (!tokenInfo) {
        return { success: false, error: 'No valid token available' };
      }

      // Get content details
      const content = await this.dbService.getContentItem(contentItemId);
      const currentVersion = await this.dbService.getCurrentContentVersion(contentItemId);
      
      if (!content || !currentVersion) {
        return { success: false, error: 'Content not found' };
      }

      // Platform-specific publishing
      switch (platform.toUpperCase()) {
        case 'FACEBOOK':
          if (isDryRun) { this.logger.log('[DRY_RUN] Facebook publish skipped'); return { success: true, providerId: 'dry_run_facebook', statusCode: 200 }; }
          return await this.publishToFacebookReal(tokenInfo.accessToken, adaptedContent || currentVersion, mediaUrls, contentItemId);
        case 'INSTAGRAM':
          if (isDryRun) { this.logger.log('[DRY_RUN] Instagram publish skipped'); return { success: true, providerId: 'dry_run_instagram', statusCode: 200 }; }
          return await this.publishToInstagramReal(tokenInfo.accessToken, adaptedContent || currentVersion, mediaUrls, contentItemId);
        case 'LINKEDIN':
          if (isDryRun) { this.logger.log('[DRY_RUN] LinkedIn publish skipped'); return { success: true, providerId: 'dry_run_linkedin', statusCode: 200 }; }
          return await this.publishToLinkedInReal(tokenInfo.accessToken, adaptedContent || currentVersion, mediaUrls, contentItemId);
        case 'YOUTUBE':
          if (isDryRun) { this.logger.log('[DRY_RUN] YouTube publish skipped'); return { success: true, providerId: 'dry_run_youtube', statusCode: 200 }; }
          return await this.publishToYouTube(tokenInfo.accessToken, adaptedContent || currentVersion, mediaUrls);
        case 'GBP':
          if (isDryRun) { this.logger.log('[DRY_RUN] Google Business publish skipped'); return { success: true, providerId: 'dry_run_gbp', statusCode: 200 }; }
          return await this.publishToGoogleBusiness(tokenInfo.accessToken, adaptedContent || currentVersion, mediaUrls);
        default:
          return { success: false, error: `Unsupported platform: ${platform}` };
      }
    } catch (error: any) {
      this.logger.error(`Publish error for ${platform}:`, error);
      // Surface retry-after to worker for adaptive backoff
      if (error && error.retryAfter) {
        (error as any).retryAfterSeconds = error.retryAfter;
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async publishToFacebookReal(accessToken: string, content: any, mediaUrls: string[], contentItemId: string): Promise<PublishResult> {
    try {
      if (process.env.DRY_RUN === 'true') {
        this.logger.log('[DRY_RUN] Facebook publish skipped');
        return { success: true, providerId: 'dry_run_facebook', statusCode: 200 };
      }
      // Get user's Facebook pages
      const pages = await this.metaClient.getUserPages(accessToken);
      if (pages.length === 0) {
        return { success: false, error: 'No Facebook pages found for this account' };
      }

      const page = pages[0]; // Use first page for now
      
      let result: any;
      
      if (mediaUrls.length > 0) {
        // Download and process image
        const imageResponse = await axios.get(mediaUrls[0], { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data);
        const processedImage = await this.mediaService.processImage(imageBuffer, 'facebook');
        
        // Upload photo with caption
        result = await this.metaClient.uploadFacebookPhoto(page.id, page.accessToken, processedImage.buffer, content.body);
      } else {
        // Text-only post
        result = await this.metaClient.publishFacebookPost(page.id, page.accessToken, {
          message: content.body
        });
      }

      if (result.success) {
        // Record metrics for successful publish (simulated for now)
        await this.recordPublishMetrics(contentItemId, 'FACEBOOK', result.postId, content);
        
        return {
          success: true,
          providerId: result.postId,
          statusCode: 200,
        };
      } else {
        return {
          success: false,
          error: result.error,
          statusCode: 400,
        };
      }
    } catch (error) {
      return this.handleProviderError(error, 'Facebook');
    }
  }

  private async publishToInstagramReal(accessToken: string, content: any, mediaUrls: string[], contentItemId: string): Promise<PublishResult> {
    try {
      if (process.env.DRY_RUN === 'true') {
        this.logger.log('[DRY_RUN] Instagram publish skipped');
        return { success: true, providerId: 'dry_run_instagram', statusCode: 200 };
      }
      // Get user's Facebook pages first
      const pages = await this.metaClient.getUserPages(accessToken);
      if (pages.length === 0) {
        return { success: false, error: 'No Facebook pages found for this account' };
      }

      const page = pages[0];
      
      // Get Instagram accounts connected to this page
      const instagramAccounts = await this.metaClient.getInstagramAccounts(page.accessToken, page.id);
      if (instagramAccounts.length === 0) {
        return { success: false, error: 'No Instagram business accounts found for this page' };
      }

      const instagramAccount = instagramAccounts[0];
      
      // Determine content type and handle accordingly
      const mediaType = content.metadata?.mediaType || 'photo';
      let result: any;

      switch (mediaType) {
        case 'story':
          if (mediaUrls.length === 0) {
            return { success: false, error: 'Instagram stories require media (image or video)' };
          }
          result = await this.metaClient.publishInstagramStory(
            instagramAccount.id,
            page.accessToken,
            {
              message: content.body,
              imageUrl: mediaUrls[0],
              videoUrl: mediaUrls[0],
              storyBackground: content.metadata?.storyBackground,
              storyStickers: content.metadata?.storyStickers
            }
          );
          break;

        case 'reel':
          if (mediaUrls.length === 0) {
            return { success: false, error: 'Instagram reels require video' };
          }
          result = await this.metaClient.publishInstagramReel(
            instagramAccount.id,
            page.accessToken,
            {
              message: content.body,
              videoUrl: mediaUrls[0],
              reelMusic: content.metadata?.reelMusic,
              reelEffects: content.metadata?.reelEffects
            }
          );
          break;

        case 'igtv':
          if (mediaUrls.length === 0) {
            return { success: false, error: 'Instagram IGTV requires video' };
          }
          result = await this.metaClient.publishInstagramIGTV(
            instagramAccount.id,
            page.accessToken,
            {
              message: content.body,
              videoUrl: mediaUrls[0],
              igtvTitle: content.metadata?.igtvTitle,
              igtvDescription: content.metadata?.igtvDescription
            }
          );
          break;

        case 'carousel':
          if (mediaUrls.length < 2) {
            return { success: false, error: 'Instagram carousel requires at least 2 images' };
          }
          result = await this.metaClient.publishInstagramCarousel(
            instagramAccount.id,
            page.accessToken,
            {
              message: content.body,
              carouselUrls: mediaUrls
            }
          );
          break;

        case 'photo':
        default:
          if (mediaUrls.length === 0) {
            return { success: false, error: 'Instagram posts require media (image or video)' };
          }
          // Download and process image for Instagram
          const imageResponse = await axios.get(mediaUrls[0], { responseType: 'arraybuffer' });
          const imageBuffer = Buffer.from(imageResponse.data);
          const processedImage = await this.mediaService.processImage(imageBuffer, 'instagram');
          
          result = await this.metaClient.uploadInstagramPhoto(
            instagramAccount.id, 
            page.accessToken, 
            processedImage.buffer, 
            content.body
          );
          break;
      }

      if (result.success) {
        // Record metrics for successful publish (simulated for now)
        await this.recordPublishMetrics(contentItemId, 'INSTAGRAM', result.postId, content);
        
        return {
          success: true,
          providerId: result.postId,
          statusCode: 200,
        };
      } else {
        return {
          success: false,
          error: result.error,
          statusCode: 400,
        };
      }
    } catch (error) {
      return this.handleProviderError(error, 'Instagram');
    }
  }

  private async publishToLinkedInReal(accessToken: string, content: any, mediaUrls: string[], contentItemId: string): Promise<PublishResult> {
    try {
      if (process.env.DRY_RUN === 'true') {
        this.logger.log('[DRY_RUN] LinkedIn publish skipped');
        return { success: true, providerId: 'dry_run_linkedin', statusCode: 200 };
      }
      // Get user's LinkedIn companies
      const companies = await this.linkedinClient.getUserCompanies(accessToken);
      if (companies.length === 0) {
        return { success: false, error: 'No LinkedIn companies found for this account' };
      }

      const company = companies[0]; // Use first company for now
      
      let result: any;
      
      if (mediaUrls.length > 0) {
        // Download and process image
        const imageResponse = await axios.get(mediaUrls[0], { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data);
        const processedImage = await this.mediaService.processImage(imageBuffer, 'linkedin');
        
        // Upload image post
        result = await this.linkedinClient.publishImagePost(company.id, accessToken, processedImage.buffer, content.body);
      } else {
        // Text-only post
        result = await this.linkedinClient.publishCompanyPost(company.id, accessToken, {
          text: content.body,
          visibility: 'PUBLIC'
        });
      }

      if (result.success) {
        // Record metrics for successful publish (simulated for now)
        await this.recordPublishMetrics(contentItemId, 'LINKEDIN', result.postId, content);
        
        return {
          success: true,
          providerId: result.postId,
          statusCode: 200,
        };
      } else {
        return {
          success: false,
          error: result.error,
          statusCode: 400,
        };
      }
    } catch (error) {
      return this.handleProviderError(error, 'LinkedIn');
    }
  }

  private async publishToYouTube(accessToken: string, content: any, mediaUrls: string[]): Promise<PublishResult> {
    try {
      if (process.env.DRY_RUN === 'true') {
        this.logger.log('[DRY_RUN] YouTube publish skipped');
        return { success: true, providerId: 'dry_run_youtube', statusCode: 200 };
      }
      // YouTube requires video upload, so this is a placeholder for video metadata
      const response = await axios.post(
        'https://www.googleapis.com/youtube/v3/videos',
        {
          snippet: {
            title: content.title,
            description: content.body,
            tags: content.tags || [],
          },
          status: {
            privacyStatus: 'public',
          },
        },
        {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      return {
        success: true,
        providerId: response.data.id,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleProviderError(error, 'YouTube');
    }
  }

  private async publishToGoogleBusiness(accessToken: string, content: any, mediaUrls: string[]): Promise<PublishResult> {
    try {
      if (process.env.DRY_RUN === 'true') {
        this.logger.log('[DRY_RUN] Google Business publish skipped');
        return { success: true, providerId: 'dry_run_gbp', statusCode: 200 };
      }
      const response = await axios.post(
        'https://mybusiness.googleapis.com/v4/accounts/ACCOUNT_ID/locations/LOCATION_ID/posts',
        {
          summary: content.title,
          callToAction: {
            actionType: 'LEARN_MORE',
            url: mediaUrls[0] || 'https://example.com',
          },
        },
        {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      return {
        success: true,
        providerId: response.data.name,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleProviderError(error, 'Google Business');
    }
  }

  private handleProviderError(error: any, platform: string): PublishResult {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;
      const retryAfter = this.parseRetryAfter(axiosError.response?.headers);

      // Handle 429 specifically
      if (statusCode === 429) {
        this.logger.warn(`${platform} rate limited. Retry after: ${retryAfter}s`);
        return {
          success: false,
          error: 'Rate limited',
          retryAfter,
          statusCode,
        };
      }

      // Handle 401 - token refresh needed
      if (statusCode === 401) {
        this.logger.warn(`${platform} token expired. Triggering refresh.`);
        return {
          success: false,
          error: 'Token expired',
          statusCode,
        };
      }

      // Other errors
      const data: any = axiosError.response?.data || {};
      const errorMessage = (data && typeof data === 'object' ? (data.error?.message || data.message) : undefined) || 
                          axiosError.message || 
                          'Unknown error';
      
      this.logger.error(`${platform} publish failed (${statusCode}):`, errorMessage);
      return {
        success: false,
        error: errorMessage,
        statusCode,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  private parseRetryAfter(headers: any): number | undefined {
    if (!headers) return undefined;
    
    const retryAfter = headers['retry-after'] || headers['Retry-After'];
    if (!retryAfter) return undefined;

    const seconds = parseInt(retryAfter, 10);
    return isNaN(seconds) ? undefined : seconds;
  }

  async recordPublishOutcome(
    scheduleId: string, 
    result: PublishResult, 
    jobId: string,
    duration: number
  ): Promise<void> {
    try {
      const status = result.success ? 'published' : 'failed';
      const errorMessage = result.success ? undefined : (result.error || undefined);
      
      // Update schedule status
      await this.dbService.updateScheduleStatus(scheduleId, status, {
        providerId: result.providerId,
        errorMessage,
        jobId,
        duration,
        statusCode: result.statusCode,
        retryAfter: result.retryAfter,
      });

      this.logger.log(`Recorded publish outcome for schedule ${scheduleId}: ${status}`);
    } catch (error) {
      this.logger.error(`Failed to record publish outcome:`, error);
    }
  }

  /**
   * Record metrics for a successfully published post
   * This simulates engagement data - in production, this would come from platform webhooks
   */
  private async recordPublishMetrics(contentItemId: string, platform: string, providerId: string, content: any): Promise<void> {
    try {
      // Get template version ID from content metadata
      const templateVersionId = content.metadata?.template_version_id || content.metadata?.templateId;
      
      // Simulate engagement metrics (in production, these would come from platform APIs/webhooks)
      const simulatedMetrics = {
        impressions: Math.floor(Math.random() * 1000) + 100, // 100-1100 impressions
        clicks: Math.floor(Math.random() * 50) + 5, // 5-55 clicks
        reactions: Math.floor(Math.random() * 100) + 10, // 10-110 reactions
        comments: Math.floor(Math.random() * 20) + 2, // 2-22 comments
        shares: Math.floor(Math.random() * 15) + 1, // 1-16 shares
        ctr: Math.random() * 0.1 + 0.02, // 2-12% CTR
      };

      // Record the metrics
      await this.templateTuning.recordPostMetrics({
        contentItemId,
        platform,
        templateVersionId,
        metrics: simulatedMetrics,
        postedAt: new Date(),
      });

      this.logger.log(`Recorded simulated metrics for ${platform} post ${providerId}: ${JSON.stringify(simulatedMetrics)}`);
    } catch (error) {
      this.logger.error(`Failed to record publish metrics:`, error);
    }
  }
}
