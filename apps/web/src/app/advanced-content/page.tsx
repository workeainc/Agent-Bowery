'use client';

import { useState } from 'react';
import { ContentManager } from '@/components/auth/RoleGuard';
import { AppShell } from '@/components/layout/AppShell';
import ContentVersionsManager from '@/components/content/ContentVersionsManager';
import ContentPreviews from '@/components/content/ContentPreviews';
import ContentAdaptation from '@/components/content/ContentAdaptation';
import BulkOperations from '@/components/content/BulkOperations';
import AdvancedSearch from '@/components/content/AdvancedSearch';
import TargetAccountManagement from '@/components/content/TargetAccountManagement';

export default function AdvancedContentFeaturesPage() {
  const [activeTab, setActiveTab] = useState<'versions' | 'previews' | 'adaptation' | 'bulk' | 'search' | 'accounts'>('versions');
  const [selectedContentId, setSelectedContentId] = useState<string>('');

  const tabs = [
    { id: 'versions', name: 'Content Versions', icon: '📝' },
    { id: 'previews', name: 'Platform Previews', icon: '👁️' },
    { id: 'adaptation', name: 'Content Adaptation', icon: '🔄' },
    { id: 'bulk', name: 'Bulk Operations', icon: '⚡' },
    { id: 'search', name: 'Advanced Search', icon: '🔍' },
    { id: 'accounts', name: 'Target Accounts', icon: '🎯' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'versions':
        return <ContentVersionsManager contentId={selectedContentId} />;
      case 'previews':
        return <ContentPreviews contentId={selectedContentId} />;
      case 'adaptation':
        return <ContentAdaptation contentId={selectedContentId} />;
      case 'bulk':
        return <BulkOperations contentId={selectedContentId} />;
      case 'search':
        return <AdvancedSearch />;
      case 'accounts':
        return <TargetAccountManagement />;
      default:
        return <ContentVersionsManager contentId={selectedContentId} />;
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
                  <h1 className="text-2xl font-bold text-gray-900">Advanced Content Features</h1>
                  <p className="text-gray-600">Advanced content management, versioning, and optimization tools</p>
                </div>
                
                {/* Content ID Input for content-specific features */}
                {['versions', 'previews', 'adaptation', 'bulk'].includes(activeTab) && (
                  <div className="card">
                    <div className="card-content">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Content ID (for content-specific features)
                          </label>
                          <input
                            type="text"
                            value={selectedContentId}
                            onChange={(e) => setSelectedContentId(e.target.value)}
                            className="input w-full"
                            placeholder="Enter content ID to work with specific content..."
                          />
                        </div>
                        <div className="text-sm text-gray-500">
                          {selectedContentId ? 'Content selected' : 'No content selected'}
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
              <h1 className="text-2xl font-bold text-gray-900">Advanced Content Features</h1>
              <p className="text-gray-600">Advanced content management, versioning, and optimization tools</p>
            </div>
            
            {/* Content ID Input for content-specific features */}
            {['versions', 'previews', 'adaptation', 'bulk'].includes(activeTab) && (
              <div className="card">
                <div className="card-content">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content ID (for content-specific features)
                      </label>
                      <input
                        type="text"
                        value={selectedContentId}
                        onChange={(e) => setSelectedContentId(e.target.value)}
                        className="input w-full"
                        placeholder="Enter content ID to work with specific content..."
                      />
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedContentId ? 'Content selected' : 'No content selected'}
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
