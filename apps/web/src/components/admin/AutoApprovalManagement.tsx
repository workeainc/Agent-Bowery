'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface AutoApprovalManagementProps {
  organizationId?: string;
  onSettingsUpdate?: (settings: any) => void;
}

export default function AutoApprovalManagement({ organizationId, onSettingsUpdate }: AutoApprovalManagementProps) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState(organizationId || '');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    conditions: {} as Record<string, any>,
    enabled: true,
    priority: 1,
  });

  const loadSettings = async () => {
    if (!selectedOrgId.trim()) {
      setError('Organization ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getAutoApprovalSettings(selectedOrgId);
      setSettings(result);

      if (onSettingsUpdate) {
        onSettingsUpdate(result);
      }
    } catch (err: any) {
      console.error('Failed to load auto-approval settings:', err);
      setError(err.message || 'Failed to load auto-approval settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async () => {
    if (!selectedOrgId.trim()) {
      setError('Organization ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.updateAutoApprovalSettings(selectedOrgId, {
        enabled: settings.enabled,
        rules: settings.rules,
        settings: settings.settings,
      });

      if (result.success) {
        await loadSettings(); // Reload settings
      }
    } catch (err: any) {
      console.error('Failed to update auto-approval settings:', err);
      setError(err.message || 'Failed to update auto-approval settings');
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    setEditingRule(null);
    setRuleForm({
      name: '',
      conditions: {},
      enabled: true,
      priority: 1,
    });
    setShowRuleModal(true);
  };

  const editRule = (rule: any) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      conditions: rule.conditions,
      enabled: rule.enabled,
      priority: rule.priority,
    });
    setShowRuleModal(true);
  };

  const saveRule = () => {
    const newRule = {
      id: editingRule?.id || `rule_${Date.now()}`,
      name: ruleForm.name,
      conditions: ruleForm.conditions,
      enabled: ruleForm.enabled,
      priority: ruleForm.priority,
    };

    if (editingRule) {
      setSettings({
        ...settings,
        rules: settings.rules.map((r: any) => r.id === editingRule.id ? newRule : r),
      });
    } else {
      setSettings({
        ...settings,
        rules: [...settings.rules, newRule],
      });
    }

    setShowRuleModal(false);
    setEditingRule(null);
  };

  const deleteRule = (ruleId: string) => {
    setSettings({
      ...settings,
      rules: settings.rules.filter((r: any) => r.id !== ruleId),
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

  useEffect(() => {
    if (organizationId) {
      setSelectedOrgId(organizationId);
      loadSettings();
    }
  }, [organizationId]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Auto-Approval Management</h3>
        <p className="text-sm text-gray-600">Configure automatic content approval rules and settings</p>
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
                  onClick={loadSettings}
                  disabled={loading || !selectedOrgId.trim()}
                  className="btn-primary"
                >
                  {loading ? 'Loading...' : 'Load Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Results */}
      {settings && (
        <div className="space-y-6">
          {/* Global Settings */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Auto-Approval Settings</h4>
              <div className="flex items-center space-x-2">
                <span className={`text-sm px-3 py-1 rounded-full ${
                  settings.enabled ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                }`}>
                  {settings.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">Enable auto-approval</label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Content Per Day
                    </label>
                    <input
                      type="number"
                      value={settings.settings.maxContentPerDay}
                      onChange={(e) => setSettings({
                        ...settings,
                        settings: { ...settings.settings, maxContentPerDay: parseInt(e.target.value) }
                      })}
                      className="input w-full"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Threshold
                    </label>
                    <input
                      type="number"
                      value={settings.settings.requireReviewThreshold}
                      onChange={(e) => setSettings({
                        ...settings,
                        settings: { ...settings.settings, requireReviewThreshold: parseInt(e.target.value) }
                      })}
                      className="input w-full"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auto-Approve After (Hours)
                    </label>
                    <input
                      type="number"
                      value={settings.settings.autoApproveAfterHours}
                      onChange={(e) => setSettings({
                        ...settings,
                        settings: { ...settings.settings, autoApproveAfterHours: parseInt(e.target.value) }
                      })}
                      className="input w-full"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exclude Content Types
                    </label>
                    <input
                      type="text"
                      value={settings.settings.excludeContentTypes.join(', ')}
                      onChange={(e) => setSettings({
                        ...settings,
                        settings: { 
                          ...settings.settings, 
                          excludeContentTypes: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                        }
                      })}
                      className="input w-full"
                      placeholder="blog, video, image"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={updateSettings}
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
              <h4 className="card-title">Approval Rules</h4>
              <button
                onClick={addRule}
                className="btn-primary"
              >
                Add Rule
              </button>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                {settings.rules.map((rule: any, index: number) => (
                  <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h5 className="font-medium text-gray-900">{rule.name}</h5>
                          <p className="text-sm text-gray-600">Priority: {rule.priority}</p>
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Conditions</label>
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <pre>{JSON.stringify(rule.conditions, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                ))}

                {settings.rules.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">📋</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Rules Configured</h3>
                    <p className="text-gray-600">Add your first auto-approval rule to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-sm text-gray-500 text-center">
            Last updated: {formatDate(settings.lastUpdated)}
          </div>
        </div>
      )}

      {/* Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingRule ? 'Edit Rule' : 'Add Rule'}
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
                    placeholder='{"contentType": "blog", "wordCount": {"min": 500}}'
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter valid JSON for rule conditions
                  </p>
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
                disabled={!ruleForm.name.trim()}
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
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">Auto-Approval Management</h4>
        <div className="space-y-2 text-sm text-green-800">
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">🤖</span>
            <div>
              <p className="font-medium">Automated Approval</p>
              <p>Configure rules to automatically approve content based on specific conditions and thresholds.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">📋</span>
            <div>
              <p className="font-medium">Rule-based Logic</p>
              <p>Create custom approval rules with JSON conditions for flexible content approval workflows.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">⚙️</span>
            <div>
              <p className="font-medium">Threshold Management</p>
              <p>Set limits and thresholds to control auto-approval behavior and prevent abuse.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">🔒</span>
            <div>
              <p className="font-medium">Safety Controls</p>
              <p>Exclude certain content types and set review thresholds for quality control.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
