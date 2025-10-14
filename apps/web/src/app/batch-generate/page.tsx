'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AppShell from '@/components/layout/AppShell';
import { apiClient } from '@/lib/api-client';
import { ContentManager } from '@/components/auth/RoleGuard';

interface BatchJob {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  createdAt: string;
  completedAt?: string;
  results: BatchResult[];
}

interface BatchResult {
  id: string;
  title: string;
  content: string;
  status: 'success' | 'failed';
  error?: string;
}

interface BatchItem {
  id: string;
  prompt: string;
  contentType: string;
  tone: string;
  length: string;
  keywords: string;
  targetAudience: string;
}

export default function BatchGenerationPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    jobName: '',
    template: '',
    items: [] as BatchItem[],
  });

  const addBatchItem = () => {
    const newItem: BatchItem = {
      id: Date.now().toString(),
      prompt: '',
      contentType: 'BLOG',
      tone: 'professional',
      length: 'medium',
      keywords: '',
      targetAudience: '',
    };
    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    });
  };

  const removeBatchItem = (id: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== id),
    });
  };

  const updateBatchItem = (id: string, field: keyof BatchItem, value: string) => {
    setFormData({
      ...formData,
      items: formData.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const handleCreateBatchJob = async () => {
    if (!formData.jobName.trim() || formData.items.length === 0) {
      alert('Please enter a job name and add at least one item');
      return;
    }

    if (formData.items.some(item => !item.prompt.trim())) {
      alert('Please fill in prompts for all items');
      return;
    }

    setLoading(true);

    try {
      // Prepare data for backend
      const organizationId = session?.user?.organizationId || 'default';
      const briefs = formData.items.map(item => ({
        id: item.id,
        brief: item.prompt,
        kind: item.contentType as 'BLOG' | 'NEWSLETTER' | 'SOCIAL',
        angle: item.tone,
        title: item.prompt.substring(0, 100),
        platform: item.contentType === 'SOCIAL_POST' ? 'meta' : undefined
      }));

      // Create batch job via backend
      const result = await apiClient.createBatchGenerationJob({
        organizationId,
        channel: 'default',
        briefs,
        options: {
          parallel: true,
          maxConcurrency: 3,
          retryFailed: true,
          notifyOnCompletion: true
        }
      });

      const newJob: BatchJob = {
        id: result.jobId,
        name: formData.jobName,
        status: 'pending',
        progress: 0,
        totalItems: result.totalItems,
        completedItems: 0,
        failedItems: 0,
        createdAt: new Date().toISOString(),
        results: [],
      };

      setBatchJobs(prev => [newJob, ...prev]);
      setShowCreateModal(false);
      resetForm();

      // Start monitoring the real batch job
      monitorBatchJob(result.jobId);
    } catch (error) {
      console.error('Failed to create batch job:', error);
      alert('Failed to create batch job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const monitorBatchJob = async (jobId: string) => {
    const pollInterval = 3000; // Poll every 3 seconds
    const maxPollTime = 10 * 60 * 1000; // Stop polling after 10 minutes
    const startTime = Date.now();

    const poll = async () => {
      try {
        const progress = await apiClient.getBatchJobProgress(jobId);
        
        setBatchJobs(prev => prev.map(job => {
          if (job.id === jobId) {
            const updatedJob = {
              ...job,
              status: progress.status,
              progress: progress.progress || 0,
              completedItems: progress.completedItems || 0,
              failedItems: progress.failedItems || 0,
              results: progress.results || job.results,
              completedAt: progress.status === 'completed' ? new Date().toISOString() : job.completedAt
            };
            return updatedJob;
          }
          return job;
        }));

        // Continue polling if job is still running and we haven't exceeded max time
        if (progress.status === 'running' || progress.status === 'pending') {
          if (Date.now() - startTime < maxPollTime) {
            setTimeout(poll, pollInterval);
          } else {
            // Timeout - mark as failed
            setBatchJobs(prev => prev.map(job =>
              job.id === jobId ? { ...job, status: 'failed' } : job
            ));
          }
        }
      } catch (error) {
        console.error('Failed to poll batch job progress:', error);
        // Mark as failed on error
        setBatchJobs(prev => prev.map(job =>
          job.id === jobId ? { ...job, status: 'failed' } : job
        ));
      }
    };

    // Start polling
    setTimeout(poll, pollInterval);
  };

  const handleCancelBatchJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to cancel this batch job?')) {
      return;
    }

    try {
      await apiClient.cancelBatchJob(jobId);
      setBatchJobs(prev => prev.map(job =>
        job.id === jobId ? { ...job, status: 'failed' } : job
      ));
    } catch (error) {
      console.error('Failed to cancel batch job:', error);
      alert('Failed to cancel batch job. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      jobName: '',
      template: '',
      items: [],
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        return '📋';
    }
  };

  return (
    <ContentManager fallback={
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to use batch generation.</p>
          </div>
        </div>
      </AppShell>
    }>
      <AppShell>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Batch Content Generation</h1>
              <p className="text-gray-600 mt-2">
                Generate multiple pieces of content simultaneously
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Batch Job
            </button>
          </div>

          {/* Batch Jobs List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Batch Jobs ({batchJobs.length})</h2>
            
            {batchJobs.map((job) => (
              <div key={job.id} className="card">
                <div className="card-content">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getStatusIcon(job.status)}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{job.name}</h3>
                        <p className="text-sm text-gray-600">
                          Created: {new Date(job.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(job.status)}`}>
                        {job.status.toUpperCase()}
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {job.completedItems}/{job.totalItems} items
                        </div>
                        <div className="text-xs text-gray-500">
                          {job.failedItems > 0 && `${job.failedItems} failed`}
                        </div>
                      </div>
                      {(job.status === 'running' || job.status === 'pending') && (
                        <button
                          onClick={() => handleCancelBatchJob(job.id)}
                          className="btn-outline btn-sm text-red-600 hover:text-red-700"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{job.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          job.status === 'completed' ? 'bg-green-500' :
                          job.status === 'failed' ? 'bg-red-500' :
                          job.status === 'running' ? 'bg-blue-500' : 'bg-gray-500'
                        }`}
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Results */}
                  {job.results.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Generated Content:</h4>
                      <div className="space-y-2">
                        {job.results.map((result) => (
                          <div key={result.id} className={`p-3 rounded border ${
                            result.status === 'success' 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-red-50 border-red-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{result.title}</div>
                                {result.status === 'success' && (
                                  <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {result.content.substring(0, 100)}...
                                  </div>
                                )}
                                {result.status === 'failed' && result.error && (
                                  <div className="text-sm text-red-600 mt-1">{result.error}</div>
                                )}
                              </div>
                              <div className="ml-4">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  result.status === 'success' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {result.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {batchJobs.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No batch jobs yet</h3>
                <p className="text-gray-500 mb-4">
                  Create your first batch job to generate multiple pieces of content at once.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  Create Batch Job
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Create Batch Job Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Create Batch Job</h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Job Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Name *
                  </label>
                  <input
                    type="text"
                    value={formData.jobName}
                    onChange={(e) => setFormData({ ...formData, jobName: e.target.value })}
                    className="input w-full"
                    placeholder="Enter batch job name..."
                  />
                </div>

                {/* Batch Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Content Items ({formData.items.length})
                    </label>
                    <button
                      onClick={addBatchItem}
                      className="btn-outline btn-sm"
                    >
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                          <button
                            onClick={() => removeBatchItem(item.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Prompt */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Prompt *
                            </label>
                            <textarea
                              value={item.prompt}
                              onChange={(e) => updateBatchItem(item.id, 'prompt', e.target.value)}
                              className="input w-full h-20 resize-none"
                              placeholder="Describe what content you want to generate..."
                            />
                          </div>

                          {/* Content Type */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Content Type
                            </label>
                            <select
                              value={item.contentType}
                              onChange={(e) => updateBatchItem(item.id, 'contentType', e.target.value)}
                              className="input w-full"
                            >
                              <option value="BLOG">Blog Post</option>
                              <option value="NEWSLETTER">Newsletter</option>
                              <option value="SOCIAL_POST">Social Media Post</option>
                              <option value="EMAIL">Email</option>
                            </select>
                          </div>

                          {/* Tone */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tone
                            </label>
                            <select
                              value={item.tone}
                              onChange={(e) => updateBatchItem(item.id, 'tone', e.target.value)}
                              className="input w-full"
                            >
                              <option value="professional">Professional</option>
                              <option value="casual">Casual</option>
                              <option value="friendly">Friendly</option>
                              <option value="authoritative">Authoritative</option>
                              <option value="conversational">Conversational</option>
                            </select>
                          </div>

                          {/* Length */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Length
                            </label>
                            <select
                              value={item.length}
                              onChange={(e) => updateBatchItem(item.id, 'length', e.target.value)}
                              className="input w-full"
                            >
                              <option value="short">Short (100-300 words)</option>
                              <option value="medium">Medium (300-800 words)</option>
                              <option value="long">Long (800+ words)</option>
                            </select>
                          </div>

                          {/* Keywords */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Keywords
                            </label>
                            <input
                              type="text"
                              value={item.keywords}
                              onChange={(e) => updateBatchItem(item.id, 'keywords', e.target.value)}
                              className="input w-full"
                              placeholder="keyword1, keyword2, keyword3"
                            />
                          </div>

                          {/* Target Audience */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Target Audience
                            </label>
                            <input
                              type="text"
                              value={item.targetAudience}
                              onChange={(e) => updateBatchItem(item.id, 'targetAudience', e.target.value)}
                              className="input w-full"
                              placeholder="e.g., Marketing professionals"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {formData.items.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-gray-400 text-4xl mb-2">➕</div>
                      <p className="text-gray-500">No items added yet</p>
                      <button
                        onClick={addBatchItem}
                        className="btn-outline mt-2"
                      >
                        Add First Item
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateBatchJob}
                    className="btn-primary"
                    disabled={loading || !formData.jobName.trim() || formData.items.length === 0}
                  >
                    {loading ? 'Creating...' : 'Create Batch Job'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </ContentManager>
  );
}
