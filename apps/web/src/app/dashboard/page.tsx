'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { SystemHealth } from '@/types';
import AppShell from '@/components/layout/AppShell';

export default function DashboardPage() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        setLoading(true);
        const health = await apiClient.getSystemHealth();
        setSystemHealth(health);
        setError(null);
      } catch (err) {
        console.warn('Backend API not available, using offline mode:', err);
        // Set mock system health when backend is not available
        setSystemHealth({
          status: 'ok',
          globalPause: false,
          systemStatus: 'offline',
          updatedAt: new Date().toISOString(),
          providers: {
            meta: false,
            linkedin: false,
            google: false,
          }
        });
        setError(null); // No error, just offline mode
      } finally {
        setLoading(false);
      }
    };

    fetchSystemHealth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome to Agent Bowery Content Management System
          </p>
          {systemHealth?.systemStatus === 'offline' && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Running in Offline Mode
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      The backend API is not available. You can still use the frontend interface, 
                      but some features may be limited. To enable full functionality, start the backend server.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* System Health Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">System Health</h3>
              <p className="card-description">
                Current system status and health metrics
              </p>
            </div>
            <div className="card-content">
              <div className="flex items-center space-x-2 mb-4">
                <div
                  className={`w-3 h-3 rounded-full ${
                    systemHealth?.systemStatus === 'active'
                      ? 'bg-green-500'
                      : systemHealth?.systemStatus === 'offline'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                />
                <span className="text-sm font-medium">
                  {systemHealth?.systemStatus === 'active'
                    ? 'All systems operational'
                    : systemHealth?.systemStatus === 'offline'
                    ? 'Running in offline mode'
                    : 'System issues detected'}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Global Pause:</span>
                  <span className={systemHealth?.globalPause ? 'text-red-600' : 'text-green-600'}>
                    {systemHealth?.globalPause ? 'Paused' : 'Active'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Meta Integration:</span>
                  <span className={
                    systemHealth?.systemStatus === 'offline' 
                      ? 'text-gray-500' 
                      : systemHealth?.providers?.meta 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }>
                    {systemHealth?.systemStatus === 'offline' 
                      ? 'Offline' 
                      : systemHealth?.providers?.meta 
                      ? 'Connected' 
                      : 'Disconnected'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>LinkedIn Integration:</span>
                  <span className={
                    systemHealth?.systemStatus === 'offline' 
                      ? 'text-gray-500' 
                      : systemHealth?.providers?.linkedin 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }>
                    {systemHealth?.systemStatus === 'offline' 
                      ? 'Offline' 
                      : systemHealth?.providers?.linkedin 
                      ? 'Connected' 
                      : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
              <p className="card-description">
                Common tasks and shortcuts
              </p>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                <button className="w-full btn-primary text-left">
                  Create New Content
                </button>
                <button className="w-full btn-outline text-left">
                  View Content Calendar
                </button>
                <button className="w-full btn-outline text-left">
                  Check Social Inbox
                </button>
                <button className="w-full btn-outline text-left">
                  View Analytics
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Activity</h3>
              <p className="card-description">
                Latest system activities and updates
              </p>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">System started</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">API endpoints ready</p>
                    <p className="text-xs text-gray-500">5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Database connected</p>
                    <p className="text-xs text-gray-500">10 minutes ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Frontend: Running</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  systemHealth?.systemStatus === 'offline' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  Backend: {systemHealth?.systemStatus === 'offline' ? 'Offline' : 'Connected'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  systemHealth?.systemStatus === 'offline' ? 'bg-gray-400' : 'bg-green-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  Database: {systemHealth?.systemStatus === 'offline' ? 'Offline' : 'Online'}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
