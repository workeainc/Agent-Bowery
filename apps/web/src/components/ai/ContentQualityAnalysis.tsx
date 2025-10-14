'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface ContentQualityAnalysisProps {
  contentId?: string;
  onAnalysisComplete?: (analysis: any) => void;
}

export default function ContentQualityAnalysis({ contentId, onAnalysisComplete }: ContentQualityAnalysisProps) {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [brandComplianceResult, setBrandComplianceResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'quality' | 'brand'>('quality');

  const analyzeQuality = async () => {
    if (!contentId) {
      setError('Content ID is required for quality analysis');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.analyzeContentQuality(contentId);
      setAnalysisResult(result);

      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err: any) {
      console.error('Failed to analyze content quality:', err);
      setError(err.message || 'Failed to analyze content quality');
    } finally {
      setLoading(false);
    }
  };

  const validateBrandCompliance = async () => {
    if (!contentId) {
      setError('Content ID is required for brand compliance validation');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.validateBrandCompliance(contentId);
      setBrandComplianceResult(result);

      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err: any) {
      console.error('Failed to validate brand compliance:', err);
      setError(err.message || 'Failed to validate brand compliance');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreText = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Content Quality Analysis</h3>
        <p className="text-sm text-gray-600">Analyze content quality and brand compliance</p>
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
                onChange={(e) => {
                  // This would need to be handled by parent component
                  // For now, we'll just show the current value
                }}
                className="input w-full"
                placeholder="Enter content ID for analysis..."
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
            onClick={() => setActiveTab('quality')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'quality'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Quality Analysis
          </button>
          <button
            onClick={() => setActiveTab('brand')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'brand'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🏷️ Brand Compliance
          </button>
        </nav>
      </div>

      {/* Quality Analysis Tab */}
      {activeTab === 'quality' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Content Quality Analysis</h4>
              <p className="text-sm text-gray-600">Analyze readability, engagement, and overall quality</p>
            </div>
            <button
              onClick={analyzeQuality}
              disabled={loading || !contentId}
              className="btn-primary"
            >
              {loading ? 'Analyzing...' : 'Analyze Quality'}
            </button>
          </div>

          {/* Quality Analysis Results */}
          {analysisResult && (
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Quality Analysis Results</h4>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm px-3 py-1 rounded-full ${getScoreColor(analysisResult.overallScore)}`}>
                    {getScoreText(analysisResult.overallScore)} ({analysisResult.overallScore}/100)
                  </span>
                </div>
              </div>
              <div className="card-content">
                <div className="space-y-6">
                  {/* Score Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{analysisResult.readability}</div>
                      <div className="text-sm text-gray-600">Readability</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{analysisResult.engagement}</div>
                      <div className="text-sm text-gray-600">Engagement</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{analysisResult.brandCompliance}</div>
                      <div className="text-sm text-gray-600">Brand Compliance</div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Suggestions</h5>
                      <div className="space-y-3">
                        {analysisResult.suggestions.map((suggestion: any, index: number) => (
                          <div key={index} className={`border rounded-lg p-3 ${
                            suggestion.type === 'error' ? 'border-red-200 bg-red-50' :
                            suggestion.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                            'border-blue-200 bg-blue-50'
                          }`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(suggestion.priority)}`}>
                                  {suggestion.priority} priority
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  suggestion.type === 'error' ? 'text-red-600 bg-red-100' :
                                  suggestion.type === 'warning' ? 'text-yellow-600 bg-yellow-100' :
                                  'text-blue-600 bg-blue-100'
                                }`}>
                                  {suggestion.type}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-800">{suggestion.message}</p>
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

      {/* Brand Compliance Tab */}
      {activeTab === 'brand' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Brand Compliance Validation</h4>
              <p className="text-sm text-gray-600">Check content against brand guidelines and rules</p>
            </div>
            <button
              onClick={validateBrandCompliance}
              disabled={loading || !contentId}
              className="btn-primary"
            >
              {loading ? 'Validating...' : 'Validate Compliance'}
            </button>
          </div>

          {/* Brand Compliance Results */}
          {brandComplianceResult && (
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Brand Compliance Results</h4>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    brandComplianceResult.isCompliant ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                  }`}>
                    {brandComplianceResult.isCompliant ? 'Compliant' : 'Non-Compliant'}
                  </span>
                  <span className={`text-sm px-3 py-1 rounded-full ${getScoreColor(brandComplianceResult.score)}`}>
                    Score: {brandComplianceResult.score}/100
                  </span>
                </div>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {brandComplianceResult.violations && brandComplianceResult.violations.length > 0 ? (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Compliance Violations</h5>
                      <div className="space-y-3">
                        {brandComplianceResult.violations.map((violation: any, index: number) => (
                          <div key={index} className="border border-red-200 rounded-lg p-3 bg-red-50">
                            <div className="flex items-start justify-between mb-2">
                              <div className="font-medium text-red-800">{violation.rule}</div>
                              <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(violation.severity)}`}>
                                {violation.severity} severity
                              </span>
                            </div>
                            <p className="text-sm text-red-700 mb-2">{violation.message}</p>
                            <p className="text-sm text-red-600">
                              <strong>Suggestion:</strong> {violation.suggestion}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-green-600 text-2xl mb-2">✅</div>
                      <p className="text-green-800 font-medium">No violations found!</p>
                      <p className="text-green-600 text-sm">Content complies with all brand guidelines.</p>
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Content Quality Analysis</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">📊</span>
            <div>
              <p className="font-medium">Quality Metrics</p>
              <p>Analyze readability, engagement potential, and overall content quality.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">🏷️</span>
            <div>
              <p className="font-medium">Brand Compliance</p>
              <p>Validate content against brand guidelines, tone, and messaging standards.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">💡</span>
            <div>
              <p className="font-medium">AI Suggestions</p>
              <p>Get actionable suggestions to improve content quality and compliance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
