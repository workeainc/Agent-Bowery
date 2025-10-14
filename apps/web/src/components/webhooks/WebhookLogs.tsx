'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface WebhookLogsProps {
  provider: string;
}

interface WebhookEvent {
  id: string;
  platform: string;
  eventType: string;
  status: string;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  payload?: any;
}

export default function WebhookLogs({ provider }: WebhookLogsProps) {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const organizationId = 'default'; // TODO: Get from session
      const result = await apiClient.getWebhookEvents(provider, organizationId, 20);
      setEvents(result.events || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch webhook events');
      // Generate mock data for demonstration
      const mockEvents: WebhookEvent[] = [
        {
          id: '1',
          platform: provider,
          eventType: 'page_feed',
          status: 'processed',
          attempts: 1,
          createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          payload: { page_id: '123456789', post_id: '987654321' }
        },
        {
          id: '2',
          platform: provider,
          eventType: 'post_created',
          status: 'processed',
          attempts: 1,
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          payload: { post_id: '111222333', message: 'New post created' }
        },
        {
          id: '3',
          platform: provider,
          eventType: 'comment_added',
          status: 'failed',
          attempts: 3,
          createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          payload: { comment_id: '444555666', post_id: '111222333' }
        },
        {
          id: '4',
          platform: provider,
          eventType: 'page_liked',
          status: 'processed',
          attempts: 1,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          payload: { page_id: '123456789', user_id: '789012345' }
        }
      ];
      setEvents(mockEvents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [provider]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return '✅';
      case 'failed':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Event Logs</h3>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
        </div>
        <div className="text-sm text-gray-500">Loading webhook events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Event Logs</h3>
          <button
            onClick={fetchEvents}
            className="text-xs text-primary-600 hover:text-primary-700 underline"
          >
            Retry
          </button>
        </div>
        <div className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Event Logs ({events.length})</h3>
        <button
          onClick={fetchEvents}
          className="text-xs text-primary-600 hover:text-primary-700 underline"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {events.map((event) => (
          <div key={event.id} className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm">{getStatusIcon(event.status)}</span>
                <span className="text-sm font-medium text-gray-900">{event.eventType}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(event.status)}`}>
                  {event.status}
                </span>
              </div>
              <span className="text-xs text-gray-500">{formatTimestamp(event.createdAt)}</span>
            </div>
            
            <div className="text-xs text-gray-600 mb-1">
              ID: {event.id} | Attempts: {event.attempts}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedEvent(event)}
                className="text-xs text-primary-600 hover:text-primary-700 underline"
              >
                View Details
              </button>
              {event.status === 'failed' && (
                <button className="text-xs text-red-600 hover:text-red-700 underline">
                  Retry
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
          No webhook events found
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Event Details</h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event ID</label>
                  <div className="text-sm text-gray-900">{selectedEvent.id}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                  <div className="text-sm text-gray-900">{selectedEvent.platform}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <div className="text-sm text-gray-900">{selectedEvent.eventType}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="text-sm text-gray-900">{selectedEvent.status}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attempts</label>
                  <div className="text-sm text-gray-900">{selectedEvent.attempts}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <div className="text-sm text-gray-900">{new Date(selectedEvent.createdAt).toLocaleString()}</div>
                </div>
              </div>
              
              {selectedEvent.payload && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payload</label>
                  <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded border overflow-x-auto">
                    {JSON.stringify(selectedEvent.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setSelectedEvent(null)}
                className="btn-outline w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
