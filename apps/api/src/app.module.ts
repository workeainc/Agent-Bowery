import { Module, MiddlewareConsumer } from '@nestjs/common';
import { HealthController } from './health.controller';
import { QueueService } from './queue.service';
import { JobsController } from './jobs.controller';
import { OAuthController } from './oauth.controller';
import { WebhooksController } from './webhooks.controller';
import { OAuthService } from './oauth.service';
import { DbService } from './db.service';
import { PostsController } from './posts.controller';
import { PlatformService } from './platform.service';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { TokenAuditService } from './services/token-audit.service';
import { TokenCacheService } from './token-cache.service';
import { IdempotencyMiddleware } from './middleware/idempotency.middleware';
import { TokenService } from './token.service';
import { ContentController } from './content.controller';
import { CorrelationMiddleware } from './middleware/correlation.middleware';
import { GlobalHttpExceptionFilter } from './filters/http-exception.filter';
import { AuthController } from './auth.controller';
import { GatewayAuthGuard } from './guards/gateway-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ContentAdaptationService } from './content-adaptation.service';
import { TokenController } from './token.controller';
import { TokenRefreshInterceptor } from './interceptors/token-refresh.interceptor';
import { PlatformPublishService } from './platform-publish.service';
import { ContentApprovalService } from './content-approval.service';
import { MetaClientService } from './platforms/meta/meta-client.service';
import { LinkedInClientService } from './platforms/linkedin/linkedin-client.service';
import { MediaProcessingService } from './services/media-processing.service';
import { StorageManagementService } from './services/storage-management.service';
import { PerplexityService } from './services/perplexity.service';
import { TemplateRenderService } from './services/template-render.service';
import { ContentGenerationService } from './services/content-generation.service';
import { QualityService } from './services/quality.service';
import { TemplateTuningService } from './services/template-tuning.service';
import { BrandRuleEnforcementService } from './services/brand-rule-enforcement.service';
import { AdvancedContentOptimizationService } from './services/advanced-content-optimization.service';
import { ContentPerformanceAnalyticsService } from './services/content-performance-analytics.service';
import { SmartMediaOptimizationService } from './services/smart-media-optimization.service';
import { AdvancedWorkflowRulesService } from './services/advanced-workflow-rules.service';
import { NotificationService } from './services/notification.service';
import { SmartSchedulingService } from './services/smart-scheduling.service';
import { EnhancedErrorHandlingService } from './services/enhanced-error-handling.service';
import { BatchGenerationService } from './services/batch-generation.service';
import { PipelineMonitoringService } from './services/pipeline-monitoring.service';
import { PlatformController } from './platform.controller';
import { AdminController } from './admin.controller';
import { AuthService } from './auth.service';
import { SecurityMiddleware } from './middleware/security.middleware';
import { CSRFMiddleware } from './middleware/csrf.middleware';
import { AuthRateLimitMiddleware } from './middleware/auth-rate-limit.middleware';
import { SessionSecurityService } from './services/session-security.service';

@Module({
  controllers: [HealthController, JobsController, OAuthController, WebhooksController, PostsController, ContentController, AuthController, TokenController, AdminController],
  providers: [QueueService, OAuthService, DbService, PlatformService, TokenService, ContentAdaptationService, GlobalHttpExceptionFilter, GatewayAuthGuard, RolesGuard, TokenRefreshInterceptor, PlatformPublishService, ContentApprovalService, MetaClientService, LinkedInClientService, MediaProcessingService, StorageManagementService, TokenAuditService, TokenCacheService, PerplexityService, TemplateRenderService, ContentGenerationService, QualityService, TemplateTuningService, BrandRuleEnforcementService, AdvancedContentOptimizationService, ContentPerformanceAnalyticsService, SmartMediaOptimizationService, AdvancedWorkflowRulesService, NotificationService, SmartSchedulingService, EnhancedErrorHandlingService, BatchGenerationService, PipelineMonitoringService, AuthService, SessionSecurityService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply security middleware to all routes first
    consumer.apply(SecurityMiddleware).forRoutes('*');
    consumer.apply(CorrelationMiddleware).forRoutes('*');
    
    // Apply CSRF protection to all non-GET routes except health checks
    consumer.apply(CSRFMiddleware).exclude('health', 'auth/dev-token').forRoutes('*');
    
    // Apply rate limiting to specific routes
    consumer.apply(RateLimitMiddleware).forRoutes('oauth');
    consumer.apply(AuthRateLimitMiddleware).forRoutes('auth');
    consumer.apply(IdempotencyMiddleware).forRoutes('posts', 'schedules', 'content');
  }
}
