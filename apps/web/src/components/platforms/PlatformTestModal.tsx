'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface PlatformTestModalProps {
  platform: {
    id: string;
    name: string;
    type: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function PlatformTestModal({ platform, isOpen, onClose }: PlatformTestModalProps) {
  const [testType, setTestType] = useState<'ping' | 'dry-run'>('ping');
  const [testContent, setTestContent] = useState('Hello from Agent Bowery!');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runTest = async () => {
    try {
      setLoading(true);
      setResult(null);

      let testResult;
      if (testType === 'ping') {
        testResult = await apiClient.pingPlatform(platform.type.toLowerCase());
      } else {
        testResult = await apiClient.dryRunPlatform(platform.type.toLowerCase(), { text: testContent });
      }

      setResult(testResult);
    } catch (error) {
      console.error('Test failed:', error);
      setResult({ error: 'Test failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Test {platform.name} Connection
          </h2>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Type
              </label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value as 'ping' | 'dry-run')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ping">Ping Test</option>
                <option value="dry-run">Dry Run Post</option>
              </select>
            </div>

            {testType === 'dry-run' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Content
                </label>
                <textarea
                  value={testContent}
                  onChange={(e) => setTestContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter test content..."
                />
              </div>
            )}

            {result && (
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">Test Result:</h3>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex space-x-3">
          <button
            onClick={runTest}
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? 'Testing...' : 'Run Test'}
          </button>
          <button
            onClick={onClose}
            className="btn-outline flex-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
