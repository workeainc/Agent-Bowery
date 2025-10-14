'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface ContentOptimizationProps {
  contentId: string;
  content: {
    title: string;
    body: string;
    platform?: string;
  };
  onOptimized: (optimizedContent: any) => void;
}

export default function ContentOptimization({ contentId, content, onOptimized }: ContentOptimizationProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [optimizedContent, setOptimizedContent] = useState<any>(null);
  const [showABTest, setShowABTest] = useState(false);
  const [abTestVariants, setAbTestVariants] = useState([
    { title: content.title, content: content.body, description: 'Original' },
    { title: '', content: '', description: 'Variant A' },
    { title: '', content: '', description: 'Variant B' }
  ]);

  useEffect(() => {
    fetchSuggestions();
  }, [contentId]);

  const fetchSuggestions = async () => {
    try {
      const result = await apiClient.getOptimizationSuggestions(contentId);
      setSuggestions(result.suggestions || []);
    } catch (error) {
      console.error('Failed to fetch optimization suggestions:', error);
    }
  };

  const handleOptimize = async (options?: { targetAudience?: string; platform?: string; goals?: string[] }) => {
    setLoading(true);
    try {
      const result = await apiClient.optimizeContent(contentId, options);
      setOptimizedContent(result);
      onOptimized(result);
    } catch (error) {
      console.error('Failed to optimize content:', error);
      alert('Failed to optimize content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateABTest = async () => {
    if (abTestVariants.some(v => !v.title.trim() || !v.content.trim())) {
      alert('Please fill in all variant titles and content');
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.createABTest(contentId, abTestVariants);
      alert('A/B test created successfully!');
      setShowABTest(false);
    } catch (error) {
      console.error('Failed to create A/B test:', error);
      alert('Failed to create A/B test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateABTestVariant = (index: number, field: 'title' | 'content' | 'description', value: string) => {
    setAbTestVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  return (
    <div className="space-y-6">
      {/* Optimization Actions */}
      <div className="card">
        <div className="card-content">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Optimization</h3>
          
          <div className="flex space-x-3 mb-4">
            <button
              onClick={() => handleOptimize()}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Optimizing...' : 'AI Optimize'}
            </button>
            
            <button
              onClick={() => handleOptimize({ 
                targetAudience: 'general',
                platform: content.platform || 'meta',
                goals: ['engagement', 'reach']
              })}
              disabled={loading}
              className="btn-outline"
            >
              Optimize for Engagement
            </button>
            
            <button
              onClick={() => setShowABTest(true)}
              className="btn-outline"
            >
              Create A/B Test
            </button>
          </div>

          {optimizedContent && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Optimized Content:</h4>
              <div className="space-y-2">
                <div>
                  <strong>Title:</strong> {optimizedContent.title}
                </div>
                <div>
                  <strong>Content:</strong>
                  <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                    {optimizedContent.content}
                  </div>
                </div>
                {optimizedContent.improvements && (
                  <div>
                    <strong>Improvements:</strong>
                    <ul className="mt-1 text-sm text-gray-700 list-disc list-inside">
                      {optimizedContent.improvements.map((improvement: string, index: number) => (
                        <li key={index}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Optimization Suggestions */}
      {suggestions.length > 0 && (
        <div className="card">
          <div className="card-content">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Suggestions</h3>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-600 text-lg">💡</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900">{suggestion.type}</h4>
                      <p className="text-sm text-blue-700 mt-1">{suggestion.suggestion}</p>
                      {suggestion.impact && (
                        <p className="text-xs text-blue-600 mt-1">
                          Expected impact: {suggestion.impact}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* A/B Test Modal */}
      {showABTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create A/B Test</h2>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {abTestVariants.map((variant, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">{variant.description}</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={variant.title}
                        onChange={(e) => updateABTestVariant(index, 'title', e.target.value)}
                        className="input w-full"
                        placeholder="Enter title..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Content
                      </label>
                      <textarea
                        value={variant.content}
                        onChange={(e) => updateABTestVariant(index, 'content', e.target.value)}
                        className="input w-full h-32 resize-none"
                        placeholder="Enter content..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={variant.description}
                        onChange={(e) => updateABTestVariant(index, 'description', e.target.value)}
                        className="input w-full"
                        placeholder="Describe this variant..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex space-x-3">
              <button
                onClick={() => setShowABTest(false)}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateABTest}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Creating...' : 'Create A/B Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
