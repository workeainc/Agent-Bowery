'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar';
import moment from 'moment';
import AppShell from '@/components/layout/AppShell';
import ScheduleModal from '@/components/calendar/ScheduleModal';
import RecurringScheduleManager from '@/components/calendar/RecurringScheduleManager';
import CalendarFilters from '@/components/calendar/CalendarFilters';
import { apiClient } from '@/lib/api-client';
import { ContentManager } from '@/components/auth/RoleGuard';

// Set up moment localizer for react-big-calendar
const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    contentId: string;
    platform: string;
    status: string;
    contentType: string;
    description?: string;
  };
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'recurring'>('calendar');

  // Mock events for demonstration
  const mockEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Weekly Newsletter',
      start: new Date(2024, 0, 15, 9, 0),
      end: new Date(2024, 0, 15, 10, 0),
      resource: {
        contentId: '1',
        platform: 'MAIL',
        status: 'scheduled',
        contentType: 'NEWSLETTER',
        description: 'Weekly company newsletter'
      }
    },
    {
      id: '2',
      title: 'Product Launch Post',
      start: new Date(2024, 0, 18, 14, 0),
      end: new Date(2024, 0, 18, 15, 0),
      resource: {
        contentId: '2',
        platform: 'FACEBOOK',
        status: 'scheduled',
        contentType: 'SOCIAL_POST',
        description: 'Product launch announcement'
      }
    },
    {
      id: '3',
      title: 'Industry Insights Blog',
      start: new Date(2024, 0, 22, 10, 0),
      end: new Date(2024, 0, 22, 11, 0),
      resource: {
        contentId: '3',
        platform: 'LINKEDIN',
        status: 'scheduled',
        contentType: 'BLOG',
        description: 'Industry insights and trends'
      }
    }
  ];

  useMemo(() => {
    // Set mock events for demo
    setEvents(mockEvents);
    setLoading(false);
  }, []);

  const handleSelectSlot = (slotInfo: { start: Date; end: Date; slots: Date[] }) => {
    setSelectedSlot({ start: slotInfo.start, end: slotInfo.end });
    setShowCreateModal(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    console.log('Selected event:', event);
    // In a real app, this would open an event details modal
    alert(`Event: ${event.title}\nPlatform: ${event.resource.platform}\nStatus: ${event.resource.status}`);
  };

  const handleSchedule = async (data: {
    title: string;
    platform: string;
    contentType: string;
    start: Date;
    end: Date;
    description?: string;
  }) => {
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: data.title,
      start: data.start,
      end: data.end,
      resource: {
        contentId: Date.now().toString(),
        platform: data.platform,
        status: 'scheduled',
        contentType: data.contentType,
        description: data.description,
      }
    };

    setEvents(prev => [newEvent, ...prev]);
    
    // In a real app, this would call the API to create the schedule
    console.log('Content scheduled:', newEvent);
  };

  const getEventStyle = (event: CalendarEvent) => {
    const platformColors = {
      FACEBOOK: '#1877F2',
      LINKEDIN: '#0077B5',
      INSTAGRAM: '#E4405F',
      TWITTER: '#1DA1F2',
      MAIL: '#34A853',
      BLOG: '#8B5CF6'
    };

    const color = platformColors[event.resource.platform as keyof typeof platformColors] || '#6B7280';

    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        color: 'white',
        borderRadius: '4px',
        border: 'none',
        display: 'block'
      }
    };
  };

  const CustomEvent = ({ event }: { event: CalendarEvent }) => (
    <div className="text-xs">
      <div className="font-medium truncate">{event.title}</div>
      <div className="opacity-90">{event.resource.platform}</div>
    </div>
  );

  if (loading) {
    return (
      <ContentManager fallback={
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600">You don't have permission to view the calendar.</p>
            </div>
          </div>
        </AppShell>
      }>
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading calendar...</p>
            </div>
          </div>
        </AppShell>
      </ContentManager>
    );
  }

  return (
    <ContentManager fallback={
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to view the calendar.</p>
          </div>
        </div>
      </AppShell>
    }>
      <AppShell>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content Calendar</h1>
              <p className="text-gray-600 mt-2">
                Schedule and manage your content across all platforms
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                Schedule Content
              </button>
            </div>
          </div>

          {/* Calendar Controls */}
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setView(Views.MONTH)}
                    className={`px-3 py-1 text-sm font-medium rounded ${
                      view === Views.MONTH ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setView(Views.WEEK)}
                    className={`px-3 py-1 text-sm font-medium rounded ${
                      view === Views.WEEK ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setView(Views.DAY)}
                    className={`px-3 py-1 text-sm font-medium rounded ${
                      view === Views.DAY ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Day
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setDate(new Date(date.getTime() - (view === Views.MONTH ? 30 : view === Views.WEEK ? 7 : 1) * 24 * 60 * 60 * 1000))}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDate(new Date())}
                    className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setDate(new Date(date.getTime() + (view === Views.MONTH ? 30 : view === Views.WEEK ? 7 : 1) * 24 * 60 * 60 * 1000))}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                {events.length} scheduled items
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              view={view}
              date={date}
              onNavigate={setDate}
              onView={setView}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              eventPropGetter={getEventStyle}
              components={{
                event: CustomEvent
              }}
              messages={{
                next: 'Next',
                previous: 'Previous',
                today: 'Today',
                month: 'Month',
                week: 'Week',
                day: 'Day',
                agenda: 'Agenda',
                date: 'Date',
                time: 'Time',
                event: 'Event',
                noEventsInRange: 'No events in this range',
                showMore: (total: number) => `+${total} more`
              }}
            />
          </div>

          {/* Platform Legend */}
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Platform Legend</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#1877F2' }}></div>
                <span className="text-sm text-gray-600">Facebook</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#0077B5' }}></div>
                <span className="text-sm text-gray-600">LinkedIn</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#E4405F' }}></div>
                <span className="text-sm text-gray-600">Instagram</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#1DA1F2' }}></div>
                <span className="text-sm text-gray-600">Twitter</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#34A853' }}></div>
                <span className="text-sm text-gray-600">Email</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#8B5CF6' }}></div>
                <span className="text-sm text-gray-600">Blog</span>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Content Modal */}
        <ScheduleModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedSlot(null);
          }}
          selectedSlot={selectedSlot}
          onSchedule={handleSchedule}
        />
      </AppShell>
    </ContentManager>
  );
}
