'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface BulkOperationsProps {
  contentId?: string;
  onBulkOperationComplete?: (result: any) => void;
}

export default function BulkOperations({ contentId, onBulkOperationComplete }: BulkOperationsProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'create'>('schedule');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Bulk Schedule State
  const [bulkSchedules, setBulkSchedules] = useState([
    { platform: '', scheduledAt: '', targetAccountId: '' }
  ]);

  // Bulk Create State
  const [bulkContent, setBulkContent] = useState([
    { title: '', type: 'SOCIAL_POST', body: '', tags: '' }
  ]);

  const addSchedule = () => {
    setBulkSchedules([...bulkSchedules, { platform: '', scheduledAt: '', targetAccountId: '' }]);
  };

  const removeSchedule = (index: number) => {
    setBulkSchedules(bulkSchedules.filter((_, i) => i !== index));
  };

  const updateSchedule = (index: number, field: string, value: string) => {
    const updated = [...bulkSchedules];
    updated[index] = { ...updated[index], [field]: value };
    setBulkSchedules(updated);
  };

  const addContent = () => {
    setBulkContent([...bulkContent, { title: '', type: 'SOCIAL_POST', body: '', tags: '' }]);
  };

  const removeContent = (index: number) => {
    setBulkContent(bulkContent.filter((_, i) => i !== index));
  };

  const updateContent = (index: number, field: string, value: string) => {
    const updated = [...bulkContent];
    updated[index] = { ...updated[index], [field]: value };
    setBulkContent(updated);
  };

  const executeBulkSchedule = async () => {
    if (!contentId) {
      setError('Content ID is required for bulk scheduling');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const validSchedules = bulkSchedules.filter(s => s.platform && s.scheduledAt);
      if (validSchedules.length === 0) {
        setError('Please add at least one valid schedule');
        return;
      }

      const result = await apiClient.bulkScheduleContent(contentId, validSchedules);
      setSuccess(`Successfully scheduled ${validSchedules.length} posts`);
      
      if (onBulkOperationComplete) {
        onBulkOperationComplete(result);
      }
    } catch (err: any) {
      console.error('Failed to execute bulk schedule:', err);
      setError(err.message || 'Failed to execute bulk schedule');
    } finally {
      setLoading(false);
    }
  };

  const executeBulkCreate = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const validContent = bulkContent.filter(c => c.title && c.body);
      if (validContent.length === 0) {
        setError('Please add at least one valid content item');
        return;
      }

      const contentItems = validContent.map(item => ({
        ...item,
        tags: item.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      }));

      const result = await apiClient.bulkCreateContent(contentItems);
      setSuccess(`Successfully created ${result.length} content items`);
      
      if (onBulkOperationComplete) {
        onBulkOperationComplete(result);
      }
    } catch (err: any) {
      console.error('Failed to execute bulk create:', err);
      setError(err.message || 'Failed to execute bulk create');
    } finally {
      setLoading(false);
    }
  };

  const platforms = ['FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'TWITTER', 'YOUTUBE'];
  const contentTypes = ['SOCIAL_POST', 'BLOG', 'NEWSLETTER'];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Bulk Operations</h3>
        <p className="text-sm text-gray-600">Perform bulk operations on content and schedules</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schedule'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bulk Schedule
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bulk Create
          </button>
        </nav>
      </div>

      {/* Bulk Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Schedule Multiple Posts</h4>
              <p className="text-sm text-gray-600">Schedule the same content across multiple platforms and times</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={addSchedule}
                className="btn-secondary"
              >
                Add Schedule
              </button>
              <button
                onClick={executeBulkSchedule}
                disabled={loading || !contentId}
                className="btn-primary"
              >
                {loading ? 'Scheduling...' : 'Execute Schedule'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {bulkSchedules.map((schedule, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">Schedule {index + 1}</h5>
                  {bulkSchedules.length > 1 && (
                    <button
                      onClick={() => removeSchedule(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Platform
                    </label>
                    <select
                      value={schedule.platform}
                      onChange={(e) => updateSchedule(index, 'platform', e.target.value)}
                      className="input w-full"
                    >
                      <option value="">Select Platform</option>
                      {platforms.map(platform => (
                        <option key={platform} value={platform}>{platform}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scheduled Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={schedule.scheduledAt}
                      onChange={(e) => updateSchedule(index, 'scheduledAt', e.target.value)}
                      className="input w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Account ID
                    </label>
                    <input
                      type="text"
                      value={schedule.targetAccountId}
                      onChange={(e) => updateSchedule(index, 'targetAccountId', e.target.value)}
                      placeholder="Optional"
                      className="input w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Create Tab */}
      {activeTab === 'create' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Create Multiple Content Items</h4>
              <p className="text-sm text-gray-600">Create multiple content items at once</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={addContent}
                className="btn-secondary"
              >
                Add Content
              </button>
              <button
                onClick={executeBulkCreate}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Creating...' : 'Execute Create'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {bulkContent.map((content, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">Content Item {index + 1}</h5>
                  {bulkContent.length > 1 && (
                    <button
                      onClick={() => removeContent(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={content.title}
                        onChange={(e) => updateContent(index, 'title', e.target.value)}
                        className="input w-full"
                        placeholder="Enter content title"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={content.type}
                        onChange={(e) => updateContent(index, 'type', e.target.value)}
                        className="input w-full"
                      >
                        {contentTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content Body
                    </label>
                    <textarea
                      value={content.body}
                      onChange={(e) => updateContent(index, 'body', e.target.value)}
                      className="input w-full h-24 resize-none"
                      placeholder="Enter content body"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={content.tags}
                      onChange={(e) => updateContent(index, 'tags', e.target.value)}
                      className="input w-full"
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-green-600 text-lg">✅</span>
            <span className="text-sm text-green-800">{success}</span>
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
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Bulk Operations</h4>
        <div className="space-y-2 text-sm text-yellow-800">
          <div className="flex items-start space-x-2">
            <span className="text-yellow-600 text-lg">📅</span>
            <div>
              <p className="font-medium">Bulk Schedule</p>
              <p>Schedule the same content across multiple platforms and times for efficient publishing.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-yellow-600 text-lg">📝</span>
            <div>
              <p className="font-medium">Bulk Create</p>
              <p>Create multiple content items at once to streamline your content creation workflow.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-yellow-600 text-lg">⚡</span>
            <div>
              <p className="font-medium">Efficiency</p>
              <p>Save time by performing multiple operations in a single action.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
