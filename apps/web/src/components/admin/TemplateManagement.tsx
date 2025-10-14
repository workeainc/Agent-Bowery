'use client';

import { useState, useEffect } from 'react';
import TemplatePreview from '@/components/templates/TemplatePreview';
import TemplateVariableProcessor from '@/components/templates/TemplateVariableProcessor';
import TemplateRenderHistory from '@/components/templates/TemplateRenderHistory';

interface Template {
  id: string;
  name: string;
  description: string;
  prompt: string;
  variables: string[];
  category: string;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: string[];
}

interface TemplateManagementProps {
  onTemplateSelect?: (template: Template) => void;
}

export default function TemplateManagement({ onTemplateSelect }: TemplateManagementProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'usage' | 'category'>('name');
  const [activeTab, setActiveTab] = useState<'list' | 'preview' | 'processor' | 'history'>('list');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    variables: [] as string[],
    category: '',
    tags: [] as string[],
    isActive: true
  });

  // Mock data for demonstration
  const mockTemplates: Template[] = [
    {
      id: '1',
      name: 'Blog Post Generator',
      description: 'Generate engaging blog posts for various topics',
      prompt: 'Write a comprehensive blog post about {topic} that is {tone} and targets {audience}. Include {sections} and maintain a {style} writing style.',
      variables: ['topic', 'tone', 'audience', 'sections', 'style'],
      category: 'Content Creation',
      isActive: true,
      usageCount: 245,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-20'),
      createdBy: 'Admin User',
      tags: ['blog', 'content', 'writing']
    },
    {
      id: '2',
      name: 'Social Media Caption',
      description: 'Create engaging social media captions',
      prompt: 'Create a {platform} caption for {content_type} that is {tone} and includes {hashtags} hashtags. Target {audience} and include a call-to-action.',
      variables: ['platform', 'content_type', 'tone', 'hashtags', 'audience'],
      category: 'Social Media',
      isActive: true,
      usageCount: 189,
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-18'),
      createdBy: 'Editor User',
      tags: ['social', 'caption', 'engagement']
    },
    {
      id: '3',
      name: 'Email Newsletter',
      description: 'Generate email newsletter content',
      prompt: 'Create an email newsletter about {subject} for {company} that includes {sections}. Use a {tone} tone and target {audience}.',
      variables: ['subject', 'company', 'sections', 'tone', 'audience'],
      category: 'Email Marketing',
      isActive: true,
      usageCount: 156,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-19'),
      createdBy: 'Admin User',
      tags: ['email', 'newsletter', 'marketing']
    },
    {
      id: '4',
      name: 'Product Description',
      description: 'Create compelling product descriptions',
      prompt: 'Write a product description for {product_name} that highlights {features} and appeals to {target_market}. Use {tone} tone and include {call_to_action}.',
      variables: ['product_name', 'features', 'target_market', 'tone', 'call_to_action'],
      category: 'E-commerce',
      isActive: false,
      usageCount: 78,
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-16'),
      createdBy: 'Editor User',
      tags: ['product', 'ecommerce', 'sales']
    },
    {
      id: '5',
      name: 'Press Release',
      description: 'Generate professional press releases',
      prompt: 'Write a press release for {company} announcing {announcement}. Include {key_points} and target {media_outlets}. Use professional tone.',
      variables: ['company', 'announcement', 'key_points', 'media_outlets'],
      category: 'PR & Communications',
      isActive: true,
      usageCount: 45,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-17'),
      createdBy: 'Admin User',
      tags: ['press', 'pr', 'announcement']
    }
  ];

  useEffect(() => {
    setTemplates(mockTemplates);
  }, []);

  const handleCreateTemplate = () => {
    const newTemplate: Template = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      prompt: formData.prompt,
      variables: formData.variables,
      category: formData.category,
      tags: formData.tags,
      isActive: formData.isActive,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'Current User'
    };

    setTemplates(prev => [newTemplate, ...prev]);
    setShowCreateModal(false);
    resetForm();
    alert('Template created successfully!');
  };

  const handleEditTemplate = () => {
    if (!editingTemplate) return;

    const updatedTemplate: Template = {
      ...editingTemplate,
      name: formData.name,
      description: formData.description,
      prompt: formData.prompt,
      variables: formData.variables,
      category: formData.category,
      tags: formData.tags,
      isActive: formData.isActive,
      updatedAt: new Date()
    };

    setTemplates(prev => prev.map(template => 
      template.id === editingTemplate.id ? updatedTemplate : template
    ));
    setShowEditModal(false);
    setEditingTemplate(null);
    resetForm();
    alert('Template updated successfully!');
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }
    setTemplates(prev => prev.filter(template => template.id !== templateId));
    alert('Template deleted successfully!');
  };

  const handleToggleActive = (templateId: string) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, isActive: !template.isActive, updatedAt: new Date() }
        : template
    ));
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const handleOpenEditModal = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      prompt: template.prompt,
      variables: template.variables,
      category: template.category,
      tags: template.tags,
      isActive: template.isActive
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      prompt: '',
      variables: [],
      category: '',
      tags: [],
      isActive: true
    });
  };

  const addVariable = () => {
    setFormData(prev => ({
      ...prev,
      variables: [...prev.variables, '']
    }));
  };

  const removeVariable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  const updateVariable = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.map((variable, i) => i === index ? value : variable)
    }));
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'created':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'usage':
        return b.usageCount - a.usageCount;
      case 'category':
        return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

  const getCategoryOptions = () => [
    'Content Creation',
    'Social Media',
    'Email Marketing',
    'E-commerce',
    'PR & Communications',
    'Technical Writing',
    'Creative Writing',
    'Marketing Copy'
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'Content Creation': return '📝';
      case 'Social Media': return '📱';
      case 'Email Marketing': return '📧';
      case 'E-commerce': return '🛒';
      case 'PR & Communications': return '📢';
      case 'Technical Writing': return '🔧';
      case 'Creative Writing': return '✨';
      case 'Marketing Copy': return '📈';
      default: return '📄';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Template Management</h2>
          <p className="text-gray-600 mt-1">
            Create and manage AI prompt templates
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Create Template
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { key: 'list', label: 'Template List', icon: '📋' },
            { key: 'preview', label: 'Template Preview', icon: '👁️' },
            { key: 'processor', label: 'Variable Processor', icon: '⚙️' },
            { key: 'history', label: 'Render History', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'list' && (
        <>
          {/* Filters and Search */}
          <div className="card">
            <div className="card-content">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <input
                type="text"
                placeholder="Search templates..."
                className="input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="input"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {getCategoryOptions().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                className="input"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="name">Sort by Name</option>
                <option value="created">Sort by Created</option>
                <option value="usage">Sort by Usage</option>
                <option value="category">Sort by Category</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {sortedTemplates.length} of {templates.length} templates
            </div>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedTemplates.map((template) => (
          <div
            key={template.id}
            className={`card cursor-pointer transition-all ${
              selectedTemplate?.id === template.id ? 'ring-2 ring-primary-500' : 'hover:shadow-lg'
            }`}
            onClick={() => handleTemplateSelect(template)}
          >
            <div className="card-content">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                    {getTemplateIcon(template.category)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.category}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(template.id);
                    }}
                    className={`w-3 h-3 rounded-full ${
                      template.isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    title={template.isActive ? 'Active' : 'Inactive'}
                  />
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{template.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Usage:</span>
                  <span className="font-medium text-gray-900">{template.usageCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Variables:</span>
                  <span className="font-medium text-gray-900">{template.variables.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">{formatDate(template.createdAt)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.map((tag, index) => (
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
                    setSelectedTemplate(template);
                    setActiveTab('preview');
                  }}
                  className="btn-outline btn-sm flex-1"
                >
                  Preview
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTemplate(template);
                    setActiveTab('processor');
                  }}
                  className="btn-outline btn-sm flex-1"
                >
                  Process
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTemplate(template);
                    setActiveTab('history');
                  }}
                  className="btn-outline btn-sm flex-1"
                >
                  History
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditModal(template);
                  }}
                  className="btn-outline btn-sm"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTemplate(template.id);
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
        </>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Template</h2>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter template name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    className="input w-full"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">Select category</option>
                    {getCategoryOptions().map(category => (
                      <option key={category} value={category}>{category}</option>
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
                  placeholder="Enter template description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prompt Template</label>
                <textarea
                  className="input w-full"
                  rows={6}
                  value={formData.prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Enter the prompt template with variables in {curly_braces}"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use variables in curly braces like {`{variable_name}`} to make them dynamic
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Variables</label>
                  <button
                    onClick={addVariable}
                    className="btn-outline btn-sm"
                  >
                    Add Variable
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.variables.map((variable, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        className="input flex-1"
                        value={variable}
                        onChange={(e) => updateVariable(index, e.target.value)}
                        placeholder="Variable name"
                      />
                      <button
                        onClick={() => removeVariable(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {formData.variables.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <div className="text-2xl mb-1">🔧</div>
                      <p className="text-sm">No variables defined. Click "Add Variable" to get started.</p>
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

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Template is active
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
                  onClick={handleCreateTemplate}
                  className="btn-primary"
                  disabled={!formData.name || !formData.prompt}
                >
                  Create Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Template</h2>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Same form fields as create modal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter template name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    className="input w-full"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">Select category</option>
                    {getCategoryOptions().map(category => (
                      <option key={category} value={category}>{category}</option>
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
                  placeholder="Enter template description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prompt Template</label>
                <textarea
                  className="input w-full"
                  rows={6}
                  value={formData.prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Enter the prompt template with variables in {curly_braces}"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Variables</label>
                  <button
                    onClick={addVariable}
                    className="btn-outline btn-sm"
                  >
                    Add Variable
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.variables.map((variable, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        className="input flex-1"
                        value={variable}
                        onChange={(e) => updateVariable(index, e.target.value)}
                        placeholder="Variable name"
                      />
                      <button
                        onClick={() => removeVariable(index)}
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

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <label htmlFor="isActiveEdit" className="ml-2 block text-sm text-gray-700">
                  Template is active
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTemplate(null);
                    resetForm();
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditTemplate}
                  className="btn-primary"
                  disabled={!formData.name || !formData.prompt}
                >
                  Update Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Tab */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          {selectedTemplate ? (
            <TemplatePreview 
              templateId={selectedTemplate.id}
              onPreviewGenerated={(preview) => {
                console.log('Preview generated:', preview);
              }}
            />
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-4">👁️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Template</h3>
                <p className="text-gray-500">
                  Choose a template from the list to preview its rendering capabilities.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Variable Processor Tab */}
      {activeTab === 'processor' && (
        <div className="space-y-6">
          {selectedTemplate ? (
            <TemplateVariableProcessor 
              templateId={selectedTemplate.id}
              onVariablesExtracted={(variables) => {
                console.log('Variables extracted:', variables);
              }}
              onContentProcessed={(content) => {
                console.log('Content processed:', content);
              }}
            />
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-4">⚙️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Template</h3>
                <p className="text-gray-500">
                  Choose a template from the list to process its variables.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Render History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {selectedTemplate ? (
            <TemplateRenderHistory 
              templateId={selectedTemplate.id}
              limit={50}
            />
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Template</h3>
                <p className="text-gray-500">
                  Choose a template from the list to view its render history.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
