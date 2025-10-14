'use client';

import { useState, useEffect } from 'react';

interface WebhookConfig {
  id: string;
  platform: string;
  url: string;
  status: 'active' | 'inactive' | 'error';
  events: string[];
  secret?: string;
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
  errorCount: number;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
}

interface WebhookEvent {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  createdAt: Date;
  deliveredAt?: Date;
  error?: string;
}

interface WebhookConfigurationProps {
  onWebhookUpdate?: (webhook: WebhookConfig) => void;
}

export default function WebhookConfiguration({ onWebhookUpdate }: WebhookConfigurationProps) {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  // Mock webhook configurations
  const mockWebhooks: WebhookConfig[] = [
    {
      id: '1',
      platform: 'Facebook',
      url: 'https://api.agentbowery.com/webhooks/facebook',
      status: 'active',
      events: ['messages', 'post_insights', 'page_mention', 'comment'],
      secret: 'fb_webhook_secret_123',
      createdAt: new Date('2024-01-15'),
      lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000),
      triggerCount: 1247,
      errorCount: 23,
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2
      }
    },
    {
      id: '2',
      platform: 'LinkedIn',
      url: 'https://api.agentbowery.com/webhooks/linkedin',
      status: 'active',
      events: ['share', 'comment', 'like', 'mention'],
      secret: 'li_webhook_secret_456',
      createdAt: new Date('2024-01-10'),
      lastTriggered: new Date(Date.now() - 1 * 60 * 60 * 1000),
      triggerCount: 892,
      errorCount: 12,
      retryPolicy: {
        maxRetries: 5,
        retryDelay: 2000,
        backoffMultiplier: 1.5
      }
    },
    {
      id: '3',
      platform: 'Instagram',
      url: 'https://api.agentbowery.com/webhooks/instagram',
      status: 'inactive',
      events: ['media', 'story_insights', 'comment'],
      secret: 'ig_webhook_secret_789',
      createdAt: new Date('2024-01-05'),
      lastTriggered: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      triggerCount: 0,
      errorCount: 0,
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2
      }
    },
    {
      id: '4',
      platform: 'Twitter',
      url: 'https://api.agentbowery.com/webhooks/twitter',
      status: 'error',
      events: ['tweet_create', 'tweet_delete', 'mention'],
      secret: 'tw_webhook_secret_012',
      createdAt: new Date('2024-01-20'),
      lastTriggered: new Date(Date.now() - 24 * 60 * 60 * 1000),
      triggerCount: 156,
      errorCount: 45,
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2
      }
    }
  ];

  // Mock webhook events
  const mockWebhookEvents: WebhookEvent[] = [
    {
      id: '1',
      webhookId: '1',
      event: 'messages',
      payload: { message_id: 'msg_123', sender: 'user_456', text: 'Hello!' },
      status: 'delivered',
      attempts: 1,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '2',
      webhookId: '1',
      event: 'post_insights',
      payload: { post_id: 'post_789', views: 1250, engagement: 85 },
      status: 'delivered',
      attempts: 1,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      id: '3',
      webhookId: '4',
      event: 'tweet_create',
      payload: { tweet_id: 'tweet_321', user: 'user_654', text: 'New tweet!' },
      status: 'failed',
      attempts: 3,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      error: 'Connection timeout'
    }
  ];

  useEffect(() => {
    setWebhooks(mockWebhooks);
    setWebhookEvents(mockWebhookEvents);
  }, []);

  const handleCreateWebhook = (webhookData: Partial<WebhookConfig>) => {
    const newWebhook: WebhookConfig = {
      id: Date.now().toString(),
      platform: webhookData.platform || '',
      url: webhookData.url || '',
      status: 'inactive',
      events: webhookData.events || [],
      secret: webhookData.secret || '',
      createdAt: new Date(),
      triggerCount: 0,
      errorCount: 0,
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2
      }
    };

    setWebhooks(prev => [newWebhook, ...prev]);
    setShowCreateModal(false);
    alert('Webhook created successfully!');
  };

  const handleUpdateWebhook = (webhookId: string, updates: Partial<WebhookConfig>) => {
    setWebhooks(prev => prev.map(webhook => 
      webhook.id === webhookId 
        ? { ...webhook, ...updates }
        : webhook
    ));

    if (onWebhookUpdate) {
      const updatedWebhook = webhooks.find(w => w.id === webhookId);
      if (updatedWebhook) {
        onWebhookUpdate({ ...updatedWebhook, ...updates });
      }
    }

    alert('Webhook updated successfully!');
  };

  const handleDeleteWebhook = (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    setWebhooks(prev => prev.filter(webhook => webhook.id !== webhookId));
    alert('Webhook deleted successfully!');
  };

  const handleTestWebhook = async (webhookId: string) => {
    setTestingWebhook(webhookId);
    
    // Simulate webhook test
    setTimeout(() => {
      setTestingWebhook(null);
      alert('Webhook test completed successfully!');
    }, 2000);
  };

  const handleToggleWebhook = (webhookId: string) => {
    const webhook = webhooks.find(w => w.id === webhookId);
    if (webhook) {
      const newStatus = webhook.status === 'active' ? 'inactive' : 'active';
      handleUpdateWebhook(webhookId, { status: newStatus });
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Facebook': return '📘';
      case 'LinkedIn': return '💼';
      case 'Instagram': return '📷';
      case 'Twitter': return '🐦';
      case 'Email': return '📧';
      default: return '📱';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'retrying': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSuccessRate = (webhook: WebhookConfig) => {
    const total = webhook.triggerCount + webhook.errorCount;
    if (total === 0) return 100;
    return Math.round(((webhook.triggerCount - webhook.errorCount) / total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Webhook Configuration</h2>
          <p className="text-gray-600 mt-1">
            Manage webhook endpoints and event subscriptions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Create Webhook
        </button>
      </div>

      {/* Webhook Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {webhooks.filter(w => w.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600 text-lg">⏸️</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">
                  {webhooks.filter(w => w.status === 'inactive').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 text-lg">❌</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {webhooks.filter(w => w.status === 'error').length}
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
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">
                  {webhooks.reduce((sum, w) => sum + w.triggerCount, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Webhooks List */}
      <div className="space-y-4">
        {webhooks.map((webhook) => (
          <div key={webhook.id} className="card">
            <div className="card-content">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getPlatformIcon(webhook.platform)}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{webhook.platform} Webhook</h3>
                    <p className="text-sm text-gray-600 font-mono">{webhook.url}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(webhook.status)}`}>
                    {webhook.status}
                  </span>
                </div>
              </div>

              {/* Webhook Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                  <div className="text-lg font-bold text-gray-900">{getSuccessRate(webhook)}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Events</div>
                  <div className="text-lg font-bold text-gray-900">{webhook.triggerCount}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Errors</div>
                  <div className="text-lg font-bold text-red-600">{webhook.errorCount}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Last Triggered</div>
                  <div className="text-sm font-medium text-gray-900">
                    {webhook.lastTriggered ? formatDate(webhook.lastTriggered) : 'Never'}
                  </div>
                </div>
              </div>

              {/* Events */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Subscribed Events</div>
                <div className="flex flex-wrap gap-2">
                  {webhook.events.map((event, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                    >
                      {event}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleToggleWebhook(webhook.id)}
                  className={`btn-outline btn-sm ${
                    webhook.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                  }`}
                >
                  {webhook.status === 'active' ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleTestWebhook(webhook.id)}
                  className="btn-outline btn-sm"
                  disabled={testingWebhook === webhook.id}
                >
                  {testingWebhook === webhook.id ? 'Testing...' : 'Test'}
                </button>
                <button
                  onClick={() => {
                    setSelectedWebhook(webhook);
                    setShowEventsModal(true);
                  }}
                  className="btn-outline btn-sm"
                >
                  View Events
                </button>
                <button
                  onClick={() => handleDeleteWebhook(webhook.id)}
                  className="btn-outline btn-sm text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Webhook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create Webhook</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                <select className="input w-full">
                  <option value="Facebook">Facebook</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Twitter">Twitter</option>
                  <option value="Email">Email</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
                <input
                  type="url"
                  className="input w-full"
                  placeholder="https://api.agentbowery.com/webhooks/platform"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secret</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="webhook_secret_key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Events</label>
                <div className="space-y-2">
                  {['messages', 'post_insights', 'comment', 'like', 'mention', 'share'].map((event) => (
                    <div key={event} className="flex items-center">
                      <input
                        type="checkbox"
                        id={event}
                        className="mr-2"
                      />
                      <label htmlFor={event} className="text-sm text-gray-700">
                        {event}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCreateWebhook({})}
                  className="btn-primary"
                >
                  Create Webhook
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Webhook Events Modal */}
      {showEventsModal && selectedWebhook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Webhook Events - {selectedWebhook.platform}
                </h2>
                <button
                  onClick={() => {
                    setShowEventsModal(false);
                    setSelectedWebhook(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-4">
                {webhookEvents
                  .filter(event => event.webhookId === selectedWebhook.id)
                  .map((event) => (
                    <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-900">{event.event}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEventStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(event.createdAt)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Attempts: {event.attempts}
                      </div>
                      {event.error && (
                        <div className="text-sm text-red-600 mb-2">
                          Error: {event.error}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                        {JSON.stringify(event.payload, null, 2)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowEventsModal(false);
                  setSelectedWebhook(null);
                }}
                className="btn-outline w-full"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
