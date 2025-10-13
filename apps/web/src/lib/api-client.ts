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

  // Health endpoints
  async getHealth(): Promise<{ status: string }> {
    return this.request('GET', '/health');
  }

  async getSystemHealth(): Promise<any> {
    return this.request('GET', '/health/system');
  }

  async getOAuthHealth(): Promise<any> {
    return this.request('GET', '/health/oauth');
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

  async searchContent(params: {
    q: string;
    filters?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    return this.request('GET', '/content/search', undefined, params);
  }

  // Platform endpoints
  async getConnectedPlatforms(): Promise<any[]> {
    return this.request('GET', '/platforms/connected');
  }

  async connectPlatform(platform: string): Promise<any> {
    return this.request('POST', `/platforms/${platform}/connect`);
  }

  async disconnectPlatform(platform: string): Promise<any> {
    return this.request('POST', `/platforms/${platform}/disconnect`);
  }

  async testPlatformConnection(platform: string, data: any): Promise<any> {
    return this.request('POST', `/platforms/${platform}/test`, data);
  }

  // Schedule endpoints
  async getSchedules(params?: any): Promise<any[]> {
    return this.request('GET', '/content/schedules', undefined, params);
  }

  async rescheduleContent(scheduleId: string, data: any): Promise<any> {
    return this.request('POST', `/content/schedules/${scheduleId}/reschedule`, data);
  }

  async cancelSchedule(scheduleId: string, data: any): Promise<any> {
    return this.request('POST', `/content/schedules/${scheduleId}/cancel`, data);
  }

  // Analytics endpoints
  async getContentPerformance(contentId: string): Promise<any> {
    return this.request('GET', `/content/${contentId}/performance`);
  }

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

  async getBrandRules(): Promise<any> {
    return this.request('GET', '/admin/brand-rules');
  }

  async updateBrandRules(data: any): Promise<any> {
    return this.request('POST', '/admin/brand-rules', data);
  }

  // Token endpoints
  async getTokenStatus(provider: string): Promise<any> {
    return this.request('GET', `/tokens/${provider}/status`);
  }

  async refreshToken(provider: string, data: any): Promise<any> {
    return this.request('POST', `/tokens/${provider}/refresh`, data);
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
}

// Create and export a singleton instance
export const apiClient = new APIClient();
export default apiClient;
