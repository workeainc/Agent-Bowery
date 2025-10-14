'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface TokenStatusProps {
  provider: string;
  onRefresh?: () => void;
}

export default function TokenStatus({ provider, onRefresh }: TokenStatusProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.getTokenStatus(provider);
      setStatus(result);
    } catch (err: any) {
      setError(err.message || 'Failed to check token status');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const result = await apiClient.refreshToken(provider);
      
      if (result.ok) {
        // Refresh status after successful token refresh
        await checkStatus();
        if (onRefresh) onRefresh();
      } else {
        setError(result.message || 'Token refresh failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to refresh token');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [provider]);

  const getStatusIcon = () => {
    if (loading) return '🔄';
    if (error) return '❌';
    if (!status) return '❓';
    if (status.ok && status.hasToken) return '✅';
    return '⚠️';
  };

  const getStatusColor = () => {
    if (loading) return 'text-blue-600';
    if (error) return 'text-red-600';
    if (!status) return 'text-gray-600';
    if (status.ok && status.hasToken) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getStatusText = () => {
    if (loading) return 'Checking...';
    if (error) return 'Error';
    if (!status) return 'Unknown';
    if (status.ok && status.hasToken) {
      return status.isDummy ? 'Dummy Token' : 'Valid Token';
    }
    return 'No Token';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`text-lg ${getStatusColor()}`}>{getStatusIcon()}</span>
          <span className="text-sm font-medium text-gray-700">
            {provider.charAt(0).toUpperCase() + provider.slice(1)} Token
          </span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          status?.ok && status?.hasToken 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {getStatusText()}
        </span>
      </div>

      {status && status.ok && status.hasToken && (
        <div className="space-y-2">
          {status.tokenPreview && (
            <div className="text-xs text-gray-600">
              <span className="font-medium">Token:</span> {status.tokenPreview}
            </div>
          )}
          
          {status.isDummy && (
            <div className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
              ⚠️ Using dummy token (development mode)
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
          Error: {error}
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={checkStatus}
          disabled={loading}
          className="text-xs text-primary-600 hover:text-primary-700 underline disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check Status'}
        </button>
        
        {status?.ok && status?.hasToken && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-xs text-blue-600 hover:text-blue-700 underline disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Token'}
          </button>
        )}
      </div>
    </div>
  );
}
