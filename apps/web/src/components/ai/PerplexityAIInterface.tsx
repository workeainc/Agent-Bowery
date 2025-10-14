'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function PerplexityAIInterface() {
  const [activeTab, setActiveTab] = useState<'search' | 'answer' | 'factcheck'>('search');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchOptions, setSearchOptions] = useState({
    maxResults: 10,
    includeImages: false,
  });

  // Answer state
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [answerResult, setAnswerResult] = useState<any>(null);

  // Fact check state
  const [factCheckContent, setFactCheckContent] = useState('');
  const [factCheckResult, setFactCheckResult] = useState<any>(null);

  const executeSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.perplexitySearch(searchQuery, searchOptions);
      setSearchResults(result);
    } catch (err: any) {
      console.error('Failed to execute search:', err);
      setError(err.message || 'Failed to execute search');
    } finally {
      setLoading(false);
    }
  };

  const executeAnswer = async () => {
    if (!question.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.perplexityAnswer(question, context || undefined);
      setAnswerResult(result);
    } catch (err: any) {
      console.error('Failed to get answer:', err);
      setError(err.message || 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  const executeFactCheck = async () => {
    if (!factCheckContent.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.perplexityFactCheck(factCheckContent);
      setFactCheckResult(result);
    } catch (err: any) {
      console.error('Failed to fact check:', err);
      setError(err.message || 'Failed to fact check');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Perplexity AI Integration</h3>
        <p className="text-sm text-gray-600">AI-powered search, answers, and fact-checking capabilities</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('search')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'search'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔍 AI Search
          </button>
          <button
            onClick={() => setActiveTab('answer')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'answer'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            💬 AI Answers
          </button>
          <button
            onClick={() => setActiveTab('factcheck')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'factcheck'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ✅ Fact Check
          </button>
        </nav>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <div className="card">
            <div className="card-content">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Query
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input w-full"
                    placeholder="Enter your search query..."
                    onKeyPress={(e) => e.key === 'Enter' && executeSearch()}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Results
                    </label>
                    <select
                      value={searchOptions.maxResults}
                      onChange={(e) => setSearchOptions({ ...searchOptions, maxResults: parseInt(e.target.value) })}
                      className="input w-full"
                    >
                      <option value={5}>5 results</option>
                      <option value={10}>10 results</option>
                      <option value={20}>20 results</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={searchOptions.includeImages}
                      onChange={(e) => setSearchOptions({ ...searchOptions, includeImages: e.target.checked })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm text-gray-700">Include images in results</label>
                  </div>
                </div>

                <button
                  onClick={executeSearch}
                  disabled={loading || !searchQuery.trim()}
                  className="btn-primary w-full"
                >
                  {loading ? 'Searching...' : 'Search with AI'}
                </button>
              </div>
            </div>
          </div>

          {/* Search Results */}
          {searchResults && (
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Search Results</h4>
                <p className="card-description">Query: "{searchResults.query}"</p>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {searchResults.results.map((result: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">{result.title}</h5>
                      <p className="text-sm text-gray-600 mb-2">{result.snippet}</p>
                      <div className="flex items-center justify-between">
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Source →
                        </a>
                        {result.publishedDate && (
                          <span className="text-xs text-gray-500">
                            {new Date(result.publishedDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Answer Tab */}
      {activeTab === 'answer' && (
        <div className="space-y-4">
          <div className="card">
            <div className="card-content">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question
                  </label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="input w-full h-24 resize-none"
                    placeholder="Ask a question..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Context (Optional)
                  </label>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="input w-full h-20 resize-none"
                    placeholder="Provide additional context..."
                  />
                </div>

                <button
                  onClick={executeAnswer}
                  disabled={loading || !question.trim()}
                  className="btn-primary w-full"
                >
                  {loading ? 'Getting Answer...' : 'Get AI Answer'}
                </button>
              </div>
            </div>
          </div>

          {/* Answer Results */}
          {answerResult && (
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">AI Answer</h4>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(answerResult.confidence)}`}>
                    {getConfidenceText(answerResult.confidence)} Confidence ({Math.round(answerResult.confidence * 100)}%)
                  </span>
                </div>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  <div className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {answerResult.answer}
                  </div>

                  {answerResult.sources && answerResult.sources.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Sources</h5>
                      <div className="space-y-2">
                        {answerResult.sources.map((source: string, index: number) => (
                          <div key={index} className="text-sm text-blue-600 hover:text-blue-800">
                            <a href={source} target="_blank" rel="noopener noreferrer">
                              {source}
                            </a>
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

      {/* Fact Check Tab */}
      {activeTab === 'factcheck' && (
        <div className="space-y-4">
          <div className="card">
            <div className="card-content">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content to Fact Check
                  </label>
                  <textarea
                    value={factCheckContent}
                    onChange={(e) => setFactCheckContent(e.target.value)}
                    className="input w-full h-32 resize-none"
                    placeholder="Paste content to fact check..."
                  />
                </div>

                <button
                  onClick={executeFactCheck}
                  disabled={loading || !factCheckContent.trim()}
                  className="btn-primary w-full"
                >
                  {loading ? 'Fact Checking...' : 'Fact Check Content'}
                </button>
              </div>
            </div>
          </div>

          {/* Fact Check Results */}
          {factCheckResult && (
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Fact Check Results</h4>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    factCheckResult.isFactual ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                  }`}>
                    {factCheckResult.isFactual ? 'Factual' : 'Issues Found'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(factCheckResult.confidence)}`}>
                    {getConfidenceText(factCheckResult.confidence)} Confidence
                  </span>
                </div>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {factCheckResult.issues && factCheckResult.issues.length > 0 ? (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Issues Found</h5>
                      <div className="space-y-3">
                        {factCheckResult.issues.map((issue: any, index: number) => (
                          <div key={index} className="border border-yellow-200 rounded-lg p-3 bg-yellow-50">
                            <div className="font-medium text-yellow-800 mb-1">{issue.text}</div>
                            <div className="text-sm text-yellow-700 mb-1">
                              <strong>Issue:</strong> {issue.issue}
                            </div>
                            <div className="text-sm text-yellow-700">
                              <strong>Suggestion:</strong> {issue.suggestion}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-green-600 text-2xl mb-2">✅</div>
                      <p className="text-green-800 font-medium">No factual issues found!</p>
                      <p className="text-green-600 text-sm">The content appears to be factually accurate.</p>
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
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-medium text-purple-900 mb-2">Perplexity AI Features</h4>
        <div className="space-y-2 text-sm text-purple-800">
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">🔍</span>
            <div>
              <p className="font-medium">AI Search</p>
              <p>Get comprehensive search results with AI-powered relevance and context.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">💬</span>
            <div>
              <p className="font-medium">AI Answers</p>
              <p>Get detailed answers to questions with source citations and confidence scores.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">✅</span>
            <div>
              <p className="font-medium">Fact Checking</p>
              <p>Verify factual accuracy of content with detailed issue identification and suggestions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
