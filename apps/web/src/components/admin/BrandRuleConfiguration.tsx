'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface BrandRule {
  id: string;
  name: string;
  description: string;
  type: 'forbidden' | 'required' | 'tone' | 'length' | 'format' | 'style';
  category: string;
  rules: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  channels: string[];
  organizationId: string;
}

interface BrandRuleConfigurationProps {
  onRuleSelect?: (rule: BrandRule) => void;
}

export default function BrandRuleConfiguration({ onRuleSelect }: BrandRuleConfigurationProps) {
  const [brandRules, setBrandRules] = useState<BrandRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<BrandRule | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRule, setEditingRule] = useState<BrandRule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'type' | 'severity'>('name');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'forbidden' as BrandRule['type'],
    category: '',
    rules: [] as string[],
    severity: 'medium' as BrandRule['severity'],
    tags: [] as string[],
    channels: [] as string[],
    isActive: true
  });

  // Load brand rules from API
  const loadBrandRules = async () => {
    try {
      setLoading(true);
      setError(null);

      const rules = await apiClient.getBrandRules(organizationId || undefined);
      setBrandRules(rules);
    } catch (err: any) {
      console.error('Failed to load brand rules:', err);
      setError(err.message || 'Failed to load brand rules');
    } finally {
      setLoading(false);
    }
  };

  // Load brand rules on component mount and when organization changes
  useEffect(() => {
    loadBrandRules();
  }, [organizationId]);

  const handleCreateRule = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.createBrandRule({
        name: formData.name,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        rules: formData.rules,
        severity: formData.severity,
        tags: formData.tags,
        channels: formData.channels,
        organizationId: organizationId || 'default'
      });

      if (result.success) {
        await loadBrandRules(); // Reload rules
        setShowCreateModal(false);
        resetForm();
      }
    } catch (err: any) {
      console.error('Failed to create brand rule:', err);
      setError(err.message || 'Failed to create brand rule');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRule = async () => {
    if (!editingRule) return;

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.updateBrandRule(editingRule.id, {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        rules: formData.rules,
        severity: formData.severity,
        isActive: formData.isActive,
        tags: formData.tags,
        channels: formData.channels
      });

      if (result.success) {
        await loadBrandRules(); // Reload rules
        setShowEditModal(false);
        setEditingRule(null);
        resetForm();
      }
    } catch (err: any) {
      console.error('Failed to update brand rule:', err);
      setError(err.message || 'Failed to update brand rule');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this brand rule?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.deleteBrandRule(ruleId);

      if (result.success) {
        await loadBrandRules(); // Reload rules
      }
    } catch (err: any) {
      console.error('Failed to delete brand rule:', err);
      setError(err.message || 'Failed to delete brand rule');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (ruleId: string) => {
    try {
      const rule = brandRules.find(r => r.id === ruleId);
      if (!rule) return;

      const result = await apiClient.updateBrandRule(ruleId, {
        isActive: !rule.isActive
      });

      if (result.success) {
        await loadBrandRules(); // Reload rules
      }
    } catch (err: any) {
      console.error('Failed to toggle brand rule:', err);
      setError(err.message || 'Failed to toggle brand rule');
    }
  };

  const handleRuleSelect = (rule: BrandRule) => {
    setSelectedRule(rule);
    if (onRuleSelect) {
      onRuleSelect(rule);
    }
  };

  const handleOpenEditModal = (rule: BrandRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      type: rule.type,
      category: rule.category,
      rules: rule.rules,
      severity: rule.severity,
      tags: rule.tags,
      channels: rule.channels,
      isActive: rule.isActive
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'forbidden',
      category: '',
      rules: [],
      severity: 'medium',
      tags: [],
      channels: [],
      isActive: true
    });
  };

  const addRule = () => {
    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, '']
    }));
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const updateRule = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) => i === index ? value : rule)
    }));
  };

  const filteredRules = brandRules.filter(rule => {
    const matchesSearch = searchQuery === '' || 
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || rule.type === filterType;
    const matchesSeverity = filterSeverity === 'all' || rule.severity === filterSeverity;
    return matchesSearch && matchesType && matchesSeverity;
  });

  const sortedRules = [...filteredRules].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'type':
        return a.type.localeCompare(b.type);
      case 'severity':
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      default:
        return 0;
    }
  });

  const getRuleTypeOptions = () => [
    { value: 'forbidden', label: 'Forbidden Words/Phrases' },
    { value: 'required', label: 'Required Elements' },
    { value: 'tone', label: 'Tone Guidelines' },
    { value: 'length', label: 'Length Requirements' },
    { value: 'format', label: 'Format Rules' },
    { value: 'style', label: 'Style Guidelines' }
  ];

  const getSeverityOptions = () => [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-600' }
  ];

  const getChannelOptions = () => [
    'all', 'email', 'social', 'blog', 'content', 'website', 'advertising'
  ];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'forbidden': return '🚫';
      case 'required': return '✅';
      case 'tone': return '🎭';
      case 'length': return '📏';
      case 'format': return '📋';
      case 'style': return '✍️';
      default: return '📝';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Brand Rule Configuration</h2>
          <p className="text-gray-600 mt-1">
            Define and manage brand guidelines and content rules
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Create Brand Rule
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">Loading brand rules...</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <input
                type="text"
                placeholder="Search brand rules..."
                className="input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="input"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                {getRuleTypeOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                className="input"
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
              >
                <option value="all">All Severities</option>
                {getSeverityOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                className="input"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="name">Sort by Name</option>
                <option value="created">Sort by Created</option>
                <option value="type">Sort by Type</option>
                <option value="severity">Sort by Severity</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {sortedRules.length} of {brandRules.length} rules
            </div>
          </div>
        </div>
      </div>

      {/* Brand Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedRules.map((rule) => (
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
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                    {getRuleIcon(rule.type)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{rule.name}</h3>
                    <p className="text-sm text-gray-600">{rule.category}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(rule.severity)}`}>
                    {rule.severity}
                  </span>
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

              <p className="text-sm text-gray-600 mb-4">{rule.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900 capitalize">{rule.type}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Rules:</span>
                  <span className="font-medium text-gray-900">{rule.rules.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Channels:</span>
                  <span className="font-medium text-gray-900">{rule.channels.join(', ')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">{formatDate(rule.createdAt)}</span>
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

              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditModal(rule);
                  }}
                  className="btn-outline btn-sm flex-1"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRule(rule.id);
                  }}
                  className="btn-outline btn-sm text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Brand Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Brand Rule</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rule Type</label>
                  <select
                    className="input w-full"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as BrandRule['type'] }))}
                  >
                    {getRuleTypeOptions().map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Enter category"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                  <select
                    className="input w-full"
                    value={formData.severity}
                    onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as BrandRule['severity'] }))}
                  >
                    {getSeverityOptions().map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
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

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Rules</label>
                  <button
                    onClick={addRule}
                    className="btn-outline btn-sm"
                  >
                    Add Rule
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.rules.map((rule, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        className="input flex-1"
                        value={rule}
                        onChange={(e) => updateRule(index, e.target.value)}
                        placeholder="Enter rule"
                      />
                      <button
                        onClick={() => removeRule(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {formData.rules.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <div className="text-2xl mb-1">📝</div>
                      <p className="text-sm">No rules defined. Click "Add Rule" to get started.</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Channels</label>
                <div className="flex flex-wrap gap-2">
                  {getChannelOptions().map(channel => (
                    <label key={channel} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={formData.channels.includes(channel)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, channels: [...prev.channels, channel] }));
                          } else {
                            setFormData(prev => ({ ...prev, channels: prev.channels.filter(c => c !== channel) }));
                          }
                        }}
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{channel}</span>
                    </label>
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

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Rule is active
                </label>
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
                  disabled={!formData.name || formData.rules.length === 0}
                >
                  Create Brand Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Brand Rule Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Brand Rule</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rule Type</label>
                  <select
                    className="input w-full"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as BrandRule['type'] }))}
                  >
                    {getRuleTypeOptions().map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Enter category"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                  <select
                    className="input w-full"
                    value={formData.severity}
                    onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as BrandRule['severity'] }))}
                  >
                    {getSeverityOptions().map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
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

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Rules</label>
                  <button
                    onClick={addRule}
                    className="btn-outline btn-sm"
                  >
                    Add Rule
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.rules.map((rule, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        className="input flex-1"
                        value={rule}
                        onChange={(e) => updateRule(index, e.target.value)}
                        placeholder="Enter rule"
                      />
                      <button
                        onClick={() => removeRule(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Channels</label>
                <div className="flex flex-wrap gap-2">
                  {getChannelOptions().map(channel => (
                    <label key={channel} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={formData.channels.includes(channel)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, channels: [...prev.channels, channel] }));
                          } else {
                            setFormData(prev => ({ ...prev, channels: prev.channels.filter(c => c !== channel) }));
                          }
                        }}
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{channel}</span>
                    </label>
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

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <label htmlFor="isActiveEdit" className="ml-2 block text-sm text-gray-700">
                  Rule is active
                </label>
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
                  disabled={!formData.name || formData.rules.length === 0}
                >
                  Update Brand Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
