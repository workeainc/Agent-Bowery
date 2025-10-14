'use client';

import { useState, useEffect } from 'react';

interface QualityCheck {
  id: string;
  name: string;
  description: string;
  score: number; // 0-100
  status: 'pass' | 'warning' | 'fail';
  suggestions: string[];
  category: 'readability' | 'seo' | 'engagement' | 'brand' | 'technical';
}

interface QualityCheckResultsProps {
  content: string;
  contentType?: string;
  onResultsChange?: (results: QualityCheck[]) => void;
}

export default function QualityCheckResults({ content, contentType = 'BLOG', onResultsChange }: QualityCheckResultsProps) {
  const [results, setResults] = useState<QualityCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (content.trim()) {
      performQualityChecks();
    } else {
      setResults([]);
    }
  }, [content, contentType]);

  const performQualityChecks = async () => {
    setLoading(true);
    
    try {
      // In a real app, this would call the quality check API
      // For now, we'll simulate quality checks
      const mockResults = generateMockQualityChecks(content, contentType);
      setResults(mockResults);
      
      if (onResultsChange) {
        onResultsChange(mockResults);
      }
    } catch (error) {
      console.error('Failed to perform quality checks:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockQualityChecks = (content: string, contentType: string): QualityCheck[] => {
    const wordCount = content.split(/\s+/).length;
    const sentenceCount = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentenceCount;
    
    return [
      {
        id: 'readability',
        name: 'Readability Score',
        description: 'Measures how easy your content is to read',
        score: Math.min(100, Math.max(0, 100 - (avgWordsPerSentence - 15) * 2)),
        status: avgWordsPerSentence <= 20 ? 'pass' : avgWordsPerSentence <= 25 ? 'warning' : 'fail',
        suggestions: avgWordsPerSentence > 20 ? [
          'Break up long sentences into shorter ones',
          'Use simpler words where possible',
          'Add bullet points or lists for better readability'
        ] : [],
        category: 'readability'
      },
      {
        id: 'word_count',
        name: 'Word Count',
        description: 'Ensures appropriate content length',
        score: contentType === 'BLOG' 
          ? wordCount >= 300 ? 100 : wordCount >= 200 ? 70 : 40
          : contentType === 'SOCIAL_POST'
          ? wordCount <= 280 ? 100 : wordCount <= 400 ? 70 : 40
          : 100,
        status: contentType === 'BLOG' 
          ? wordCount >= 300 ? 'pass' : wordCount >= 200 ? 'warning' : 'fail'
          : contentType === 'SOCIAL_POST'
          ? wordCount <= 280 ? 'pass' : wordCount <= 400 ? 'warning' : 'fail'
          : 'pass',
        suggestions: contentType === 'BLOG' && wordCount < 300 ? [
          'Add more detailed explanations',
          'Include examples or case studies',
          'Expand on key points'
        ] : contentType === 'SOCIAL_POST' && wordCount > 280 ? [
          'Shorten sentences',
          'Remove unnecessary words',
          'Use abbreviations where appropriate'
        ] : [],
        category: 'technical'
      },
      {
        id: 'headings',
        name: 'Heading Structure',
        description: 'Checks for proper heading hierarchy',
        score: content.includes('#') ? 100 : content.split('\n')[0].length > 0 ? 70 : 40,
        status: content.includes('#') ? 'pass' : content.split('\n')[0].length > 0 ? 'warning' : 'fail',
        suggestions: !content.includes('#') ? [
          'Add a main heading (#)',
          'Use subheadings (##) to organize content',
          'Create a clear content structure'
        ] : [],
        category: 'technical'
      },
      {
        id: 'engagement',
        name: 'Engagement Elements',
        description: 'Checks for elements that increase engagement',
        score: calculateEngagementScore(content),
        status: calculateEngagementScore(content) >= 80 ? 'pass' : calculateEngagementScore(content) >= 60 ? 'warning' : 'fail',
        suggestions: calculateEngagementScore(content) < 80 ? [
          'Add questions to engage readers',
          'Include call-to-action statements',
          'Use emotional words and phrases',
          'Add examples or stories'
        ] : [],
        category: 'engagement'
      },
      {
        id: 'seo_basics',
        name: 'SEO Basics',
        description: 'Basic SEO optimization checks',
        score: calculateSEOScore(content),
        status: calculateSEOScore(content) >= 80 ? 'pass' : calculateSEOScore(content) >= 60 ? 'warning' : 'fail',
        suggestions: calculateSEOScore(content) < 80 ? [
          'Include relevant keywords naturally',
          'Add meta descriptions',
          'Use descriptive headings',
          'Include internal links where appropriate'
        ] : [],
        category: 'seo'
      }
    ];
  };

  const calculateEngagementScore = (content: string): number => {
    let score = 0;
    
    // Check for questions
    if (content.includes('?')) score += 20;
    
    // Check for call-to-action words
    const ctaWords = ['click', 'learn', 'discover', 'try', 'get', 'start', 'join'];
    if (ctaWords.some(word => content.toLowerCase().includes(word))) score += 20;
    
    // Check for emotional words
    const emotionalWords = ['amazing', 'incredible', 'fantastic', 'powerful', 'essential', 'crucial'];
    if (emotionalWords.some(word => content.toLowerCase().includes(word))) score += 20;
    
    // Check for examples/stories
    if (content.includes('for example') || content.includes('for instance') || content.includes('imagine')) score += 20;
    
    // Check for lists
    if (content.includes('-') || content.includes('*') || content.includes('1.')) score += 20;
    
    return Math.min(100, score);
  };

  const calculateSEOScore = (content: string): number => {
    let score = 0;
    
    // Check for headings
    if (content.includes('#')) score += 25;
    
    // Check for keywords (basic check)
    const commonKeywords = ['content', 'marketing', 'business', 'strategy', 'growth'];
    if (commonKeywords.some(keyword => content.toLowerCase().includes(keyword))) score += 25;
    
    // Check for internal structure
    if (content.split('\n\n').length > 2) score += 25;
    
    // Check for descriptive content
    if (content.length > 200) score += 25;
    
    return score;
  };

  const toggleExpanded = (checkId: string) => {
    const newExpanded = new Set(expandedChecks);
    if (newExpanded.has(checkId)) {
      newExpanded.delete(checkId);
    } else {
      newExpanded.add(checkId);
    }
    setExpandedChecks(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'fail':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'readability':
        return '📖';
      case 'seo':
        return '🔍';
      case 'engagement':
        return '💬';
      case 'brand':
        return '🛡️';
      case 'technical':
        return '⚙️';
      default:
        return '📊';
    }
  };

  const getOverallScore = () => {
    if (results.length === 0) return 0;
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    return Math.round(totalScore / results.length);
  };

  const getOverallStatus = () => {
    const overallScore = getOverallScore();
    if (overallScore >= 80) return 'pass';
    if (overallScore >= 60) return 'warning';
    return 'fail';
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mr-3"></div>
            <span className="text-gray-600">Analyzing content quality...</span>
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📊</div>
            <p className="text-gray-500">Enter content to see quality analysis</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Overall Quality Score</h3>
              <p className="text-sm text-gray-600">Based on {results.length} quality checks</p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${
                getOverallStatus() === 'pass' ? 'text-green-600' :
                getOverallStatus() === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {getOverallScore()}
              </div>
              <div className={`text-sm font-medium ${
                getOverallStatus() === 'pass' ? 'text-green-600' :
                getOverallStatus() === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {getOverallStatus().toUpperCase()}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  getOverallStatus() === 'pass' ? 'bg-green-500' :
                  getOverallStatus() === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${getOverallScore()}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Checks */}
      <div className="space-y-3">
        {results.map((check) => (
          <div key={check.id} className={`border rounded-lg p-4 ${getStatusColor(check.status)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getCategoryIcon(check.category)}</span>
                <div>
                  <h4 className="font-medium text-gray-900">{check.name}</h4>
                  <p className="text-sm text-gray-600">{check.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{check.score}</div>
                  <div className="text-xs text-gray-600">/ 100</div>
                </div>
                <button
                  onClick={() => toggleExpanded(check.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className={`w-5 h-5 transform transition-transform ${
                      expandedChecks.has(check.id) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Suggestions */}
            {expandedChecks.has(check.id) && check.suggestions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Suggestions for improvement:</h5>
                <ul className="space-y-1">
                  {check.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-primary-500 mr-2">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
