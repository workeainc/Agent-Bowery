'use client';

import { useState } from 'react';
import { ContentManager } from '@/components/auth/RoleGuard';
import { AppShell } from '@/components/layout/AppShell';
import PerplexityAIInterface from '@/components/ai/PerplexityAIInterface';
import ContentQualityAnalysis from '@/components/ai/ContentQualityAnalysis';
import PerformanceAnalytics from '@/components/ai/PerformanceAnalytics';
import MediaOptimization from '@/components/ai/MediaOptimization';
import OptimizationTracking from '@/components/ai/OptimizationTracking';

export default function AdvancedAIAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'perplexity' | 'quality' | 'performance' | 'media' | 'tracking'>('perplexity');
  const [selectedContentId, setSelectedContentId] = useState<string>('');

  const tabs = [
    { id: 'perplexity', name: 'Perplexity AI', icon: '🤖' },
    { id: 'quality', name: 'Quality Analysis', icon: '📊' },
    { id: 'performance', name: 'Performance Analytics', icon: '📈' },
    { id: 'media', name: 'Media Optimization', icon: '⚡' },
    { id: 'tracking', name: 'Optimization Tracking', icon: '🎯' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'perplexity':
        return <PerplexityAIInterface />;
      case 'quality':
        return <ContentQualityAnalysis contentId={selectedContentId} />;
      case 'performance':
        return <PerformanceAnalytics contentId={selectedContentId} />;
      case 'media':
        return <MediaOptimization contentId={selectedContentId} />;
      case 'tracking':
        return <OptimizationTracking />;
      default:
        return <PerplexityAIInterface />;
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
                  <h1 className="text-2xl font-bold text-gray-900">Advanced AI & Analytics</h1>
                  <p className="text-gray-600">AI-powered content analysis, optimization, and performance tracking</p>
                </div>
                
                {/* Content ID Input for content-specific features */}
                {['quality', 'performance', 'media'].includes(activeTab) && (
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
              <h1 className="text-2xl font-bold text-gray-900">Advanced AI & Analytics</h1>
              <p className="text-gray-600">AI-powered content analysis, optimization, and performance tracking</p>
            </div>
            
            {/* Content ID Input for content-specific features */}
            {['quality', 'performance', 'media'].includes(activeTab) && (
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
