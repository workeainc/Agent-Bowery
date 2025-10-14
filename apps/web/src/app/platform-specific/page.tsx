'use client';

import { useState } from 'react';
import { ContentManager } from '@/components/auth/RoleGuard';
import { AppShell } from '@/components/layout/AppShell';
import PlatformDiscovery from '@/components/platforms/PlatformDiscovery';
import PlatformAccountManagement from '@/components/platforms/PlatformAccountManagement';
import PlatformPublishingOptions from '@/components/platforms/PlatformPublishingOptions';

export default function PlatformSpecificFeaturesPage() {
  const [activeTab, setActiveTab] = useState<'discovery' | 'accounts' | 'publishing'>('discovery');
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const tabs = [
    { id: 'discovery', name: 'Platform Discovery', icon: '🌐' },
    { id: 'accounts', name: 'Account Management', icon: '🔗' },
    { id: 'publishing', name: 'Publishing Options', icon: '📄' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'discovery':
        return <PlatformDiscovery />;
      case 'accounts':
        return <PlatformAccountManagement platformId={selectedPlatformId} />;
      case 'publishing':
        return <PlatformPublishingOptions platformId={selectedPlatformId} accountId={selectedAccountId} />;
      default:
        return <PlatformDiscovery />;
    }
  };

  return (
    <ContentManager
      fallback={
        <AppShell>
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Platform-Specific Features</h1>
                  <p className="text-gray-600">Discover platforms, manage accounts, and explore publishing options</p>
                </div>
                
                {/* Platform and Account Selection for platform-specific features */}
                {['accounts', 'publishing'].includes(activeTab) && (
                  <div className="card">
                    <div className="card-content">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Platform ID
                          </label>
                          <input
                            type="text"
                            value={selectedPlatformId}
                            onChange={(e) => setSelectedPlatformId(e.target.value)}
                            className="input w-full"
                            placeholder="Enter platform ID..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Account ID (for publishing options)
                          </label>
                          <input
                            type="text"
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            className="input w-full"
                            placeholder="Enter account ID (optional)..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.name}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div>
                  {renderTabContent()}
                </div>
              </div>
            </div>
          </div>
        </AppShell>
      }
    >
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Platform-Specific Features</h1>
              <p className="text-gray-600">Discover platforms, manage accounts, and explore publishing options</p>
            </div>
            
            {/* Platform and Account Selection for platform-specific features */}
            {['accounts', 'publishing'].includes(activeTab) && (
              <div className="card">
                <div className="card-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Platform ID
                      </label>
                      <input
                        type="text"
                        value={selectedPlatformId}
                        onChange={(e) => setSelectedPlatformId(e.target.value)}
                        className="input w-full"
                        placeholder="Enter platform ID..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account ID (for publishing options)
                      </label>
                      <input
                        type="text"
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className="input w-full"
                        placeholder="Enter account ID (optional)..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div>
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </ContentManager>
  );
}
