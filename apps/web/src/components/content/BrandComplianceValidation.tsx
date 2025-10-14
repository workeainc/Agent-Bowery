'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface BrandComplianceValidationProps {
  contentId: string;
  organizationId?: string;
  onValidationComplete?: (result: any) => void;
}

interface ValidationResult {
  compliant: boolean;
  violations: Array<{
    ruleId: string;
    ruleName: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    suggestions: string[];
  }>;
  score: number;
  recommendations: string[];
}

export default function BrandComplianceValidation({ 
  contentId, 
  organizationId, 
  onValidationComplete 
}: BrandComplianceValidationProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateCompliance = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.validateBrandCompliance(contentId, organizationId);
      setValidationResult(result);
      
      if (onValidationComplete) {
        onValidationComplete(result);
      }
    } catch (err: any) {
      console.error('Failed to validate brand compliance:', err);
      setError(err.message || 'Failed to validate brand compliance');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return '✅';
      case 'medium': return '⚠️';
      case 'high': return '🚨';
      case 'critical': return '🛑';
      default: return 'ℹ️';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Validation Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Brand Compliance Validation</h3>
          <p className="text-sm text-gray-600">
            Check content against brand rules and guidelines
          </p>
        </div>
        <button
          onClick={validateCompliance}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Validating...' : 'Validate Compliance'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Validation Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Results */}
      {validationResult && (
        <div className="space-y-4">
          {/* Compliance Score */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900">Compliance Score</h4>
                <p className="text-sm text-gray-600">
                  {validationResult.compliant ? 'Content is compliant' : 'Content has violations'}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${getScoreColor(validationResult.score)}`}>
                  {validationResult.score}%
                </div>
                <div className="text-sm text-gray-600">
                  {validationResult.compliant ? 'Compliant' : 'Non-compliant'}
                </div>
              </div>
            </div>
          </div>

          {/* Violations */}
          {validationResult.violations.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Violations ({validationResult.violations.length})
              </h4>
              <div className="space-y-3">
                {validationResult.violations.map((violation, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${getSeverityColor(violation.severity)}`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <span className="text-lg">{getSeverityIcon(violation.severity)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">{violation.ruleName}</h5>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(violation.severity)}`}>
                            {violation.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{violation.message}</p>
                        
                        {/* Suggestions */}
                        {violation.suggestions.length > 0 && (
                          <div className="mt-3">
                            <h6 className="text-sm font-medium mb-2">Suggestions:</h6>
                            <ul className="text-sm space-y-1">
                              {violation.suggestions.map((suggestion, suggestionIndex) => (
                                <li key={suggestionIndex} className="flex items-start">
                                  <span className="text-blue-500 mr-2">•</span>
                                  <span>{suggestion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {validationResult.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-blue-900 mb-4">
                Recommendations
              </h4>
              <ul className="space-y-2">
                {validationResult.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">💡</span>
                    <span className="text-blue-800">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Message */}
          {validationResult.compliant && validationResult.violations.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-lg font-medium text-green-900">Content is Compliant</h4>
                  <p className="text-green-700 mt-1">
                    This content meets all brand guidelines and requirements.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
