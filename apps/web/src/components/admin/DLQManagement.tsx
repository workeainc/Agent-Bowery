'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface DLQItem {
  id: string;
  schedule_id: string;
  platform: string;
  payload: any;
  error_message?: string;
  created_at: string;
  retry_count: number;
}

export default function DLQManagement() {
  const [dlqItems, setDlqItems] = useState<DLQItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [replaying, setReplaying] = useState<string | null>(null);

  // Mock DLQ data for demonstration
  const mockDLQItems: DLQItem[] = [
    {
      id: 'dlq-1',
      schedule_id: 'schedule-123',
      platform: 'FACEBOOK',
      payload: {
        contentItemId: 'content-456',
        scheduledAt: '2024-01-15T10:00:00Z',
        platform: 'FACEBOOK'
      },
      error_message: 'Token expired',
      created_at: '2024-01-15T10:05:00Z',
      retry_count: 2
    },
    {
      id: 'dlq-2',
      schedule_id: 'schedule-124',
      platform: 'LINKEDIN',
      payload: {
        contentItemId: 'content-457',
        scheduledAt: '2024-01-15T11:00:00Z',
        platform: 'LINKEDIN'
      },
      error_message: 'Rate limit exceeded',
      created_at: '2024-01-15T11:05:00Z',
      retry_count: 1
    }
  ];

  useEffect(() => {
    // Load mock data for demonstration
    setDlqItems(mockDLQItems);
  }, []);

  const handleReplay = async (dlqId: string) => {
    try {
      setReplaying(dlqId);
      const result = await apiClient.replayPublishDlq(dlqId);
      
      if (result.success) {
        // Remove the item from DLQ list
        setDlqItems(prev => prev.filter(item => item.id !== dlqId));
        alert('DLQ item replayed successfully!');
      } else {
        alert('Failed to replay DLQ item');
      }
    } catch (error: any) {
      console.error('Failed to replay DLQ item:', error);
      alert('Failed to replay DLQ item: ' + error.message);
    } finally {
      setReplaying(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'FACEBOOK':
        return '📘';
      case 'LINKEDIN':
        return '💼';
      case 'TWITTER':
        return '🐦';
      case 'INSTAGRAM':
        return '📷';
      default:
        return '🌐';
    }
  };

  const getErrorColor = (retryCount: number) => {
    if (retryCount >= 3) return 'text-red-600';
    if (retryCount >= 2) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dead Letter Queue Management</h2>
        <p className="text-sm text-gray-600 mb-6">
          Manage failed publish jobs that need to be retried or investigated.
        </p>

        {/* DLQ Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 text-lg">⚠️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total DLQ Items</p>
                  <p className="text-2xl font-bold text-gray-900">{dlqItems.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-lg">🔄</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">High Retry Count</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dlqItems.filter(item => item.retry_count >= 3).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Platforms Affected</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(dlqItems.map(item => item.platform)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DLQ Items List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Failed Publish Jobs</h3>
            <p className="card-description">Jobs that failed to publish and are in the dead letter queue</p>
          </div>
          <div className="card-content">
            {dlqItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-green-600 text-4xl mb-4">✅</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No DLQ Items</h3>
                <p className="text-gray-600">All publish jobs are processing successfully!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dlqItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getPlatformIcon(item.platform)}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">DLQ Item {item.id}</h4>
                          <p className="text-sm text-gray-600">Platform: {item.platform}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getErrorColor(item.retry_count)}`}>
                          Retries: {item.retry_count}
                        </span>
                        <button
                          onClick={() => handleReplay(item.id)}
                          disabled={replaying === item.id}
                          className="btn-primary btn-sm"
                        >
                          {replaying === item.id ? 'Replaying...' : 'Replay'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Schedule ID
                        </label>
                        <div className="text-sm text-gray-900 font-mono">{item.schedule_id}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Created At
                        </label>
                        <div className="text-sm text-gray-900">{formatDate(item.created_at)}</div>
                      </div>
                    </div>

                    {item.error_message && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Error Message
                        </label>
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {item.error_message}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payload
                      </label>
                      <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(item.payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Help Information */}
        <div className="card">
          <div className="card-content">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">DLQ Management Help</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-lg">ℹ️</span>
                <div>
                  <p className="font-medium text-gray-900">What is DLQ?</p>
                  <p>The Dead Letter Queue contains publish jobs that failed to execute successfully.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600 text-lg">✅</span>
                <div>
                  <p className="font-medium text-gray-900">Replay Action</p>
                  <p>Replaying a DLQ item will retry the failed publish job with the same parameters.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600 text-lg">⚠️</span>
                <div>
                  <p className="font-medium text-gray-900">High Retry Count</p>
                  <p>Items with 3+ retries may have persistent issues that need investigation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
