import { Body, Controller, Get, Param, Post, Put, Delete, UseGuards, Query, HttpException, HttpStatus, Req } from '@nestjs/common';
import { DbService } from './db.service';
import { QueueService } from './queue.service';
import { ContentAdaptationService } from './content-adaptation.service';
import { ContentApprovalService } from './content-approval.service';
import { GatewayAuthGuard } from './guards/gateway-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { PerplexityService } from './services/perplexity.service';
import { ContentGenerationService } from './services/content-generation.service';
import { AdvancedContentOptimizationService } from './services/advanced-content-optimization.service';
import { ContentPerformanceAnalyticsService } from './services/content-performance-analytics.service';
import { SmartMediaOptimizationService } from './services/smart-media-optimization.service';
import { AdvancedWorkflowRulesService } from './services/advanced-workflow-rules.service';
import { NotificationService } from './services/notification.service';
import { SmartSchedulingService } from './services/smart-scheduling.service';
import { BatchGenerationService } from './services/batch-generation.service';
import { PipelineMonitoringService } from './services/pipeline-monitoring.service';

export interface CreateContentDto {
  title: string;
  type: 'BLOG' | 'NEWSLETTER' | 'SOCIAL_POST';
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreateVersionDto {
  body: string;
  title?: string;
  summary?: string;
  mediaUrls?: string[];
  metadata?: Record<string, any>;
}

export interface ScheduleContentDto {
  platform: string;
  scheduledAt: string;
  mediaUrls?: string[];
  adaptedContent?: any;
}

export interface ApproveContentDto {
  approvedBy: string;
  notes?: string;
}

@UseGuards(GatewayAuthGuard, RolesGuard)
@Controller('content')
export class ContentController {
  constructor(
    private readonly dbService: DbService,
    private readonly queueService: QueueService,
    private readonly contentAdaptationService: ContentAdaptationService,
    private readonly contentApprovalService: ContentApprovalService,
    private readonly perplexity: PerplexityService,
    private readonly contentGeneration: ContentGenerationService,
    private readonly contentOptimization: AdvancedContentOptimizationService,
    private readonly performanceAnalytics: ContentPerformanceAnalyticsService,
    private readonly mediaOptimization: SmartMediaOptimizationService,
    private readonly workflowRules: AdvancedWorkflowRulesService,
    private readonly notificationService: NotificationService,
    private readonly smartScheduling: SmartSchedulingService,
    private readonly batchGeneration: BatchGenerationService,
    private readonly pipelineMonitoring: PipelineMonitoringService,
  ) {}

  private extractOrganizationId(req: any): string {
    const orgId = req?.user?.orgId || req?.user?.organizationId || req?.user?.sub;
    if (!orgId) {
      throw new HttpException('Organization context required', HttpStatus.BAD_REQUEST);
    }
    return orgId;
  }

