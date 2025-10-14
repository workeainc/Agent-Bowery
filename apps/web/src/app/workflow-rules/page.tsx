'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
  actions: Array<{
    type: string;
    parameters: Record<string, any>;
  }>;
  enabled: boolean;
  createdAt: string;
}

export default function WorkflowRulesPage() {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    conditions: [{ field: 'status', operator: 'equals', value: 'DRAFT' }],
    actions: [{ type: 'auto_approve', parameters: {} }],
    enabled: true
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with real API call
      const mockRules: WorkflowRule[] = [
        {
          id: '1',
          name: 'Auto-approve Blog Posts',
          description: 'Automatically approve blog posts from trusted authors',
          conditions: [
            { field: 'type', operator: 'equals', value: 'BLOG' },
            { field: 'author', operator: 'equals', value: 'admin' }
          ],
          actions: [
            { type: 'auto_approve', parameters: {} }
          ],
          enabled: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Social Media Quality Check',
          description: 'Require manual review for social media posts',
          conditions: [
            { field: 'type', operator: 'equals', value: 'SOCIAL_POST' }
          ],
          actions: [
            { type: 'require_review', parameters: { reviewers: ['admin'] } }
          ],
          enabled: true,
          createdAt: new Date().toISOString()
        }
      ];
      setRules(mockRules);
    } catch (error) {
      console.error('Failed to fetch workflow rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a rule name');
      return;
    }

    try {
      setLoading(true);
      const newRule: WorkflowRule = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        conditions: formData.conditions,
        actions: formData.actions,
        enabled: formData.enabled,
        createdAt: new Date().toISOString()
      };

      setRules(prev => [newRule, ...prev]);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create workflow rule:', error);
      alert('Failed to create workflow rule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteRule = async (ruleId: string) => {
    try {
      await apiClient.executeWorkflow(ruleId);
      alert('Workflow rule executed successfully!');
    } catch (error) {
      console.error('Failed to execute workflow rule:', error);
      alert('Failed to execute workflow rule. Please try again.');
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: 'status', operator: 'equals', value: '' }]
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index: number, field: 'field' | 'operator' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      )
    }));
  };

  const addAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { type: 'auto_approve', parameters: {} }]
    }));
  };

  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const updateAction = (index: number, field: 'type' | 'parameters', value: any) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) =>
        i === index ? { ...action, [field]: value } : action
      )
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      conditions: [{ field: 'status', operator: 'equals', value: 'DRAFT' }],
      actions: [{ type: 'auto_approve', parameters: {} }],
      enabled: true
    });
  };

  const conditionFields = [
    { value: 'status', label: 'Status' },
    { value: 'type', label: 'Content Type' },
    { value: 'author', label: 'Author' },
    { value: 'tags', label: 'Tags' },
    { value: 'word_count', label: 'Word Count' }
  ];

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Not Contains' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' }
  ];

  const actionTypes = [
    { value: 'auto_approve', label: 'Auto Approve' },
    { value: 'require_review', label: 'Require Review' },
    { value: 'send_notification', label: 'Send Notification' },
    { value: 'assign_tag', label: 'Assign Tag' },
    { value: 'schedule_publish', label: 'Schedule Publish' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workflow rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Rules</h1>
          <p className="text-gray-600 mt-1">
            Automate content management with intelligent workflow rules
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Create Rule
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <div key={rule.id} className="card">
            <div className="card-content">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{rule.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{rule.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Conditions:</h4>
                      <div className="space-y-1">
                        {rule.conditions.map((condition, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            {condition.field} {condition.operator} "{condition.value}"
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Actions:</h4>
                      <div className="space-y-1">
                        {rule.actions.map((action, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            {action.type.replace('_', ' ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleExecuteRule(rule.id)}
                    className="btn-outline btn-sm"
                  >
                    Execute
                  </button>
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`btn-sm ${
                      rule.enabled ? 'btn-outline text-orange-600' : 'btn-primary'
                    }`}
                  >
                    {rule.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingRule(rule);
                      setFormData({
                        name: rule.name,
                        description: rule.description,
                        conditions: rule.conditions,
                        actions: rule.actions,
                        enabled: rule.enabled
                      });
                      setShowCreateModal(true);
                    }}
                    className="btn-outline btn-sm"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">⚙️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workflow rules yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first workflow rule to automate content management.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create First Rule
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingRule ? 'Edit Workflow Rule' : 'Create Workflow Rule'}
              </h2>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Name *
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
                    Enabled
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Enable this rule</span>
                  </label>
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

              {/* Conditions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Conditions
                  </label>
                  <button
                    onClick={addCondition}
                    className="btn-outline btn-sm"
                  >
                    Add Condition
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.conditions.map((condition, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <select
                        value={condition.field}
                        onChange={(e) => updateCondition(index, 'field', e.target.value)}
                        className="input flex-1"
                      >
                        {conditionFields.map(field => (
                          <option key={field.value} value={field.value}>{field.label}</option>
                        ))}
                      </select>
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                        className="input flex-1"
                      >
                        {operators.map(op => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                        className="input flex-1"
                        placeholder="Value..."
                      />
                      <button
                        onClick={() => removeCondition(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Actions
                  </label>
                  <button
                    onClick={addAction}
                    className="btn-outline btn-sm"
                  >
                    Add Action
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.actions.map((action, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <select
                        value={action.type}
                        onChange={(e) => updateAction(index, 'type', e.target.value)}
                        className="input flex-1"
                      >
                        {actionTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeAction(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingRule(null);
                  resetForm();
                }}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRule}
                disabled={loading || !formData.name.trim()}
                className="btn-primary flex-1"
              >
                {loading ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
