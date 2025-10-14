'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
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
  metrics: {
    followers: number;
    following: number;
    engagement: number;
    reach: number;
    impressions: number;
    clicks: number;
    shares: number;
    comments: number;
    likes: number;
  };
  trends: Array<{
    date: string;
    followers: number;
    engagement: number;
    reach: number;
    impressions: number;
  }>;
  contentPerformance: Array<{
    type: string;
    count: number;
    engagement: number;
    reach: number;
  }>;
  audienceInsights: {
    demographics: Array<{
      ageGroup: string;
      percentage: number;
    }>;
    locations: Array<{
      country: string;
      percentage: number;
    }>;
    interests: Array<{
      interest: string;
      percentage: number;
    }>;
  };
  bestTimes: Array<{
    hour: number;
    engagement: number;
    reach: number;
  }>;
  competitorAnalysis: Array<{
    competitor: string;
    followers: number;
    engagement: number;
    growth: number;
  }>;
}

interface PlatformAnalyticsProps {
  onPlatformSelect?: (platform: string) => void;
}

export default function PlatformAnalytics({ onPlatformSelect }: PlatformAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<PlatformAnalyticsData[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [activeMetric, setActiveMetric] = useState<'followers' | 'engagement' | 'reach' | 'impressions'>('followers');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Mock analytics data
  const mockAnalyticsData: PlatformAnalyticsData[] = [
    {
      platform: 'Facebook',
      metrics: {
        followers: 12500,
        following: 500,
        engagement: 4.2,
        reach: 8500,
        impressions: 12000,
        clicks: 456,
        shares: 123,
        comments: 89,
        likes: 567
      },
      trends: [
        { date: '2024-01-15', followers: 12000, engagement: 4.0, reach: 8000, impressions: 11000 },
        { date: '2024-01-16', followers: 12100, engagement: 4.1, reach: 8200, impressions: 11200 },
        { date: '2024-01-17', followers: 12200, engagement: 4.2, reach: 8400, impressions: 11400 },
        { date: '2024-01-18', followers: 12300, engagement: 4.3, reach: 8600, impressions: 11600 },
        { date: '2024-01-19', followers: 12400, engagement: 4.1, reach: 8500, impressions: 11800 },
        { date: '2024-01-20', followers: 12450, engagement: 4.2, reach: 8400, impressions: 11900 },
        { date: '2024-01-21', followers: 12500, engagement: 4.2, reach: 8500, impressions: 12000 }
      ],
      contentPerformance: [
        { type: 'Posts', count: 45, engagement: 4.1, reach: 8200 },
        { type: 'Videos', count: 12, engagement: 5.8, reach: 9500 },
        { type: 'Stories', count: 23, engagement: 3.5, reach: 7800 },
        { type: 'Reels', count: 8, engagement: 6.2, reach: 10200 }
      ],
      audienceInsights: {
        demographics: [
          { ageGroup: '18-24', percentage: 25 },
          { ageGroup: '25-34', percentage: 35 },
          { ageGroup: '35-44', percentage: 20 },
          { ageGroup: '45-54', percentage: 15 },
          { ageGroup: '55+', percentage: 5 }
        ],
        locations: [
          { country: 'United States', percentage: 40 },
          { country: 'Canada', percentage: 15 },
          { country: 'United Kingdom', percentage: 12 },
          { country: 'Australia', percentage: 8 },
          { country: 'Germany', percentage: 6 },
          { country: 'Other', percentage: 19 }
        ],
        interests: [
          { interest: 'Technology', percentage: 30 },
          { interest: 'Business', percentage: 25 },
          { interest: 'Marketing', percentage: 20 },
          { interest: 'Design', percentage: 15 },
          { interest: 'Other', percentage: 10 }
        ]
      },
      bestTimes: [
        { hour: 9, engagement: 4.8, reach: 9200 },
        { hour: 12, engagement: 5.2, reach: 9800 },
        { hour: 15, engagement: 4.6, reach: 8900 },
        { hour: 18, engagement: 5.5, reach: 10200 },
        { hour: 21, engagement: 4.9, reach: 9500 }
      ],
      competitorAnalysis: [
        { competitor: 'Competitor A', followers: 15000, engagement: 3.8, growth: 2.1 },
        { competitor: 'Competitor B', followers: 11000, engagement: 4.5, growth: 3.2 },
        { competitor: 'Competitor C', followers: 18000, engagement: 3.2, growth: 1.8 }
      ]
    },
    {
      platform: 'LinkedIn',
      metrics: {
        followers: 8900,
        following: 1200,
        engagement: 6.8,
        reach: 6200,
        impressions: 9800,
        clicks: 234,
        shares: 67,
        comments: 45,
        likes: 189
      },
      trends: [
        { date: '2024-01-15', followers: 8500, engagement: 6.5, reach: 5800, impressions: 9200 },
        { date: '2024-01-16', followers: 8600, engagement: 6.6, reach: 5900, impressions: 9400 },
        { date: '2024-01-17', followers: 8700, engagement: 6.7, reach: 6000, impressions: 9600 },
        { date: '2024-01-18', followers: 8800, engagement: 6.8, reach: 6100, impressions: 9700 },
        { date: '2024-01-19', followers: 8850, engagement: 6.9, reach: 6150, impressions: 9750 },
        { date: '2024-01-20', followers: 8875, engagement: 6.8, reach: 6175, impressions: 9775 },
        { date: '2024-01-21', followers: 8900, engagement: 6.8, reach: 6200, impressions: 9800 }
      ],
      contentPerformance: [
        { type: 'Articles', count: 15, engagement: 8.2, reach: 6800 },
        { type: 'Posts', count: 32, engagement: 6.1, reach: 5800 },
        { type: 'Videos', count: 8, engagement: 7.5, reach: 7200 },
        { type: 'Polls', count: 12, engagement: 5.8, reach: 5500 }
      ],
      audienceInsights: {
        demographics: [
          { ageGroup: '25-34', percentage: 40 },
          { ageGroup: '35-44', percentage: 35 },
          { ageGroup: '45-54', percentage: 15 },
          { ageGroup: '18-24', percentage: 5 },
          { ageGroup: '55+', percentage: 5 }
        ],
        locations: [
          { country: 'United States', percentage: 35 },
          { country: 'United Kingdom', percentage: 20 },
          { country: 'Canada', percentage: 12 },
          { country: 'Germany', percentage: 10 },
          { country: 'Australia', percentage: 8 },
          { country: 'Other', percentage: 15 }
        ],
        interests: [
          { interest: 'Business', percentage: 35 },
          { interest: 'Technology', percentage: 25 },
          { interest: 'Marketing', percentage: 20 },
          { interest: 'Leadership', percentage: 15 },
          { interest: 'Other', percentage: 5 }
        ]
      },
      bestTimes: [
        { hour: 8, engagement: 7.2, reach: 7200 },
        { hour: 12, engagement: 6.8, reach: 6800 },
        { hour: 17, engagement: 7.5, reach: 7500 },
        { hour: 20, engagement: 6.9, reach: 6900 }
      ],
      competitorAnalysis: [
        { competitor: 'Competitor A', followers: 12000, engagement: 5.8, growth: 2.8 },
        { competitor: 'Competitor B', followers: 9500, engagement: 7.2, growth: 4.1 },
        { competitor: 'Competitor C', followers: 15000, engagement: 5.2, growth: 2.2 }
      ]
    }
  ];

  useEffect(() => {
    setAnalyticsData(mockAnalyticsData);
  }, [timeRange]);

  const handlePlatformSelect = (platform: string) => {
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
            Detailed analytics and insights for each platform
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
        {analyticsData.map((data) => (
          <div
            key={data.platform}
            onClick={() => handlePlatformSelect(data.platform)}
            className={`card cursor-pointer transition-all ${
              selectedPlatform === data.platform
                ? 'ring-2 ring-primary-500'
                : 'hover:shadow-lg'
            }`}
          >
            <div className="card-content">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{getPlatformIcon(data.platform)}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{data.platform}</h3>
                    <p className="text-sm text-gray-600">{formatNumber(data.metrics.followers)} followers</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{data.metrics.engagement}%</div>
                  <div className="text-sm text-gray-600">engagement</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Reach</div>
                  <div className="font-medium text-gray-900">{formatNumber(data.metrics.reach)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Impressions</div>
                  <div className="font-medium text-gray-900">{formatNumber(data.metrics.impressions)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Clicks</div>
                  <div className="font-medium text-gray-900">{formatNumber(data.metrics.clicks)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Shares</div>
                  <div className="font-medium text-gray-900">{formatNumber(data.metrics.shares)}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Platform Analytics */}
      {selectedPlatform && (
        <div className="space-y-6">
          {(() => {
            const data = analyticsData.find(d => d.platform === selectedPlatform);
            if (!data) return null;

            return (
              <>
                {/* Platform Header */}
                <div className="card">
                  <div className="card-content">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-4xl">{getPlatformIcon(data.platform)}</span>
                        <div>
                          <h3 className="text-xl font-medium text-gray-900">{data.platform}</h3>
                          <p className="text-gray-600">Platform Analytics Overview</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{data.metrics.engagement}%</div>
                        <div className="text-sm text-gray-600">Overall Engagement</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="card">
                    <div className="card-content text-center">
                      <div className="text-2xl font-bold text-blue-600">{formatNumber(data.metrics.followers)}</div>
                      <div className="text-sm text-gray-600">Followers</div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-content text-center">
                      <div className="text-2xl font-bold text-green-600">{formatNumber(data.metrics.reach)}</div>
                      <div className="text-sm text-gray-600">Reach</div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-content text-center">
                      <div className="text-2xl font-bold text-yellow-600">{formatNumber(data.metrics.impressions)}</div>
                      <div className="text-sm text-gray-600">Impressions</div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-content text-center">
                      <div className="text-2xl font-bold text-purple-600">{formatNumber(data.metrics.clicks)}</div>
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
                            { key: 'reach', label: 'Reach' },
                            { key: 'impressions', label: 'Impressions' }
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
                          <LineChart data={data.trends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey={activeMetric}
                              stroke={getPlatformColor(data.platform)}
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Content Performance */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Content Performance</h3>
                      <p className="card-description">Engagement by content type</p>
                    </div>
                    <div className="card-content">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.contentPerformance}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="type" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="engagement" fill={getPlatformColor(data.platform)} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audience Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Demographics */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Age Demographics</h3>
                      <p className="card-description">Audience age distribution</p>
                    </div>
                    <div className="card-content">
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={data.audienceInsights.demographics}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ ageGroup, percentage }) => `${ageGroup} ${percentage}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="percentage"
                            >
                              {data.audienceInsights.demographics.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Top Locations</h3>
                      <p className="card-description">Audience by country</p>
                    </div>
                    <div className="card-content">
                      <div className="space-y-3">
                        {data.audienceInsights.locations.slice(0, 5).map((location, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{location.country}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary-500 h-2 rounded-full"
                                  style={{ width: `${location.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{location.percentage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Interests */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Top Interests</h3>
                      <p className="card-description">Audience interests</p>
                    </div>
                    <div className="card-content">
                      <div className="space-y-3">
                        {data.audienceInsights.interests.slice(0, 5).map((interest, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{interest.interest}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${interest.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{interest.percentage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Best Times and Competitor Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Best Posting Times */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Best Posting Times</h3>
                      <p className="card-description">Optimal hours for engagement</p>
                    </div>
                    <div className="card-content">
                      <div className="space-y-3">
                        {data.bestTimes.map((time, index) => (
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

                  {/* Competitor Analysis */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Competitor Analysis</h3>
                      <p className="card-description">Compare with competitors</p>
                    </div>
                    <div className="card-content">
                      <div className="space-y-4">
                        {data.competitorAnalysis.map((competitor, index) => (
                          <div key={index} className="p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{competitor.competitor}</h4>
                              <span className="text-sm text-green-600">+{competitor.growth}%</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Followers:</span>
                                <span className="font-medium text-gray-900 ml-1">{formatNumber(competitor.followers)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Engagement:</span>
                                <span className="font-medium text-gray-900 ml-1">{competitor.engagement}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
