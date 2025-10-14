'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface TestJob {
  id: string;
  name: string;
  data: any;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  createdAt?: string;
  completedAt?: string;
}

export default function JobQueueDashboard() {
  const [testJobs, setTestJobs] = useState<TestJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [testJobData, setTestJobData] = useState('{"message": "Test job data"}');

  useEffect(() => {
    loadTestJobs();
    // Refresh every 10 seconds
    const interval = setInterval(loadTestJobs, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadTestJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const jobStatus = await apiClient.getTestJobStatus();
      
      // Convert to TestJob format
      const testJob: TestJob = {
        id: jobStatus.id,
        name: jobStatus.name,
        data: jobStatus.data,
        status: 'completed', // Assume completed since we got the status
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };

      setTestJobs([testJob]);
    } catch (err: any) {
      console.error('Failed to load test jobs:', err);
      setError(err.message || 'Failed to load test jobs');
    } finally {
      setLoading(false);
    }
  };

  const createTestJob = async () => {
    try {
      setLoading(true);
      setError(null);

      let data;
      try {
        data = JSON.parse(testJobData);
      } catch {
        data = { message: testJobData };
      }

      const newJob = await apiClient.enqueueTestJob({ data });
      
      const testJob: TestJob = {
        id: newJob.id,
        name: newJob.name,
        data: newJob.data,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      setTestJobs(prev => [testJob, ...prev]);
      setShowCreateModal(false);
      setTestJobData('{"message": "Test job data"}');
    } catch (err: any) {
      console.error('Failed to create test job:', err);
      setError(err.message || 'Failed to create test job');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'running':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'running':
        return '🔄';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Job Queue Management</h2>
            <p className="text-sm text-gray-600">Monitor and manage background job processing</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create Test Job
          </button>
        </div>

        {/* Queue Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">📋</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{testJobs.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-lg">⏳</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {testJobs.filter(job => job.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-lg">✅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {testJobs.filter(job => job.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 text-lg">❌</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {testJobs.filter(job => job.status === 'failed').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Jobs List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Test Jobs</h3>
            <p className="card-description">Background test jobs and their status</p>
          </div>
          <div className="card-content">
            {testJobs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Jobs</h3>
                <p className="text-gray-600">Create your first test job to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {testJobs.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getStatusIcon(job.status || 'unknown')}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{job.name}</h4>
                          <p className="text-sm text-gray-600">Job ID: {job.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getStatusColor(job.status || 'unknown')}`}>
                          {job.status || 'Unknown'}
                        </div>
                        {job.createdAt && (
                          <div className="text-xs text-gray-500">
                            Created: {formatDate(job.createdAt)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Job Data
                        </label>
                        <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(job.data, null, 2)}
                        </pre>
                      </div>
                      
                      {job.completedAt && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Completed At
                          </label>
                          <div className="text-sm text-gray-900">
                            {formatDate(job.completedAt)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Test Job Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Create Test Job</h2>
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
                      Job Data (JSON)
                    </label>
                    <textarea
                      value={testJobData}
                      onChange={(e) => setTestJobData(e.target.value)}
                      className="input w-full h-32 resize-none font-mono text-sm"
                      placeholder='{"message": "Test job data", "priority": "high"}'
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter JSON data for the test job, or plain text for simple messages
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
                  onClick={createTestJob}
                  disabled={loading || !testJobData.trim()}
                  className="btn-primary"
                >
                  {loading ? 'Creating...' : 'Create Job'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="card">
            <div className="card-content">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-red-600 text-lg">❌</span>
                  <span className="text-sm text-red-800">Error: {error}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Information */}
        <div className="card">
          <div className="card-content">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Queue Help</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-lg">📋</span>
                <div>
                  <p className="font-medium text-gray-900">Test Jobs</p>
                  <p>Test jobs are used to verify that the job queue system is working correctly.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600 text-lg">✅</span>
                <div>
                  <p className="font-medium text-gray-900">Job Status</p>
                  <p>Jobs can be pending, running, completed, or failed. Status updates automatically.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600 text-lg">🔄</span>
                <div>
                  <p className="font-medium text-gray-900">Auto Refresh</p>
                  <p>Job status is automatically refreshed every 10 seconds to show real-time updates.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
