'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface WebhookStatusProps {
  provider: string;
  onRefresh?: () => void;
}

export default function WebhookStatus({ provider, onRefresh }: WebhookStatusProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.getWebhookStatus(provider);
      setStatus(result);
    } catch (err: any) {
      setError(err.message || 'Failed to check webhook status');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [provider]);

  const getStatusIcon = () => {
    if (loading) return '🔄';
    if (error) return '❌';
    if (!status) return '❓';
    if (status.isActive) return '✅';
    return '⚠️';
  };

  const getStatusColor = () => {
    if (loading) return 'text-blue-600';
    if (error) return 'text-red-600';
    if (!status) return 'text-gray-600';
    if (status.isActive) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getStatusText = () => {
    if (loading) return 'Checking...';
    if (error) return 'Error';
    if (!status) return 'Unknown';
    if (status.isActive) return 'Active';
    return 'Inactive';
  };

  const copyWebhookUrl = () => {
    if (status?.webhookUrl) {
      navigator.clipboard.writeText(status.webhookUrl);
      alert('Webhook URL copied to clipboard!');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`text-lg ${getStatusColor()}`}>{getStatusIcon()}</span>
          <span className="text-sm font-medium text-gray-700">
            {provider.charAt(0).toUpperCase() + provider.slice(1)} Webhook
          </span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          status?.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {getStatusText()}
        </span>
      </div>

      {status && (
        <div className="space-y-2">
          <div className="text-xs text-gray-600">
            <span className="font-medium">URL:</span> 
            <button
              onClick={copyWebhookUrl}
              className="ml-1 text-primary-600 hover:text-primary-700 underline"
            >
              {status.webhookUrl}
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium text-gray-700">Events:</span>
              <span className="ml-1 text-gray-600">{status.eventCount || 0}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Errors:</span>
              <span className="ml-1 text-gray-600">{status.errorCount || 0}</span>
            </div>
          </div>

          {status.lastEvent && (
            <div className="text-xs text-gray-600">
              <span className="font-medium">Last Event:</span> {new Date(status.lastEvent).toLocaleString()}
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
        
        {status?.webhookUrl && (
          <button
            onClick={copyWebhookUrl}
            className="text-xs text-blue-600 hover:text-blue-700 underline"
          >
            Copy URL
          </button>
        )}
      </div>
    </div>
  );
}
