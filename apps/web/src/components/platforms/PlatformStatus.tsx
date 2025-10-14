'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface PlatformStatusProps {
  platform: {
    id: string;
    name: string;
    type: string;
    status: string;
    lastSync?: Date;
  };
}

export default function PlatformStatus({ platform }: PlatformStatusProps) {
  const [tokenStatus, setTokenStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkTokenStatus = async () => {
    try {
      setLoading(true);
      const status = await apiClient.getTokenStatus(platform.type.toLowerCase());
      setTokenStatus(status);
    } catch (error) {
      console.error('Failed to check token status:', error);
      setTokenStatus({ error: 'Failed to check token status' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (platform.status === 'connected') {
      checkTokenStatus();
    }
  }, [platform.status]);

  const getStatusBadge = () => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    
    switch (platform.status) {
      case 'connected':
        return `${baseClasses} text-green-600 bg-green-100`;
      case 'disconnected':
        return `${baseClasses} text-gray-600 bg-gray-100`;
      case 'error':
        return `${baseClasses} text-red-600 bg-red-100`;
      case 'pending':
        return `${baseClasses} text-yellow-600 bg-yellow-100`;
      default:
        return `${baseClasses} text-gray-600 bg-gray-100`;
    }
  };

  const formatLastSync = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Status</span>
        <span className={getStatusBadge()}>
          {platform.status}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Last Sync</span>
        <span className="text-sm text-gray-600">
          {formatLastSync(platform.lastSync)}
        </span>
      </div>

      {platform.status === 'connected' && tokenStatus && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Token Status</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              tokenStatus.ok ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
            }`}>
              {tokenStatus.ok ? 'Valid' : 'Invalid'}
            </span>
          </div>

          {tokenStatus.dummy && (
            <div className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
              ⚠️ Using dummy token (development mode)
            </div>
          )}

          <button
            onClick={checkTokenStatus}
            disabled={loading}
            className="text-xs text-primary-600 hover:text-primary-700 underline"
          >
            {loading ? 'Checking...' : 'Refresh Status'}
          </button>
        </div>
      )}
    </div>
  );
}
