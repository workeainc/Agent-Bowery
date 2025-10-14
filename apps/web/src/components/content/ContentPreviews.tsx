'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface ContentPreview {
  id: string;
  contentId: string;
  platform: string;
  previewData: any;
  createdAt: string;
  status: 'generated' | 'pending' | 'error';
}

interface ContentPreviewsProps {
  contentId: string;
}

export default function ContentPreviews({ contentId }: ContentPreviewsProps) {
  const [previews, setPreviews] = useState<ContentPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [previewingAll, setPreviewingAll] = useState(false);

  useEffect(() => {
    if (contentId) {
      loadPreviews();
    }
  }, [contentId]);

  const loadPreviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const previewsData = await apiClient.getContentPreviews(contentId);
      setPreviews(previewsData);
    } catch (err: any) {
      console.error('Failed to load content previews:', err);
      setError(err.message || 'Failed to load content previews');
    } finally {
      setLoading(false);
    }
  };

  const regeneratePreviews = async () => {
    try {
      setRegenerating(true);
      setError(null);

      await apiClient.regeneratePreviews(contentId);
      await loadPreviews(); // Reload previews after regeneration
    } catch (err: any) {
      console.error('Failed to regenerate previews:', err);
      setError(err.message || 'Failed to regenerate previews');
    } finally {
      setRegenerating(false);
    }
  };

  const previewAllPlatforms = async () => {
    try {
      setPreviewingAll(true);
      setError(null);

      await apiClient.previewAllPlatforms(contentId);
      await loadPreviews(); // Reload previews after generation
    } catch (err: any) {
      console.error('Failed to preview all platforms:', err);
      setError(err.message || 'Failed to preview all platforms');
    } finally {
      setPreviewingAll(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generated':
        return '✅';
      case 'pending':
        return '⏳';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPreviewData = (previewData: any) => {
    if (typeof previewData === 'string') {
      return previewData;
    }
    return JSON.stringify(previewData, null, 2);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Platform Previews</h3>
          <p className="text-sm text-gray-600">Preview how content will appear on different platforms</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={previewAllPlatforms}
            disabled={previewingAll}
            className="btn-secondary"
          >
            {previewingAll ? 'Generating...' : 'Preview All'}
          </button>
          <button
            onClick={regeneratePreviews}
            disabled={regenerating}
            className="btn-primary"
          >
            {regenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      </div>

      {/* Previews List */}
      {previews.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">👁️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Previews</h3>
          <p className="text-gray-600">Generate previews to see how your content will appear on different platforms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {previews.map((preview) => (
            <div key={preview.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {preview.platform === 'FACEBOOK' && '📘'}
                    {preview.platform === 'INSTAGRAM' && '📷'}
                    {preview.platform === 'LINKEDIN' && '💼'}
                    {preview.platform === 'TWITTER' && '🐦'}
                    {preview.platform === 'YOUTUBE' && '📺'}
                    {!['FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'TWITTER', 'YOUTUBE'].includes(preview.platform) && '📱'}
                  </span>
                  <h4 className="font-medium text-gray-900 capitalize">
                    {preview.platform.toLowerCase()}
                  </h4>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(preview.status)}`}>
                  {getStatusIcon(preview.status)} {preview.status}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Preview Data
                  </label>
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                    {preview.status === 'generated' ? (
                      <pre className="whitespace-pre-wrap">{formatPreviewData(preview.previewData)}</pre>
                    ) : preview.status === 'pending' ? (
                      'Generating preview...'
                    ) : (
                      'Failed to generate preview'
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  Generated: {formatDate(preview.createdAt)}
                </div>
              </div>
            </div>
          ))}
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
        <h4 className="font-medium text-blue-900 mb-2">Platform Previews</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">👁️</span>
            <div>
              <p className="font-medium">Preview Generation</p>
              <p>See how your content will appear on different social media platforms.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">🔄</span>
            <div>
              <p className="font-medium">Regeneration</p>
              <p>Regenerate previews when content is updated or platform requirements change.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">📱</span>
            <div>
              <p className="font-medium">Platform Optimization</p>
              <p>Each platform has different character limits and formatting requirements.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
