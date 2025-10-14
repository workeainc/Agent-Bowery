'use client';

import { useState } from 'react';

interface AutoReplyRule {
  id: string;
  name: string;
  description: string;
  platform: string;
  trigger: 'keyword' | 'time' | 'sentiment' | 'lead';
  triggerValue: string;
  response: string;
  isActive: boolean;
  priority: number;
  conditions: {
    keywords?: string[];
    timeRange?: { start: string; end: string };
    sentiment?: 'positive' | 'negative' | 'neutral';
    leadScore?: number;
  };
}

interface AutoReplyConfigProps {
  onRuleCreate?: (rule: AutoReplyRule) => void;
}

export default function AutoReplyConfig({ onRuleCreate }: AutoReplyConfigProps) {
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    platform: 'FACEBOOK',
    trigger: 'keyword' as AutoReplyRule['trigger'],
    triggerValue: '',
    response: '',
    isActive: true,
    priority: 1,
    conditions: {
      keywords: [] as string[],
      timeRange: { start: '09:00', end: '17:00' },
      sentiment: 'positive' as 'positive' | 'negative' | 'neutral',
      leadScore: 70
    }
  });

  const handleCreateRule = () => {
    if (!formData.name.trim() || !formData.response.trim()) {
      alert('Please fill in name and response');
      return;
    }

    const newRule: AutoReplyRule = {
      id: Date.now().toString(),
      ...formData,
    };

    setRules(prev => [newRule, ...prev]);
    
    if (onRuleCreate) {
      onRuleCreate(newRule);
    }

    setShowCreateModal(false);
    resetForm();
    alert('Auto-reply rule created successfully!');
  };

  const handleDeleteRule = (id: string) => {
    if (!confirm('Are you sure you want to delete this auto-reply rule?')) {
      return;
    }

    setRules(prev => prev.filter(rule => rule.id !== id));
    alert('Auto-reply rule deleted successfully!');
  };

  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(rule =>
      rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      platform: 'FACEBOOK',
      trigger: 'keyword',
      triggerValue: '',
      response: '',
      isActive: true,
      priority: 1,
      conditions: {
        keywords: [],
        timeRange: { start: '09:00', end: '17:00' },
        sentiment: 'positive',
        leadScore: 70
      }
    });
  };

  const addKeyword = () => {
    if (formData.triggerValue.trim()) {
      setFormData(prev => ({
        ...prev,
        conditions: {
          ...prev.conditions,
          keywords: [...prev.conditions.keywords, prev.triggerValue.trim()]
        },
        triggerValue: ''
      }));
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        keywords: prev.conditions.keywords.filter(k => k !== keyword)
      }
    }));
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'FACEBOOK': return '📘';
      case 'LINKEDIN': return '💼';
      case 'INSTAGRAM': return '📷';
      case 'TWITTER': return '🐦';
      case 'EMAIL': return '📧';
      default: return '📱';
    }
  };

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'keyword': return '🔍';
      case 'time': return '⏰';
      case 'sentiment': return '😊';
      case 'lead': return '🎯';
      default: return '⚙️';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 3) return 'bg-red-100 text-red-800';
    if (priority >= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Auto-Reply Configuration</h2>
          <p className="text-gray-600 mt-1">
            Set up automated responses to incoming messages
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Create Auto-Reply Rule
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <div key={rule.id} className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getPlatformIcon(rule.platform)}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{rule.name}</h3>
                    <p className="text-sm text-gray-600">{rule.description}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500">
                        {getTriggerIcon(rule.trigger)} {rule.trigger}: {rule.triggerValue}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(rule.priority)}`}>
                        Priority {rule.priority}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className={`btn-outline btn-sm ${
                        rule.isActive ? 'text-yellow-600' : 'text-green-600'
                      }`}
                    >
                      {rule.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="btn-outline btn-sm text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Response Preview */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-1">Auto-Response:</div>
                <div className="text-sm text-gray-700">{rule.response}</div>
              </div>
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🤖</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No auto-reply rules</h3>
            <p className="text-gray-500 mb-4">
              Create your first auto-reply rule to automate responses to incoming messages.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Auto-Reply Rule
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
                <h2 className="text-xl font-semibold text-gray-900">Create Auto-Reply Rule</h2>
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
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input w-full"
                    placeholder="e.g., Pricing Inquiry Response"
                  />
                </div>
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
                    <option value="EMAIL">Email</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full h-20 resize-none"
                  placeholder="Describe what this rule does..."
                />
              </div>

              {/* Trigger Configuration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trigger Type
                </label>
                <select
                  value={formData.trigger}
                  onChange={(e) => setFormData({ ...formData, trigger: e.target.value as AutoReplyRule['trigger'] })}
                  className="input w-full"
                >
                  <option value="keyword">Keyword Match</option>
                  <option value="time">Time-based</option>
                  <option value="sentiment">Sentiment-based</option>
                  <option value="lead">Lead Score</option>
                </select>
              </div>

              {/* Trigger-specific Configuration */}
              {formData.trigger === 'keyword' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords
                  </label>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={formData.triggerValue}
                        onChange={(e) => setFormData({ ...formData, triggerValue: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                        className="input flex-1"
                        placeholder="Enter keyword..."
                      />
                      <button
                        onClick={addKeyword}
                        className="btn-outline"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.conditions.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {keyword}
                          <button
                            onClick={() => removeKeyword(keyword)}
                            className="ml-1.5 h-3 w-3 rounded-full inline-flex items-center justify-center text-primary-400 hover:bg-primary-200 hover:text-primary-500"
                          >
                            <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {formData.trigger === 'time' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.conditions.timeRange.start}
                      onChange={(e) => setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          timeRange: { ...formData.conditions.timeRange, start: e.target.value }
                        }
                      })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.conditions.timeRange.end}
                      onChange={(e) => setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          timeRange: { ...formData.conditions.timeRange, end: e.target.value }
                        }
                      })}
                      className="input w-full"
                    />
                  </div>
                </div>
              )}

              {formData.trigger === 'sentiment' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sentiment
                  </label>
                  <select
                    value={formData.conditions.sentiment}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        sentiment: e.target.value as 'positive' | 'negative' | 'neutral'
                      }
                    })}
                    className="input w-full"
                  >
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>
              )}

              {formData.trigger === 'lead' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Lead Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.conditions.leadScore}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        leadScore: parseInt(e.target.value) || 70
                      }
                    })}
                    className="input w-full"
                  />
                </div>
              )}

              {/* Response */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-Response Message *
                </label>
                <textarea
                  value={formData.response}
                  onChange={(e) => setFormData({ ...formData, response: e.target.value })}
                  className="input w-full h-32 resize-none"
                  placeholder="Enter the message to send automatically..."
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                  className="input w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Higher priority rules are checked first
                </p>
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
                  Activate rule immediately
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
                  onClick={handleCreateRule}
                  className="btn-primary"
                >
                  Create Rule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
