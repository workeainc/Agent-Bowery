'use client';

import { useState, useEffect } from 'react';

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: 'greeting' | 'pricing' | 'support' | 'follow-up' | 'custom';
  platform: string;
  variables: string[];
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MessageTemplatesProps {
  onTemplateSelect?: (template: MessageTemplate) => void;
}

export default function MessageTemplates({ onTemplateSelect }: MessageTemplatesProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: 'greeting' as MessageTemplate['category'],
    platform: 'FACEBOOK',
    variables: [] as string[],
    isActive: true
  });

  // Mock data for demonstration
  const mockTemplates: MessageTemplate[] = [
    {
      id: '1',
      name: 'Welcome Message',
      content: 'Hello {{name}}! Thank you for reaching out. How can I help you today?',
      category: 'greeting',
      platform: 'FACEBOOK',
      variables: ['name'],
      isActive: true,
      usageCount: 45,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      name: 'Pricing Inquiry Response',
      content: 'Hi {{name}}! I\'d be happy to share our pricing information. Our {{plan}} plan starts at ${{price}}/month. Would you like me to send you a detailed breakdown?',
      category: 'pricing',
      platform: 'LINKEDIN',
      variables: ['name', 'plan', 'price'],
      isActive: true,
      usageCount: 23,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      name: 'Support Follow-up',
      content: 'Hi {{name}}, I hope your issue has been resolved. If you need any further assistance, please don\'t hesitate to reach out!',
      category: 'follow-up',
      platform: 'EMAIL',
      variables: ['name'],
      isActive: true,
      usageCount: 12,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
    },
    {
      id: '4',
      name: 'Product Demo Request',
      content: 'Hello {{name}}! I\'d love to show you how {{product}} can help {{company}}. Would you be available for a 15-minute demo this week?',
      category: 'custom',
      platform: 'TWITTER',
      variables: ['name', 'product', 'company'],
      isActive: true,
      usageCount: 8,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
    }
  ];

  useEffect(() => {
    setTemplates(mockTemplates);
  }, []);

  const handleCreateTemplate = () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      alert('Please fill in name and content');
      return;
    }

    const newTemplate: MessageTemplate = {
      id: Date.now().toString(),
      ...formData,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setTemplates(prev => [newTemplate, ...prev]);
    setShowCreateModal(false);
    resetForm();
    alert('Message template created successfully!');
  };

  const handleDeleteTemplate = (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    setTemplates(prev => prev.filter(template => template.id !== id));
    alert('Template deleted successfully!');
  };

  const handleUseTemplate = (template: MessageTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
    
    // Increment usage count
    setTemplates(prev => prev.map(t => 
      t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
    ));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      content: '',
      category: 'greeting',
      platform: 'FACEBOOK',
      variables: [],
      isActive: true
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'greeting': return '👋';
      case 'pricing': return '💰';
      case 'support': return '🛠️';
      case 'follow-up': return '📞';
      case 'custom': return '📝';
      default: return '📄';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'greeting': return 'bg-blue-100 text-blue-800';
      case 'pricing': return 'bg-green-100 text-green-800';
      case 'support': return 'bg-yellow-100 text-yellow-800';
      case 'follow-up': return 'bg-purple-100 text-purple-800';
      case 'custom': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    return matches ? matches.map(match => match.replace(/[{}]/g, '')) : [];
  };

  const filteredTemplates = templates.filter(template => {
    if (selectedCategory !== 'all' && template.category !== selectedCategory) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.content.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Message Templates</h2>
          <p className="text-gray-600 mt-1">
            Create and manage quick reply templates for faster responses
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Create Template
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full"
              placeholder="Search templates..."
            />
          </div>
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All', count: templates.length },
              { key: 'greeting', label: 'Greeting', count: templates.filter(t => t.category === 'greeting').length },
              { key: 'pricing', label: 'Pricing', count: templates.filter(t => t.category === 'pricing').length },
              { key: 'support', label: 'Support', count: templates.filter(t => t.category === 'support').length },
              { key: 'follow-up', label: 'Follow-up', count: templates.filter(t => t.category === 'follow-up').length },
              { key: 'custom', label: 'Custom', count: templates.filter(t => t.category === 'custom').length }
            ].map((category) => (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  selectedCategory === category.key
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="card">
            <div className="card-content">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getCategoryIcon(template.category)}</span>
                  <h3 className="font-medium text-gray-900">{template.name}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{getPlatformIcon(template.platform)}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(template.category)}`}>
                    {template.category}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 line-clamp-3">{template.content}</p>
              </div>

              {template.variables.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-700 mb-1">Variables:</div>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>Used {template.usageCount} times</span>
                <span>Updated {template.updatedAt.toLocaleDateString()}</span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="btn-primary btn-sm flex-1"
                >
                  Use Template
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="btn-outline btn-sm text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-500 mb-4">
              Create your first message template to speed up your responses.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Template
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
                <h2 className="text-xl font-semibold text-gray-900">Create Message Template</h2>
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
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input w-full"
                    placeholder="e.g., Welcome Message"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as MessageTemplate['category'] })}
                    className="input w-full"
                  >
                    <option value="greeting">Greeting</option>
                    <option value="pricing">Pricing</option>
                    <option value="support">Support</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
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

              {/* Template Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => {
                    const content = e.target.value;
                    const variables = extractVariables(content);
                    setFormData({ ...formData, content, variables });
                  }}
                  className="input w-full h-32 resize-none"
                  placeholder="Enter your template content. Use {{variable}} for dynamic content..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {`{{variable}}`} syntax for dynamic content (e.g., {`{{name}}`, `{{company}}`})
                </p>
              </div>

              {/* Variables Preview */}
              {formData.variables.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detected Variables
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formData.variables.map((variable, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full"
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
                  Activate template immediately
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
                  onClick={handleCreateTemplate}
                  className="btn-primary"
                >
                  Create Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
