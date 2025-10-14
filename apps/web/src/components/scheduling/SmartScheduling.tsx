'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface SmartSchedulingProps {
  contentId?: string;
  onSchedulingComplete?: (result: any) => void;
}

export default function SmartScheduling({ contentId, onSchedulingComplete }: SmartSchedulingProps) {
  const [optimalTimingData, setOptimalTimingData] = useState<any>(null);
  const [recommendationsData, setRecommendationsData] = useState<any>(null);
  const [conflictsData, setConflictsData] = useState<any>(null);
  const [suggestionsData, setSuggestionsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timing' | 'recommendations' | 'conflicts' | 'suggestions'>('timing');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [proposedTimes, setProposedTimes] = useState<Array<{ platform: string; scheduledAt: string }>>([]);
  const [newProposedTime, setNewProposedTime] = useState({ platform: '', scheduledAt: '' });

  const platforms = [
    { value: 'FACEBOOK', label: 'Facebook', icon: '📘' },
    { value: 'INSTAGRAM', label: 'Instagram', icon: '📷' },
    { value: 'LINKEDIN', label: 'LinkedIn', icon: '💼' },
    { value: 'TWITTER', label: 'Twitter', icon: '🐦' },
    { value: 'YOUTUBE', label: 'YouTube', icon: '📺' },
  ];

  const getOptimalTiming = async () => {
    if (!selectedPlatform) {
      setError('Please select a platform');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getOptimalTiming(selectedPlatform);
      setOptimalTimingData(result);

      if (onSchedulingComplete) {
        onSchedulingComplete(result);
      }
    } catch (err: any) {
      console.error('Failed to get optimal timing:', err);
      setError(err.message || 'Failed to get optimal timing');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendations = async () => {
    if (!contentId) {
      setError('Content ID is required for recommendations');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getScheduleRecommendations({
        contentId,
        platforms: platforms.map(p => p.value),
        timeframe: '7d',
      });
      setRecommendationsData(result);

      if (onSchedulingComplete) {
        onSchedulingComplete(result);
      }
    } catch (err: any) {
      console.error('Failed to get recommendations:', err);
      setError(err.message || 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  const detectConflicts = async () => {
    if (!contentId || proposedTimes.length === 0) {
      setError('Content ID and proposed times are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.detectScheduleConflicts({
        contentId,
        platforms: platforms.map(p => p.value),
        proposedTimes,
      });
      setConflictsData(result);

      if (onSchedulingComplete) {
        onSchedulingComplete(result);
      }
    } catch (err: any) {
      console.error('Failed to detect conflicts:', err);
      setError(err.message || 'Failed to detect conflicts');
    } finally {
      setLoading(false);
    }
  };

  const getSuggestions = async () => {
    if (!contentId) {
      setError('Content ID is required for suggestions');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.suggestOptimalSchedule({
        contentId,
        platforms: platforms.map(p => p.value),
        constraints: {
          earliestTime: new Date().toISOString(),
          latestTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });
      setSuggestionsData(result);

      if (onSchedulingComplete) {
        onSchedulingComplete(result);
      }
    } catch (err: any) {
      console.error('Failed to get suggestions:', err);
      setError(err.message || 'Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  };

  const addProposedTime = () => {
    if (newProposedTime.platform && newProposedTime.scheduledAt) {
      setProposedTimes([...proposedTimes, newProposedTime]);
      setNewProposedTime({ platform: '', scheduledAt: '' });
    }
  };

  const removeProposedTime = (index: number) => {
    setProposedTimes(proposedTimes.filter((_, i) => i !== index));
  };

  const getPlatformIcon = (platform: string) => {
    const platformObj = platforms.find(p => p.value === platform);
    return platformObj?.icon || '📁';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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

  const getImpactColor = (impact: string) => {
    switch (impact) {
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Smart Scheduling</h3>
        <p className="text-sm text-gray-600">AI-powered scheduling optimization and analysis</p>
      </div>

      {/* Content ID Input */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content ID (for recommendations, conflicts, suggestions)
              </label>
              <input
                type="text"
                value={contentId || ''}
                className="input w-full"
                placeholder="Enter content ID for smart scheduling..."
                disabled
              />
            </div>
            <div className="text-sm text-gray-500">
              {contentId ? 'Content selected' : 'No content selected'}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('timing')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'timing'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ⏰ Optimal Timing
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'recommendations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            💡 Recommendations
          </button>
          <button
            onClick={() => setActiveTab('conflicts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'conflicts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ⚠️ Conflict Detection
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'suggestions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🎯 Smart Suggestions
          </button>
        </nav>
      </div>

      {/* Optimal Timing Tab */}
      {activeTab === 'timing' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Optimal Timing Analysis</h4>
              <p className="text-sm text-gray-600">Get optimal posting times for platforms</p>
            </div>
            <button
              onClick={getOptimalTiming}
              disabled={loading || !selectedPlatform}
              className="btn-primary"
            >
              {loading ? 'Analyzing...' : 'Get Optimal Timing'}
            </button>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Platform
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {platforms.map((platform) => (
                      <label key={platform.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="platform"
                          value={platform.value}
                          checked={selectedPlatform === platform.value}
                          onChange={(e) => setSelectedPlatform(e.target.value)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-lg">{platform.icon}</span>
                        <span className="text-sm font-medium text-gray-900">{platform.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Optimal Timing Results */}
          {optimalTimingData && (
            <div className="space-y-6">
              {/* Best Time */}
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Best Time to Post</h4>
                </div>
                <div className="card-content">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-900 mb-2">
                      {optimalTimingData.bestTime.dayOfWeek} at {optimalTimingData.bestTime.hour}:00
                    </div>
                    <div className="text-sm text-blue-700">
                      Score: {optimalTimingData.bestTime.score}/100
                    </div>
                  </div>
                </div>
              </div>

              {/* Optimal Times */}
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Optimal Times</h4>
                </div>
                <div className="card-content">
                  <div className="space-y-3">
                    {optimalTimingData.optimalTimes.map((time: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">⏰</span>
                          <div>
                            <div className="font-medium text-gray-900">{time.dayOfWeek} at {time.hour}:00</div>
                            <div className="text-sm text-gray-600">{time.recommendation}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{time.engagementScore}</div>
                            <div className="text-xs text-gray-500">Engagement</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{time.reachScore}</div>
                            <div className="text-xs text-gray-500">Reach</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Insights */}
              {optimalTimingData.insights && optimalTimingData.insights.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title">Insights</h4>
                  </div>
                  <div className="card-content">
                    <div className="space-y-3">
                      {optimalTimingData.insights.map((insight: any, index: number) => (
                        <div key={index} className={`p-3 rounded-lg border ${
                          insight.type === 'peak' ? 'bg-green-50 border-green-200' :
                          insight.type === 'valley' ? 'bg-red-50 border-red-200' :
                          'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-medium text-gray-900">{insight.message}</div>
                            <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(insight.impact)}`}>
                              {insight.impact} impact
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Schedule Recommendations</h4>
              <p className="text-sm text-gray-600">Get AI-powered scheduling recommendations</p>
            </div>
            <button
              onClick={getRecommendations}
              disabled={loading || !contentId}
              className="btn-primary"
            >
              {loading ? 'Getting Recommendations...' : 'Get Recommendations'}
            </button>
          </div>

          {/* Recommendations Results */}
          {recommendationsData && (
            <div className="space-y-6">
              {/* Recommendations */}
              {recommendationsData.recommendations && recommendationsData.recommendations.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title">Recommendations</h4>
                  </div>
                  <div className="card-content">
                    <div className="space-y-3">
                      {recommendationsData.recommendations.map((rec: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{getPlatformIcon(rec.platform)}</span>
                              <div>
                                <h5 className="font-medium text-gray-900">{rec.platform}</h5>
                                <p className="text-sm text-gray-600">{rec.suggestedTime}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                rec.confidence >= 80 ? 'text-green-600 bg-green-100' :
                                rec.confidence >= 60 ? 'text-yellow-600 bg-yellow-100' :
                                'text-red-600 bg-red-100'
                              }`}>
                                {rec.confidence}% confidence
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm text-gray-900">{rec.reasoning}</div>
                            <div className="text-sm text-gray-600">
                              Expected Engagement: {rec.expectedEngagement}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Conflicts */}
              {recommendationsData.conflicts && recommendationsData.conflicts.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title">Potential Conflicts</h4>
                  </div>
                  <div className="card-content">
                    <div className="space-y-3">
                      {recommendationsData.conflicts.map((conflict: any, index: number) => (
                        <div key={index} className={`p-3 rounded-lg border ${
                          conflict.severity === 'high' ? 'bg-red-50 border-red-200' :
                          conflict.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-green-50 border-green-200'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-medium text-gray-900">{conflict.message}</div>
                            <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(conflict.severity)}`}>
                              {conflict.severity} severity
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">Type: {conflict.type}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Conflict Detection Tab */}
      {activeTab === 'conflicts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Conflict Detection</h4>
              <p className="text-sm text-gray-600">Detect scheduling conflicts before publishing</p>
            </div>
            <button
              onClick={detectConflicts}
              disabled={loading || !contentId || proposedTimes.length === 0}
              className="btn-primary"
            >
              {loading ? 'Detecting Conflicts...' : 'Detect Conflicts'}
            </button>
          </div>

          {/* Proposed Times Input */}
          <div className="card">
            <div className="card-content">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Proposed Times
                  </label>
                  <div className="flex items-center space-x-2">
                    <select
                      value={newProposedTime.platform}
                      onChange={(e) => setNewProposedTime({ ...newProposedTime, platform: e.target.value })}
                      className="input flex-1"
                    >
                      <option value="">Select Platform</option>
                      {platforms.map((platform) => (
                        <option key={platform.value} value={platform.value}>{platform.label}</option>
                      ))}
                    </select>
                    <input
                      type="datetime-local"
                      value={newProposedTime.scheduledAt}
                      onChange={(e) => setNewProposedTime({ ...newProposedTime, scheduledAt: e.target.value })}
                      className="input flex-1"
                    />
                    <button
                      onClick={addProposedTime}
                      className="btn-secondary"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {proposedTimes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proposed Times
                    </label>
                    <div className="space-y-2">
                      {proposedTimes.map((time, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getPlatformIcon(time.platform)}</span>
                            <span className="text-sm text-gray-900">{time.platform}</span>
                            <span className="text-sm text-gray-600">{time.scheduledAt}</span>
                          </div>
                          <button
                            onClick={() => removeProposedTime(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Conflicts Results */}
          {conflictsData && (
            <div className="space-y-6">
              {/* Conflicts */}
              {conflictsData.conflicts && conflictsData.conflicts.length > 0 ? (
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title">Detected Conflicts</h4>
                  </div>
                  <div className="card-content">
                    <div className="space-y-3">
                      {conflictsData.conflicts.map((conflict: any, index: number) => (
                        <div key={index} className={`p-3 rounded-lg border ${
                          conflict.severity === 'high' ? 'bg-red-50 border-red-200' :
                          conflict.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-green-50 border-green-200'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-medium text-gray-900">{conflict.message}</div>
                            <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(conflict.severity)}`}>
                              {conflict.severity} severity
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-600">Type: {conflict.type}</div>
                            <div className="text-sm text-gray-600">Suggestion: {conflict.suggestion}</div>
                            {conflict.affectedSchedules && conflict.affectedSchedules.length > 0 && (
                              <div className="text-sm text-gray-600">
                                Affected: {conflict.affectedSchedules.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-green-600 text-4xl mb-4">✅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Conflicts Found</h3>
                  <p className="text-gray-600">Your proposed schedule times look good!</p>
                </div>
              )}

              {/* Recommendations */}
              {conflictsData.recommendations && conflictsData.recommendations.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title">Alternative Recommendations</h4>
                  </div>
                  <div className="card-content">
                    <div className="space-y-3">
                      {conflictsData.recommendations.map((rec: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-lg">{getPlatformIcon(rec.platform)}</span>
                            <div>
                              <div className="font-medium text-gray-900">{rec.platform}</div>
                              <div className="text-sm text-gray-600">{rec.alternativeTime}</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-900">{rec.reasoning}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Smart Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Smart Schedule Suggestions</h4>
              <p className="text-sm text-gray-600">Get AI-powered optimal schedule suggestions</p>
            </div>
            <button
              onClick={getSuggestions}
              disabled={loading || !contentId}
              className="btn-primary"
            >
              {loading ? 'Getting Suggestions...' : 'Get Suggestions'}
            </button>
          </div>

          {/* Suggestions Results */}
          {suggestionsData && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Overall Schedule Score</h4>
                </div>
                <div className="card-content">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-900 mb-2">
                      {suggestionsData.overallScore}/100
                    </div>
                    <div className="text-sm text-blue-700">
                      {suggestionsData.overallScore >= 80 ? 'Excellent' :
                       suggestionsData.overallScore >= 60 ? 'Good' :
                       suggestionsData.overallScore >= 40 ? 'Fair' : 'Poor'} Schedule Quality
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              {suggestionsData.suggestions && suggestionsData.suggestions.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title">Platform Suggestions</h4>
                  </div>
                  <div className="card-content">
                    <div className="space-y-4">
                      {suggestionsData.suggestions.map((suggestion: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{getPlatformIcon(suggestion.platform)}</span>
                              <div>
                                <h5 className="font-medium text-gray-900">{suggestion.platform}</h5>
                                <p className="text-sm text-gray-600">{suggestion.suggestedTime}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-bold ${
                                suggestion.score >= 80 ? 'text-green-600' :
                                suggestion.score >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {suggestion.score}/100
                              </div>
                              <div className="text-xs text-gray-500">Score</div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm text-gray-900">{suggestion.reasoning}</div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="font-medium text-gray-900">{suggestion.expectedMetrics.engagement}</div>
                                <div className="text-xs text-gray-500">Engagement</div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{suggestion.expectedMetrics.reach}</div>
                                <div className="text-xs text-gray-500">Reach</div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{suggestion.expectedMetrics.clicks}</div>
                                <div className="text-xs text-gray-500">Clicks</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Alternative Options */}
              {suggestionsData.alternativeOptions && suggestionsData.alternativeOptions.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title">Alternative Options</h4>
                  </div>
                  <div className="card-content">
                    <div className="space-y-3">
                      {suggestionsData.alternativeOptions.map((option: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{getPlatformIcon(option.platform)}</span>
                              <div>
                                <div className="font-medium text-gray-900">{option.platform}</div>
                                <div className="text-sm text-gray-600">{option.time}</div>
                              </div>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              Score: {option.score}/100
                            </div>
                          </div>
                          {option.tradeoffs && option.tradeoffs.length > 0 && (
                            <div className="text-sm text-gray-600">
                              Tradeoffs: {option.tradeoffs.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-medium text-purple-900 mb-2">Smart Scheduling</h4>
        <div className="space-y-2 text-sm text-purple-800">
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">⏰</span>
            <div>
              <p className="font-medium">Optimal Timing</p>
              <p>Get AI-powered optimal posting times based on platform analytics and audience behavior.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">💡</span>
            <div>
              <p className="font-medium">Smart Recommendations</p>
              <p>Receive intelligent scheduling recommendations based on content analysis and performance data.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">⚠️</span>
            <div>
              <p className="font-medium">Conflict Detection</p>
              <p>Detect potential scheduling conflicts before they happen to avoid audience overlap.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">🎯</span>
            <div>
              <p className="font-medium">Smart Suggestions</p>
              <p>Get comprehensive schedule suggestions with expected performance metrics and alternatives.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