  @Post('generate')
  @Roles('editor', 'admin')
  async generateContent(@Body() body: { organizationId?: string; channel?: string; kind: 'BLOG'|'NEWSLETTER'|'SOCIAL'; brief: string; angle?: string; title?: string }, @Req() req: any) {
    try {
      const organizationId = body.organizationId || this.extractOrganizationId(req);
      const channel = body.channel || 'default';

      // Validate input
      if (!body.brief || body.brief.trim().length === 0) {
        throw new HttpException('Brief is required for content generation', HttpStatus.BAD_REQUEST);
      }

      if (!['BLOG', 'NEWSLETTER', 'SOCIAL'].includes(body.kind)) {
        throw new HttpException('Invalid content kind. Must be BLOG, NEWSLETTER, or SOCIAL', HttpStatus.BAD_REQUEST);
      }

      // Generate content using the AI pipeline
      const result = await this.contentGeneration.generatePost({
        kind: body.kind,
        brief: body.brief,
        angle: body.angle,
        organizationId,
        channel,
        platform: body.kind === 'SOCIAL' ? 'FACEBOOK' : undefined // Default platform for social
      });

      // Create content item
      const title = body.title || body.brief.substring(0, 100) + (body.brief.length > 100 ? '...' : '');
      const contentItemId = await this.dbService.createContentItem(
        organizationId,
        title,
        body.kind === 'SOCIAL' ? 'SOCIAL_POST' : body.kind,
        'DRAFT',
        [],
        { 
          channel, 
          brief: body.brief, 
          angle: body.angle,
          generated: true,
          generationMetadata: {
            sources: result.sources,
            factCheckResults: result.factCheck
          }
        },
        'system' // TODO: Get from auth context
      );

      // Create version with generated content
      const generatedContent = result.draft?.answer || result.draft?.data || '';
      const generatedOutline = result.outline?.answer || result.outline?.data || '';
      
      // Handle social content metadata
      const socialMetadata = result.socialMetadata || {};
      
      const versionId = await this.dbService.createContentVersion(
        contentItemId,
        generatedContent,
        title,
        generatedOutline,
        result.citations || [],
        { 
          citations: result.citations || [],
          factCheck: result.factCheck,
          sources: result.sources,
          outline: generatedOutline,
          socialMetadata,
          generationMetadata: {
            promptTemplates: {
              outline: result.outline?.template || 'default',
              draft: result.draft?.template || 'default'
            },
            platform: socialMetadata.platform,
            characterCount: socialMetadata.characterCount,
            hashtags: socialMetadata.hashtags
          }
        }
      );

      await this.dbService.setCurrentContentVersion(contentItemId, versionId);

      return {
        success: true,
        contentItemId,
        versionId,
        organizationId,
        channel,
        status: 'DRAFT',
        generatedContent: {
          outline: generatedOutline,
          draft: generatedContent,
          citations: result.citations,
          sources: result.sources,
          factCheck: result.factCheck,
          socialMetadata: socialMetadata,
          brandValidation: result.brandValidation
        }
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Handle specific error types
      if (error.message?.includes('template')) {
        throw new HttpException('Template not found for content generation', HttpStatus.NOT_FOUND);
      }
      
      if (error.message?.includes('perplexity') || error.message?.includes('API')) {
        throw new HttpException('AI service temporarily unavailable', HttpStatus.SERVICE_UNAVAILABLE);
      }
      
      if (error.message?.includes('validation')) {
        throw new HttpException('Content generation validation failed', HttpStatus.BAD_REQUEST);
      }

      // Log unexpected errors
      console.error('Content generation error:', error);
      throw new HttpException('Content generation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @Roles('editor', 'admin')
  async createContent(@Body() createContentDto: CreateContentDto, @Req() req: any) {
    const orgId = this.extractOrganizationId(req);
    const { title, type, status = 'DRAFT', tags = [], metadata = {} } = createContentDto;
    
    const contentItemId = await this.dbService.createContentItem(
      orgId,
      title,
      type,
      status,
      tags,
      metadata,
      req.user?.sub || 'system'
    );
    
    return {
      message: 'Content item created successfully',
      contentItemId,
      title,
      type,
      status
    };
  }

  @Get()
  @Roles('editor', 'admin', 'viewer')
  async getContentItems(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Req() req: any
  ) {
    const orgId = this.extractOrganizationId(req);
    const contentItems = await this.dbService.getContentItems(
      orgId,
      status,
      type,
      parseInt(page),
      parseInt(limit)
    );
    
    const totalCount = await this.dbService.getContentItemCount(
      orgId,
      status,
      type
    );
    
    return {
      contentItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    };
  }

  @Get(':id')
  @Roles('editor', 'admin', 'viewer')
  async getContent(@Param('id') contentItemId: string) {
    const content = await this.dbService.getContentItem(contentItemId);
    if (!content) {
      throw new HttpException('Content item not found', HttpStatus.NOT_FOUND);
    }
    
    const versions = await this.dbService.getContentVersions(contentItemId);
    const currentVersion = await this.dbService.getCurrentContentVersion(contentItemId);
    const schedules = await this.dbService.getContentSchedules(contentItemId);
    
    return {
      content,
      versions,
      currentVersion,
      schedules,
      totalVersions: versions.length,
      totalSchedules: schedules.length
    };
  }

  @Put(':id')
  @Roles('editor', 'admin')
  async updateContent(@Param('id') contentItemId: string, @Body() updateData: Partial<CreateContentDto>) {
    const updated = await this.dbService.updateContentItem(contentItemId, updateData);
    if (!updated) {
      throw new HttpException('Content item not found', HttpStatus.NOT_FOUND);
    }
    
    return {
      message: 'Content item updated successfully',
      contentItemId,
      updated
    };
  }

  @Delete(':id')
  @Roles('admin')
  async deleteContent(@Param('id') contentItemId: string) {
    await this.dbService.deleteContentItem(contentItemId);
    
    return {
      message: 'Content item deleted successfully',
      contentItemId
    };
  }

  @Post(':id/version')
  @Roles('editor', 'admin')
  async createVersion(@Param('id') contentItemId: string, @Body() createVersionDto: CreateVersionDto) {
    const { body, title, summary, mediaUrls = [], metadata = {} } = createVersionDto;
    
    // Verify content item exists
    const content = await this.dbService.getContentItem(contentItemId);
    if (!content) {
      throw new HttpException('Content item not found', HttpStatus.NOT_FOUND);
    }
    
    const versionId = await this.dbService.createContentVersion(
      contentItemId,
      body,
      title || content.title,
      summary,
      mediaUrls,
      metadata
    );
    
    return {
      message: 'Content version created successfully',
      contentItemId,
      versionId,
      title: title || content.title
    };
  }

  @Post(':id/version/current')
  @Roles('editor', 'admin')
  async setCurrentVersion(@Param('id') contentItemId: string, @Body() body: { versionId: string }) {
    const { versionId } = body;
    
    const updated = await this.dbService.setCurrentContentVersion(contentItemId, versionId);
    if (!updated) {
      throw new HttpException('Version not found or content item not found', HttpStatus.NOT_FOUND);
    }
    
    return {
      message: 'Current version updated successfully',
      contentItemId,
      versionId
    };
  }

  @Post(':id/approve')
  @Roles('admin')
  async approve(@Param('id') contentItemId: string, @Body() approveDto: ApproveContentDto & { generatePreviews?: boolean; platforms?: string[] }) {
    const { approvedBy, notes, generatePreviews = true, platforms } = approveDto;
    
    const result = await this.contentApprovalService.approveContentWithPreviews({
      contentItemId,
      approvedBy,
      notes,
      generatePreviews,
      platforms,
    });

    if (!result.success) {
      throw new HttpException(result.error || 'Content approval failed', HttpStatus.BAD_REQUEST);
    }
    
    return {
      message: 'Content approved successfully',
      contentItemId,
      approvedBy,
      approvedAt: new Date().toISOString(),
      adaptedPreviews: result.adaptedPreviews,
      previewCount: Object.keys(result.adaptedPreviews || {}).length
    };
  }

  @Post(':id/auto-approve')
  @Roles('admin')
  async autoApprove(@Param('id') contentItemId: string) {
    const result = await this.contentApprovalService.autoApproveIfEligible(contentItemId);
    return result;
  }

  @Post(':id/schedule')
  @Roles('editor', 'admin')
  async schedule(@Param('id') contentItemId: string, @Body() scheduleDto: ScheduleContentDto) {
    const { platform, scheduledAt, mediaUrls = [], adaptedContent } = scheduleDto;
    
    // Verify content item exists and is approved
    const content = await this.dbService.getContentItem(contentItemId);
    if (!content) {
      throw new HttpException('Content item not found', HttpStatus.NOT_FOUND);
    }
    
    if (content.status !== 'APPROVED') {
      throw new HttpException('Content must be approved before scheduling', HttpStatus.BAD_REQUEST);
    }
    
    // Validate platform
    const platforms = this.contentAdaptationService.getAllPlatforms();
    if (!platforms.includes(platform)) {
      throw new HttpException(`Unsupported platform: ${platform}`, HttpStatus.BAD_REQUEST);
    }
    
    // Create schedule record
    const scheduleId = await this.dbService.createSchedule(
      contentItemId,
      platform,
      new Date(scheduledAt),
      mediaUrls,
      adaptedContent
    );
    
    // Enqueue the publish job
    await this.queueService.enqueuePublish({
      contentItemId,
      platform,
      scheduledAt,
      scheduleId,
      // ensure org propagation
      // assumes content.organization_id exists on the fetched content
      // fallback should be handled in QueueService/worker if undefined
      // @ts-ignore
      organizationId: (content as any).organization_id
    });
    
    return {
      message: 'Content scheduled successfully',
      contentItemId,
      platform,
      scheduleId,
      scheduledAt
    };
  }

  @Post(':id/schedule/bulk')
  @Roles('editor', 'admin')
  async bulkSchedule(
    @Param('id') contentItemId: string,
    @Body() body: { items: Array<{ platform: string; scheduledAt: string; mediaUrls?: string[]; adaptedContent?: any }> }
  ) {
    if (!body?.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw new HttpException('No schedule items provided', HttpStatus.BAD_REQUEST);
    }

    const content = await this.dbService.getContentItem(contentItemId);
    if (!content) throw new HttpException('Content item not found', HttpStatus.NOT_FOUND);

    if (content.status !== 'APPROVED') {
      throw new HttpException('Content must be approved before scheduling', HttpStatus.BAD_REQUEST);
    }

    const scheduleIds: string[] = [];
    for (const it of body.items) {
      const scheduleId = await this.dbService.createSchedule(
        contentItemId,
        it.platform,
        new Date(it.scheduledAt),
        it.mediaUrls || [],
        it.adaptedContent
      );
      scheduleIds.push(scheduleId);
      await this.queueService.enqueuePublish({
        contentItemId,
        platform: it.platform,
        scheduledAt: it.scheduledAt,
        scheduleId,
        // @ts-ignore
        organizationId: (content as any).organization_id
      });
    }

    return { message: 'Bulk schedules created', contentItemId, scheduleIds, count: scheduleIds.length };
  }

  @Get(':id/status')
  @Roles('editor', 'admin', 'viewer')
  async getContentStatus(@Param('id') contentItemId: string) {
    const content = await this.dbService.getContentItem(contentItemId);
    if (!content) throw new HttpException('Content item not found', HttpStatus.NOT_FOUND);

    const schedules = await this.dbService.getContentSchedules(contentItemId);
    const currentVersion = await this.dbService.getCurrentContentVersion(contentItemId);

    return {
      contentItemId,
      status: content.status,
      hasCurrentVersion: !!currentVersion,
      schedules: (schedules || []).map((s: any) => ({ id: s.id, platform: s.platform, status: s.status, scheduledAt: s.scheduled_at, providerId: s.provider_id, error: s.error_message }))
    };
  }

  @Post(':id/adapt')
  @Roles('editor', 'admin', 'viewer')
  async adapt(@Param('id') contentItemId: string, @Body() body: { platform: string; mediaUrls?: string[] }) {
    const { platform, mediaUrls = [] } = body;
    
    // Get the current content version
    const currentVersion = await this.dbService.getCurrentContentVersion(contentItemId);
    if (!currentVersion) {
      throw new HttpException('No current version found', HttpStatus.NOT_FOUND);
    }
    
    // Adapt the content
    const adaptedContent = this.contentAdaptationService.adaptContent(
      currentVersion.body,
      platform,
      mediaUrls
    );
    
    // Validate the adapted content
    const validation = this.contentAdaptationService.validateContent(adaptedContent, platform);
    
    return {
      contentItemId,
      platform,
      originalText: currentVersion.body,
      adaptedContent,
      validation,
      adaptedAt: new Date().toISOString()
    };
  }

  @Get('schedules/due')
  @Roles('admin')
  async getDueSchedules() {
    const schedules = await this.dbService.getDueSchedules();
    return { schedules, count: schedules.length };
  }

  @Post('schedules/:scheduleId/queued')
  @Roles('admin')
  async markQueued(@Param('scheduleId') scheduleId: string) {
    await this.dbService.markScheduleQueued(scheduleId);
    return { scheduleId, status: 'queued' };
  }

  @Get('platforms')
  @Roles('editor', 'admin', 'viewer')
  async getPlatforms() {
    const platforms = this.contentAdaptationService.getAllPlatforms();
    const platformRules = platforms.map(platform => ({
      platform,
      rules: this.contentAdaptationService.getPlatformRules(platform)
    }));
    
    return { platforms, platformRules };
  }

  @Get(':id/versions')
  @Roles('editor', 'admin', 'viewer')
  async getContentVersions(@Param('id') contentItemId: string) {
    const versions = await this.dbService.getContentVersions(contentItemId);
    return { contentItemId, versions, count: versions.length };
  }

  @Get(':id/schedules')
  @Roles('editor', 'admin', 'viewer')
  async getContentSchedules(@Param('id') contentItemId: string) {
    const schedules = await this.dbService.getContentSchedules(contentItemId);
    return { contentItemId, schedules, count: schedules.length };
  }

  @Get(':id/previews')
  @Roles('editor', 'admin', 'viewer')
  async getContentPreviews(@Param('id') contentItemId: string) {
    const result = await this.contentApprovalService.getContentPreviews(contentItemId);
    if (result.error) {
      throw new HttpException(result.error, HttpStatus.NOT_FOUND);
    }
    return result;
  }

  @Post(':id/previews/regenerate')
  @Roles('admin')
  async regeneratePreviews(@Param('id') contentItemId: string, @Body() body: { platforms?: string[] }) {
    const result = await this.contentApprovalService.regeneratePreviews(contentItemId, body.platforms);
    if (!result.success) {
      throw new HttpException(result.error || 'Failed to regenerate previews', HttpStatus.BAD_REQUEST);
    }
    return {
      message: 'Previews regenerated successfully',
      contentItemId,
      adaptedPreviews: result.adaptedPreviews,
      previewCount: Object.keys(result.adaptedPreviews || {}).length
    };
  }

  @Post(':id/preview-all')
  @Roles('editor', 'admin')
  async previewAll(@Param('id') contentItemId: string) {
    const result = await this.contentApprovalService.regeneratePreviews(contentItemId);
    if (!result.success) {
      throw new HttpException(result.error || 'Failed to generate previews', HttpStatus.BAD_REQUEST);
    }
    return {
      message: 'Previews generated successfully',
      contentItemId,
      adaptedPreviews: result.adaptedPreviews,
      previewCount: Object.keys(result.adaptedPreviews || {}).length
    };
  }

  @Post('perplexity/search')
  @Roles('admin')
  async testPerplexitySearch(@Body() body: { query: string; topK?: number }) {
    const res = await this.perplexity.search(body.query, { topK: body.topK });
    return res;
  }

  @Post('perplexity/answer')
  @Roles('admin')
  async testPerplexityAnswer(@Body() body: { question: string; context?: string[]; maxTokens?: number; temperature?: number }) {
    const res = await this.perplexity.answer(body.question, body.context || [], { maxTokens: body.maxTokens, temperature: body.temperature });
    return res;
  }

  @Post('perplexity/factcheck')
  @Roles('admin')
  async testPerplexityFactcheck(@Body() body: { claims: string[]; k?: number }) {
    const res = await this.perplexity.factCheck(body.claims || [], body.k ?? 3);
    return res;
  }

  @Post('quality/analyze')
  @Roles('editor', 'admin')
  async analyzeContentQuality(@Body() body: { content: string; targetLength?: number }) {
    const qualityService = new (await import('./services/quality.service')).QualityService();
    const score = qualityService.computeContentScore(body.content, { targetLength: body.targetLength });
    const suggestions = qualityService.generateQualitySuggestions(score, body.content);
    
    return {
      score,
      suggestions,
      analysis: {
        wordCount: body.content.trim().split(/\s+/).length,
        characterCount: body.content.length,
        sentenceCount: body.content.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
        paragraphCount: body.content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
      }
    };
  }

  @Post('brand/validate')
  @Roles('editor', 'admin')
  async validateBrandCompliance(@Body() body: { content: string; organizationId: string }) {
    const brandEnforcement = new (await import('./services/brand-rule-enforcement.service')).BrandRuleEnforcementService(this.dbService);
    const validation = await brandEnforcement.validateContentAgainstBrandRules(body.content, body.organizationId);

    return {
      compliant: validation.compliant,
      score: validation.score,
      violations: validation.violations,
      suggestions: validation.suggestions
    };
  }

  @Post('optimize')
  @Roles('editor', 'admin')
  async optimizeContentForPerformance(@Body() body: { 
    content: string; 
    platform: string; 
    historicalData?: any;
    contentItemId?: string;
  }) {
    try {
      const optimization = await this.contentOptimization.optimizeContentForPerformance(
        body.content,
        body.platform,
        body.historicalData
      );

      // Store optimization results if contentItemId provided
      if (body.contentItemId) {
        await this.dbService.updateContentItem(body.contentItemId, {
          optimizationResults: {
            optimizedContent: optimization.optimizedContent,
            predictedPerformance: optimization.predictedPerformance,
            changes: optimization.changes,
            confidence: optimization.confidence,
            optimizedAt: new Date().toISOString()
          }
        });
      }

      return {
        success: true,
        optimization,
        recommendations: optimization.optimizationSuggestions
      };
    } catch (error) {
      console.error('Content optimization error:', error);
      throw new HttpException('Content optimization failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('ab-test/generate')
  @Roles('editor', 'admin')
  async generateABTestVariations(@Body() body: { 
    content: string; 
    platform: string;
    contentItemId?: string;
  }) {
    try {
      const abTestPlan = await this.contentOptimization.generateABTestVariations(
        body.content,
        body.platform
      );

      // Store AB test plan if contentItemId provided
      if (body.contentItemId) {
        await this.dbService.updateContentItem(body.contentItemId, {
          abTestPlan: {
            testId: abTestPlan.testId,
            variations: abTestPlan.variations,
            testPlan: abTestPlan.testPlan,
            createdAt: new Date().toISOString()
          }
        });
      }

      return {
        success: true,
        abTestPlan,
        nextSteps: [
          'Review generated variations',
          'Select variations to test',
          'Set up A/B test campaign',
          'Monitor performance metrics'
        ]
      };
    } catch (error) {
      console.error('AB test generation error:', error);
      throw new HttpException('AB test generation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('performance/:contentItemId')
  @Roles('editor', 'admin')
  async analyzeContentPerformance(
    @Param('contentItemId') contentItemId: string,
    @Query('days') days: number = 30
  ) {
    try {
      const analysis = await this.performanceAnalytics.analyzeContentPerformance(
        contentItemId,
        days
      );

      return {
        success: true,
        analysis,
        insights: analysis.optimizationOpportunities,
        recommendations: analysis.recommendations
      };
    } catch (error) {
      console.error('Performance analysis error:', error);
      throw new HttpException('Performance analysis failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('performance/compare')
  @Roles('editor', 'admin')
  async compareContentPerformance(@Body() body: { contentItemIds: string[] }) {
    try {
      const comparison = await this.performanceAnalytics.compareContentPerformance(
        body.contentItemIds
      );

      return {
        success: true,
        comparison,
        winner: comparison.winner,
        insights: comparison.insights
      };
    } catch (error) {
      console.error('Content comparison error:', error);
      throw new HttpException('Content comparison failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('media/optimize')
  @Roles('editor', 'admin')
  async optimizeMediaForPlatform(@Body() body: { 
    mediaUrl: string; 
    platform: string; 
    content: string;
    mediaType: 'image' | 'video';
  }) {
    try {
      // Fetch media from URL
      const response = await fetch(body.mediaUrl);
      const mediaBuffer = Buffer.from(await response.arrayBuffer());

      let optimization;
      if (body.mediaType === 'image') {
        optimization = await this.mediaOptimization.optimizeImageForPlatform(
          mediaBuffer,
          body.platform,
          body.content
        );
      } else {
        optimization = await this.mediaOptimization.optimizeVideoForPlatform(
          mediaBuffer,
          body.platform,
          body.content
        );
      }

      return {
        success: true,
        optimization,
        enhancements: optimization.enhancements,
        predictedImpact: optimization.predictedImpact
      };
    } catch (error) {
      console.error('Media optimization error:', error);
      throw new HttpException('Media optimization failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('media/suggestions')
  @Roles('editor', 'admin')
  async generateMediaSuggestions(@Body() body: { 
    content: string; 
    platform: string;
  }) {
    try {
      const suggestions = await this.mediaOptimization.generateDynamicMediaSuggestions(
        body.content,
        body.platform
      );

      return {
        success: true,
        suggestions,
        recommendations: suggestions.recommendations,
        generatedMedia: suggestions.generatedMedia
      };
    } catch (error) {
      console.error('Media suggestions error:', error);
      throw new HttpException('Media suggestions generation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('optimization/track')
  @Roles('editor', 'admin')
  async trackOptimizationEffectiveness(@Body() body: { 
    contentItemId: string;
    optimizationDate: string;
    beforeMetrics: any;
    afterMetrics: any;
  }) {
    try {
      const effectiveness = await this.performanceAnalytics.trackOptimizationEffectiveness(
        body.contentItemId,
        body.optimizationDate,
        body.beforeMetrics,
        body.afterMetrics
      );

      return {
        success: true,
        effectiveness,
        improvements: effectiveness.improvements,
        metrics: effectiveness.metrics
      };
    } catch (error) {
      console.error('Optimization tracking error:', error);
      throw new HttpException('Optimization tracking failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Advanced Workflow Rules Endpoints
  @Post('workflow/rules')
  @Roles('admin')
  async createWorkflowRule(@Body() body: {
    name: string;
    description: string;
    organizationId: string;
    conditions: any[];
    actions: any[];
    priority: number;
    enabled: boolean;
  }) {
    try {
      const ruleId = await this.workflowRules.createWorkflowRule(body);
      return {
        success: true,
        ruleId,
        message: 'Workflow rule created successfully'
      };
    } catch (error) {
      console.error('Workflow rule creation error:', error);
      throw new HttpException('Workflow rule creation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('workflow/execute/:contentItemId')
  @Roles('editor', 'admin')
  async executeWorkflowRules(
    @Param('contentItemId') contentItemId: string,
    @Body() body: { organizationId: string }
  ) {
    try {
      const execution = await this.workflowRules.executeWorkflowRules(
        contentItemId,
        body.organizationId
      );

      return {
        success: true,
        execution,
        executedActions: execution.executedActions.length,
        pendingActions: execution.pendingActions.length
      };
    } catch (error) {
      console.error('Workflow execution error:', error);
      throw new HttpException('Workflow execution failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('workflow/escalate')
  @Roles('admin')
  async escalateStuckContent(@Body() body: {
    organizationId: string;
    hoursThreshold?: number;
  }) {
    try {
      const result = await this.workflowRules.escalateStuckContent(
        body.organizationId,
        body.hoursThreshold || 24
      );

      return {
        success: true,
        escalatedItems: result.escalatedItems,
        escalationActions: result.escalationActions,
        count: result.escalatedItems.length
      };
    } catch (error) {
      console.error('Content escalation error:', error);
      throw new HttpException('Content escalation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('workflow/analytics/:workflowId')
  @Roles('admin')
  async getWorkflowAnalytics(
    @Param('workflowId') workflowId: string,
    @Query('days') days: number = 30
  ) {
    try {
      const analytics = await this.workflowRules.getWorkflowAnalytics(workflowId, days);
      return {
        success: true,
        analytics,
        insights: {
          successRate: Math.round((analytics.successfulExecutions / analytics.totalExecutions) * 100),
          averageTime: analytics.averageExecutionTime,
          commonFailures: analytics.mostCommonFailures.slice(0, 3)
        }
      };
    } catch (error) {
      console.error('Workflow analytics error:', error);
      throw new HttpException('Workflow analytics failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Notification & Alerting Endpoints
  @Post('notifications/channels')
  @Roles('admin')
  async createNotificationChannel(@Body() body: {
    type: 'email' | 'slack' | 'teams' | 'webhook' | 'push';
    name: string;
    organizationId: string;
    configuration: Record<string, any>;
    enabled: boolean;
  }) {
    try {
      const channelId = await this.notificationService.createNotificationChannel(body);
      return {
        success: true,
        channelId,
        message: 'Notification channel created successfully'
      };
    } catch (error) {
      console.error('Notification channel creation error:', error);
      throw new HttpException('Notification channel creation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('notifications/templates')
  @Roles('admin')
  async createNotificationTemplate(@Body() body: {
    name: string;
    type: string;
    subject?: string;
    body: string;
    variables: string[];
    organizationId: string;
  }) {
    try {
      const templateId = await this.notificationService.createNotificationTemplate(body);
      return {
        success: true,
        templateId,
        message: 'Notification template created successfully'
      };
    } catch (error) {
      console.error('Notification template creation error:', error);
      throw new HttpException('Notification template creation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('notifications/rules')
  @Roles('admin')
  async createNotificationRule(@Body() body: {
    name: string;
    organizationId: string;
    trigger: string;
    conditions: any[];
    channels: string[];
    template: string;
    enabled: boolean;
  }) {
    try {
      const ruleId = await this.notificationService.createNotificationRule(body);
      return {
        success: true,
        ruleId,
        message: 'Notification rule created successfully'
      };
    } catch (error) {
      console.error('Notification rule creation error:', error);
      throw new HttpException('Notification rule creation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('notifications/send')
  @Roles('editor', 'admin')
  async sendNotification(@Body() body: {
    organizationId: string;
    userId?: string;
    type: string;
    title: string;
    message: string;
    data: Record<string, any>;
    channels: string[];
  }) {
    try {
      const notificationId = await this.notificationService.sendNotification(body);
      return {
        success: true,
        notificationId,
        message: 'Notification sent successfully'
      };
    } catch (error) {
      console.error('Notification sending error:', error);
      throw new HttpException('Notification sending failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('notifications/history/:userId')
  @Roles('editor', 'admin')
  async getNotificationHistory(
    @Param('userId') userId: string,
    @Query('organizationId') organizationId: string,
    @Query('limit') limit: number = 50
  ) {
    try {
      const history = await this.notificationService.getNotificationHistory(
        userId,
        organizationId,
        limit
      );
      return {
        success: true,
        history,
        count: history.length
      };
    } catch (error) {
      console.error('Notification history error:', error);
      throw new HttpException('Notification history failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('notifications/analytics')
  @Roles('admin')
  async getNotificationAnalytics(
    @Query('organizationId') organizationId: string,
    @Query('days') days: number = 30
  ) {
    try {
      const analytics = await this.notificationService.getNotificationAnalytics(
        organizationId,
        days
      );
      return {
        success: true,
        analytics,
        insights: {
          deliveryRate: analytics.deliveryRate,
          totalNotifications: analytics.totalNotifications,
          topChannels: Object.entries(analytics.channelBreakdown)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([channel, count]) => ({ channel, count }))
        }
      };
    } catch (error) {
      console.error('Notification analytics error:', error);
      throw new HttpException('Notification analytics failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Smart Scheduling Endpoints
  @Get('scheduling/optimal-timing/:platform')
  @Roles('editor', 'admin')
  async getOptimalTiming(
    @Param('platform') platform: string,
    @Query('organizationId') organizationId: string,
    @Query('timezone') timezone: string = 'UTC'
  ) {
    try {
      const optimalTiming = await this.smartScheduling.getOptimalTiming(
        platform,
        organizationId,
        timezone
      );
      return {
        success: true,
        optimalTiming,
        insights: {
          bestTimes: optimalTiming.bestTimes.slice(0, 3),
          confidence: optimalTiming.confidence,
          timezone: optimalTiming.timezone
        }
      };
    } catch (error) {
      console.error('Optimal timing error:', error);
      throw new HttpException('Optimal timing failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('scheduling/recommendations')
  @Roles('editor', 'admin')
  async generateScheduleRecommendations(@Body() body: {
    contentItemId: string;
    platforms: string[];
  }) {
    try {
      const recommendations = await this.smartScheduling.generateScheduleRecommendations(
        body.contentItemId,
        body.platforms
      );
      return {
        success: true,
        recommendations,
        platformCount: recommendations.length
      };
    } catch (error) {
      console.error('Schedule recommendations error:', error);
      throw new HttpException('Schedule recommendations failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('scheduling/conflicts')
  @Roles('editor', 'admin')
  async detectScheduleConflicts(@Body() body: {
    contentItemId: string;
    platform: string;
    scheduledAt: string;
  }) {
    try {
      const conflict = await this.smartScheduling.detectScheduleConflicts(
        body.contentItemId,
        body.platform,
        body.scheduledAt
      );
      return {
        success: true,
        conflict,
        hasConflicts: conflict !== null
      };
    } catch (error) {
      console.error('Schedule conflict detection error:', error);
      throw new HttpException('Schedule conflict detection failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('scheduling/suggest')
  @Roles('editor', 'admin')
  async suggestOptimalSchedule(@Body() body: {
    contentItemId: string;
    platform: string;
    preferredTime?: string;
  }) {
    try {
      const suggestion = await this.smartScheduling.suggestOptimalSchedule(
        body.contentItemId,
        body.platform,
        body.preferredTime
      );
      return {
        success: true,
        suggestion,
        insights: {
          recommendedTime: suggestion.suggestedTime,
          engagementScore: suggestion.engagementScore,
          reason: suggestion.reason,
          alternatives: suggestion.alternatives.slice(0, 3)
        }
      };
    } catch (error) {
      console.error('Schedule suggestion error:', error);
      throw new HttpException('Schedule suggestion failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('scheduling/recurring')
  @Roles('admin')
  async createRecurringSchedule(@Body() body: {
    name: string;
    organizationId: string;
    template: {
      platforms: string[];
      frequency: 'daily' | 'weekly' | 'monthly';
      timeOfDay: string;
      daysOfWeek?: number[];
      dayOfMonth?: number;
    };
    contentTemplate: {
      type: 'BLOG' | 'NEWSLETTER' | 'SOCIAL';
      brief: string;
      angle?: string;
    };
    enabled: boolean;
  }) {
    try {
      const scheduleId = await this.smartScheduling.createRecurringSchedule(body);
      return {
        success: true,
        scheduleId,
        message: 'Recurring schedule created successfully'
      };
    } catch (error) {
      console.error('Recurring schedule creation error:', error);
      throw new HttpException('Recurring schedule creation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('scheduling/analytics/:platform')
  @Roles('admin')
  async getScheduleAnalytics(
    @Param('platform') platform: string,
    @Query('organizationId') organizationId: string,
    @Query('days') days: number = 30
  ) {
    try {
      const analytics = await this.smartScheduling.getScheduleAnalytics(
        platform,
        organizationId,
        days
      );
      return {
        success: true,
        analytics,
        insights: {
          successRate: Math.round((analytics.successfulSchedules / analytics.totalSchedules) * 100),
          averageEngagement: analytics.averageEngagement,
          bestTimes: analytics.bestPerformingTimes.slice(0, 5)
        }
      };
    } catch (error) {
      console.error('Schedule analytics error:', error);
      throw new HttpException('Schedule analytics failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Batch Generation Endpoints
  @Post('generate/batch')
  @Roles('editor', 'admin')
  async createBatchGeneration(@Body() body: {
    organizationId: string;
    channel?: string;
    briefs: Array<{
      id: string;
      brief: string;
      kind: 'BLOG' | 'NEWSLETTER' | 'SOCIAL';
      angle?: string;
      title?: string;
      platform?: string;
    }>;
    options?: {
      parallel?: boolean;
      maxConcurrency?: number;
      retryFailed?: boolean;
      notifyOnCompletion?: boolean;
    };
  }) {
    try {
      const jobId = await this.batchGeneration.createBatchGenerationJob(body);
      return {
        success: true,
        jobId,
        message: 'Batch generation job created successfully',
        totalItems: body.briefs.length,
        options: body.options
      };
    } catch (error) {
      console.error('Batch generation creation error:', error);
      throw new HttpException('Batch generation creation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('generate/batch/:jobId/progress')
  @Roles('editor', 'admin')
  async getBatchGenerationProgress(@Param('jobId') jobId: string) {
    try {
      const progress = await this.batchGeneration.getBatchGenerationProgress(jobId);
      return {
        success: true,
        progress,
        insights: {
          completionRate: Math.round((progress.completedItems / progress.totalItems) * 100),
          failureRate: Math.round((progress.failedItems / progress.totalItems) * 100),
          estimatedTimeRemaining: progress.estimatedTimeRemaining
        }
      };
    } catch (error) {
      console.error('Batch generation progress error:', error);
      throw new HttpException('Batch generation progress failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('generate/batch/:jobId/result')
  @Roles('editor', 'admin')
  async getBatchGenerationResult(@Param('jobId') jobId: string) {
    try {
      const result = await this.batchGeneration.getBatchGenerationResult(jobId);
      return {
        success: true,
        result,
        insights: {
          successRate: result.summary.successRate,
          averageGenerationTime: result.summary.averageGenerationTime,
          totalDuration: result.summary.totalDuration
        }
      };
    } catch (error) {
      console.error('Batch generation result error:', error);
      throw new HttpException('Batch generation result failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('generate/batch/:jobId/cancel')
  @Roles('admin')
  async cancelBatchGeneration(@Param('jobId') jobId: string) {
    try {
      await this.batchGeneration.cancelBatchGeneration(jobId);
      return {
        success: true,
        message: 'Batch generation job cancelled successfully'
      };
    } catch (error) {
      console.error('Batch generation cancellation error:', error);
      throw new HttpException('Batch generation cancellation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('generate/batch/:jobId/retry')
  @Roles('admin')
  async retryFailedBatchItems(@Param('jobId') jobId: string) {
    try {
      const retryJobId = await this.batchGeneration.retryFailedItems(jobId);
      return {
        success: true,
        retryJobId,
        message: 'Retry batch job created successfully'
      };
    } catch (error) {
      console.error('Batch generation retry error:', error);
      throw new HttpException('Batch generation retry failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Pipeline Monitoring Endpoints
  @Get('pipeline/:pipelineId/progress')
  @Roles('editor', 'admin')
  async getPipelineProgress(@Param('pipelineId') pipelineId: string) {
    try {
      const progress = await this.pipelineMonitoring.getPipelineProgress(pipelineId);
      return {
        success: true,
        progress,
        insights: {
          stageProgress: Math.round((progress.currentStage / progress.totalStages) * 100),
          estimatedTimeRemaining: progress.estimatedTimeRemaining,
          currentStage: progress.stages[progress.currentStage]?.name || 'Unknown'
        }
      };
    } catch (error) {
      console.error('Pipeline progress error:', error);
      throw new HttpException('Pipeline progress failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('pipeline/:pipelineId/metrics')
  @Roles('editor', 'admin')
  async getPipelineMetrics(@Param('pipelineId') pipelineId: string) {
    try {
      const metrics = await this.pipelineMonitoring.getPipelineMetrics(pipelineId);
      return {
        success: true,
        metrics,
        insights: {
          success: metrics.success,
          totalDuration: metrics.totalDuration,
          stageCount: metrics.stageMetrics.length,
          failedStages: metrics.stageMetrics.filter(s => !s.success).length
        }
      };
    } catch (error) {
      console.error('Pipeline metrics error:', error);
      throw new HttpException('Pipeline metrics failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('pipeline/analytics')
  @Roles('admin')
  async getPipelineAnalytics(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    try {
      const analytics = await this.pipelineMonitoring.getPipelineAnalytics(organizationId, {
        start: startDate,
        end: endDate
      });
      return {
        success: true,
        analytics,
        insights: {
          successRate: analytics.successRate,
          averageDuration: analytics.averageDuration,
          totalPipelines: analytics.totalPipelines,
          topPerformingStage: analytics.stagePerformance
            .sort((a, b) => b.successRate - a.successRate)[0]?.stageName || 'N/A'
        }
      };
    } catch (error) {
      console.error('Pipeline analytics error:', error);
      throw new HttpException('Pipeline analytics failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('pipeline/:pipelineId/cancel')
  @Roles('admin')
  async cancelPipeline(
    @Param('pipelineId') pipelineId: string,
    @Body() body: { reason?: string }
  ) {
    try {
      await this.pipelineMonitoring.cancelPipeline(pipelineId, body.reason);
      return {
        success: true,
        message: 'Pipeline cancelled successfully'
      };
    } catch (error) {
      console.error('Pipeline cancellation error:', error);
      throw new HttpException('Pipeline cancellation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('schedules/:id/reschedule')
  @Roles('editor', 'admin')
  async rescheduleContent(
    @Param('id') scheduleId: string,
    @Body() body: { scheduledAt: string; reason?: string },
    @Req() req: any
  ) {
    const orgId = this.extractOrganizationId(req);
    
    try {
      const result = await this.dbService.rescheduleContent(scheduleId, body.scheduledAt, body.reason, orgId);
      return {
        success: true,
        message: 'Content rescheduled successfully',
        scheduleId,
        newScheduledAt: body.scheduledAt
      };
    } catch (error) {
      throw new HttpException('Failed to reschedule content', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('schedules/:id/cancel')
  @Roles('editor', 'admin')
  async cancelSchedule(
    @Param('id') scheduleId: string,
    @Body() body: { reason?: string },
    @Req() req: any
  ) {
    const orgId = this.extractOrganizationId(req);
    
    try {
      const result = await this.dbService.cancelSchedule(scheduleId, body.reason, orgId);
      return {
        success: true,
        message: 'Schedule cancelled successfully',
        scheduleId
      };
    } catch (error) {
      throw new HttpException('Failed to cancel schedule', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('bulk')
  @Roles('editor', 'admin')
  async bulkCreateContent(
    @Body() body: { items: CreateContentDto[] },
    @Req() req: any
  ) {
    const orgId = this.extractOrganizationId(req);
    
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw new HttpException('Items array is required and cannot be empty', HttpStatus.BAD_REQUEST);
    }

    if (body.items.length > 50) {
      throw new HttpException('Maximum 50 items allowed per bulk operation', HttpStatus.BAD_REQUEST);
    }

    try {
      const results = await Promise.all(
        body.items.map(async (item) => {
          const contentId = await this.dbService.createContentItem(
            orgId,
            item.title,
            item.type,
            item.status || 'DRAFT',
            item.tags || [],
            item.metadata || {},
            req.user?.sub || 'system'
          );
          return { contentId, title: item.title, type: item.type };
        })
      );

      return {
        success: true,
        message: `Successfully created ${results.length} content items`,
        results
      };
    } catch (error) {
      throw new HttpException('Bulk content creation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('search')
  @Roles('editor', 'admin', 'viewer')
  async searchContent(
    @Query('q') query: string,
    @Query('filters') filters?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Req() req: any
  ) {
    const orgId = this.extractOrganizationId(req);
    
    if (!query || query.trim().length === 0) {
      throw new HttpException('Search query is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const parsedFilters = filters ? JSON.parse(filters) : {};
      const results = await this.dbService.searchContentItems(
        orgId,
        query.trim(),
        parsedFilters,
        parseInt(page),
        parseInt(limit)
      );

      return {
        success: true,
        query,
        results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: results.length
        }
      };
    } catch (error) {
      throw new HttpException('Content search failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('target-accounts')
  @Roles('editor', 'admin', 'viewer')
  async getTargetAccounts(
    @Query('platform') platform?: string,
    @Req() req: any
  ) {
    const orgId = this.extractOrganizationId(req);
    
    try {
      const accounts = await this.dbService.getTargetAccounts(orgId, platform);
      return {
        success: true,
        accounts,
        platform: platform || 'all'
      };
    } catch (error) {
      throw new HttpException('Failed to get target accounts', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('target-accounts')
  @Roles('admin')
  async createTargetAccount(
    @Body() body: {
      platform: string;
      accountId: string;
      accountName: string;
      accountType: string;
      accountMetadata?: any;
    },
    @Req() req: any
  ) {
    const orgId = this.extractOrganizationId(req);
    
    try {
      const account = await this.dbService.createTargetAccount(
        orgId,
        body.platform,
        body.accountId,
        body.accountName,
        body.accountType,
        body.accountMetadata || {}
      );
      
      return {
        success: true,
        message: 'Target account created successfully',
        account
      };
    } catch (error) {
      throw new HttpException('Failed to create target account', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('target-accounts/:id')
  @Roles('admin')
  async updateTargetAccount(
    @Param('id') accountId: string,
    @Body() body: {
      accountName?: string;
      accountType?: string;
      accountMetadata?: any;
      isActive?: boolean;
    },
    @Req() req: any
  ) {
    const orgId = this.extractOrganizationId(req);
    
    try {
      const account = await this.dbService.updateTargetAccount(accountId, body);
      
      return {
        success: true,
        message: 'Target account updated successfully',
        account
      };
    } catch (error) {
      throw new HttpException('Failed to update target account', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('schedules/:id/target-account')
  @Roles('editor', 'admin')
  async updateScheduleTargetAccount(
    @Param('id') scheduleId: string,
    @Body() body: { targetAccountId: string },
    @Req() req: any
  ) {
    const orgId = this.extractOrganizationId(req);
    
    try {
      const result = await this.dbService.updateScheduleTargetAccount(
        scheduleId,
        body.targetAccountId,
        orgId
      );
      
      return {
        success: true,
        message: 'Schedule target account updated successfully',
        scheduleId,
        targetAccount: result
      };
    } catch (error) {
      throw new HttpException('Failed to update schedule target account', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}