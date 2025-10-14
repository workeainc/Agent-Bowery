'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface PromptTemplate {
  id: string;
  name: string;
  version: string;
  channel: string;
  inputSchema?: any;
  template: string;
  outputSchema?: any;
  created_at?: string;
  updated_at?: string;
}

export default function PromptTemplateManagement() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    version: '1.0.0',
    channel: 'default',
    template: '',
    inputSchema: '',
    outputSchema: ''
  });

  // Mock templates for demonstration
  const mockTemplates: PromptTemplate[] = [
    {
      id: 'template-1',
      name: 'Blog Post Generator',
      version: '1.0.0',
      channel: 'default',
      template: 'Write a comprehensive blog post about {{topic}} with {{tone}} tone.',
      inputSchema: { topic: 'string', tone: 'string' },
      outputSchema: { title: 'string', content: 'string' },
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-10T10:00:00Z'
    },
    {
      id: 'template-2',
      name: 'Social Media Post',
      version: '1.1.0',
      channel: 'social',
      template: 'Create a {{platform}} post about {{message}} with {{hashtags}} hashtags.',
      inputSchema: { platform: 'string', message: 'string', hashtags: 'array' },
      outputSchema: { post: 'string', hashtags: 'array' },
      created_at: '2024-01-12T14:30:00Z',
      updated_at: '2024-01-15T09:15:00Z'
    }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // Use mock data for demonstration
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      setLoading(true);
      
      const templateData = {
        name: formData.name,
        version: formData.version,
        channel: formData.channel,
        template: formData.template,
        inputSchema: formData.inputSchema ? JSON.parse(formData.inputSchema) : undefined,
        outputSchema: formData.outputSchema ? JSON.parse(formData.outputSchema) : undefined
      };

      const result = await apiClient.createPromptTemplate(templateData);
      
      const newTemplate: PromptTemplate = {
        id: result.id,
        ...templateData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setTemplates(prev => [...prev, newTemplate]);
      setShowCreateModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Failed to create template:', error);
      alert('Failed to create template: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      setLoading(true);
      
      const updates = {
        template: formData.template,
        inputSchema: formData.inputSchema ? JSON.parse(formData.inputSchema) : undefined,
        outputSchema: formData.outputSchema ? JSON.parse(formData.outputSchema) : undefined
      };

      await apiClient.updatePromptTemplate(editingTemplate.id, updates);
      
      setTemplates(prev => prev.map(template => 
        template.id === editingTemplate.id 
          ? { ...template, ...updates, updated_at: new Date().toISOString() }
          : template
      ));

      setEditingTemplate(null);
      resetForm();
    } catch (error: any) {
      console.error('Failed to update template:', error);
      alert('Failed to update template: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (template: PromptTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      version: template.version,
      channel: template.channel,
      template: template.template,
      inputSchema: template.inputSchema ? JSON.stringify(template.inputSchema, null, 2) : '',
      outputSchema: template.outputSchema ? JSON.stringify(template.outputSchema, null, 2) : ''
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      version: '1.0.0',
      channel: 'default',
      template: '',
      inputSchema: '',
      outputSchema: ''
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Prompt Template Management</h2>
            <p className="text-sm text-gray-600">Create and manage AI prompt templates for content generation</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingTemplate(null);
              setShowCreateModal(true);
            }}
            className="btn-primary"
          >
            Create Template
          </button>
        </div>

        {/* Templates List */}
        <div className="card">
          <div className="card-content">
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📄</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates</h3>
                <p className="text-gray-600">Create your first prompt template to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 text-lg">📝</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <p className="text-sm text-gray-600">
                            Version {template.version} • Channel: {template.channel}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="btn-secondary btn-sm"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Template
                      </label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {template.template}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Input Schema
                        </label>
                        <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                          {template.inputSchema ? JSON.stringify(template.inputSchema, null, 2) : 'None'}
                        </pre>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Output Schema
                        </label>
                        <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                          {template.outputSchema ? JSON.stringify(template.outputSchema, null, 2) : 'None'}
                        </pre>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      Created: {formatDate(template.created_at || '')} • 
                      Updated: {formatDate(template.updated_at || '')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingTemplate ? 'Edit Template' : 'Create Template'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingTemplate(null);
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
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Template Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="input w-full"
                        placeholder="e.g., Blog Post Generator"
                        disabled={!!editingTemplate}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Version
                      </label>
                      <input
                        type="text"
                        value={formData.version}
                        onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                        className="input w-full"
                        placeholder="e.g., 1.0.0"
                        disabled={!!editingTemplate}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Channel
                    </label>
                    <input
                      type="text"
                      value={formData.channel}
                      onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value }))}
                      className="input w-full"
                      placeholder="e.g., default, social, blog"
                      disabled={!!editingTemplate}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template Content
                    </label>
                    <textarea
                      value={formData.template}
                      onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value }))}
                      className="input w-full h-32 resize-none"
                      placeholder="Write your prompt template here. Use {{variable}} for placeholders."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Input Schema (JSON)
                      </label>
                      <textarea
                        value={formData.inputSchema}
                        onChange={(e) => setFormData(prev => ({ ...prev, inputSchema: e.target.value }))}
                        className="input w-full h-24 resize-none font-mono text-sm"
                        placeholder='{"topic": "string", "tone": "string"}'
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Output Schema (JSON)
                      </label>
                      <textarea
                        value={formData.outputSchema}
                        onChange={(e) => setFormData(prev => ({ ...prev, outputSchema: e.target.value }))}
                        className="input w-full h-24 resize-none font-mono text-sm"
                        placeholder='{"title": "string", "content": "string"}'
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTemplate(null);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                  disabled={loading || !formData.name || !formData.template}
                  className="btn-primary"
                >
                  {loading ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
