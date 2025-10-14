'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ContentPerformanceData {
  contentId: string;
  title: string;
  platform: string;
  contentType: string;
  publishedDate: Date;
  metrics: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    clicks: number;
    engagement: number;
    reach: number;
    impressions: number;
  };
  trends: Array<{
    date: string;
    views: number;
    engagement: number;
  }>;
}

interface ContentPerformanceProps {
  onContentSelect?: (content: ContentPerformanceData) => void;
}

export default function ContentPerformance({ onContentSelect }: ContentPerformanceProps) {
  const [contentData, setContentData] = useState<ContentPerformanceData[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentPerformanceData | null>(null);
  const [activeMetric, setActiveMetric] = useState<'views' | 'engagement' | 'reach' | 'clicks'>('views');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Mock data for demonstration
  const mockContentData: ContentPerformanceData[] = [
    {
      contentId: '1',
      title: 'AI Revolution in Marketing',
      platform: 'LinkedIn',
      contentType: 'Blog',
      publishedDate: new Date('2024-01-15'),
      metrics: {
        views: 8500,
        likes: 245,
        shares: 89,
        comments: 67,
        clicks: 156,
        engagement: 9.2,
        reach: 7200,
        impressions: 12000
      },
      trends: [
        { date: '2024-01-15', views: 1200, engagement: 8.5 },
        { date: '2024-01-16', views: 2100, engagement: 9.1 },
        { date: '2024-01-17', views: 1800, engagement: 8.8 },
        { date: '2024-01-18', views: 1500, engagement: 9.3 },
        { date: '2024-01-19', views: 1200, engagement: 9.0 },
        { date: '2024-01-20', views: 800, engagement: 8.7 },
        { date: '2024-01-21', views: 900, engagement: 9.2 }
      ]
    },
    {
      contentId: '2',
      title: 'Product Launch Announcement',
      platform: 'Facebook',
      contentType: 'Social Post',
      publishedDate: new Date('2024-01-18'),
      metrics: {
        views: 12000,
        likes: 456,
        shares: 123,
        comments: 89,
        clicks: 234,
        engagement: 8.7,
        reach: 9800,
        impressions: 15000
      },
      trends: [
        { date: '2024-01-18', views: 3000, engagement: 8.2 },
        { date: '2024-01-19', views: 4200, engagement: 8.8 },
        { date: '2024-01-20', views: 2800, engagement: 8.5 },
        { date: '2024-01-21', views: 2000, engagement: 8.9 }
      ]
    },
    {
      contentId: '3',
      title: 'Behind the Scenes',
      platform: 'Instagram',
      contentType: 'Video',
      publishedDate: new Date('2024-01-20'),
      metrics: {
        views: 15600,
        likes: 789,
        shares: 234,
        comments: 156,
        clicks: 345,
        engagement: 7.8,
        reach: 13200,
        impressions: 18000
      },
      trends: [
        { date: '2024-01-20', views: 5000, engagement: 7.5 },
        { date: '2024-01-21', views: 10600, engagement: 7.8 }
      ]
    }
  ];

  useEffect(() => {
    setContentData(mockContentData);
  }, [timeRange]);

  const handleContentSelect = (content: ContentPerformanceData) => {
    setSelectedContent(content);
    if (onContentSelect) {
      onContentSelect(content);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Facebook': return '📘';
      case 'LinkedIn': return '💼';
      case 'Instagram': return '📷';
      case 'Twitter': return '🐦';
      case 'Email': return '📧';
      default: return '📱';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'Blog': return '📝';
      case 'Social Post': return '📱';
      case 'Video': return '🎥';
      case 'Newsletter': return '📧';
      case 'Infographic': return '📊';
      default: return '📄';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'views': return '#3B82F6';
      case 'engagement': return '#10B981';
      case 'reach': return '#F59E0B';
      case 'clicks': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Content Performance</h2>
          <p className="text-gray-600 mt-1">
            Track and analyze individual content performance
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {[
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: '90d', label: '90 Days' }
            ].map((range) => (
              <button
                key={range.key}
                onClick={() => setTimeRange(range.key as any)}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  timeRange === range.key
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Content Library</h3>
              <p className="card-description">Select content to view performance</p>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                {contentData.map((content) => (
                  <div
                    key={content.contentId}
                    onClick={() => handleContentSelect(content)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedContent?.contentId === content.contentId
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">{getContentTypeIcon(content.contentType)}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{content.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm">{getPlatformIcon(content.platform)}</span>
                          <span className="text-sm text-gray-600">{content.platform}</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-600">{content.contentType}</span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Views:</span>
                            <span className="font-medium text-gray-900 ml-1">{formatNumber(content.metrics.views)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Engagement:</span>
                            <span className="font-medium text-gray-900 ml-1">{content.metrics.engagement}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Details */}
        <div className="lg:col-span-2">
          {selectedContent ? (
            <div className="space-y-6">
              {/* Content Header */}
              <div className="card">
                <div className="card-content">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl">{getContentTypeIcon(selectedContent.contentType)}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{selectedContent.title}</h3>
                        <div className="flex items-center space-x-3 mt-1">
                          <div className="flex items-center space-x-1">
                            <span className="text-lg">{getPlatformIcon(selectedContent.platform)}</span>
                            <span className="text-sm text-gray-600">{selectedContent.platform}</span>
                          </div>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-600">{selectedContent.contentType}</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-600">
                            Published {selectedContent.publishedDate.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card">
                  <div className="card-content text-center">
                    <div className="text-2xl font-bold text-blue-600">{formatNumber(selectedContent.metrics.views)}</div>
                    <div className="text-sm text-gray-600">Views</div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-content text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedContent.metrics.engagement}%</div>
                    <div className="text-sm text-gray-600">Engagement</div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-content text-center">
                    <div className="text-2xl font-bold text-yellow-600">{formatNumber(selectedContent.metrics.reach)}</div>
                    <div className="text-sm text-gray-600">Reach</div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-content text-center">
                    <div className="text-2xl font-bold text-red-600">{formatNumber(selectedContent.metrics.clicks)}</div>
                    <div className="text-sm text-gray-600">Clicks</div>
                  </div>
                </div>
              </div>

              {/* Performance Chart */}
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="card-title">Performance Trends</h3>
                      <p className="card-description">Views and engagement over time</p>
                    </div>
                    <div className="flex space-x-2">
                      {[
                        { key: 'views', label: 'Views' },
                        { key: 'engagement', label: 'Engagement' },
                        { key: 'reach', label: 'Reach' },
                        { key: 'clicks', label: 'Clicks' }
                      ].map((metric) => (
                        <button
                          key={metric.key}
                          onClick={() => setActiveMetric(metric.key as any)}
                          className={`px-3 py-1 text-sm font-medium rounded ${
                            activeMetric === metric.key
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {metric.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="card-content">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedContent.trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey={activeMetric}
                          stroke={getMetricColor(activeMetric)}
                          fill={getMetricColor(activeMetric)}
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Detailed Metrics</h3>
                  <p className="card-description">Complete performance breakdown</p>
                </div>
                <div className="card-content">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{selectedContent.metrics.likes}</div>
                      <div className="text-sm text-gray-600">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{selectedContent.metrics.shares}</div>
                      <div className="text-sm text-gray-600">Shares</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{selectedContent.metrics.comments}</div>
                      <div className="text-sm text-gray-600">Comments</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">{formatNumber(selectedContent.metrics.impressions)}</div>
                      <div className="text-sm text-gray-600">Impressions</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-content">
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select content to view performance</h3>
                  <p className="text-gray-500">
                    Choose a content piece from the library to see detailed performance metrics
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
