'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface PlatformTestingProps {
  provider: string;
  onTestComplete?: (result: any) => void;
}

export default function PlatformTesting({ provider, onTestComplete }: PlatformTestingProps) {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [testType, setTestType] = useState<'connection' | 'ping' | 'dry-run'>('connection');
  const [testContent, setTestContent] = useState('Hello from Agent Bowery! This is a test post.');

  const runTest = async () => {
    try {
      setLoading(true);
      setError(null);
      setTestResults(null);

      let result;
      switch (testType) {
        case 'connection':
          result = await apiClient.testPlatformConnection(provider);
          break;
        case 'ping':
          result = await apiClient.pingPlatform(provider);
          break;
        case 'dry-run':
          result = await apiClient.dryRunPost(provider, { text: testContent });
          break;
        default:
          throw new Error('Invalid test type');
      }

      setTestResults(result);
      if (onTestComplete) {
        onTestComplete(result);
      }
    } catch (err: any) {
      setError(err.message || 'Test failed');
    } finally {
      setLoading(false);
    }
  };

  const getTestIcon = () => {
    if (loading) return '🔄';
    if (error) return '❌';
    if (!testResults) return '🧪';
    if (testResults.ok) return '✅';
    return '⚠️';
  };

  const getTestColor = () => {
    if (loading) return 'text-blue-600';
    if (error) return 'text-red-600';
    if (!testResults) return 'text-gray-600';
    if (testResults.ok) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getTestDescription = () => {
    switch (testType) {
      case 'connection':
        return 'Test platform connection and token validity';
      case 'ping':
        return 'Ping platform to check connectivity';
      case 'dry-run':
        return 'Test posting without actually publishing';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Platform Testing</h3>
        
        {/* Test Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Type
          </label>
          <div className="space-y-2">
            {[
              { value: 'connection', label: 'Connection Test', description: 'Test platform connection and token validity' },
              { value: 'ping', label: 'Ping Test', description: 'Ping platform to check connectivity' },
              { value: 'dry-run', label: 'Dry Run Test', description: 'Test posting without actually publishing' }
            ].map((test) => (
              <label key={test.value} className="flex items-center space-x-3 p-2 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer">
                <input
                  type="radio"
                  name="testType"
                  value={test.value}
                  checked={testType === test.value}
                  onChange={(e) => setTestType(e.target.value as any)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className="font-medium text-gray-900">{test.label}</div>
                  <div className="text-xs text-gray-600">{test.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Test Content (for dry-run) */}
        {testType === 'dry-run' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Content
            </label>
            <textarea
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              className="input w-full h-20 resize-none"
              placeholder="Enter test content..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This content will be used for the dry-run test
            </p>
          </div>
        )}

        {/* Test Button */}
        <div className="mb-4">
          <button
            onClick={runTest}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Testing...' : `Run ${testType === 'connection' ? 'Connection' : testType === 'ping' ? 'Ping' : 'Dry Run'} Test`}
          </button>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <span className={`text-lg ${getTestColor()}`}>{getTestIcon()}</span>
              <span className="font-medium text-gray-900">Test Results</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${testResults.ok ? 'text-green-600' : 'text-red-600'}`}>
                  {testResults.ok ? 'Success' : 'Failed'}
                </span>
              </div>
              
              {testResults.provider && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider:</span>
                  <span className="font-medium text-gray-900">{testResults.provider}</span>
                </div>
              )}
              
              {testResults.platform && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform:</span>
                  <span className="font-medium text-gray-900">{testResults.platform}</span>
                </div>
              )}
              
              {testResults.token_preview && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Token:</span>
                  <span className="font-medium text-gray-900">{testResults.token_preview}</span>
                </div>
              )}
              
              {testResults.dummy && (
                <div className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                  ⚠️ Using dummy token (development mode)
                </div>
              )}
              
              {testResults.dry_run && (
                <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  🔄 Dry run mode - no actual posting
                </div>
              )}
              
              {testResults.would_post && (
                <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  ✅ Would post successfully
                </div>
              )}
              
              {testResults.payload && (
                <div>
                  <span className="text-gray-600">Payload:</span>
                  <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(testResults.payload, null, 2)}
                  </pre>
                </div>
              )}
              
              {testResults.error && (
                <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                  ❌ Error: {testResults.error}
                </div>
              )}
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

        {/* Test Description */}
        <div className="text-xs text-gray-500">
          {getTestDescription()}
        </div>
      </div>
    </div>
  );
}
