'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export default function TemplatePerformanceAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTuningModal, setShowTuningModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [tuningForm, setTuningForm] = useState({
    performanceThreshold: 80,
    autoOptimization: true,
    optimizationRules: [] as Array<{ condition: string; action: string; priority: number }>,
  });

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsResult, recommendationsResult] = await Promise.all([
        apiClient.getTemplatePerformanceAnalytics(),
        apiClient.getTemplateRecommendations(),
      ]);

      setAnalytics(analyticsResult);
      setRecommendations(recommendationsResult);
    } catch (err: any) {
      console.error('Failed to load template analytics:', err);
      setError(err.message || 'Failed to load template analytics');
    } finally {
      setLoading(false);
    }
  };

  const updateTuningSettings = async () => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.updateTemplatePerformanceTuning({
        templateId: selectedTemplate.templateId,
        tuningSettings: tuningForm,
      });

      if (result.success) {
        await loadAnalytics(); // Reload analytics
        setShowTuningModal(false);
        setSelectedTemplate(null);
      }
    } catch (err: any) {
      console.error('Failed to update tuning settings:', err);
      setError(err.message || 'Failed to update tuning settings');
    } finally {
      setLoading(false);
    }
  };

  const openTuningModal = (template: any) => {
    setSelectedTemplate(template);
    setTuningForm({
      performanceThreshold: 80,
      autoOptimization: true,
      optimizationRules: [],
    });
    setShowTuningModal(true);
  };

  const addOptimizationRule = () => {
    setTuningForm({
      ...tuningForm,
      optimizationRules: [
        ...tuningForm.optimizationRules,
        { condition: '', action: '', priority: 1 },
      ],
    });
  };

  const updateOptimizationRule = (index: number, field: string, value: any) => {
    const newRules = [...tuningForm.optimizationRules];
    newRules[index] = { ...newRules[index], [field]: value };
    setTuningForm({ ...tuningForm, optimizationRules: newRules });
  };

  const removeOptimizationRule = (index: number) => {
    setTuningForm({
      ...tuningForm,
      optimizationRules: tuningForm.optimizationRules.filter((_, i) => i !== index),
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRecommendationTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization': return '🔧';
      case 'performance': return '⚡';
      case 'usage': return '📊';
      default: return '💡';
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Template Performance Analytics</h3>
          <p className="text-sm text-gray-600">Analyze template performance and get optimization recommendations</p>
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
      {analytics && (
        <div className="space-y-6">
          {/* Overview Metrics */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Performance Overview</h4>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{formatNumber(analytics.overview.totalTemplates)}</div>
                  <div className="text-sm text-gray-600">Total Templates</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatNumber(analytics.overview.activeTemplates)}</div>
                  <div className="text-sm text-gray-600">Active Templates</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className={`text-2xl font-bold ${getPerformanceColor(analytics.overview.averagePerformance)}`}>
                    {analytics.overview.averagePerformance}%
                  </div>
                  <div className="text-sm text-gray-600">Avg. Performance</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{analytics.overview.topPerformingTemplate}</div>
                  <div className="text-sm text-gray-600">Top Performer</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">{analytics.overview.worstPerformingTemplate}</div>
                  <div className="text-sm text-gray-600">Needs Improvement</div>
                </div>
              </div>
            </div>
          </div>

          {/* Template Performance */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Template Performance</h4>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                {analytics.templates.map((template: any, index: number) => (
                  <div key={template.templateId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h5 className="font-medium text-gray-900">{template.templateName}</h5>
                          <p className="text-sm text-gray-600">ID: {template.templateId}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className={`text-sm font-medium ${getPerformanceColor(template.performanceScore)}`}>
                            {template.performanceScore}%
                          </div>
                          <div className="text-xs text-gray-500">Performance</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{formatNumber(template.usageCount)}</div>
                          <div className="text-xs text-gray-500">Usage</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{template.successRate}%</div>
                          <div className="text-xs text-gray-500">Success Rate</div>
                        </div>
                        <button
                          onClick={() => openTuningModal(template)}
                          className="btn-secondary text-xs"
                        >
                          Tune
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Average Engagement</label>
                        <div className="text-gray-900">{template.averageEngagement}%</div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Last Used</label>
                        <div className="text-gray-900">{formatDate(template.lastUsed)}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Performance Score</label>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              template.performanceScore >= 80 ? 'bg-green-600' :
                              template.performanceScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${template.performanceScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {analytics.templates.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">📊</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Template Data</h3>
                    <p className="text-gray-600">No template performance data is available.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trends */}
          {analytics.trends && analytics.trends.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Performance Trends</h4>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  {analytics.trends.slice(-7).map((trend: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        {formatDate(trend.date)}
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{formatNumber(trend.templatesUsed)}</div>
                          <div className="text-xs text-gray-500">Templates Used</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${getPerformanceColor(trend.averagePerformance)}`}>
                            {trend.averagePerformance}%
                          </div>
                          <div className="text-xs text-gray-500">Avg. Performance</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{trend.topTemplate}</div>
                          <div className="text-xs text-gray-500">Top Template</div>
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

      {/* Recommendations */}
      {recommendations && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">AI Recommendations</h4>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {/* Template Recommendations */}
              {recommendations.recommendations.map((rec: any, index: number) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  rec.priority === 'high' ? 'bg-red-50 border-red-200' :
                  rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getRecommendationTypeIcon(rec.type)}</span>
                      <div className="font-medium text-gray-900">{rec.templateName}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(rec.priority)}`}>
                      {rec.priority} priority
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 mb-2">{rec.message}</div>
                  <div className="text-sm text-gray-600">
                    <strong>Suggested Action:</strong> {rec.suggestedAction}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Expected Impact:</strong> {rec.expectedImpact}
                  </div>
                </div>
              ))}

              {/* General Insights */}
              {recommendations.insights.map((insight: any, index: number) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  insight.impact === 'high' ? 'bg-blue-50 border-blue-200' :
                  insight.impact === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600 text-lg">💡</span>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">{insight.category}</h5>
                      <p className="text-sm text-gray-700 mb-2">{insight.insight}</p>
                      <p className="text-sm text-gray-600">
                        <strong>Recommendation:</strong> {insight.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tuning Modal */}
      {showTuningModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Tune Template: {selectedTemplate.templateName}
                </h2>
                <button
                  onClick={() => setShowTuningModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Performance Threshold (%)
                    </label>
                    <input
                      type="number"
                      value={tuningForm.performanceThreshold}
                      onChange={(e) => setTuningForm({ ...tuningForm, performanceThreshold: parseInt(e.target.value) })}
                      className="input w-full"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={tuningForm.autoOptimization}
                      onChange={(e) => setTuningForm({ ...tuningForm, autoOptimization: e.target.checked })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm text-gray-700">Enable Auto-Optimization</label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Optimization Rules
                    </label>
                    <button
                      onClick={addOptimizationRule}
                      className="btn-secondary text-xs"
                    >
                      Add Rule
                    </button>
                  </div>
                  <div className="space-y-2">
                    {tuningForm.optimizationRules.map((rule, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">Rule {index + 1}</h4>
                          <button
                            onClick={() => removeOptimizationRule(index)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Condition
                            </label>
                            <input
                              type="text"
                              value={rule.condition}
                              onChange={(e) => updateOptimizationRule(index, 'condition', e.target.value)}
                              className="input w-full text-sm"
                              placeholder="performance < 70"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Action
                            </label>
                            <input
                              type="text"
                              value={rule.action}
                              onChange={(e) => updateOptimizationRule(index, 'action', e.target.value)}
                              className="input w-full text-sm"
                              placeholder="optimize_content"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Priority
                            </label>
                            <select
                              value={rule.priority}
                              onChange={(e) => updateOptimizationRule(index, 'priority', parseInt(e.target.value))}
                              className="input w-full text-sm"
                            >
                              <option value={1}>Low (1)</option>
                              <option value={2}>Medium (2)</option>
                              <option value={3}>High (3)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowTuningModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={updateTuningSettings}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Updating...' : 'Update Tuning'}
              </button>
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
        <h4 className="font-medium text-indigo-900 mb-2">Template Performance Analytics</h4>
        <div className="space-y-2 text-sm text-indigo-800">
          <div className="flex items-start space-x-2">
            <span className="text-indigo-600 text-lg">📊</span>
            <div>
              <p className="font-medium">Performance Tracking</p>
              <p>Monitor template performance metrics including usage, success rates, and engagement.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-indigo-600 text-lg">🔧</span>
            <div>
              <p className="font-medium">Performance Tuning</p>
              <p>Configure optimization rules and thresholds to improve template performance.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-indigo-600 text-lg">🤖</span>
            <div>
              <p className="font-medium">AI Recommendations</p>
              <p>Get intelligent recommendations for optimizing template performance and usage.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-indigo-600 text-lg">📈</span>
            <div>
              <p className="font-medium">Trend Analysis</p>
              <p>Track performance trends over time to identify patterns and optimization opportunities.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
