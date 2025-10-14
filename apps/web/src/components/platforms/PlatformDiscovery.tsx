'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export default function PlatformDiscovery() {
  const [platforms, setPlatforms] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const loadPlatforms = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getAvailablePlatforms();
      setPlatforms(result);
    } catch (err: any) {
      console.error('Failed to load platforms:', err);
      setError(err.message || 'Failed to load platforms');
    } finally {
      setLoading(false);
    }
  };

  const showPlatformDetails = (platform: any) => {
    setSelectedPlatform(platform);
    setShowDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'beta': return 'text-yellow-600 bg-yellow-100';
      case 'deprecated': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'social': return '👥';
      case 'blog': return '📝';
      case 'video': return '🎥';
      case 'image': return '🖼️';
      case 'newsletter': return '📧';
      default: return '🌐';
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

  useEffect(() => {
    loadPlatforms();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Platform Discovery</h3>
          <p className="text-sm text-gray-600">Discover available platforms and their capabilities</p>
        </div>
        <button
          onClick={loadPlatforms}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Loading...' : 'Refresh Platforms'}
        </button>
      </div>

      {/* Platforms Grid */}
      {platforms && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platforms.platforms.map((platform: any, index: number) => (
            <div key={platform.id} className="card hover:shadow-lg transition-shadow">
              <div className="card-content">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getTypeIcon(platform.type)}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{platform.name}</h4>
                      <p className="text-sm text-gray-600 capitalize">{platform.type}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(platform.status)}`}>
                    {platform.status}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Features */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Key Features</h5>
                    <div className="space-y-1">
                      {platform.features.slice(0, 3).map((feature: any, featureIndex: number) => (
                        <div key={featureIndex} className="flex items-center space-x-2">
                          <span className={`text-xs ${feature.supported ? 'text-green-600' : 'text-gray-400'}`}>
                            {feature.supported ? '✅' : '❌'}
                          </span>
                          <span className="text-xs text-gray-600">{feature.name}</span>
                        </div>
                      ))}
                      {platform.features.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{platform.features.length - 3} more features
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Publishing Options */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Publishing Types</h5>
                    <div className="flex flex-wrap gap-1">
                      {platform.publishingOptions.slice(0, 4).map((option: any, optionIndex: number) => (
                        <span key={optionIndex} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {getPublishingTypeIcon(option.type)} {option.type}
                        </span>
                      ))}
                      {platform.publishingOptions.length > 4 && (
                        <span className="text-xs text-gray-500">
                          +{platform.publishingOptions.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Connection Requirements */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Connection</h5>
                    <div className="flex flex-wrap gap-1">
                      {platform.connectionRequirements.oauth && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">OAuth</span>
                      )}
                      {platform.connectionRequirements.apiKey && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">API Key</span>
                      )}
                      {platform.connectionRequirements.webhook && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Webhook</span>
                      )}
                      {platform.connectionRequirements.verification && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Verification</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => showPlatformDetails(platform)}
                    className="btn-primary w-full text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Platform Details Modal */}
      {showDetails && selectedPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{getTypeIcon(selectedPlatform.type)}</span>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedPlatform.name}</h2>
                    <p className="text-sm text-gray-600 capitalize">{selectedPlatform.type} Platform</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(selectedPlatform.status)}`}>
                    {selectedPlatform.status}
                  </span>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {/* Features */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedPlatform.features.map((feature: any, index: number) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        feature.supported ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`text-lg ${feature.supported ? 'text-green-600' : 'text-gray-400'}`}>
                            {feature.supported ? '✅' : '❌'}
                          </span>
                          <h4 className="font-medium text-gray-900">{feature.name}</h4>
                        </div>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                        {feature.limitations && feature.limitations.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-700">Limitations:</p>
                            <ul className="text-xs text-gray-600 list-disc list-inside">
                              {feature.limitations.map((limitation: string, limIndex: number) => (
                                <li key={limIndex}>{limitation}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Publishing Options */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Publishing Options</h3>
                  <div className="space-y-3">
                    {selectedPlatform.publishingOptions.map((option: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="text-xl">{getPublishingTypeIcon(option.type)}</span>
                          <div>
                            <h4 className="font-medium text-gray-900">{option.name}</h4>
                            <p className="text-sm text-gray-600">Type: {option.type}</p>
                          </div>
                          {option.required && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Required</span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {option.maxLength && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Max Length</label>
                              <div className="text-gray-900">{option.maxLength} characters</div>
                            </div>
                          )}
                          {option.supportedFormats && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Supported Formats</label>
                              <div className="text-gray-900">{option.supportedFormats.join(', ')}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Account Types */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Types</h3>
                  <div className="space-y-3">
                    {selectedPlatform.accountTypes.map((accountType: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{accountType.type}</h4>
                        <p className="text-sm text-gray-600 mb-3">{accountType.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Capabilities</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {accountType.capabilities.map((capability: string, capIndex: number) => (
                                <li key={capIndex} className="flex items-center space-x-2">
                                  <span className="text-green-600">✅</span>
                                  <span>{capability}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Limitations</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {accountType.limitations.map((limitation: string, limIndex: number) => (
                                <li key={limIndex} className="flex items-center space-x-2">
                                  <span className="text-red-600">❌</span>
                                  <span>{limitation}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connection Requirements */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Requirements</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`p-3 rounded-lg border ${
                      selectedPlatform.connectionRequirements.oauth ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="text-center">
                        <div className="text-2xl mb-2">🔐</div>
                        <h4 className="font-medium text-gray-900">OAuth</h4>
                        <p className="text-sm text-gray-600">
                          {selectedPlatform.connectionRequirements.oauth ? 'Required' : 'Not Required'}
                        </p>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${
                      selectedPlatform.connectionRequirements.apiKey ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="text-center">
                        <div className="text-2xl mb-2">🔑</div>
                        <h4 className="font-medium text-gray-900">API Key</h4>
                        <p className="text-sm text-gray-600">
                          {selectedPlatform.connectionRequirements.apiKey ? 'Required' : 'Not Required'}
                        </p>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${
                      selectedPlatform.connectionRequirements.webhook ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="text-center">
                        <div className="text-2xl mb-2">🔗</div>
                        <h4 className="font-medium text-gray-900">Webhook</h4>
                        <p className="text-sm text-gray-600">
                          {selectedPlatform.connectionRequirements.webhook ? 'Required' : 'Not Required'}
                        </p>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${
                      selectedPlatform.connectionRequirements.verification ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="text-center">
                        <div className="text-2xl mb-2">✅</div>
                        <h4 className="font-medium text-gray-900">Verification</h4>
                        <p className="text-sm text-gray-600">
                          {selectedPlatform.connectionRequirements.verification ? 'Required' : 'Not Required'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="btn-primary"
              >
                Close
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Platform Discovery</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">🌐</span>
            <div>
              <p className="font-medium">Platform Catalog</p>
              <p>Discover all available platforms and their capabilities for content publishing.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">📋</span>
            <div>
              <p className="font-medium">Feature Comparison</p>
              <p>Compare platform features, publishing options, and connection requirements.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">🔍</span>
            <div>
              <p className="font-medium">Detailed Information</p>
              <p>Get comprehensive details about each platform's capabilities and limitations.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">⚙️</span>
            <div>
              <p className="font-medium">Connection Setup</p>
              <p>Understand what's required to connect and publish to each platform.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
