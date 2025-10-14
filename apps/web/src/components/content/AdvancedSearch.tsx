'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface AdvancedSearchProps {
  onSearchResults?: (results: any[]) => void;
}

export default function AdvancedSearch({ onSearchResults }: AdvancedSearchProps) {
  const [searchParams, setSearchParams] = useState({
    query: '',
    type: '',
    status: '',
    tags: [] as string[],
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 20,
  });
  const [results, setResults] = useState<any[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');

  const contentTypes = ['SOCIAL_POST', 'BLOG', 'NEWSLETTER'];
  const contentStatuses = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'ARCHIVED'];

  const executeSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchData = await apiClient.searchContent(searchParams);
      setResults(searchData.data || []);
      setTotalResults(searchData.pagination?.total || 0);

      if (onSearchResults) {
        onSearchResults(searchData.data || []);
      }
    } catch (err: any) {
      console.error('Failed to search content:', err);
      setError(err.message || 'Failed to search content');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !searchParams.tags.includes(newTag.trim())) {
      setSearchParams({
        ...searchParams,
        tags: [...searchParams.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSearchParams({
      ...searchParams,
      tags: searchParams.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const clearSearch = () => {
    setSearchParams({
      query: '',
      type: '',
      status: '',
      tags: [],
      dateFrom: '',
      dateTo: '',
      page: 1,
      limit: 20,
    });
    setResults([]);
    setTotalResults(0);
    setError(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'text-green-600 bg-green-100';
      case 'APPROVED':
        return 'text-blue-600 bg-blue-100';
      case 'PENDING_APPROVAL':
        return 'text-yellow-600 bg-yellow-100';
      case 'DRAFT':
        return 'text-gray-600 bg-gray-100';
      case 'ARCHIVED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Advanced Content Search</h3>
        <p className="text-sm text-gray-600">Search and filter content with advanced criteria</p>
      </div>

      {/* Search Form */}
      <div className="card">
        <div className="card-content">
          <div className="space-y-4">
            {/* Basic Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Query
              </label>
              <input
                type="text"
                value={searchParams.query}
                onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
                className="input w-full"
                placeholder="Search content by title, body, or metadata..."
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type
                </label>
                <select
                  value={searchParams.type}
                  onChange={(e) => setSearchParams({ ...searchParams, type: e.target.value })}
                  className="input w-full"
                >
                  <option value="">All Types</option>
                  {contentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={searchParams.status}
                  onChange={(e) => setSearchParams({ ...searchParams, status: e.target.value })}
                  className="input w-full"
                >
                  <option value="">All Statuses</option>
                  {contentStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date From
                </label>
                <input
                  type="date"
                  value={searchParams.dateFrom}
                  onChange={(e) => setSearchParams({ ...searchParams, dateFrom: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date To
                </label>
                <input
                  type="date"
                  value={searchParams.dateTo}
                  onChange={(e) => setSearchParams({ ...searchParams, dateTo: e.target.value })}
                  className="input w-full"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="input flex-1"
                  placeholder="Add a tag..."
                />
                <button
                  onClick={addTag}
                  className="btn-secondary"
                >
                  Add
                </button>
              </div>
              {searchParams.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {searchParams.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Results Per Page
                </label>
                <select
                  value={searchParams.limit}
                  onChange={(e) => setSearchParams({ ...searchParams, limit: parseInt(e.target.value) })}
                  className="input w-full"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                onClick={clearSearch}
                className="btn-secondary"
              >
                Clear Search
              </button>
              <button
                onClick={executeSearch}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Search Results</h4>
            <p className="card-description">
              Found {totalResults} result{totalResults !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {results.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900">{item.title}</h5>
                      <p className="text-sm text-gray-600">ID: {item.id}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {item.type}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Content Preview
                      </label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                        {item.body?.substring(0, 200)}...
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Metadata
                      </label>
                      <div className="text-xs text-gray-600">
                        <div>Created: {formatDate(item.createdAt)}</div>
                        <div>Updated: {formatDate(item.updatedAt)}</div>
                        {item.tags && item.tags.length > 0 && (
                          <div>Tags: {item.tags.join(', ')}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {results.length === 0 && !loading && (searchParams.query || searchParams.type || searchParams.status || searchParams.tags.length > 0) && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or clearing the search.</p>
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
        <h4 className="font-medium text-blue-900 mb-2">Advanced Search Tips</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">🔍</span>
            <div>
              <p className="font-medium">Search Query</p>
              <p>Searches across title, body content, and metadata fields.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">🏷️</span>
            <div>
              <p className="font-medium">Tags</p>
              <p>Add multiple tags to filter content by specific categories.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">📅</span>
            <div>
              <p className="font-medium">Date Range</p>
              <p>Filter content by creation date range for time-based searches.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
