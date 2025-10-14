'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface BrandRuleEnforcementProps {
  contentId: string;
  organizationId?: string;
  onEnforcementComplete?: (result: any) => void;
}

interface EnforcementResult {
  success: boolean;
  enforcedRules: Array<{
    ruleId: string;
    ruleName: string;
    action: string;
    result: string;
  }>;
  modifiedContent?: string;
  message: string;
}

export default function BrandRuleEnforcement({ 
  contentId, 
  organizationId, 
  onEnforcementComplete 
}: BrandRuleEnforcementProps) {
  const [enforcementResult, setEnforcementResult] = useState<EnforcementResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModifiedContent, setShowModifiedContent] = useState(false);

  const enforceRules = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.enforceBrandRules(contentId, organizationId);
      setEnforcementResult(result);
      
      if (onEnforcementComplete) {
        onEnforcementComplete(result);
      }
    } catch (err: any) {
      console.error('Failed to enforce brand rules:', err);
      setError(err.message || 'Failed to enforce brand rules');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'replace': return '🔄';
      case 'remove': return '🗑️';
      case 'add': return '➕';
      case 'modify': return '✏️';
      case 'format': return '📝';
      default: return '⚙️';
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'replace': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'remove': return 'bg-red-100 text-red-800 border-red-200';
      case 'add': return 'bg-green-100 text-green-800 border-green-200';
      case 'modify': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'format': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Enforcement Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Brand Rule Enforcement</h3>
          <p className="text-sm text-gray-600">
            Automatically apply brand rules to content
          </p>
        </div>
        <button
          onClick={enforceRules}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Enforcing...' : 'Enforce Rules'}
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
              <h3 className="text-sm font-medium text-red-800">Enforcement Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enforcement Results */}
      {enforcementResult && (
        <div className="space-y-4">
          {/* Success Message */}
          <div className={`border rounded-lg p-4 ${enforcementResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {enforcementResult.success ? (
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h4 className={`text-lg font-medium ${enforcementResult.success ? 'text-green-900' : 'text-red-900'}`}>
                  {enforcementResult.success ? 'Rules Enforced Successfully' : 'Enforcement Failed'}
                </h4>
                <p className={`mt-1 ${enforcementResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {enforcementResult.message}
                </p>
              </div>
            </div>
          </div>

          {/* Enforced Rules */}
          {enforcementResult.enforcedRules.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Enforced Rules ({enforcementResult.enforcedRules.length})
              </h4>
              <div className="space-y-3">
                {enforcementResult.enforcedRules.map((rule, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${getActionColor(rule.action)}`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <span className="text-lg">{getActionIcon(rule.action)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">{rule.ruleName}</h5>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(rule.action)}`}>
                            {rule.action.toUpperCase()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{rule.result}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modified Content */}
          {enforcementResult.modifiedContent && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">Modified Content</h4>
                <button
                  onClick={() => setShowModifiedContent(!showModifiedContent)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {showModifiedContent ? 'Hide' : 'Show'} Content
                </button>
              </div>
              
              {showModifiedContent && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {enforcementResult.modifiedContent}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* No Rules Applied */}
          {enforcementResult.success && enforcementResult.enforcedRules.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-lg font-medium text-blue-900">No Rules Applied</h4>
                  <p className="text-blue-700 mt-1">
                    Content already complies with all brand rules. No modifications were needed.
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
