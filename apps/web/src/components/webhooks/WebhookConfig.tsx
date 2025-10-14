'use client';

import { useState } from 'react';

interface WebhookConfigProps {
  provider: string;
  onConfigUpdate?: (config: any) => void;
}

export default function WebhookConfig({ provider, onConfigUpdate }: WebhookConfigProps) {
  const [config, setConfig] = useState({
    webhookUrl: `https://api.agentbowery.com/webhooks/${provider}`,
    verifyToken: '',
    secret: '',
    events: [] as string[],
    enabled: true
  });

  const availableEvents = {
    meta: [
      'page_feed',
      'post_created',
      'post_updated',
      'comment_added',
      'page_liked',
      'page_unliked'
    ],
    linkedin: [
      'post_created',
      'post_updated',
      'comment_added',
      'company_followed',
      'company_unfollowed'
    ],
    google: [
      'review_added',
      'review_updated',
      'business_updated',
      'photo_added'
    ],
    youtube: [
      'video_uploaded',
      'video_updated',
      'comment_added',
      'subscription_added'
    ]
  };

  const handleEventToggle = (event: string) => {
    setConfig(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  const handleSave = () => {
    if (onConfigUpdate) {
      onConfigUpdate(config);
    }
    alert('Webhook configuration saved!');
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(config.webhookUrl);
    alert('Webhook URL copied to clipboard!');
  };

  const generateVerifyToken = () => {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setConfig(prev => ({ ...prev, verifyToken: token }));
  };

  const generateSecret = () => {
    const secret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setConfig(prev => ({ ...prev, secret }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Webhook Configuration</h3>
        
        {/* Webhook URL */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Webhook URL
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={config.webhookUrl}
              onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
              className="input flex-1"
              readOnly
            />
            <button
              onClick={copyWebhookUrl}
              className="btn-outline btn-sm"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Use this URL when configuring webhooks in {provider.charAt(0).toUpperCase() + provider.slice(1)}
          </p>
        </div>

        {/* Verify Token */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verify Token
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={config.verifyToken}
              onChange={(e) => setConfig(prev => ({ ...prev, verifyToken: e.target.value }))}
              className="input flex-1"
              placeholder="Enter verify token..."
            />
            <button
              onClick={generateVerifyToken}
              className="btn-outline btn-sm"
            >
              Generate
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Token used to verify webhook authenticity
          </p>
        </div>

        {/* Secret */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Webhook Secret
          </label>
          <div className="flex space-x-2">
            <input
              type="password"
              value={config.secret}
              onChange={(e) => setConfig(prev => ({ ...prev, secret: e.target.value }))}
              className="input flex-1"
              placeholder="Enter webhook secret..."
            />
            <button
              onClick={generateSecret}
              className="btn-outline btn-sm"
            >
              Generate
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Secret used to sign webhook payloads
          </p>
        </div>

        {/* Events */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subscribe to Events
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(availableEvents as any)[provider]?.map((event: string) => (
              <label key={event} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.events.includes(event)}
                  onChange={() => handleEventToggle(event)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{event.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Enable/Disable */}
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              className="text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Enable Webhook</span>
          </label>
        </div>

        {/* Instructions */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">ℹ️</span>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Configuration Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Copy the webhook URL above</li>
                <li>In {provider.charAt(0).toUpperCase() + provider.slice(1)}, go to webhook settings</li>
                <li>Paste the URL and enter the verify token</li>
                <li>Select the events you want to receive</li>
                <li>Save the configuration</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="btn-primary"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
