'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function SchedulingAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState('');

  const platforms = [
    { value: 'FACEBOOK', label: 'Facebook', icon: '📘' },
    { value: 'INSTAGRAM', label: 'Instagram', icon: '📷' },
    { value: 'LINKEDIN', label: 'LinkedIn', icon: '💼' },
    { value: 'TWITTER', label: 'Twitter', icon: '🐦' },
    { value: 'YOUTUBE', label: 'YouTube', icon: '📺' },
  ];

  const loadAnalytics = async () => {
    if (!selectedPlatform) {
      setError('Please select a platform');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getSchedulingAnalytics(selectedPlatform);
      setAnalyticsData(result);
    } catch (err: any) {
      console.error('Failed to load scheduling analytics:', err);
      setError(err.message || 'Failed to load scheduling analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPlatformIcon = (platform: string) => {
    const platformObj = platforms.find(p => p.value === platform);
    return platformObj?.icon || '📁';
  };

  const getEngagementColor = (engagement: number) => {
    if (engagement >= 80) return 'text-green-600';
    if (engagement >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Scheduling Analytics</h3>
        <p className="text-sm text-gray-600">Analyze scheduling performance and trends by platform</p>
      </div>

      {/* Platform Selection */}
      <div className="card">
        <div className="card-content">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Platform
              </label>
              <div className="grid grid-cols-1 gap-2">
                {platforms.map((platform) => (
                  <label key={platform.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="platform"
                      value={platform.value}
                      checked={selectedPlatform === platform.value}
                      onChange={(e) => setSelectedPlatform(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-lg">{platform.icon}</span>
                    <span className="text-sm font-medium text-gray-900">{platform.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={loadAnalytics}
                disabled={loading || !selectedPlatform}
                className="btn-primary"
              >
                {loading ? 'Loading...' : 'Load Analytics'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Results */}
      {analyticsData && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Scheduling Metrics</h4>
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getPlatformIcon(analyticsData.platform)}</span>
                <span className="text-sm text-gray-600">{analyticsData.platform}</span>
              </div>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.metrics.totalScheduled)}</div>
                  <div className="text-sm text-gray-600">Total Scheduled</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatNumber(analyticsData.metrics.completedSchedules)}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{formatNumber(analyticsData.metrics.cancelledSchedules)}</div>
                  <div className="text-sm text-gray-600">Cancelled</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className={`text-2xl font-bold ${getEngagementColor(analyticsData.metrics.averageEngagement)}`}>
                    {analyticsData.metrics.averageEngagement}%
                  </div>
                  <div className="text-sm text-gray-600">Avg. Engagement</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{analyticsData.metrics.bestPerformingTime}</div>
                  <div className="text-sm text-gray-600">Best Time</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trends */}
          {analyticsData.trends && analyticsData.trends.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Scheduling Trends</h4>
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
                          <div className="text-sm font-medium text-gray-900">{formatNumber(trend.scheduled)}</div>
                          <div className="text-xs text-gray-500">Scheduled</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">{formatNumber(trend.published)}</div>
                          <div className="text-xs text-gray-500">Published</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${getEngagementColor(trend.engagement)}`}>
                            {trend.engagement}%
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

          {/* Performance by Time */}
          {analyticsData.performanceByTime && analyticsData.performanceByTime.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Performance by Time</h4>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  {analyticsData.performanceByTime.map((performance: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">⏰</span>
                        <div>
                          <div className="font-medium text-gray-900">
                            {performance.dayOfWeek} at {performance.hour}:00
                          </div>
                          <div className="text-sm text-gray-600">
                            {performance.scheduleCount} schedules
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getEngagementColor(performance.averageEngagement)}`}>
                          {performance.averageEngagement}%
                        </div>
                        <div className="text-xs text-gray-500">Avg. Engagement</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Scheduling Insights</h4>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-green-600 text-lg">📈</span>
                      <h5 className="font-medium text-green-900">Best Performing Time</h5>
                    </div>
                    <p className="text-sm text-green-800">
                      {analyticsData.metrics.bestPerformingTime} shows the highest engagement rates with {analyticsData.metrics.averageEngagement}% average engagement.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-blue-600 text-lg">📊</span>
                      <h5 className="font-medium text-blue-900">Schedule Success Rate</h5>
                    </div>
                    <p className="text-sm text-blue-800">
                      {Math.round((analyticsData.metrics.completedSchedules / analyticsData.metrics.totalScheduled) * 100)}% of scheduled content is successfully published.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-yellow-600 text-lg">💡</span>
                    <h5 className="font-medium text-yellow-900">Optimization Recommendations</h5>
                  </div>
                  <div className="text-sm text-yellow-800">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Focus on scheduling during {analyticsData.metrics.bestPerformingTime} for maximum engagement</li>
                      <li>Consider reducing cancellations by improving content quality and timing</li>
                      <li>Monitor trends to identify optimal scheduling patterns</li>
                    </ul>
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
        <h4 className="font-medium text-green-900 mb-2">Scheduling Analytics</h4>
        <div className="space-y-2 text-sm text-green-800">
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">📊</span>
            <div>
              <p className="font-medium">Performance Metrics</p>
              <p>Track scheduling success rates, engagement levels, and completion rates by platform.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">📈</span>
            <div>
              <p className="font-medium">Trend Analysis</p>
              <p>Monitor scheduling trends over time to identify patterns and optimization opportunities.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">⏰</span>
            <div>
              <p className="font-medium">Time-based Performance</p>
              <p>Analyze performance by day of week and hour to find optimal scheduling times.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">💡</span>
            <div>
              <p className="font-medium">AI Insights</p>
              <p>Get intelligent recommendations for improving scheduling performance and engagement.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
