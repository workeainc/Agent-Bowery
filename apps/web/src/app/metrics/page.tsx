'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import MetricsVisualization from '@/components/metrics/MetricsVisualization';
import PerformanceDashboard from '@/components/metrics/PerformanceDashboard';
import CustomMetrics from '@/components/metrics/CustomMetrics';

export default function MetricsManagementPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'visualization' | 'performance' | 'custom'>('visualization');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Metrics & Monitoring</h1>
          <p className="mt-2 text-gray-600">
            Monitor system performance and create custom metrics dashboards
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { key: 'visualization', label: 'Metrics Visualization', icon: '📊' },
              { key: 'performance', label: 'Performance Dashboard', icon: '⚡' },
              { key: 'custom', label: 'Custom Metrics', icon: '🔧' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'visualization' && (
            <MetricsVisualization organizationId={session?.user?.organizationId} />
          )}

          {activeTab === 'performance' && (
            <PerformanceDashboard organizationId={session?.user?.organizationId} />
          )}

          {activeTab === 'custom' && (
            <CustomMetrics organizationId={session?.user?.organizationId} />
          )}
        </div>
      </div>
    </div>
  );
}
