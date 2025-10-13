'use client';

import { CSRFProtection } from './security';

export class CSRFManager {
  private static instance: CSRFManager;
  private csrfToken: string | null = null;
  private sessionId: string | null = null;

  static getInstance(): CSRFManager {
    if (!CSRFManager.instance) {
      CSRFManager.instance = new CSRFManager();
    }
    return CSRFManager.instance;
  }

  generateToken(): string {
    const sessionId = this.getSessionId();
    const token = CSRFProtection.getInstance().generateToken(sessionId);
    this.csrfToken = token;
    return token;
  }

  getToken(): string | null {
    if (!this.csrfToken) {
      this.generateToken();
    }
    return this.csrfToken;
  }

  getSessionId(): string {
    if (!this.sessionId) {
      this.sessionId = this.generateSessionId();
    }
    return this.sessionId;
  }

  validateToken(token: string): boolean {
    const sessionId = this.getSessionId();
    return CSRFProtection.getInstance().validateToken(sessionId, token);
  }

  invalidateToken(): void {
    if (this.sessionId) {
      CSRFProtection.getInstance().invalidateToken(this.sessionId);
    }
    this.csrfToken = null;
  }

  private generateSessionId(): string {
    const array = new Uint8Array(16);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Hook for using CSRF tokens in React components
export function useCSRF() {
  const csrfManager = CSRFManager.getInstance();
  
  return {
    getToken: () => csrfManager.getToken(),
    getSessionId: () => csrfManager.getSessionId(),
    generateToken: () => csrfManager.generateToken(),
    validateToken: (token: string) => csrfManager.validateToken(token),
    invalidateToken: () => csrfManager.invalidateToken(),
  };
}
