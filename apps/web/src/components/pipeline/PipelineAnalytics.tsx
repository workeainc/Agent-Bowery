'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export default function PipelineAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getPipelineAnalytics();
      setAnalyticsData(result);
    } catch (err: any) {
      console.error('Failed to load pipeline analytics:', err);
      setError(err.message || 'Failed to load pipeline analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case 'optimization':
        return 'text-blue-600 bg-blue-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'success':
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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Pipeline Analytics</h3>
          <p className="text-sm text-gray-600">System-wide pipeline performance and insights</p>
        </div>
        <button
          onClick={loadAnalytics}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Loading...' : 'Refresh Analytics'}
        </button>
      </div>

      {/* Analytics Results */}
      {analyticsData && (
        <div className="space-y-6">
          {/* Overview Metrics */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">System Overview</h4>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.overview.totalPipelines)}</div>
                  <div className="text-sm text-gray-600">Total Pipelines</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatNumber(analyticsData.overview.activePipelines)}</div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatNumber(analyticsData.overview.completedPipelines)}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{formatNumber(analyticsData.overview.failedPipelines)}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{formatDuration(analyticsData.overview.averageDuration)}</div>
                  <div className="text-sm text-gray-600">Avg. Duration</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trends */}
          {analyticsData.trends && analyticsData.trends.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Pipeline Trends</h4>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  {analyticsData.trends.slice(-7).map((trend: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        {formatDate(trend.date)}
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{formatNumber(trend.started)}</div>
                          <div className="text-xs text-gray-500">Started</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">{formatNumber(trend.completed)}</div>
                          <div className="text-xs text-gray-500">Completed</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-red-600">{formatNumber(trend.failed)}</div>
                          <div className="text-xs text-gray-500">Failed</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{formatDuration(trend.averageDuration)}</div>
                          <div className="text-xs text-gray-500">Avg. Duration</div>
                        </div>
                      </div>
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
                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-green-600 text-lg">🏆</span>
                      <h5 className="font-medium text-green-900">Best Performing Pipeline</h5>
                    </div>
                    <p className="text-sm text-green-800">{analyticsData.performance.bestPerformingPipeline}</p>
                  </div>

                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-red-600 text-lg">⚠️</span>
                      <h5 className="font-medium text-red-900">Worst Performing Pipeline</h5>
                    </div>
                    <p className="text-sm text-red-800">{analyticsData.performance.worstPerformingPipeline}</p>
                  </div>
                </div>

                {/* Success Rate */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">Average Success Rate</h5>
                    <div className={`text-lg font-bold ${getSuccessRateColor(analyticsData.performance.averageSuccessRate)}`}>
                      {analyticsData.performance.averageSuccessRate}%
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        analyticsData.performance.averageSuccessRate >= 90 ? 'bg-green-600' :
                        analyticsData.performance.averageSuccessRate >= 70 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${analyticsData.performance.averageSuccessRate}%` }}
                    />
                  </div>
                </div>

                {/* Common Failure Points */}
                {analyticsData.performance.commonFailurePoints && analyticsData.performance.commonFailurePoints.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">Common Failure Points</h5>
                    <div className="space-y-2">
                      {analyticsData.performance.commonFailurePoints.map((failure: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                          <div>
                            <div className="font-medium text-red-900">{failure.step}</div>
                            <div className="text-sm text-red-700">
                              {failure.failureCount} failures ({failure.failureRate}% failure rate)
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-red-900">{failure.failureCount}</div>
                            <div className="text-xs text-red-600">Failures</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Insights */}
          {analyticsData.insights && analyticsData.insights.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">AI Insights & Recommendations</h4>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  {analyticsData.insights.map((insight: any, index: number) => (
                    <div key={index} className={`p-4 rounded-lg border ${
                      insight.type === 'optimization' ? 'bg-blue-50 border-blue-200' :
                      insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {insight.type === 'optimization' ? '💡' :
                             insight.type === 'warning' ? '⚠️' : '✅'}
                          </span>
                          <div className="font-medium text-gray-900">{insight.message}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(insight.impact)}`}>
                          {insight.impact} impact
                        </span>
                      </div>
                      {insight.recommendation && (
                        <div className="text-sm text-gray-700 mt-2">
                          <strong>Recommendation:</strong> {insight.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-medium text-purple-900 mb-2">Pipeline Analytics</h4>
        <div className="space-y-2 text-sm text-purple-800">
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">📊</span>
            <div>
              <p className="font-medium">System Overview</p>
              <p>Monitor overall pipeline system performance with key metrics and trends.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">📈</span>
            <div>
              <p className="font-medium">Trend Analysis</p>
              <p>Track pipeline trends over time to identify patterns and performance changes.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">🔍</span>
            <div>
              <p className="font-medium">Failure Analysis</p>
              <p>Identify common failure points and bottlenecks across all pipelines.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">🤖</span>
            <div>
              <p className="font-medium">AI Insights</p>
              <p>Get intelligent recommendations for optimizing pipeline performance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
