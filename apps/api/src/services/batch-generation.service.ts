import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../db.service';
import { ContentGenerationService } from './content-generation.service';
import { QueueService } from '../queue.service';
import { EnhancedErrorHandlingService } from './enhanced-error-handling.service';

export interface BatchGenerationRequest {
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
}

export interface BatchGenerationJob {
  id: string;
  organizationId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  totalItems: number;
  completedItems: number;
  failedItems: number;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  results: Array<{
    briefId: string;
    contentItemId?: string;
    status: 'pending' | 'completed' | 'failed';
    error?: string;
    generatedAt?: string;
  }>;
  metadata: {
    channel?: string;
    options?: any;
    createdBy?: string;
  };
}

export interface BatchGenerationProgress {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  completedItems: number;
  failedItems: number;
  totalItems: number;
  currentItem?: {
    briefId: string;
    brief: string;
    kind: string;
    status: string;
  };
  estimatedTimeRemaining?: number;
  startedAt?: string;
  completedAt?: string;
}

export interface BatchGenerationResult {
  jobId: string;
  success: boolean;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  results: Array<{
    briefId: string;
    contentItemId?: string;
    status: 'completed' | 'failed';
    error?: string;
    generatedContent?: any;
  }>;
  summary: {
    successRate: number;
    averageGenerationTime: number;
    totalDuration: number;
  };
}

@Injectable()
export class BatchGenerationService {
  private readonly logger = new Logger(BatchGenerationService.name);
  private readonly activeJobs: Map<string, BatchGenerationJob> = new Map();

  constructor(
    private readonly db: DbService,
    private readonly contentGeneration: ContentGenerationService,
    private readonly queueService: QueueService,
    private readonly errorHandling: EnhancedErrorHandlingService,
  ) {}

  async createBatchGenerationJob(request: BatchGenerationRequest): Promise<string> {
    try {
      const jobId = `batch_gen_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      
      const job: BatchGenerationJob = {
        id: jobId,
        organizationId: request.organizationId,
        status: 'pending',
        totalItems: request.briefs.length,
        completedItems: 0,
        failedItems: 0,
        progress: 0,
        results: request.briefs.map(brief => ({
          briefId: brief.id,
          status: 'pending'
        })),
        metadata: {
          channel: request.channel,
          options: request.options,
          createdBy: 'system' // TODO: Get from auth context
        }
      };

      this.activeJobs.set(jobId, job);
      
      // Store job in database
      await this.db.createBatchGenerationJob(job);

      // Queue the batch job for processing
      await this.queueService.enqueueBatchGeneration({
        jobId,
        organizationId: request.organizationId,
        briefs: request.briefs,
        options: request.options || {}
      });

      this.logger.log(`Created batch generation job: ${jobId}`, {
        jobId,
        totalItems: request.briefs.length,
        organizationId: request.organizationId
      });

      return jobId;
    } catch (error) {
      this.logger.error(`Failed to create batch generation job: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error(`Failed to create batch generation job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processBatchGeneration(jobId: string): Promise<void> {
    try {
      const job = this.activeJobs.get(jobId);
      if (!job) {
        throw new Error(`Batch job ${jobId} not found`);
      }

      job.status = 'running';
      job.startedAt = new Date().toISOString();
      
      this.logger.log(`Starting batch generation job: ${jobId}`, {
        jobId,
        totalItems: job.totalItems
      });

      const options = job.metadata.options || {};
      const maxConcurrency = options.maxConcurrency || 3;
      const parallel = options.parallel !== false;

      if (parallel) {
        await this.processBatchParallel(job, maxConcurrency);
      } else {
        await this.processBatchSequential(job);
      }

      job.status = job.failedItems === job.totalItems ? 'failed' : 'completed';
      job.completedAt = new Date().toISOString();
      job.progress = 100;

      // Update job in database
      await this.db.updateBatchGenerationJob(jobId, {
        status: job.status,
        completedItems: job.completedItems,
        failedItems: job.failedItems,
        progress: job.progress,
        completedAt: job.completedAt,
        results: job.results
      });

      this.logger.log(`Completed batch generation job: ${jobId}`, {
        jobId,
        status: job.status,
        completedItems: job.completedItems,
        failedItems: job.failedItems,
        totalItems: job.totalItems
      });

      // Send notification if requested
      if (options.notifyOnCompletion) {
        await this.sendCompletionNotification(job);
      }

    } catch (error) {
      this.logger.error(`Batch generation job ${jobId} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      const job = this.activeJobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.completedAt = new Date().toISOString();
        await this.db.updateBatchGenerationJob(jobId, {
          status: 'failed',
          completedAt: job.completedAt
        });
      }
      
      throw error;
    }
  }

