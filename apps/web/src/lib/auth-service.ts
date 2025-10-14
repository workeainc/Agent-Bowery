import { apiClient } from './api-client';
import { UserRole, Permission, ROLE_PERMISSIONS } from '@/types/auth';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    organizationId: string;
    permissions: Permission[];
  };
  token?: string;
  error?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export class AuthService {
  private static instance: AuthService;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Login failed',
        };
      }

      // If we get a token, store it
      if (data.token) {
        this.setToken(data.token);
      }

      return {
        success: true,
        user: data.user,
        token: data.token,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  async register(data: RegisterData): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || 'Registration failed',
        };
      }

      // If we get a token, store it
      if (result.token) {
        this.setToken(result.token);
      }

      return {
        success: true,
        user: result.user,
        token: result.token,
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint if it exists
      await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local token
      this.clearToken();
    }
  }

  async getCurrentUser(): Promise<LoginResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        return {
          success: false,
          error: 'No token found',
        };
      }

      const response = await fetch(`${this.baseURL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Token might be expired
        this.clearToken();
        return {
          success: false,
          error: data.message || 'Authentication failed',
        };
      }

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  async refreshToken(): Promise<LoginResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        return {
          success: false,
          error: 'No token found',
        };
      }

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        this.clearToken();
        return {
          success: false,
          error: data.message || 'Token refresh failed',
        };
      }

      // Update token
      if (data.token) {
        this.setToken(data.token);
      }

      return {
        success: true,
        user: data.user,
        token: data.token,
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  // Token management
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Helper method to create user with permissions
  static createUserWithPermissions(
    id: string,
    email: string,
    name: string,
    role: UserRole,
    organizationId: string
  ) {
    return {
      id,
      email,
      name,
      role,
      organizationId,
      permissions: ROLE_PERMISSIONS[role],
    };
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();


