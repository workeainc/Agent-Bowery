'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import ErrorLogs from '@/components/errors/ErrorLogs';
import ErrorAnalytics from '@/components/errors/ErrorAnalytics';
import ErrorReporting from '@/components/errors/ErrorReporting';

export default function ErrorManagementPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'logs' | 'analytics' | 'reports'>('logs');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Error Management</h1>
          <p className="mt-2 text-gray-600">
            Monitor, analyze, and manage system errors and issues
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { key: 'logs', label: 'Error Logs', icon: '📋' },
              { key: 'analytics', label: 'Error Analytics', icon: '📊' },
              { key: 'reports', label: 'Error Reports', icon: '📝' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-red-500 text-red-600'
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
          {activeTab === 'logs' && (
            <ErrorLogs organizationId={session?.user?.organizationId} />
          )}

          {activeTab === 'analytics' && (
            <ErrorAnalytics organizationId={session?.user?.organizationId} />
          )}

          {activeTab === 'reports' && (
            <ErrorReporting organizationId={session?.user?.organizationId} />
          )}
        </div>
      </div>
    </div>
  );
}
