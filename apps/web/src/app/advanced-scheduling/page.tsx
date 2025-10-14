'use client';

import { useState } from 'react';
import { ContentManager } from '@/components/auth/RoleGuard';
import { AppShell } from '@/components/layout/AppShell';
import SmartScheduling from '@/components/scheduling/SmartScheduling';
import ScheduleManagement from '@/components/scheduling/ScheduleManagement';
import SchedulingAnalytics from '@/components/scheduling/SchedulingAnalytics';

export default function AdvancedSchedulingPage() {
  const [activeTab, setActiveTab] = useState<'smart' | 'management' | 'analytics'>('smart');
  const [selectedContentId, setSelectedContentId] = useState<string>('');

  const tabs = [
    { id: 'smart', name: 'Smart Scheduling', icon: '🤖' },
    { id: 'management', name: 'Schedule Management', icon: '📅' },
    { id: 'analytics', name: 'Scheduling Analytics', icon: '📊' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'smart':
        return <SmartScheduling contentId={selectedContentId} />;
      case 'management':
        return <ScheduleManagement />;
      case 'analytics':
        return <SchedulingAnalytics />;
      default:
        return <SmartScheduling contentId={selectedContentId} />;
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
                  <h1 className="text-2xl font-bold text-gray-900">Advanced Scheduling</h1>
                  <p className="text-gray-600">AI-powered scheduling optimization and management</p>
                </div>
                
                {/* Content ID Input for smart scheduling */}
                {activeTab === 'smart' && (
                  <div className="card">
                    <div className="card-content">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Content ID (for smart scheduling features)
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
              <h1 className="text-2xl font-bold text-gray-900">Advanced Scheduling</h1>
              <p className="text-gray-600">AI-powered scheduling optimization and management</p>
            </div>
            
            {/* Content ID Input for smart scheduling */}
            {activeTab === 'smart' && (
              <div className="card">
                <div className="card-content">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content ID (for smart scheduling features)
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
