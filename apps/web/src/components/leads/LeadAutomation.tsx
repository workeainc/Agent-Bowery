'use client';

import { useState, useEffect } from 'react';

interface AutomationTrigger {
  type: 'lead_created' | 'lead_updated' | 'score_changed' | 'status_changed' | 'time_based' | 'email_opened' | 'email_clicked' | 'page_visited';
  conditions: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
    value: string | number;
  }>;
}

interface AutomationAction {
  type: 'send_email' | 'assign_lead' | 'update_status' | 'add_tag' | 'remove_tag' | 'update_score' | 'create_task' | 'send_notification' | 'add_to_campaign';
  config: Record<string, any>;
  delay?: number; // Delay in minutes
}

interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  executionCount: number;
  lastExecuted?: Date;
  tags: string[];
}

interface LeadAutomationProps {
  onRuleSelect?: (rule: AutomationRule) => void;
}

export default function LeadAutomation({ onRuleSelect }: LeadAutomationProps) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: {
      type: 'lead_created' as AutomationTrigger['type'],
      conditions: [] as AutomationTrigger['conditions']
    },
    actions: [] as AutomationAction[],
    priority: 1,
    tags: [] as string[]
  });

  // Mock data for demonstration
  const mockRules: AutomationRule[] = [
    {
      id: '1',
      name: 'Welcome New Leads',
      description: 'Send welcome email to new leads',
      trigger: {
        type: 'lead_created',
        conditions: []
      },
      actions: [
        {
          type: 'send_email',
          config: {
            template: 'welcome_email',
            subject: 'Welcome to Agent Bowery!',
            delay: 5
          },
          delay: 5
        },
        {
          type: 'add_tag',
          config: {
            tag: 'welcome_sent'
          }
        }
      ],
      isActive: true,
      priority: 1,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-20'),
      executionCount: 45,
      lastExecuted: new Date('2024-01-21'),
      tags: ['email', 'welcome']
    },
    {
      id: '2',
      name: 'Hot Lead Alert',
      description: 'Notify sales team when lead score exceeds 80',
      trigger: {
        type: 'score_changed',
        conditions: [
          { field: 'score', operator: 'greater_than', value: 80 }
        ]
      },
      actions: [
        {
          type: 'send_notification',
          config: {
            message: 'Hot lead detected!',
            recipients: ['sales-team@agentbowery.com']
          }
        },
        {
          type: 'assign_lead',
          config: {
            assignee: 'sales-manager'
          }
        },
        {
          type: 'add_tag',
          config: {
            tag: 'hot-lead'
          }
        }
      ],
      isActive: true,
      priority: 2,
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-18'),
      executionCount: 12,
      lastExecuted: new Date('2024-01-20'),
      tags: ['notification', 'hot-lead']
    },
    {
      id: '3',
      name: 'Follow-up Reminder',
      description: 'Create follow-up task for contacted leads',
      trigger: {
        type: 'status_changed',
        conditions: [
          { field: 'status', operator: 'equals', value: 'contacted' }
        ]
      },
      actions: [
        {
          type: 'create_task',
          config: {
            title: 'Follow up with lead',
            description: 'Follow up with contacted lead',
            dueDate: '3 days',
            assignee: 'current-user'
          },
          delay: 1440 // 24 hours
        }
      ],
      isActive: true,
      priority: 3,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-19'),
      executionCount: 28,
      lastExecuted: new Date('2024-01-21'),
      tags: ['follow-up', 'task']
    },
    {
      id: '4',
      name: 'Cold Lead Nurturing',
      description: 'Send nurturing emails to cold leads',
      trigger: {
        type: 'time_based',
        conditions: [
          { field: 'lastContact', operator: 'less_than', value: '30 days ago' },
          { field: 'status', operator: 'equals', value: 'new' }
        ]
      },
      actions: [
        {
          type: 'send_email',
          config: {
            template: 'nurturing_email',
            subject: 'Still interested in our solution?'
          },
          delay: 10080 // 7 days
        },
        {
          type: 'update_score',
          config: {
            score: 'decrease',
            amount: 5
          }
        }
      ],
      isActive: true,
      priority: 4,
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-17'),
      executionCount: 67,
      lastExecuted: new Date('2024-01-20'),
      tags: ['nurturing', 'email']
    },
    {
      id: '5',
      name: 'Enterprise Lead Routing',
      description: 'Route enterprise leads to senior sales team',
      trigger: {
        type: 'lead_created',
        conditions: [
          { field: 'estimatedValue', operator: 'greater_than', value: 50000 },
          { field: 'company', operator: 'contains', value: 'Inc' }
        ]
      },
      actions: [
        {
          type: 'assign_lead',
          config: {
            assignee: 'senior-sales-manager'
          }
        },
        {
          type: 'add_tag',
          config: {
            tag: 'enterprise'
          }
        },
        {
          type: 'update_priority',
          config: {
            priority: 'high'
          }
        }
      ],
      isActive: true,
      priority: 1,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-16'),
      executionCount: 8,
      lastExecuted: new Date('2024-01-19'),
      tags: ['enterprise', 'routing']
    }
  ];

  useEffect(() => {
    setRules(mockRules);
  }, []);

  const handleCreateRule = () => {
    const newRule: AutomationRule = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      trigger: formData.trigger,
      actions: formData.actions,
      isActive: true,
      priority: formData.priority,
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      tags: formData.tags
    };

    setRules(prev => [newRule, ...prev]);
    setShowCreateModal(false);
    resetForm();
    alert('Automation rule created successfully!');
  };

  const handleEditRule = () => {
    if (!editingRule) return;

    const updatedRule: AutomationRule = {
      ...editingRule,
      name: formData.name,
      description: formData.description,
      trigger: formData.trigger,
      actions: formData.actions,
      priority: formData.priority,
      tags: formData.tags,
      updatedAt: new Date()
    };

    setRules(prev => prev.map(rule => 
      rule.id === editingRule.id ? updatedRule : rule
    ));
    setShowEditModal(false);
    setEditingRule(null);
    resetForm();
    alert('Automation rule updated successfully!');
  };

  const handleDeleteRule = (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) {
      return;
    }
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
    alert('Automation rule deleted successfully!');
  };

  const handleToggleActive = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, isActive: !rule.isActive, updatedAt: new Date() }
        : rule
    ));
  };

  const handleRuleSelect = (rule: AutomationRule) => {
    setSelectedRule(rule);
    if (onRuleSelect) {
      onRuleSelect(rule);
    }
  };

  const handleOpenEditModal = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      trigger: rule.trigger,
      actions: rule.actions,
      priority: rule.priority,
      tags: rule.tags
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger: {
        type: 'lead_created',
        conditions: []
      },
      actions: [],
      priority: 1,
      tags: []
    });
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      trigger: {
        ...prev.trigger,
        conditions: [...prev.trigger.conditions, { field: 'score', operator: 'equals', value: '' }]
      }
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      trigger: {
        ...prev.trigger,
        conditions: prev.trigger.conditions.filter((_, i) => i !== index)
      }
    }));
  };

  const updateCondition = (index: number, field: keyof AutomationTrigger['conditions'][0], value: any) => {
    setFormData(prev => ({
      ...prev,
      trigger: {
        ...prev.trigger,
        conditions: prev.trigger.conditions.map((condition, i) => 
          i === index ? { ...condition, [field]: value } : condition
        )
      }
    }));
  };

  const addAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { type: 'send_email', config: {}, delay: 0 }]
    }));
  };

  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const updateAction = (index: number, field: keyof AutomationAction, value: any) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, [field]: value } : action
      )
    }));
  };

  const getTriggerOptions = () => [
    { value: 'lead_created', label: 'Lead Created' },
    { value: 'lead_updated', label: 'Lead Updated' },
    { value: 'score_changed', label: 'Score Changed' },
    { value: 'status_changed', label: 'Status Changed' },
    { value: 'time_based', label: 'Time Based' },
    { value: 'email_opened', label: 'Email Opened' },
    { value: 'email_clicked', label: 'Email Clicked' },
    { value: 'page_visited', label: 'Page Visited' }
  ];

  const getActionOptions = () => [
    { value: 'send_email', label: 'Send Email' },
    { value: 'assign_lead', label: 'Assign Lead' },
    { value: 'update_status', label: 'Update Status' },
    { value: 'add_tag', label: 'Add Tag' },
    { value: 'remove_tag', label: 'Remove Tag' },
    { value: 'update_score', label: 'Update Score' },
    { value: 'create_task', label: 'Create Task' },
    { value: 'send_notification', label: 'Send Notification' },
    { value: 'add_to_campaign', label: 'Add to Campaign' }
  ];

  const getFieldOptions = () => [
    { value: 'score', label: 'Score' },
    { value: 'status', label: 'Status' },
    { value: 'priority', label: 'Priority' },
    { value: 'source', label: 'Source' },
    { value: 'company', label: 'Company' },
    { value: 'estimatedValue', label: 'Estimated Value' },
    { value: 'lastContact', label: 'Last Contact' }
  ];

  const getOperatorOptions = () => [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Not Contains' }
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRuleIcon = (rule: AutomationRule) => {
    if (rule.name.includes('Welcome')) return '👋';
    if (rule.name.includes('Hot')) return '🔥';
    if (rule.name.includes('Follow-up')) return '📞';
    if (rule.name.includes('Cold')) return '❄️';
    if (rule.name.includes('Enterprise')) return '🏢';
    return '⚙️';
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'lead_created': return '➕';
      case 'lead_updated': return '✏️';
      case 'score_changed': return '📊';
      case 'status_changed': return '🔄';
      case 'time_based': return '⏰';
      case 'email_opened': return '📧';
      case 'email_clicked': return '👆';
      case 'page_visited': return '🌐';
      default: return '⚡';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'send_email': return '📧';
      case 'assign_lead': return '👤';
      case 'update_status': return '🔄';
      case 'add_tag': return '🏷️';
      case 'remove_tag': return '❌';
      case 'update_score': return '📊';
      case 'create_task': return '📋';
      case 'send_notification': return '🔔';
      case 'add_to_campaign': return '📢';
      default: return '⚙️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Lead Automation Rules</h2>
          <p className="text-gray-600 mt-1">
            Create automated workflows for lead management
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Create Rule
        </button>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`card cursor-pointer transition-all ${
              selectedRule?.id === rule.id ? 'ring-2 ring-primary-500' : 'hover:shadow-lg'
            }`}
            onClick={() => handleRuleSelect(rule)}
          >
            <div className="card-content">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 text-lg">
                    {getRuleIcon(rule)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{rule.name}</h3>
                    <p className="text-sm text-gray-600">{rule.executionCount} executions</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(rule.id);
                    }}
                    className={`w-3 h-3 rounded-full ${
                      rule.isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    title={rule.isActive ? 'Active' : 'Inactive'}
                  />
                </div>
              </div>

              {rule.description && (
                <p className="text-sm text-gray-600 mb-4">{rule.description}</p>
              )}

              <div className="space-y-3 mb-4">
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">Trigger:</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{getTriggerIcon(rule.trigger.type)}</span>
                    <span className="text-sm text-gray-600">
                      {getTriggerOptions().find(opt => opt.value === rule.trigger.type)?.label}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">Actions:</div>
                  <div className="space-y-1">
                    {rule.actions.slice(0, 2).map((action, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-sm">{getActionIcon(action.type)}</span>
                        <span className="text-sm text-gray-600">
                          {getActionOptions().find(opt => opt.value === action.type)?.label}
                        </span>
                      </div>
                    ))}
                    {rule.actions.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{rule.actions.length - 2} more actions
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {rule.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Priority: {rule.priority}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(rule);
                    }}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRule(rule.id);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Automation Rule</h2>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter rule name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="input w-full"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="input w-full"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter rule description"
                />
              </div>

              {/* Trigger Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Trigger</label>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Type</label>
                    <select
                      className="input w-full"
                      value={formData.trigger.type}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        trigger: { ...prev.trigger, type: e.target.value as AutomationTrigger['type'] }
                      }))}
                    >
                      {getTriggerOptions().map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700">Conditions</label>
                      <button
                        onClick={addCondition}
                        className="btn-outline btn-sm"
                      >
                        Add Condition
                      </button>
                    </div>
                    <div className="space-y-4">
                      {formData.trigger.conditions.map((condition, index) => (
                        <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <select
                              className="input w-full mb-2"
                              value={condition.field}
                              onChange={(e) => updateCondition(index, 'field', e.target.value)}
                            >
                              {getFieldOptions().map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1">
                            <select
                              className="input w-full mb-2"
                              value={condition.operator}
                              onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                            >
                              {getOperatorOptions().map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              className="input w-full mb-2"
                              value={condition.value}
                              onChange={(e) => updateCondition(index, 'value', e.target.value)}
                              placeholder="Enter value"
                            />
                          </div>
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
                </div>
              </div>

              {/* Actions Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Actions</label>
                  <button
                    onClick={addAction}
                    className="btn-outline btn-sm"
                  >
                    Add Action
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.actions.map((action, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <select
                          className="input w-full mb-2"
                          value={action.type}
                          onChange={(e) => updateAction(index, 'type', e.target.value)}
                        >
                          {getActionOptions().map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          className="input w-full mb-2"
                          value={action.delay || 0}
                          onChange={(e) => updateAction(index, 'delay', parseInt(e.target.value) || 0)}
                          placeholder="Delay (minutes)"
                        />
                      </div>
                      <button
                        onClick={() => removeAction(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {formData.actions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">⚙️</div>
                      <p>No actions defined. Click "Add Action" to get started.</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) }))}
                  placeholder="Enter tags separated by commas"
                />
              </div>
            </div>
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
                  disabled={!formData.name || formData.actions.length === 0}
                >
                  Create Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Rule Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Automation Rule</h2>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Same form fields as create modal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter rule name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="input w-full"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="input w-full"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter rule description"
                />
              </div>

              {/* Trigger and Actions sections - same as create modal */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Trigger</label>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Type</label>
                    <select
                      className="input w-full"
                      value={formData.trigger.type}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        trigger: { ...prev.trigger, type: e.target.value as AutomationTrigger['type'] }
                      }))}
                    >
                      {getTriggerOptions().map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Actions</label>
                  <button
                    onClick={addAction}
                    className="btn-outline btn-sm"
                  >
                    Add Action
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.actions.map((action, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <select
                          className="input w-full mb-2"
                          value={action.type}
                          onChange={(e) => updateAction(index, 'type', e.target.value)}
                        >
                          {getActionOptions().map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          className="input w-full mb-2"
                          value={action.delay || 0}
                          onChange={(e) => updateAction(index, 'delay', parseInt(e.target.value) || 0)}
                          placeholder="Delay (minutes)"
                        />
                      </div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) }))}
                  placeholder="Enter tags separated by commas"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRule(null);
                    resetForm();
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditRule}
                  className="btn-primary"
                  disabled={!formData.name || formData.actions.length === 0}
                >
                  Update Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
