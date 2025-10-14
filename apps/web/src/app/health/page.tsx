'use client';

import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import SystemHealthDashboard from '@/components/health/SystemHealthDashboard';
import MetricsVisualization from '@/components/health/MetricsVisualization';
import { ContentManager } from '@/components/auth/RoleGuard';

export default function HealthMonitoringPage() {
  const [activeTab, setActiveTab] = useState<'health' | 'metrics'>('health');

  return (
    <ContentManager fallback={
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to view health monitoring.</p>
          </div>
        </div>
      </AppShell>
    }>
      <AppShell>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Health & Monitoring</h1>
            <p className="text-gray-600 mt-2">
              Monitor system health, OAuth configuration, and performance metrics
            </p>
          </div>

          {/* Health Monitoring Navigation Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {[
                { key: 'health', label: 'System Health', icon: '🏥' },
                { key: 'metrics', label: 'Metrics', icon: '📊' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-primary-500 text-primary-600'
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
          {activeTab === 'health' && (
            <SystemHealthDashboard />
          )}

          {activeTab === 'metrics' && (
            <MetricsVisualization />
          )}
        </div>
      </AppShell>
    </ContentManager>
  );
}
