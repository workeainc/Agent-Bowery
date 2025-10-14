'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface TemplatePreviewProps {
  templateId: string;
  onPreviewGenerated?: (preview: string) => void;
}

interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  defaultValue?: any;
  description?: string;
  required: boolean;
  examples?: string[];
}

interface PreviewResult {
  success: boolean;
  preview: string;
  variables: Record<string, any>;
  templateId: string;
  metadata: {
    wordCount: number;
    characterCount: number;
    estimatedReadTime: number;
  };
}

export default function TemplatePreview({ templateId, onPreviewGenerated }: TemplatePreviewProps) {
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [templateVariables, setTemplateVariables] = useState<TemplateVariable[]>([]);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateInfo, setTemplateInfo] = useState<any>(null);

  // Load template variables on component mount
  useEffect(() => {
    loadTemplateVariables();
  }, [templateId]);

  const loadTemplateVariables = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getTemplateVariables(templateId);
      if (result.success) {
        setTemplateVariables(result.variables);
        setTemplateInfo(result.templateInfo);
        
        // Initialize variables with default values
        const initialVariables: Record<string, any> = {};
        result.variables.forEach(variable => {
          if (variable.defaultValue !== undefined) {
            initialVariables[variable.name] = variable.defaultValue;
          } else {
            // Set default values based on type
            switch (variable.type) {
              case 'string':
                initialVariables[variable.name] = '';
                break;
              case 'number':
                initialVariables[variable.name] = 0;
                break;
              case 'date':
                initialVariables[variable.name] = new Date().toISOString().split('T')[0];
                break;
              case 'boolean':
                initialVariables[variable.name] = false;
                break;
              case 'array':
                initialVariables[variable.name] = [];
                break;
              case 'object':
                initialVariables[variable.name] = {};
                break;
            }
          }
        });
        setVariables(initialVariables);
      }
    } catch (err: any) {
      console.error('Failed to load template variables:', err);
      setError(err.message || 'Failed to load template variables');
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.previewTemplate(templateId, variables);
      setPreviewResult(result);
      
      if (onPreviewGenerated) {
        onPreviewGenerated(result.preview);
      }
    } catch (err: any) {
      console.error('Failed to generate preview:', err);
      setError(err.message || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const updateVariable = (name: string, value: any) => {
    setVariables(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getInputType = (type: string) => {
    switch (type) {
      case 'number':
        return 'number';
      case 'date':
        return 'date';
      case 'boolean':
        return 'checkbox';
      default:
        return 'text';
    }
  };

  const formatReadTime = (minutes: number) => {
    if (minutes < 1) {
      return '< 1 min';
    }
    return `${Math.round(minutes)} min read`;
  };

  if (loading && !previewResult) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading template...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Template Info */}
      {templateInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900">{templateInfo.name}</h3>
          <p className="text-blue-700 mt-1">{templateInfo.description}</p>
          <div className="mt-2 text-sm text-blue-600">
            <span className="font-medium">Category:</span> {templateInfo.category}
          </div>
        </div>
      )}

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

      {/* Variables Input */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Template Variables</h3>
          <button
            onClick={generatePreview}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating...' : 'Generate Preview'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templateVariables.map((variable) => (
            <div key={variable.name} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {variable.name}
                {variable.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {variable.type === 'boolean' ? (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={variables[variable.name] || false}
                    onChange={(e) => updateVariable(variable.name, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    {variables[variable.name] ? 'Yes' : 'No'}
                  </span>
                </div>
              ) : variable.type === 'array' ? (
                <div className="space-y-2">
                  <textarea
                    value={Array.isArray(variables[variable.name]) ? variables[variable.name].join('\n') : ''}
                    onChange={(e) => updateVariable(variable.name, e.target.value.split('\n').filter(item => item.trim()))}
                    placeholder="Enter items, one per line"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">Enter items, one per line</p>
                </div>
              ) : variable.type === 'object' ? (
                <div className="space-y-2">
                  <textarea
                    value={typeof variables[variable.name] === 'object' ? JSON.stringify(variables[variable.name], null, 2) : '{}'}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        updateVariable(variable.name, parsed);
                      } catch {
                        // Invalid JSON, keep the text for editing
                      }
                    }}
                    placeholder="Enter JSON object"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500">Enter valid JSON object</p>
                </div>
              ) : (
                <input
                  type={getInputType(variable.type)}
                  value={variables[variable.name] || ''}
                  onChange={(e) => {
                    const value = variable.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
                    updateVariable(variable.name, value);
                  }}
                  placeholder={variable.examples?.[0] || `Enter ${variable.type}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              )}
              
              {variable.description && (
                <p className="text-xs text-gray-500">{variable.description}</p>
              )}
              
              {variable.examples && variable.examples.length > 0 && (
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Examples:</span> {variable.examples.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preview Result */}
      {previewResult && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Preview Result</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{previewResult.metadata.wordCount} words</span>
              <span>{previewResult.metadata.characterCount} characters</span>
              <span>{formatReadTime(previewResult.metadata.estimatedReadTime)}</span>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                {previewResult.preview}
              </pre>
            </div>
          </div>
          
          {/* Copy to Clipboard */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                navigator.clipboard.writeText(previewResult.preview);
                alert('Preview copied to clipboard!');
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Copy Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
