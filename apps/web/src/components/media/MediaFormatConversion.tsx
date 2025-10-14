'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface MediaFormatConversionProps {
  fileId: string;
  onConverted?: (result: any) => void;
}

export default function MediaFormatConversion({ fileId, onConverted }: MediaFormatConversionProps) {
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversionSettings, setConversionSettings] = useState({
    targetFormat: 'webp' as 'jpeg' | 'png' | 'webp' | 'avif' | 'gif' | 'mp4' | 'webm' | 'mov',
    quality: 80,
    resolution: { width: 0, height: 0 },
    framerate: 30,
    bitrate: 1000,
    audioCodec: 'aac',
    videoCodec: 'h264'
  });
  const [conversionResult, setConversionResult] = useState<any>(null);

  const loadFile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiClient.getMediaFile(fileId);
      setFile(result.file);
      
      // Set default resolution based on file metadata
      if (result.file.metadata?.width && result.file.metadata?.height) {
        setConversionSettings(prev => ({
          ...prev,
          resolution: {
            width: result.file.metadata.width,
            height: result.file.metadata.height
          }
        }));
      }
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

  const handleConvert = async () => {
    try {
      setConverting(true);
      setError(null);
      
      const result = await apiClient.convertMediaFormat(fileId, conversionSettings);
      
      if (result.success) {
        setConversionResult(result);
        if (onConverted) {
          onConverted(result);
        }
      }
    } catch (err: any) {
      console.error('Failed to convert media:', err);
      setError(err.message || 'Failed to convert media');
    } finally {
      setConverting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    return '📄';
  };

  const getFormatDescription = (format: string): string => {
    const descriptions: Record<string, string> = {
      'jpeg': 'JPEG - Universal compatibility, good for photos',
      'png': 'PNG - Lossless compression, good for graphics',
      'webp': 'WebP - Modern format, excellent compression',
      'avif': 'AVIF - Next-gen format, best compression',
      'gif': 'GIF - Animated images, limited colors',
      'mp4': 'MP4 - Universal video format',
      'webm': 'WebM - Web-optimized video format',
      'mov': 'MOV - Apple QuickTime format'
    };
    return descriptions[format] || 'Unknown format';
  };

  const isVideoFormat = (format: string): boolean => {
    return ['mp4', 'webm', 'mov'].includes(format);
  };

  const isImageFormat = (format: string): boolean => {
    return ['jpeg', 'png', 'webp', 'avif', 'gif'].includes(format);
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
        
        <div className="flex items-center space-x-4 mb-4">
          <span className="text-3xl">{getFileTypeIcon(file.mimeType)}</span>
          <div>
            <h4 className="text-lg font-medium text-gray-900">{file.name}</h4>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{file.mimeType}</span>
              <span>{formatFileSize(file.size)}</span>
              {file.metadata?.width && file.metadata?.height && (
                <span>{file.metadata.width} × {file.metadata.height}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Conversion Settings</h3>
        
        <div className="space-y-6">
          {/* Target Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Format
            </label>
            <select
              className="input w-full"
              value={conversionSettings.targetFormat}
              onChange={(e) => setConversionSettings(prev => ({
                ...prev,
                targetFormat: e.target.value as any
              }))}
            >
              <optgroup label="Image Formats">
                <option value="webp">WebP - Modern web format</option>
                <option value="avif">AVIF - Next-gen format</option>
                <option value="jpeg">JPEG - Universal compatibility</option>
                <option value="png">PNG - Lossless compression</option>
                <option value="gif">GIF - Animated images</option>
              </optgroup>
              <optgroup label="Video Formats">
                <option value="mp4">MP4 - Universal video</option>
                <option value="webm">WebM - Web-optimized</option>
                <option value="mov">MOV - QuickTime format</option>
              </optgroup>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {getFormatDescription(conversionSettings.targetFormat)}
            </p>
          </div>

          {/* Quality */}
          {isImageFormat(conversionSettings.targetFormat) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality Level: {conversionSettings.quality}%
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={conversionSettings.quality}
                onChange={(e) => setConversionSettings(prev => ({
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
          )}

          {/* Resolution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Width</label>
                <input
                  type="number"
                  className="input w-full"
                  value={conversionSettings.resolution.width || ''}
                  onChange={(e) => setConversionSettings(prev => ({
                    ...prev,
                    resolution: {
                      ...prev.resolution,
                      width: e.target.value ? parseInt(e.target.value) : 0
                    }
                  }))}
                  placeholder="Auto"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Height</label>
                <input
                  type="number"
                  className="input w-full"
                  value={conversionSettings.resolution.height || ''}
                  onChange={(e) => setConversionSettings(prev => ({
                    ...prev,
                    resolution: {
                      ...prev.resolution,
                      height: e.target.value ? parseInt(e.target.value) : 0
                    }
                  }))}
                  placeholder="Auto"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to maintain original aspect ratio
            </p>
          </div>

          {/* Video Settings */}
          {isVideoFormat(conversionSettings.targetFormat) && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Video Settings</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frame Rate
                  </label>
                  <select
                    className="input w-full"
                    value={conversionSettings.framerate}
                    onChange={(e) => setConversionSettings(prev => ({
                      ...prev,
                      framerate: parseInt(e.target.value)
                    }))}
                  >
                    <option value="24">24 fps (Cinema)</option>
                    <option value="30">30 fps (Standard)</option>
                    <option value="60">60 fps (Smooth)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bitrate (kbps)
                  </label>
                  <input
                    type="number"
                    className="input w-full"
                    value={conversionSettings.bitrate}
                    onChange={(e) => setConversionSettings(prev => ({
                      ...prev,
                      bitrate: parseInt(e.target.value)
                    }))}
                    min="100"
                    max="10000"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video Codec
                  </label>
                  <select
                    className="input w-full"
                    value={conversionSettings.videoCodec}
                    onChange={(e) => setConversionSettings(prev => ({
                      ...prev,
                      videoCodec: e.target.value
                    }))}
                  >
                    <option value="h264">H.264 (Universal)</option>
                    <option value="h265">H.265 (HEVC)</option>
                    <option value="vp9">VP9 (WebM)</option>
                    <option value="av1">AV1 (Next-gen)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Audio Codec
                  </label>
                  <select
                    className="input w-full"
                    value={conversionSettings.audioCodec}
                    onChange={(e) => setConversionSettings(prev => ({
                      ...prev,
                      audioCodec: e.target.value
                    }))}
                  >
                    <option value="aac">AAC (Universal)</option>
                    <option value="mp3">MP3 (Compatible)</option>
                    <option value="opus">Opus (WebM)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Convert Button */}
          <div className="pt-4">
            <button
              onClick={handleConvert}
              disabled={converting}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {converting ? 'Converting...' : 'Convert Media'}
            </button>
          </div>
        </div>
      </div>

      {/* Conversion Result */}
      {conversionResult && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Conversion Result</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Original</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Format:</span>
                    <span className="font-medium">{file.mimeType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Size:</span>
                    <span className="font-medium">{formatFileSize(file.size)}</span>
                  </div>
                  {file.metadata?.width && file.metadata?.height && (
                    <div className="flex justify-between text-sm">
                      <span>Resolution:</span>
                      <span className="font-medium">{file.metadata.width} × {file.metadata.height}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Converted</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Format:</span>
                    <span className="font-medium text-green-600">{conversionSettings.targetFormat.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Size:</span>
                    <span className="font-medium text-green-600">{formatFileSize(conversionResult.conversion.convertedSize)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Processing:</span>
                    <span className="font-medium text-green-600">{(conversionResult.conversion.processingTime / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Conversion Details</h4>
              <div className="text-sm text-gray-600">
                <p><strong>Original Format:</strong> {conversionResult.conversion.originalFormat}</p>
                <p><strong>Target Format:</strong> {conversionResult.conversion.targetFormat}</p>
                <p><strong>Size Change:</strong> {formatFileSize(conversionResult.conversion.originalSize)} → {formatFileSize(conversionResult.conversion.convertedSize)}</p>
                <p><strong>Processing Time:</strong> {(conversionResult.conversion.processingTime / 1000).toFixed(1)} seconds</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <a
                href={conversionResult.convertedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                Download Converted File →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
