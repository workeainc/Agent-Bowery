import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { DbService } from './db.service';

@Injectable()
export class QueueService {
  private readonly testQueue: Queue;
  private readonly publishQueue: Queue;
  private readonly webhookQueue: Queue;
  private readonly batchGenerationQueue: Queue;

  constructor(private readonly dbService: DbService) {
    const connection = { url: process.env.REDIS_URL || 'redis://redis:6379' };
    this.testQueue = new Queue('test-jobs', { connection });
    this.publishQueue = new Queue('publish-jobs', { connection });
    this.webhookQueue = new Queue('webhook-jobs', { connection });
    this.batchGenerationQueue = new Queue('batch-generation-jobs', { connection });
  }

  async enqueueTest(data: any) {
    return this.testQueue.add('test', data, { removeOnComplete: 100, removeOnFail: 100 });
  }

  async enqueuePublish(data: { contentItemId: string; platform: string; scheduledAt?: string; scheduleId?: string; organizationId?: string }) {
    // Global pause check
    try {
      const flags = await this.dbService.getSystemFlags();
      if (flags.global_pause) {
        throw new Error('Global pause is active - all publishing is disabled');
      }
    } catch (error) {
      throw new Error(`Global pause check failed: ${error.message}`);
    }

    // Auto-post guardrails: check quality + autopost settings
    if (data.organizationId) {
      try {
        // Check if content passed quality checks
        const content = await this.dbService.getContentItem(data.contentItemId);
        if (!content || content.status !== 'APPROVED') {
          throw new Error('Content must be approved before auto-posting');
        }

        // Check autopost settings
        const settings = await this.dbService.getAutopostSettings(data.organizationId);
        if (!settings || !settings.autopost_enabled) {
          throw new Error('Auto-posting is disabled for this organization');
        }

        // If dry_run is true, we'll still queue but PlatformPublishService will simulate
        // If dry_run is false, we'll queue for real publishing
      } catch (error) {
        throw new Error(`Auto-post guardrail failed: ${error.message}`);
      }
    }

    const jobId = data.scheduleId ? `publish:${data.scheduleId}:${data.platform}` : undefined;
    return this.publishQueue.add('publish', data, {
      removeOnComplete: 100,
      removeOnFail: 100,
      attempts: 5,
      backoff: { type: 'providerRetry' },
      jobId,
    });
  }

  async enqueueWebhook(data: { idemKey: string; provider: string }) {
    return this.webhookQueue.add('webhook', data, {
      removeOnComplete: 100,
      removeOnFail: 100,
      attempts: 5,
      backoff: { type: 'exponential', delay: 3000 },
    });
  }

  async enqueueBatchGeneration(data: {
    jobId: string;
    organizationId: string;
    briefs: any[];
    options: any;
  }): Promise<void> {
    try {
      await this.batchGenerationQueue.add('process-batch-generation', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      });
      
      this.logger.log(`Enqueued batch generation job: ${data.jobId}`, {
        jobId: data.jobId,
        totalItems: data.briefs.length,
        organizationId: data.organizationId
      });
    } catch (error) {
      this.logger.error(`Failed to enqueue batch generation job: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}
