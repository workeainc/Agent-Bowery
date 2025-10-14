'use client';

import { useState } from 'react';
import SmartScheduling from './SmartScheduling';
import ConflictDetection from './ConflictDetection';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: { start: Date; end: Date } | null;
  onSchedule: (data: {
    title: string;
    platform: string;
    contentType: string;
    start: Date;
    end: Date;
    description?: string;
  }) => void;
}

export default function ScheduleModal({ isOpen, onClose, selectedSlot, onSchedule }: ScheduleModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    platform: 'FACEBOOK',
    contentType: 'SOCIAL_POST',
    description: '',
    start: selectedSlot?.start || new Date(),
    end: selectedSlot?.end || new Date(),
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSuggestionSelect = (suggestion: any) => {
    setFormData(prev => ({
      ...prev,
      start: suggestion.optimalTime,
      end: new Date(suggestion.optimalTime.getTime() + 60 * 60 * 1000) // 1 hour later
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    setLoading(true);
    
    try {
      await onSchedule({
        title: formData.title,
        platform: formData.platform,
        contentType: formData.contentType,
        start: formData.start,
        end: formData.end,
        description: formData.description,
      });
      
      alert('Content scheduled successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to schedule content:', error);
      alert('Failed to schedule content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (field: 'start' | 'end', date: Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
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
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input w-full"
              placeholder="Enter content title..."
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            >
              <option value="SOCIAL_POST">Social Media Post</option>
              <option value="BLOG">Blog Post</option>
              <option value="NEWSLETTER">Newsletter</option>
              <option value="EMAIL">Email</option>
            </select>
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={formData.start.toISOString().slice(0, 16)}
              onChange={(e) => handleTimeChange('start', new Date(e.target.value))}
              className="input w-full"
              disabled={loading}
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>
            <input
              type="datetime-local"
              value={formData.end.toISOString().slice(0, 16)}
              onChange={(e) => handleTimeChange('end', new Date(e.target.value))}
              className="input w-full"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full h-20 resize-none"
              placeholder="Add a description..."
              disabled={loading}
            />
          </div>

          {/* Quick Time Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Quick Presets
              </label>
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {showSuggestions ? 'Hide' : 'Show'} Smart Suggestions
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const now = new Date();
                  const end = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later
                  setFormData(prev => ({ ...prev, start: now, end }));
                }}
                className="btn-outline btn-sm"
                disabled={loading}
              >
                Now + 1hr
              </button>
              <button
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(9, 0, 0, 0);
                  const end = new Date(tomorrow.getTime() + 60 * 60 * 1000);
                  setFormData(prev => ({ ...prev, start: tomorrow, end }));
                }}
                className="btn-outline btn-sm"
                disabled={loading}
              >
                Tomorrow 9 AM
              </button>
              <button
                onClick={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  nextWeek.setHours(10, 0, 0, 0);
                  const end = new Date(nextWeek.getTime() + 60 * 60 * 1000);
                  setFormData(prev => ({ ...prev, start: nextWeek, end }));
                }}
                className="btn-outline btn-sm"
                disabled={loading}
              >
                Next Week 10 AM
              </button>
            </div>
          </div>

          {/* Smart Scheduling Suggestions */}
          {showSuggestions && (
            <div className="mt-4">
              <SmartScheduling
                platform={formData.platform}
                contentType={formData.contentType}
                targetAudience="General"
                onSuggestionSelect={handleSuggestionSelect}
              />
            </div>
          )}

          {/* Conflict Detection */}
          <div className="mt-4">
            <ConflictDetection
              events={[]} // In a real app, this would be passed from the parent
              newEvent={{
                start: formData.start,
                end: formData.end,
                platform: formData.platform,
                contentType: formData.contentType,
                title: formData.title
              }}
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
              onClick={handleSubmit}
              className="btn-primary"
              disabled={loading || !formData.title.trim()}
            >
              {loading ? 'Scheduling...' : 'Schedule Content'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
