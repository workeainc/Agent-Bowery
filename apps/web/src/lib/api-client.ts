import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, PaginatedResponse } from '@/types';
import { CSRFManager } from './csrf';

class APIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:43000';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token and CSRF protection
    this.client.interceptors.request.use(
      async (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add CSRF protection for non-GET requests
        if (config.method !== 'get') {
          const csrfManager = CSRFManager.getInstance();
          const csrfToken = csrfManager.getToken();
          const sessionId = csrfManager.getSessionId();
          
          if (csrfToken && sessionId) {
            config.headers['X-CSRF-Token'] = csrfToken;
            config.headers['X-Session-Id'] = sessionId;
          }
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.code === 'ECONNREFUSED') {
          console.warn('Backend API is not running. Some features may not work.');
          // Return mock data instead of throwing error
          return Promise.resolve({ data: { success: false, error: 'Backend not available' } });
        }
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  // Method to get token from NextAuth session
  private async getTokenFromSession(): Promise<string | null> {
    try {
      // Try to get token from NextAuth session
      const { getSession } = await import('next-auth/react');
      const session = await getSession();
      
      if (session?.user) {
        // Check if we have a stored token for this user
        const storedToken = this.getAuthToken();
        if (storedToken) {
          return storedToken;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting token from session:', error);
      return null;
    }
  }

  private handleUnauthorized(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      window.location.href = '/auth/login';
    }
  }

  // Generic request methods
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    params?: any
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.request({
        method,
        url,
        data,
        params,
      });
      return response.data;
    } catch (error) {
      console.error(`API ${method} ${url} error:`, error);
      throw error;
    }
  }

  // Content endpoints
  async getContent(params?: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> {
    return this.request('GET', '/content', undefined, params);
  }

  async getContentById(id: string): Promise<any> {
    return this.request('GET', `/content/${id}`);
  }

  async createContent(data: any): Promise<any> {
    return this.request('POST', '/content', data);
  }

  async updateContent(id: string, data: any): Promise<any> {
    return this.request('PUT', `/content/${id}`, data);
  }

  async deleteContent(id: string): Promise<any> {
    return this.request('DELETE', `/content/${id}`);
  }

  // Content moderation endpoints (minimal wiring)
  async approveContent(id: string): Promise<any> {
    return this.request('POST', `/content/${id}/approve`);
  }

  async rejectContent(id: string, reason?: string): Promise<any> {
    return this.request('POST', `/content/${id}/reject`, { reason });
  }

  async bulkApproveContent(ids: string[]): Promise<any> {
    return this.request('POST', `/content/bulk/approve`, { ids });
  }

  async bulkRejectContent(ids: string[], reason?: string): Promise<any> {
    return this.request('POST', `/content/bulk/reject`, { ids, reason });
  }

  async generateContent(data: any): Promise<any> {
    return this.request('POST', '/content/generate', data);
  }

  // Platform endpoints
  async getConnectedPlatforms(organizationId?: string): Promise<any[]> {
    return this.request('GET', '/platforms/accounts', undefined, { organizationId });
  }

  async getPlatformConnectUrl(platform: string, organizationId?: string): Promise<{ authUrl: string; state: string }> {
    return this.request('GET', `/platforms/${platform}/connect`, undefined, { organizationId });
  }

  async disconnectPlatform(platform: string, accountId: string): Promise<any> {
    return this.request('POST', `/platforms/${platform}/disconnect`, { accountId });
  }

  // OAuth endpoints
  async startOAuthFlow(provider: string): Promise<{ provider: string; redirectUrl: string }> {
    return this.request('GET', `/oauth/${provider}/start`);
  }

  async getOAuthStatus(provider: string): Promise<any> {
    return this.request('GET', `/oauth/${provider}/status`);
  }

  async refreshOAuthToken(provider: string, refreshToken: string): Promise<any> {
    return this.request('POST', `/oauth/${provider}/refresh`, { refreshToken });
  }

  async getMetaPages(): Promise<{ pages: any[] }> {
    return this.request('GET', '/oauth/meta/pages');
  }

  async selectMetaPage(pageId: string): Promise<any> {
    return this.request('POST', '/oauth/meta/pages/select', { pageId });
  }

  // Batch Generation endpoints
  async createBatchGenerationJob(data: {
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
  }): Promise<{ success: boolean; jobId: string; message: string; totalItems: number }> {
    return this.request('POST', '/content/generate/batch', data);
  }

  async getBatchJobProgress(jobId: string): Promise<any> {
    return this.request('GET', `/content/generate/batch/${jobId}/progress`);
  }

  async cancelBatchJob(jobId: string): Promise<any> {
    return this.request('POST', `/content/generate/batch/${jobId}/cancel`);
  }

  // Smart Scheduling endpoints
  async createSmartSchedule(data: {
    organizationId: string;
    contentId: string;
    platforms: string[];
    preferences: {
      optimalTimes?: string[];
      avoidTimes?: string[];
      timezone?: string;
      maxPostsPerDay?: number;
    };
  }): Promise<any> {
    return this.request('POST', '/content/schedule/smart', data);
  }

  async getScheduleAnalytics(platform: string, organizationId: string, days: number = 30): Promise<any> {
    return this.request('GET', `/content/schedule/analytics/${platform}`, undefined, { organizationId, days });
  }

  async createRecurringSchedule(data: {
    organizationId: string;
    templateId: string;
    platforms: string[];
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string;
      days?: number[];
      timezone: string;
    };
  }): Promise<any> {
    return this.request('POST', '/content/schedule/recurring', data);
  }

  // Content Optimization endpoints
  async optimizeContent(contentId: string, options?: {
    targetAudience?: string;
    platform?: string;
    goals?: string[];
  }): Promise<any> {
    return this.request('POST', `/content/${contentId}/optimize`, options);
  }

  async createABTest(contentId: string, variants: Array<{
    title: string;
    content: string;
    description?: string;
  }>): Promise<any> {
    return this.request('POST', `/content/${contentId}/ab-test`, { variants });
  }

  async getOptimizationSuggestions(contentId: string): Promise<any> {
    return this.request('GET', `/content/${contentId}/optimization-suggestions`);
  }

  // Workflow Rules endpoints
  async createWorkflowRule(data: {
    organizationId: string;
    name: string;
    description: string;
    conditions: Array<{
      field: string;
      operator: string;
      value: string;
    }>;
    actions: Array<{
      type: string;
      parameters: Record<string, any>;
    }>;
    enabled: boolean;
  }): Promise<any> {
    return this.request('POST', '/content/workflow/rules', data);
  }

  async getWorkflowRules(organizationId: string): Promise<any[]> {
    return this.request('GET', '/content/workflow/rules', undefined, { organizationId });
  }

  async executeWorkflow(ruleId: string): Promise<any> {
    return this.request('POST', `/content/workflow/execute/${ruleId}`);
  }

  // Token Management endpoints
  async getTokenStatus(provider: string): Promise<{
    ok: boolean;
    provider: string;
    hasToken?: boolean;
    isDummy?: boolean;
    tokenPreview?: string;
    message?: string;
  }> {
    return this.request('GET', `/tokens/${provider}/status`);
  }

  async refreshToken(provider: string, oldToken?: string): Promise<{
    ok: boolean;
    provider: string;
    message: string;
    newTokenPreview?: string;
  }> {
    return this.request('POST', `/tokens/${provider}/refresh`, { oldToken });
  }

  async getTokenAudit(provider: string): Promise<{
    ok: boolean;
    provider: string;
    message: string;
    note?: string;
  }> {
    return this.request('GET', `/tokens/audit/${provider}`);
  }

  // Webhook Management endpoints
  async verifyWebhook(provider: string, params: {
    'hub.mode'?: string;
    'hub.verify_token'?: string;
    'hub.challenge'?: string;
  }): Promise<string> {
    return this.request('GET', `/webhooks/${provider}`, undefined, params);
  }

  async getWebhookEvents(provider: string, organizationId: string, limit: number = 50): Promise<{
    events: Array<{
      id: string;
      platform: string;
      eventType: string;
      status: string;
      attempts: number;
      createdAt: string;
      updatedAt: string;
      payload?: any;
    }>;
    total: number;
  }> {
    return this.request('GET', `/webhooks/${provider}/events`, undefined, { organizationId, limit });
  }

  async getWebhookStatus(provider: string): Promise<{
    provider: string;
    webhookUrl: string;
    isActive: boolean;
    lastEvent?: string;
    eventCount: number;
    errorCount: number;
  }> {
    return this.request('GET', `/webhooks/${provider}/status`);
  }

  // Posts Testing endpoints
  async testPlatformConnection(provider: string): Promise<{
    ok: boolean;
    provider: string;
    platform?: string;
    token_preview?: string;
    dummy?: boolean;
    error?: string;
  }> {
    return this.request('GET', `/posts/${provider}/test`);
  }

  async pingPlatform(provider: string): Promise<{
    ok: boolean;
    dry_run?: boolean;
    error?: string;
  }> {
    return this.request('GET', `/posts/${provider}/ping`);
  }

  async dryRunPost(provider: string, content: { text: string }): Promise<{
    ok: boolean;
    dry_run?: boolean;
    would_post?: boolean;
    payload?: any;
    error?: string;
  }> {
    return this.request('POST', `/posts/${provider}/dry-run`, content);
  }

  // Admin endpoints
  async replayPublishDlq(dlqId: string): Promise<{
    success: boolean;
    scheduleId?: string;
    platform?: string;
  }> {
    return this.request('POST', `/admin/publish-dlq/${dlqId}/replay`);
  }

  async createPromptTemplate(template: {
    name: string;
    version: string;
    channel: string;
    inputSchema?: any;
    template: string;
    outputSchema?: any;
  }): Promise<{ id: string }> {
    return this.request('POST', '/admin/prompt-templates', template);
  }

  async updatePromptTemplate(id: string, updates: {
    inputSchema?: any;
    template?: string;
    outputSchema?: any;
  }): Promise<{ id: string; updated: boolean }> {
    return this.request('POST', `/admin/prompt-templates/${id}`, updates);
  }

  async upsertPromptTemplate(template: {
    name: string;
    version: string;
    channel: string;
    inputSchema?: any;
    template: string;
    outputSchema?: any;
  }): Promise<{ id: string; updated?: boolean; created?: boolean }> {
    return this.request('POST', '/admin/prompt-templates/upsert', template);
  }

  async getPromptTemplate(id: string): Promise<any> {
    return this.request('GET', `/admin/prompt-templates/${id}`);
  }

  async listPromptTemplates(params?: {
    name?: string;
    channel?: string;
    limit?: number;
  }): Promise<{ templates: any[] }> {
    return this.request('GET', '/admin/prompt-templates', undefined, params);
  }

  async getQualityPolicy(organizationId: string, channel: string): Promise<any> {
    return this.request('GET', `/admin/quality-policies/${organizationId}/${channel}`);
  }

  async upsertQualityPolicy(organizationId: string, channel: string, policy: {
    min_readability?: number;
    max_similarity?: number;
    min_fact_supported_ratio?: number;
    toxicity_blocklist?: string[];
    language?: string;
    max_length?: number;
  }): Promise<{ organizationId: string; channel: string; updated: boolean; policy: any }> {
    return this.request('POST', `/admin/quality-policies/${organizationId}/${channel}`, policy);
  }

  async getAutopostSettings(organizationId: string): Promise<any> {
    return this.request('GET', `/admin/autopost/${organizationId}`);
  }

  async upsertAutopostSettings(organizationId: string, settings: {
    autopost_enabled?: boolean;
    dry_run?: boolean;
  }): Promise<{ organizationId: string; updated: boolean; settings: any }> {
    return this.request('POST', `/admin/autopost/${organizationId}`, settings);
  }

  async emergencyStopAutopost(organizationId: string): Promise<{
    organizationId: string;
    emergencyStop: boolean;
    settings: any;
  }> {
    return this.request('POST', `/admin/autopost/${organizationId}/emergency-stop`);
  }

  async resumeAutopost(organizationId: string): Promise<{
    organizationId: string;
    resumed: boolean;
    settings: any;
  }> {
    return this.request('POST', `/admin/autopost/${organizationId}/resume`);
  }

  // Health & Monitoring endpoints
  async getHealthStatus(): Promise<{ status: string }> {
    return this.request('GET', '/health');
  }

  async getSystemHealth(): Promise<{
    status: 'ok' | 'error' | 'warning';
    globalPause: boolean;
    systemStatus: 'active' | 'offline' | 'error';
    updatedAt: string;
    providers: {
      meta: boolean;
      linkedin: boolean;
      google: boolean;
    };
    error?: string;
  }> {
    return this.request('GET', '/health/system');
  }

  async getOAuthHealth(): Promise<{
    ready: boolean;
    required: Record<string, boolean>;
    dryRun: boolean;
    base: string | null;
    allowlist: string[];
    providers: {
      meta: boolean;
      linkedin: boolean;
    };
  }> {
    return this.request('GET', '/health/oauth');
  }

  async getMetrics(): Promise<string> {
    return this.request('GET', '/metrics');
  }

  // Schedule endpoints
  async getSchedules(params?: any): Promise<any[]> {
    return this.request('GET', '/content/schedules', undefined, params);
  }


  // Analytics endpoints
  async getAnalytics(timeframe?: string): Promise<any> {
    return this.request('GET', '/analytics', undefined, { timeframe });
  }

  // Admin endpoints
  async getTemplates(): Promise<any[]> {
    return this.request('GET', '/admin/templates');
  }

  async createTemplate(data: any): Promise<any> {
    return this.request('POST', '/admin/templates', data);
  }

  async updateBrandRules(data: any): Promise<any> {
    return this.request('POST', '/admin/brand-rules', data);
  }

  // Lead endpoints
  async getLeads(params?: any): Promise<any[]> {
    return this.request('GET', '/leads', undefined, params);
  }

  async createLead(data: any): Promise<any> {
    return this.request('POST', '/leads', data);
  }

  async updateLead(id: string, data: any): Promise<any> {
    return this.request('PUT', `/leads/${id}`, data);
  }

  // Utility methods
  setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  removeAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Jobs & Queue Management endpoints
  async enqueueTestJob(data?: { data?: any }): Promise<{
    id: string;
    name: string;
    data: any;
  }> {
    return this.request('POST', '/jobs/test', data);
  }

  async getTestJobStatus(): Promise<{
    id: string;
    name: string;
    data: any;
  }> {
    return this.request('GET', '/jobs/test');
  }

  // Authentication endpoints
  async getDevToken(): Promise<{
    token: string;
    expiresAt: string;
  }> {
    return this.request('GET', '/auth/dev-token');
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<{
    user: any;
    token: string;
    refreshToken: string;
  }> {
    return this.request('POST', '/auth/login', credentials);
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
  }): Promise<{
    user: any;
    token: string;
    refreshToken: string;
  }> {
    return this.request('POST', '/auth/register', userData);
  }

  async logout(): Promise<{ success: boolean }> {
    return this.request('POST', '/auth/logout');
  }

  async getCurrentUser(): Promise<any> {
    return this.request('GET', '/auth/me');
  }

  async refreshJwtToken(refreshToken: string): Promise<{
    token: string;
    refreshToken: string;
  }> {
    return this.request('POST', '/auth/refresh', { refreshToken });
  }

  // Advanced Content Features endpoints
  async createContentVersion(contentId: string, data: {
    version: number;
    body: string;
    metadataJson?: Record<string, any>;
  }): Promise<any> {
    return this.request('POST', `/content/${contentId}/version`, data);
  }

  async setCurrentVersion(contentId: string, versionId: string): Promise<any> {
    return this.request('POST', `/content/${contentId}/version/current`, { versionId });
  }

  async getContentVersions(contentId: string): Promise<any[]> {
    return this.request('GET', `/content/${contentId}/versions`);
  }

  async getContentPreviews(contentId: string): Promise<any[]> {
    return this.request('GET', `/content/${contentId}/previews`);
  }

  async regeneratePreviews(contentId: string): Promise<any> {
    return this.request('POST', `/content/${contentId}/previews/regenerate`);
  }

  async previewAllPlatforms(contentId: string): Promise<any> {
    return this.request('POST', `/content/${contentId}/preview-all`);
  }

  async adaptContent(contentId: string, platform: string, options?: any): Promise<any> {
    return this.request('POST', `/content/${contentId}/adapt`, { platform, ...options });
  }

  async bulkScheduleContent(contentId: string, schedules: any[]): Promise<any> {
    return this.request('POST', `/content/${contentId}/schedule/bulk`, { schedules });
  }

  async bulkCreateContent(contentItems: any[]): Promise<any[]> {
    return this.request('POST', '/content/bulk', { contentItems });
  }

  async searchContent(params: {
    query?: string;
    type?: string;
    status?: string;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> {
    return this.request('GET', '/content/search', undefined, params);
  }

  async getTargetAccounts(): Promise<any[]> {
    return this.request('GET', '/content/target-accounts');
  }

  async createTargetAccount(data: {
    platform: string;
    accountId: string;
    accountName: string;
    accountType: string;
  }): Promise<any> {
    return this.request('POST', '/content/target-accounts', data);
  }

  async updateTargetAccount(accountId: string, data: any): Promise<any> {
    return this.request('PUT', `/content/target-accounts/${accountId}`, data);
  }

  async updateScheduleTarget(scheduleId: string, targetAccountId: string): Promise<any> {
    return this.request('POST', `/content/schedules/${scheduleId}/target-account`, { targetAccountId });
  }

  // Advanced AI & Analytics endpoints
  async perplexitySearch(query: string, options?: {
    maxResults?: number;
    includeImages?: boolean;
  }): Promise<{
    results: Array<{
      title: string;
      url: string;
      snippet: string;
      publishedDate?: string;
    }>;
    query: string;
  }> {
    return this.request('POST', '/content/perplexity/search', { query, ...options });
  }

  async perplexityAnswer(question: string, context?: string): Promise<{
    answer: string;
    sources: string[];
    confidence: number;
  }> {
    return this.request('POST', '/content/perplexity/answer', { question, context });
  }

  async perplexityFactCheck(content: string): Promise<{
    isFactual: boolean;
    confidence: number;
    issues: Array<{
      text: string;
      issue: string;
      suggestion: string;
    }>;
  }> {
    return this.request('POST', '/content/perplexity/factcheck', { content });
  }

  async analyzeContentQuality(contentId: string): Promise<{
    overallScore: number;
    readability: number;
    engagement: number;
    brandCompliance: number;
    suggestions: Array<{
      type: 'improvement' | 'warning' | 'error';
      message: string;
      priority: 'low' | 'medium' | 'high';
    }>;
  }> {
    return this.request('POST', '/content/quality/analyze', { contentId });
  }

  async getContentPerformance(contentItemId: string): Promise<{
    contentId: string;
    metrics: {
      views: number;
      engagement: number;
      reach: number;
      clicks: number;
      shares: number;
      comments: number;
    };
    platforms: Array<{
      platform: string;
      performance: number;
      engagement: number;
    }>;
    trends: Array<{
      date: string;
      views: number;
      engagement: number;
    }>;
  }> {
    return this.request('GET', `/content/performance/${contentItemId}`);
  }

  async compareContentPerformance(contentIds: string[]): Promise<{
    comparison: Array<{
      contentId: string;
      title: string;
      metrics: {
        views: number;
        engagement: number;
        reach: number;
      };
      ranking: number;
    }>;
    insights: Array<{
      type: 'best_performing' | 'trending' | 'underperforming';
      contentId: string;
      message: string;
    }>;
  }> {
    return this.request('POST', '/content/performance/compare', { contentIds });
  }

  async optimizeMediaForPlatform(mediaId: string, platform: string): Promise<{
    optimizedMedia: {
      url: string;
      format: string;
      size: string;
      dimensions: { width: number; height: number };
    };
    optimizations: Array<{
      type: string;
      description: string;
      impact: 'low' | 'medium' | 'high';
    }>;
  }> {
    return this.request('POST', '/content/media/optimize', { mediaId, platform });
  }

  async generateMediaSuggestions(contentId: string): Promise<{
    suggestions: Array<{
      type: 'image' | 'video' | 'gif';
      description: string;
      style: string;
      platform: string;
      reasoning: string;
    }>;
    aiGenerated: Array<{
      prompt: string;
      style: string;
      platforms: string[];
    }>;
  }> {
    return this.request('POST', '/content/media/suggestions', { contentId });
  }

  async trackOptimizationEffectiveness(optimizationId: string): Promise<{
    optimizationId: string;
    effectiveness: {
      beforeMetrics: any;
      afterMetrics: any;
      improvement: number;
      status: 'improved' | 'degraded' | 'neutral';
    };
    recommendations: Array<{
      action: string;
      priority: 'low' | 'medium' | 'high';
      expectedImpact: string;
    }>;
  }> {
    return this.request('POST', '/content/optimization/track', { optimizationId });
  }

  // Advanced Workflow & Notifications endpoints
  async escalateWorkflow(contentId: string, reason: string): Promise<{
    success: boolean;
    escalationId: string;
    message: string;
  }> {
    return this.request('POST', '/content/workflow/escalate', { contentId, reason });
  }

  async getWorkflowAnalytics(workflowId: string): Promise<{
    workflowId: string;
    metrics: {
      totalContent: number;
      completedContent: number;
      pendingContent: number;
      escalatedContent: number;
      averageProcessingTime: number;
    };
    trends: Array<{
      date: string;
      completed: number;
      escalated: number;
    }>;
  }> {
    return this.request('GET', `/content/workflow/analytics/${workflowId}`);
  }

  async createNotificationChannel(data: {
    name: string;
    type: 'email' | 'slack' | 'webhook' | 'sms';
    config: Record<string, any>;
    enabled: boolean;
  }): Promise<{
    id: string;
    name: string;
    type: string;
    config: Record<string, any>;
    enabled: boolean;
    createdAt: string;
  }> {
    return this.request('POST', '/content/notifications/channels', data);
  }

  async createNotificationTemplate(data: {
    name: string;
    subject: string;
    body: string;
    variables: string[];
    channelId: string;
  }): Promise<{
    id: string;
    name: string;
    subject: string;
    body: string;
    variables: string[];
    channelId: string;
    createdAt: string;
  }> {
    return this.request('POST', '/content/notifications/templates', data);
  }

  async createNotificationRule(data: {
    name: string;
    trigger: string;
    conditions: Record<string, any>;
    templateId: string;
    channelId: string;
    enabled: boolean;
  }): Promise<{
    id: string;
    name: string;
    trigger: string;
    conditions: Record<string, any>;
    templateId: string;
    channelId: string;
    enabled: boolean;
    createdAt: string;
  }> {
    return this.request('POST', '/content/notifications/rules', data);
  }

  async sendNotification(data: {
    templateId: string;
    channelId: string;
    recipients: string[];
    variables: Record<string, any>;
  }): Promise<{
    success: boolean;
    notificationId: string;
    sentCount: number;
    failedCount: number;
  }> {
    return this.request('POST', '/content/notifications/send', data);
  }

  async getNotificationHistory(userId: string): Promise<Array<{
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    channel: string;
  }>> {
    return this.request('GET', `/content/notifications/history/${userId}`);
  }

  async getNotificationAnalytics(): Promise<{
    totalNotifications: number;
    sentNotifications: number;
    failedNotifications: number;
    channels: Array<{
      channelId: string;
      channelName: string;
      sentCount: number;
      successRate: number;
    }>;
    templates: Array<{
      templateId: string;
      templateName: string;
      usageCount: number;
      successRate: number;
    }>;
  }> {
    return this.request('GET', '/content/notifications/analytics');
  }

  // Advanced Scheduling endpoints
  async getOptimalTiming(platform: string): Promise<{
    platform: string;
    optimalTimes: Array<{
      dayOfWeek: string;
      hour: number;
      engagementScore: number;
      reachScore: number;
      recommendation: string;
    }>;
    bestTime: {
      dayOfWeek: string;
      hour: number;
      score: number;
    };
    insights: Array<{
      type: 'peak' | 'valley' | 'trend';
      message: string;
      impact: 'high' | 'medium' | 'low';
    }>;
  }> {
    return this.request('GET', `/content/scheduling/optimal-timing/${platform}`);
  }

  async getScheduleRecommendations(data: {
    contentId: string;
    platforms: string[];
    timeframe?: string;
    preferences?: Record<string, any>;
  }): Promise<{
    contentId: string;
    recommendations: Array<{
      platform: string;
      suggestedTime: string;
      confidence: number;
      reasoning: string;
      expectedEngagement: number;
    }>;
    conflicts: Array<{
      type: 'overlap' | 'frequency' | 'content';
      message: string;
      severity: 'high' | 'medium' | 'low';
    }>;
  }> {
    return this.request('POST', '/content/scheduling/recommendations', data);
  }

  async detectScheduleConflicts(data: {
    contentId: string;
    platforms: string[];
    proposedTimes: Array<{
      platform: string;
      scheduledAt: string;
    }>;
  }): Promise<{
    conflicts: Array<{
      type: 'overlap' | 'frequency' | 'content_similarity' | 'audience_overlap';
      severity: 'high' | 'medium' | 'low';
      message: string;
      affectedSchedules: string[];
      suggestion: string;
    }>;
    recommendations: Array<{
      platform: string;
      alternativeTime: string;
      reasoning: string;
    }>;
  }> {
    return this.request('POST', '/content/scheduling/conflicts', data);
  }

  async suggestOptimalSchedule(data: {
    contentId: string;
    platforms: string[];
    constraints?: {
      earliestTime?: string;
      latestTime?: string;
      avoidDays?: string[];
      preferredDays?: string[];
    };
  }): Promise<{
    contentId: string;
    suggestions: Array<{
      platform: string;
      suggestedTime: string;
      score: number;
      reasoning: string;
      expectedMetrics: {
        engagement: number;
        reach: number;
        clicks: number;
      };
    }>;
    overallScore: number;
    alternativeOptions: Array<{
      platform: string;
      time: string;
      score: number;
      tradeoffs: string[];
    }>;
  }> {
    return this.request('POST', '/content/scheduling/suggest', data);
  }

  async getSchedulingAnalytics(platform: string): Promise<{
    platform: string;
    metrics: {
      totalScheduled: number;
      completedSchedules: number;
      cancelledSchedules: number;
      averageEngagement: number;
      bestPerformingTime: string;
    };
    trends: Array<{
      date: string;
      scheduled: number;
      published: number;
      engagement: number;
    }>;
    performanceByTime: Array<{
      hour: number;
      dayOfWeek: string;
      averageEngagement: number;
      scheduleCount: number;
    }>;
  }> {
    return this.request('GET', `/content/scheduling/analytics/${platform}`);
  }

  async rescheduleContent(scheduleId: string, newTime: string): Promise<{
    success: boolean;
    scheduleId: string;
    oldTime: string;
    newTime: string;
    conflicts: Array<{
      type: string;
      message: string;
      severity: string;
    }>;
  }> {
    return this.request('POST', `/content/schedules/${scheduleId}/reschedule`, { newTime });
  }

  async cancelSchedule(scheduleId: string, reason?: string): Promise<{
    success: boolean;
    scheduleId: string;
    cancelledAt: string;
    reason: string;
  }> {
    return this.request('POST', `/content/schedules/${scheduleId}/cancel`, { reason });
  }

  async getDueSchedules(): Promise<Array<{
    id: string;
    contentId: string;
    platform: string;
    scheduledAt: string;
    status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
    priority: 'low' | 'medium' | 'high';
    content: {
      title: string;
      type: string;
    };
  }>> {
    return this.request('GET', '/content/schedules/due');
  }

  async markScheduleAsQueued(scheduleId: string): Promise<{
    success: boolean;
    scheduleId: string;
    queuedAt: string;
    queuePosition: number;
  }> {
    return this.request('POST', `/content/schedules/${scheduleId}/queued`);
  }

  // Pipeline Monitoring endpoints
  async getPipelineProgress(pipelineId: string): Promise<{
    pipelineId: string;
    status: 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
    progress: number;
    currentStep: string;
    totalSteps: number;
    completedSteps: number;
    steps: Array<{
      id: string;
      name: string;
      status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
      startedAt?: string;
      completedAt?: string;
      error?: string;
      duration?: number;
    }>;
    estimatedTimeRemaining?: number;
    startedAt: string;
    updatedAt: string;
  }> {
    return this.request('GET', `/content/pipeline/${pipelineId}/progress`);
  }

  async getPipelineMetrics(pipelineId: string): Promise<{
    pipelineId: string;
    metrics: {
      totalDuration: number;
      averageStepDuration: number;
      successRate: number;
      failureRate: number;
      throughput: number;
    };
    stepMetrics: Array<{
      stepId: string;
      stepName: string;
      averageDuration: number;
      successRate: number;
      failureCount: number;
      totalExecutions: number;
    }>;
    performance: {
      peakThroughput: number;
      averageThroughput: number;
      bottlenecks: Array<{
        stepId: string;
        stepName: string;
        delay: number;
        impact: 'high' | 'medium' | 'low';
      }>;
    };
  }> {
    return this.request('GET', `/content/pipeline/${pipelineId}/metrics`);
  }

  async getPipelineAnalytics(): Promise<{
    overview: {
      totalPipelines: number;
      activePipelines: number;
      completedPipelines: number;
      failedPipelines: number;
      averageDuration: number;
    };
    trends: Array<{
      date: string;
      started: number;
      completed: number;
      failed: number;
      averageDuration: number;
    }>;
    performance: {
      bestPerformingPipeline: string;
      worstPerformingPipeline: string;
      averageSuccessRate: number;
      commonFailurePoints: Array<{
        step: string;
        failureCount: number;
        failureRate: number;
      }>;
    };
    insights: Array<{
      type: 'optimization' | 'warning' | 'success';
      message: string;
      impact: 'high' | 'medium' | 'low';
      recommendation?: string;
    }>;
  }> {
    return this.request('GET', '/content/pipeline/analytics');
  }

  async cancelPipeline(pipelineId: string, reason?: string): Promise<{
    success: boolean;
    pipelineId: string;
    cancelledAt: string;
    reason: string;
    affectedSteps: Array<{
      stepId: string;
      stepName: string;
      status: 'cancelled' | 'completed';
    }>;
  }> {
    return this.request('POST', `/content/pipeline/${pipelineId}/cancel`, { reason });
  }

  // Admin Advanced Features endpoints
  async getAutoApprovalSettings(organizationId: string): Promise<{
    organizationId: string;
    enabled: boolean;
    rules: Array<{
      id: string;
      name: string;
      conditions: Record<string, any>;
      enabled: boolean;
      priority: number;
    }>;
    settings: {
      maxContentPerDay: number;
      requireReviewThreshold: number;
      autoApproveAfterHours: number;
      excludeContentTypes: string[];
    };
    lastUpdated: string;
  }> {
    return this.request('GET', `/admin/autoapprove/${organizationId}`);
  }

  async updateAutoApprovalSettings(organizationId: string, data: {
    enabled: boolean;
    rules: Array<{
      id?: string;
      name: string;
      conditions: Record<string, any>;
      enabled: boolean;
      priority: number;
    }>;
    settings: {
      maxContentPerDay: number;
      requireReviewThreshold: number;
      autoApproveAfterHours: number;
      excludeContentTypes: string[];
    };
  }): Promise<{
    success: boolean;
    organizationId: string;
    updatedAt: string;
  }> {
    return this.request('POST', `/admin/autoapprove/${organizationId}`, data);
  }

  async getEscalationRules(organizationId: string): Promise<{
    organizationId: string;
    rules: Array<{
      id: string;
      name: string;
      trigger: string;
      conditions: Record<string, any>;
      actions: Array<{
        type: string;
        config: Record<string, any>;
      }>;
      enabled: boolean;
      priority: number;
    }>;
    settings: {
      escalationTimeout: number;
      maxEscalations: number;
      notificationChannels: string[];
    };
    lastUpdated: string;
  }> {
    return this.request('GET', `/admin/escalations/${organizationId}`);
  }

  async updateEscalationRules(organizationId: string, data: {
    rules: Array<{
      id?: string;
      name: string;
      trigger: string;
      conditions: Record<string, any>;
      actions: Array<{
        type: string;
        config: Record<string, any>;
      }>;
      enabled: boolean;
      priority: number;
    }>;
    settings: {
      escalationTimeout: number;
      maxEscalations: number;
      notificationChannels: string[];
    };
  }): Promise<{
    success: boolean;
    organizationId: string;
    updatedAt: string;
  }> {
    return this.request('POST', `/admin/escalations/${organizationId}`, data);
  }

  async getSystemFlags(): Promise<{
    flags: Array<{
      name: string;
      value: boolean;
      description: string;
      category: string;
      lastModified: string;
    }>;
    systemStatus: {
      paused: boolean;
      pausedAt?: string;
      pausedBy?: string;
      pausedReason?: string;
    };
  }> {
    return this.request('GET', '/admin/system/flags');
  }

  async pauseSystem(reason?: string): Promise<{
    success: boolean;
    pausedAt: string;
    reason: string;
    message: string;
  }> {
    return this.request('POST', '/admin/system/pause', { reason });
  }

  async resumeSystem(): Promise<{
    success: boolean;
    resumedAt: string;
    message: string;
  }> {
    return this.request('POST', '/admin/system/resume');
  }

  async getTemplatePerformanceAnalytics(): Promise<{
    overview: {
      totalTemplates: number;
      activeTemplates: number;
      averagePerformance: number;
      topPerformingTemplate: string;
      worstPerformingTemplate: string;
    };
    templates: Array<{
      templateId: string;
      templateName: string;
      usageCount: number;
      successRate: number;
      averageEngagement: number;
      performanceScore: number;
      lastUsed: string;
    }>;
    trends: Array<{
      date: string;
      templatesUsed: number;
      averagePerformance: number;
      topTemplate: string;
    }>;
  }> {
    return this.request('GET', '/admin/templates/performance');
  }

  async updateTemplatePerformanceTuning(data: {
    templateId: string;
    tuningSettings: {
      performanceThreshold: number;
      autoOptimization: boolean;
      optimizationRules: Array<{
        condition: string;
        action: string;
        priority: number;
      }>;
    };
  }): Promise<{
    success: boolean;
    templateId: string;
    updatedAt: string;
    message: string;
  }> {
    return this.request('POST', '/admin/templates/tuning/update', data);
  }

  async getTemplateRecommendations(): Promise<{
    recommendations: Array<{
      templateId: string;
      templateName: string;
      type: 'optimization' | 'performance' | 'usage';
      priority: 'high' | 'medium' | 'low';
      message: string;
      suggestedAction: string;
      expectedImpact: string;
    }>;
    insights: Array<{
      category: string;
      insight: string;
      recommendation: string;
      impact: 'high' | 'medium' | 'low';
    }>;
  }> {
    return this.request('GET', '/admin/templates/recommendations');
  }

  // Platform-Specific Features endpoints
  async getAvailablePlatforms(): Promise<{
    platforms: Array<{
      id: string;
      name: string;
      type: 'social' | 'blog' | 'video' | 'image' | 'newsletter';
      status: 'active' | 'beta' | 'deprecated';
      features: Array<{
        name: string;
        description: string;
        supported: boolean;
        limitations?: string[];
      }>;
      publishingOptions: Array<{
        name: string;
        type: 'text' | 'image' | 'video' | 'link' | 'poll' | 'story';
        required: boolean;
        maxLength?: number;
        supportedFormats?: string[];
      }>;
      accountTypes: Array<{
        type: string;
        description: string;
        capabilities: string[];
        limitations: string[];
      }>;
      connectionRequirements: {
        oauth: boolean;
        apiKey: boolean;
        webhook: boolean;
        verification: boolean;
      };
    }>;
  }> {
    return this.request('GET', '/content/platforms');
  }

  async getPlatformAccounts(platformId: string): Promise<{
    platformId: string;
    accounts: Array<{
      accountId: string;
      accountName: string;
      accountType: string;
      status: 'connected' | 'disconnected' | 'error' | 'pending';
      capabilities: string[];
      limitations: string[];
      lastSync?: string;
      errorMessage?: string;
      metadata: Record<string, any>;
    }>;
  }> {
    return this.request('GET', `/content/platforms/${platformId}/accounts`);
  }

  async connectPlatformAccount(platformId: string, data: {
    accountType: string;
    credentials: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<{
    success: boolean;
    accountId: string;
    status: string;
    message: string;
  }> {
    return this.request('POST', `/content/platforms/${platformId}/accounts`, data);
  }

  async disconnectPlatformAccount(platformId: string, accountId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request('DELETE', `/content/platforms/${platformId}/accounts/${accountId}`);
  }

  async getPlatformPublishingOptions(platformId: string, accountId?: string): Promise<{
    platformId: string;
    accountId?: string;
    publishingOptions: Array<{
      name: string;
      type: 'text' | 'image' | 'video' | 'link' | 'poll' | 'story';
      required: boolean;
      maxLength?: number;
      supportedFormats?: string[];
      constraints: {
        minLength?: number;
        maxLength?: number;
        allowedFormats?: string[];
        requiredFields?: string[];
        optionalFields?: string[];
      };
      examples: Array<{
        title: string;
        description: string;
        content: any;
      }>;
    }>;
    accountSpecificOptions?: Record<string, any>;
  }> {
    const url = accountId 
      ? `/content/platforms/${platformId}/accounts/${accountId}/publishing-options`
      : `/content/platforms/${platformId}/publishing-options`;
    return this.request('GET', url);
  }

  async validatePlatformContent(platformId: string, accountId: string, content: {
    type: string;
    data: Record<string, any>;
  }): Promise<{
    valid: boolean;
    errors: Array<{
      field: string;
      message: string;
      severity: 'error' | 'warning' | 'info';
    }>;
    suggestions: Array<{
      field: string;
      suggestion: string;
      impact: 'high' | 'medium' | 'low';
    }>;
  }> {
    return this.request('POST', `/content/platforms/${platformId}/accounts/${accountId}/validate`, content);
  }

  async getPlatformLimitations(platformId: string): Promise<{
    platformId: string;
    limitations: {
      rateLimits: Array<{
        endpoint: string;
        limit: number;
        window: string;
        description: string;
      }>;
      contentLimits: Array<{
        type: string;
        maxSize?: number;
        maxLength?: number;
        allowedFormats?: string[];
        description: string;
      }>;
      accountLimits: Array<{
        limit: string;
        value: number;
        description: string;
      }>;
    };
  }> {
    return this.request('GET', `/content/platforms/${platformId}/limitations`);
  }

  // Brand Rule Enforcement endpoints
  async getBrandRules(organizationId?: string): Promise<Array<{
    id: string;
    name: string;
    description: string;
    type: 'forbidden' | 'required' | 'tone' | 'length' | 'format' | 'style';
    category: string;
    rules: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    tags: string[];
    channels: string[];
    organizationId: string;
  }>> {
    const params = organizationId ? `?organizationId=${organizationId}` : '';
    return this.request('GET', `/admin/brand-rules${params}`);
  }

  async createBrandRule(data: {
    name: string;
    description: string;
    type: 'forbidden' | 'required' | 'tone' | 'length' | 'format' | 'style';
    category: string;
    rules: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    tags: string[];
    channels: string[];
    organizationId: string;
  }): Promise<{
    success: boolean;
    ruleId: string;
    message: string;
  }> {
    return this.request('POST', '/admin/brand-rules', data);
  }

  async updateBrandRule(ruleId: string, data: {
    name?: string;
    description?: string;
    type?: 'forbidden' | 'required' | 'tone' | 'length' | 'format' | 'style';
    category?: string;
    rules?: string[];
    severity?: 'low' | 'medium' | 'high' | 'critical';
    isActive?: boolean;
    tags?: string[];
    channels?: string[];
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request('PUT', `/admin/brand-rules/${ruleId}`, data);
  }

  async deleteBrandRule(ruleId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request('DELETE', `/admin/brand-rules/${ruleId}`);
  }

  async validateBrandCompliance(contentId: string, organizationId?: string): Promise<{
    compliant: boolean;
    violations: Array<{
      ruleId: string;
      ruleName: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      suggestions: string[];
    }>;
    score: number;
    recommendations: string[];
  }> {
    const params = organizationId ? `?organizationId=${organizationId}` : '';
    return this.request('POST', `/admin/brand-rules/validate/${contentId}${params}`);
  }

  async enforceBrandRules(contentId: string, organizationId?: string): Promise<{
    success: boolean;
    enforcedRules: Array<{
      ruleId: string;
      ruleName: string;
      action: string;
      result: string;
    }>;
    modifiedContent?: string;
    message: string;
  }> {
    const params = organizationId ? `?organizationId=${organizationId}` : '';
    return this.request('POST', `/admin/brand-rules/enforce/${contentId}${params}`);
  }

  async getBrandRuleAnalytics(organizationId?: string): Promise<{
    totalRules: number;
    activeRules: number;
    violationsBySeverity: Record<string, number>;
    topViolatingRules: Array<{
      ruleId: string;
      ruleName: string;
      violationCount: number;
    }>;
    complianceTrends: Array<{
      date: string;
      complianceRate: number;
      violations: number;
    }>;
  }> {
    const params = organizationId ? `?organizationId=${organizationId}` : '';
    return this.request('GET', `/admin/brand-rules/analytics${params}`);
  }

  // Template Render Service endpoints
  async renderTemplate(templateId: string, variables: Record<string, any>): Promise<{
    success: boolean;
    renderedContent: string;
    variables: Record<string, any>;
    templateId: string;
    processingTime: number;
    errors?: string[];
  }> {
    return this.request('POST', `/admin/templates/${templateId}/render`, { variables });
  }

  async previewTemplate(templateId: string, variables: Record<string, any>): Promise<{
    success: boolean;
    preview: string;
    variables: Record<string, any>;
    templateId: string;
    metadata: {
      wordCount: number;
      characterCount: number;
      estimatedReadTime: number;
    };
  }> {
    return this.request('POST', `/admin/templates/${templateId}/preview`, { variables });
  }

  async processTemplateVariables(templateId: string, content: string): Promise<{
    success: boolean;
    processedContent: string;
    extractedVariables: Array<{
      name: string;
      type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
      defaultValue?: any;
      description?: string;
      required: boolean;
    }>;
    validationErrors: Array<{
      variable: string;
      error: string;
      line?: number;
    }>;
  }> {
    return this.request('POST', `/admin/templates/${templateId}/process-variables`, { content });
  }

  async getTemplateVariables(templateId: string): Promise<{
    success: boolean;
    variables: Array<{
      name: string;
      type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
      defaultValue?: any;
      description?: string;
      required: boolean;
      examples?: string[];
    }>;
    templateInfo: {
      id: string;
      name: string;
      description: string;
      category: string;
      createdAt: string;
      updatedAt: string;
    };
  }> {
    return this.request('GET', `/admin/templates/${templateId}/variables`);
  }

  async validateTemplateSyntax(templateId: string, content: string): Promise<{
    valid: boolean;
    errors: Array<{
      type: 'syntax' | 'variable' | 'logic';
      message: string;
      line?: number;
      column?: number;
      suggestion?: string;
    }>;
    warnings: Array<{
      type: 'performance' | 'best_practice' | 'deprecated';
      message: string;
      line?: number;
      suggestion?: string;
    }>;
  }> {
    return this.request('POST', `/admin/templates/${templateId}/validate`, { content });
  }

  async getTemplateRenderHistory(templateId: string, limit: number = 50): Promise<{
    success: boolean;
    history: Array<{
      id: string;
      templateId: string;
      variables: Record<string, any>;
      renderedContent: string;
      createdAt: string;
      createdBy: string;
      processingTime: number;
      success: boolean;
      errorMessage?: string;
    }>;
    totalCount: number;
  }> {
    return this.request('GET', `/admin/templates/${templateId}/render-history?limit=${limit}`);
  }

  // Storage Management Service endpoints
  async uploadMedia(file: File, metadata?: {
    category?: string;
    tags?: string[];
    description?: string;
    organizationId?: string;
  }): Promise<{
    success: boolean;
    fileId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    url: string;
    thumbnailUrl?: string;
    metadata: {
      category: string;
      tags: string[];
      description?: string;
      uploadedAt: string;
      uploadedBy: string;
    };
  }> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    
    // Use axios directly for file uploads with proper headers
    const response = await this.client.post('/storage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  }

  async getStorageUsage(organizationId?: string): Promise<{
    success: boolean;
    usage: {
      totalUsed: number;
      totalAvailable: number;
      percentageUsed: number;
      filesCount: number;
      categories: Array<{
        category: string;
        used: number;
        filesCount: number;
        percentage: number;
      }>;
    };
    quotas: {
      maxStorage: number;
      maxFiles: number;
      maxFileSize: number;
      allowedTypes: string[];
    };
  }> {
    const params = organizationId ? `?organizationId=${organizationId}` : '';
    return this.request('GET', `/storage/usage${params}`);
  }

  async manageStorageQuota(organizationId: string, settings: {
    maxStorage?: number;
    maxFiles?: number;
    maxFileSize?: number;
    allowedTypes?: string[];
    autoCleanup?: boolean;
    cleanupDays?: number;
  }): Promise<{
    success: boolean;
    message: string;
    updatedSettings: {
      maxStorage: number;
      maxFiles: number;
      maxFileSize: number;
      allowedTypes: string[];
      autoCleanup: boolean;
      cleanupDays: number;
    };
  }> {
    return this.request('PUT', `/storage/quota/${organizationId}`, settings);
  }

  async processMedia(fileId: string, operations: {
    resize?: { width?: number; height?: number; maintainAspectRatio?: boolean };
    compress?: { quality?: number; format?: 'jpeg' | 'png' | 'webp' };
    crop?: { x: number; y: number; width: number; height: number };
    filters?: Array<{
      type: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'sharpen';
      value: number;
    }>;
  }): Promise<{
    success: boolean;
    processedFileId: string;
    originalFileId: string;
    operations: any;
    processedUrl: string;
    metadata: {
      originalSize: number;
      processedSize: number;
      compressionRatio: number;
      processingTime: number;
    };
  }> {
    return this.request('POST', `/storage/process/${fileId}`, operations);
  }

  // Enhanced Media Processing Service endpoints
  async optimizeMedia(fileId: string, optimizationSettings: {
    targetSize?: number; // Target file size in bytes
    quality?: number; // Quality level 1-100
    format?: 'jpeg' | 'png' | 'webp' | 'avif';
    progressive?: boolean; // For JPEG progressive loading
    lossless?: boolean; // For PNG/WebP lossless compression
    removeMetadata?: boolean; // Remove EXIF and other metadata
    optimizeForWeb?: boolean; // Web-specific optimizations
  }): Promise<{
    success: boolean;
    optimizedFileId: string;
    originalFileId: string;
    optimizedUrl: string;
    optimization: {
      originalSize: number;
      optimizedSize: number;
      compressionRatio: number;
      qualityScore: number;
      processingTime: number;
      optimizationsApplied: string[];
    };
  }> {
    return this.request('POST', `/media/optimize/${fileId}`, optimizationSettings);
  }

  async convertMediaFormat(fileId: string, conversionSettings: {
    targetFormat: 'jpeg' | 'png' | 'webp' | 'avif' | 'gif' | 'mp4' | 'webm' | 'mov';
    quality?: number;
    resolution?: { width?: number; height?: number };
    framerate?: number; // For video conversions
    bitrate?: number; // For video conversions
    audioCodec?: string; // For video conversions
    videoCodec?: string; // For video conversions
  }): Promise<{
    success: boolean;
    convertedFileId: string;
    originalFileId: string;
    convertedUrl: string;
    conversion: {
      originalFormat: string;
      targetFormat: string;
      originalSize: number;
      convertedSize: number;
      processingTime: number;
      conversionSettings: any;
    };
  }> {
    return this.request('POST', `/media/convert/${fileId}`, conversionSettings);
  }

  async getMediaProcessingStatus(jobId: string): Promise<{
    success: boolean;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number; // 0-100
    result?: {
      processedFileId?: string;
      processedUrl?: string;
      metadata?: any;
    };
    error?: string;
    estimatedTimeRemaining?: number; // in seconds
  }> {
    return this.request('GET', `/media/status/${jobId}`);
  }

  async getMediaProcessingHistory(params?: {
    organizationId?: string;
    limit?: number;
    offset?: number;
    type?: 'optimization' | 'conversion' | 'processing';
    status?: 'completed' | 'failed' | 'pending';
  }): Promise<{
    success: boolean;
    history: Array<{
      id: string;
      type: string;
      originalFileId: string;
      processedFileId?: string;
      status: string;
      progress: number;
      createdAt: string;
      completedAt?: string;
      metadata: any;
      error?: string;
    }>;
    totalCount: number;
  }> {
    return this.request('GET', '/media/history', undefined, params);
  }

  async cancelMediaProcessing(jobId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request('POST', `/media/cancel/${jobId}`);
  }

  async getMediaProcessingPresets(): Promise<{
    success: boolean;
    presets: Array<{
      id: string;
      name: string;
      description: string;
      type: 'optimization' | 'conversion';
      settings: any;
      category: 'web' | 'mobile' | 'print' | 'social' | 'custom';
    }>;
  }> {
    return this.request('GET', '/media/presets');
  }

  async createMediaProcessingPreset(preset: {
    name: string;
    description: string;
    type: 'optimization' | 'conversion';
    settings: any;
    category: 'web' | 'mobile' | 'print' | 'social' | 'custom';
    organizationId?: string;
  }): Promise<{
    success: boolean;
    preset: {
      id: string;
      name: string;
      description: string;
      type: string;
      settings: any;
      category: string;
      createdAt: string;
      createdBy: string;
    };
  }> {
    return this.request('POST', '/media/presets', preset);
  }

  async batchProcessMedia(fileIds: string[], operations: {
    type: 'optimization' | 'conversion' | 'processing';
    settings: any;
    presetId?: string;
  }): Promise<{
    success: boolean;
    batchId: string;
    totalFiles: number;
    estimatedTime: number;
    jobs: Array<{
      fileId: string;
      jobId: string;
      status: 'queued' | 'processing' | 'completed' | 'failed';
    }>;
  }> {
    return this.request('POST', '/media/batch', { fileIds, operations });
  }

  async getMediaFiles(params?: {
    category?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
    sortBy?: 'name' | 'size' | 'uploadedAt' | 'category';
    sortOrder?: 'asc' | 'desc';
    organizationId?: string;
  }): Promise<{
    success: boolean;
    files: Array<{
      id: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      url: string;
      thumbnailUrl?: string;
      category: string;
      tags: string[];
      description?: string;
      uploadedAt: string;
      uploadedBy: string;
      metadata: Record<string, any>;
    }>;
    totalCount: number;
    hasMore: boolean;
  }> {
    return this.request('GET', '/storage/files', undefined, params);
  }

  async deleteMedia(fileId: string): Promise<{
    success: boolean;
    message: string;
    deletedFileId: string;
  }> {
    return this.request('DELETE', `/storage/files/${fileId}`);
  }

  async updateMediaMetadata(fileId: string, metadata: {
    category?: string;
    tags?: string[];
    description?: string;
  }): Promise<{
    success: boolean;
    message: string;
    updatedMetadata: {
      category: string;
      tags: string[];
      description?: string;
      updatedAt: string;
    };
  }> {
    return this.request('PUT', `/storage/files/${fileId}/metadata`, metadata);
  }

  async getStorageAnalytics(organizationId?: string, period?: 'day' | 'week' | 'month' | 'year'): Promise<{
    success: boolean;
    analytics: {
      uploadTrends: Array<{
        date: string;
        uploads: number;
        totalSize: number;
      }>;
      categoryDistribution: Array<{
        category: string;
        files: number;
        size: number;
        percentage: number;
      }>;
      topFiles: Array<{
        id: string;
        fileName: string;
        fileSize: number;
        downloadCount: number;
        lastAccessed: string;
      }>;
      storageGrowth: Array<{
        date: string;
        totalUsed: number;
        growthRate: number;
      }>;
    };
  }> {
    const params = new URLSearchParams();
    if (organizationId) params.append('organizationId', organizationId);
    if (period) params.append('period', period);
    
    return this.request('GET', `/storage/analytics?${params.toString()}`);
  }

  // Metrics Service endpoints
  async getCustomMetrics(params?: {
    metricName?: string;
    organizationId?: string;
    timeRange?: '1h' | '24h' | '7d' | '30d';
    aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  }): Promise<{
    success: boolean;
    metrics: Array<{
      name: string;
      value: number;
      timestamp: string;
      labels: Record<string, string>;
      description?: string;
    }>;
    metadata: {
      totalMetrics: number;
      timeRange: string;
      aggregation: string;
      lastUpdated: string;
    };
  }> {
    return this.request('GET', '/metrics/custom', undefined, params);
  }

  async getPerformanceMetrics(params?: {
    organizationId?: string;
    timeRange?: '1h' | '24h' | '7d' | '30d';
    includeSystem?: boolean;
  }): Promise<{
    success: boolean;
    performance: {
      systemMetrics: {
        cpu: Array<{
          timestamp: string;
          usage: number;
          cores: number;
        }>;
        memory: Array<{
          timestamp: string;
          used: number;
          total: number;
          percentage: number;
        }>;
        disk: Array<{
          timestamp: string;
          used: number;
          total: number;
          percentage: number;
        }>;
      };
      applicationMetrics: {
        requests: Array<{
          timestamp: string;
          count: number;
          avgResponseTime: number;
          errorRate: number;
        }>;
        database: Array<{
          timestamp: string;
          connections: number;
          queryTime: number;
          slowQueries: number;
        }>;
        queue: Array<{
          timestamp: string;
          pending: number;
          processed: number;
          failed: number;
        }>;
      };
      businessMetrics: {
        contentGeneration: Array<{
          timestamp: string;
          generated: number;
          published: number;
          failed: number;
        }>;
        userActivity: Array<{
          timestamp: string;
          activeUsers: number;
          newUsers: number;
          sessions: number;
        }>;
        platformEngagement: Array<{
          timestamp: string;
          platform: string;
          posts: number;
          engagement: number;
          reach: number;
        }>;
      };
    };
  }> {
    return this.request('GET', '/metrics/performance', undefined, params);
  }

  async createMetricDashboard(dashboard: {
    name: string;
    description?: string;
    organizationId?: string;
    widgets: Array<{
      id: string;
      type: 'line' | 'bar' | 'gauge' | 'table' | 'pie';
      title: string;
      metricName: string;
      timeRange: '1h' | '24h' | '7d' | '30d';
      aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
      filters?: Record<string, string>;
      position: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }>;
  }): Promise<{
    success: boolean;
    dashboard: {
      id: string;
      name: string;
      description?: string;
      organizationId: string;
      widgets: any[];
      createdAt: string;
      createdBy: string;
    };
  }> {
    return this.request('POST', '/metrics/dashboards', dashboard);
  }

  async getMetricDashboards(organizationId?: string): Promise<{
    success: boolean;
    dashboards: Array<{
      id: string;
      name: string;
      description?: string;
      organizationId: string;
      widgetCount: number;
      createdAt: string;
      createdBy: string;
      lastModified: string;
    }>;
  }> {
    const params = organizationId ? `?organizationId=${organizationId}` : '';
    return this.request('GET', `/metrics/dashboards${params}`);
  }

  async updateMetricDashboard(dashboardId: string, updates: {
    name?: string;
    description?: string;
    widgets?: any[];
  }): Promise<{
    success: boolean;
    message: string;
    dashboard: any;
  }> {
    return this.request('PUT', `/metrics/dashboards/${dashboardId}`, updates);
  }

  async deleteMetricDashboard(dashboardId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request('DELETE', `/metrics/dashboards/${dashboardId}`);
  }

  async getMetricDefinitions(): Promise<{
    success: boolean;
    metrics: Array<{
      name: string;
      type: 'counter' | 'gauge' | 'histogram' | 'summary';
      description: string;
      labels: string[];
      unit?: string;
      category: 'system' | 'application' | 'business';
    }>;
  }> {
    return this.request('GET', '/metrics/definitions');
  }

  async createCustomMetric(metric: {
    name: string;
    description: string;
    type: 'counter' | 'gauge' | 'histogram' | 'summary';
    labels?: string[];
    unit?: string;
    organizationId?: string;
  }): Promise<{
    success: boolean;
    metric: {
      name: string;
      description: string;
      type: string;
      labels: string[];
      unit?: string;
      createdAt: string;
    };
  }> {
    return this.request('POST', '/metrics/custom', metric);
  }

  async recordCustomMetric(metricName: string, value: number, labels?: Record<string, string>): Promise<{
    success: boolean;
    message: string;
    recordedAt: string;
  }> {
    return this.request('POST', `/metrics/custom/${metricName}/record`, { value, labels });
  }

  // Enhanced Error Handling Service endpoints
  async getErrorLogs(params?: {
    organizationId?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    category?: 'system' | 'application' | 'user' | 'integration';
    timeRange?: '1h' | '24h' | '7d' | '30d';
    limit?: number;
    offset?: number;
    search?: string;
    resolved?: boolean;
  }): Promise<{
    success: boolean;
    errors: Array<{
      id: string;
      message: string;
      stack?: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      category: 'system' | 'application' | 'user' | 'integration';
      context: {
        userId?: string;
        organizationId?: string;
        requestId?: string;
        userAgent?: string;
        url?: string;
        method?: string;
        timestamp: string;
        environment: string;
        version: string;
      };
      metadata: Record<string, any>;
      resolved: boolean;
      resolvedAt?: string;
      resolvedBy?: string;
      createdAt: string;
      updatedAt: string;
    }>;
    totalCount: number;
    hasMore: boolean;
  }> {
    return this.request('GET', '/errors/logs', undefined, params);
  }

  async getErrorAnalytics(params?: {
    organizationId?: string;
    timeRange?: '1h' | '24h' | '7d' | '30d';
    groupBy?: 'hour' | 'day' | 'week' | 'month';
  }): Promise<{
    success: boolean;
    analytics: {
      errorTrends: Array<{
        timestamp: string;
        totalErrors: number;
        criticalErrors: number;
        highErrors: number;
        mediumErrors: number;
        lowErrors: number;
      }>;
      errorDistribution: Array<{
        category: string;
        count: number;
        percentage: number;
        severity: string;
      }>;
      topErrors: Array<{
        message: string;
        count: number;
        lastOccurrence: string;
        severity: string;
        category: string;
      }>;
      resolutionStats: {
        totalErrors: number;
        resolvedErrors: number;
        unresolvedErrors: number;
        averageResolutionTime: number;
        resolutionRate: number;
      };
      userImpact: Array<{
        userId?: string;
        errorCount: number;
        lastError: string;
        severity: string;
      }>;
    };
  }> {
    return this.request('GET', '/errors/analytics', undefined, params);
  }

  async createErrorReport(report: {
    title: string;
    description: string;
    errorIds: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    assignedTo?: string;
    organizationId?: string;
    tags?: string[];
  }): Promise<{
    success: boolean;
    report: {
      id: string;
      title: string;
      description: string;
      errorIds: string[];
      priority: string;
      assignedTo?: string;
      organizationId: string;
      tags: string[];
      status: 'open' | 'in_progress' | 'resolved' | 'closed';
      createdAt: string;
      createdBy: string;
      updatedAt: string;
    };
  }> {
    return this.request('POST', '/errors/reports', report);
  }

  async getErrorReports(params?: {
    organizationId?: string;
    status?: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    assignedTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    success: boolean;
    reports: Array<{
      id: string;
      title: string;
      description: string;
      errorIds: string[];
      priority: string;
      assignedTo?: string;
      organizationId: string;
      tags: string[];
      status: string;
      createdAt: string;
      createdBy: string;
      updatedAt: string;
      resolvedAt?: string;
    }>;
    totalCount: number;
  }> {
    return this.request('GET', '/errors/reports', undefined, params);
  }

  async updateErrorReport(reportId: string, updates: {
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    status?: 'open' | 'in_progress' | 'resolved' | 'closed';
    assignedTo?: string;
    tags?: string[];
  }): Promise<{
    success: boolean;
    message: string;
    report: any;
  }> {
    return this.request('PUT', `/errors/reports/${reportId}`, updates);
  }

  async resolveError(errorId: string, resolution: {
    resolvedBy: string;
    resolution: string;
    category?: string;
  }): Promise<{
    success: boolean;
    message: string;
    error: any;
  }> {
    return this.request('POST', `/errors/${errorId}/resolve`, resolution);
  }

  async getErrorDetails(errorId: string): Promise<{
    success: boolean;
    error: {
      id: string;
      message: string;
      stack?: string;
      severity: string;
      category: string;
      context: any;
      metadata: Record<string, any>;
      resolved: boolean;
      resolvedAt?: string;
      resolvedBy?: string;
      createdAt: string;
      updatedAt: string;
      relatedErrors: Array<{
        id: string;
        message: string;
        severity: string;
        createdAt: string;
      }>;
    };
  }> {
    return this.request('GET', `/errors/${errorId}`);
  }

  async getErrorContext(errorId: string): Promise<{
    success: boolean;
    context: {
      requestDetails: {
        method: string;
        url: string;
        headers: Record<string, string>;
        body?: any;
        query?: Record<string, string>;
      };
      userSession: {
        userId?: string;
        sessionId?: string;
        organizationId?: string;
        permissions?: string[];
      };
      systemState: {
        environment: string;
        version: string;
        uptime: number;
        memoryUsage: number;
        cpuUsage: number;
      };
      relatedLogs: Array<{
        timestamp: string;
        level: string;
        message: string;
        context: any;
      }>;
    };
  }> {
    return this.request('GET', `/errors/${errorId}/context`);
  }
}

// Create and export a singleton instance
export const apiClient = new APIClient();
export default apiClient;
