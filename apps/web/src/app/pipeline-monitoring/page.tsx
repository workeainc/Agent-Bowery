'use client';

import { useState } from 'react';
import { ContentManager } from '@/components/auth/RoleGuard';
import { AppShell } from '@/components/layout/AppShell';
import PipelineProgress from '@/components/pipeline/PipelineProgress';
import PipelineMetrics from '@/components/pipeline/PipelineMetrics';
import PipelineAnalytics from '@/components/pipeline/PipelineAnalytics';
import PipelineCancellation from '@/components/pipeline/PipelineCancellation';

export default function PipelineMonitoringPage() {
  const [activeTab, setActiveTab] = useState<'progress' | 'metrics' | 'analytics' | 'cancellation'>('progress');
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');

  const tabs = [
    { id: 'progress', name: 'Progress Monitoring', icon: '📊' },
    { id: 'metrics', name: 'Pipeline Metrics', icon: '📈' },
    { id: 'analytics', name: 'System Analytics', icon: '🔍' },
    { id: 'cancellation', name: 'Pipeline Cancellation', icon: '🛑' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'progress':
        return <PipelineProgress pipelineId={selectedPipelineId} />;
      case 'metrics':
        return <PipelineMetrics pipelineId={selectedPipelineId} />;
      case 'analytics':
        return <PipelineAnalytics />;
      case 'cancellation':
        return <PipelineCancellation pipelineId={selectedPipelineId} />;
      default:
        return <PipelineProgress pipelineId={selectedPipelineId} />;
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
                  <h1 className="text-2xl font-bold text-gray-900">Pipeline Monitoring</h1>
                  <p className="text-gray-600">Monitor pipeline execution, performance, and analytics</p>
                </div>
                
                {/* Pipeline ID Input for pipeline-specific features */}
                {['progress', 'metrics', 'cancellation'].includes(activeTab) && (
                  <div className="card">
                    <div className="card-content">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pipeline ID (for pipeline-specific features)
                          </label>
                          <input
                            type="text"
                            value={selectedPipelineId}
                            onChange={(e) => setSelectedPipelineId(e.target.value)}
                            className="input w-full"
                            placeholder="Enter pipeline ID to work with specific pipeline..."
                          />
                        </div>
                        <div className="text-sm text-gray-500">
                          {selectedPipelineId ? 'Pipeline selected' : 'No pipeline selected'}
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
              <h1 className="text-2xl font-bold text-gray-900">Pipeline Monitoring</h1>
              <p className="text-gray-600">Monitor pipeline execution, performance, and analytics</p>
            </div>
            
            {/* Pipeline ID Input for pipeline-specific features */}
            {['progress', 'metrics', 'cancellation'].includes(activeTab) && (
              <div className="card">
                <div className="card-content">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pipeline ID (for pipeline-specific features)
                      </label>
                      <input
                        type="text"
                        value={selectedPipelineId}
                        onChange={(e) => setSelectedPipelineId(e.target.value)}
                        className="input w-full"
                        placeholder="Enter pipeline ID to work with specific pipeline..."
                      />
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedPipelineId ? 'Pipeline selected' : 'No pipeline selected'}
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
