'use client';

import { useState, useEffect } from 'react';

interface QualityPolicy {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  channel: string;
  rules: QualityRule[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface QualityRule {
  id: string;
  name: string;
  type: 'readability' | 'word_count' | 'seo' | 'engagement' | 'brand_compliance' | 'tone' | 'format';
  condition: 'min' | 'max' | 'equals' | 'contains' | 'not_contains';
  value: string | number;
  weight: number;
  isRequired: boolean;
  description: string;
}

interface QualityPolicyManagementProps {
  onPolicySelect?: (policy: QualityPolicy) => void;
}

export default function QualityPolicyManagement({ onPolicySelect }: QualityPolicyManagementProps) {
  const [qualityPolicies, setQualityPolicies] = useState<QualityPolicy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<QualityPolicy | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<QualityPolicy | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'channel' | 'priority'>('name');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    channel: '',
    rules: [] as QualityRule[],
    tags: [] as string[],
    priority: 'medium' as QualityPolicy['priority'],
    isActive: true
  });

  // Mock data for demonstration
  const mockQualityPolicies: QualityPolicy[] = [
    {
      id: '1',
      name: 'Blog Content Quality',
      description: 'Quality standards for blog posts and articles',
      organizationId: 'org_chauncey',
      channel: 'blog',
      rules: [
        {
          id: '1',
          name: 'Readability Score',
          type: 'readability',
          condition: 'min',
          value: 60,
          weight: 30,
          isRequired: true,
          description: 'Minimum readability score for blog content'
        },
        {
          id: '2',
          name: 'Word Count',
          type: 'word_count',
          condition: 'min',
          value: 300,
          weight: 20,
          isRequired: true,
          description: 'Minimum word count for blog posts'
        },
        {
          id: '3',
          name: 'SEO Keywords',
          type: 'seo',
          condition: 'contains',
          value: 'primary keyword',
          weight: 25,
          isRequired: true,
          description: 'Must contain primary SEO keyword'
        }
      ],
      isActive: true,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-20'),
      createdBy: 'Admin User',
      tags: ['blog', 'content', 'quality'],
      priority: 'high'
    },
    {
      id: '2',
      name: 'Social Media Standards',
      description: 'Quality guidelines for social media posts',
      organizationId: 'org_chauncey',
      channel: 'social',
      rules: [
        {
          id: '4',
          name: 'Character Limit',
          type: 'word_count',
          condition: 'max',
          value: 280,
          weight: 40,
          isRequired: true,
          description: 'Maximum character count for Twitter posts'
        },
        {
          id: '5',
          name: 'Hashtag Count',
          type: 'format',
          condition: 'max',
          value: 5,
          weight: 15,
          isRequired: false,
          description: 'Maximum number of hashtags'
        },
        {
          id: '6',
          name: 'Engagement Elements',
          type: 'engagement',
          condition: 'contains',
          value: 'call-to-action',
          weight: 25,
          isRequired: true,
          description: 'Must include call-to-action'
        }
      ],
      isActive: true,
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-18'),
      createdBy: 'Editor User',
      tags: ['social', 'engagement', 'standards'],
      priority: 'medium'
    },
    {
      id: '3',
      name: 'Email Marketing Quality',
      description: 'Quality standards for email campaigns',
      organizationId: 'org_chauncey',
      channel: 'email',
      rules: [
        {
          id: '7',
          name: 'Subject Line Length',
          type: 'word_count',
          condition: 'max',
          value: 50,
          weight: 20,
          isRequired: true,
          description: 'Maximum subject line character count'
        },
        {
          id: '8',
          name: 'Brand Compliance',
          type: 'brand_compliance',
          condition: 'contains',
          value: 'company logo',
          weight: 30,
          isRequired: true,
          description: 'Must include company branding elements'
        },
        {
          id: '9',
          name: 'Professional Tone',
          type: 'tone',
          condition: 'equals',
          value: 'professional',
          weight: 25,
          isRequired: true,
          description: 'Must maintain professional tone'
        }
      ],
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-19'),
      createdBy: 'Admin User',
      tags: ['email', 'marketing', 'professional'],
      priority: 'high'
    },
    {
      id: '4',
      name: 'Website Content Standards',
      description: 'Quality guidelines for website content',
      organizationId: 'org_chauncey',
      channel: 'website',
      rules: [
        {
          id: '10',
          name: 'SEO Optimization',
          type: 'seo',
          condition: 'min',
          value: 80,
          weight: 35,
          isRequired: true,
          description: 'Minimum SEO score for website content'
        },
        {
          id: '11',
          name: 'Readability',
          type: 'readability',
          condition: 'min',
          value: 70,
          weight: 25,
          isRequired: true,
          description: 'High readability score required'
        },
        {
          id: '12',
          name: 'Format Compliance',
          type: 'format',
          condition: 'contains',
          value: 'headings',
          weight: 20,
          isRequired: true,
          description: 'Must include proper heading structure'
        }
      ],
      isActive: false,
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-16'),
      createdBy: 'Editor User',
      tags: ['website', 'seo', 'content'],
      priority: 'medium'
    }
  ];

