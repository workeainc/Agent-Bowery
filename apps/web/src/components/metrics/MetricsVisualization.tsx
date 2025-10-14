'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface MetricsVisualizationProps {
  organizationId?: string;
  timeRange?: '1h' | '24h' | '7d' | '30d';
  metricName?: string;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
}

export default function MetricsVisualization({
  organizationId,
  timeRange = '24h',
  metricName,
  aggregation = 'avg'
}: MetricsVisualizationProps) {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState(metricName || '');
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedAggregation, setSelectedAggregation] = useState(aggregation);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        organizationId,
        timeRange: selectedTimeRange,
        aggregation: selectedAggregation,
        ...(selectedMetric && { metricName: selectedMetric })
      };
      
      const result = await apiClient.getCustomMetrics(params);
      setMetrics(result.metrics);
    } catch (err: any) {
      console.error('Failed to load metrics:', err);
      setError(err.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [selectedMetric, selectedTimeRange, selectedAggregation, organizationId]);

  const formatValue = (value: number, unit?: string): string => {
    if (unit === 'bytes') {
      if (value === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(value) / Math.log(k));
      return parseFloat((value / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    if (unit === 'percentage') {
      return value.toFixed(1) + '%';
    }
    
    if (unit === 'duration') {
      if (value < 1000) return value.toFixed(0) + 'ms';
      if (value < 60000) return (value / 1000).toFixed(1) + 's';
      return (value / 60000).toFixed(1) + 'm';
    }
    
    return value.toFixed(2);
  };

  const getMetricColor = (value: number, thresholds?: { warning: number; critical: number }): string => {
    if (thresholds) {
      if (value >= thresholds.critical) return 'text-red-600';
      if (value >= thresholds.warning) return 'text-yellow-600';
    }
    return 'text-green-600';
  };

  const getMetricIcon = (metricName: string): string => {
    const name = metricName.toLowerCase();
    if (name.includes('cpu') || name.includes('processor')) return '🖥️';
    if (name.includes('memory') || name.includes('ram')) return '🧠';
    if (name.includes('disk') || name.includes('storage')) return '💾';
    if (name.includes('network') || name.includes('bandwidth')) return '🌐';
    if (name.includes('request') || name.includes('api')) return '📡';
    if (name.includes('error') || name.includes('failure')) return '❌';
    if (name.includes('success') || name.includes('completed')) return '✅';
    if (name.includes('user') || name.includes('session')) return '👤';
    if (name.includes('content') || name.includes('post')) return '📝';
    return '📊';
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
            <h3 className="text-sm font-medium text-red-800">Error Loading Metrics</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadMetrics}
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

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              className="input"
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            
            <select
              className="input"
              value={selectedAggregation}
              onChange={(e) => setSelectedAggregation(e.target.value as any)}
            >
              <option value="avg">Average</option>
              <option value="sum">Sum</option>
              <option value="min">Minimum</option>
              <option value="max">Maximum</option>
              <option value="count">Count</option>
            </select>
            
            <input
              type="text"
              placeholder="Filter by metric name..."
              className="input"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={loadMetrics}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.length === 0 ? (
          <div className="col-span-full bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-gray-400 text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Metrics Found</h3>
            <p className="text-gray-500">
              {selectedMetric ? 'No metrics match your filter criteria' : 'No custom metrics have been recorded yet'}
            </p>
          </div>
        ) : (
          metrics.map((metric, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getMetricIcon(metric.name)}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{metric.name}</h3>
                    {metric.description && (
                      <p className="text-sm text-gray-600">{metric.description}</p>
                    )}
                  </div>
                </div>
                
                <div className={`text-2xl font-bold ${getMetricColor(metric.value)}`}>
                  {formatValue(metric.value)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Timestamp:</span>
                  <span>{new Date(metric.timestamp).toLocaleString()}</span>
                </div>
                
                {Object.keys(metric.labels).length > 0 && (
                  <div className="space-y-1">
                    <span className="text-sm text-gray-600">Labels:</span>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(metric.labels).map(([key, value]) => (
                        <span
                          key={key}
                          className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs"
                        >
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {metrics.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Summary Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Metrics</p>
                  <p className="text-2xl font-semibold text-gray-900">{metrics.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Average Value</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatValue(metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Time Range</p>
                  <p className="text-2xl font-semibold text-gray-900">{selectedTimeRange}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Aggregation</p>
                  <p className="text-2xl font-semibold text-gray-900">{selectedAggregation}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
