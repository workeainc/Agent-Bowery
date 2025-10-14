'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface WorkflowManagementProps {
  contentId?: string;
  onWorkflowComplete?: (result: any) => void;
}

export default function WorkflowManagement({ contentId, onWorkflowComplete }: WorkflowManagementProps) {
  const [escalationResult, setEscalationResult] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'escalate' | 'analytics'>('escalate');
  const [escalationReason, setEscalationReason] = useState('');
  const [workflowId, setWorkflowId] = useState('');

  const escalateWorkflow = async () => {
    if (!contentId || !escalationReason.trim()) {
      setError('Content ID and escalation reason are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.escalateWorkflow(contentId, escalationReason);
      setEscalationResult(result);

      if (onWorkflowComplete) {
        onWorkflowComplete(result);
      }
    } catch (err: any) {
      console.error('Failed to escalate workflow:', err);
      setError(err.message || 'Failed to escalate workflow');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflowAnalytics = async () => {
    if (!workflowId.trim()) {
      setError('Workflow ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getWorkflowAnalytics(workflowId);
      setAnalyticsData(result);

      if (onWorkflowComplete) {
        onWorkflowComplete(result);
      }
    } catch (err: any) {
      console.error('Failed to load workflow analytics:', err);
      setError(err.message || 'Failed to load workflow analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Workflow Management</h3>
        <p className="text-sm text-gray-600">Manage content workflows and track analytics</p>
      </div>

      {/* Content ID Input */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content ID (for escalation)
              </label>
              <input
                type="text"
                value={contentId || ''}
                className="input w-full"
                placeholder="Enter content ID for workflow escalation..."
                disabled
              />
            </div>
            <div className="text-sm text-gray-500">
              {contentId ? 'Content selected' : 'No content selected'}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('escalate')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'escalate'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🚨 Escalate Workflow
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Workflow Analytics
          </button>
        </nav>
      </div>

      {/* Escalate Workflow Tab */}
      {activeTab === 'escalate' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Escalate Stuck Content</h4>
              <p className="text-sm text-gray-600">Escalate content that is stuck in workflow</p>
            </div>
            <button
              onClick={escalateWorkflow}
              disabled={loading || !contentId || !escalationReason.trim()}
              className="btn-primary"
            >
              {loading ? 'Escalating...' : 'Escalate Workflow'}
            </button>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Escalation Reason
                  </label>
                  <textarea
                    value={escalationReason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    className="input w-full h-24 resize-none"
                    placeholder="Describe why this content needs to be escalated..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Escalation Results */}
          {escalationResult && (
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Escalation Results</h4>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    escalationResult.success ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                  }`}>
                    {escalationResult.success ? 'Success' : 'Failed'}
                  </span>
                </div>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Escalation ID</label>
                      <div className="text-sm text-gray-900 font-mono">{escalationResult.escalationId}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <div className="text-sm text-gray-900">{escalationResult.success ? 'Escalated' : 'Failed'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                      {escalationResult.message}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Workflow Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Workflow Analytics</h4>
              <p className="text-sm text-gray-600">View workflow performance and trends</p>
            </div>
            <button
              onClick={loadWorkflowAnalytics}
              disabled={loading || !workflowId.trim()}
              className="btn-primary"
            >
              {loading ? 'Loading...' : 'Load Analytics'}
            </button>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workflow ID
                  </label>
                  <input
                    type="text"
                    value={workflowId}
                    onChange={(e) => setWorkflowId(e.target.value)}
                    className="input w-full"
                    placeholder="Enter workflow ID for analytics..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Results */}
          {analyticsData && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Workflow Metrics</h4>
                  <p className="card-description">Workflow ID: {analyticsData.workflowId}</p>
                </div>
                <div className="card-content">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.metrics.totalContent)}</div>
                      <div className="text-sm text-gray-600">Total Content</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{formatNumber(analyticsData.metrics.completedContent)}</div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{formatNumber(analyticsData.metrics.pendingContent)}</div>
                      <div className="text-sm text-gray-600">Pending</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{formatNumber(analyticsData.metrics.escalatedContent)}</div>
                      <div className="text-sm text-gray-600">Escalated</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{formatTime(analyticsData.metrics.averageProcessingTime)}</div>
                      <div className="text-sm text-gray-600">Avg. Time</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trends */}
              {analyticsData.trends && analyticsData.trends.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title">Workflow Trends</h4>
                  </div>
                  <div className="card-content">
                    <div className="space-y-3">
                      {analyticsData.trends.slice(-7).map((trend: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">
                            {new Date(trend.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-sm font-medium text-green-600">{formatNumber(trend.completed)}</div>
                              <div className="text-xs text-gray-500">Completed</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-red-600">{formatNumber(trend.escalated)}</div>
                              <div className="text-xs text-gray-500">Escalated</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-medium text-purple-900 mb-2">Workflow Management</h4>
        <div className="space-y-2 text-sm text-purple-800">
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">🚨</span>
            <div>
              <p className="font-medium">Workflow Escalation</p>
              <p>Escalate content that is stuck in workflow for manual review and resolution.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">📊</span>
            <div>
              <p className="font-medium">Workflow Analytics</p>
              <p>Monitor workflow performance, completion rates, and processing times.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">📈</span>
            <div>
              <p className="font-medium">Trend Analysis</p>
              <p>Track workflow trends over time to identify bottlenecks and improvements.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
