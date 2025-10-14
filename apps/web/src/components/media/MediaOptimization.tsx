'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface MediaOptimizationProps {
  fileId: string;
  onOptimized?: (result: any) => void;
}

export default function MediaOptimization({ fileId, onOptimized }: MediaOptimizationProps) {
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizationSettings, setOptimizationSettings] = useState({
    targetSize: 0,
    quality: 80,
    format: 'webp' as 'jpeg' | 'png' | 'webp' | 'avif',
    progressive: true,
    lossless: false,
    removeMetadata: true,
    optimizeForWeb: true
  });
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

  const loadFile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiClient.getMediaFile(fileId);
      setFile(result.file);
    } catch (err: any) {
      console.error('Failed to load file:', err);
      setError(err.message || 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fileId) {
      loadFile();
    }
  }, [fileId]);

  const handleOptimize = async () => {
    try {
      setOptimizing(true);
      setError(null);
      
      const result = await apiClient.optimizeMedia(fileId, optimizationSettings);
      
      if (result.success) {
        setOptimizationResult(result);
        if (onOptimized) {
          onOptimized(result);
        }
      }
    } catch (err: any) {
      console.error('Failed to optimize media:', err);
      setError(err.message || 'Failed to optimize media');
    } finally {
      setOptimizing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateCompressionRatio = (original: number, optimized: number): number => {
    return ((original - optimized) / original) * 100;
  };

  const getQualityDescription = (quality: number): string => {
    if (quality >= 90) return 'Excellent';
    if (quality >= 80) return 'Very Good';
    if (quality >= 70) return 'Good';
    if (quality >= 60) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
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
            <h3 className="text-sm font-medium text-red-800">Error Loading File</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadFile}
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

  if (!file) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* File Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">File Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">Name:</span>
            <p className="text-sm font-medium text-gray-900">{file.name}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Type:</span>
            <p className="text-sm font-medium text-gray-900">{file.mimeType}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Size:</span>
            <p className="text-sm font-medium text-gray-900">{formatFileSize(file.size)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Dimensions:</span>
            <p className="text-sm font-medium text-gray-900">
              {file.metadata?.width && file.metadata?.height 
                ? `${file.metadata.width} × ${file.metadata.height}`
                : 'Unknown'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Optimization Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Optimization Settings</h3>
        
        <div className="space-y-6">
          {/* Quality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality Level: {optimizationSettings.quality}% ({getQualityDescription(optimizationSettings.quality)})
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={optimizationSettings.quality}
              onChange={(e) => setOptimizationSettings(prev => ({
                ...prev,
                quality: parseInt(e.target.value)
              }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low Quality</span>
              <span>High Quality</span>
            </div>
          </div>

          {/* Target Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Format
            </label>
            <select
              className="input w-full"
              value={optimizationSettings.format}
              onChange={(e) => setOptimizationSettings(prev => ({
                ...prev,
                format: e.target.value as any
              }))}
            >
              <option value="webp">WebP (Recommended for web)</option>
              <option value="avif">AVIF (Best compression)</option>
              <option value="jpeg">JPEG (Universal compatibility)</option>
              <option value="png">PNG (Lossless)</option>
            </select>
          </div>

          {/* Target Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target File Size (optional)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="input flex-1"
                value={optimizationSettings.targetSize || ''}
                onChange={(e) => setOptimizationSettings(prev => ({
                  ...prev,
                  targetSize: e.target.value ? parseInt(e.target.value) : 0
                }))}
                placeholder="Enter target size in bytes"
              />
              <span className="text-sm text-gray-500">bytes</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use quality setting only. Current: {formatFileSize(file.size)}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Optimization Options</h4>
            
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={optimizationSettings.progressive}
                  onChange={(e) => setOptimizationSettings(prev => ({
                    ...prev,
                    progressive: e.target.checked
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Progressive loading (JPEG)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={optimizationSettings.lossless}
                  onChange={(e) => setOptimizationSettings(prev => ({
                    ...prev,
                    lossless: e.target.checked
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Lossless compression (PNG/WebP)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={optimizationSettings.removeMetadata}
                  onChange={(e) => setOptimizationSettings(prev => ({
                    ...prev,
                    removeMetadata: e.target.checked
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Remove metadata (EXIF, etc.)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={optimizationSettings.optimizeForWeb}
                  onChange={(e) => setOptimizationSettings(prev => ({
                    ...prev,
                    optimizeForWeb: e.target.checked
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Optimize for web delivery</span>
              </label>
            </div>
          </div>

          {/* Optimize Button */}
          <div className="pt-4">
            <button
              onClick={handleOptimize}
              disabled={optimizing}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {optimizing ? 'Optimizing...' : 'Optimize Media'}
            </button>
          </div>
        </div>
      </div>

      {/* Optimization Result */}
      {optimizationResult && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Optimization Result</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Original</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Size:</span>
                    <span className="font-medium">{formatFileSize(optimizationResult.optimization.originalSize)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Format:</span>
                    <span className="font-medium">{file.mimeType}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Optimized</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Size:</span>
                    <span className="font-medium text-green-600">{formatFileSize(optimizationResult.optimization.optimizedSize)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Format:</span>
                    <span className="font-medium text-green-600">{optimizationSettings.format.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Compression Statistics</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {calculateCompressionRatio(
                      optimizationResult.optimization.originalSize,
                      optimizationResult.optimization.optimizedSize
                    ).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600">Size Reduction</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {optimizationResult.optimization.qualityScore}/100
                  </div>
                  <div className="text-xs text-gray-600">Quality Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {(optimizationResult.optimization.processingTime / 1000).toFixed(1)}s
                  </div>
                  <div className="text-xs text-gray-600">Processing Time</div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Optimizations Applied</h4>
              <div className="flex flex-wrap gap-2">
                {optimizationResult.optimization.optimizationsApplied.map((opt: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {opt}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <a
                href={optimizationResult.optimizedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Download Optimized File →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
