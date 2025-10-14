'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface ContentAdaptationProps {
  contentId: string;
  onAdaptationComplete?: (adaptedContent: any) => void;
}

export default function ContentAdaptation({ contentId, onAdaptationComplete }: ContentAdaptationProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [adaptationOptions, setAdaptationOptions] = useState({
    optimizeForEngagement: false,
    adjustLength: true,
    addHashtags: false,
    includeCallToAction: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adaptedContent, setAdaptedContent] = useState<any>(null);

  const platforms = [
    { value: 'FACEBOOK', label: 'Facebook', icon: '📘' },
    { value: 'INSTAGRAM', label: 'Instagram', icon: '📷' },
    { value: 'LINKEDIN', label: 'LinkedIn', icon: '💼' },
    { value: 'TWITTER', label: 'Twitter', icon: '🐦' },
    { value: 'YOUTUBE', label: 'YouTube', icon: '📺' },
  ];

  const adaptContent = async () => {
    if (!selectedPlatform) {
      setError('Please select a platform');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setAdaptedContent(null);

      const result = await apiClient.adaptContent(contentId, selectedPlatform, adaptationOptions);
      setAdaptedContent(result);

      if (onAdaptationComplete) {
        onAdaptationComplete(result);
      }
    } catch (err: any) {
      console.error('Failed to adapt content:', err);
      setError(err.message || 'Failed to adapt content');
    } finally {
      setLoading(false);
    }
  };

  const copyAdaptedContent = async () => {
    if (adaptedContent?.content) {
      try {
        await navigator.clipboard.writeText(adaptedContent.content);
      } catch (err) {
        console.error('Failed to copy content:', err);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Content Adaptation</h3>
        <p className="text-sm text-gray-600">Adapt content for specific platforms and optimize for engagement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Platform Selection */}
        <div className="space-y-4">
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

          {/* Adaptation Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adaptation Options
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={adaptationOptions.optimizeForEngagement}
                  onChange={(e) => setAdaptationOptions({
                    ...adaptationOptions,
                    optimizeForEngagement: e.target.checked
                  })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">Optimize for engagement</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={adaptationOptions.adjustLength}
                  onChange={(e) => setAdaptationOptions({
                    ...adaptationOptions,
                    adjustLength: e.target.checked
                  })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">Adjust content length</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={adaptationOptions.addHashtags}
                  onChange={(e) => setAdaptationOptions({
                    ...adaptationOptions,
                    addHashtags: e.target.checked
                  })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">Add relevant hashtags</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={adaptationOptions.includeCallToAction}
                  onChange={(e) => setAdaptationOptions({
                    ...adaptationOptions,
                    includeCallToAction: e.target.checked
                  })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">Include call-to-action</span>
              </label>
            </div>
          </div>

          <button
            onClick={adaptContent}
            disabled={loading || !selectedPlatform}
            className="btn-primary w-full"
          >
            {loading ? 'Adapting...' : 'Adapt Content'}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {adaptedContent ? (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Adapted Content</h4>
                <button
                  onClick={copyAdaptedContent}
                  className="btn-secondary text-sm"
                >
                  Copy
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                    {adaptedContent.content || 'No content generated'}
                  </div>
                </div>
                
                {adaptedContent.metadata && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metadata
                    </label>
                    <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                      {JSON.stringify(adaptedContent.metadata, null, 2)}
                    </pre>
                  </div>
                )}
                
                {adaptedContent.suggestions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Suggestions
                    </label>
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                      {adaptedContent.suggestions}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-8 text-center">
              <div className="text-gray-400 text-4xl mb-4">🔄</div>
              <h4 className="font-medium text-gray-900 mb-2">No Adapted Content</h4>
              <p className="text-sm text-gray-600">Select a platform and click "Adapt Content" to see the result.</p>
            </div>
          )}
        </div>
      </div>

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
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">Content Adaptation</h4>
        <div className="space-y-2 text-sm text-green-800">
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">🎯</span>
            <div>
              <p className="font-medium">Platform Optimization</p>
              <p>Content is automatically adapted to meet platform-specific requirements and best practices.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">📊</span>
            <div>
              <p className="font-medium">Engagement Optimization</p>
              <p>AI analyzes content to improve engagement rates and audience interaction.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">✂️</span>
            <div>
              <p className="font-medium">Length Adjustment</p>
              <p>Content length is optimized for each platform's character limits and user behavior.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
