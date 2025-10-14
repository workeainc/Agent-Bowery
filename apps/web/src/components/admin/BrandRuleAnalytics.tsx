'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface BrandRuleAnalyticsProps {
  organizationId?: string;
}

interface AnalyticsData {
  totalRules: number;
  activeRules: number;
  violationsBySeverity: Record<string, number>;
  topViolatingRules: Array<{
    ruleId: string;
    ruleName: string;
    violationCount: number;
  }>;
  complianceTrends: Array<{
    date: string;
    complianceRate: number;
    violations: number;
  }>;
}

export default function BrandRuleAnalytics({ organizationId }: BrandRuleAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiClient.getBrandRuleAnalytics(organizationId);
      setAnalyticsData(data);
    } catch (err: any) {
      console.error('Failed to load brand rule analytics:', err);
      setError(err.message || 'Failed to load brand rule analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [organizationId]);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    if (rate >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Analytics</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Brand Rule Analytics</h3>
          <p className="text-sm text-gray-600">
            Insights into brand rule performance and compliance
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Rules</p>
              <p className="text-2xl font-semibold text-gray-900">{analyticsData.totalRules}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Rules</p>
              <p className="text-2xl font-semibold text-gray-900">{analyticsData.activeRules}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analyticsData.complianceTrends.length > 0 
                  ? `${Math.round(analyticsData.complianceTrends[analyticsData.complianceTrends.length - 1].complianceRate)}%`
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Violations by Severity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Violations by Severity</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(analyticsData.violationsBySeverity).map(([severity, count]) => (
            <div key={severity} className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(severity)}`}>
                {severity.toUpperCase()}
              </div>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{count}</p>
              <p className="text-sm text-gray-600">violations</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Violating Rules */}
      {analyticsData.topViolatingRules.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Top Violating Rules</h4>
          <div className="space-y-3">
            {analyticsData.topViolatingRules.map((rule, index) => (
              <div key={rule.ruleId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-red-600">{index + 1}</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{rule.ruleName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-red-600">{rule.violationCount}</p>
                  <p className="text-xs text-gray-600">violations</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Trends */}
      {analyticsData.complianceTrends.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Compliance Trends</h4>
          <div className="space-y-3">
            {analyticsData.complianceTrends.slice(-7).map((trend, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(trend.date).toLocaleDateString()}
                    </span>
                    <span className={`text-sm font-medium ${getComplianceColor(trend.complianceRate)}`}>
                      {Math.round(trend.complianceRate)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getComplianceColor(trend.complianceRate).replace('text-', 'bg-')}`}
                      style={{ width: `${trend.complianceRate}%` }}
                    ></div>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-sm text-gray-600">{trend.violations} violations</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
