import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import Redis from 'ioredis';
import { metrics } from './metrics.service';

interface SearchOptions {
  topK?: number;
  freshnessDays?: number;
}

interface AnswerOptions {
  maxTokens?: number;
  temperature?: number;
}

@Injectable()
export class PerplexityService {
  private readonly logger = new Logger(PerplexityService.name);
  private readonly http: AxiosInstance;
  private readonly redis: Redis;
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
    this.baseUrl = process.env.PERPLEXITY_BASE_URL || 'https://api.perplexity.ai';
    this.model = process.env.PERPLEXITY_MODEL || 'sonar-large-online';
    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : undefined,
    });
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  private dateBucket(): string {
    const d = new Date();
    return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
  }

  private async cacheGet(key: string): Promise<any | null> {
    try {
      const v = await this.redis.get(key);
      if (!v) return null;
      try { metrics.perplexityCacheHit.inc({ method: 'search' }); } catch (_) {}
      return JSON.parse(v);
    } catch (_) {
      return null;
    }
  }

  private async cacheSet(key: string, value: any, ttlSec: number) {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSec);
    } catch (_) {}
  }

  async search(query: string, options: SearchOptions = {}) {
    const topK = options.topK ?? 8;
    const freshnessDays = options.freshnessDays ?? 30;
    const qHash = crypto.createHash('sha256').update(`${query}|${topK}|${freshnessDays}`).digest('base64url');
    const key = `perplexity:search:${this.dateBucket()}:${qHash}`;

    const cached = await this.cacheGet(key);
    if (cached) {
      return { ...cached, cached: true };
    }

    const start = Date.now();
    const doCall = async () => this.http.post('/v1/search', {
        model: this.model,
        query,
        top_k: topK,
        freshness_days: freshnessDays,
      });
    try {
      const resp = await this.withRetries(doCall, 'search');
      const durationMs = Date.now() - start;
      const result = { ...resp.data, durationMs };
      try { metrics.perplexityLatency.observe({ method: 'search', cached: 'false' }, durationMs / 1000); metrics.perplexitySuccess.inc({ method: 'search' }); } catch (_) {}
      this.trackTokens('search', resp?.data);
      await this.cacheSet(key, result, 24 * 60 * 60);
      return result;
    } catch (error: any) {
      this.logger.error(`perplexity.search error: ${error?.message || error}`);
      try { metrics.perplexityFailure.inc({ method: 'search' }); } catch (_) {}
      throw error;
    }
  }

  async answer(question: string, context: string[] = [], options: AnswerOptions = {}) {
    const start = Date.now();
    const qHash = crypto.createHash('sha256').update(`${question}|${(context||[]).join('|')}|${options.maxTokens ?? 800}|${options.temperature ?? 0.3}`).digest('base64url');
    const key = `perplexity:answer:${this.dateBucket()}:${qHash}`;
    const cached = await this.cacheGet(key);
    if (cached) {
      try { metrics.perplexityLatency.observe({ method: 'answer', cached: 'true' }, 0); metrics.perplexitySuccess.inc({ method: 'answer' }); } catch (_) {}
      return { ...cached, cached: true };
    }
    const doCall = async () => this.http.post('/v1/answer', {
        model: this.model,
        question,
        context,
        max_tokens: options.maxTokens ?? 800,
        temperature: options.temperature ?? 0.3,
      });
    try {
      const resp = await this.withRetries(doCall, 'answer');
      const durationMs = Date.now() - start;
      try { metrics.perplexityLatency.observe({ method: 'answer', cached: 'false' }, durationMs / 1000); metrics.perplexitySuccess.inc({ method: 'answer' }); } catch (_) {}
      this.trackTokens('answer', resp?.data);
      const result = { ...resp.data, durationMs };
      await this.cacheSet(key, result, 24 * 60 * 60);
      return result;
    } catch (error: any) {
      this.logger.error(`perplexity.answer error: ${error?.message || error}`);
      try { metrics.perplexityFailure.inc({ method: 'answer' }); } catch (_) {}
      throw error;
    }
  }

  async factCheck(claims: string[], k: number = 3) {
    const start = Date.now();
    const doCall = async () => this.http.post('/v1/factcheck', {
        model: this.model,
        claims,
        top_k: k,
      });
    try {
      const resp = await this.withRetries(doCall, 'factcheck');
      const durationMs = Date.now() - start;
      try { metrics.perplexityLatency.observe({ method: 'factcheck', cached: 'false' }, durationMs / 1000); metrics.perplexitySuccess.inc({ method: 'factcheck' }); } catch (_) {}
      this.trackTokens('factcheck', resp?.data);
      return { ...resp.data, durationMs };
    } catch (error: any) {
      this.logger.error(`perplexity.factcheck error: ${error?.message || error}`);
      try { metrics.perplexityFailure.inc({ method: 'factcheck' }); } catch (_) {}
      throw error;
    }
  }

  private trackTokens(method: 'search'|'answer'|'factcheck', data: any) {
    try {
      const usage = data?.usage || data?.meta?.usage || {};
      const prompt = usage.prompt_tokens || usage.prompt || 0;
      const completion = usage.completion_tokens || usage.completion || 0;
      const total = usage.total_tokens || usage.total || (prompt + completion);
      if (prompt) metrics.perplexityTokens.inc({ method, token_type: 'prompt' }, prompt);
      if (completion) metrics.perplexityTokens.inc({ method, token_type: 'completion' }, completion);
      if (total) metrics.perplexityTokens.inc({ method, token_type: 'total' }, total);
    } catch (_) {}
  }

  private async withRetries<T>(fn: () => Promise<T>, method: string, maxRetries = 3): Promise<T> {
    let attempt = 0;
    let delay = 500;
    while (true) {
      try {
        return await fn();
      } catch (err: any) {
        attempt++;
        const status = err?.response?.status;
        const retryAfter = parseInt(err?.response?.headers?.['retry-after']) || err?.retryAfter || 0;
        if (attempt > maxRetries || (status && status < 500 && status !== 429)) {
          throw err;
        }
        const backoff = retryAfter > 0 ? retryAfter * 1000 : delay;
        await new Promise(res => setTimeout(res, backoff));
        delay = Math.min(delay * 2, 8000);
      }
    }
  }
}


