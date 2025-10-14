'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface TemplateVariableProcessorProps {
  templateId: string;
  onVariablesExtracted?: (variables: any[]) => void;
  onContentProcessed?: (processedContent: string) => void;
}

interface ExtractedVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  defaultValue?: any;
  description?: string;
  required: boolean;
}

interface ProcessingResult {
  success: boolean;
  processedContent: string;
  extractedVariables: ExtractedVariable[];
  validationErrors: Array<{
    variable: string;
    error: string;
    line?: number;
  }>;
}

export default function TemplateVariableProcessor({ 
  templateId, 
  onVariablesExtracted, 
  onContentProcessed 
}: TemplateVariableProcessorProps) {
  const [content, setContent] = useState('');
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processContent = async () => {
    if (!content.trim()) {
      setError('Please enter some content to process');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.processTemplateVariables(templateId, content);
      setProcessingResult(result);
      
      if (onVariablesExtracted) {
        onVariablesExtracted(result.extractedVariables);
      }
      
      if (onContentProcessed) {
        onContentProcessed(result.processedContent);
      }
    } catch (err: any) {
      console.error('Failed to process template variables:', err);
      setError(err.message || 'Failed to process template variables');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'string': return '📝';
      case 'number': return '🔢';
      case 'date': return '📅';
      case 'boolean': return '✅';
      case 'array': return '📋';
      case 'object': return '📦';
      default: return '❓';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string': return 'bg-blue-100 text-blue-800';
      case 'number': return 'bg-green-100 text-green-800';
      case 'date': return 'bg-purple-100 text-purple-800';
      case 'boolean': return 'bg-yellow-100 text-yellow-800';
      case 'array': return 'bg-indigo-100 text-indigo-800';
      case 'object': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Template Variable Processor</h3>
          <p className="text-sm text-gray-600">
            Extract and process variables from template content
          </p>
        </div>
        <button
          onClick={processContent}
          disabled={loading || !content.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : 'Process Variables'}
        </button>
      </div>

      {/* Content Input */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Template Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter your template content with variables like {`{{variableName}}`} or {`{{user.name}}`}..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          rows={8}
        />
        <p className="mt-2 text-xs text-gray-500">
          Use double curly braces for variables: {`{{variableName}}`} or {`{{user.name}}`}
        </p>
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
              <h3 className="text-sm font-medium text-red-800">Processing Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Results */}
      {processingResult && (
        <div className="space-y-4">
          {/* Extracted Variables */}
          {processingResult.extractedVariables.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Extracted Variables ({processingResult.extractedVariables.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {processingResult.extractedVariables.map((variable, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{variable.name}</h5>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getTypeIcon(variable.type)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(variable.type)}`}>
                          {variable.type}
                        </span>
                      </div>
                    </div>
                    
                    {variable.description && (
                      <p className="text-sm text-gray-600 mb-2">{variable.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className={variable.required ? 'text-red-600 font-medium' : 'text-gray-500'}>
                        {variable.required ? 'Required' : 'Optional'}
                      </span>
                      {variable.defaultValue !== undefined && (
                        <span>Default: {String(variable.defaultValue)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {processingResult.validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-red-900 mb-4">
                Validation Errors ({processingResult.validationErrors.length})
              </h4>
              <div className="space-y-2">
                {processingResult.validationErrors.map((error, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">
                        <span className="font-medium">{error.variable}:</span> {error.error}
                      </p>
                      {error.line && (
                        <p className="text-xs text-red-600 mt-1">Line {error.line}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processed Content */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Processed Content</h4>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(processingResult.processedContent);
                  alert('Processed content copied to clipboard!');
                }}
                className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
              >
                Copy
              </button>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {processingResult.processedContent}
              </pre>
            </div>
          </div>

          {/* Success Message */}
          {processingResult.success && processingResult.validationErrors.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-lg font-medium text-green-900">Processing Successful</h4>
                  <p className="text-green-700 mt-1">
                    Content processed successfully with {processingResult.extractedVariables.length} variables extracted.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}