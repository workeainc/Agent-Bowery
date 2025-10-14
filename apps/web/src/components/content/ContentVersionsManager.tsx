'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface ContentVersion {
  id: string;
  contentItemId: string;
  version: number;
  body: string;
  metadataJson: Record<string, any>;
  createdAt: string;
  isCurrent?: boolean;
}

interface ContentVersionsManagerProps {
  contentId: string;
  onVersionChange?: (version: ContentVersion) => void;
}

export default function ContentVersionsManager({ contentId, onVersionChange }: ContentVersionsManagerProps) {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVersion, setNewVersion] = useState({
    body: '',
    metadataJson: {} as Record<string, any>,
  });

  useEffect(() => {
    if (contentId) {
      loadVersions();
    }
  }, [contentId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setError(null);

      const versionsData = await apiClient.getContentVersions(contentId);
      setVersions(versionsData);
    } catch (err: any) {
      console.error('Failed to load content versions:', err);
      setError(err.message || 'Failed to load content versions');
    } finally {
      setLoading(false);
    }
  };

  const createVersion = async () => {
    try {
      setLoading(true);
      setError(null);

      const nextVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version)) + 1 : 1;
      
      const versionData = await apiClient.createContentVersion(contentId, {
        version: nextVersion,
        body: newVersion.body,
        metadataJson: newVersion.metadataJson,
      });

      setVersions(prev => [...prev, versionData]);
      setShowCreateModal(false);
      setNewVersion({ body: '', metadataJson: {} });
    } catch (err: any) {
      console.error('Failed to create version:', err);
      setError(err.message || 'Failed to create version');
    } finally {
      setLoading(false);
    }
  };

  const setCurrentVersion = async (versionId: string) => {
    try {
      setLoading(true);
      setError(null);

      await apiClient.setCurrentVersion(contentId, versionId);
      
      // Update local state
      setVersions(prev => prev.map(v => ({
        ...v,
        isCurrent: v.id === versionId
      })));

      // Notify parent component
      const currentVersion = versions.find(v => v.id === versionId);
      if (currentVersion && onVersionChange) {
        onVersionChange(currentVersion);
      }
    } catch (err: any) {
      console.error('Failed to set current version:', err);
      setError(err.message || 'Failed to set current version');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatMetadata = (metadata: Record<string, any>) => {
    return Object.keys(metadata).length > 0 
      ? JSON.stringify(metadata, null, 2)
      : 'No metadata';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Content Versions</h3>
          <p className="text-sm text-gray-600">Manage different versions of this content</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Create Version
        </button>
      </div>

      {/* Versions List */}
      {versions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Versions</h3>
          <p className="text-gray-600">Create your first version to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((version) => (
            <div key={version.id} className={`border rounded-lg p-4 ${
              version.isCurrent ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    version.isCurrent 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    v{version.version}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Version {version.version}
                      {version.isCurrent && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Current
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Created: {formatDate(version.createdAt)}
                    </p>
                  </div>
                </div>
                {!version.isCurrent && (
                  <button
                    onClick={() => setCurrentVersion(version.id)}
                    disabled={loading}
                    className="btn-secondary"
                  >
                    Set Current
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content Body
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                    {version.body || 'No content'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metadata
                  </label>
                  <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                    {formatMetadata(version.metadataJson)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Version Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create New Version</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Body
                  </label>
                  <textarea
                    value={newVersion.body}
                    onChange={(e) => setNewVersion({ ...newVersion, body: e.target.value })}
                    className="input w-full h-32 resize-none"
                    placeholder="Enter the content for this version..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metadata (JSON)
                  </label>
                  <textarea
                    value={JSON.stringify(newVersion.metadataJson, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setNewVersion({ ...newVersion, metadataJson: parsed });
                      } catch {
                        // Invalid JSON, keep the text for user to fix
                      }
                    }}
                    className="input w-full h-24 resize-none font-mono text-sm"
                    placeholder='{"key": "value"}'
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter valid JSON for metadata (optional)
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={createVersion}
                disabled={loading || !newVersion.body.trim()}
                className="btn-primary"
              >
                {loading ? 'Creating...' : 'Create Version'}
              </button>
            </div>
          </div>
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
    </div>
  );
}
