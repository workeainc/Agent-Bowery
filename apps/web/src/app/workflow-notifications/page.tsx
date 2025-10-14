'use client';

import { useState } from 'react';
import { ContentManager } from '@/components/auth/RoleGuard';
import { AppShell } from '@/components/layout/AppShell';
import WorkflowManagement from '@/components/workflow/WorkflowManagement';
import NotificationChannelsManagement from '@/components/notifications/NotificationChannelsManagement';
import NotificationTemplatesManagement from '@/components/notifications/NotificationTemplatesManagement';
import NotificationRulesManagement from '@/components/notifications/NotificationRulesManagement';
import NotificationHistoryAnalytics from '@/components/notifications/NotificationHistoryAnalytics';

export default function AdvancedWorkflowNotificationsPage() {
  const [activeTab, setActiveTab] = useState<'workflow' | 'channels' | 'templates' | 'rules' | 'history'>('workflow');
  const [selectedContentId, setSelectedContentId] = useState<string>('');

  const tabs = [
    { id: 'workflow', name: 'Workflow Management', icon: '🔄' },
    { id: 'channels', name: 'Notification Channels', icon: '📧' },
    { id: 'templates', name: 'Notification Templates', icon: '📝' },
    { id: 'rules', name: 'Notification Rules', icon: '⚡' },
    { id: 'history', name: 'History & Analytics', icon: '📊' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'workflow':
        return <WorkflowManagement contentId={selectedContentId} />;
      case 'channels':
        return <NotificationChannelsManagement />;
      case 'templates':
        return <NotificationTemplatesManagement />;
      case 'rules':
        return <NotificationRulesManagement />;
      case 'history':
        return <NotificationHistoryAnalytics />;
      default:
        return <WorkflowManagement contentId={selectedContentId} />;
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
                  <h1 className="text-2xl font-bold text-gray-900">Advanced Workflow & Notifications</h1>
                  <p className="text-gray-600">Manage workflows, notifications, and automation</p>
                </div>
                
                {/* Content ID Input for workflow features */}
                {activeTab === 'workflow' && (
                  <div className="card">
                    <div className="card-content">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Content ID (for workflow features)
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
              <h1 className="text-2xl font-bold text-gray-900">Advanced Workflow & Notifications</h1>
              <p className="text-gray-600">Manage workflows, notifications, and automation</p>
            </div>
            
            {/* Content ID Input for workflow features */}
            {activeTab === 'workflow' && (
              <div className="card">
                <div className="card-content">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content ID (for workflow features)
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
