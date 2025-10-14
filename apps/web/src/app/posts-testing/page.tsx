'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppShell from '@/components/layout/AppShell';
import { ContentManager } from '@/components/auth/RoleGuard';
import PlatformTesting from '@/components/posts/PlatformTesting';
import ConnectionDiagnostics from '@/components/posts/ConnectionDiagnostics';

interface TestingProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export default function PostsTestingPage() {
  const { data: session } = useSession();
  const [selectedProvider, setSelectedProvider] = useState<string>('meta');
  const [loading, setLoading] = useState(false);

  const providers: TestingProvider[] = [
    {
      id: 'meta',
      name: 'Meta (Facebook)',
      icon: '📘',
      description: 'Test Facebook Pages and Instagram posting'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      description: 'Test LinkedIn company pages and personal profiles'
    },
    {
      id: 'google',
      name: 'Google My Business',
      icon: '🔍',
      description: 'Test Google Business Profile posting'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: '📺',
      description: 'Test YouTube channel and video posting'
    }
  ];

  const handleTestComplete = (result: any) => {
    console.log('Test completed:', result);
  };

  return (
    <ContentManager fallback={
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to test posts.</p>
          </div>
        </div>
      </AppShell>
    }>
      <AppShell>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Posts Testing</h1>
            <p className="text-gray-600 mt-2">
              Test platform connections and posting functionality
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

            {/* Testing Interface */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Platform Testing */}
                <div className="card">
                  <div className="card-content">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Platform Testing - {providers.find(p => p.id === selectedProvider)?.name}
                    </h2>
                    <PlatformTesting 
                      provider={selectedProvider}
                      onTestComplete={handleTestComplete}
                    />
                  </div>
                </div>

                {/* Connection Diagnostics */}
                <div className="card">
                  <div className="card-content">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Connection Diagnostics - {providers.find(p => p.id === selectedProvider)?.name}
                    </h2>
                    <ConnectionDiagnostics provider={selectedProvider} />
                  </div>
                </div>

                {/* Testing Information */}
                <div className="card">
                  <div className="card-content">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Testing Information</h2>
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

                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <span className="text-yellow-600 text-lg">⚠️</span>
                          <div className="text-sm text-yellow-800">
                            <p className="font-medium mb-1">Testing Safety:</p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Dry-run tests don't actually post content</li>
                              <li>Connection tests only verify connectivity</li>
                              <li>All tests use safe, non-destructive methods</li>
                              <li>Dummy tokens are used in development mode</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <span className="text-green-600 text-lg">✅</span>
                          <div className="text-sm text-green-800">
                            <p className="font-medium mb-1">Testing Benefits:</p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Verify platform connections before posting</li>
                              <li>Test content formatting and validation</li>
                              <li>Diagnose connection issues quickly</li>
                              <li>Ensure posting functionality works correctly</li>
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
