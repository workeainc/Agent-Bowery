'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppShell from '@/components/layout/AppShell';
import { ContentManager } from '@/components/auth/RoleGuard';
import WebhookStatus from '@/components/webhooks/WebhookStatus';
import WebhookLogs from '@/components/webhooks/WebhookLogs';
import WebhookConfig from '@/components/webhooks/WebhookConfig';

interface WebhookProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export default function WebhookManagementPage() {
  const { data: session } = useSession();
  const [selectedProvider, setSelectedProvider] = useState<string>('meta');
  const [loading, setLoading] = useState(false);

  const providers: WebhookProvider[] = [
    {
      id: 'meta',
      name: 'Meta (Facebook)',
      icon: '📘',
      description: 'Facebook Pages and Instagram webhooks'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      description: 'LinkedIn company pages and personal profiles'
    },
    {
      id: 'google',
      name: 'Google My Business',
      icon: '🔍',
      description: 'Google Business Profile webhooks'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: '📺',
      description: 'YouTube channel and video webhooks'
    }
  ];

  const handleConfigUpdate = (config: any) => {
    console.log('Webhook config updated:', config);
  };

  const handleProviderRefresh = () => {
    console.log(`Webhooks refreshed for ${selectedProvider}`);
  };

  return (
    <ContentManager fallback={
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to manage webhooks.</p>
          </div>
        </div>
      </AppShell>
    }>
      <AppShell>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Webhook Management</h1>
            <p className="text-gray-600 mt-2">
              Configure and monitor webhooks for real-time platform updates
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Provider Selection */}
            <div className="lg:col-span-1">
              <div className="card">
                <div className="card-content">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Platforms</h2>
                  <div className="space-y-3">
                    {providers.map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => setSelectedProvider(provider.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedProvider === provider.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{provider.icon}</span>
                          <div>
                            <div className="font-medium text-gray-900">{provider.name}</div>
                            <div className="text-sm text-gray-600">{provider.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Webhook Details */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Webhook Status */}
                <div className="card">
                  <div className="card-content">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Webhook Status - {providers.find(p => p.id === selectedProvider)?.name}
                    </h2>
                    <WebhookStatus 
                      provider={selectedProvider} 
                      onRefresh={handleProviderRefresh}
                    />
                  </div>
                </div>

                {/* Webhook Configuration */}
                <div className="card">
                  <div className="card-content">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Configuration - {providers.find(p => p.id === selectedProvider)?.name}
                    </h2>
                    <WebhookConfig 
                      provider={selectedProvider}
                      onConfigUpdate={handleConfigUpdate}
                    />
                  </div>
                </div>

                {/* Event Logs */}
                <div className="card">
                  <div className="card-content">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Event Logs - {providers.find(p => p.id === selectedProvider)?.name}
                    </h2>
                    <WebhookLogs provider={selectedProvider} />
                  </div>
                </div>

                {/* Webhook Information */}
                <div className="card">
                  <div className="card-content">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Webhook Information</h2>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Provider
                          </label>
                          <div className="text-sm text-gray-900">
                            {providers.find(p => p.id === selectedProvider)?.name}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Organization
                          </label>
                          <div className="text-sm text-gray-900">
                            {session?.user?.organizationId || 'Default'}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <div className="text-sm text-gray-600">
                          {providers.find(p => p.id === selectedProvider)?.description}
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <span className="text-green-600 text-lg">✅</span>
                          <div className="text-sm text-green-800">
                            <p className="font-medium mb-1">Webhook Benefits:</p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Real-time updates from connected platforms</li>
                              <li>Automatic content synchronization</li>
                              <li>Instant notification of platform changes</li>
                              <li>Improved content management efficiency</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ContentManager>
  );
}
