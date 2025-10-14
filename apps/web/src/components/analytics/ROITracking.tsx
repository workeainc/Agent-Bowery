'use client';

import { useState, useEffect } from 'react';
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

interface ROIData {
  period: string;
  revenue: number;
  cost: number;
  profit: number;
  roi: number;
  conversions: number;
  leads: number;
  cpa: number;
  cpl: number;
  ltv: number;
}

interface ROITrackingProps {
  onROIUpdate?: (roi: ROIData) => void;
}

export default function ROITracking({ onROIUpdate }: ROITrackingProps) {
  const [roiData, setRoiData] = useState<ROIData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'cost' | 'profit' | 'roi'>('roi');
  const [totalROI, setTotalROI] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  // Mock data for demonstration
  const mockROIData: ROIData[] = [
    {
      period: '2024-01',
      revenue: 15000,
      cost: 5000,
      profit: 10000,
      roi: 200,
      conversions: 45,
      leads: 120,
      cpa: 111,
      cpl: 42,
      ltv: 333
    },
    {
      period: '2024-02',
      revenue: 18000,
      cost: 6000,
      profit: 12000,
      roi: 200,
      conversions: 52,
      leads: 140,
      cpa: 115,
      cpl: 43,
      ltv: 346
    },
    {
      period: '2024-03',
      revenue: 22000,
      cost: 7000,
      profit: 15000,
      roi: 214,
      conversions: 68,
      leads: 165,
      cpa: 103,
      cpl: 42,
      ltv: 324
    },
    {
      period: '2024-04',
      revenue: 19000,
      cost: 5500,
      profit: 13500,
      roi: 245,
      conversions: 58,
      leads: 145,
      cpa: 95,
      cpl: 38,
      ltv: 328
    },
    {
      period: '2024-05',
      revenue: 25000,
      cost: 8000,
      profit: 17000,
      roi: 213,
      conversions: 78,
      leads: 195,
      cpa: 103,
      cpl: 41,
      ltv: 321
    },
    {
      period: '2024-06',
      revenue: 28000,
      cost: 9000,
      profit: 19000,
      roi: 211,
      conversions: 89,
      leads: 220,
      cpa: 101,
      cpl: 41,
      ltv: 315
    }
  ];

  useEffect(() => {
    setRoiData(mockROIData);
    
    // Calculate totals
    const totalRev = mockROIData.reduce((sum, item) => sum + item.revenue, 0);
    const totalCosts = mockROIData.reduce((sum, item) => sum + item.cost, 0);
    const totalROI = totalCosts > 0 ? ((totalRev - totalCosts) / totalCosts) * 100 : 0;
    
    setTotalRevenue(totalRev);
    setTotalCost(totalCosts);
    setTotalROI(totalROI);
  }, [selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getROIColor = (roi: number) => {
    if (roi >= 200) return 'text-green-600';
    if (roi >= 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getROIBgColor = (roi: number) => {
    if (roi >= 200) return 'bg-green-100';
    if (roi >= 100) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">ROI Tracking</h2>
          <p className="text-gray-600 mt-1">
            Track return on investment and campaign profitability
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {[
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: '90d', label: '90 Days' },
              { key: '1y', label: '1 Year' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key as any)}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  selectedPeriod === period.key
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key ROI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 text-lg">💸</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCost)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📈</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total ROI</p>
                <p className={`text-2xl font-bold ${getROIColor(totalROI)}`}>
                  {totalROI.toFixed(1)}%
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
                  <span className="text-purple-600 text-lg">💎</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalRevenue - totalCost)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROI Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROI Trends */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="card-title">ROI Trends</h3>
                <p className="card-description">Return on investment over time</p>
              </div>
              <div className="flex space-x-2">
                {[
                  { key: 'revenue', label: 'Revenue' },
                  { key: 'cost', label: 'Cost' },
                  { key: 'profit', label: 'Profit' },
                  { key: 'roi', label: 'ROI' }
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
                <LineChart data={roiData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => activeMetric === 'roi' ? `${value}%` : formatCurrency(value as number)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={activeMetric}
                    stroke={activeMetric === 'roi' ? '#10B981' : '#3B82F6'}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Revenue vs Cost */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Revenue vs Cost</h3>
            <p className="card-description">Monthly comparison</p>
          </div>
          <div className="card-content">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={roiData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10B981" fill="#10B981" />
                  <Area type="monotone" dataKey="cost" stackId="2" stroke="#EF4444" fill="#EF4444" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Conversion Metrics</h3>
            <p className="card-description">Lead to conversion funnel</p>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {roiData.slice(-1)[0] && (
                <>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold">L</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Leads Generated</p>
                        <p className="text-sm text-gray-600">Total leads from campaigns</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{roiData.slice(-1)[0].leads}</p>
                      <p className="text-sm text-gray-600">leads</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-green-600 font-bold">C</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Conversions</p>
                        <p className="text-sm text-gray-600">Leads converted to customers</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{roiData.slice(-1)[0].conversions}</p>
                      <p className="text-sm text-gray-600">conversions</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-purple-600 font-bold">%</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Conversion Rate</p>
                        <p className="text-sm text-gray-600">Leads to customers ratio</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {roiData.slice(-1)[0].leads > 0 ? ((roiData.slice(-1)[0].conversions / roiData.slice(-1)[0].leads) * 100).toFixed(1) : 0}%
                      </p>
                      <p className="text-sm text-gray-600">rate</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Cost Metrics */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Cost Metrics</h3>
            <p className="card-description">Cost per acquisition and lead</p>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {roiData.slice(-1)[0] && (
                <>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <span className="text-yellow-600 font-bold">$</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Cost Per Acquisition</p>
                        <p className="text-sm text-gray-600">Average cost to acquire a customer</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(roiData.slice(-1)[0].cpa)}</p>
                      <p className="text-sm text-gray-600">CPA</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold">$</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Cost Per Lead</p>
                        <p className="text-sm text-gray-600">Average cost to generate a lead</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(roiData.slice(-1)[0].cpl)}</p>
                      <p className="text-sm text-gray-600">CPL</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-green-600 font-bold">$</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Lifetime Value</p>
                        <p className="text-sm text-gray-600">Average customer lifetime value</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(roiData.slice(-1)[0].ltv)}</p>
                      <p className="text-sm text-gray-600">LTV</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ROI Summary Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">ROI Summary</h3>
          <p className="card-description">Detailed ROI breakdown by period</p>
        </div>
        <div className="card-content">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leads</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roiData.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.period}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.revenue)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.cost)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.profit)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getROIBgColor(item.roi)} ${getROIColor(item.roi)}`}>
                        {item.roi.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.conversions}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.leads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
