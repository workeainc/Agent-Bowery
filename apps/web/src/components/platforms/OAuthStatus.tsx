'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface OAuthStatusProps {
  provider: string;
  onRefresh?: () => void;
}

export default function OAuthStatus({ provider, onRefresh }: OAuthStatusProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.getOAuthStatus(provider);
      setStatus(result);
    } catch (err: any) {
      setError(err.message || 'Failed to check OAuth status');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [provider]);

  const handleRefreshToken = async () => {
    if (!status?.refreshToken) return;
    
    try {
      setLoading(true);
      await apiClient.refreshOAuthToken(provider, status.refreshToken);
      await checkStatus(); // Refresh status after token refresh
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to refresh token');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !status) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
        <span>Checking OAuth status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded">
          Error: {error}
        </div>
        <button
          onClick={checkStatus}
          className="text-xs text-primary-600 hover:text-primary-700 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="text-sm text-gray-600">
        No OAuth status available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">OAuth Status</span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          status.connected ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
        }`}>
          {status.connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {status.scopes && (
        <div className="space-y-1">
          <span className="text-xs font-medium text-gray-600">Scopes:</span>
          <div className="text-xs text-gray-500">
            {status.scopes.granted?.join(', ') || 'None'}
          </div>
          {status.scopes.missing?.length > 0 && (
            <div className="text-xs text-yellow-600">
              Missing: {status.scopes.missing.join(', ')}
            </div>
          )}
        </div>
      )}

      {status.expiresAt && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Expires:</span>
          <span className="text-xs text-gray-500">
            {new Date(status.expiresAt).toLocaleDateString()}
          </span>
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={checkStatus}
          disabled={loading}
          className="text-xs text-primary-600 hover:text-primary-700 underline"
        >
          {loading ? 'Checking...' : 'Refresh Status'}
        </button>
        
        {status.refreshToken && (
          <button
            onClick={handleRefreshToken}
            disabled={loading}
            className="text-xs text-blue-600 hover:text-blue-700 underline"
          >
            {loading ? 'Refreshing...' : 'Refresh Token'}
          </button>
        )}
      </div>
    </div>
  );
}
