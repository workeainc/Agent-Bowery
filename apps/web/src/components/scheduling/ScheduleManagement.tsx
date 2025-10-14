'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface ScheduleItem {
  id: string;
  contentId: string;
  platform: string;
  scheduledAt: string;
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  content: {
    title: string;
    type: string;
  };
}

export default function ScheduleManagement() {
  const [dueSchedules, setDueSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'due' | 'reschedule' | 'cancel'>('due');
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [newScheduleTime, setNewScheduleTime] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const loadDueSchedules = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getDueSchedules();
      setDueSchedules(result);
    } catch (err: any) {
      console.error('Failed to load due schedules:', err);
      setError(err.message || 'Failed to load due schedules');
    } finally {
      setLoading(false);
    }
  };

  const rescheduleContent = async () => {
    if (!selectedSchedule || !newScheduleTime) {
      setError('Please select a schedule and enter a new time');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.rescheduleContent(selectedSchedule.id, newScheduleTime);
      
      if (result.success) {
        // Reload due schedules
        await loadDueSchedules();
        setSelectedSchedule(null);
        setNewScheduleTime('');
      }
    } catch (err: any) {
      console.error('Failed to reschedule content:', err);
      setError(err.message || 'Failed to reschedule content');
    } finally {
      setLoading(false);
    }
  };

  const cancelSchedule = async () => {
    if (!selectedSchedule) {
      setError('Please select a schedule to cancel');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.cancelSchedule(selectedSchedule.id, cancelReason);
      
      if (result.success) {
        // Reload due schedules
        await loadDueSchedules();
        setSelectedSchedule(null);
        setCancelReason('');
      }
    } catch (err: any) {
      console.error('Failed to cancel schedule:', err);
      setError(err.message || 'Failed to cancel schedule');
    } finally {
      setLoading(false);
    }
  };

  const markAsQueued = async (scheduleId: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.markScheduleAsQueued(scheduleId);
      
      if (result.success) {
        // Reload due schedules
        await loadDueSchedules();
      }
    } catch (err: any) {
      console.error('Failed to mark as queued:', err);
      setError(err.message || 'Failed to mark as queued');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDueSchedules();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'FACEBOOK':
        return '📘';
      case 'INSTAGRAM':
        return '📷';
      case 'LINKEDIN':
        return '💼';
      case 'TWITTER':
        return '🐦';
      case 'YOUTUBE':
        return '📺';
      default:
        return '📁';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'queued':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'pending':
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const isOverdue = (scheduledAt: string) => {
    return new Date(scheduledAt) < new Date();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Schedule Management</h3>
        <p className="text-sm text-gray-600">Manage scheduled content and due schedules</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('due')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'due'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📅 Due Schedules
          </button>
          <button
            onClick={() => setActiveTab('reschedule')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reschedule'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔄 Reschedule
          </button>
          <button
            onClick={() => setActiveTab('cancel')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cancel'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ❌ Cancel
          </button>
        </nav>
      </div>

      {/* Due Schedules Tab */}
      {activeTab === 'due' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Due Schedules</h4>
              <p className="text-sm text-gray-600">View and manage upcoming scheduled content</p>
            </div>
            <button
              onClick={loadDueSchedules}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Due Schedules List */}
          {dueSchedules.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Due Schedules</h3>
              <p className="text-gray-600">No schedules are currently due for publishing.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dueSchedules.map((schedule) => (
                <div key={schedule.id} className={`border rounded-lg p-4 ${
                  isOverdue(schedule.scheduledAt) ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getPlatformIcon(schedule.platform)}</span>
                      <div>
                        <h5 className="font-medium text-gray-900">{schedule.content.title}</h5>
                        <p className="text-sm text-gray-600">{schedule.platform} • {schedule.content.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(schedule.status)}`}>
                        {schedule.status}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(schedule.priority)}`}>
                        {schedule.priority} priority
                      </span>
                      {isOverdue(schedule.scheduledAt) && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                          Overdue
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Scheduled: {formatDate(schedule.scheduledAt)}
                    </div>
                    <div className="flex items-center space-x-2">
                      {schedule.status === 'pending' && (
                        <button
                          onClick={() => markAsQueued(schedule.id)}
                          className="btn-secondary text-xs"
                        >
                          Mark as Queued
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedSchedule(schedule)}
                        className="btn-primary text-xs"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reschedule Tab */}
      {activeTab === 'reschedule' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Reschedule Content</h4>
              <p className="text-sm text-gray-600">Change the scheduled time for content</p>
            </div>
            <button
              onClick={rescheduleContent}
              disabled={loading || !selectedSchedule || !newScheduleTime}
              className="btn-primary"
            >
              {loading ? 'Rescheduling...' : 'Reschedule'}
            </button>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Schedule to Reschedule
                  </label>
                  <select
                    value={selectedSchedule?.id || ''}
                    onChange={(e) => {
                      const schedule = dueSchedules.find(s => s.id === e.target.value);
                      setSelectedSchedule(schedule || null);
                    }}
                    className="input w-full"
                  >
                    <option value="">Select a schedule...</option>
                    {dueSchedules.map((schedule) => (
                      <option key={schedule.id} value={schedule.id}>
                        {schedule.content.title} - {schedule.platform} - {formatDate(schedule.scheduledAt)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSchedule && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-lg">{getPlatformIcon(selectedSchedule.platform)}</span>
                      <div>
                        <div className="font-medium text-gray-900">{selectedSchedule.content.title}</div>
                        <div className="text-sm text-gray-600">
                          Current: {formatDate(selectedSchedule.scheduledAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Schedule Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newScheduleTime}
                    onChange={(e) => setNewScheduleTime(e.target.value)}
                    className="input w-full"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Tab */}
      {activeTab === 'cancel' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Cancel Schedule</h4>
              <p className="text-sm text-gray-600">Cancel scheduled content</p>
            </div>
            <button
              onClick={cancelSchedule}
              disabled={loading || !selectedSchedule}
              className="btn-primary"
            >
              {loading ? 'Cancelling...' : 'Cancel Schedule'}
            </button>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Schedule to Cancel
                  </label>
                  <select
                    value={selectedSchedule?.id || ''}
                    onChange={(e) => {
                      const schedule = dueSchedules.find(s => s.id === e.target.value);
                      setSelectedSchedule(schedule || null);
                    }}
                    className="input w-full"
                  >
                    <option value="">Select a schedule...</option>
                    {dueSchedules.map((schedule) => (
                      <option key={schedule.id} value={schedule.id}>
                        {schedule.content.title} - {schedule.platform} - {formatDate(schedule.scheduledAt)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSchedule && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-lg">{getPlatformIcon(selectedSchedule.platform)}</span>
                      <div>
                        <div className="font-medium text-gray-900">{selectedSchedule.content.title}</div>
                        <div className="text-sm text-gray-600">
                          Scheduled: {formatDate(selectedSchedule.scheduledAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
        <h4 className="font-medium text-blue-900 mb-2">Schedule Management</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">📅</span>
            <div>
              <p className="font-medium">Due Schedules</p>
              <p>View all upcoming scheduled content with status, priority, and overdue indicators.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">🔄</span>
            <div>
              <p className="font-medium">Reschedule Content</p>
              <p>Change the scheduled time for content with conflict detection and validation.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">❌</span>
            <div>
              <p className="font-medium">Cancel Schedules</p>
              <p>Cancel scheduled content with optional reason tracking for audit purposes.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">⚡</span>
            <div>
              <p className="font-medium">Queue Management</p>
              <p>Mark schedules as queued for processing and track their status in the publishing pipeline.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
