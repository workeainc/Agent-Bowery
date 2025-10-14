'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface MediaProcessingProps {
  organizationId?: string;
}

export default function MediaProcessing({ organizationId }: MediaProcessingProps) {
  const [files, setFiles] = useState<any[]>([]);
  const [processingHistory, setProcessingHistory] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'files' | 'history' | 'presets'>('files');
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingSettings, setProcessingSettings] = useState({
    type: 'optimization' as 'optimization' | 'conversion' | 'processing',
    presetId: '',
    customSettings: {
      quality: 80,
      format: 'webp' as 'jpeg' | 'png' | 'webp' | 'avif',
      targetSize: 0,
      removeMetadata: true,
      optimizeForWeb: true
    }
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [filesResult, historyResult, presetsResult] = await Promise.all([
        apiClient.getMediaFiles({ organizationId, limit: 50 }),
        apiClient.getMediaProcessingHistory({ organizationId, limit: 20 }),
        apiClient.getMediaProcessingPresets()
      ]);
      
      setFiles(filesResult.files);
      setProcessingHistory(historyResult.history);
      setPresets(presetsResult.presets);
    } catch (err: any) {
      console.error('Failed to load media processing data:', err);
      setError(err.message || 'Failed to load media processing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map(file => file.id));
    }
  };

  const handleBatchProcess = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file to process');
      return;
    }

    try {
      setLoading(true);
      
      const result = await apiClient.batchProcessMedia(selectedFiles, {
        type: processingSettings.type,
        settings: processingSettings.customSettings,
        presetId: processingSettings.presetId || undefined
      });
      
      if (result.success) {
        setShowProcessingModal(false);
        setSelectedFiles([]);
        await loadData();
        alert(`Batch processing started for ${result.totalFiles} files. Estimated time: ${Math.round(result.estimatedTime / 60)} minutes`);
      }
    } catch (err: any) {
      console.error('Failed to start batch processing:', err);
      alert('Failed to start batch processing: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const getFileTypeIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    return '📄';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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
            <h3 className="text-sm font-medium text-red-800">Error Loading Media Processing</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadData}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Media Processing</h2>
          <p className="text-gray-600 mt-1">
            Optimize, convert, and process your media files
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedFiles.length > 0 && (
            <span className="text-sm text-gray-600">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </span>
          )}
          <button
            onClick={() => setShowProcessingModal(true)}
            disabled={selectedFiles.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Process Selected
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { key: 'files', label: 'Media Files', icon: '📁' },
            { key: 'history', label: 'Processing History', icon: '📋' },
            { key: 'presets', label: 'Presets', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Media Files ({files.length})
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedFiles.length === files.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {files.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No media files found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Upload some media files to get started
                  </p>
                </div>
              ) : (
                files.map((file) => (
                  <div key={file.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => handleFileSelect(file.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      
                      <div className="flex-shrink-0">
                        <span className="text-2xl">{getFileTypeIcon(file.mimeType)}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{formatFileSize(file.size)}</span>
                          <span>{file.mimeType}</span>
                          <span>Uploaded: {formatDate(file.uploadedAt)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                          {file.category || 'uncategorized'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Processing History ({processingHistory.length})
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {processingHistory.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No processing history</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Process some files to see history here
                  </p>
                </div>
              ) : (
                processingHistory.map((item) => (
                  <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-lg">{getFileTypeIcon('image/jpeg')}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.type} - {item.originalFileId}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Created: {formatDate(item.createdAt)}</span>
                            {item.completedAt && (
                              <span>Completed: {formatDate(item.completedAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status.toUpperCase()}
                        </span>
                        {item.status === 'processing' && (
                          <div className="text-sm text-gray-600">
                            {item.progress}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Processing Presets ({presets.length})
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {presets.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No presets available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create custom processing presets for common operations
                  </p>
                </div>
              ) : (
                presets.map((preset) => (
                  <div key={preset.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{preset.name}</h4>
                        <p className="text-sm text-gray-600">{preset.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {preset.type}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                            {preset.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          Use Preset
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Processing Modal */}
      {showProcessingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Process Media Files</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Processing Type
                </label>
                <select
                  className="input w-full"
                  value={processingSettings.type}
                  onChange={(e) => setProcessingSettings(prev => ({ 
                    ...prev, 
                    type: e.target.value as any 
                  }))}
                >
                  <option value="optimization">Optimization</option>
                  <option value="conversion">Format Conversion</option>
                  <option value="processing">Custom Processing</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preset (Optional)
                </label>
                <select
                  className="input w-full"
                  value={processingSettings.presetId}
                  onChange={(e) => setProcessingSettings(prev => ({ 
                    ...prev, 
                    presetId: e.target.value 
                  }))}
                >
                  <option value="">No preset</option>
                  {presets.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} ({preset.type})
                    </option>
                  ))}
                </select>
              </div>
              
              {processingSettings.type === 'optimization' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality Level
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={processingSettings.customSettings.quality}
                      onChange={(e) => setProcessingSettings(prev => ({
                        ...prev,
                        customSettings: {
                          ...prev.customSettings,
                          quality: parseInt(e.target.value)
                        }
                      }))}
                      className="w-full"
                    />
                    <div className="text-sm text-gray-600">
                      {processingSettings.customSettings.quality}%
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Format
                    </label>
                    <select
                      className="input w-full"
                      value={processingSettings.customSettings.format}
                      onChange={(e) => setProcessingSettings(prev => ({
                        ...prev,
                        customSettings: {
                          ...prev.customSettings,
                          format: e.target.value as any
                        }
                      }))}
                    >
                      <option value="webp">WebP</option>
                      <option value="jpeg">JPEG</option>
                      <option value="png">PNG</option>
                      <option value="avif">AVIF</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={processingSettings.customSettings.removeMetadata}
                        onChange={(e) => setProcessingSettings(prev => ({
                          ...prev,
                          customSettings: {
                            ...prev.customSettings,
                            removeMetadata: e.target.checked
                          }
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Remove metadata</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={processingSettings.customSettings.optimizeForWeb}
                        onChange={(e) => setProcessingSettings(prev => ({
                          ...prev,
                          customSettings: {
                            ...prev.customSettings,
                            optimizeForWeb: e.target.checked
                          }
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Optimize for web</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowProcessingModal(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBatchProcess}
                  className="btn-primary"
                >
                  Start Processing ({selectedFiles.length} files)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
