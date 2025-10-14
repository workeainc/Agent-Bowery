'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface ErrorLogsProps {
  organizationId?: string;
}

export default function ErrorLogs({ organizationId }: ErrorLogsProps) {
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<any>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [filters, setFilters] = useState({
    severity: '',
    category: '',
    timeRange: '24h' as '1h' | '24h' | '7d' | '30d',
    search: '',
    resolved: ''
  });
  const [resolveForm, setResolveForm] = useState({
    resolution: '',
    category: ''
  });

  const loadErrors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        ...filters,
        organizationId,
        limit: 50,
        offset: 0
      };
      
      const result = await apiClient.getErrorLogs(params);
      setErrors(result.errors);
    } catch (err: any) {
      console.error('Failed to load errors:', err);
      setError(err.message || 'Failed to load errors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadErrors();
  }, [filters, organizationId]);

  const handleResolveError = async () => {
    if (!selectedError) return;
    
    try {
      setLoading(true);
      
      const result = await apiClient.resolveError(selectedError.id, {
        resolvedBy: 'current-user', // This should come from session
        resolution: resolveForm.resolution,
        category: resolveForm.category
      });
      
      if (result.success) {
        setShowResolveModal(false);
        setResolveForm({ resolution: '', category: '' });
        await loadErrors();
      }
    } catch (err: any) {
      console.error('Failed to resolve error:', err);
      alert('Failed to resolve error: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'system': return '🖥️';
      case 'application': return '📱';
      case 'user': return '👤';
      case 'integration': return '🔗';
      default: return '❓';
    }
  };

  const truncateMessage = (message: string, maxLength: number = 100): string => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Error Logs</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadErrors}
                className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              className="input"
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <select
              className="input"
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="">All Categories</option>
              <option value="system">System</option>
              <option value="application">Application</option>
              <option value="user">User</option>
              <option value="integration">Integration</option>
            </select>
            
            <select
              className="input"
              value={filters.timeRange}
              onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as any }))}
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            
            <select
              className="input"
              value={filters.resolved}
              onChange={(e) => setFilters(prev => ({ ...prev, resolved: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="false">Unresolved</option>
              <option value="true">Resolved</option>
            </select>
            
            <input
              type="text"
              placeholder="Search errors..."
              className="input"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={loadErrors}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Error Logs ({errors.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {errors.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No errors found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search || filters.severity || filters.category ? 'Try adjusting your filters' : 'No errors have been recorded yet'}
              </p>
            </div>
          ) : (
            errors.map((error) => (
              <div key={error.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-lg">{getCategoryIcon(error.category)}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(error.severity)}`}>
                          {error.severity.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                          {error.category}
                        </span>
                        {error.resolved && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            RESOLVED
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {truncateMessage(error.message)}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>ID: {error.id}</span>
                      <span>Created: {formatDate(error.createdAt)}</span>
                      {error.context.userId && (
                        <span>User: {error.context.userId}</span>
                      )}
                      {error.context.url && (
                        <span>URL: {error.context.url}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedError(error);
                        setShowErrorDetails(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Details
                    </button>
                    {!error.resolved && (
                      <button
                        onClick={() => {
                          setSelectedError(error);
                          setShowResolveModal(true);
                        }}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Error Details Modal */}
      {showErrorDetails && selectedError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Error Details</h2>
                <button
                  onClick={() => {
                    setShowErrorDetails(false);
                    setSelectedError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">
                {/* Error Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Error Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">ID:</span>
                      <span className="ml-2 font-mono">{selectedError.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Severity:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getSeverityColor(selectedError.severity)}`}>
                        {selectedError.severity.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Category:</span>
                      <span className="ml-2">{selectedError.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        selectedError.resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedError.resolved ? 'RESOLVED' : 'UNRESOLVED'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <span className="ml-2">{formatDate(selectedError.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Updated:</span>
                      <span className="ml-2">{formatDate(selectedError.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Error Message</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-mono text-sm">{selectedError.message}</p>
                  </div>
                </div>

                {/* Stack Trace */}
                {selectedError.stack && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Stack Trace</h3>
                    <div className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-xs whitespace-pre-wrap">{selectedError.stack}</pre>
                    </div>
                  </div>
                )}

                {/* Context */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Context</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                      {JSON.stringify(selectedError.context, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Metadata */}
                {Object.keys(selectedError.metadata).length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Metadata</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                        {JSON.stringify(selectedError.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Error Modal */}
      {showResolveModal && selectedError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Resolve Error</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Notes
                </label>
                <textarea
                  className="input w-full"
                  rows={4}
                  value={resolveForm.resolution}
                  onChange={(e) => setResolveForm(prev => ({ ...prev, resolution: e.target.value }))}
                  placeholder="Describe how this error was resolved..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Category
                </label>
                <select
                  className="input w-full"
                  value={resolveForm.category}
                  onChange={(e) => setResolveForm(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">Select category</option>
                  <option value="bug_fix">Bug Fix</option>
                  <option value="configuration">Configuration Change</option>
                  <option value="user_error">User Error</option>
                  <option value="external_service">External Service Issue</option>
                  <option value="data_corruption">Data Corruption</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowResolveModal(false);
                    setSelectedError(null);
                    setResolveForm({ resolution: '', category: '' });
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolveError}
                  className="btn-primary"
                  disabled={!resolveForm.resolution.trim()}
                >
                  Resolve Error
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
