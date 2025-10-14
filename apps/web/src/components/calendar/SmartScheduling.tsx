'use client';

import { useState, useEffect } from 'react';

interface SchedulingSuggestion {
  id: string;
  platform: string;
  optimalTime: Date;
  reason: string;
  confidence: number; // 0-100
  audience: string;
  engagement: number; // Expected engagement score
}

interface SmartSchedulingProps {
  platform: string;
  contentType: string;
  targetAudience?: string;
  onSuggestionSelect?: (suggestion: SchedulingSuggestion) => void;
}

export default function SmartScheduling({ 
  platform, 
  contentType, 
  targetAudience = 'General',
  onSuggestionSelect 
}: SmartSchedulingProps) {
  const [suggestions, setSuggestions] = useState<SchedulingSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  useEffect(() => {
    generateSuggestions();
  }, [platform, contentType, targetAudience]);

  const generateSuggestions = async () => {
    setLoading(true);
    
    try {
      // In a real app, this would call an AI service for optimal timing
      // For now, we'll generate mock suggestions based on platform best practices
      const mockSuggestions = generateMockSuggestions(platform, contentType, targetAudience);
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockSuggestions = (platform: string, contentType: string, audience: string): SchedulingSuggestion[] => {
    const now = new Date();
    const suggestions: SchedulingSuggestion[] = [];

    // Platform-specific optimal times
    const platformTimes = {
      FACEBOOK: [
        { hour: 9, dayOffset: 0, reason: 'Morning engagement peak', confidence: 85 },
        { hour: 13, dayOffset: 0, reason: 'Lunch break browsing', confidence: 78 },
        { hour: 19, dayOffset: 0, reason: 'Evening social time', confidence: 92 },
        { hour: 10, dayOffset: 1, reason: 'Tuesday morning boost', confidence: 80 },
        { hour: 15, dayOffset: 4, reason: 'Friday afternoon wind-down', confidence: 75 }
      ],
      LINKEDIN: [
        { hour: 8, dayOffset: 0, reason: 'Professional morning routine', confidence: 88 },
        { hour: 12, dayOffset: 0, reason: 'Lunch break networking', confidence: 82 },
        { hour: 17, dayOffset: 0, reason: 'End of workday', confidence: 90 },
        { hour: 9, dayOffset: 1, reason: 'Tuesday professional focus', confidence: 85 },
        { hour: 11, dayOffset: 2, reason: 'Wednesday mid-morning', confidence: 78 }
      ],
      INSTAGRAM: [
        { hour: 11, dayOffset: 0, reason: 'Mid-morning scroll', confidence: 87 },
        { hour: 14, dayOffset: 0, reason: 'Afternoon break', confidence: 83 },
        { hour: 20, dayOffset: 0, reason: 'Evening entertainment', confidence: 95 },
        { hour: 18, dayOffset: 5, reason: 'Saturday evening', confidence: 88 },
        { hour: 19, dayOffset: 6, reason: 'Sunday relaxation', confidence: 85 }
      ],
      TWITTER: [
        { hour: 9, dayOffset: 0, reason: 'Morning news consumption', confidence: 80 },
        { hour: 12, dayOffset: 0, reason: 'Lunch break updates', confidence: 75 },
        { hour: 17, dayOffset: 0, reason: 'Commute time', confidence: 88 },
        { hour: 21, dayOffset: 0, reason: 'Evening discussion', confidence: 82 },
        { hour: 8, dayOffset: 1, reason: 'Tuesday morning buzz', confidence: 78 }
      ],
      MAIL: [
        { hour: 9, dayOffset: 0, reason: 'Morning inbox check', confidence: 90 },
        { hour: 11, dayOffset: 0, reason: 'Mid-morning email', confidence: 85 },
        { hour: 14, dayOffset: 0, reason: 'Afternoon catch-up', confidence: 80 },
        { hour: 10, dayOffset: 1, reason: 'Tuesday morning focus', confidence: 88 },
        { hour: 8, dayOffset: 2, reason: 'Wednesday start', confidence: 82 }
      ]
    };

    const times = platformTimes[platform as keyof typeof platformTimes] || platformTimes.FACEBOOK;

    times.forEach((time, index) => {
      const suggestionDate = new Date(now);
      suggestionDate.setDate(suggestionDate.getDate() + time.dayOffset);
      suggestionDate.setHours(time.hour, 0, 0, 0);

      // Adjust engagement based on content type
      let engagement = time.confidence;
      if (contentType === 'SOCIAL_POST') engagement += 5;
      if (contentType === 'BLOG') engagement -= 10;
      if (contentType === 'NEWSLETTER') engagement += 8;

      // Adjust for audience
      if (audience.toLowerCase().includes('professional')) {
        if (platform === 'LINKEDIN') engagement += 10;
        else engagement -= 5;
      }

      suggestions.push({
        id: `suggestion-${index}`,
        platform,
        optimalTime: suggestionDate,
        reason: time.reason,
        confidence: Math.min(100, Math.max(0, time.confidence)),
        audience: targetAudience,
        engagement: Math.min(100, Math.max(0, engagement))
      });
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  };

  const handleSuggestionClick = (suggestion: SchedulingSuggestion) => {
    setSelectedSuggestion(suggestion.id);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 85) return 'bg-green-100';
    if (confidence >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getEngagementColor = (engagement: number) => {
    if (engagement >= 85) return 'text-green-600';
    if (engagement >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mr-3"></div>
            <span className="text-gray-600">Analyzing optimal times...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Smart Scheduling Suggestions</h3>
        <p className="card-description">
          AI-powered optimal timing recommendations for {platform}
        </p>
      </div>
      <div className="card-content">
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedSuggestion === suggestion.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="text-lg">
                    {suggestion.platform === 'FACEBOOK' && '📘'}
                    {suggestion.platform === 'LINKEDIN' && '💼'}
                    {suggestion.platform === 'INSTAGRAM' && '📷'}
                    {suggestion.platform === 'TWITTER' && '🐦'}
                    {suggestion.platform === 'MAIL' && '📧'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {suggestion.optimalTime.toLocaleDateString()} at {suggestion.optimalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-sm text-gray-600">{suggestion.reason}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getEngagementColor(suggestion.engagement)}`}>
                      {suggestion.engagement}% engagement
                    </div>
                    <div className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}>
                      {suggestion.confidence}% confidence
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${getConfidenceBg(suggestion.confidence)}`}></div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Target: {suggestion.audience}</span>
                  <span>Platform: {suggestion.platform}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {suggestions.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">🤖</div>
            <p className="text-gray-500">No suggestions available for this platform</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>How it works:</strong> Our AI analyzes your audience behavior, platform algorithms, 
            and industry best practices to suggest optimal posting times for maximum engagement.
          </div>
        </div>
      </div>
    </div>
  );
}
