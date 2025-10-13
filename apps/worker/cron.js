import http from 'http';

function call(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: 'api', port: 4000, path, method: 'GET' }, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.end();
  });
}

setInterval(async () => {
  const now = new Date().toISOString();
  console.log(`[sweeper] heartbeat at ${now}`);
  
  try {
    // Fetch due schedules from API
    const response = await call('/api/content/schedules/due');
    if (response.status === 200) {
      const data = JSON.parse(response.data);
      const schedules = data.schedules || [];
      
      if (schedules.length > 0) {
        console.log(`[sweeper] found ${schedules.length} due schedules`);
        
        // Import queue here to avoid circular dependency
        const { Queue } = await import('bullmq');
        const publishQueue = new Queue('publish-jobs', { connection: { url: process.env.REDIS_URL || 'redis://redis:6379' } });
        
        for (const schedule of schedules) {
          try {
            const scheduleId = schedule.id;
            const jobId = `publish:${scheduleId}:${schedule.platform}`;
            const job = await publishQueue.add(
              'publish',
              {
                scheduleId,
                contentItemId: schedule.content_item_id,
                platform: schedule.platform,
                scheduledAt: schedule.scheduled_at,
                organizationId: schedule.organization_id
              },
              { jobId }
            );
            // Call API to mark queued to avoid re-enqueue
            try {
              await call(`/api/content/schedules/${scheduleId}/queued`);
            } catch (markErr) {
              console.error(`[sweeper] failed to mark schedule queued ${scheduleId}:`, markErr.message);
            }
            console.log(`[sweeper] enqueued schedule ${schedule.id} as job ${job.id}`);
          } catch (err) {
            console.error(`[sweeper] failed to enqueue schedule ${schedule.id}:`, err.message);
          }
        }
      }
    }
  } catch (err) {
    console.error('[sweeper] error:', err.message);
  }
}, 60000);
