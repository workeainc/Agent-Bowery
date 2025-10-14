'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import AppShell from '@/components/layout/AppShell';
import { apiClient } from '@/lib/api-client';
import { ContentManager } from '@/components/auth/RoleGuard';

interface BrandRule {
  id: string;
  name: string;
  description: string;
  type: 'forbidden_words' | 'required_words' | 'tone_check' | 'length_check' | 'format_check';
  value: string;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
}

interface ValidationResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export default function BrandRulesPage() {
  const { data: session } = useSession();
  const [brandRules, setBrandRules] = useState<BrandRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<BrandRule | null>(null);
  const [testContent, setTestContent] = useState('');
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'forbidden_words' as BrandRule['type'],
    value: '',
    severity: 'error' as BrandRule['severity'],
    enabled: true,
  });

  useEffect(() => {
    fetchBrandRules();
  }, []);

  const fetchBrandRules = async () => {
    try {
      setLoading(true);
      const result = await apiClient.getBrandRules();
      setBrandRules(result?.rules || []);
    } catch (error) {
      console.error('Failed to fetch brand rules:', error);
      // Mock brand rules for demo
      setBrandRules([
        {
          id: '1',
          name: 'No Profanity',
          description: 'Content must not contain profanity or inappropriate language',
          type: 'forbidden_words',
          value: 'damn,hell,crap',
          severity: 'error',
          enabled: true,
        },
        {
          id: '2',
          name: 'Professional Tone',
          description: 'Content should maintain a professional tone',
          type: 'tone_check',
          value: 'professional',
          severity: 'warning',
          enabled: true,
        },
        {
          id: '3',
          name: 'Minimum Length',
          description: 'Blog posts must be at least 200 words',
          type: 'length_check',
          value: '200',
          severity: 'warning',
          enabled: true,
        },
        {
          id: '4',
          name: 'Brand Keywords',
          description: 'Content should include brand keywords',
          type: 'required_words',
          value: 'Agent Bowery,AI,content',
          severity: 'info',
          enabled: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!formData.name.trim() || !formData.value.trim()) {
      alert('Please fill in name and value');
      return;
    }

    try {
      const ruleData = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await apiClient.updateBrandRules({ rules: [...brandRules, ruleData] });
      await fetchBrandRules();
      setShowCreateModal(false);
      resetForm();
      alert('Brand rule created successfully!');
    } catch (error) {
      console.error('Failed to create brand rule:', error);
      alert('Failed to create brand rule. Please try again.');
    }
  };

  const handleEditRule = async () => {
    if (!editingRule || !formData.name.trim() || !formData.value.trim()) {
      alert('Please fill in name and value');
      return;
    }

    try {
      const updatedRules = brandRules.map(rule => 
        rule.id === editingRule.id 
          ? { ...rule, ...formData, updatedAt: new Date().toISOString() }
          : rule
      );
      
      await apiClient.updateBrandRules({ rules: updatedRules });
      await fetchBrandRules();
      setEditingRule(null);
      resetForm();
      alert('Brand rule updated successfully!');
    } catch (error) {
      console.error('Failed to update brand rule:', error);
      alert('Failed to update brand rule. Please try again.');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand rule?')) {
      return;
    }

    try {
      const updatedRules = brandRules.filter(rule => rule.id !== id);
      await apiClient.updateBrandRules({ rules: updatedRules });
      await fetchBrandRules();
      alert('Brand rule deleted successfully!');
    } catch (error) {
      console.error('Failed to delete brand rule:', error);
      alert('Failed to delete brand rule. Please try again.');
    }
  };

  const handleToggleRule = async (id: string) => {
    try {
      const updatedRules = brandRules.map(rule => 
        rule.id === id 
          ? { ...rule, enabled: !rule.enabled, updatedAt: new Date().toISOString() }
          : rule
      );
      
      await apiClient.updateBrandRules({ rules: updatedRules });
      await fetchBrandRules();
    } catch (error) {
      console.error('Failed to toggle brand rule:', error);
      alert('Failed to update brand rule. Please try again.');
    }
  };

  const validateContent = () => {
    if (!testContent.trim()) {
      alert('Please enter content to validate');
      return;
    }

    const results: ValidationResult[] = [];
    const content = testContent.toLowerCase();

    brandRules.forEach(rule => {
      if (!rule.enabled) return;

      let passed = false;
      let message = '';

      switch (rule.type) {
        case 'forbidden_words':
          const forbiddenWords = rule.value.split(',').map(w => w.trim().toLowerCase());
          const foundWords = forbiddenWords.filter(word => content.includes(word));
          passed = foundWords.length === 0;
          message = passed 
            ? 'No forbidden words found'
            : `Found forbidden words: ${foundWords.join(', ')}`;
          break;

        case 'required_words':
          const requiredWords = rule.value.split(',').map(w => w.trim().toLowerCase());
          const missingWords = requiredWords.filter(word => !content.includes(word));
          passed = missingWords.length === 0;
          message = passed 
            ? 'All required words found'
            : `Missing required words: ${missingWords.join(', ')}`;
          break;

        case 'tone_check':
          // Simple tone check based on keywords
          const toneKeywords = {
            professional: ['professional', 'business', 'corporate', 'formal'],
            casual: ['casual', 'friendly', 'relaxed', 'informal'],
            friendly: ['friendly', 'warm', 'welcoming', 'approachable'],
          };
          const expectedTone = rule.value.toLowerCase();
          const keywords = toneKeywords[expectedTone as keyof typeof toneKeywords] || [];
          const foundToneWords = keywords.filter(word => content.includes(word));
          passed = foundToneWords.length > 0;
          message = passed 
            ? `Content matches ${expectedTone} tone`
            : `Content doesn't match ${expectedTone} tone`;
          break;

        case 'length_check':
          const wordCount = testContent.split(/\s+/).length;
          const minLength = parseInt(rule.value);
          passed = wordCount >= minLength;
          message = passed 
            ? `Content length (${wordCount} words) meets requirement (${minLength}+ words)`
            : `Content length (${wordCount} words) is below requirement (${minLength}+ words)`;
          break;

        case 'format_check':
          // Simple format check for basic structure
          const hasTitle = testContent.includes('#') || testContent.split('\n')[0].length > 0;
          const hasParagraphs = testContent.split('\n\n').length > 1;
          passed = hasTitle && hasParagraphs;
          message = passed 
            ? 'Content has proper format (title and paragraphs)'
            : 'Content lacks proper format (missing title or paragraphs)';
          break;
      }

      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        passed,
        message,
        severity: rule.severity,
      });
    });

    setValidationResults(results);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'forbidden_words',
      value: '',
      severity: 'error',
      enabled: true,
    });
  };

  const openEditModal = (rule: BrandRule) => {
    setFormData({
      name: rule.name,
      description: rule.description,
      type: rule.type,
      value: rule.value,
      severity: rule.severity,
      enabled: rule.enabled,
    });
    setEditingRule(rule);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'forbidden_words':
        return 'Forbidden Words';
      case 'required_words':
        return 'Required Words';
      case 'tone_check':
        return 'Tone Check';
      case 'length_check':
        return 'Length Check';
      case 'format_check':
        return 'Format Check';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <ContentManager fallback={
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600">You don't have permission to manage brand rules.</p>
            </div>
          </div>
        </AppShell>
      }>
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading brand rules...</p>
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
            <p className="text-gray-600">You don't have permission to manage brand rules.</p>
          </div>
        </div>
      </AppShell>
    }>
      <AppShell>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Brand Rules</h1>
              <p className="text-gray-600 mt-2">
                Manage content validation rules to ensure brand compliance
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Rule
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Brand Rules List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Brand Rules ({brandRules.length})</h2>
              
              {brandRules.map((rule) => (
                <div key={rule.id} className="card">
                  <div className="card-content">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-gray-900">{rule.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(rule.severity)}`}>
                            {rule.severity}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {rule.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                        <div className="text-xs text-gray-500">
                          <div><strong>Type:</strong> {getTypeLabel(rule.type)}</div>
                          <div><strong>Value:</strong> {rule.value}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleToggleRule(rule.id)}
                          className={`btn-outline btn-sm ${
                            rule.enabled ? 'text-yellow-600' : 'text-green-600'
                          }`}
                        >
                          {rule.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => openEditModal(rule)}
                          className="btn-outline btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="btn-outline btn-sm text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {brandRules.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">🛡️</div>
                  <p className="text-gray-500">No brand rules created yet</p>
                </div>
              )}
            </div>

            {/* Content Validation */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Content Validation</h2>
              
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Test Content</h3>
                  <p className="card-description">
                    Enter content to validate against brand rules
                  </p>
                </div>
                <div className="card-content">
                  <textarea
                    value={testContent}
                    onChange={(e) => setTestContent(e.target.value)}
                    className="input w-full h-32 resize-none"
                    placeholder="Enter content to validate..."
                  />
                  <button
                    onClick={validateContent}
                    className="btn-primary mt-3"
                    disabled={!testContent.trim()}
                  >
                    Validate Content
                  </button>
                </div>
              </div>

              {/* Validation Results */}
              {validationResults.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Validation Results</h3>
                    <p className="card-description">
                      Results of brand rule validation
                    </p>
                  </div>
                  <div className="card-content">
                    <div className="space-y-3">
                      {validationResults.map((result, index) => (
                        <div key={index} className={`p-3 rounded-lg border ${
                          result.passed 
                            ? 'bg-green-50 border-green-200' 
                            : result.severity === 'error'
                            ? 'bg-red-50 border-red-200'
                            : result.severity === 'warning'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(result.severity)}`}>
                              {result.severity}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {result.passed ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-900">{result.ruleName}</div>
                          <div className="text-sm text-gray-600">{result.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create/Edit Rule Modal */}
        {(showCreateModal || editingRule) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingRule ? 'Edit Brand Rule' : 'Create Brand Rule'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingRule(null);
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

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input w-full h-20 resize-none"
                    placeholder="Describe what this rule checks..."
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as BrandRule['type'] })}
                    className="input w-full"
                  >
                    <option value="forbidden_words">Forbidden Words</option>
                    <option value="required_words">Required Words</option>
                    <option value="tone_check">Tone Check</option>
                    <option value="length_check">Length Check</option>
                    <option value="format_check">Format Check</option>
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Value *
                  </label>
                  <input
                    type="text"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="input w-full"
                    placeholder="Enter rule value (words, numbers, etc.)..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    For words: comma-separated list. For numbers: minimum value.
                  </p>
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as BrandRule['severity'] })}
                    className="input w-full"
                  >
                    <option value="error">Error (Block content)</option>
                    <option value="warning">Warning (Flag content)</option>
                    <option value="info">Info (Suggest improvement)</option>
                  </select>
                </div>

                {/* Enabled */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                    Enable this rule
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingRule(null);
                      resetForm();
                    }}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingRule ? handleEditRule : handleCreateRule}
                    className="btn-primary"
                  >
                    {editingRule ? 'Update Rule' : 'Create Rule'}
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
