'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface SystemHealth {
  globalPause: boolean;
  systemStatus: string;
  updatedAt: string;
  error?: string;
}

interface OAuthHealth {
  ready: boolean;
  required: Record<string, boolean>;
  dryRun: boolean;
  base: string | null;
  allowlist: string[];
  providers: {
    meta: boolean;
    linkedin: boolean;
  };
}

export default function SystemHealthDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [oauthHealth, setOauthHealth] = useState<OAuthHealth | null>(null);
  const [basicHealth, setBasicHealth] = useState<{ status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHealthData();
    // Refresh every 30 seconds
    const interval = setInterval(loadHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [basic, system, oauth] = await Promise.all([
        apiClient.getHealthStatus(),
        apiClient.getSystemHealth(),
        apiClient.getOAuthHealth()
      ]);

      setBasicHealth(basic);
      setSystemHealth(system);
      setOauthHealth(oauth);
    } catch (err: any) {
      console.error('Failed to load health data:', err);
      setError(err.message || 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ok':
      case 'active':
        return 'text-green-600';
      case 'paused':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ok':
      case 'active':
        return '✅';
      case 'paused':
        return '⏸️';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && !systemHealth) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading health data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">System Health Dashboard</h2>
            <p className="text-sm text-gray-600">Monitor system status and configuration health</p>
          </div>
          <button
            onClick={loadHealthData}
            disabled={loading}
            className="btn-secondary btn-sm"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Basic Health Status */}
        <div className="card mb-6">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">{getStatusIcon(basicHealth?.status || 'unknown')}</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Basic Health</h3>
                  <p className={`text-sm font-medium ${getStatusColor(basicHealth?.status || 'unknown')}`}>
                    {basicHealth?.status || 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">API Status</div>
                <div className="text-xs text-gray-500">Last checked: {new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">System Status</h3>
            <p className="card-description">Global system operations and pause status</p>
          </div>
          <div className="card-content">
            {systemHealth ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      System Status
                    </label>
                    <div className={`text-sm font-medium ${getStatusColor(systemHealth.systemStatus)}`}>
                      {getStatusIcon(systemHealth.systemStatus)} {systemHealth.systemStatus}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Global Pause
                    </label>
                    <div className={`text-sm font-medium ${systemHealth.globalPause ? 'text-yellow-600' : 'text-green-600'}`}>
                      {systemHealth.globalPause ? '⏸️ Paused' : '▶️ Active'}
                    </div>
                  </div>
                </div>

                {systemHealth.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Updated
                    </label>
                    <div className="text-sm text-gray-900">
                      {formatDate(systemHealth.updatedAt)}
                    </div>
                  </div>
                )}

                {systemHealth.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-red-600 text-lg">❌</span>
                      <span className="text-sm text-red-800">Error: {systemHealth.error}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-gray-400 text-4xl mb-2">⚠️</div>
                <p className="text-gray-600">Unable to load system health data</p>
              </div>
            )}
          </div>
        </div>

        {/* OAuth Configuration Health */}
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">OAuth Configuration</h3>
            <p className="card-description">OAuth provider configuration and readiness status</p>
          </div>
          <div className="card-content">
            {oauthHealth ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`text-2xl ${oauthHealth.ready ? 'text-green-600' : 'text-red-600'}`}>
                      {oauthHealth.ready ? '✅' : '❌'}
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900">OAuth Ready</h4>
                      <p className={`text-sm ${oauthHealth.ready ? 'text-green-600' : 'text-red-600'}`}>
                        {oauthHealth.ready ? 'All configurations valid' : 'Configuration issues detected'}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    oauthHealth.dryRun ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {oauthHealth.dryRun ? 'Dry Run Mode' : 'Live Mode'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Required Environment Variables
                    </label>
                    <div className="space-y-1">
                      {Object.entries(oauthHealth.required).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <span className={`text-sm ${value ? 'text-green-600' : 'text-red-600'}`}>
                            {value ? '✅' : '❌'}
                          </span>
                          <span className="text-sm text-gray-900 font-mono">{key}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Provider Status
                    </label>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${oauthHealth.providers.meta ? 'text-green-600' : 'text-red-600'}`}>
                          {oauthHealth.providers.meta ? '✅' : '❌'}
                        </span>
                        <span className="text-sm text-gray-900">Meta (Facebook)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${oauthHealth.providers.linkedin ? 'text-green-600' : 'text-red-600'}`}>
                          {oauthHealth.providers.linkedin ? '✅' : '❌'}
                        </span>
                        <span className="text-sm text-gray-900">LinkedIn</span>
                      </div>
                    </div>
                  </div>
                </div>

                {oauthHealth.base && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      OAuth Base URL
                    </label>
                    <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                      {oauthHealth.base}
                    </div>
                  </div>
                )}

                {oauthHealth.allowlist.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allowed Redirect URLs
                    </label>
                    <div className="text-sm text-gray-600">
                      {oauthHealth.allowlist.map((url, index) => (
                        <div key={index} className="font-mono bg-gray-50 p-1 rounded mb-1">
                          {url}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-gray-400 text-4xl mb-2">⚠️</div>
                <p className="text-gray-600">Unable to load OAuth health data</p>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="card">
            <div className="card-content">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-red-600 text-lg">❌</span>
                  <span className="text-sm text-red-800">Error: {error}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Information */}
        <div className="card">
          <div className="card-content">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Health Monitoring Help</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-lg">ℹ️</span>
                <div>
                  <p className="font-medium text-gray-900">System Status</p>
                  <p>Shows the overall system health and whether global operations are paused.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600 text-lg">✅</span>
                <div>
                  <p className="font-medium text-gray-900">OAuth Configuration</p>
                  <p>Verifies that all required environment variables and OAuth providers are properly configured.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600 text-lg">🔄</span>
                <div>
                  <p className="font-medium text-gray-900">Auto Refresh</p>
                  <p>Health data is automatically refreshed every 30 seconds to show real-time status.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
