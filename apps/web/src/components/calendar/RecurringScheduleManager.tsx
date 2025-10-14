'use client';

import { useState } from 'react';

interface RecurringSchedule {
  id: string;
  title: string;
  platform: string;
  contentType: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
  interval: number; // Every X days/weeks/months
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

interface RecurringScheduleManagerProps {
  onScheduleCreate?: (schedule: RecurringSchedule) => void;
}

export default function RecurringScheduleManager({ onScheduleCreate }: RecurringScheduleManagerProps) {
  const [schedules, setSchedules] = useState<RecurringSchedule[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    platform: 'FACEBOOK',
    contentType: 'SOCIAL_POST',
    startTime: '09:00',
    endTime: '10:00',
    frequency: 'weekly' as RecurringSchedule['frequency'],
    daysOfWeek: [] as number[],
    interval: 1,
    startDate: new Date(),
    endDate: undefined as Date | undefined,
    isActive: true,
  });

  const handleCreateSchedule = () => {
    if (!formData.title.trim()) {
      alert('Please enter a schedule title');
      return;
    }

    if (formData.frequency === 'weekly' && formData.daysOfWeek.length === 0) {
      alert('Please select at least one day of the week');
      return;
    }

    const newSchedule: RecurringSchedule = {
      id: Date.now().toString(),
      ...formData,
    };

    setSchedules(prev => [newSchedule, ...prev]);
    
    if (onScheduleCreate) {
      onScheduleCreate(newSchedule);
    }

    setShowCreateModal(false);
    resetForm();
    alert('Recurring schedule created successfully!');
  };

  const handleDeleteSchedule = (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring schedule?')) {
      return;
    }

    setSchedules(prev => prev.filter(schedule => schedule.id !== id));
    alert('Recurring schedule deleted successfully!');
  };

  const handleToggleSchedule = (id: string) => {
    setSchedules(prev => prev.map(schedule =>
      schedule.id === id ? { ...schedule, isActive: !schedule.isActive } : schedule
    ));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      platform: 'FACEBOOK',
      contentType: 'SOCIAL_POST',
      startTime: '09:00',
      endTime: '10:00',
      frequency: 'weekly',
      daysOfWeek: [],
      interval: 1,
      startDate: new Date(),
      endDate: undefined,
      isActive: true,
    });
  };

  const handleDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  const getFrequencyDescription = (schedule: RecurringSchedule) => {
    switch (schedule.frequency) {
      case 'daily':
        return `Every ${schedule.interval} day(s)`;
      case 'weekly':
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const selectedDays = schedule.daysOfWeek.map(day => dayNames[day]).join(', ');
        return `Every ${schedule.interval} week(s) on ${selectedDays}`;
      case 'monthly':
        return `Every ${schedule.interval} month(s)`;
      case 'custom':
        return 'Custom schedule';
      default:
        return 'Unknown';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'FACEBOOK': return '📘';
      case 'LINKEDIN': return '💼';
      case 'INSTAGRAM': return '📷';
      case 'TWITTER': return '🐦';
      case 'MAIL': return '📧';
      case 'BLOG': return '📝';
      default: return '📱';
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Recurring Schedules</h2>
          <p className="text-gray-600 mt-1">
            Manage automated content scheduling
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Create Recurring Schedule
        </button>
      </div>

      {/* Schedules List */}
      <div className="space-y-4">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getPlatformIcon(schedule.platform)}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{schedule.title}</h3>
                    <p className="text-sm text-gray-600">
                      {schedule.platform} • {schedule.contentType.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {schedule.startTime} - {schedule.endTime} • {getFrequencyDescription(schedule)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    schedule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {schedule.isActive ? 'Active' : 'Inactive'}
                  </span>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleSchedule(schedule.id)}
                      className={`btn-outline btn-sm ${
                        schedule.isActive ? 'text-yellow-600' : 'text-green-600'
                      }`}
                    >
                      {schedule.isActive ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="btn-outline btn-sm text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {schedules.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recurring schedules</h3>
            <p className="text-gray-500 mb-4">
              Create your first recurring schedule to automate content posting.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Recurring Schedule
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create Recurring Schedule</h2>
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
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Daily Morning Post"
                />
              </div>

              {/* Platform */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform
                </label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="input w-full"
                >
                  <option value="FACEBOOK">Facebook</option>
                  <option value="LINKEDIN">LinkedIn</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="TWITTER">Twitter</option>
                  <option value="MAIL">Email Newsletter</option>
                  <option value="BLOG">Blog Post</option>
                </select>
              </div>

              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type
                </label>
                <select
                  value={formData.contentType}
                  onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                  className="input w-full"
                >
                  <option value="SOCIAL_POST">Social Media Post</option>
                  <option value="BLOG">Blog Post</option>
                  <option value="NEWSLETTER">Newsletter</option>
                  <option value="EMAIL">Email</option>
                </select>
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as RecurringSchedule['frequency'] })}
                  className="input w-full"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Days of Week (for weekly) */}
              {formData.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days of Week
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {dayNames.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => handleDayToggle(index)}
                        className={`p-2 text-sm font-medium rounded border ${
                          formData.daysOfWeek.includes(index)
                            ? 'bg-primary-100 text-primary-700 border-primary-300'
                            : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Interval */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interval
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Every</span>
                  <input
                    type="number"
                    min="1"
                    value={formData.interval}
                    onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) || 1 })}
                    className="input w-20"
                  />
                  <span className="text-sm text-gray-600">
                    {formData.frequency === 'daily' ? 'day(s)' :
                     formData.frequency === 'weekly' ? 'week(s)' :
                     formData.frequency === 'monthly' ? 'month(s)' : 'period(s)'}
                  </span>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate.toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      endDate: e.target.value ? new Date(e.target.value) : undefined 
                    })}
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Activate schedule immediately
                </label>
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
                  onClick={handleCreateSchedule}
                  className="btn-primary"
                >
                  Create Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
