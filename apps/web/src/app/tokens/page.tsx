'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppShell from '@/components/layout/AppShell';
import { ContentManager } from '@/components/auth/RoleGuard';
import TokenStatus from '@/components/tokens/TokenStatus';
import TokenAudit from '@/components/tokens/TokenAudit';

interface TokenProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export default function TokenManagementPage() {
  const { data: session } = useSession();
  const [selectedProvider, setSelectedProvider] = useState<string>('meta');
  const [loading, setLoading] = useState(false);

  const providers: TokenProvider[] = [
    {
      id: 'meta',
      name: 'Meta (Facebook)',
      icon: '📘',
      description: 'Facebook Pages and Instagram integration'
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
      description: 'Google Business Profile management'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: '📺',
      description: 'YouTube channel and video management'
    }
  ];

  const handleProviderRefresh = () => {
    // This will be called when tokens are refreshed
    console.log(`Tokens refreshed for ${selectedProvider}`);
  };

  return (
    <ContentManager fallback={
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to manage tokens.</p>
          </div>
        </div>
      </AppShell>
    }>
      <AppShell>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Token Management</h1>
            <p className="text-gray-600 mt-2">
              Monitor and manage OAuth tokens for connected platforms
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

            {/* Token Details */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Token Status */}
                <div className="card">
                  <div className="card-content">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Token Status - {providers.find(p => p.id === selectedProvider)?.name}
                    </h2>
                    <TokenStatus 
                      provider={selectedProvider} 
                      onRefresh={handleProviderRefresh}
                    />
                  </div>
                </div>

                {/* Audit Trail */}
                <div className="card">
                  <div className="card-content">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Audit Trail - {providers.find(p => p.id === selectedProvider)?.name}
                    </h2>
                    <TokenAudit provider={selectedProvider} />
                  </div>
                </div>

                {/* Token Information */}
                <div className="card">
                  <div className="card-content">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Token Information</h2>
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

                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-600 text-lg">ℹ️</span>
                          <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Token Management Tips:</p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Tokens are automatically refreshed when they expire</li>
                              <li>Dummy tokens are used in development mode</li>
                              <li>All token operations are logged for security</li>
                              <li>Contact support if you experience token issues</li>
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