  useEffect(() => {
    setQualityPolicies(mockQualityPolicies);
  }, []);

  const handleCreatePolicy = () => {
    const newPolicy: QualityPolicy = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      organizationId: 'org_chauncey',
      channel: formData.channel,
      rules: formData.rules,
      tags: formData.tags,
      priority: formData.priority,
      isActive: formData.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'Current User'
    };

    setQualityPolicies(prev => [newPolicy, ...prev]);
    setShowCreateModal(false);
    resetForm();
    alert('Quality policy created successfully!');
  };

  const handleEditPolicy = () => {
    if (!editingPolicy) return;

    const updatedPolicy: QualityPolicy = {
      ...editingPolicy,
      name: formData.name,
      description: formData.description,
      channel: formData.channel,
      rules: formData.rules,
      tags: formData.tags,
      priority: formData.priority,
      isActive: formData.isActive,
      updatedAt: new Date()
    };

    setQualityPolicies(prev => prev.map(policy => 
      policy.id === editingPolicy.id ? updatedPolicy : policy
    ));
    setShowEditModal(false);
    setEditingPolicy(null);
    resetForm();
    alert('Quality policy updated successfully!');
  };

  const handleDeletePolicy = (policyId: string) => {
    if (!confirm('Are you sure you want to delete this quality policy?')) {
      return;
    }
    setQualityPolicies(prev => prev.filter(policy => policy.id !== policyId));
    alert('Quality policy deleted successfully!');
  };

  const handleToggleActive = (policyId: string) => {
    setQualityPolicies(prev => prev.map(policy => 
      policy.id === policyId 
        ? { ...policy, isActive: !policy.isActive, updatedAt: new Date() }
        : policy
    ));
  };

  const handlePolicySelect = (policy: QualityPolicy) => {
    setSelectedPolicy(policy);
    if (onPolicySelect) {
      onPolicySelect(policy);
    }
  };

  const handleOpenEditModal = (policy: QualityPolicy) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      description: policy.description,
      channel: policy.channel,
      rules: policy.rules,
      tags: policy.tags,
      priority: policy.priority,
      isActive: policy.isActive
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      channel: '',
      rules: [],
      tags: [],
      priority: 'medium',
      isActive: true
    });
  };

  const addRule = () => {
    const newRule: QualityRule = {
      id: Date.now().toString(),
      name: '',
      type: 'readability',
      condition: 'min',
      value: '',
      weight: 10,
      isRequired: false,
      description: ''
    };
    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, newRule]
    }));
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const updateRule = (index: number, field: keyof QualityRule, value: any) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) => 
        i === index ? { ...rule, [field]: value } : rule
      )
    }));
  };

  const filteredPolicies = qualityPolicies.filter(policy => {
    const matchesSearch = searchQuery === '' || 
      policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesChannel = filterChannel === 'all' || policy.channel === filterChannel;
    const matchesPriority = filterPriority === 'all' || policy.priority === filterPriority;
    return matchesSearch && matchesChannel && matchesPriority;
  });

  const sortedPolicies = [...filteredPolicies].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'created':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'channel':
        return a.channel.localeCompare(b.channel);
      case 'priority':
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      default:
        return 0;
    }
  });

  const getChannelOptions = () => [
    'blog', 'social', 'email', 'website', 'advertising', 'content', 'all'
  ];

  const getPriorityOptions = () => [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-600' }
  ];

  const getRuleTypeOptions = () => [
    { value: 'readability', label: 'Readability Score' },
    { value: 'word_count', label: 'Word Count' },
    { value: 'seo', label: 'SEO Score' },
    { value: 'engagement', label: 'Engagement Elements' },
    { value: 'brand_compliance', label: 'Brand Compliance' },
    { value: 'tone', label: 'Tone Analysis' },
    { value: 'format', label: 'Format Compliance' }
  ];

  const getConditionOptions = () => [
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does Not Contain' }
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'blog': return '📝';
      case 'social': return '📱';
      case 'email': return '📧';
      case 'website': return '🌐';
      case 'advertising': return '📢';
      case 'content': return '📄';
      default: return '📋';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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
          <h2 className="text-xl font-semibold text-gray-900">Quality Policy Management</h2>
          <p className="text-gray-600 mt-1">
            Define and manage content quality standards
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Create Quality Policy
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <input
                type="text"
                placeholder="Search quality policies..."
                className="input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="input"
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
              >
                <option value="all">All Channels</option>
                {getChannelOptions().map(channel => (
                  <option key={channel} value={channel}>{channel.charAt(0).toUpperCase() + channel.slice(1)}</option>
                ))}
              </select>
              <select
                className="input"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">All Priorities</option>
                {getPriorityOptions().map(option => (
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
                <option value="channel">Sort by Channel</option>
                <option value="priority">Sort by Priority</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {sortedPolicies.length} of {qualityPolicies.length} policies
            </div>
          </div>
        </div>
      </div>

      {/* Quality Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPolicies.map((policy) => (
          <div
            key={policy.id}
            className={`card cursor-pointer transition-all ${
              selectedPolicy?.id === policy.id ? 'ring-2 ring-primary-500' : 'hover:shadow-lg'
            }`}
            onClick={() => handlePolicySelect(policy)}
          >
            <div className="card-content">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                    {getChannelIcon(policy.channel)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{policy.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{policy.channel}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(policy.priority)}`}>
                    {policy.priority}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(policy.id);
                    }}
                    className={`w-3 h-3 rounded-full ${
                      policy.isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    title={policy.isActive ? 'Active' : 'Inactive'}
                  />
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{policy.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Rules:</span>
                  <span className="font-medium text-gray-900">{policy.rules.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Required Rules:</span>
                  <span className="font-medium text-gray-900">
                    {policy.rules.filter(rule => rule.isRequired).length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Weight:</span>
                  <span className="font-medium text-gray-900">
                    {policy.rules.reduce((sum, rule) => sum + rule.weight, 0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">{formatDate(policy.createdAt)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {policy.tags.map((tag, index) => (
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
                    handleOpenEditModal(policy);
                  }}
                  className="btn-outline btn-sm flex-1"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePolicy(policy.id);
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

      {/* Create Quality Policy Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Quality Policy</h2>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Policy Name</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter policy name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
                  <select
                    className="input w-full"
                    value={formData.channel}
                    onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value }))}
                  >
                    <option value="">Select channel</option>
                    {getChannelOptions().map(channel => (
                      <option key={channel} value={channel}>{channel.charAt(0).toUpperCase() + channel.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    className="input w-full"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as QualityPolicy['priority'] }))}
                  >
                    {getPriorityOptions().map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="input w-full"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter policy description"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Quality Rules</label>
                  <button
                    onClick={addRule}
                    className="btn-outline btn-sm"
                  >
                    Add Rule
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.rules.map((rule, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
                          <input
                            type="text"
                            className="input w-full"
                            value={rule.name}
                            onChange={(e) => updateRule(index, 'name', e.target.value)}
                            placeholder="Enter rule name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Rule Type</label>
                          <select
                            className="input w-full"
                            value={rule.type}
                            onChange={(e) => updateRule(index, 'type', e.target.value)}
                          >
                            {getRuleTypeOptions().map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                          <select
                            className="input w-full"
                            value={rule.condition}
                            onChange={(e) => updateRule(index, 'condition', e.target.value)}
                          >
                            {getConditionOptions().map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                          <input
                            type="text"
                            className="input w-full"
                            value={rule.value}
                            onChange={(e) => updateRule(index, 'value', e.target.value)}
                            placeholder="Enter value"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Weight (%)</label>
                          <input
                            type="number"
                            className="input w-full"
                            value={rule.weight}
                            onChange={(e) => updateRule(index, 'weight', parseInt(e.target.value) || 0)}
                            placeholder="Weight"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          className="input w-full"
                          rows={2}
                          value={rule.description}
                          onChange={(e) => updateRule(index, 'description', e.target.value)}
                          placeholder="Enter rule description"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            checked={rule.isRequired}
                            onChange={(e) => updateRule(index, 'isRequired', e.target.checked)}
                          />
                          <label className="ml-2 block text-sm text-gray-700">
                            Required rule
                          </label>
                        </div>
                        <button
                          onClick={() => removeRule(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove Rule
                        </button>
                      </div>
                    </div>
                  ))}
                  {formData.rules.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">⭐</div>
                      <p className="text-sm">No quality rules defined. Click "Add Rule" to get started.</p>
                    </div>
                  )}
                </div>
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
                  Policy is active
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
                  onClick={handleCreatePolicy}
                  className="btn-primary"
                  disabled={!formData.name || !formData.channel || formData.rules.length === 0}
                >
                  Create Quality Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quality Policy Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Quality Policy</h2>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Same form fields as create modal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Policy Name</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter policy name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
                  <select
                    className="input w-full"
                    value={formData.channel}
                    onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value }))}
                  >
                    <option value="">Select channel</option>
                    {getChannelOptions().map(channel => (
                      <option key={channel} value={channel}>{channel.charAt(0).toUpperCase() + channel.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    className="input w-full"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as QualityPolicy['priority'] }))}
                  >
                    {getPriorityOptions().map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="input w-full"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter policy description"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Quality Rules</label>
                  <button
                    onClick={addRule}
                    className="btn-outline btn-sm"
                  >
                    Add Rule
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.rules.map((rule, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
                          <input
                            type="text"
                            className="input w-full"
                            value={rule.name}
                            onChange={(e) => updateRule(index, 'name', e.target.value)}
                            placeholder="Enter rule name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Rule Type</label>
                          <select
                            className="input w-full"
                            value={rule.type}
                            onChange={(e) => updateRule(index, 'type', e.target.value)}
                          >
                            {getRuleTypeOptions().map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                          <select
                            className="input w-full"
                            value={rule.condition}
                            onChange={(e) => updateRule(index, 'condition', e.target.value)}
                          >
                            {getConditionOptions().map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                          <input
                            type="text"
                            className="input w-full"
                            value={rule.value}
                            onChange={(e) => updateRule(index, 'value', e.target.value)}
                            placeholder="Enter value"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Weight (%)</label>
                          <input
                            type="number"
                            className="input w-full"
                            value={rule.weight}
                            onChange={(e) => updateRule(index, 'weight', parseInt(e.target.value) || 0)}
                            placeholder="Weight"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          className="input w-full"
                          rows={2}
                          value={rule.description}
                          onChange={(e) => updateRule(index, 'description', e.target.value)}
                          placeholder="Enter rule description"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            checked={rule.isRequired}
                            onChange={(e) => updateRule(index, 'isRequired', e.target.checked)}
                          />
                          <label className="ml-2 block text-sm text-gray-700">
                            Required rule
                          </label>
                        </div>
                        <button
                          onClick={() => removeRule(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove Rule
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
                  Policy is active
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPolicy(null);
                    resetForm();
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditPolicy}
                  className="btn-primary"
                  disabled={!formData.name || !formData.channel || formData.rules.length === 0}
                >
                  Update Quality Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
