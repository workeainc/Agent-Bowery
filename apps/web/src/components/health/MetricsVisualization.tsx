'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export default function MetricsVisualization() {
  const [metrics, setMetrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedMetrics, setParsedMetrics] = useState<any[]>([]);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const metricsData = await apiClient.getMetrics();
      setMetrics(metricsData);
      parseMetrics(metricsData);
    } catch (err: any) {
      console.error('Failed to load metrics:', err);
      setError(err.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const parseMetrics = (metricsData: string) => {
    try {
      const lines = metricsData.split('\n');
      const parsed: any[] = [];

      lines.forEach((line, index) => {
        if (line.trim() && !line.startsWith('#')) {
          const parts = line.split(' ');
          if (parts.length >= 2) {
            const metricName = parts[0];
            const value = parts[1];
            
            // Extract labels if present
            const labelMatch = metricName.match(/\{([^}]+)\}/);
            const labels = labelMatch ? labelMatch[1] : '';
            
            parsed.push({
              id: index,
              name: metricName.split('{')[0], // Remove labels from name
              labels: labels,
              value: parseFloat(value) || value,
              fullName: metricName
            });
          }
        }
      });

      setParsedMetrics(parsed);
    } catch (err) {
      console.error('Failed to parse metrics:', err);
    }
  };

  const getMetricType = (name: string) => {
    if (name.includes('counter')) return 'Counter';
    if (name.includes('gauge')) return 'Gauge';
    if (name.includes('histogram')) return 'Histogram';
    if (name.includes('summary')) return 'Summary';
    return 'Unknown';
  };

  const getMetricIcon = (name: string) => {
    if (name.includes('http')) return '🌐';
    if (name.includes('database')) return '🗄️';
    if (name.includes('queue')) return '📋';
    if (name.includes('oauth')) return '🔐';
    if (name.includes('content')) return '📄';
    if (name.includes('platform')) return '📱';
    return '📊';
  };

  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return (value / 1000000).toFixed(2) + 'M';
      } else if (value >= 1000) {
        return (value / 1000).toFixed(2) + 'K';
      }
      return value.toFixed(2);
    }
    return value;
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">System Metrics</h2>
            <p className="text-sm text-gray-600">Prometheus metrics and system performance data</p>
          </div>
          <button
            onClick={loadMetrics}
            disabled={loading}
            className="btn-secondary btn-sm"
          >
            {loading ? 'Loading...' : 'Refresh Metrics'}
          </button>
        </div>

        {/* Metrics Summary */}
        {parsedMetrics.length > 0 && (
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="card-title">Metrics Summary</h3>
              <p className="card-description">Overview of available metrics</p>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{parsedMetrics.length}</div>
                  <div className="text-sm text-gray-600">Total Metrics</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {parsedMetrics.filter(m => m.name.includes('counter')).length}
                  </div>
                  <div className="text-sm text-gray-600">Counters</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {parsedMetrics.filter(m => m.name.includes('gauge')).length}
                  </div>
                  <div className="text-sm text-gray-600">Gauges</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {parsedMetrics.filter(m => m.name.includes('histogram')).length}
                  </div>
                  <div className="text-sm text-gray-600">Histograms</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Parsed Metrics */}
        {parsedMetrics.length > 0 && (
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="card-title">Metrics Details</h3>
              <p className="card-description">Detailed view of all metrics</p>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                {parsedMetrics.map((metric) => (
                  <div key={metric.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getMetricIcon(metric.name)}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{metric.name}</h4>
                          <p className="text-xs text-gray-500">{getMetricType(metric.name)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {formatValue(metric.value)}
                        </div>
                      </div>
                    </div>
                    
                    {metric.labels && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-600 mb-1">Labels:</div>
                        <div className="text-xs font-mono text-gray-500 bg-gray-50 p-2 rounded">
                          {metric.labels}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Raw Metrics */}
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">Raw Metrics Data</h3>
            <p className="card-description">Raw Prometheus metrics output</p>
          </div>
          <div className="card-content">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading metrics...</p>
                </div>
              </div>
            ) : metrics ? (
              <pre className="text-xs text-gray-600 bg-gray-50 p-4 rounded overflow-x-auto max-h-96 overflow-y-auto">
                {metrics}
              </pre>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-600">No metrics data available</p>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Metrics Help</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-lg">📊</span>
                <div>
                  <p className="font-medium text-gray-900">Prometheus Metrics</p>
                  <p>These metrics are collected by Prometheus for monitoring system performance and health.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600 text-lg">📈</span>
                <div>
                  <p className="font-medium text-gray-900">Metric Types</p>
                  <p>Counters track cumulative values, gauges show current values, histograms show distributions.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600 text-lg">🔄</span>
                <div>
                  <p className="font-medium text-gray-900">Real-time Data</p>
                  <p>Metrics are updated in real-time and can be refreshed manually to see current values.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
