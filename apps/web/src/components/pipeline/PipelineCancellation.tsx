'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface PipelineCancellationProps {
  pipelineId?: string;
  onCancellationComplete?: (result: any) => void;
}

export default function PipelineCancellation({ pipelineId, onCancellationComplete }: PipelineCancellationProps) {
  const [cancellationResult, setCancellationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPipelineId, setSelectedPipelineId] = useState(pipelineId || '');
  const [cancelReason, setCancelReason] = useState('');

  const cancelPipeline = async () => {
    if (!selectedPipelineId.trim()) {
      setError('Pipeline ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.cancelPipeline(selectedPipelineId, cancelReason || undefined);
      setCancellationResult(result);

      if (onCancellationComplete) {
        onCancellationComplete(result);
      }
    } catch (err: any) {
      console.error('Failed to cancel pipeline:', err);
      setError(err.message || 'Failed to cancel pipeline');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Pipeline Cancellation</h3>
        <p className="text-sm text-gray-600">Cancel running pipelines and track affected steps</p>
      </div>

      {/* Pipeline ID Input */}
      <div className="card">
        <div className="card-content">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pipeline ID
              </label>
              <input
                type="text"
                value={selectedPipelineId}
                onChange={(e) => setSelectedPipelineId(e.target.value)}
                className="input w-full"
                placeholder="Enter pipeline ID to cancel..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason (Optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="input w-full h-20 resize-none"
                placeholder="Enter reason for cancellation..."
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={cancelPipeline}
                disabled={loading || !selectedPipelineId.trim()}
                className="btn-primary"
              >
                {loading ? 'Cancelling...' : 'Cancel Pipeline'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Results */}
      {cancellationResult && (
        <div className="space-y-6">
          {/* Cancellation Status */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Cancellation Results</h4>
              <div className="flex items-center space-x-2">
                <span className={`text-sm px-3 py-1 rounded-full ${
                  cancellationResult.success ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                }`}>
                  {cancellationResult.success ? 'Success' : 'Failed'}
                </span>
              </div>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline ID</label>
                    <div className="text-sm text-gray-900 font-mono">{cancellationResult.pipelineId}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cancelled At</label>
                    <div className="text-sm text-gray-900">{formatDate(cancellationResult.cancelledAt)}</div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                    {cancellationResult.reason || 'No reason provided'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Affected Steps */}
          {cancellationResult.affectedSteps && cancellationResult.affectedSteps.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Affected Steps</h4>
                <p className="card-description">Steps that were affected by the cancellation</p>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  {cancellationResult.affectedSteps.map((step: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">
                          {step.status === 'completed' ? '✅' : '❌'}
                        </span>
                        <div>
                          <h5 className="font-medium text-gray-900">{step.stepName}</h5>
                          <p className="text-sm text-gray-600">Step ID: {step.stepId}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStepStatusColor(step.status)}`}>
                        {step.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Cancellation Summary</h4>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600 text-lg">ℹ️</span>
                    <div>
                      <h5 className="font-medium text-blue-900 mb-1">Cancellation Complete</h5>
                      <p className="text-sm text-blue-800">
                        Pipeline {cancellationResult.pipelineId} has been successfully cancelled. 
                        All pending steps have been stopped and marked as cancelled.
                      </p>
                    </div>
                  </div>
                </div>

                {cancellationResult.affectedSteps && cancellationResult.affectedSteps.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <span className="text-yellow-600 text-lg">⚠️</span>
                      <div>
                        <h5 className="font-medium text-yellow-900 mb-1">Steps Affected</h5>
                        <p className="text-sm text-yellow-800">
                          {cancellationResult.affectedSteps.length} step(s) were affected by this cancellation. 
                          Completed steps remain completed, while pending steps were cancelled.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <span className="text-green-600 text-lg">✅</span>
                    <div>
                      <h5 className="font-medium text-green-900 mb-1">Next Steps</h5>
                      <p className="text-sm text-green-800">
                        The pipeline has been cancelled successfully. You can review the affected steps above 
                        and restart the pipeline if needed with the same or different configuration.
                      </p>
                    </div>
                  </div>
                </div>
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-medium text-red-900 mb-2">Pipeline Cancellation</h4>
        <div className="space-y-2 text-sm text-red-800">
          <div className="flex items-start space-x-2">
            <span className="text-red-600 text-lg">🛑</span>
            <div>
              <p className="font-medium">Emergency Stop</p>
              <p>Cancel running pipelines immediately to stop execution and prevent further processing.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-red-600 text-lg">📝</span>
            <div>
              <p className="font-medium">Reason Tracking</p>
              <p>Provide optional cancellation reasons for audit trails and process improvement.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-red-600 text-lg">🔍</span>
            <div>
              <p className="font-medium">Step Impact Analysis</p>
              <p>See which steps were affected by the cancellation and their final status.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-red-600 text-lg">⚠️</span>
            <div>
              <p className="font-medium">Irreversible Action</p>
              <p>Pipeline cancellation is irreversible. Completed steps remain completed, pending steps are cancelled.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
