'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface NotificationRule {
  id: string;
  name: string;
  trigger: string;
  conditions: Record<string, any>;
  templateId: string;
  channelId: string;
  enabled: boolean;
  createdAt: string;
}

export default function NotificationRulesManagement() {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    trigger: '',
    conditions: {} as Record<string, any>,
    templateId: '',
    channelId: '',
    enabled: true,
  });

  const triggers = [
    { value: 'content_created', label: 'Content Created', description: 'When new content is created' },
    { value: 'content_published', label: 'Content Published', description: 'When content is published' },
    { value: 'content_escalated', label: 'Content Escalated', description: 'When content is escalated' },
    { value: 'workflow_completed', label: 'Workflow Completed', description: 'When workflow is completed' },
    { value: 'schedule_failed', label: 'Schedule Failed', description: 'When scheduled content fails' },
    { value: 'user_mentioned', label: 'User Mentioned', description: 'When user is mentioned' },
  ];

  useEffect(() => {
    // In a real app, you'd load templates and channels from API
    setTemplates([
      { id: 'template-1', name: 'Content Created Template', channelId: 'email-1' },
      { id: 'template-2', name: 'Escalation Template', channelId: 'slack-1' },
    ]);
    setChannels([
      { id: 'email-1', name: 'Email Channel', type: 'email' },
      { id: 'slack-1', name: 'Slack Channel', type: 'slack' },
    ]);
  }, []);

  const createRule = async () => {
    try {
      setLoading(true);
      setError(null);

      const newRule = await apiClient.createNotificationRule(formData);
      setRules(prev => [...prev, newRule]);
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      console.error('Failed to create notification rule:', err);
      setError(err.message || 'Failed to create notification rule');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      trigger: '',
      conditions: {},
      templateId: '',
      channelId: '',
      enabled: true,
    });
  };

  const handleCancel = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    return template ? template.name : 'Unknown Template';
  };

  const getChannelName = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    return channel ? channel.name : 'Unknown Channel';
  };

  const getTriggerLabel = (trigger: string) => {
    const triggerObj = triggers.find(t => t.value === trigger);
    return triggerObj ? triggerObj.label : trigger;
  };

  const getChannelIcon = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    switch (channel?.type) {
      case 'email':
        return '📧';
      case 'slack':
        return '💬';
      case 'webhook':
        return '🔗';
      case 'sms':
        return '📱';
      default:
        return '📁';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Notification Rules</h3>
          <p className="text-sm text-gray-600">Manage automated notification triggers and conditions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Add Rule
        </button>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">⚡</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Notification Rules</h3>
          <p className="text-gray-600">Add your first notification rule to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getChannelIcon(rule.channelId)}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{rule.name}</h4>
                    <p className="text-sm text-gray-600">{getTriggerLabel(rule.trigger)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    rule.enabled ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                  }`}>
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <div className="text-xs text-gray-500">
                    {formatDate(rule.createdAt)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                  <div className="text-sm text-gray-900">{getTemplateName(rule.templateId)}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <div className="text-sm text-gray-900">{getChannelName(rule.channelId)}</div>
                </div>
              </div>

              {Object.keys(rule.conditions).length > 0 && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conditions</label>
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <pre>{JSON.stringify(rule.conditions, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create Notification Rule</h2>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input w-full"
                    placeholder="Enter rule name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trigger Event
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {triggers.map((trigger) => (
                      <label key={trigger.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="trigger"
                          value={trigger.value}
                          checked={formData.trigger === trigger.value}
                          onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{trigger.label}</div>
                          <div className="text-xs text-gray-600">{trigger.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template
                    </label>
                    <select
                      value={formData.templateId}
                      onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                      className="input w-full"
                    >
                      <option value="">Select Template</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Channel
                    </label>
                    <select
                      value={formData.channelId}
                      onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
                      className="input w-full"
                    >
                      <option value="">Select Channel</option>
                      {channels.map((channel) => (
                        <option key={channel.id} value={channel.id}>{channel.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conditions (JSON)
                  </label>
                  <textarea
                    value={JSON.stringify(formData.conditions, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setFormData({ ...formData, conditions: parsed });
                      } catch {
                        // Invalid JSON, keep the text for user to fix
                      }
                    }}
                    className="input w-full h-24 resize-none font-mono text-sm"
                    placeholder='{"status": "pending", "priority": "high"}'
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter valid JSON for trigger conditions (optional)
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">Enable this rule</label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={createRule}
                disabled={loading || !formData.name.trim() || !formData.trigger || !formData.templateId || !formData.channelId}
                className="btn-primary"
              >
                {loading ? 'Creating...' : 'Create Rule'}
              </button>
            </div>
          </div>
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
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Notification Rules</h4>
        <div className="space-y-2 text-sm text-yellow-800">
          <div className="flex items-start space-x-2">
            <span className="text-yellow-600 text-lg">⚡</span>
            <div>
              <p className="font-medium">Automated Triggers</p>
              <p>Set up rules that automatically send notifications based on specific events.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-yellow-600 text-lg">🔧</span>
            <div>
              <p className="font-medium">Conditional Logic</p>
              <p>Add conditions to control when notifications are sent based on content or user criteria.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-yellow-600 text-lg">📧</span>
            <div>
              <p className="font-medium">Template Integration</p>
              <p>Rules use notification templates and channels for consistent message delivery.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
