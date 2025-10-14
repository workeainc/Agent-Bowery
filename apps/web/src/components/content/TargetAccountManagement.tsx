'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface TargetAccount {
  id: string;
  platform: string;
  accountId: string;
  accountName: string;
  accountType: string;
  createdAt: string;
  updatedAt: string;
}

export default function TargetAccountManagement() {
  const [accounts, setAccounts] = useState<TargetAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TargetAccount | null>(null);
  const [formData, setFormData] = useState({
    platform: '',
    accountId: '',
    accountName: '',
    accountType: '',
  });

  const platforms = ['FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'TWITTER', 'YOUTUBE'];
  const accountTypes = ['PAGE', 'PROFILE', 'GROUP', 'BUSINESS'];

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      const accountsData = await apiClient.getTargetAccounts();
      setAccounts(accountsData);
    } catch (err: any) {
      console.error('Failed to load target accounts:', err);
      setError(err.message || 'Failed to load target accounts');
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async () => {
    try {
      setLoading(true);
      setError(null);

      const newAccount = await apiClient.createTargetAccount(formData);
      setAccounts(prev => [...prev, newAccount]);
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      console.error('Failed to create target account:', err);
      setError(err.message || 'Failed to create target account');
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async () => {
    if (!editingAccount) return;

    try {
      setLoading(true);
      setError(null);

      const updatedAccount = await apiClient.updateTargetAccount(editingAccount.id, formData);
      setAccounts(prev => prev.map(acc => acc.id === editingAccount.id ? updatedAccount : acc));
      setEditingAccount(null);
      resetForm();
    } catch (err: any) {
      console.error('Failed to update target account:', err);
      setError(err.message || 'Failed to update target account');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      platform: '',
      accountId: '',
      accountName: '',
      accountType: '',
    });
  };

  const handleEdit = (account: TargetAccount) => {
    setEditingAccount(account);
    setFormData({
      platform: account.platform,
      accountId: account.accountId,
      accountName: account.accountName,
      accountType: account.accountType,
    });
  };

  const handleCancel = () => {
    setShowCreateModal(false);
    setEditingAccount(null);
    resetForm();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'FACEBOOK':
        return '📘';
      case 'INSTAGRAM':
        return '📷';
      case 'LINKEDIN':
        return '💼';
      case 'TWITTER':
        return '🐦';
      case 'YOUTUBE':
        return '📺';
      default:
        return '📱';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Target Account Management</h3>
          <p className="text-sm text-gray-600">Manage target accounts for content publishing</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Add Target Account
        </button>
      </div>

      {/* Accounts List */}
      {accounts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Target Accounts</h3>
          <p className="text-gray-600">Add your first target account to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div key={account.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getPlatformIcon(account.platform)}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{account.accountName}</h4>
                    <p className="text-sm text-gray-600">{account.platform}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(account)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Account ID</label>
                  <div className="text-sm text-gray-900 font-mono">{account.accountId}</div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">Account Type</label>
                  <div className="text-sm text-gray-900">{account.accountType}</div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">Created</label>
                  <div className="text-xs text-gray-600">{formatDate(account.createdAt)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingAccount) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingAccount ? 'Edit Target Account' : 'Add Target Account'}
                </h2>
                <button
                  onClick={handleCancel}
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
                    Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="input w-full"
                  >
                    <option value="">Select Platform</option>
                    {platforms.map(platform => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account ID
                  </label>
                  <input
                    type="text"
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    className="input w-full"
                    placeholder="Enter account ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    className="input w-full"
                    placeholder="Enter account name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type
                  </label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                    className="input w-full"
                  >
                    <option value="">Select Account Type</option>
                    {accountTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={editingAccount ? updateAccount : createAccount}
                disabled={loading || !formData.platform || !formData.accountId || !formData.accountName}
                className="btn-primary"
              >
                {loading ? 'Saving...' : (editingAccount ? 'Update' : 'Create')}
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
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-medium text-purple-900 mb-2">Target Account Management</h4>
        <div className="space-y-2 text-sm text-purple-800">
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">🎯</span>
            <div>
              <p className="font-medium">Target Accounts</p>
              <p>Define specific accounts where content will be published on each platform.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">📱</span>
            <div>
              <p className="font-medium">Platform Support</p>
              <p>Supports Facebook, Instagram, LinkedIn, Twitter, and YouTube accounts.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">⚙️</span>
            <div>
              <p className="font-medium">Account Types</p>
              <p>Different account types (Page, Profile, Group, Business) for various publishing needs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
