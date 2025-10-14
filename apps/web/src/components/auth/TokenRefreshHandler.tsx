'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export default function TokenRefreshHandler() {
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [newRefreshToken, setNewRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Try to get refresh token from localStorage
    const storedRefreshToken = localStorage.getItem('refresh_token');
    if (storedRefreshToken) {
      setRefreshToken(storedRefreshToken);
    }
  }, []);

  const handleRefresh = async () => {
    if (!refreshToken) {
      setError('No refresh token available');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const result = await apiClient.refreshJwtToken(refreshToken);
      
      setNewToken(result.token);
      setNewRefreshToken(result.refreshToken);
      setSuccess(true);

      // Update stored tokens
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('refresh_token', result.refreshToken);
      
      // Update the refresh token input
      setRefreshToken(result.refreshToken);
    } catch (err: any) {
      console.error('Failed to refresh token:', err);
      setError(err.message || 'Failed to refresh token');
    } finally {
      setLoading(false);
    }
  };

  const clearTokens = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    setRefreshToken(null);
    setNewToken(null);
    setNewRefreshToken(null);
    setSuccess(false);
    setError(null);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Token Refresh Handler</h3>
        <p className="card-description">Refresh JWT tokens to maintain authentication</p>
      </div>
      <div className="card-content">
        <div className="space-y-4">
          {/* Refresh Token Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refresh Token
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={refreshToken || ''}
                onChange={(e) => setRefreshToken(e.target.value)}
                placeholder="Enter refresh token..."
                className="input flex-1 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(refreshToken || '')}
                className="btn-secondary"
                disabled={!refreshToken}
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {refreshToken ? 'Refresh token loaded from storage' : 'No refresh token found in storage'}
            </p>
          </div>

          {/* Refresh Button */}
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Refresh Access Token</h4>
              <p className="text-sm text-gray-600">Generate new access token using refresh token</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                disabled={loading || !refreshToken}
                className="btn-primary"
              >
                {loading ? 'Refreshing...' : 'Refresh Token'}
              </button>
              <button
                onClick={clearTokens}
                className="btn-secondary"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Success Display */}
          {success && (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 text-lg">✅</span>
                  <span className="text-sm text-green-800">Token refreshed successfully!</span>
                </div>
              </div>

              {newToken && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Access Token
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newToken}
                      readOnly
                      className="input flex-1 font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(newToken)}
                      className="btn-secondary"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {newRefreshToken && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Refresh Token
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newRefreshToken}
                      readOnly
                      className="input flex-1 font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(newRefreshToken)}
                      className="btn-secondary"
                    >
                      Copy
                    </button>
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">Token Refresh Information</h4>
            <div className="space-y-2 text-sm text-yellow-800">
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600 text-lg">🔄</span>
                <div>
                  <p className="font-medium">Automatic Refresh</p>
                  <p>Tokens are automatically refreshed when they expire during API calls.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600 text-lg">💾</span>
                <div>
                  <p className="font-medium">Storage</p>
                  <p>New tokens are automatically saved to localStorage for future use.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600 text-lg">🔒</span>
                <div>
                  <p className="font-medium">Security</p>
                  <p>Refresh tokens should be kept secure and not shared publicly.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
