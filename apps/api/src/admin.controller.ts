import { Controller, Post, Param, HttpException, HttpStatus, Body, Get, Query, UseGuards, Req } from '@nestjs/common';
import { QueueService } from './queue.service';
import { DbService } from './db.service';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { GatewayAuthGuard } from './guards/gateway-auth.guard';
import { PerplexityService } from './services/perplexity.service';
import { ContentGenerationService } from './services/content-generation.service';
import { TemplateTuningService } from './services/template-tuning.service';

@UseGuards(GatewayAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly queue: QueueService, 
    private readonly db: DbService, 
    private readonly perplexity: PerplexityService, 
    private readonly generator: ContentGenerationService,
    private readonly templateTuning: TemplateTuningService
  ) {}

  private extractOrganizationId(req: any): string {
    const orgId = req?.user?.orgId || req?.user?.organizationId || req?.user?.sub;
    if (!orgId) {
      throw new HttpException('Organization context required', HttpStatus.BAD_REQUEST);
    }
    return orgId;
  }

  @Post('publish-dlq/:id/replay')
  @Roles('admin')
  async replayPublishDlq(@Param('id') id: string) {
    // Load DLQ row
    const client = await (this.db as any).pool.connect();
    try {
      const { rows } = await client.query('SELECT * FROM publish_dlq WHERE id = $1', [id]);
      if (rows.length === 0) throw new HttpException('DLQ item not found', HttpStatus.NOT_FOUND);
      const row = rows[0];
      const payload = row.payload || {};

      // Re-enqueue publish job with deterministic jobId
      const scheduleId = row.schedule_id;
      const platform = row.platform;
      await this.queue.enqueuePublish({
        contentItemId: payload.contentItemId,
        platform,
        scheduledAt: payload.scheduledAt,
        scheduleId
      });

      return { success: true, scheduleId, platform };
    } finally {
      client.release();
    }
  }

  // Prompt Template admin APIs
  @Post('prompt-templates')
  @Roles('admin')
  async createPromptTemplate(@Body() body: { name: string; version: string; channel: string; inputSchema?: any; template: string; outputSchema?: any; }) {
    const id = await this.db.createPromptTemplate({
      name: body.name,
      version: body.version,
      channel: body.channel,
      inputSchema: body.inputSchema,
      template: body.template,
      outputSchema: body.outputSchema,
    });
    return { id };
  }

  // Minimal generation trigger for testing
  @Post('generate')
  @Roles('admin')
  async generate(@Body() body: { kind: 'BLOG'|'NEWSLETTER'; brief: string; angle?: string; organizationId?: string; channel?: string }, @Req() req: any) {
    const organizationId = body.organizationId || this.extractOrganizationId(req);
    const result = await this.generator.generatePost({
      kind: body.kind,
      brief: body.brief,
      angle: body.angle,
      organizationId,
      channel: body.channel || 'default',
    });
    return result;
  }

  @Post('prompt-templates/:id')
  @Roles('admin')
  async updatePromptTemplate(@Param('id') id: string, @Body() body: { inputSchema?: any; template?: string; outputSchema?: any }) {
    await this.db.updatePromptTemplate(id, body);
    return { id, updated: true };
  }

  @Post('prompt-templates/upsert')
  @Roles('admin')
  async upsertPromptTemplate(@Body() body: { name: string; version: string; channel: string; inputSchema?: any; template: string; outputSchema?: any; }) {
    // If a template with same (name, version, channel) exists, update it; else create
    const existing = await this.db.listPromptTemplates({ name: body.name, channel: body.channel, limit: 1 });
    if (existing && existing.length > 0 && existing[0].version === body.version) {
      await this.db.updatePromptTemplate(existing[0].id, { inputSchema: body.inputSchema, template: body.template, outputSchema: body.outputSchema });
      return { id: existing[0].id, updated: true };
    }
    const id = await this.db.createPromptTemplate({
      name: body.name,
      version: body.version,
      channel: body.channel,
      inputSchema: body.inputSchema,
      template: body.template,
      outputSchema: body.outputSchema,
    });
    return { id, created: true };
  }

  @Get('prompt-templates/:id')
  @Roles('admin')
  async getPromptTemplate(@Param('id') id: string) {
    const row = await this.db.getPromptTemplate(id);
    if (!row) throw new HttpException('Prompt template not found', HttpStatus.NOT_FOUND);
    return row;
  }

  @Get('prompt-templates')
  @Roles('admin')
  async listPromptTemplates(@Query('name') name?: string, @Query('channel') channel?: string, @Query('limit') limit?: string) {
    const rows = await this.db.listPromptTemplates({ name, channel, limit: limit ? parseInt(limit) : undefined });
    return { templates: rows };
  }

  // Brand Rules admin APIs
  @Get('brand-rules/:organizationId')
  @Roles('admin')
  async getBrandRules(@Param('organizationId') organizationId: string) {
    const rules = await this.db.getBrandRules(organizationId);
    return rules || { organization_id: organizationId, tone: {}, dos: [], donts: [], approved_ctas: [], handles: {}, hashtags: [], restricted_topics: [], updated_at: null };
  }

  @Post('brand-rules/:organizationId')
  @Roles('admin')
  async upsertBrandRules(
    @Param('organizationId') organizationId: string,
    @Body() body: { tone?: any; dos?: any[]; donts?: any[]; approved_ctas?: any[]; handles?: Record<string, string>; hashtags?: any[]; restricted_topics?: any[] }
  ) {
    const saved = await this.db.upsertBrandRules(organizationId, body || {});
    return { organizationId, updated: true, rules: saved };
  }

  // Quality Policies admin APIs
  @Get('quality-policies/:organizationId/:channel')
  @Roles('admin')
  async getQualityPolicy(@Param('organizationId') organizationId: string, @Param('channel') channel: string) {
    const policy = await this.db.getQualityPolicy(organizationId, channel);
    return policy || { organization_id: organizationId, channel, updated_at: null };
  }

  @Post('quality-policies/:organizationId/:channel')
  @Roles('admin')
  async upsertQualityPolicy(
    @Param('organizationId') organizationId: string,
    @Param('channel') channel: string,
    @Body() body: { min_readability?: number; max_similarity?: number; min_fact_supported_ratio?: number; toxicity_blocklist?: string[]; language?: string; max_length?: number }
  ) {
    const saved = await this.db.upsertQualityPolicy(organizationId, channel, body || {});
    return { organizationId, channel, updated: true, policy: saved };
  }

  // Autopost settings admin APIs
  @Get('autopost/:organizationId')
  @Roles('admin')
  async getAutopost(@Param('organizationId') organizationId: string) {
    const row = await this.db.getAutopostSettings(organizationId);
    return row || { organization_id: organizationId, autopost_enabled: false, dry_run: true };
  }

  @Post('autopost/:organizationId')
  @Roles('admin')
  async upsertAutopost(
    @Param('organizationId') organizationId: string,
    @Body() body: { autopost_enabled?: boolean; dry_run?: boolean }
  ) {
    const saved = await this.db.upsertAutopostSettings(organizationId, body || {});
    return { organizationId, updated: true, settings: saved };
  }

  // Safety toggle for emergency stop
  @Post('autopost/:organizationId/emergency-stop')
  @Roles('admin')
  async emergencyStop(@Param('organizationId') organizationId: string) {
    const saved = await this.db.upsertAutopostSettings(organizationId, { autopost_enabled: false, dry_run: true });
    return { organizationId, emergencyStop: true, settings: saved };
  }

  @Post('autopost/:organizationId/resume')
  @Roles('admin')
  async resumeAutopost(@Param('organizationId') organizationId: string) {
    const saved = await this.db.upsertAutopostSettings(organizationId, { autopost_enabled: true, dry_run: false });
    return { organizationId, resumed: true, settings: saved };
  }

  // Auto-approve policy management
  @Get('autoapprove/:organizationId')
  @Roles('admin')
  async getAutoApprove(@Param('organizationId') organizationId: string) {
    const row = await this.db.getAutoapprovePolicy(organizationId);
    return row || { organization_id: organizationId, enabled: false, min_confidence: 0.8 };
  }

  @Post('autoapprove/:organizationId')
  @Roles('admin')
  async upsertAutoApprove(
    @Param('organizationId') organizationId: string,
    @Body() body: { enabled?: boolean; min_confidence?: number }
  ) {
    const saved = await this.db.upsertAutoapprovePolicy(organizationId, body || {});
    return { organizationId, updated: true, policy: saved };
  }

  // Escalation rules
  @Get('escalations/:organizationId')
  @Roles('admin')
  async getEscalations(@Param('organizationId') organizationId: string) {
    const row = await this.db.getEscalationRules(organizationId);
    return row || { organization_id: organizationId, vip_accounts: [], risky_topics: [], blocklist: [], manual_channels: [] };
  }

  @Post('escalations/:organizationId')
  @Roles('admin')
  async upsertEscalations(
    @Param('organizationId') organizationId: string,
    @Body() body: { vip_accounts?: string[]; risky_topics?: string[]; max_toxicity?: number; max_similarity?: number; min_fact_supported_ratio?: number; blocklist?: string[]; manual_channels?: string[] }
  ) {
    const saved = await this.db.upsertEscalationRules(organizationId, body || {});
    return { organizationId, updated: true, rules: saved };
  }

  // Global system controls
  @Get('system/flags')
  @Roles('admin')
  async getSystemFlags() {
    const flags = await this.db.getSystemFlags();
    return flags;
  }

  @Post('system/pause')
  @Roles('admin')
  async pauseAll() {
    const flags = await this.db.updateGlobalPause(true);
    return { globalPause: true, flags };
  }

  @Post('system/resume')
  @Roles('admin')
  async resumeAll() {
    const flags = await this.db.updateGlobalPause(false);
    return { globalPause: false, flags };
  }

  // Template performance and tuning
  @Get('templates/performance')
  @Roles('admin')
  async getTemplatePerformance(
    @Query('templateId') templateId?: string,
    @Query('platform') platform?: string,
    @Query('organizationId') organizationId?: string,
    @Query('channel') channel?: string
  ) {
    if (templateId) {
      const performance = await this.db.getTemplatePerformance(templateId, platform, organizationId, channel);
      return { templateId, performance };
    }

    // Get all templates for org/channel if no templateId specified
    const allPerformance = await this.db.getTemplatePerformance('', platform, organizationId, channel);
    return { 
      organizationId, 
      channel, 
      platform,
      templates: allPerformance,
      count: allPerformance.length 
    };
  }

  @Post('templates/tuning/update')
  @Roles('admin')
  async updateTemplatePerformance(
    @Body() body: { templateId: string; platform: string; organizationId?: string; channel?: string }
  ) {
    const { templateId, platform, organizationId, channel } = body;
    
    await this.templateTuning.updateTemplatePerformance(templateId, platform, organizationId, channel);
    
    return { 
      message: 'Template performance updated',
      templateId,
      platform,
      organizationId,
      channel 
    };
  }

  @Get('templates/recommendations')
  @Roles('admin')
  async getTemplateRecommendations(
    @Query('platform') platform: string,
    @Query('organizationId') organizationId?: string,
    @Query('channel') channel?: string
  ) {
    const recommendations = await this.templateTuning.getTemplateRecommendations(platform, organizationId, channel);
    
    return {
      platform,
      organizationId,
      channel,
      ...recommendations
    };
  }
}


