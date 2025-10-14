'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  channelId: string;
  createdAt: string;
}

export default function NotificationTemplatesManagement() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    variables: [] as string[],
    channelId: '',
  });
  const [newVariable, setNewVariable] = useState('');

  useEffect(() => {
    // In a real app, you'd load channels from API
    setChannels([
      { id: 'email-1', name: 'Email Channel', type: 'email' },
      { id: 'slack-1', name: 'Slack Channel', type: 'slack' },
    ]);
  }, []);

  const createTemplate = async () => {
    try {
      setLoading(true);
      setError(null);

      const newTemplate = await apiClient.createNotificationTemplate(formData);
      setTemplates(prev => [...prev, newTemplate]);
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      console.error('Failed to create notification template:', err);
      setError(err.message || 'Failed to create notification template');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      body: '',
      variables: [],
      channelId: '',
    });
    setNewVariable('');
  };

  const handleCancel = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const addVariable = () => {
    if (newVariable.trim() && !formData.variables.includes(newVariable.trim())) {
      setFormData({
        ...formData,
        variables: [...formData.variables, newVariable.trim()]
      });
      setNewVariable('');
    }
  };

  const removeVariable = (variableToRemove: string) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter(variable => variable !== variableToRemove)
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getChannelName = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    return channel ? channel.name : 'Unknown Channel';
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
          <h3 className="text-lg font-semibold text-gray-900">Notification Templates</h3>
          <p className="text-sm text-gray-600">Manage notification message templates</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Add Template
        </button>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Notification Templates</h3>
          <p className="text-gray-600">Add your first notification template to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <div key={template.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getChannelIcon(template.channelId)}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600">{getChannelName(template.channelId)}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(template.createdAt)}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {template.subject}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                    {template.body}
                  </div>
                </div>
                
                {template.variables.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Variables</label>
                    <div className="flex flex-wrap gap-2">
                      {template.variables.map((variable, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {variable}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create Notification Template</h2>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input w-full"
                      placeholder="Enter template name..."
                    />
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
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="input w-full"
                    placeholder="Enter notification subject..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Body
                  </label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    className="input w-full h-32 resize-none"
                    placeholder="Enter notification body..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use variables like {'{variableName}'} to insert dynamic content
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variables
                  </label>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={newVariable}
                      onChange={(e) => setNewVariable(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addVariable()}
                      className="input flex-1"
                      placeholder="Add a variable..."
                    />
                    <button
                      onClick={addVariable}
                      className="btn-secondary"
                    >
                      Add
                    </button>
                  </div>
                  {formData.variables.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.variables.map((variable, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {variable}
                          <button
                            onClick={() => removeVariable(variable)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
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
                onClick={createTemplate}
                disabled={loading || !formData.name.trim() || !formData.subject.trim() || !formData.body.trim() || !formData.channelId}
                className="btn-primary"
              >
                {loading ? 'Creating...' : 'Create Template'}
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
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">Notification Templates</h4>
        <div className="space-y-2 text-sm text-green-800">
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">📝</span>
            <div>
              <p className="font-medium">Template Management</p>
              <p>Create reusable notification templates with dynamic variables for different channels.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">🔧</span>
            <div>
              <p className="font-medium">Variable Support</p>
              <p>Use variables like {'{userName}'} or {'{contentTitle}'} to personalize notifications.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">📧</span>
            <div>
              <p className="font-medium">Channel Specific</p>
              <p>Templates are designed for specific notification channels (email, Slack, etc.).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
