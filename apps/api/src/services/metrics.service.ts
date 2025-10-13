import client from 'prom-client';

export class MetricsService {
  queueLag: client.Gauge;
  publishLatency: client.Histogram;
  publishSuccess: client.Counter;
  publishFailure: client.Counter;
  perplexityLatency: client.Histogram;
  perplexitySuccess: client.Counter;
  perplexityFailure: client.Counter;
  perplexityCacheHit: client.Counter;
  perplexityTokens: client.Counter;

  constructor() {
    client.collectDefaultMetrics();

    this.queueLag = new client.Gauge({
      name: 'publish_queue_lag_seconds',
      help: 'Time between scheduledAt and dequeue time',
      labelNames: ['platform'] as const
    });

    this.publishLatency = new client.Histogram({
      name: 'publish_latency_seconds',
      help: 'Latency of publish operations',
      labelNames: ['platform'] as const,
      buckets: [0.5, 1, 2, 5, 10, 20, 60]
    });

    this.publishSuccess = new client.Counter({
      name: 'publish_success_total',
      help: 'Total successful publishes',
      labelNames: ['platform'] as const
    });

    this.publishFailure = new client.Counter({
      name: 'publish_failure_total',
      help: 'Total failed publishes',
      labelNames: ['platform'] as const
    });

    this.perplexityLatency = new client.Histogram({
      name: 'perplexity_latency_seconds',
      help: 'Latency of perplexity operations',
      labelNames: ['method', 'cached'] as const,
      buckets: [0.2, 0.5, 1, 2, 5, 10, 20]
    });

    this.perplexitySuccess = new client.Counter({
      name: 'perplexity_success_total',
      help: 'Total successful perplexity operations',
      labelNames: ['method'] as const
    });

    this.perplexityFailure = new client.Counter({
      name: 'perplexity_failure_total',
      help: 'Total failed perplexity operations',
      labelNames: ['method'] as const
    });

    this.perplexityCacheHit = new client.Counter({
      name: 'perplexity_cache_hit_total',
      help: 'Total cache hits for perplexity operations',
      labelNames: ['method'] as const
    });

    this.perplexityTokens = new client.Counter({
      name: 'perplexity_tokens_total',
      help: 'Total tokens used by perplexity operations',
      labelNames: ['method', 'token_type'] as const // token_type: prompt|completion|total
    });
  }
}

export const metrics = new MetricsService();


