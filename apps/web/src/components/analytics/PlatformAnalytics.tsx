'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface PlatformAnalyticsData {
  platform: string;
  followers: number;
  following: number;
  engagement: number;
  reach: number;
  impressions: number;
  clicks: number;
  shares: number;
  comments: number;
  likes: number;
  growth: {
    followers: number;
    engagement: number;
    reach: number;
  };
  trends: Array<{
    date: string;
    followers: number;
    engagement: number;
    reach: number;
  }>;
  contentTypes: Array<{
    type: string;
    count: number;
    engagement: number;
  }>;
  bestTimes: Array<{
    hour: number;
    engagement: number;
  }>;
}

interface PlatformAnalyticsProps {
  onPlatformSelect?: (platform: PlatformAnalyticsData) => void;
}

export default function PlatformAnalytics({ onPlatformSelect }: PlatformAnalyticsProps) {
  const [platformData, setPlatformData] = useState<PlatformAnalyticsData[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformAnalyticsData | null>(null);
  const [activeMetric, setActiveMetric] = useState<'followers' | 'engagement' | 'reach'>('followers');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Mock data for demonstration
  const mockPlatformData: PlatformAnalyticsData[] = [
    {
      platform: 'Facebook',
      followers: 12500,
      following: 500,
      engagement: 4.2,
      reach: 8500,
      impressions: 12000,
      clicks: 456,
      shares: 123,
      comments: 89,
      likes: 567,
      growth: {
        followers: 12.5,
        engagement: 8.3,
        reach: 15.2
      },
      trends: [
        { date: '2024-01-15', followers: 12000, engagement: 4.0, reach: 8000 },
        { date: '2024-01-16', followers: 12100, engagement: 4.1, reach: 8200 },
        { date: '2024-01-17', followers: 12200, engagement: 4.2, reach: 8400 },
        { date: '2024-01-18', followers: 12300, engagement: 4.3, reach: 8600 },
        { date: '2024-01-19', followers: 12400, engagement: 4.1, reach: 8500 },
        { date: '2024-01-20', followers: 12450, engagement: 4.2, reach: 8400 },
        { date: '2024-01-21', followers: 12500, engagement: 4.2, reach: 8500 }
      ],
      contentTypes: [
        { type: 'Posts', count: 45, engagement: 4.1 },
        { type: 'Videos', count: 12, engagement: 5.8 },
        { type: 'Stories', count: 23, engagement: 3.5 },
        { type: 'Reels', count: 8, engagement: 6.2 }
      ],
      bestTimes: [
        { hour: 9, engagement: 4.8 },
        { hour: 12, engagement: 5.2 },
        { hour: 15, engagement: 4.6 },
        { hour: 18, engagement: 5.5 },
        { hour: 21, engagement: 4.9 }
      ]
    },
    {
      platform: 'LinkedIn',
      followers: 8900,
      following: 1200,
      engagement: 6.8,
      reach: 6200,
      impressions: 9800,
      clicks: 234,
      shares: 67,
      comments: 45,
      likes: 189,
      growth: {
        followers: 8.7,
        engagement: 12.4,
        reach: 18.9
      },
      trends: [
        { date: '2024-01-15', followers: 8500, engagement: 6.5, reach: 5800 },
        { date: '2024-01-16', followers: 8600, engagement: 6.6, reach: 5900 },
        { date: '2024-01-17', followers: 8700, engagement: 6.7, reach: 6000 },
        { date: '2024-01-18', followers: 8800, engagement: 6.8, reach: 6100 },
        { date: '2024-01-19', followers: 8850, engagement: 6.9, reach: 6150 },
        { date: '2024-01-20', followers: 8875, engagement: 6.8, reach: 6175 },
        { date: '2024-01-21', followers: 8900, engagement: 6.8, reach: 6200 }
      ],
      contentTypes: [
        { type: 'Articles', count: 15, engagement: 8.2 },
        { type: 'Posts', count: 32, engagement: 6.1 },
        { type: 'Videos', count: 8, engagement: 7.5 },
        { type: 'Polls', count: 12, engagement: 5.8 }
      ],
      bestTimes: [
        { hour: 8, engagement: 7.2 },
        { hour: 12, engagement: 6.8 },
        { hour: 17, engagement: 7.5 },
        { hour: 20, engagement: 6.9 }
      ]
    },
    {
      platform: 'Instagram',
      followers: 15600,
      following: 800,
      engagement: 5.5,
      reach: 11200,
      impressions: 14500,
      clicks: 345,
      shares: 234,
      comments: 156,
      likes: 789,
      growth: {
        followers: 15.8,
        engagement: 9.7,
        reach: 22.1
      },
      trends: [
        { date: '2024-01-15', followers: 15000, engagement: 5.2, reach: 10800 },
        { date: '2024-01-16', followers: 15200, engagement: 5.3, reach: 10900 },
        { date: '2024-01-17', followers: 15400, engagement: 5.4, reach: 11000 },
        { date: '2024-01-18', followers: 15500, engagement: 5.5, reach: 11100 },
        { date: '2024-01-19', followers: 15550, engagement: 5.6, reach: 11150 },
        { date: '2024-01-20', followers: 15575, engagement: 5.5, reach: 11175 },
        { date: '2024-01-21', followers: 15600, engagement: 5.5, reach: 11200 }
      ],
      contentTypes: [
        { type: 'Posts', count: 28, engagement: 5.2 },
        { type: 'Stories', count: 45, engagement: 4.8 },
        { type: 'Reels', count: 15, engagement: 7.8 },
        { type: 'IGTV', count: 6, engagement: 6.5 }
      ],
      bestTimes: [
        { hour: 11, engagement: 6.2 },
        { hour: 14, engagement: 5.8 },
        { hour: 17, engagement: 6.5 },
        { hour: 19, engagement: 6.8 },
        { hour: 21, engagement: 5.9 }
      ]
    }
  ];

  useEffect(() => {
    setPlatformData(mockPlatformData);
  }, [timeRange]);

  const handlePlatformSelect = (platform: PlatformAnalyticsData) => {
    setSelectedPlatform(platform);
    if (onPlatformSelect) {
      onPlatformSelect(platform);
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

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'Facebook': return '#1877F2';
      case 'LinkedIn': return '#0077B5';
      case 'Instagram': return '#E4405F';
      case 'Twitter': return '#1DA1F2';
      case 'Email': return '#34A853';
      default: return '#6B7280';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Platform Analytics</h2>
          <p className="text-gray-600 mt-1">
            Compare and analyze performance across platforms
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

      {/* Platform Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platformData.map((platform) => (
          <div
            key={platform.platform}
            onClick={() => handlePlatformSelect(platform)}
            className={`card cursor-pointer transition-all ${
              selectedPlatform?.platform === platform.platform
                ? 'ring-2 ring-primary-500'
                : 'hover:shadow-lg'
            }`}
          >
            <div className="card-content">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{getPlatformIcon(platform.platform)}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{platform.platform}</h3>
                    <p className="text-sm text-gray-600">{formatNumber(platform.followers)} followers</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{platform.engagement}%</div>
                  <div className="text-sm text-gray-600">engagement</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Reach</div>
                  <div className="font-medium text-gray-900">{formatNumber(platform.reach)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Impressions</div>
                  <div className="font-medium text-gray-900">{formatNumber(platform.impressions)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Growth</div>
                  <div className="font-medium text-green-600">+{platform.growth.followers}%</div>
                </div>
                <div>
                  <div className="text-gray-600">Clicks</div>
                  <div className="font-medium text-gray-900">{formatNumber(platform.clicks)}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Platform Analytics */}
      {selectedPlatform && (
        <div className="space-y-6">
          {/* Platform Header */}
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-4xl">{getPlatformIcon(selectedPlatform.platform)}</span>
                  <div>
                    <h3 className="text-xl font-medium text-gray-900">{selectedPlatform.platform}</h3>
                    <p className="text-gray-600">Platform Performance Overview</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{selectedPlatform.engagement}%</div>
                  <div className="text-sm text-gray-600">Overall Engagement</div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="card-content text-center">
                <div className="text-2xl font-bold text-blue-600">{formatNumber(selectedPlatform.followers)}</div>
                <div className="text-sm text-gray-600">Followers</div>
                <div className="text-xs text-green-600">+{selectedPlatform.growth.followers}%</div>
              </div>
            </div>
            <div className="card">
              <div className="card-content text-center">
                <div className="text-2xl font-bold text-green-600">{formatNumber(selectedPlatform.reach)}</div>
                <div className="text-sm text-gray-600">Reach</div>
                <div className="text-xs text-green-600">+{selectedPlatform.growth.reach}%</div>
              </div>
            </div>
            <div className="card">
              <div className="card-content text-center">
                <div className="text-2xl font-bold text-yellow-600">{formatNumber(selectedPlatform.impressions)}</div>
                <div className="text-sm text-gray-600">Impressions</div>
              </div>
            </div>
            <div className="card">
              <div className="card-content text-center">
                <div className="text-2xl font-bold text-purple-600">{formatNumber(selectedPlatform.clicks)}</div>
                <div className="text-sm text-gray-600">Clicks</div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trends */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="card-title">Performance Trends</h3>
                    <p className="card-description">Growth over time</p>
                  </div>
                  <div className="flex space-x-2">
                    {[
                      { key: 'followers', label: 'Followers' },
                      { key: 'engagement', label: 'Engagement' },
                      { key: 'reach', label: 'Reach' }
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
                    <LineChart data={selectedPlatform.trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey={activeMetric}
                        stroke={getPlatformColor(selectedPlatform.platform)}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Content Types Performance */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Content Types Performance</h3>
                <p className="card-description">Engagement by content type</p>
              </div>
              <div className="card-content">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedPlatform.contentTypes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="engagement" fill={getPlatformColor(selectedPlatform.platform)} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Best Times and Engagement Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Best Posting Times */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Best Posting Times</h3>
                <p className="card-description">Optimal hours for engagement</p>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  {selectedPlatform.bestTimes.map((time, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-900">{time.hour}:00</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {time.hour < 12 ? `${time.hour}:00 AM` : `${time.hour - 12}:00 PM`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full"
                            style={{ width: `${(time.engagement / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{time.engagement}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Engagement Breakdown */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Engagement Breakdown</h3>
                <p className="card-description">Detailed engagement metrics</p>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Likes</span>
                    <span className="font-medium text-gray-900">{formatNumber(selectedPlatform.likes)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Comments</span>
                    <span className="font-medium text-gray-900">{formatNumber(selectedPlatform.comments)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Shares</span>
                    <span className="font-medium text-gray-900">{formatNumber(selectedPlatform.shares)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Clicks</span>
                    <span className="font-medium text-gray-900">{formatNumber(selectedPlatform.clicks)}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">Total Engagement</span>
                      <span className="font-bold text-gray-900">
                        {formatNumber(selectedPlatform.likes + selectedPlatform.comments + selectedPlatform.shares + selectedPlatform.clicks)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
