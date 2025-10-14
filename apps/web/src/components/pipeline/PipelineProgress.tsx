'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface PipelineProgressProps {
  pipelineId?: string;
  onProgressUpdate?: (progress: any) => void;
}

export default function PipelineProgress({ pipelineId, onProgressUpdate }: PipelineProgressProps) {
  const [progressData, setProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPipelineId, setSelectedPipelineId] = useState(pipelineId || '');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadProgress = async () => {
    if (!selectedPipelineId.trim()) {
      setError('Pipeline ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getPipelineProgress(selectedPipelineId);
      setProgressData(result);

      if (onProgressUpdate) {
        onProgressUpdate(result);
      }
    } catch (err: any) {
      console.error('Failed to load pipeline progress:', err);
      setError(err.message || 'Failed to load pipeline progress');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPipelineId && autoRefresh) {
      const interval = setInterval(loadProgress, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [selectedPipelineId, autoRefresh]);

  useEffect(() => {
    if (pipelineId) {
      setSelectedPipelineId(pipelineId);
      loadProgress();
    }
  }, [pipelineId]);

  const formatDuration = (seconds: number) => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    } else if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'running':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'running':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'skipped':
        return 'text-gray-600 bg-gray-100';
      case 'pending':
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'running':
        return '🔄';
      case 'failed':
        return '❌';
      case 'skipped':
        return '⏭️';
      case 'pending':
      default:
        return '⏳';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Pipeline Progress Monitoring</h3>
        <p className="text-sm text-gray-600">Monitor pipeline execution progress and status</p>
      </div>

      {/* Pipeline ID Input */}
      <div className="card">
        <div className="card-content">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pipeline ID
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={selectedPipelineId}
                  onChange={(e) => setSelectedPipelineId(e.target.value)}
                  className="input flex-1"
                  placeholder="Enter pipeline ID to monitor..."
                />
                <button
                  onClick={loadProgress}
                  disabled={loading || !selectedPipelineId.trim()}
                  className="btn-primary"
                >
                  {loading ? 'Loading...' : 'Load Progress'}
                </button>
              </div>
            </div>

            {progressData && (
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Auto-refresh every 5 seconds</span>
                </label>
                <div className="text-sm text-gray-500">
                  Last updated: {formatDate(progressData.updatedAt)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Results */}
      {progressData && (
        <div className="space-y-6">
          {/* Pipeline Overview */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Pipeline Overview</h4>
              <div className="flex items-center space-x-2">
                <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(progressData.status)}`}>
                  {progressData.status}
                </span>
                <span className="text-sm text-gray-600">
                  ID: {progressData.pipelineId}
                </span>
              </div>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-600">{progressData.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressData.progress}%` }}
                    />
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{progressData.completedSteps}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{progressData.totalSteps}</div>
                    <div className="text-sm text-gray-600">Total Steps</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{progressData.currentStep}</div>
                    <div className="text-sm text-gray-600">Current Step</div>
                  </div>
                  {progressData.estimatedTimeRemaining && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">
                        {formatDuration(progressData.estimatedTimeRemaining)}
                      </div>
                      <div className="text-sm text-gray-600">Est. Remaining</div>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
                  <div className="text-sm text-gray-600">
                    <div>Started: {formatDate(progressData.startedAt)}</div>
                    <div>Updated: {formatDate(progressData.updatedAt)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step Details */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Step Details</h4>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                {progressData.steps.map((step: any, index: number) => (
                  <div key={step.id} className={`border rounded-lg p-4 ${
                    step.status === 'completed' ? 'border-green-200 bg-green-50' :
                    step.status === 'running' ? 'border-blue-200 bg-blue-50' :
                    step.status === 'failed' ? 'border-red-200 bg-red-50' :
                    'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getStepStatusIcon(step.status)}</span>
                        <div>
                          <h5 className="font-medium text-gray-900">{step.name}</h5>
                          <p className="text-sm text-gray-600">Step {index + 1}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStepStatusColor(step.status)}`}>
                          {step.status}
                        </span>
                        {step.duration && (
                          <span className="text-xs text-gray-500">
                            {formatDuration(step.duration)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {step.startedAt && (
                        <div className="text-sm text-gray-600">
                          Started: {formatDate(step.startedAt)}
                        </div>
                      )}
                      {step.completedAt && (
                        <div className="text-sm text-gray-600">
                          Completed: {formatDate(step.completedAt)}
                        </div>
                      )}
                      {step.error && (
                        <div className="text-sm text-red-600 bg-red-100 p-2 rounded">
                          Error: {step.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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

      {/* Help Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Pipeline Progress Monitoring</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">📊</span>
            <div>
              <p className="font-medium">Real-time Progress</p>
              <p>Monitor pipeline execution progress with real-time updates and step-by-step tracking.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">🔄</span>
            <div>
              <p className="font-medium">Auto-refresh</p>
              <p>Enable auto-refresh to get real-time updates on pipeline progress and status changes.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">⏱️</span>
            <div>
              <p className="font-medium">Time Tracking</p>
              <p>Track step durations, estimated time remaining, and overall pipeline execution time.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">🚨</span>
            <div>
              <p className="font-medium">Error Monitoring</p>
              <p>Get detailed error information for failed steps and pipeline issues.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
