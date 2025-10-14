'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface EscalationRulesProps {
  organizationId?: string;
  onRulesUpdate?: (rules: any) => void;
}

export default function EscalationRules({ organizationId, onRulesUpdate }: EscalationRulesProps) {
  const [rules, setRules] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState(organizationId || '');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    trigger: '',
    conditions: {} as Record<string, any>,
    actions: [] as Array<{ type: string; config: Record<string, any> }>,
    enabled: true,
    priority: 1,
  });

  const loadRules = async () => {
    if (!selectedOrgId.trim()) {
      setError('Organization ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getEscalationRules(selectedOrgId);
      setRules(result);

      if (onRulesUpdate) {
        onRulesUpdate(result);
      }
    } catch (err: any) {
      console.error('Failed to load escalation rules:', err);
      setError(err.message || 'Failed to load escalation rules');
    } finally {
      setLoading(false);
    }
  };

  const updateRules = async () => {
    if (!selectedOrgId.trim()) {
      setError('Organization ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.updateEscalationRules(selectedOrgId, {
        rules: rules.rules,
        settings: rules.settings,
      });

      if (result.success) {
        await loadRules(); // Reload rules
      }
    } catch (err: any) {
      console.error('Failed to update escalation rules:', err);
      setError(err.message || 'Failed to update escalation rules');
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    setEditingRule(null);
    setRuleForm({
      name: '',
      trigger: '',
      conditions: {},
      actions: [],
      enabled: true,
      priority: 1,
    });
    setShowRuleModal(true);
  };

  const editRule = (rule: any) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      trigger: rule.trigger,
      conditions: rule.conditions,
      actions: rule.actions,
      enabled: rule.enabled,
      priority: rule.priority,
    });
    setShowRuleModal(true);
  };

  const saveRule = () => {
    const newRule = {
      id: editingRule?.id || `rule_${Date.now()}`,
      name: ruleForm.name,
      trigger: ruleForm.trigger,
      conditions: ruleForm.conditions,
      actions: ruleForm.actions,
      enabled: ruleForm.enabled,
      priority: ruleForm.priority,
    };

    if (editingRule) {
      setRules({
        ...rules,
        rules: rules.rules.map((r: any) => r.id === editingRule.id ? newRule : r),
      });
    } else {
      setRules({
        ...rules,
        rules: [...rules.rules, newRule],
      });
    }

    setShowRuleModal(false);
    setEditingRule(null);
  };

  const deleteRule = (ruleId: string) => {
    setRules({
      ...rules,
      rules: rules.rules.filter((r: any) => r.id !== ruleId),
    });
  };

  const addAction = () => {
    setRuleForm({
      ...ruleForm,
      actions: [...ruleForm.actions, { type: 'notification', config: {} }],
    });
  };

  const updateAction = (index: number, action: any) => {
    const newActions = [...ruleForm.actions];
    newActions[index] = action;
    setRuleForm({ ...ruleForm, actions: newActions });
  };

  const removeAction = (index: number) => {
    setRuleForm({
      ...ruleForm,
      actions: ruleForm.actions.filter((_, i) => i !== index),
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 3) return 'text-red-600 bg-red-100';
    if (priority >= 2) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getTriggerIcon = (trigger: string) => {
    switch (trigger.toLowerCase()) {
      case 'timeout': return '⏰';
      case 'failure': return '❌';
      case 'error': return '🚨';
      case 'threshold': return '📊';
      default: return '🔔';
    }
  };

  useEffect(() => {
    if (organizationId) {
      setSelectedOrgId(organizationId);
      loadRules();
    }
  }, [organizationId]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Escalation Rules</h3>
        <p className="text-sm text-gray-600">Configure escalation rules for content workflow management</p>
      </div>

      {/* Organization ID Input */}
      <div className="card">
        <div className="card-content">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization ID
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="input flex-1"
                  placeholder="Enter organization ID..."
                />
                <button
                  onClick={loadRules}
                  disabled={loading || !selectedOrgId.trim()}
                  className="btn-primary"
                >
                  {loading ? 'Loading...' : 'Load Rules'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Results */}
      {rules && (
        <div className="space-y-6">
          {/* Global Settings */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Escalation Settings</h4>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Escalation Timeout (Minutes)
                    </label>
                    <input
                      type="number"
                      value={rules.settings.escalationTimeout}
                      onChange={(e) => setRules({
                        ...rules,
                        settings: { ...rules.settings, escalationTimeout: parseInt(e.target.value) }
                      })}
                      className="input w-full"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Escalations
                    </label>
                    <input
                      type="number"
                      value={rules.settings.maxEscalations}
                      onChange={(e) => setRules({
                        ...rules,
                        settings: { ...rules.settings, maxEscalations: parseInt(e.target.value) }
                      })}
                      className="input w-full"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Channels
                    </label>
                    <input
                      type="text"
                      value={rules.settings.notificationChannels.join(', ')}
                      onChange={(e) => setRules({
                        ...rules,
                        settings: { 
                          ...rules.settings, 
                          notificationChannels: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                        }
                      })}
                      className="input w-full"
                      placeholder="email, slack, webhook"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={updateRules}
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? 'Updating...' : 'Update Settings'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Rules Management */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Escalation Rules</h4>
              <button
                onClick={addRule}
                className="btn-primary"
              >
                Add Rule
              </button>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                {rules.rules.map((rule: any, index: number) => (
                  <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getTriggerIcon(rule.trigger)}</span>
                        <div>
                          <h5 className="font-medium text-gray-900">{rule.name}</h5>
                          <p className="text-sm text-gray-600">Trigger: {rule.trigger}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rule.enabled ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                        }`}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(rule.priority)}`}>
                          Priority {rule.priority}
                        </span>
                        <button
                          onClick={() => editRule(rule)}
                          className="btn-secondary text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteRule(rule.id)}
                          className="btn-secondary text-xs text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Conditions</label>
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <pre className="text-xs">{JSON.stringify(rule.conditions, null, 2)}</pre>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Actions</label>
                        <div className="space-y-1">
                          {rule.actions.map((action: any, actionIndex: number) => (
                            <div key={actionIndex} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              <div className="font-medium">{action.type}</div>
                              <div className="text-xs text-gray-500">
                                {JSON.stringify(action.config)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {rules.rules.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">🔔</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Escalation Rules</h3>
                    <p className="text-gray-600">Add your first escalation rule to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-sm text-gray-500 text-center">
            Last updated: {formatDate(rules.lastUpdated)}
          </div>
        </div>
      )}

      {/* Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingRule ? 'Edit Escalation Rule' : 'Add Escalation Rule'}
                </h2>
                <button
                  onClick={() => setShowRuleModal(false)}
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
                      Rule Name
                    </label>
                    <input
                      type="text"
                      value={ruleForm.name}
                      onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                      className="input w-full"
                      placeholder="Enter rule name..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trigger
                    </label>
                    <select
                      value={ruleForm.trigger}
                      onChange={(e) => setRuleForm({ ...ruleForm, trigger: e.target.value })}
                      className="input w-full"
                    >
                      <option value="">Select trigger...</option>
                      <option value="timeout">Timeout</option>
                      <option value="failure">Failure</option>
                      <option value="error">Error</option>
                      <option value="threshold">Threshold</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={ruleForm.priority}
                      onChange={(e) => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value) })}
                      className="input w-full"
                    >
                      <option value={1}>Low (1)</option>
                      <option value={2}>Medium (2)</option>
                      <option value={3}>High (3)</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={ruleForm.enabled}
                      onChange={(e) => setRuleForm({ ...ruleForm, enabled: e.target.checked })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm text-gray-700">Enable this rule</label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conditions (JSON)
                  </label>
                  <textarea
                    value={JSON.stringify(ruleForm.conditions, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setRuleForm({ ...ruleForm, conditions: parsed });
                      } catch {
                        // Invalid JSON, keep the text for user to fix
                      }
                    }}
                    className="input w-full h-32 resize-none font-mono text-sm"
                    placeholder='{"timeout": 30, "retryCount": 3}'
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Actions
                    </label>
                    <button
                      onClick={addAction}
                      className="btn-secondary text-xs"
                    >
                      Add Action
                    </button>
                  </div>
                  <div className="space-y-2">
                    {ruleForm.actions.map((action, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">Action {index + 1}</h4>
                          <button
                            onClick={() => removeAction(index)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Type
                            </label>
                            <select
                              value={action.type}
                              onChange={(e) => updateAction(index, { ...action, type: e.target.value })}
                              className="input w-full text-sm"
                            >
                              <option value="notification">Notification</option>
                              <option value="email">Email</option>
                              <option value="slack">Slack</option>
                              <option value="webhook">Webhook</option>
                              <option value="escalate">Escalate</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Config (JSON)
                            </label>
                            <textarea
                              value={JSON.stringify(action.config, null, 2)}
                              onChange={(e) => {
                                try {
                                  const parsed = JSON.parse(e.target.value);
                                  updateAction(index, { ...action, config: parsed });
                                } catch {
                                  // Invalid JSON, keep the text for user to fix
                                }
                              }}
                              className="input w-full h-20 resize-none font-mono text-xs"
                              placeholder='{"channel": "#alerts", "message": "Escalation triggered"}'
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowRuleModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={saveRule}
                disabled={!ruleForm.name.trim() || !ruleForm.trigger.trim()}
                className="btn-primary"
              >
                {editingRule ? 'Update Rule' : 'Add Rule'}
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
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="font-medium text-orange-900 mb-2">Escalation Rules</h4>
        <div className="space-y-2 text-sm text-orange-800">
          <div className="flex items-start space-x-2">
            <span className="text-orange-600 text-lg">🔔</span>
            <div>
              <p className="font-medium">Automated Escalation</p>
              <p>Configure rules to automatically escalate content when specific conditions are met.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-orange-600 text-lg">⚡</span>
            <div>
              <p className="font-medium">Multiple Triggers</p>
              <p>Set up escalation triggers for timeouts, failures, errors, and threshold breaches.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-orange-600 text-lg">🎯</span>
            <div>
              <p className="font-medium">Action-based Responses</p>
              <p>Define specific actions to take when escalation rules are triggered.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-orange-600 text-lg">📊</span>
            <div>
              <p className="font-medium">Priority Management</p>
              <p>Set rule priorities to control escalation order and prevent conflicts.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
