'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, any>;
  enabled: boolean;
  createdAt: string;
}

export default function NotificationChannelsManagement() {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'email' as 'email' | 'slack' | 'webhook' | 'sms',
    config: {} as Record<string, any>,
    enabled: true,
  });

  const channelTypes = [
    { value: 'email', label: 'Email', icon: '📧', description: 'Send notifications via email' },
    { value: 'slack', label: 'Slack', icon: '💬', description: 'Send notifications to Slack channels' },
    { value: 'webhook', label: 'Webhook', icon: '🔗', description: 'Send notifications via webhook' },
    { value: 'sms', label: 'SMS', icon: '📱', description: 'Send notifications via SMS' },
  ];

  const getChannelIcon = (type: string) => {
    const channelType = channelTypes.find(ct => ct.value === type);
    return channelType?.icon || '📁';
  };

  const createChannel = async () => {
    try {
      setLoading(true);
      setError(null);

      const newChannel = await apiClient.createNotificationChannel(formData);
      setChannels(prev => [...prev, newChannel]);
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      console.error('Failed to create notification channel:', err);
      setError(err.message || 'Failed to create notification channel');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'email',
      config: {},
      enabled: true,
    });
  };

  const handleCancel = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getConfigFields = (type: string) => {
    switch (type) {
      case 'email':
        return [
          { key: 'smtpHost', label: 'SMTP Host', type: 'text' },
          { key: 'smtpPort', label: 'SMTP Port', type: 'number' },
          { key: 'username', label: 'Username', type: 'text' },
          { key: 'password', label: 'Password', type: 'password' },
        ];
      case 'slack':
        return [
          { key: 'webhookUrl', label: 'Webhook URL', type: 'url' },
          { key: 'channel', label: 'Channel', type: 'text' },
          { key: 'botToken', label: 'Bot Token', type: 'password' },
        ];
      case 'webhook':
        return [
          { key: 'url', label: 'Webhook URL', type: 'url' },
          { key: 'method', label: 'HTTP Method', type: 'select', options: ['POST', 'PUT', 'PATCH'] },
          { key: 'headers', label: 'Headers (JSON)', type: 'textarea' },
        ];
      case 'sms':
        return [
          { key: 'provider', label: 'Provider', type: 'select', options: ['twilio', 'aws-sns', 'custom'] },
          { key: 'apiKey', label: 'API Key', type: 'password' },
          { key: 'apiSecret', label: 'API Secret', type: 'password' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Notification Channels</h3>
          <p className="text-sm text-gray-600">Manage notification delivery channels</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Add Channel
        </button>
      </div>

      {/* Channels List */}
      {channels.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📧</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Notification Channels</h3>
          <p className="text-gray-600">Add your first notification channel to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => (
            <div key={channel.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getChannelIcon(channel.type)}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{channel.name}</h4>
                    <p className="text-sm text-gray-600 capitalize">{channel.type}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  channel.enabled ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                }`}>
                  {channel.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Configuration</label>
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                    <pre>{JSON.stringify(channel.config, null, 2)}</pre>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">Created</label>
                  <div className="text-xs text-gray-600">{formatDate(channel.createdAt)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create Notification Channel</h2>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input w-full"
                    placeholder="Enter channel name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channel Type
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {channelTypes.map((type) => (
                      <label key={type.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="channelType"
                          value={type.value}
                          checked={formData.type === type.value}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as any, config: {} })}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-lg">{type.icon}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{type.label}</div>
                          <div className="text-xs text-gray-600">{type.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Dynamic Configuration Fields */}
                {getConfigFields(formData.type).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Configuration
                    </label>
                    <div className="space-y-3">
                      {getConfigFields(formData.type).map((field) => (
                        <div key={field.key}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {field.label}
                          </label>
                          {field.type === 'textarea' ? (
                            <textarea
                              value={formData.config[field.key] || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                config: { ...formData.config, [field.key]: e.target.value }
                              })}
                              className="input w-full h-20 resize-none font-mono text-sm"
                              placeholder={`Enter ${field.label.toLowerCase()}...`}
                            />
                          ) : field.type === 'select' ? (
                            <select
                              value={formData.config[field.key] || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                config: { ...formData.config, [field.key]: e.target.value }
                              })}
                              className="input w-full"
                            >
                              <option value="">Select {field.label}</option>
                              {field.options?.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              value={formData.config[field.key] || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                config: { ...formData.config, [field.key]: e.target.value }
                              })}
                              className="input w-full"
                              placeholder={`Enter ${field.label.toLowerCase()}...`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">Enable this channel</label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={createChannel}
                disabled={loading || !formData.name.trim()}
                className="btn-primary"
              >
                {loading ? 'Creating...' : 'Create Channel'}
              </button>
            </div>
          </div>
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Notification Channels</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">📧</span>
            <div>
              <p className="font-medium">Multiple Channel Types</p>
              <p>Support for email, Slack, webhooks, and SMS notification channels.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">⚙️</span>
            <div>
              <p className="font-medium">Flexible Configuration</p>
              <p>Each channel type has specific configuration options for optimal delivery.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">🔧</span>
            <div>
              <p className="font-medium">Easy Management</p>
              <p>Enable/disable channels and manage configurations as needed.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
