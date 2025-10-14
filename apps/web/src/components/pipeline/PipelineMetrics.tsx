'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface PipelineMetricsProps {
  pipelineId?: string;
  onMetricsUpdate?: (metrics: any) => void;
}

export default function PipelineMetrics({ pipelineId, onMetricsUpdate }: PipelineMetricsProps) {
  const [metricsData, setMetricsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPipelineId, setSelectedPipelineId] = useState(pipelineId || '');

  const loadMetrics = async () => {
    if (!selectedPipelineId.trim()) {
      setError('Pipeline ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getPipelineMetrics(selectedPipelineId);
      setMetricsData(result);

      if (onMetricsUpdate) {
        onMetricsUpdate(result);
      }
    } catch (err: any) {
      console.error('Failed to load pipeline metrics:', err);
      setError(err.message || 'Failed to load pipeline metrics');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    } else if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Pipeline Metrics</h3>
        <p className="text-sm text-gray-600">Analyze pipeline performance and bottlenecks</p>
      </div>

      {/* Pipeline ID Input */}
      <div className="card">
        <div className="card-content">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pipeline ID
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={selectedPipelineId}
                  onChange={(e) => setSelectedPipelineId(e.target.value)}
                  className="input flex-1"
                  placeholder="Enter pipeline ID to analyze metrics..."
                />
                <button
                  onClick={loadMetrics}
                  disabled={loading || !selectedPipelineId.trim()}
                  className="btn-primary"
                >
                  {loading ? 'Loading...' : 'Load Metrics'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Results */}
      {metricsData && (
        <div className="space-y-6">
          {/* Overview Metrics */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Pipeline Overview</h4>
              <span className="text-sm text-gray-600">ID: {metricsData.pipelineId}</span>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{formatDuration(metricsData.metrics.totalDuration)}</div>
                  <div className="text-sm text-gray-600">Total Duration</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{formatDuration(metricsData.metrics.averageStepDuration)}</div>
                  <div className="text-sm text-gray-600">Avg. Step Duration</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className={`text-2xl font-bold ${getSuccessRateColor(metricsData.metrics.successRate)}`}>
                    {metricsData.metrics.successRate}%
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{metricsData.metrics.failureRate}%</div>
                  <div className="text-sm text-gray-600">Failure Rate</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatNumber(metricsData.metrics.throughput)}</div>
                  <div className="text-sm text-gray-600">Throughput</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step Metrics */}
          {metricsData.stepMetrics && metricsData.stepMetrics.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Step Performance</h4>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  {metricsData.stepMetrics.map((step: any, index: number) => (
                    <div key={step.stepId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-medium text-gray-900">{step.stepName}</h5>
                          <p className="text-sm text-gray-600">Step ID: {step.stepId}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{formatDuration(step.averageDuration)}</div>
                            <div className="text-xs text-gray-500">Avg. Duration</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${getSuccessRateColor(step.successRate)}`}>
                              {step.successRate}%
                            </div>
                            <div className="text-xs text-gray-500">Success Rate</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{step.totalExecutions}</div>
                            <div className="text-xs text-gray-500">Executions</div>
                          </div>
                        </div>
                      </div>

                      {step.failureCount > 0 && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          Failures: {step.failureCount} ({Math.round((step.failureCount / step.totalExecutions) * 100)}% failure rate)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Performance Analysis */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Performance Analysis</h4>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {/* Throughput Metrics */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Throughput Metrics</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">{formatNumber(metricsData.performance.peakThroughput)}</div>
                      <div className="text-sm text-gray-600">Peak Throughput</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">{formatNumber(metricsData.performance.averageThroughput)}</div>
                      <div className="text-sm text-gray-600">Average Throughput</div>
                    </div>
                  </div>
                </div>

                {/* Bottlenecks */}
                {metricsData.performance.bottlenecks && metricsData.performance.bottlenecks.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">Bottlenecks</h5>
                    <div className="space-y-2">
                      {metricsData.performance.bottlenecks.map((bottleneck: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">{bottleneck.stepName}</div>
                            <div className="text-sm text-gray-600">Step ID: {bottleneck.stepId}</div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">{formatDuration(bottleneck.delay)}</div>
                              <div className="text-xs text-gray-500">Delay</div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(bottleneck.impact)}`}>
                              {bottleneck.impact} impact
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance Insights */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Performance Insights</h5>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div>
                      <strong>Overall Performance:</strong> {metricsData.metrics.successRate >= 90 ? 'Excellent' : 
                       metricsData.metrics.successRate >= 70 ? 'Good' : 'Needs Improvement'}
                    </div>
                    <div>
                      <strong>Average Step Duration:</strong> {formatDuration(metricsData.metrics.averageStepDuration)}
                    </div>
                    {metricsData.performance.bottlenecks && metricsData.performance.bottlenecks.length > 0 && (
                      <div>
                        <strong>Bottlenecks:</strong> {metricsData.performance.bottlenecks.length} step(s) identified with performance delays
                      </div>
                    )}
                    <div>
                      <strong>Recommendation:</strong> {metricsData.metrics.successRate >= 90 ? 
                        'Pipeline is performing well. Consider optimizing bottlenecks for even better performance.' :
                        'Focus on improving step success rates and reducing bottlenecks for better overall performance.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-600 text-lg">❌</span>
            <span className="text-sm text-red-800">Error: {error}</span>
          </div>
        </div>
      )}

      {/* Help Information */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">Pipeline Metrics</h4>
        <div className="space-y-2 text-sm text-green-800">
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">📊</span>
            <div>
              <p className="font-medium">Performance Analysis</p>
              <p>Analyze pipeline performance metrics including duration, success rates, and throughput.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">🔍</span>
            <div>
              <p className="font-medium">Step-level Metrics</p>
              <p>Get detailed performance metrics for each pipeline step to identify bottlenecks.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">⚡</span>
            <div>
              <p className="font-medium">Bottleneck Detection</p>
              <p>Identify performance bottlenecks and delays in pipeline execution.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">💡</span>
            <div>
              <p className="font-medium">Optimization Insights</p>
              <p>Get intelligent recommendations for improving pipeline performance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
