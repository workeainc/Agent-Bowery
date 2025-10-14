'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface SmartScheduleModalProps {
  contentId: string;
  isOpen: boolean;
  onClose: () => void;
  onScheduleCreated: (schedule: any) => void;
}

export default function SmartScheduleModal({ contentId, isOpen, onClose, onScheduleCreated }: SmartScheduleModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    platforms: [] as string[],
    preferences: {
      optimalTimes: [] as string[],
      avoidTimes: [] as string[],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      maxPostsPerDay: 3
    }
  });

  const availablePlatforms = [
    { id: 'meta', name: 'Facebook', icon: '📘' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { id: 'google', name: 'Google My Business', icon: '🔍' },
    { id: 'youtube', name: 'YouTube', icon: '📺' }
  ];

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  const handleCreateSchedule = async () => {
    if (formData.platforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    setLoading(true);
    try {
      const organizationId = 'default'; // TODO: Get from session
      const result = await apiClient.createSmartSchedule({
        organizationId,
        contentId,
        platforms: formData.platforms,
        preferences: formData.preferences
      });

      onScheduleCreated(result);
      onClose();
    } catch (error) {
      console.error('Failed to create smart schedule:', error);
      alert('Failed to create smart schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }));
  };

  const toggleOptimalTime = (time: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        optimalTimes: prev.preferences.optimalTimes.includes(time)
          ? prev.preferences.optimalTimes.filter(t => t !== time)
          : [...prev.preferences.optimalTimes, time]
      }
    }));
  };

  const toggleAvoidTime = (time: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        avoidTimes: prev.preferences.avoidTimes.includes(time)
          ? prev.preferences.avoidTimes.filter(t => t !== time)
          : [...prev.preferences.avoidTimes, time]
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Smart Schedule Content
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            AI will analyze your audience and suggest optimal posting times
          </p>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Platforms *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {availablePlatforms.map(platform => (
                <label
                  key={platform.id}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:border-gray-300 ${
                    formData.platforms.includes(platform.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.platforms.includes(platform.id)}
                    onChange={() => togglePlatform(platform.id)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-lg">{platform.icon}</span>
                  <span className="font-medium text-gray-900">{platform.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Optimal Times */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Optimal Posting Times
            </label>
            <div className="grid grid-cols-6 gap-2">
              {timeSlots.map(time => (
                <button
                  key={time}
                  type="button"
                  onClick={() => toggleOptimalTime(time)}
                  className={`px-3 py-2 text-sm rounded border ${
                    formData.preferences.optimalTimes.includes(time)
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Select times when your audience is most active
            </p>
          </div>

          {/* Avoid Times */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Avoid These Times
            </label>
            <div className="grid grid-cols-6 gap-2">
              {timeSlots.map(time => (
                <button
                  key={time}
                  type="button"
                  onClick={() => toggleAvoidTime(time)}
                  className={`px-3 py-2 text-sm rounded border ${
                    formData.preferences.avoidTimes.includes(time)
                      ? 'bg-red-100 border-red-500 text-red-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Select times to avoid posting
            </p>
          </div>

          {/* Additional Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Posts Per Day
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.preferences.maxPostsPerDay}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    maxPostsPerDay: parseInt(e.target.value) || 3
                  }
                }))}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={formData.preferences.timezone}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    timezone: e.target.value
                  }
                }))}
                className="input w-full"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex space-x-3">
          <button
            onClick={onClose}
            className="btn-outline flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateSchedule}
            disabled={loading || formData.platforms.length === 0}
            className="btn-primary flex-1"
          >
            {loading ? 'Creating Schedule...' : 'Create Smart Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
