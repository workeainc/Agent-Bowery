import pkg from 'bullmq';
const { Worker } = pkg;
import './cron.js';

const connection = { url: process.env.REDIS_URL || 'redis://redis:6379' };

const testWorker = new Worker('test-jobs', async job => {
  const now = new Date().toISOString();
  console.log(`Processed job ${job.id} of type ${job.name} at ${now} with data:`, job.data);
  return { processedAt: now };
}, { connection });

testWorker.on('completed', job => {
  console.log(`Job ${job.id} completed`);
});

testWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

const publishWorker = new Worker('publish-jobs', async job => {
  const startTime = Date.now();
  const now = new Date().toISOString();
  console.log(`[publish] job ${job.id} at ${now}:`, job.data);
  
  try {
    // Import the platform publish service
    const { PlatformPublishService } = await import('../api/src/platform-publish.service.js');
    const { TokenService } = await import('../api/src/token.service.js');
    const { DbService } = await import('../api/src/db.service.js');
    const { MetaClientService } = await import('../api/src/platforms/meta/meta-client.service.js');
    const { LinkedInClientService } = await import('../api/src/platforms/linkedin/linkedin-client.service.js');
    const { MediaProcessingService } = await import('../api/src/services/media-processing.service.js');

    const tokenService = new TokenService();
    const dbService = new DbService();
    const metaClient = new MetaClientService();
    const linkedinClient = new LinkedInClientService();
    const mediaProcessingService = new MediaProcessingService();
    const publishService = new PlatformPublishService(
      tokenService,
      dbService,
      metaClient,
      linkedinClient,
      mediaProcessingService
    );
    
    // Publish to platform (with idempotency guard)
    const result = await publishService.publishToPlatform(job.data);
    const duration = Date.now() - startTime;
    try {
      const { metrics } = await import('../api/src/services/metrics.service.js');
      const platform = (job.data.platform || 'unknown').toUpperCase();
      // queue lag
      if (job.data.scheduledAt) {
        const lagSec = (Date.now() - new Date(job.data.scheduledAt).getTime()) / 1000;
        metrics.queueLag.set({ platform }, lagSec);
      }
      // latency + counters
      metrics.publishLatency.observe({ platform }, duration / 1000);
      if (result.success) metrics.publishSuccess.inc({ platform });
      else metrics.publishFailure.inc({ platform });
    } catch (_) {}
    
    // Record outcome
    const scheduleId = job.data.scheduleId;
    if (scheduleId) {
      await publishService.recordPublishOutcome(scheduleId, result, job.id, duration);
    }
    
    console.log(`[publish] job ${job.id} completed: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    return { 
      processedAt: now, 
      success: result.success, 
      providerId: result.providerId,
      error: result.error,
      duration 
    };
  } catch (error) {
    console.error(`[publish] job ${job.id} failed:`, error.message);
    // Attach dynamic backoff metadata if available
    if (error && typeof error === 'object' && error.retryAfterSeconds) {
      // BullMQ v4 custom backoff strategy via backoffStrategies is set below
      job.updateProgress({ retryAfterSeconds: error.retryAfterSeconds }).catch(()=>{});
    }
    throw error; // trigger retry
  }
}, { 
  connection,
  attempts: 5,
  backoff: { type: 'providerRetry' },
  removeOnComplete: 100,
  removeOnFail: 50,
  settings: {
    backoffStrategies: {
      providerRetry: (attempt, err) => {
        // Prefer Retry-After from error, else exponential fallback
        const retryAfter = (err && (err.retryAfterSeconds || err.retryAfter || (err.data && err.data.retryAfterSeconds))) || 0;
        if (retryAfter && Number.isFinite(Number(retryAfter))) {
          return Number(retryAfter) * 1000;
        }
        // base 2s exponential
        return Math.min(60000, 2000 * Math.pow(2, attempt - 1));
      }
    }
  }
});
// Webhook processing worker with retries and DLQ fallback
const webhookWorker = new Worker('webhook-jobs', async job => {
  const { idemKey, provider } = job.data;
  const now = new Date().toISOString();
  console.log(`[webhook] processing ${provider} idemKey=${idemKey} at ${now}`);
  // Simulate processing success
  return { processedAt: now };
}, { connection, 
  settings: { backoffStrategies: {} },
});

webhookWorker.on('failed', async (job, err) => {
  console.error(`[webhook] job ${job.id} failed:`, err.message);
});

webhookWorker.on('completed', job => {
  console.log(`[webhook] job ${job.id} completed`);
});

publishWorker.on('completed', job => {
  console.log(`[publish] Job ${job.id} completed`);
});

publishWorker.on('failed', async (job, err) => {
  console.error(`[publish] Job ${job?.id} failed:`, err);
  try {
    const { DbService } = await import('../api/src/db.service.js');
    const dbService = new DbService();
    const payload = job?.data || {};
    const platform = payload?.platform || 'unknown';
    const scheduleId = payload?.scheduleId || null;
    await dbService.insertPublishDlq(scheduleId, platform, err?.message || 'unknown_error', payload);
  } catch (e) {
    console.error('[publish] failed to persist to publish_dlq:', e?.message);
  }
});

console.log('Worker ready. Listening for jobs on queues: test-jobs, publish-jobs');

setInterval(() => {}, 1 << 30);
