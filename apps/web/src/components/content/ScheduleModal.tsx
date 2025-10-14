'use client';

import { useState } from 'react';
import { ContentItem } from '@/types';

interface ScheduleModalProps {
  content: ContentItem;
  onClose: () => void;
  onSchedule: (data: {
    contentId: string;
    platform: string;
    scheduledAt: string;
    targetAccount?: string;
  }) => void;
}

export default function ScheduleModal({ content, onClose, onSchedule }: ScheduleModalProps) {
  const [platform, setPlatform] = useState('FACEBOOK');
  const [scheduledAt, setScheduledAt] = useState('');
  const [targetAccount, setTargetAccount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSchedule = async () => {
    if (!scheduledAt) {
      alert('Please select a date and time');
      return;
    }

    setLoading(true);
    
    try {
      await onSchedule({
        contentId: content.id,
        platform,
        scheduledAt,
        targetAccount: targetAccount || undefined,
      });
      
      alert('Content scheduled successfully!');
      onClose();
    } catch (error) {
      alert('Failed to schedule content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Set default scheduled time to tomorrow at 9 AM
  const getDefaultDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Schedule Content</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Content Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-medium text-gray-900">{content.title}</h3>
            <p className="text-sm text-gray-600">
              {content.type} • {content.status}
            </p>
          </div>

          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="input w-full"
              disabled={loading}
            >
              <option value="FACEBOOK">Facebook</option>
              <option value="LINKEDIN">LinkedIn</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="TWITTER">Twitter</option>
              <option value="MAIL">Email Newsletter</option>
            </select>
          </div>

          {/* Target Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Account (Optional)
            </label>
            <input
              type="text"
              value={targetAccount}
              onChange={(e) => setTargetAccount(e.target.value)}
              className="input w-full"
              placeholder="e.g., @company_handle"
              disabled={loading}
            />
          </div>

          {/* Schedule Date/Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Date & Time
            </label>
            <input
              type="datetime-local"
              value={scheduledAt || getDefaultDateTime()}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="input w-full"
              disabled={loading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
