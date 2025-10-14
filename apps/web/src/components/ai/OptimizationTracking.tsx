'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function OptimizationTracking() {
  const [optimizationId, setOptimizationId] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackOptimization = async () => {
    if (!optimizationId.trim()) {
      setError('Optimization ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.trackOptimizationEffectiveness(optimizationId);
      setTrackingResult(result);
    } catch (err: any) {
      console.error('Failed to track optimization:', err);
      setError(err.message || 'Failed to track optimization');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'improved':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-red-600 bg-red-100';
      case 'neutral':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'improved':
        return '📈';
      case 'degraded':
        return '📉';
      case 'neutral':
        return '➡️';
      default:
        return '❓';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Optimization Tracking</h3>
        <p className="text-sm text-gray-600">Track the effectiveness of content optimizations over time</p>
      </div>

      {/* Optimization ID Input */}
      <div className="card">
        <div className="card-content">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Optimization ID
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={optimizationId}
                  onChange={(e) => setOptimizationId(e.target.value)}
                  className="input flex-1"
                  placeholder="Enter optimization ID to track..."
                  onKeyPress={(e) => e.key === 'Enter' && trackOptimization()}
                />
                <button
                  onClick={trackOptimization}
                  disabled={loading || !optimizationId.trim()}
                  className="btn-primary"
                >
                  {loading ? 'Tracking...' : 'Track Optimization'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tracking Results */}
      {trackingResult && (
        <div className="space-y-6">
          {/* Optimization Overview */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Optimization Overview</h4>
              <div className="flex items-center space-x-2">
                <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(trackingResult.effectiveness.status)}`}>
                  {getStatusIcon(trackingResult.effectiveness.status)} {trackingResult.effectiveness.status}
                </span>
                <span className="text-sm text-gray-600">
                  ID: {trackingResult.optimizationId}
                </span>
              </div>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {/* Improvement Summary */}
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {trackingResult.effectiveness.improvement > 0 ? '+' : ''}{trackingResult.effectiveness.improvement}%
                  </div>
                  <div className="text-sm text-gray-600">Overall Improvement</div>
                </div>

                {/* Before/After Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Before Optimization</h5>
                    <div className="space-y-2">
                      {Object.entries(trackingResult.effectiveness.beforeMetrics).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="text-gray-900 font-medium">{formatNumber(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">After Optimization</h5>
                    <div className="space-y-2">
                      {Object.entries(trackingResult.effectiveness.afterMetrics).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="text-gray-900 font-medium">{formatNumber(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {trackingResult.recommendations && trackingResult.recommendations.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">AI Recommendations</h4>
                <p className="card-description">Actionable recommendations based on optimization results</p>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  {trackingResult.recommendations.map((recommendation: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 mb-1">{recommendation.action}</h5>
                          <p className="text-sm text-gray-600">{recommendation.expectedImpact}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(recommendation.priority)}`}>
                          {recommendation.priority} priority
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Performance Insights */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Performance Insights</h4>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {trackingResult.effectiveness.status === 'improved' ? '📈' : 
                       trackingResult.effectiveness.status === 'degraded' ? '📉' : '➡️'}
                    </div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {trackingResult.effectiveness.status}
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {trackingResult.effectiveness.improvement > 0 ? '+' : ''}{trackingResult.effectiveness.improvement}%
                    </div>
                    <div className="text-sm text-gray-600">Improvement</div>
                    <div className="text-sm font-medium text-gray-900">
                      {trackingResult.effectiveness.improvement > 0 ? 'Positive' : 
                       trackingResult.effectiveness.improvement < 0 ? 'Negative' : 'Neutral'}
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {trackingResult.recommendations?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Recommendations</div>
                    <div className="text-sm font-medium text-gray-900">Available</div>
                  </div>
                </div>

                {/* Status Explanation */}
                <div className={`p-4 rounded-lg ${
                  trackingResult.effectiveness.status === 'improved' ? 'bg-green-50 border border-green-200' :
                  trackingResult.effectiveness.status === 'degraded' ? 'bg-red-50 border border-red-200' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-start space-x-2">
                    <span className="text-lg">
                      {trackingResult.effectiveness.status === 'improved' ? '✅' :
                       trackingResult.effectiveness.status === 'degraded' ? '⚠️' : 'ℹ️'}
                    </span>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">
                        {trackingResult.effectiveness.status === 'improved' ? 'Optimization Successful' :
                         trackingResult.effectiveness.status === 'degraded' ? 'Optimization Needs Review' :
                         'Optimization Neutral'}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {trackingResult.effectiveness.status === 'improved' ? 
                          'The optimization has shown positive results. Consider implementing similar strategies for future content.' :
                         trackingResult.effectiveness.status === 'degraded' ? 
                          'The optimization may have had unintended effects. Review the recommendations and consider adjustments.' :
                          'The optimization has not shown significant changes. Consider trying different optimization strategies.'}
                      </p>
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
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h4 className="font-medium text-indigo-900 mb-2">Optimization Tracking</h4>
        <div className="space-y-2 text-sm text-indigo-800">
          <div className="flex items-start space-x-2">
            <span className="text-indigo-600 text-lg">📊</span>
            <div>
              <p className="font-medium">Performance Tracking</p>
              <p>Monitor the effectiveness of content optimizations with before/after metrics comparison.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-indigo-600 text-lg">🤖</span>
            <div>
              <p className="font-medium">AI Recommendations</p>
              <p>Get intelligent recommendations based on optimization results and performance data.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-indigo-600 text-lg">📈</span>
            <div>
              <p className="font-medium">Improvement Insights</p>
              <p>Understand which optimizations work best and apply learnings to future content.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
