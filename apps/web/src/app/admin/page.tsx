'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppShell from '@/components/layout/AppShell';
import { apiClient } from '@/lib/api-client';
import { ContentManager } from '@/components/auth/RoleGuard';
import TemplateManagement from '@/components/admin/TemplateManagement';
import BrandRuleConfiguration from '@/components/admin/BrandRuleConfiguration';
import BrandRuleAnalytics from '@/components/admin/BrandRuleAnalytics';
import QualityPolicyManagement from '@/components/admin/QualityPolicyManagement';
import UserManagement from '@/components/admin/UserManagement';
import SystemConfiguration from '@/components/admin/SystemConfiguration';
import DLQManagement from '@/components/admin/DLQManagement';
import PromptTemplateManagement from '@/components/admin/PromptTemplateManagement';
import QualityPolicyConfiguration from '@/components/admin/QualityPolicyConfiguration';
import AutopostControls from '@/components/admin/AutopostControls';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface SystemStats {
  totalUsers: number;
  totalTemplates: number;
  totalBrandRules: number;
  totalQualityPolicies: number;
  activeUsers: number;
  systemUptime: number;
  apiCallsToday: number;
  errorRate: number;
}

interface AdminDashboardProps {
  onNavigateTo?: (section: string) => void;
}

export default function AdminPanelPage() {
  const { data: session } = useSession();
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'templates' | 'brand-rules' | 'brand-analytics' | 'quality-policies' | 'users' | 'system' | 'dlq' | 'prompt-templates' | 'quality-config' | 'autopost'>('overview');

  // Mock data for demonstration
  const mockSystemStats: SystemStats = {
    totalUsers: 156,
    totalTemplates: 23,
    totalBrandRules: 12,
    totalQualityPolicies: 8,
    activeUsers: 89,
    systemUptime: 99.8,
    apiCallsToday: 1247,
    errorRate: 0.2
  };

  const mockChartData = [
    { name: 'Jan', users: 120, templates: 15, rules: 8 },
    { name: 'Feb', users: 135, templates: 18, rules: 10 },
    { name: 'Mar', users: 142, templates: 20, rules: 11 },
    { name: 'Apr', users: 148, templates: 21, rules: 12 },
    { name: 'May', users: 152, templates: 22, rules: 12 },
    { name: 'Jun', users: 156, templates: 23, rules: 12 }
  ];

  const mockUserRoles = [
    { role: 'Admin', count: 5, color: '#EF4444' },
    { role: 'Editor', count: 23, color: '#F59E0B' },
    { role: 'Viewer', count: 128, color: '#10B981' }
  ];

  useEffect(() => {
    // Set mock data for demo
    setSystemStats(mockSystemStats);
    setLoading(false);
  }, []);

  const formatUptime = (uptime: number) => {
    return `${uptime}%`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <ContentManager fallback={
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600">You don't have permission to access the admin panel.</p>
            </div>
          </div>
        </AppShell>
      }>
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading admin dashboard...</p>
            </div>
          </div>
        </AppShell>
      </ContentManager>
    );
  }

  return (
    <ContentManager fallback={
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access the admin panel.</p>
          </div>
        </div>
      </AppShell>
    }>
      <AppShell>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-2">
                System administration and configuration management
              </p>
            </div>
            <div className="text-sm text-gray-600">
              Welcome, {session?.user?.name}
            </div>
          </div>

          {/* Admin Navigation Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'templates', label: 'Templates' },
                { key: 'brand-rules', label: 'Brand Rules' },
                { key: 'brand-analytics', label: 'Brand Analytics' },
                { key: 'quality-policies', label: 'Quality Policies' },
                { key: 'users', label: 'Users' },
                { key: 'system', label: 'System Config' },
                { key: 'dlq', label: 'DLQ Management' },
                { key: 'prompt-templates', label: 'Prompt Templates' },
                { key: 'quality-config', label: 'Quality Config' },
                { key: 'autopost', label: 'Autopost Controls' }
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
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* System Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card">
                  <div className="card-content">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 text-lg">👥</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900">{formatNumber(systemStats?.totalUsers || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-content">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 text-lg">📄</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Templates</p>
                        <p className="text-2xl font-bold text-gray-900">{formatNumber(systemStats?.totalTemplates || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-content">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <span className="text-yellow-600 text-lg">🛡️</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Brand Rules</p>
                        <p className="text-2xl font-bold text-gray-900">{formatNumber(systemStats?.totalBrandRules || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-content">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-purple-600 text-lg">⭐</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Quality Policies</p>
                        <p className="text-2xl font-bold text-gray-900">{formatNumber(systemStats?.totalQualityPolicies || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Health Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card">
                  <div className="card-content">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 text-lg">✅</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">System Uptime</p>
                        <p className="text-2xl font-bold text-gray-900">{formatUptime(systemStats?.systemUptime || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-content">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 text-lg">🔄</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">API Calls Today</p>
                        <p className="text-2xl font-bold text-gray-900">{formatNumber(systemStats?.apiCallsToday || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-content">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <span className="text-red-600 text-lg">⚠️</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Error Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{systemStats?.errorRate || 0}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-content">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <span className="text-indigo-600 text-lg">👤</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Active Users</p>
                        <p className="text-2xl font-bold text-gray-900">{formatNumber(systemStats?.activeUsers || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Growth Trends</h3>
                    <p className="card-description">System growth over time</p>
                  </div>
                  <div className="card-content">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
                          <Line type="monotone" dataKey="templates" stroke="#10B981" strokeWidth={2} />
                          <Line type="monotone" dataKey="rules" stroke="#F59E0B" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">User Roles Distribution</h3>
                    <p className="card-description">Users by role</p>
                  </div>
                  <div className="card-content">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={mockUserRoles}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ role, count }) => `${role} ${count}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {mockUserRoles.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Quick Actions</h3>
                  <p className="card-description">Common administrative tasks</p>
                </div>
                <div className="card-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button
                      onClick={() => setActiveTab('templates')}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📄</span>
                        <div>
                          <h4 className="font-medium text-gray-900">Manage Templates</h4>
                          <p className="text-sm text-gray-600">Create and edit AI templates</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('brand-rules')}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">🛡️</span>
                        <div>
                          <h4 className="font-medium text-gray-900">Brand Rules</h4>
                          <p className="text-sm text-gray-600">Configure brand guidelines</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('users')}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">👥</span>
                        <div>
                          <h4 className="font-medium text-gray-900">User Management</h4>
                          <p className="text-sm text-gray-600">Manage users and roles</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('quality-policies')}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">⭐</span>
                        <div>
                          <h4 className="font-medium text-gray-900">Quality Policies</h4>
                          <p className="text-sm text-gray-600">Set content quality standards</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('system')}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">⚙️</span>
                        <div>
                          <h4 className="font-medium text-gray-900">System Config</h4>
                          <p className="text-sm text-gray-600">System settings and preferences</p>
                        </div>
                      </div>
                    </button>

                    <button
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📊</span>
                        <div>
                          <h4 className="font-medium text-gray-900">System Logs</h4>
                          <p className="text-sm text-gray-600">View system logs and diagnostics</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Template Management Tab */}
          {activeTab === 'templates' && (
            <TemplateManagement />
          )}

          {/* Brand Rule Configuration Tab */}
          {activeTab === 'brand-rules' && (
            <BrandRuleConfiguration />
          )}

          {/* Brand Rule Analytics Tab */}
          {activeTab === 'brand-analytics' && (
            <BrandRuleAnalytics organizationId={session?.user?.organizationId} />
          )}

          {/* Quality Policy Management Tab */}
          {activeTab === 'quality-policies' && (
            <QualityPolicyManagement />
          )}

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <UserManagement />
          )}

          {/* System Configuration Tab */}
          {activeTab === 'system' && (
            <SystemConfiguration />
          )}

          {/* DLQ Management Tab */}
          {activeTab === 'dlq' && (
            <DLQManagement />
          )}

          {/* Prompt Template Management Tab */}
          {activeTab === 'prompt-templates' && (
            <PromptTemplateManagement />
          )}

          {/* Quality Policy Configuration Tab */}
          {activeTab === 'quality-config' && (
            <QualityPolicyConfiguration />
          )}

          {/* Autopost Controls Tab */}
          {activeTab === 'autopost' && (
            <AutopostControls />
          )}
        </div>
      </AppShell>
    </ContentManager>
  );
}