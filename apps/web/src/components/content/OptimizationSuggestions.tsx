'use client';

import { useState } from 'react';

interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  category: 'seo' | 'engagement' | 'readability' | 'structure' | 'brand';
  priority: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'medium' | 'hard';
  action: string;
  example?: string;
}

interface OptimizationSuggestionsProps {
  content: string;
  contentType?: string;
  targetAudience?: string;
  keywords?: string[];
}

export default function OptimizationSuggestions({ 
  content, 
  contentType = 'BLOG', 
  targetAudience = '',
  keywords = []
}: OptimizationSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const generateSuggestions = () => {
    if (!content.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    
    // Generate optimization suggestions based on content analysis
    const newSuggestions: OptimizationSuggestion[] = [];
    
    // SEO Suggestions
    if (!content.toLowerCase().includes('meta') && !content.includes('#')) {
      newSuggestions.push({
        id: 'seo-headings',
        title: 'Add SEO-Friendly Headings',
        description: 'Improve content structure and SEO with proper headings',
        category: 'seo',
        priority: 'high',
        impact: 'high',
        effort: 'easy',
        action: 'Add H1, H2, and H3 headings to structure your content',
        example: '# Main Title\n## Section Title\n### Subsection Title'
      });
    }

    if (keywords.length > 0 && !keywords.some(keyword => content.toLowerCase().includes(keyword.toLowerCase()))) {
      newSuggestions.push({
        id: 'seo-keywords',
        title: 'Include Target Keywords',
        description: 'Incorporate your target keywords naturally into the content',
        category: 'seo',
        priority: 'high',
        impact: 'high',
        effort: 'medium',
        action: `Include keywords: ${keywords.join(', ')}`,
        example: `Try to naturally include "${keywords[0]}" in your content`
      });
    }

    // Engagement Suggestions
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 500 && !content.includes('?')) {
      newSuggestions.push({
        id: 'engagement-questions',
        title: 'Add Engaging Questions',
        description: 'Include questions to increase reader engagement',
        category: 'engagement',
        priority: 'medium',
        impact: 'medium',
        effort: 'easy',
        action: 'Add 2-3 questions throughout your content',
        example: 'What do you think about this approach? Have you tried similar strategies?'
      });
    }

    if (!content.includes('call') && !content.includes('action') && !content.includes('click')) {
      newSuggestions.push({
        id: 'engagement-cta',
        title: 'Add Call-to-Action',
        description: 'Include clear calls-to-action to guide reader behavior',
        category: 'engagement',
        priority: 'high',
        impact: 'high',
        effort: 'easy',
        action: 'Add a clear call-to-action at the end of your content',
        example: 'Ready to get started? Click here to learn more!'
      });
    }

    // Readability Suggestions
    const sentences = content.split(/[.!?]+/);
    const avgWordsPerSentence = wordCount / sentences.length;
    
    if (avgWordsPerSentence > 20) {
      newSuggestions.push({
        id: 'readability-sentences',
        title: 'Shorten Long Sentences',
        description: 'Break up complex sentences for better readability',
        category: 'readability',
        priority: 'medium',
        impact: 'medium',
        effort: 'medium',
        action: 'Break sentences longer than 20 words into shorter ones',
        example: 'Instead of: "This is a very long sentence that contains multiple ideas and should be broken up."\nTry: "This is a shorter sentence. It contains one main idea."'
      });
    }

    if (!content.includes('-') && !content.includes('*') && wordCount > 300) {
      newSuggestions.push({
        id: 'readability-lists',
        title: 'Add Bullet Points or Lists',
        description: 'Use lists to make content more scannable',
        category: 'readability',
        priority: 'medium',
        impact: 'medium',
        effort: 'easy',
        action: 'Convert key points into bullet points or numbered lists',
        example: '- Point 1\n- Point 2\n- Point 3'
      });
    }

    // Structure Suggestions
    if (contentType === 'BLOG' && wordCount < 300) {
      newSuggestions.push({
        id: 'structure-length',
        title: 'Expand Content Length',
        description: 'Blog posts should be at least 300 words for better SEO',
        category: 'structure',
        priority: 'high',
        impact: 'high',
        effort: 'hard',
        action: 'Add more detailed explanations, examples, or case studies',
        example: 'Add examples, statistics, or personal anecdotes to expand your content'
      });
    }

    if (contentType === 'SOCIAL_POST' && wordCount > 280) {
      newSuggestions.push({
        id: 'structure-social',
        title: 'Shorten for Social Media',
        description: 'Social media posts should be concise and engaging',
        category: 'structure',
        priority: 'high',
        impact: 'high',
        effort: 'medium',
        action: 'Reduce content to under 280 characters for better engagement',
        example: 'Focus on the key message and use abbreviations where appropriate'
      });
    }

    // Brand Suggestions
    if (targetAudience && !content.toLowerCase().includes(targetAudience.toLowerCase())) {
      newSuggestions.push({
        id: 'brand-audience',
        title: 'Address Target Audience',
        description: 'Make content more relevant to your target audience',
        category: 'brand',
        priority: 'medium',
        impact: 'medium',
        effort: 'easy',
        action: `Include references to ${targetAudience} in your content`,
        example: `For ${targetAudience}, this approach can be particularly effective...`
      });
    }

    setSuggestions(newSuggestions);
    setLoading(false);
  };

  // Generate suggestions when content changes
  useState(() => {
    generateSuggestions();
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'easy':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'hard':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'seo':
        return '🔍';
      case 'engagement':
        return '💬';
      case 'readability':
        return '📖';
      case 'structure':
        return '📋';
      case 'brand':
        return '🛡️';
      default:
        return '💡';
    }
  };

  const sortedSuggestions = suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const impactOrder = { high: 3, medium: 2, low: 1 };
    
    // Sort by priority first, then by impact
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return impactOrder[b.impact] - impactOrder[a.impact];
  });

  if (loading) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mr-3"></div>
            <span className="text-gray-600">Analyzing content for optimizations...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!content.trim()) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">💡</div>
            <p className="text-gray-500">Enter content to see optimization suggestions</p>
          </div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="text-center py-8">
            <div className="text-green-400 text-4xl mb-2">✅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Great content!</h3>
            <p className="text-gray-500">No optimization suggestions at this time.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Optimization Suggestions</h3>
        <p className="card-description">
          AI-powered suggestions to improve your content ({suggestions.length} suggestions)
        </p>
      </div>
      <div className="card-content">
        <div className="space-y-4">
          {sortedSuggestions.map((suggestion) => (
            <div key={suggestion.id} className={`border rounded-lg p-4 ${getPriorityColor(suggestion.priority)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <span className="text-lg mt-1">{getCategoryIcon(suggestion.category)}</span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(suggestion.priority)}`}>
                        {suggestion.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <span>Impact:</span>
                        <span className={getImpactColor(suggestion.impact)}>{suggestion.impact}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>Effort:</span>
                        <span className={getEffortColor(suggestion.effort)}>{suggestion.effort}</span>
                      </div>
                    </div>
                    
                    <div className="bg-white bg-opacity-50 p-3 rounded border">
                      <div className="text-sm font-medium text-gray-900 mb-1">Action:</div>
                      <div className="text-sm text-gray-700 mb-2">{suggestion.action}</div>
                      {suggestion.example && (
                        <>
                          <div className="text-sm font-medium text-gray-900 mb-1">Example:</div>
                          <div className="text-sm text-gray-700 font-mono bg-gray-100 p-2 rounded">
                            {suggestion.example}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Tip:</strong> Focus on high-priority suggestions first for maximum impact. 
            Consider the effort required vs. the potential impact when prioritizing improvements.
          </div>
        </div>
      </div>
    </div>
  );
}
