'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface PlatformAccountManagementProps {
  platformId?: string;
  onAccountUpdate?: (accounts: any) => void;
}

export default function PlatformAccountManagement({ platformId, onAccountUpdate }: PlatformAccountManagementProps) {
  const [accounts, setAccounts] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatformId, setSelectedPlatformId] = useState(platformId || '');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectForm, setConnectForm] = useState({
    accountType: '',
    credentials: {} as Record<string, any>,
    metadata: {} as Record<string, any>,
  });

  const loadAccounts = async () => {
    if (!selectedPlatformId.trim()) {
      setError('Platform ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getPlatformAccounts(selectedPlatformId);
      setAccounts(result);

      if (onAccountUpdate) {
        onAccountUpdate(result);
      }
    } catch (err: any) {
      console.error('Failed to load platform accounts:', err);
      setError(err.message || 'Failed to load platform accounts');
    } finally {
      setLoading(false);
    }
  };

  const connectAccount = async () => {
    if (!selectedPlatformId.trim()) {
      setError('Platform ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.connectPlatformAccount(selectedPlatformId, connectForm);
      
      if (result.success) {
        await loadAccounts(); // Reload accounts
        setShowConnectModal(false);
        setConnectForm({
          accountType: '',
          credentials: {},
          metadata: {},
        });
      }
    } catch (err: any) {
      console.error('Failed to connect account:', err);
      setError(err.message || 'Failed to connect account');
    } finally {
      setLoading(false);
    }
  };

  const disconnectAccount = async (accountId: string) => {
    if (!selectedPlatformId.trim()) {
      setError('Platform ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.disconnectPlatformAccount(selectedPlatformId, accountId);
      
      if (result.success) {
        await loadAccounts(); // Reload accounts
      }
    } catch (err: any) {
      console.error('Failed to disconnect account:', err);
      setError(err.message || 'Failed to disconnect account');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'disconnected': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return '✅';
      case 'disconnected': return '❌';
      case 'error': return '⚠️';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  useEffect(() => {
    if (platformId) {
      setSelectedPlatformId(platformId);
      loadAccounts();
    }
  }, [platformId]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Platform Account Management</h3>
        <p className="text-sm text-gray-600">Manage platform-specific accounts and connections</p>
      </div>

      {/* Platform ID Input */}
      <div className="card">
        <div className="card-content">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform ID
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={selectedPlatformId}
                  onChange={(e) => setSelectedPlatformId(e.target.value)}
                  className="input flex-1"
                  placeholder="Enter platform ID..."
                />
                <button
                  onClick={loadAccounts}
                  disabled={loading || !selectedPlatformId.trim()}
                  className="btn-primary"
                >
                  {loading ? 'Loading...' : 'Load Accounts'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Results */}
      {accounts && (
        <div className="space-y-6">
          {/* Accounts List */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Connected Accounts</h4>
              <button
                onClick={() => setShowConnectModal(true)}
                className="btn-primary"
              >
                Connect New Account
              </button>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                {accounts.accounts.map((account: any, index: number) => (
                  <div key={account.accountId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getStatusIcon(account.status)}</span>
                        <div>
                          <h5 className="font-medium text-gray-900">{account.accountName}</h5>
                          <p className="text-sm text-gray-600">Type: {account.accountType}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(account.status)}`}>
                          {account.status}
                        </span>
                        <button
                          onClick={() => disconnectAccount(account.accountId)}
                          disabled={loading}
                          className="btn-secondary text-xs text-red-600 hover:text-red-800"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Capabilities</h6>
                        <div className="space-y-1">
                          {account.capabilities.map((capability: string, capIndex: number) => (
                            <div key={capIndex} className="text-sm text-gray-600 flex items-center space-x-2">
                              <span className="text-green-600">✅</span>
                              <span>{capability}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Limitations</h6>
                        <div className="space-y-1">
                          {account.limitations.map((limitation: string, limIndex: number) => (
                            <div key={limIndex} className="text-sm text-gray-600 flex items-center space-x-2">
                              <span className="text-red-600">❌</span>
                              <span>{limitation}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {account.lastSync && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          Last sync: {formatDate(account.lastSync)}
                        </div>
                      </div>
                    )}

                    {account.errorMessage && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          Error: {account.errorMessage}
                        </div>
                      </div>
                    )}

                    {Object.keys(account.metadata).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Metadata</h6>
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <pre className="text-xs">{JSON.stringify(account.metadata, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {accounts.accounts.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">🔗</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Accounts Connected</h3>
                    <p className="text-gray-600">Connect your first platform account to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Platform Info */}
          <div className="text-sm text-gray-500 text-center">
            Platform ID: {accounts.platformId}
          </div>
        </div>
      )}

      {/* Connect Account Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Connect Platform Account</h2>
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type
                  </label>
                  <input
                    type="text"
                    value={connectForm.accountType}
                    onChange={(e) => setConnectForm({ ...connectForm, accountType: e.target.value })}
                    className="input w-full"
                    placeholder="e.g., personal, business, page"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credentials (JSON)
                  </label>
                  <textarea
                    value={JSON.stringify(connectForm.credentials, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setConnectForm({ ...connectForm, credentials: parsed });
                      } catch {
                        // Invalid JSON, keep the text for user to fix
                      }
                    }}
                    className="input w-full h-32 resize-none font-mono text-sm"
                    placeholder='{"apiKey": "your-api-key", "secret": "your-secret"}'
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter valid JSON for account credentials
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metadata (JSON, Optional)
                  </label>
                  <textarea
                    value={JSON.stringify(connectForm.metadata, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setConnectForm({ ...connectForm, metadata: parsed });
                      } catch {
                        // Invalid JSON, keep the text for user to fix
                      }
                    }}
                    className="input w-full h-24 resize-none font-mono text-sm"
                    placeholder='{"description": "My business account", "category": "business"}'
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter valid JSON for additional metadata
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowConnectModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={connectAccount}
                disabled={loading || !connectForm.accountType.trim()}
                className="btn-primary"
              >
                {loading ? 'Connecting...' : 'Connect Account'}
              </button>
            </div>
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

      {/* Help Information */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">Platform Account Management</h4>
        <div className="space-y-2 text-sm text-green-800">
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">🔗</span>
            <div>
              <p className="font-medium">Account Connections</p>
              <p>Connect and manage multiple accounts for each platform with different capabilities.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">⚙️</span>
            <div>
              <p className="font-medium">Account Configuration</p>
              <p>Configure account-specific settings, credentials, and metadata for each connection.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">📊</span>
            <div>
              <p className="font-medium">Capability Tracking</p>
              <p>Track what each account can do and its limitations for better content planning.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-600 text-lg">🔄</span>
            <div>
              <p className="font-medium">Status Monitoring</p>
              <p>Monitor connection status, sync times, and error messages for each account.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
