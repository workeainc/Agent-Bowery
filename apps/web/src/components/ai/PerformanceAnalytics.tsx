'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface PerformanceAnalyticsProps {
  contentId?: string;
  onAnalyticsComplete?: (analytics: any) => void;
}

export default function PerformanceAnalytics({ contentId, onAnalyticsComplete }: PerformanceAnalyticsProps) {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'performance' | 'compare'>('performance');
  const [compareContentIds, setCompareContentIds] = useState<string[]>([]);
  const [newCompareId, setNewCompareId] = useState('');

  const loadPerformance = async () => {
    if (!contentId) {
      setError('Content ID is required for performance analysis');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getContentPerformance(contentId);
      setPerformanceData(result);

      if (onAnalyticsComplete) {
        onAnalyticsComplete(result);
      }
    } catch (err: any) {
      console.error('Failed to load performance data:', err);
      setError(err.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const comparePerformance = async () => {
    if (compareContentIds.length < 2) {
      setError('Please add at least 2 content IDs to compare');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.compareContentPerformance(compareContentIds);
      setComparisonData(result);

      if (onAnalyticsComplete) {
        onAnalyticsComplete(result);
      }
    } catch (err: any) {
      console.error('Failed to compare performance:', err);
      setError(err.message || 'Failed to compare performance');
    } finally {
      setLoading(false);
    }
  };

  const addCompareId = () => {
    if (newCompareId.trim() && !compareContentIds.includes(newCompareId.trim())) {
      setCompareContentIds([...compareContentIds, newCompareId.trim()]);
      setNewCompareId('');
    }
  };

  const removeCompareId = (idToRemove: string) => {
    setCompareContentIds(compareContentIds.filter(id => id !== idToRemove));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getPerformanceColor = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Performance Analytics</h3>
        <p className="text-sm text-gray-600">Analyze content performance and compare metrics</p>
      </div>

      {/* Content ID Input */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content ID
              </label>
              <input
                type="text"
                value={contentId || ''}
                className="input w-full"
                placeholder="Enter content ID for performance analysis..."
                disabled
              />
            </div>
            <div className="text-sm text-gray-500">
              {contentId ? 'Content selected' : 'No content selected'}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'performance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Performance Metrics
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'compare'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📈 Performance Comparison
          </button>
        </nav>
      </div>

      {/* Performance Metrics Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Content Performance Metrics</h4>
              <p className="text-sm text-gray-600">View detailed performance data and trends</p>
            </div>
            <button
              onClick={loadPerformance}
              disabled={loading || !contentId}
              className="btn-primary"
            >
              {loading ? 'Loading...' : 'Load Performance'}
            </button>
          </div>

          {/* Performance Results */}
          {performanceData && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Key Metrics</h4>
                </div>
                <div className="card-content">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{formatNumber(performanceData.metrics.views)}</div>
                      <div className="text-sm text-gray-600">Views</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{formatNumber(performanceData.metrics.engagement)}</div>
                      <div className="text-sm text-gray-600">Engagement</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{formatNumber(performanceData.metrics.reach)}</div>
                      <div className="text-sm text-gray-600">Reach</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{formatNumber(performanceData.metrics.clicks)}</div>
                      <div className="text-sm text-gray-600">Clicks</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{formatNumber(performanceData.metrics.shares)}</div>
                      <div className="text-sm text-gray-600">Shares</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{formatNumber(performanceData.metrics.comments)}</div>
                      <div className="text-sm text-gray-600">Comments</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Performance */}
              {performanceData.platforms && performanceData.platforms.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title">Platform Performance</h4>
                  </div>
                  <div className="card-content">
                    <div className="space-y-3">
                      {performanceData.platforms.map((platform: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">
                              {platform.platform === 'FACEBOOK' && '📘'}
                              {platform.platform === 'INSTAGRAM' && '📷'}
                              {platform.platform === 'LINKEDIN' && '💼'}
                              {platform.platform === 'TWITTER' && '🐦'}
                              {platform.platform === 'YOUTUBE' && '📺'}
                            </span>
                            <span className="font-medium text-gray-900">{platform.platform}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className={`text-sm font-medium ${getPerformanceColor(platform.performance, 100)}`}>
                                {platform.performance}%
                              </div>
                              <div className="text-xs text-gray-500">Performance</div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-medium ${getPerformanceColor(platform.engagement, 100)}`}>
                                {platform.engagement}%
                              </div>
                              <div className="text-xs text-gray-500">Engagement</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Trends */}
              {performanceData.trends && performanceData.trends.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title">Performance Trends</h4>
                  </div>
                  <div className="card-content">
                    <div className="space-y-3">
                      {performanceData.trends.slice(-7).map((trend: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">
                            {new Date(trend.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">{formatNumber(trend.views)}</div>
                              <div className="text-xs text-gray-500">Views</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">{formatNumber(trend.engagement)}</div>
                              <div className="text-xs text-gray-500">Engagement</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Performance Comparison Tab */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Performance Comparison</h4>
              <p className="text-sm text-gray-600">Compare performance across multiple content pieces</p>
            </div>
            <button
              onClick={comparePerformance}
              disabled={loading || compareContentIds.length < 2}
              className="btn-primary"
            >
              {loading ? 'Comparing...' : 'Compare Performance'}
            </button>
          </div>

          {/* Add Content IDs */}
          <div className="card">
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newCompareId}
                    onChange={(e) => setNewCompareId(e.target.value)}
                    className="input flex-1"
                    placeholder="Enter content ID to compare..."
                    onKeyPress={(e) => e.key === 'Enter' && addCompareId()}
                  />
                  <button
                    onClick={addCompareId}
                    className="btn-secondary"
                  >
                    Add
                  </button>
                </div>

                {compareContentIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {compareContentIds.map((id, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {id}
                        <button
                          onClick={() => removeCompareId(id)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comparison Results */}
          {comparisonData && (
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Comparison Results</h4>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {/* Comparison Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reach</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ranking</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {comparisonData.comparison.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.title}</div>
                              <div className="text-sm text-gray-500">{item.contentId}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatNumber(item.metrics.views)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatNumber(item.metrics.engagement)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatNumber(item.metrics.reach)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                item.ranking === 1 ? 'bg-green-100 text-green-800' :
                                item.ranking === 2 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                #{item.ranking}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Insights */}
                  {comparisonData.insights && comparisonData.insights.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">AI Insights</h5>
                      <div className="space-y-2">
                        {comparisonData.insights.map((insight: any, index: number) => (
                          <div key={index} className={`p-3 rounded-lg ${
                            insight.type === 'best_performing' ? 'bg-green-50 border border-green-200' :
                            insight.type === 'trending' ? 'bg-blue-50 border border-blue-200' :
                            'bg-yellow-50 border border-yellow-200'
                          }`}>
                            <div className="text-sm text-gray-800">{insight.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">Performance Analytics</h4>
        <div className="space-y-2 text-sm text-green-800">
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">📊</span>
            <div>
              <p className="font-medium">Performance Metrics</p>
              <p>Track views, engagement, reach, clicks, shares, and comments across platforms.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">📈</span>
            <div>
              <p className="font-medium">Performance Comparison</p>
              <p>Compare multiple content pieces to identify top performers and trends.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">🤖</span>
            <div>
              <p className="font-medium">AI Insights</p>
              <p>Get AI-powered insights and recommendations based on performance data.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
