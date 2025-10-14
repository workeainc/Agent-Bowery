'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface PlatformPublishingOptionsProps {
  platformId?: string;
  accountId?: string;
  onOptionsUpdate?: (options: any) => void;
}

export default function PlatformPublishingOptions({ platformId, accountId, onOptionsUpdate }: PlatformPublishingOptionsProps) {
  const [publishingOptions, setPublishingOptions] = useState<any>(null);
  const [limitations, setLimitations] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatformId, setSelectedPlatformId] = useState(platformId || '');
  const [selectedAccountId, setSelectedAccountId] = useState(accountId || '');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationContent, setValidationContent] = useState({
    type: '',
    data: {} as Record<string, any>,
  });
  const [validationResult, setValidationResult] = useState<any>(null);

  const loadPublishingOptions = async () => {
    if (!selectedPlatformId.trim()) {
      setError('Platform ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [optionsResult, limitationsResult] = await Promise.all([
        apiClient.getPlatformPublishingOptions(selectedPlatformId, selectedAccountId || undefined),
        apiClient.getPlatformLimitations(selectedPlatformId),
      ]);

      setPublishingOptions(optionsResult);
      setLimitations(limitationsResult);

      if (onOptionsUpdate) {
        onOptionsUpdate(optionsResult);
      }
    } catch (err: any) {
      console.error('Failed to load publishing options:', err);
      setError(err.message || 'Failed to load publishing options');
    } finally {
      setLoading(false);
    }
  };

  const validateContent = async () => {
    if (!selectedPlatformId.trim() || !selectedAccountId.trim()) {
      setError('Platform ID and Account ID are required for validation');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.validatePlatformContent(selectedPlatformId, selectedAccountId, validationContent);
      setValidationResult(result);
    } catch (err: any) {
      console.error('Failed to validate content:', err);
      setError(err.message || 'Failed to validate content');
    } finally {
      setLoading(false);
    }
  };

  const getPublishingTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'link': return '🔗';
      case 'poll': return '📊';
      case 'story': return '📖';
      default: return '📄';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  useEffect(() => {
    if (platformId) {
      setSelectedPlatformId(platformId);
      if (accountId) {
        setSelectedAccountId(accountId);
      }
      loadPublishingOptions();
    }
  }, [platformId, accountId]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Platform Publishing Options</h3>
        <p className="text-sm text-gray-600">Explore platform-specific publishing capabilities and constraints</p>
      </div>

      {/* Platform and Account Input */}
      <div className="card">
        <div className="card-content">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform ID
                </label>
                <input
                  type="text"
                  value={selectedPlatformId}
                  onChange={(e) => setSelectedPlatformId(e.target.value)}
                  className="input w-full"
                  placeholder="Enter platform ID..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account ID (Optional)
                </label>
                <input
                  type="text"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="input w-full"
                  placeholder="Enter account ID for account-specific options..."
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={loadPublishingOptions}
                disabled={loading || !selectedPlatformId.trim()}
                className="btn-primary"
              >
                {loading ? 'Loading...' : 'Load Options'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Publishing Options Results */}
      {publishingOptions && (
        <div className="space-y-6">
          {/* Publishing Options */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Publishing Options</h4>
              {selectedAccountId && (
                <button
                  onClick={() => setShowValidationModal(true)}
                  className="btn-secondary"
                >
                  Validate Content
                </button>
              )}
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {publishingOptions.publishingOptions.map((option: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getPublishingTypeIcon(option.type)}</span>
                        <div>
                          <h5 className="font-medium text-gray-900">{option.name}</h5>
                          <p className="text-sm text-gray-600">Type: {option.type}</p>
                        </div>
                      </div>
                      {option.required && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Required</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Constraints</h6>
                        <div className="space-y-2 text-sm">
                          {option.constraints.minLength && (
                            <div className="text-gray-600">
                              Min Length: {option.constraints.minLength}
                            </div>
                          )}
                          {option.constraints.maxLength && (
                            <div className="text-gray-600">
                              Max Length: {option.constraints.maxLength}
                            </div>
                          )}
                          {option.constraints.allowedFormats && (
                            <div className="text-gray-600">
                              Formats: {option.constraints.allowedFormats.join(', ')}
                            </div>
                          )}
                          {option.constraints.requiredFields && (
                            <div className="text-gray-600">
                              Required: {option.constraints.requiredFields.join(', ')}
                            </div>
                          )}
                          {option.constraints.optionalFields && (
                            <div className="text-gray-600">
                              Optional: {option.constraints.optionalFields.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Examples</h6>
                        <div className="space-y-2">
                          {option.examples.map((example: any, exampleIndex: number) => (
                            <div key={exampleIndex} className="text-sm bg-gray-50 p-2 rounded">
                              <div className="font-medium text-gray-900">{example.title}</div>
                              <div className="text-gray-600">{example.description}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                <pre>{JSON.stringify(example.content, null, 2)}</pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {publishingOptions.publishingOptions.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">📄</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Publishing Options</h3>
                    <p className="text-gray-600">No publishing options are available for this platform.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account-Specific Options */}
          {publishingOptions.accountSpecificOptions && (
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Account-Specific Options</h4>
              </div>
              <div className="card-content">
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <pre>{JSON.stringify(publishingOptions.accountSpecificOptions, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Platform Limitations */}
          {limitations && (
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Platform Limitations</h4>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {/* Rate Limits */}
                  {limitations.limitations.rateLimits.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Rate Limits</h5>
                      <div className="space-y-2">
                        {limitations.limitations.rateLimits.map((limit: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h6 className="font-medium text-gray-900">{limit.endpoint}</h6>
                              <span className="text-sm text-gray-600">{limit.limit} per {limit.window}</span>
                            </div>
                            <p className="text-sm text-gray-600">{limit.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content Limits */}
                  {limitations.limitations.contentLimits.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Content Limits</h5>
                      <div className="space-y-2">
                        {limitations.limitations.contentLimits.map((limit: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h6 className="font-medium text-gray-900">{limit.type}</h6>
                              <div className="text-sm text-gray-600">
                                {limit.maxSize && <span>Max Size: {limit.maxSize}</span>}
                                {limit.maxLength && <span>Max Length: {limit.maxLength}</span>}
                                {limit.allowedFormats && <span>Formats: {limit.allowedFormats.join(', ')}</span>}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{limit.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Account Limits */}
                  {limitations.limitations.accountLimits.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Account Limits</h5>
                      <div className="space-y-2">
                        {limitations.limitations.accountLimits.map((limit: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h6 className="font-medium text-gray-900">{limit.limit}</h6>
                              <span className="text-sm text-gray-600">{limit.value}</span>
                            </div>
                            <p className="text-sm text-gray-600">{limit.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Platform Info */}
          <div className="text-sm text-gray-500 text-center">
            Platform ID: {publishingOptions.platformId}
            {publishingOptions.accountId && ` | Account ID: ${publishingOptions.accountId}`}
          </div>
        </div>
      )}

      {/* Content Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Validate Content</h2>
                <button
                  onClick={() => setShowValidationModal(false)}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type
                  </label>
                  <input
                    type="text"
                    value={validationContent.type}
                    onChange={(e) => setValidationContent({ ...validationContent, type: e.target.value })}
                    className="input w-full"
                    placeholder="e.g., text, image, video"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Data (JSON)
                  </label>
                  <textarea
                    value={JSON.stringify(validationContent.data, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setValidationContent({ ...validationContent, data: parsed });
                      } catch {
                        // Invalid JSON, keep the text for user to fix
                      }
                    }}
                    className="input w-full h-40 resize-none font-mono text-sm"
                    placeholder='{"text": "Hello world!", "hashtags": ["#test"]}'
                  />
                </div>

                {validationResult && (
                  <div className="space-y-4">
                    <div className={`p-3 rounded-lg ${
                      validationResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <span className={`text-lg ${validationResult.valid ? 'text-green-600' : 'text-red-600'}`}>
                          {validationResult.valid ? '✅' : '❌'}
                        </span>
                        <span className={`font-medium ${validationResult.valid ? 'text-green-900' : 'text-red-900'}`}>
                          {validationResult.valid ? 'Content is valid' : 'Content has issues'}
                        </span>
                      </div>
                    </div>

                    {validationResult.errors.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Errors</h5>
                        <div className="space-y-2">
                          {validationResult.errors.map((error: any, index: number) => (
                            <div key={index} className={`p-2 rounded ${getSeverityColor(error.severity)}`}>
                              <div className="font-medium">{error.field}</div>
                              <div className="text-sm">{error.message}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {validationResult.suggestions.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Suggestions</h5>
                        <div className="space-y-2">
                          {validationResult.suggestions.map((suggestion: any, index: number) => (
                            <div key={index} className={`p-2 rounded ${getImpactColor(suggestion.impact)}`}>
                              <div className="font-medium">{suggestion.field}</div>
                              <div className="text-sm">{suggestion.suggestion}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowValidationModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                onClick={validateContent}
                disabled={loading || !validationContent.type.trim()}
                className="btn-primary"
              >
                {loading ? 'Validating...' : 'Validate Content'}
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
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-medium text-purple-900 mb-2">Platform Publishing Options</h4>
        <div className="space-y-2 text-sm text-purple-800">
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">📄</span>
            <div>
              <p className="font-medium">Publishing Capabilities</p>
              <p>Explore what types of content can be published to each platform and their constraints.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">🔍</span>
            <div>
              <p className="font-medium">Content Validation</p>
              <p>Validate content against platform-specific rules and constraints before publishing.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">⚠️</span>
            <div>
              <p className="font-medium">Limitations & Constraints</p>
              <p>Understand platform limitations including rate limits, content limits, and account restrictions.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">💡</span>
            <div>
              <p className="font-medium">Best Practices</p>
              <p>Get suggestions and examples for optimal content formatting for each platform.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
