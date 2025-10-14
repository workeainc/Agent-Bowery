'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AppShell from '@/components/layout/AppShell';
import { apiClient } from '@/lib/api-client';
import { ContentManager } from '@/components/auth/RoleGuard';

interface Template {
  id: string;
  name: string;
  description: string;
  prompt: string;
  contentType: string;
  tone: string;
  length: string;
  keywords: string[];
  targetAudience: string;
  createdAt: string;
  updatedAt: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    contentType: 'BLOG',
    tone: 'professional',
    length: 'medium',
    keywords: '',
    targetAudience: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const result = await apiClient.getTemplates();
      setTemplates(result || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      // Mock templates for demo
      setTemplates([
        {
          id: '1',
          name: 'Blog Post Template',
          description: 'A comprehensive template for creating engaging blog posts',
          prompt: 'Write a blog post about {topic} that is {tone} and {length} in length. Include keywords: {keywords}. Target audience: {audience}.',
          contentType: 'BLOG',
          tone: 'professional',
          length: 'medium',
          keywords: ['SEO', 'content marketing'],
          targetAudience: 'Marketing professionals',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Social Media Post',
          description: 'Template for creating engaging social media content',
          prompt: 'Create a {tone} social media post about {topic}. Keep it {length} and include hashtags. Target: {audience}.',
          contentType: 'SOCIAL_POST',
          tone: 'casual',
          length: 'short',
          keywords: ['social media', 'engagement'],
          targetAudience: 'General audience',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!formData.name.trim() || !formData.prompt.trim()) {
      alert('Please fill in name and prompt');
      return;
    }

    try {
      const templateData = {
        ...formData,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
      };
      
      await apiClient.createTemplate(templateData);
      await fetchTemplates();
      setShowCreateModal(false);
      resetForm();
      alert('Template created successfully!');
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('Failed to create template. Please try again.');
    }
  };

  const handleEditTemplate = async () => {
    if (!editingTemplate || !formData.name.trim() || !formData.prompt.trim()) {
      alert('Please fill in name and prompt');
      return;
    }

    try {
      const templateData = {
        ...formData,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
      };
      
      // In a real app, you would call updateTemplate API
      console.log('Updating template:', editingTemplate.id, templateData);
      
      // Update local state
      setTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, ...templateData, updatedAt: new Date().toISOString() }
          : t
      ));
      
      setEditingTemplate(null);
      resetForm();
      alert('Template updated successfully!');
    } catch (error) {
      console.error('Failed to update template:', error);
      alert('Failed to update template. Please try again.');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      // In a real app, you would call deleteTemplate API
      console.log('Deleting template:', id);
      
      setTemplates(prev => prev.filter(t => t.id !== id));
      alert('Template deleted successfully!');
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template. Please try again.');
    }
  };

  const handleUseTemplate = (template: Template) => {
    // Navigate to AI generation page with template data
    const params = new URLSearchParams({
      template: template.id,
      prompt: template.prompt,
      contentType: template.contentType,
      tone: template.tone,
      length: template.length,
      keywords: template.keywords.join(','),
      targetAudience: template.targetAudience,
    });
    
    router.push(`/ai-generate?${params.toString()}`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      prompt: '',
      contentType: 'BLOG',
      tone: 'professional',
      length: 'medium',
      keywords: '',
      targetAudience: '',
    });
  };

  const openEditModal = (template: Template) => {
    setFormData({
      name: template.name,
      description: template.description,
      prompt: template.prompt,
      contentType: template.contentType,
      tone: template.tone,
      length: template.length,
      keywords: template.keywords.join(', '),
      targetAudience: template.targetAudience,
    });
    setEditingTemplate(template);
  };

  if (loading) {
    return (
      <ContentManager fallback={
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600">You don't have permission to manage templates.</p>
            </div>
          </div>
        </AppShell>
      }>
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading templates...</p>
            </div>
          </div>
        </AppShell>
      </ContentManager>
    );
  }

  return (
    <ContentManager fallback={
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to manage templates.</p>
          </div>
        </div>
      </AppShell>
    }>
      <AppShell>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Prompt Templates</h1>
              <p className="text-gray-600 mt-2">
                Manage your AI content generation templates
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Template
            </button>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="card">
                <div className="card-header">
                  <h3 className="card-title">{template.name}</h3>
                  <p className="card-description">{template.description}</p>
                </div>
                <div className="card-content">
                  <div className="space-y-2 text-sm text-gray-600">
                    <div><strong>Type:</strong> {template.contentType}</div>
                    <div><strong>Tone:</strong> {template.tone}</div>
                    <div><strong>Length:</strong> {template.length}</div>
                    {template.keywords.length > 0 && (
                      <div><strong>Keywords:</strong> {template.keywords.join(', ')}</div>
                    )}
                    {template.targetAudience && (
                      <div><strong>Audience:</strong> {template.targetAudience}</div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-3">
                      <div>Created: {new Date(template.createdAt).toLocaleDateString()}</div>
                      <div>Updated: {new Date(template.updatedAt).toLocaleDateString()}</div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="btn-primary btn-sm flex-1"
                      >
                        Use Template
                      </button>
                      <button
                        onClick={() => openEditModal(template)}
                        className="btn-outline btn-sm"
                      >
                        Edit
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
              </div>
            ))}
          </div>

          {/* Empty State */}
          {templates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first template to get started with AI content generation.
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

        {/* Create/Edit Template Modal */}
        {(showCreateModal || editingTemplate) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
              {/* Header */}
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

              {/* Content */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input w-full"
                    placeholder="Enter template name..."
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input w-full h-20 resize-none"
                    placeholder="Describe what this template is for..."
                  />
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt Template *
                  </label>
                  <textarea
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    className="input w-full h-32 resize-none"
                    placeholder="Enter your prompt template. Use {variable} for dynamic content..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use variables like {`{topic}`, `{tone}`, `{keywords}`, `{audience}`} for dynamic content
                  </p>
                </div>

                {/* Content Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Content Type
                  </label>
                  <select
                    value={formData.contentType}
                    onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                    className="input w-full"
                  >
                    <option value="BLOG">Blog Post</option>
                    <option value="NEWSLETTER">Newsletter</option>
                    <option value="SOCIAL_POST">Social Media Post</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>

                {/* Tone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Tone
                  </label>
                  <select
                    value={formData.tone}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                    className="input w-full"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Friendly</option>
                    <option value="authoritative">Authoritative</option>
                    <option value="conversational">Conversational</option>
                  </select>
                </div>

                {/* Length */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Length
                  </label>
                  <select
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                    className="input w-full"
                  >
                    <option value="short">Short (100-300 words)</option>
                    <option value="medium">Medium (300-800 words)</option>
                    <option value="long">Long (800+ words)</option>
                  </select>
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    className="input w-full"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Target Audience
                  </label>
                  <input
                    type="text"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="input w-full"
                    placeholder="e.g., Marketing professionals, Small business owners"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingTemplate(null);
                      resetForm();
                    }}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingTemplate ? handleEditTemplate : handleCreateTemplate}
                    className="btn-primary"
                  >
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </ContentManager>
  );
}