  async getBatchGenerationProgress(jobId: string): Promise<BatchGenerationProgress> {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      throw new Error(`Batch job ${jobId} not found`);
    }

    const currentItem = job.results.find(r => r.status === 'pending');
    
    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      completedItems: job.completedItems,
      failedItems: job.failedItems,
      totalItems: job.totalItems,
      currentItem: currentItem ? {
        briefId: currentItem.briefId,
        brief: '', // Would need to store this
        kind: '', // Would need to store this
        status: currentItem.status
      } : undefined,
      estimatedTimeRemaining: this.calculateEstimatedTimeRemaining(job),
      startedAt: job.startedAt,
      completedAt: job.completedAt
    };
  }

  async getBatchGenerationResult(jobId: string): Promise<BatchGenerationResult> {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      throw new Error(`Batch job ${jobId} not found`);
    }

    const successRate = job.totalItems > 0 ? (job.completedItems / job.totalItems) * 100 : 0;
    const totalDuration = job.startedAt && job.completedAt 
      ? new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
      : 0;

    return {
      jobId: job.id,
      success: job.status === 'completed',
      totalItems: job.totalItems,
      completedItems: job.completedItems,
      failedItems: job.failedItems,
      results: job.results.map(r => ({
        briefId: r.briefId,
        contentItemId: r.contentItemId,
        status: r.status as 'completed' | 'failed',
        error: r.error,
        generatedContent: r.status === 'completed' ? {} : undefined // Would need to store actual content
      })),
      summary: {
        successRate: Math.round(successRate),
        averageGenerationTime: job.completedItems > 0 ? totalDuration / job.completedItems : 0,
        totalDuration
      }
    };
  }

  async cancelBatchGeneration(jobId: string): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      throw new Error(`Batch job ${jobId} not found`);
    }

    if (job.status === 'completed' || job.status === 'failed') {
      throw new Error(`Cannot cancel completed job ${jobId}`);
    }

    job.status = 'cancelled';
    job.completedAt = new Date().toISOString();

    await this.db.updateBatchGenerationJob(jobId, {
      status: 'cancelled',
      completedAt: job.completedAt
    });

    this.logger.log(`Cancelled batch generation job: ${jobId}`);
  }

  async retryFailedItems(jobId: string): Promise<string> {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      throw new Error(`Batch job ${jobId} not found`);
    }

    const failedItems = job.results.filter(r => r.status === 'failed');
    if (failedItems.length === 0) {
      throw new Error(`No failed items to retry in job ${jobId}`);
    }

    // Create new batch job with only failed items
    const retryRequest: BatchGenerationRequest = {
      organizationId: job.organizationId,
      channel: job.metadata.channel,
      briefs: failedItems.map(item => ({
        id: item.briefId,
        brief: '', // Would need to store original brief
        kind: 'BLOG' as const, // Would need to store original kind
        angle: '',
        title: ''
      })),
      options: {
        ...job.metadata.options,
        notifyOnCompletion: true
      }
    };

    return await this.createBatchGenerationJob(retryRequest);
  }

  private async processBatchParallel(job: BatchGenerationJob, maxConcurrency: number): Promise<void> {
    const pendingItems = job.results.filter(r => r.status === 'pending');
    const chunks = this.chunkArray(pendingItems, maxConcurrency);

    for (const chunk of chunks) {
      const promises = chunk.map(item => this.processBatchItem(job, item));
      await Promise.allSettled(promises);
    }
  }

  private async processBatchSequential(job: BatchGenerationJob): Promise<void> {
    const pendingItems = job.results.filter(r => r.status === 'pending');
    
    for (const item of pendingItems) {
      await this.processBatchItem(job, item);
    }
  }

  private async processBatchItem(job: BatchGenerationJob, item: any): Promise<void> {
    try {
      // This would need the original brief data
      const briefData = await this.getBriefData(job.id, item.briefId);
      
      const context = this.errorHandling.createErrorContext(
        'batch_content_generation',
        job.metadata.createdBy,
        job.organizationId,
        { jobId: job.id, briefId: item.briefId }
      );

      const result = await this.errorHandling.executeWithRetry(
        async () => {
          return await this.contentGeneration.generatePost({
            kind: briefData.kind,
            brief: briefData.brief,
            angle: briefData.angle,
            organizationId: job.organizationId,
            channel: job.metadata.channel || 'default',
            platform: briefData.platform
          });
        },
        'content_generation',
        undefined,
        context
      );

      if (result.success) {
        // Create content item
        const contentItemId = await this.db.createContentItem(
          job.organizationId,
          briefData.title || briefData.brief.substring(0, 100),
          briefData.kind === 'SOCIAL' ? 'SOCIAL_POST' : briefData.kind,
          'DRAFT',
          [],
          {
            channel: job.metadata.channel,
            brief: briefData.brief,
            angle: briefData.angle,
            generated: true,
            batchJobId: job.id,
            generationMetadata: {
              sources: result.result?.sources,
              factCheckResults: result.result?.factCheck
            }
          },
          job.metadata.createdBy || 'system'
        );

        // Create version
        const generatedContent = result.result?.draft?.answer || result.result?.draft?.data || '';
        const versionId = await this.db.createContentVersion(
          contentItemId,
          generatedContent,
          briefData.title || briefData.brief.substring(0, 100),
          result.result?.outline?.answer || result.result?.outline?.data || '',
          result.result?.citations || [],
          {
            citations: result.result?.citations || [],
            factCheck: result.result?.factCheck,
            sources: result.result?.sources,
            batchJobId: job.id,
            generationMetadata: {
              promptTemplates: {
                outline: result.result?.outline?.template || 'default',
                draft: result.result?.draft?.template || 'default'
              }
            }
          }
        );

        await this.db.setCurrentContentVersion(contentItemId, versionId);

        item.status = 'completed';
        item.contentItemId = contentItemId;
        item.generatedAt = new Date().toISOString();
        job.completedItems++;
      } else {
        item.status = 'failed';
        item.error = result.error?.message || 'Unknown error';
        job.failedItems++;
      }

      job.progress = Math.round(((job.completedItems + job.failedItems) / job.totalItems) * 100);
      
      this.logger.log(`Processed batch item ${item.briefId}`, {
        jobId: job.id,
        briefId: item.briefId,
        status: item.status,
        progress: job.progress
      });

    } catch (error) {
      item.status = 'failed';
      item.error = error instanceof Error ? error.message : 'Unknown error';
      job.failedItems++;
      job.progress = Math.round(((job.completedItems + job.failedItems) / job.totalItems) * 100);

      this.logger.error(`Failed to process batch item ${item.briefId}`, {
        jobId: job.id,
        briefId: item.briefId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async getBriefData(jobId: string, briefId: string): Promise<any> {
    // This would retrieve the original brief data from the database
    // For now, return mock data
    return {
      brief: `Generated brief for ${briefId}`,
      kind: 'BLOG' as const,
      angle: '',
      title: '',
      platform: undefined
    };
  }

  private async sendCompletionNotification(job: BatchGenerationJob): Promise<void> {
    try {
      // This would integrate with the notification service
      this.logger.log(`Sending completion notification for batch job ${job.id}`, {
        jobId: job.id,
        status: job.status,
        completedItems: job.completedItems,
        failedItems: job.failedItems
      });
    } catch (error) {
      this.logger.error(`Failed to send completion notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateEstimatedTimeRemaining(job: BatchGenerationJob): number | undefined {
    if (!job.startedAt || job.completedItems === 0) {
      return undefined;
    }

    const elapsed = Date.now() - new Date(job.startedAt).getTime();
    const averageTimePerItem = elapsed / job.completedItems;
    const remainingItems = job.totalItems - job.completedItems - job.failedItems;
    
    return Math.round(averageTimePerItem * remainingItems);
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
