'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface TemplateRenderHistoryProps {
  templateId: string;
  limit?: number;
}

interface RenderHistoryItem {
  id: string;
  templateId: string;
  variables: Record<string, any>;
  renderedContent: string;
  createdAt: string;
  createdBy: string;
  processingTime: number;
  success: boolean;
  errorMessage?: string;
}

interface RenderHistoryResult {
  success: boolean;
  history: RenderHistoryItem[];
  totalCount: number;
}

export default function TemplateRenderHistory({ templateId, limit = 50 }: TemplateRenderHistoryProps) {
  const [historyData, setHistoryData] = useState<RenderHistoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<RenderHistoryItem | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getTemplateRenderHistory(templateId, limit);
      setHistoryData(result);
    } catch (err: any) {
      console.error('Failed to load render history:', err);
      setError(err.message || 'Failed to load render history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [templateId, limit]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌';
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading render history...</span>
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
            <h3 className="text-sm font-medium text-red-800">Error Loading History</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!historyData || historyData.history.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Render History</h3>
          <p className="text-gray-500">
            This template hasn't been rendered yet. Start by creating a preview or rendering the template.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Render History</h3>
          <p className="text-sm text-gray-600">
            {historyData.totalCount} total renders, showing {historyData.history.length} recent
          </p>
        </div>
        <button
          onClick={loadHistory}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {/* History List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {historyData.history.map((item) => (
            <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getStatusIcon(item.success)}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {formatDate(item.createdAt)}
                      </span>
                      <span className={`text-sm ${getStatusColor(item.success)}`}>
                        {item.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      by {item.createdBy} • {formatProcessingTime(item.processingTime)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
              
              {!item.success && item.errorMessage && (
                <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                  {item.errorMessage}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Render Details</h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
              {/* Render Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Render Info</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div><span className="font-medium">Date:</span> {formatDate(selectedItem.createdAt)}</div>
                    <div><span className="font-medium">User:</span> {selectedItem.createdBy}</div>
                    <div><span className="font-medium">Processing Time:</span> {formatProcessingTime(selectedItem.processingTime)}</div>
                    <div><span className="font-medium">Status:</span> <span className={getStatusColor(selectedItem.success)}>{selectedItem.success ? 'Success' : 'Failed'}</span></div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Variables Used</h4>
                  <div className="text-sm text-gray-600">
                    {Object.keys(selectedItem.variables).length} variables
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Content Stats</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div><span className="font-medium">Characters:</span> {selectedItem.renderedContent.length}</div>
                    <div><span className="font-medium">Words:</span> {selectedItem.renderedContent.split(/\s+/).length}</div>
                  </div>
                </div>
              </div>

              {/* Variables */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Variables</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-800 font-mono overflow-x-auto">
                    {JSON.stringify(selectedItem.variables, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Rendered Content */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Rendered Content</h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedItem.renderedContent);
                      alert('Content copied to clipboard!');
                    }}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                    {selectedItem.renderedContent}
                  </pre>
                </div>
              </div>

              {/* Error Message */}
              {!selectedItem.success && selectedItem.errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Error Details</h4>
                  <p className="text-red-800">{selectedItem.errorMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
