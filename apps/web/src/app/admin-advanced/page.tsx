'use client';

import { useState } from 'react';
import { ContentManager } from '@/components/auth/RoleGuard';
import { AppShell } from '@/components/layout/AppShell';
import AutoApprovalManagement from '@/components/admin/AutoApprovalManagement';
import EscalationRules from '@/components/admin/EscalationRules';
import SystemControls from '@/components/admin/SystemControls';
import TemplatePerformanceAnalytics from '@/components/admin/TemplatePerformanceAnalytics';

export default function AdminAdvancedFeaturesPage() {
  const [activeTab, setActiveTab] = useState<'autoapproval' | 'escalation' | 'system' | 'templates'>('autoapproval');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  const tabs = [
    { id: 'autoapproval', name: 'Auto-Approval', icon: '🤖' },
    { id: 'escalation', name: 'Escalation Rules', icon: '🔔' },
    { id: 'system', name: 'System Controls', icon: '⚙️' },
    { id: 'templates', name: 'Template Performance', icon: '📊' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'autoapproval':
        return <AutoApprovalManagement organizationId={selectedOrgId} />;
      case 'escalation':
        return <EscalationRules organizationId={selectedOrgId} />;
      case 'system':
        return <SystemControls />;
      case 'templates':
        return <TemplatePerformanceAnalytics />;
      default:
        return <AutoApprovalManagement organizationId={selectedOrgId} />;
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
                  <h1 className="text-2xl font-bold text-gray-900">Admin Advanced Features</h1>
                  <p className="text-gray-600">Advanced administrative controls and analytics</p>
                </div>
                
                {/* Organization ID Input for org-specific features */}
                {['autoapproval', 'escalation'].includes(activeTab) && (
                  <div className="card">
                    <div className="card-content">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Organization ID (for organization-specific features)
                          </label>
                          <input
                            type="text"
                            value={selectedOrgId}
                            onChange={(e) => setSelectedOrgId(e.target.value)}
                            className="input w-full"
                            placeholder="Enter organization ID for org-specific features..."
                          />
                        </div>
                        <div className="text-sm text-gray-500">
                          {selectedOrgId ? 'Organization selected' : 'No organization selected'}
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
              <h1 className="text-2xl font-bold text-gray-900">Admin Advanced Features</h1>
              <p className="text-gray-600">Advanced administrative controls and analytics</p>
            </div>
            
            {/* Organization ID Input for org-specific features */}
            {['autoapproval', 'escalation'].includes(activeTab) && (
              <div className="card">
                <div className="card-content">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization ID (for organization-specific features)
                      </label>
                      <input
                        type="text"
                        value={selectedOrgId}
                        onChange={(e) => setSelectedOrgId(e.target.value)}
                        className="input w-full"
                        placeholder="Enter organization ID for org-specific features..."
                      />
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedOrgId ? 'Organization selected' : 'No organization selected'}
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
