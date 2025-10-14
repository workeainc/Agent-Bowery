'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface NotificationHistory {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  channel: string;
}

export default function NotificationHistoryAnalytics() {
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'analytics'>('history');
  const [userId, setUserId] = useState('');

  const loadHistory = async () => {
    if (!userId.trim()) {
      setError('User ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getNotificationHistory(userId);
      setHistory(result);
    } catch (err: any) {
      console.error('Failed to load notification history:', err);
      setError(err.message || 'Failed to load notification history');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getNotificationAnalytics();
      setAnalytics(result);
    } catch (err: any) {
      console.error('Failed to load notification analytics:', err);
      setError(err.message || 'Failed to load notification analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'email':
        return '📧';
      case 'slack':
        return '💬';
      case 'webhook':
        return '🔗';
      case 'sms':
        return '📱';
      default:
        return '📁';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'info':
        return 'text-blue-600 bg-blue-100';
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Notification History & Analytics</h3>
        <p className="text-sm text-gray-600">View notification history and analytics</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📋 Notification History
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Analytics
          </button>
        </nav>
      </div>

      {/* Notification History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Notification History</h4>
              <p className="text-sm text-gray-600">View notification history for a specific user</p>
            </div>
            <button
              onClick={loadHistory}
              disabled={loading || !userId.trim()}
              className="btn-primary"
            >
              {loading ? 'Loading...' : 'Load History'}
            </button>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User ID
                  </label>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="input w-full"
                    placeholder="Enter user ID to view notification history..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* History Results */}
          {history.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Notification History</h4>
                <p className="card-description">User ID: {userId}</p>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  {history.map((notification) => (
                    <div key={notification.id} className={`border rounded-lg p-4 ${
                      notification.read ? 'border-gray-200 bg-gray-50' : 'border-blue-200 bg-blue-50'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{getChannelIcon(notification.channel)}</span>
                          <div>
                            <h5 className="font-medium text-gray-900">{notification.title}</h5>
                            <p className="text-sm text-gray-600">{notification.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(notification.type)}`}>
                            {notification.type}
                          </span>
                          {!notification.read && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                              Unread
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm text-gray-900">{notification.message}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(notification.createdAt)} • {notification.channel}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {history.length === 0 && userId && !loading && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications Found</h3>
              <p className="text-gray-600">No notification history found for this user.</p>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Notification Analytics</h4>
              <p className="text-sm text-gray-600">View notification system performance and metrics</p>
            </div>
            <button
              onClick={loadAnalytics}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Loading...' : 'Load Analytics'}
            </button>
          </div>

          {/* Analytics Results */}
          {analytics && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Notification Metrics</h4>
                </div>
                <div className="card-content">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalNotifications)}</div>
                      <div className="text-sm text-gray-600">Total Notifications</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{formatNumber(analytics.sentNotifications)}</div>
                      <div className="text-sm text-gray-600">Sent Successfully</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{formatNumber(analytics.failedNotifications)}</div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Channel Performance */}
              {analytics.channels && analytics.channels.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title">Channel Performance</h4>
                  </div>
                  <div className="card-content">
                    <div className="space-y-3">
                      {analytics.channels.map((channel: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{getChannelIcon(channel.channelName)}</span>
                            <div>
                              <h5 className="font-medium text-gray-900">{channel.channelName}</h5>
                              <p className="text-sm text-gray-600">Channel ID: {channel.channelId}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">{formatNumber(channel.sentCount)}</div>
                              <div className="text-xs text-gray-500">Sent</div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-medium ${
                                channel.successRate >= 90 ? 'text-green-600' :
                                channel.successRate >= 70 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {channel.successRate}%
                              </div>
                              <div className="text-xs text-gray-500">Success Rate</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Template Usage */}
              {analytics.templates && analytics.templates.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title">Template Usage</h4>
                  </div>
                  <div className="card-content">
                    <div className="space-y-3">
                      {analytics.templates.map((template: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <h5 className="font-medium text-gray-900">{template.templateName}</h5>
                            <p className="text-sm text-gray-600">Template ID: {template.templateId}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">{formatNumber(template.usageCount)}</div>
                              <div className="text-xs text-gray-500">Usage Count</div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-medium ${
                                template.successRate >= 90 ? 'text-green-600' :
                                template.successRate >= 70 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {template.successRate}%
                              </div>
                              <div className="text-xs text-gray-500">Success Rate</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-600 text-lg">❌</span>
            <span className="text-sm text-red-800">Error: {error}</span>
          </div>
        </div>
      )}

      {/* Help Information */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h4 className="font-medium text-indigo-900 mb-2">Notification History & Analytics</h4>
        <div className="space-y-2 text-sm text-indigo-800">
          <div className="flex items-start space-x-2">
            <span className="text-indigo-600 text-lg">📋</span>
            <div>
              <p className="font-medium">Notification History</p>
              <p>View complete notification history for specific users with read/unread status.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-indigo-600 text-lg">📊</span>
            <div>
              <p className="font-medium">System Analytics</p>
              <p>Monitor notification system performance, channel success rates, and template usage.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-indigo-600 text-lg">📈</span>
            <div>
              <p className="font-medium">Performance Metrics</p>
              <p>Track delivery success rates and identify areas for improvement.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
