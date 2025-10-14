'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppShell from '@/components/layout/AppShell';
import { apiClient } from '@/lib/api-client';
import { ContentManager } from '@/components/auth/RoleGuard';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
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

interface AnalyticsData {
  contentPerformance: Array<{
    date: string;
    views: number;
    engagement: number;
    clicks: number;
    shares: number;
  }>;
  platformMetrics: Array<{
    platform: string;
    followers: number;
    engagement: number;
    reach: number;
    impressions: number;
  }>;
  roiData: Array<{
    month: string;
    revenue: number;
    cost: number;
    roi: number;
  }>;
  contentTypes: Array<{
    type: string;
    count: number;
    engagement: number;
  }>;
  topContent: Array<{
    title: string;
    platform: string;
    views: number;
    engagement: number;
  }>;
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  // Mock data for demonstration
  const mockAnalyticsData: AnalyticsData = {
    contentPerformance: [
      { date: '2024-01-01', views: 1200, engagement: 85, clicks: 45, shares: 12 },
      { date: '2024-01-02', views: 1500, engagement: 92, clicks: 67, shares: 18 },
      { date: '2024-01-03', views: 1100, engagement: 78, clicks: 34, shares: 8 },
      { date: '2024-01-04', views: 1800, engagement: 95, clicks: 89, shares: 25 },
      { date: '2024-01-05', views: 1600, engagement: 88, clicks: 72, shares: 20 },
      { date: '2024-01-06', views: 1400, engagement: 82, clicks: 56, shares: 15 },
      { date: '2024-01-07', views: 1700, engagement: 90, clicks: 78, shares: 22 }
    ],
    platformMetrics: [
      { platform: 'Facebook', followers: 12500, engagement: 4.2, reach: 8500, impressions: 12000 },
      { platform: 'LinkedIn', followers: 8900, engagement: 6.8, reach: 6200, impressions: 9800 },
      { platform: 'Instagram', followers: 15600, engagement: 5.5, reach: 11200, impressions: 14500 },
      { platform: 'Twitter', followers: 7200, engagement: 3.9, reach: 4800, impressions: 6800 },
      { platform: 'Email', followers: 3200, engagement: 8.2, reach: 2800, impressions: 3200 }
    ],
    roiData: [
      { month: 'Jan', revenue: 15000, cost: 5000, roi: 200 },
      { month: 'Feb', revenue: 18000, cost: 6000, roi: 200 },
      { month: 'Mar', revenue: 22000, cost: 7000, roi: 214 },
      { month: 'Apr', revenue: 19000, cost: 5500, roi: 245 },
      { month: 'May', revenue: 25000, cost: 8000, roi: 213 },
      { month: 'Jun', revenue: 28000, cost: 9000, roi: 211 }
    ],
    contentTypes: [
      { type: 'Blog Posts', count: 45, engagement: 6.2 },
      { type: 'Social Posts', count: 120, engagement: 4.8 },
      { type: 'Newsletters', count: 12, engagement: 8.5 },
      { type: 'Videos', count: 8, engagement: 12.3 },
      { type: 'Infographics', count: 15, engagement: 7.1 }
    ],
    topContent: [
      { title: 'AI Revolution in Marketing', platform: 'LinkedIn', views: 8500, engagement: 9.2 },
      { title: 'Product Launch Announcement', platform: 'Facebook', views: 12000, engagement: 8.7 },
      { title: 'Behind the Scenes', platform: 'Instagram', views: 15600, engagement: 7.8 },
      { title: 'Industry Insights', platform: 'Twitter', views: 4200, engagement: 6.5 },
      { title: 'Monthly Newsletter', platform: 'Email', views: 3200, engagement: 12.1 }
    ]
  };

  useEffect(() => {
    // Set mock data for demo
    setAnalyticsData(mockAnalyticsData);
    setLoading(false);
  }, [dateRange, selectedPlatform]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <ContentManager fallback={
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600">You don't have permission to view analytics.</p>
            </div>
          </div>
        </AppShell>
      }>
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics...</p>
            </div>
          </div>
        </AppShell>
      </ContentManager>
    );
  }

  return (
    <ContentManager fallback={
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to view analytics.</p>
          </div>
        </div>
      </AppShell>
    }>
      <AppShell>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Track performance and ROI across all your content and platforms
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                {[
                  { key: '7d', label: '7 Days' },
                  { key: '30d', label: '30 Days' },
                  { key: '90d', label: '90 Days' },
                  { key: '1y', label: '1 Year' }
                ].map((range) => (
                  <button
                    key={range.key}
                    onClick={() => setDateRange(range.key as any)}
                    className={`px-3 py-1 text-sm font-medium rounded ${
                      dateRange === range.key
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <button className="btn-primary">
                Export Data
              </button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-lg">👁️</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(analyticsData?.contentPerformance.reduce((sum, item) => sum + item.views, 0) || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 text-lg">💬</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData ? (analyticsData.contentPerformance.reduce((sum, item) => sum + item.engagement, 0) / analyticsData.contentPerformance.length).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <span className="text-yellow-600 text-lg">💰</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">ROI</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData ? analyticsData.roiData[analyticsData.roiData.length - 1]?.roi || 0 : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 text-lg">📈</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Growth</p>
                    <p className="text-2xl font-bold text-gray-900">+12.5%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Content Performance Chart */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Content Performance</h3>
                <p className="card-description">Views and engagement over time</p>
              </div>
              <div className="card-content">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData?.contentPerformance || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={2} />
                      <Line type="monotone" dataKey="engagement" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Platform Metrics Chart */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Platform Performance</h3>
                <p className="card-description">Engagement by platform</p>
              </div>
              <div className="card-content">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData?.platformMetrics || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="platform" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="engagement" fill="#3B82F6" />
                      <Bar dataKey="reach" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* ROI and Content Type Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* ROI Tracking Chart */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">ROI Tracking</h3>
                <p className="card-description">Revenue vs Cost over time</p>
              </div>
              <div className="card-content">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData?.roiData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10B981" fill="#10B981" />
                      <Area type="monotone" dataKey="cost" stackId="2" stroke="#EF4444" fill="#EF4444" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Content Types Distribution */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Content Types</h3>
                <p className="card-description">Distribution by content type</p>
              </div>
              <div className="card-content">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData?.contentTypes || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(analyticsData?.contentTypes || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Top Content and Platform Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Content */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Top Performing Content</h3>
                <p className="card-description">Best performing content pieces</p>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {analyticsData?.topContent.map((content, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                          <span className="text-primary-600 font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{content.title}</p>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getPlatformIcon(content.platform)}</span>
                            <span className="text-sm text-gray-600">{content.platform}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatNumber(content.views)} views</p>
                        <p className="text-sm text-gray-600">{content.engagement}% engagement</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Platform Details */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Platform Details</h3>
                <p className="card-description">Detailed metrics by platform</p>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {analyticsData?.platformMetrics.map((platform, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getPlatformIcon(platform.platform)}</span>
                          <h4 className="font-medium text-gray-900">{platform.platform}</h4>
                        </div>
                        <span className="text-sm font-medium text-primary-600">
                          {platform.engagement}% engagement
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Followers</p>
                          <p className="font-medium text-gray-900">{formatNumber(platform.followers)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Reach</p>
                          <p className="font-medium text-gray-900">{formatNumber(platform.reach)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Impressions</p>
                          <p className="font-medium text-gray-900">{formatNumber(platform.impressions)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ContentManager>
  );
}
