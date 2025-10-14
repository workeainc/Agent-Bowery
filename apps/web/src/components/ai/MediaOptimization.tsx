'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface MediaOptimizationProps {
  contentId?: string;
  onOptimizationComplete?: (optimization: any) => void;
}

export default function MediaOptimization({ contentId, onOptimizationComplete }: MediaOptimizationProps) {
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [suggestionsResult, setSuggestionsResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'optimize' | 'suggestions'>('optimize');
  const [mediaId, setMediaId] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');

  const platforms = [
    { value: 'FACEBOOK', label: 'Facebook', icon: '📘' },
    { value: 'INSTAGRAM', label: 'Instagram', icon: '📷' },
    { value: 'LINKEDIN', label: 'LinkedIn', icon: '💼' },
    { value: 'TWITTER', label: 'Twitter', icon: '🐦' },
    { value: 'YOUTUBE', label: 'YouTube', icon: '📺' },
  ];

  const optimizeMedia = async () => {
    if (!mediaId || !selectedPlatform) {
      setError('Media ID and platform are required for optimization');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.optimizeMediaForPlatform(mediaId, selectedPlatform);
      setOptimizationResult(result);

      if (onOptimizationComplete) {
        onOptimizationComplete(result);
      }
    } catch (err: any) {
      console.error('Failed to optimize media:', err);
      setError(err.message || 'Failed to optimize media');
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async () => {
    if (!contentId) {
      setError('Content ID is required for media suggestions');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.generateMediaSuggestions(contentId);
      setSuggestionsResult(result);

      if (onOptimizationComplete) {
        onOptimizationComplete(result);
      }
    } catch (err: any) {
      console.error('Failed to generate suggestions:', err);
      setError(err.message || 'Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'gif':
        return '🎞️';
      default:
        return '📁';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Media Optimization</h3>
        <p className="text-sm text-gray-600">Optimize media for platforms and get AI-generated suggestions</p>
      </div>

      {/* Content ID Input */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content ID (for suggestions)
              </label>
              <input
                type="text"
                value={contentId || ''}
                className="input w-full"
                placeholder="Enter content ID for media suggestions..."
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
            onClick={() => setActiveTab('optimize')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'optimize'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ⚡ Optimize Media
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'suggestions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            💡 AI Suggestions
          </button>
        </nav>
      </div>

      {/* Media Optimization Tab */}
      {activeTab === 'optimize' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Optimize Media for Platform</h4>
              <p className="text-sm text-gray-600">Optimize existing media for specific platform requirements</p>
            </div>
            <button
              onClick={optimizeMedia}
              disabled={loading || !mediaId || !selectedPlatform}
              className="btn-primary"
            >
              {loading ? 'Optimizing...' : 'Optimize Media'}
            </button>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Media ID
                  </label>
                  <input
                    type="text"
                    value={mediaId}
                    onChange={(e) => setMediaId(e.target.value)}
                    className="input w-full"
                    placeholder="Enter media ID to optimize..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Platform
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {platforms.map((platform) => (
                      <label key={platform.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="platform"
                          value={platform.value}
                          checked={selectedPlatform === platform.value}
                          onChange={(e) => setSelectedPlatform(e.target.value)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-lg">{platform.icon}</span>
                        <span className="text-sm font-medium text-gray-900">{platform.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Optimization Results */}
          {optimizationResult && (
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Optimization Results</h4>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {/* Optimized Media */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">Optimized Media</h5>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                          <div className="text-sm text-gray-900 break-all">{optimizationResult.optimizedMedia.url}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                          <div className="text-sm text-gray-900">{optimizationResult.optimizedMedia.format}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                          <div className="text-sm text-gray-900">{optimizationResult.optimizedMedia.size}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
                          <div className="text-sm text-gray-900">
                            {optimizationResult.optimizedMedia.dimensions.width} × {optimizationResult.optimizedMedia.dimensions.height}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Optimizations Applied */}
                  {optimizationResult.optimizations && optimizationResult.optimizations.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Optimizations Applied</h5>
                      <div className="space-y-2">
                        {optimizationResult.optimizations.map((optimization: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">{optimization.type}</div>
                              <div className="text-sm text-gray-600">{optimization.description}</div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(optimization.impact)}`}>
                              {optimization.impact} impact
                            </span>
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

      {/* AI Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">AI Media Suggestions</h4>
              <p className="text-sm text-gray-600">Get AI-generated media suggestions for your content</p>
            </div>
            <button
              onClick={generateSuggestions}
              disabled={loading || !contentId}
              className="btn-primary"
            >
              {loading ? 'Generating...' : 'Generate Suggestions'}
            </button>
          </div>

          {/* Suggestions Results */}
          {suggestionsResult && (
            <div className="space-y-6">
              {/* Media Suggestions */}
              {suggestionsResult.suggestions && suggestionsResult.suggestions.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title">Media Suggestions</h4>
                  </div>
                  <div className="card-content">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {suggestionsResult.suggestions.map((suggestion: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-lg">{getMediaTypeIcon(suggestion.type)}</span>
                            <div>
                              <h5 className="font-medium text-gray-900 capitalize">{suggestion.type}</h5>
                              <p className="text-sm text-gray-600">{suggestion.platform}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700">Description</label>
                              <div className="text-sm text-gray-900">{suggestion.description}</div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700">Style</label>
                              <div className="text-sm text-gray-900">{suggestion.style}</div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700">Reasoning</label>
                              <div className="text-sm text-gray-600">{suggestion.reasoning}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Generated Prompts */}
              {suggestionsResult.aiGenerated && suggestionsResult.aiGenerated.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title">AI Generated Prompts</h4>
                  </div>
                  <div className="card-content">
                    <div className="space-y-4">
                      {suggestionsResult.aiGenerated.map((prompt: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
                              <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                                {prompt.prompt}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-700">Style</label>
                                <div className="text-sm text-gray-900">{prompt.style}</div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700">Platforms</label>
                                <div className="text-sm text-gray-900">{prompt.platforms.join(', ')}</div>
                              </div>
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
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="font-medium text-orange-900 mb-2">Media Optimization</h4>
        <div className="space-y-2 text-sm text-orange-800">
          <div className="flex items-start space-x-2">
            <span className="text-orange-600 text-lg">⚡</span>
            <div>
              <p className="font-medium">Platform Optimization</p>
              <p>Automatically optimize media files for specific platform requirements and best practices.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-orange-600 text-lg">💡</span>
            <div>
              <p className="font-medium">AI Suggestions</p>
              <p>Get intelligent media suggestions based on content analysis and platform optimization.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-orange-600 text-lg">🎨</span>
            <div>
              <p className="font-medium">Creative Prompts</p>
              <p>Generate AI prompts for creating custom media that matches your content and brand.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
