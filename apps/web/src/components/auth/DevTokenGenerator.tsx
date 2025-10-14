'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function DevTokenGenerator() {
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateToken = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getDevToken();
      setToken(result.token);
      setExpiresAt(result.expiresAt);
    } catch (err: any) {
      console.error('Failed to generate dev token:', err);
      setError(err.message || 'Failed to generate dev token');
    } finally {
      setLoading(false);
    }
  };

  const copyToken = async () => {
    if (token) {
      try {
        await navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy token:', err);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Development Token Generator</h3>
        <p className="card-description">Generate temporary tokens for development and testing</p>
      </div>
      <div className="card-content">
        <div className="space-y-4">
          {/* Generate Button */}
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Generate New Token</h4>
              <p className="text-sm text-gray-600">Create a temporary token for API testing</p>
            </div>
            <button
              onClick={generateToken}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Generating...' : 'Generate Token'}
            </button>
          </div>

          {/* Token Display */}
          {token && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Development Token
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={token}
                    readOnly
                    className="input flex-1 font-mono text-sm"
                  />
                  <button
                    onClick={copyToken}
                    className={`btn-secondary ${copied ? 'bg-green-100 text-green-800' : ''}`}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {expiresAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires At
                  </label>
                  <div className="text-sm text-gray-900">
                    {formatDate(expiresAt)}
                  </div>
                </div>
              )}
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

          {/* Help Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">How to Use Dev Tokens</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-lg">🔑</span>
                <div>
                  <p className="font-medium">API Authentication</p>
                  <p>Use this token in the Authorization header: <code className="bg-blue-100 px-1 rounded">Bearer YOUR_TOKEN</code></p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-lg">⏰</span>
                <div>
                  <p className="font-medium">Temporary Access</p>
                  <p>Dev tokens expire automatically for security. Generate new ones as needed.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-lg">🧪</span>
                <div>
                  <p className="font-medium">Testing Only</p>
                  <p>These tokens are for development and testing purposes only.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
