'use client';

import { useState, useEffect } from 'react';

interface Conflict {
  id: string;
  type: 'overlap' | 'platform_limit' | 'content_limit' | 'time_conflict';
  severity: 'error' | 'warning' | 'info';
  message: string;
  conflictingEvents: string[];
  suggestion?: string;
}

interface ConflictDetectionProps {
  events: Array<{
    id: string;
    title: string;
    start: Date;
    end: Date;
    platform: string;
    contentType: string;
  }>;
  newEvent: {
    start: Date;
    end: Date;
    platform: string;
    contentType: string;
    title: string;
  } | null;
  onConflictsChange?: (conflicts: Conflict[]) => void;
}

export default function ConflictDetection({ 
  events, 
  newEvent, 
  onConflictsChange 
}: ConflictDetectionProps) {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (newEvent) {
      detectConflicts();
    } else {
      setConflicts([]);
    }
  }, [events, newEvent]);

  const detectConflicts = async () => {
    if (!newEvent) return;

    setLoading(true);
    
    try {
      const detectedConflicts: Conflict[] = [];

      // Check for time overlaps
      const overlappingEvents = events.filter(event => {
        return (
          (newEvent.start < event.end && newEvent.end > event.start) &&
          event.id !== newEvent.id
        );
      });

      if (overlappingEvents.length > 0) {
        detectedConflicts.push({
          id: 'time-overlap',
          type: 'overlap',
          severity: 'error',
          message: `Time conflict: Overlaps with ${overlappingEvents.length} existing event(s)`,
          conflictingEvents: overlappingEvents.map(e => e.title),
          suggestion: 'Consider scheduling at a different time or adjusting the duration'
        });
      }

      // Check for platform-specific conflicts
      const samePlatformEvents = events.filter(event => 
        event.platform === newEvent.platform &&
        event.id !== newEvent.id &&
        (newEvent.start < event.end && newEvent.end > event.start)
      );

      if (samePlatformEvents.length > 0) {
        detectedConflicts.push({
          id: 'platform-conflict',
          type: 'platform_limit',
          severity: 'warning',
          message: `Multiple posts scheduled for ${newEvent.platform} at the same time`,
          conflictingEvents: samePlatformEvents.map(e => e.title),
          suggestion: 'Consider spacing out posts on the same platform for better engagement'
        });
      }

      // Check for content type conflicts
      const sameContentTypeEvents = events.filter(event => 
        event.contentType === newEvent.contentType &&
        event.id !== newEvent.id &&
        (newEvent.start < event.end && newEvent.end > event.start)
      );

      if (sameContentTypeEvents.length > 0) {
        detectedConflicts.push({
          id: 'content-type-conflict',
          type: 'content_limit',
          severity: 'info',
          message: `Multiple ${newEvent.contentType.toLowerCase()} posts scheduled simultaneously`,
          conflictingEvents: sameContentTypeEvents.map(e => e.title),
          suggestion: 'Consider diversifying content types for better audience engagement'
        });
      }

      // Check for optimal timing conflicts
      const hour = newEvent.start.getHours();
      const day = newEvent.start.getDay();
      
      // Weekend posting for professional content
      if ((day === 0 || day === 6) && newEvent.contentType === 'BLOG' && newEvent.platform === 'LINKEDIN') {
        detectedConflicts.push({
          id: 'weekend-professional',
          type: 'time_conflict',
          severity: 'warning',
          message: 'Professional content scheduled for weekend',
          conflictingEvents: [],
          suggestion: 'Consider scheduling professional content during weekdays for better engagement'
        });
      }

      // Early morning posting
      if (hour < 6) {
        detectedConflicts.push({
          id: 'early-morning',
          type: 'time_conflict',
          severity: 'info',
          message: 'Content scheduled very early in the morning',
          conflictingEvents: [],
          suggestion: 'Early morning posts may have lower engagement. Consider scheduling after 7 AM'
        });
      }

      // Late night posting
      if (hour > 22) {
        detectedConflicts.push({
          id: 'late-night',
          type: 'time_conflict',
          severity: 'info',
          message: 'Content scheduled very late at night',
          conflictingEvents: [],
          suggestion: 'Late night posts may have lower engagement. Consider scheduling before 10 PM'
        });
      }

      // Check for frequency conflicts (too many posts in short time)
      const recentEvents = events.filter(event => {
        const timeDiff = Math.abs(event.start.getTime() - newEvent.start.getTime());
        return timeDiff < 2 * 60 * 60 * 1000; // Within 2 hours
      });

      if (recentEvents.length >= 3) {
        detectedConflicts.push({
          id: 'frequency-conflict',
          type: 'content_limit',
          severity: 'warning',
          message: 'High posting frequency detected',
          conflictingEvents: recentEvents.map(e => e.title),
          suggestion: 'Consider spacing out posts to avoid overwhelming your audience'
        });
      }

      setConflicts(detectedConflicts);
      
      if (onConflictsChange) {
        onConflictsChange(detectedConflicts);
      }
    } catch (error) {
      console.error('Failed to detect conflicts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📋';
    }
  };

  if (!newEvent) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="text-center py-4">
            <div className="text-gray-400 text-4xl mb-2">🔍</div>
            <p className="text-gray-500">Select a time slot to check for conflicts</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mr-3"></div>
            <span className="text-gray-600">Checking for conflicts...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Conflict Detection</h3>
        <p className="card-description">
          Analyzing scheduling conflicts and recommendations
        </p>
      </div>
      <div className="card-content">
        {conflicts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-green-400 text-4xl mb-2">✅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conflicts detected</h3>
            <p className="text-gray-500">
              Your scheduled time looks good! No conflicts with existing events.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className={`border rounded-lg p-4 ${getSeverityColor(conflict.severity)}`}>
                <div className="flex items-start space-x-3">
                  <span className="text-lg mt-1">{getSeverityIcon(conflict.severity)}</span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900">{conflict.message}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(conflict.severity)}`}>
                        {conflict.severity}
                      </span>
                    </div>
                    
                    {conflict.conflictingEvents.length > 0 && (
                      <div className="mb-2">
                        <div className="text-sm text-gray-600 mb-1">Conflicting events:</div>
                        <ul className="text-sm text-gray-700 list-disc list-inside">
                          {conflict.conflictingEvents.map((eventTitle, index) => (
                            <li key={index}>{eventTitle}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {conflict.suggestion && (
                      <div className="mt-2 p-2 bg-white bg-opacity-50 rounded border">
                        <div className="text-sm font-medium text-gray-900 mb-1">Suggestion:</div>
                        <div className="text-sm text-gray-700">{conflict.suggestion}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Conflict Types:</strong>
            <ul className="mt-1 space-y-1">
              <li>• <strong>Time Overlap:</strong> Events scheduled at the same time</li>
              <li>• <strong>Platform Limit:</strong> Multiple posts on same platform</li>
              <li>• <strong>Content Limit:</strong> Similar content types scheduled together</li>
              <li>• <strong>Timing Issues:</strong> Suboptimal posting times</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
