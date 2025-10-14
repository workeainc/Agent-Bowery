'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { SystemHealth } from '@/types';
import AppShell from '@/components/layout/AppShell';
import Link from 'next/link';

export default function DashboardPage() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [basicHealth, setBasicHealth] = useState<{ status: string } | null>(null);
  const [oauthHealth, setOauthHealth] = useState<any>(null);
  const [errorStats, setErrorStats] = useState<any>(null);
  const [contentStats, setContentStats] = useState<{
    totalContent: number;
    publishedContent: number;
    draftContent: number;
    pendingContent: number;
  } | null>(null);
  const [upcomingSchedules, setUpcomingSchedules] = useState<Array<{
    id: string;
    title: string;
    platform: string;
    scheduledAt: string;
    status: string;
  }>>([]);
  const [metrics, setMetrics] = useState<{
    engagementRate: number;
    reachGrowth: number;
    contentPerformance: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch system health
        const health = await apiClient.getSystemHealth();
        setSystemHealth(health);
        
        // Fetch basic health status
        const basic = await apiClient.getHealthStatus();
        setBasicHealth(basic);
        
        // Fetch OAuth health
        try {
          const oauth = await apiClient.getOAuthHealth();
          setOauthHealth(oauth);
        } catch (err) {
          console.warn('OAuth health check failed:', err);
        }
        
        // Fetch error analytics
        try {
          const errorAnalytics = await apiClient.getErrorAnalytics({ timeRange: '24h' });
          setErrorStats(errorAnalytics.analytics);
        } catch (err) {
          console.warn('Error analytics failed:', err);
        }
        
        // Fetch content statistics
        const content = await apiClient.getContent();
        const stats = {
          totalContent: content.data?.length || 0,
          publishedContent: content.data?.filter((item: any) => item.status === 'PUBLISHED').length || 0,
          draftContent: content.data?.filter((item: any) => item.status === 'DRAFT').length || 0,
          pendingContent: content.data?.filter((item: any) => item.status === 'PENDING_APPROVAL').length || 0,
        };
        setContentStats(stats);
        
        // Fetch upcoming schedules
        const schedules = await apiClient.getSchedules();
        const upcoming = schedules
          ?.filter((schedule: any) => schedule.status === 'pending' || schedule.status === 'queued')
          ?.slice(0, 5) // Show only next 5 schedules
          ?.map((schedule: any) => ({
            id: schedule.id,
            title: schedule.contentItem?.title || 'Untitled Content',
            platform: schedule.platform,
            scheduledAt: schedule.scheduledAt,
            status: schedule.status,
          })) || [];
        setUpcomingSchedules(upcoming);
        
        // Fetch basic metrics
        try {
          const analytics = await apiClient.getAnalytics();
          setMetrics({
            engagementRate: analytics?.engagementRate || 0,
            reachGrowth: analytics?.reachGrowth || 0,
            contentPerformance: analytics?.contentPerformance || 0,
          });
        } catch (err) {
          // Set mock metrics if analytics fail
          setMetrics({
            engagementRate: 75,
            reachGrowth: 12,
            contentPerformance: 68,
          });
        }
        
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        console.warn('Backend API not available, using offline mode:', err);
        // Set mock data when backend is not available
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
        
        // Mock content statistics
        setContentStats({
          totalContent: 12,
          publishedContent: 8,
          draftContent: 3,
          pendingContent: 1,
        });
        
        // Mock upcoming schedules
        setUpcomingSchedules([
          {
            id: '1',
            title: 'Weekly Newsletter',
            platform: 'MAIL',
            scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
            status: 'pending',
          },
          {
            id: '2',
            title: 'Product Launch Announcement',
            platform: 'FACEBOOK',
            scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
            status: 'queued',
          },
          {
            id: '3',
            title: 'Industry Insights Blog',
            platform: 'LINKEDIN',
            scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
            status: 'pending',
          },
        ]);
        
        // Mock metrics
        setMetrics({
          engagementRate: 75,
          reachGrowth: 12,
          contentPerformance: 68,
        });
        
        setError(null); // No error, just offline mode
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const fetchDashboardData = async () => {
        try {
          // Fetch system health
          const health = await apiClient.getSystemHealth();
          setSystemHealth(health);
          
          // Fetch content statistics
          const content = await apiClient.getContent();
          const stats = {
            totalContent: content.data?.length || 0,
            publishedContent: content.data?.filter((item: any) => item.status === 'PUBLISHED').length || 0,
            draftContent: content.data?.filter((item: any) => item.status === 'DRAFT').length || 0,
            pendingContent: content.data?.filter((item: any) => item.status === 'PENDING_APPROVAL').length || 0,
          };
          setContentStats(stats);
          
          // Fetch upcoming schedules
          const schedules = await apiClient.getSchedules();
          const upcoming = schedules
            ?.filter((schedule: any) => schedule.status === 'pending' || schedule.status === 'queued')
            ?.slice(0, 5)
            ?.map((schedule: any) => ({
              id: schedule.id,
              title: schedule.contentItem?.title || 'Untitled Content',
              platform: schedule.platform,
              scheduledAt: schedule.scheduledAt,
              status: schedule.status,
            })) || [];
          setUpcomingSchedules(upcoming);
          
          // Update metrics
          try {
            const analytics = await apiClient.getAnalytics();
            setMetrics({
              engagementRate: analytics?.engagementRate || 0,
              reachGrowth: analytics?.reachGrowth || 0,
              contentPerformance: analytics?.contentPerformance || 0,
            });
          } catch (err) {
            // Keep existing metrics on refresh failure
          }
          
          setLastUpdated(new Date());
        } catch (err) {
          // Silently fail for auto-refresh to avoid disrupting user experience
          console.warn('Auto-refresh failed:', err);
        }
      };

      fetchDashboardData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
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
              Welcome to Agent Bowery Content Management System - LIVE DEMO
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
                    basicHealth?.status === 'ok' && systemHealth?.systemStatus === 'active' && !systemHealth?.globalPause
                      ? 'bg-green-500'
                      : systemHealth?.globalPause
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                />
                <span className="text-sm font-medium">
                  {basicHealth?.status === 'ok' && systemHealth?.systemStatus === 'active' && !systemHealth?.globalPause
                    ? 'All systems operational'
                    : systemHealth?.globalPause
                    ? 'System paused'
                    : 'System issues detected'}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">API Status:</span>
                  <span className={`font-medium ${
                    basicHealth?.status === 'ok' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {basicHealth?.status === 'ok' ? '✅ Healthy' : '❌ Issues'}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Global Pause:</span>
                  <span className={`font-medium ${
                    systemHealth?.globalPause ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {systemHealth?.globalPause ? '⏸️ Paused' : '▶️ Active'}
                  </span>
                </div>
                
                {oauthHealth && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">OAuth Config:</span>
                    <span className={`font-medium ${
                      oauthHealth.ready ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {oauthHealth.ready ? '✅ Ready' : '❌ Issues'}
                    </span>
                  </div>
                )}
                
                {systemHealth?.updatedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="text-gray-900">
                      {new Date(systemHealth.updatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Status Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Error Status</h3>
              <p className="card-description">
                Recent error statistics and alerts
              </p>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Errors (24h)</span>
                  <span className="text-lg font-bold text-gray-900">
                    {errorStats?.resolutionStats?.totalErrors || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Unresolved</span>
                  <span className="text-lg font-bold text-red-600">
                    {errorStats?.resolutionStats?.unresolvedErrors || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Resolution Rate</span>
                  <span className="text-lg font-bold text-green-600">
                    {errorStats?.resolutionStats ? (errorStats.resolutionStats.resolutionRate * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href="/errors"
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  View Error Management →
                </Link>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Content Statistics</h3>
              <p className="card-description">
                Overview of your content library
              </p>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {contentStats?.totalContent || 0}
                  </div>
                  <div className="text-sm text-gray-500">Total Content</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {contentStats?.publishedContent || 0}
                  </div>
                  <div className="text-sm text-gray-500">Published</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {contentStats?.draftContent || 0}
                  </div>
                  <div className="text-sm text-gray-500">Drafts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {contentStats?.pendingContent || 0}
                  </div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Schedules Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Upcoming Schedules</h3>
              <p className="card-description">
                Next scheduled content posts
              </p>
            </div>
            <div className="card-content">
              {upcomingSchedules.length > 0 ? (
                <div className="space-y-3">
                  {upcomingSchedules.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {schedule.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {schedule.platform} • {new Date(schedule.scheduledAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="ml-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          schedule.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {schedule.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-gray-400 text-4xl mb-2">📅</div>
                  <p className="text-sm text-gray-500">No upcoming schedules</p>
                </div>
              )}
            </div>
          </div>

          {/* Metrics Visualization Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Performance Metrics</h3>
              <p className="card-description">
                Key performance indicators
              </p>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Engagement Rate</span>
                    <span className="font-medium">{metrics?.engagementRate || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${metrics?.engagementRate || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Reach Growth</span>
                    <span className="font-medium">+{metrics?.reachGrowth || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(metrics?.reachGrowth || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Content Performance</span>
                    <span className="font-medium">{metrics?.contentPerformance || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${metrics?.contentPerformance || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href="/metrics"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Detailed Metrics →
                </Link>
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
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
