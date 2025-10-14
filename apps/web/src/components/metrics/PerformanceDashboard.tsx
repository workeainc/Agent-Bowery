'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface PerformanceDashboardProps {
  organizationId?: string;
}

export default function PerformanceDashboard({ organizationId }: PerformanceDashboardProps) {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [includeSystem, setIncludeSystem] = useState(true);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiClient.getPerformanceMetrics({
        organizationId,
        timeRange,
        includeSystem
      });
      
      setPerformanceData(result.performance);
    } catch (err: any) {
      console.error('Failed to load performance data:', err);
      setError(err.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerformanceData();
  }, [timeRange, includeSystem, organizationId]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return ms.toFixed(0) + 'ms';
    if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
    return (ms / 60000).toFixed(1) + 'm';
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }): string => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusBgColor = (value: number, thresholds: { warning: number; critical: number }): string => {
    if (value >= thresholds.critical) return 'bg-red-500';
    if (value >= thresholds.warning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Performance Data</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadPerformanceData}
                className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!performanceData) {
    return null;
  }

  const latestCpu = performanceData.systemMetrics.cpu[performanceData.systemMetrics.cpu.length - 1];
  const latestMemory = performanceData.systemMetrics.memory[performanceData.systemMetrics.memory.length - 1];
  const latestDisk = performanceData.systemMetrics.disk[performanceData.systemMetrics.disk.length - 1];
  const latestRequests = performanceData.applicationMetrics.requests[performanceData.applicationMetrics.requests.length - 1];
  const latestDatabase = performanceData.applicationMetrics.database[performanceData.applicationMetrics.database.length - 1];
  const latestQueue = performanceData.applicationMetrics.queue[performanceData.applicationMetrics.queue.length - 1];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              className="input"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeSystem}
                onChange={(e) => setIncludeSystem(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Include System Metrics</span>
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={loadPerformanceData}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      {includeSystem && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">System Performance</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CPU Usage */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🖥️</span>
                  <div>
                    <h4 className="font-medium text-gray-900">CPU Usage</h4>
                    <p className="text-sm text-gray-600">{latestCpu?.cores || 0} cores</p>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestCpu?.usage || 0, { warning: 70, critical: 90 })}`}>
                  {(latestCpu?.usage || 0).toFixed(1)}%
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getStatusBgColor(latestCpu?.usage || 0, { warning: 70, critical: 90 })}`}
                  style={{ width: `${latestCpu?.usage || 0}%` }}
                />
              </div>
            </div>

            {/* Memory Usage */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🧠</span>
                  <div>
                    <h4 className="font-medium text-gray-900">Memory Usage</h4>
                    <p className="text-sm text-gray-600">{formatBytes(latestMemory?.total || 0)} total</p>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestMemory?.percentage || 0, { warning: 80, critical: 95 })}`}>
                  {(latestMemory?.percentage || 0).toFixed(1)}%
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getStatusBgColor(latestMemory?.percentage || 0, { warning: 80, critical: 95 })}`}
                  style={{ width: `${latestMemory?.percentage || 0}%` }}
                />
              </div>
            </div>

            {/* Disk Usage */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💾</span>
                  <div>
                    <h4 className="font-medium text-gray-900">Disk Usage</h4>
                    <p className="text-sm text-gray-600">{formatBytes(latestDisk?.total || 0)} total</p>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestDisk?.percentage || 0, { warning: 85, critical: 95 })}`}>
                  {(latestDisk?.percentage || 0).toFixed(1)}%
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getStatusBgColor(latestDisk?.percentage || 0, { warning: 85, critical: 95 })}`}
                  style={{ width: `${latestDisk?.percentage || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Metrics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Application Performance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Request Metrics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📡</span>
                <div>
                  <h4 className="font-medium text-gray-900">API Requests</h4>
                  <p className="text-sm text-gray-600">Last hour</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{latestRequests?.count || 0}</div>
                <div className="text-sm text-gray-600">{formatDuration(latestRequests?.avgResponseTime || 0)} avg</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Error Rate:</span>
                <span className={getStatusColor((latestRequests?.errorRate || 0) * 100, { warning: 5, critical: 10 })}>
                  {((latestRequests?.errorRate || 0) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Database Metrics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🗄️</span>
                <div>
                  <h4 className="font-medium text-gray-900">Database</h4>
                  <p className="text-sm text-gray-600">Performance</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{latestDatabase?.connections || 0}</div>
                <div className="text-sm text-gray-600">connections</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Query Time:</span>
                <span>{formatDuration(latestDatabase?.queryTime || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Slow Queries:</span>
                <span className={getStatusColor(latestDatabase?.slowQueries || 0, { warning: 10, critical: 50 })}>
                  {latestDatabase?.slowQueries || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Queue Metrics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📋</span>
                <div>
                  <h4 className="font-medium text-gray-900">Job Queue</h4>
                  <p className="text-sm text-gray-600">Status</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{latestQueue?.pending || 0}</div>
                <div className="text-sm text-gray-600">pending</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Processed:</span>
                <span className="text-green-600">{latestQueue?.processed || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Failed:</span>
                <span className="text-red-600">{latestQueue?.failed || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Metrics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Business Metrics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Content Generation */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📝</span>
                <div>
                  <h4 className="font-medium text-gray-900">Content Generation</h4>
                  <p className="text-sm text-gray-600">Last period</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {performanceData.businessMetrics.contentGeneration.reduce((sum: number, item: any) => sum + item.generated, 0)}
                </div>
                <div className="text-sm text-gray-600">generated</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Published:</span>
                <span className="text-green-600">
                  {performanceData.businessMetrics.contentGeneration.reduce((sum: number, item: any) => sum + item.published, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Failed:</span>
                <span className="text-red-600">
                  {performanceData.businessMetrics.contentGeneration.reduce((sum: number, item: any) => sum + item.failed, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* User Activity */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">👤</span>
                <div>
                  <h4 className="font-medium text-gray-900">User Activity</h4>
                  <p className="text-sm text-gray-600">Current</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {performanceData.businessMetrics.userActivity[performanceData.businessMetrics.userActivity.length - 1]?.activeUsers || 0}
                </div>
                <div className="text-sm text-gray-600">active users</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">New Users:</span>
                <span className="text-blue-600">
                  {performanceData.businessMetrics.userActivity[performanceData.businessMetrics.userActivity.length - 1]?.newUsers || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sessions:</span>
                <span>
                  {performanceData.businessMetrics.userActivity[performanceData.businessMetrics.userActivity.length - 1]?.sessions || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Platform Engagement */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🌐</span>
                <div>
                  <h4 className="font-medium text-gray-900">Platform Engagement</h4>
                  <p className="text-sm text-gray-600">Total reach</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {performanceData.businessMetrics.platformEngagement.reduce((sum: number, item: any) => sum + item.reach, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">total reach</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Posts:</span>
                <span>
                  {performanceData.businessMetrics.platformEngagement.reduce((sum: number, item: any) => sum + item.posts, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Engagement:</span>
                <span className="text-green-600">
                  {performanceData.businessMetrics.platformEngagement.reduce((sum: number, item: any) => sum + item.engagement, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
