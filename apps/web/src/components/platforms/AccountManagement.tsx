'use client';

import { useState, useEffect } from 'react';

interface AccountInfo {
  id: string;
  platform: string;
  name: string;
  username?: string;
  avatar?: string;
  followers: number;
  verified: boolean;
  connectedAt: Date;
  lastSync: Date;
  permissions: string[];
  settings: {
    autoPost: boolean;
    autoReply: boolean;
    syncFrequency: 'realtime' | 'hourly' | 'daily';
    notifications: boolean;
    analytics: boolean;
  };
  limits: {
    dailyPosts: number;
    monthlyPosts: number;
    usedPosts: number;
    usedMonthlyPosts: number;
  };
}

interface AccountManagementProps {
  onAccountUpdate?: (account: AccountInfo) => void;
}

export default function AccountManagement({ onAccountUpdate }: AccountManagementProps) {
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountInfo | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingSettings, setEditingSettings] = useState(false);

  // Mock data for demonstration
  const mockAccounts: AccountInfo[] = [
    {
      id: '1',
      platform: 'Facebook',
      name: 'Agent Bowery Page',
      username: '@agentbowery',
      avatar: 'https://via.placeholder.com/40',
      followers: 12500,
      verified: true,
      connectedAt: new Date('2024-01-15'),
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
      permissions: [
        'pages_manage_posts',
        'pages_read_engagement',
        'pages_manage_metadata',
        'pages_show_list',
        'publish_to_groups'
      ],
      settings: {
        autoPost: true,
        autoReply: false,
        syncFrequency: 'hourly',
        notifications: true,
        analytics: true
      },
      limits: {
        dailyPosts: 25,
        monthlyPosts: 500,
        usedPosts: 8,
        usedMonthlyPosts: 156
      }
    },
    {
      id: '2',
      platform: 'LinkedIn',
      name: 'Agent Bowery Company',
      username: '@agentbowery',
      avatar: 'https://via.placeholder.com/40',
      followers: 8900,
      verified: false,
      connectedAt: new Date('2024-01-10'),
      lastSync: new Date(Date.now() - 1 * 60 * 60 * 1000),
      permissions: [
        'w_member_social',
        'r_organization_social',
        'w_organization_social',
        'r_organization_admin'
      ],
      settings: {
        autoPost: false,
        autoReply: true,
        syncFrequency: 'daily',
        notifications: true,
        analytics: true
      },
      limits: {
        dailyPosts: 5,
        monthlyPosts: 100,
        usedPosts: 2,
        usedMonthlyPosts: 45
      }
    },
    {
      id: '3',
      platform: 'Instagram',
      name: 'Agent Bowery',
      username: '@agentbowery',
      avatar: 'https://via.placeholder.com/40',
      followers: 15600,
      verified: true,
      connectedAt: new Date('2024-01-05'),
      lastSync: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      permissions: [
        'instagram_basic',
        'instagram_content_publish',
        'instagram_manage_comments',
        'instagram_manage_insights'
      ],
      settings: {
        autoPost: true,
        autoReply: false,
        syncFrequency: 'realtime',
        notifications: false,
        analytics: true
      },
      limits: {
        dailyPosts: 10,
        monthlyPosts: 200,
        usedPosts: 0,
        usedMonthlyPosts: 0
      }
    }
  ];

  useEffect(() => {
    setAccounts(mockAccounts);
  }, []);

  const handleUpdateSettings = (accountId: string, newSettings: AccountInfo['settings']) => {
    setAccounts(prev => prev.map(account => 
      account.id === accountId 
        ? { ...account, settings: newSettings }
        : account
    ));

    const updatedAccount = accounts.find(account => account.id === accountId);
    if (updatedAccount && onAccountUpdate) {
      onAccountUpdate({ ...updatedAccount, settings: newSettings });
    }

    setShowSettingsModal(false);
    alert('Account settings updated successfully!');
  };

  const handleRefreshPermissions = async (accountId: string) => {
    // Simulate permission refresh
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      setAccounts(prev => prev.map(acc => 
        acc.id === accountId 
          ? { ...acc, lastSync: new Date() }
          : acc
      ));
      alert('Permissions refreshed successfully!');
    }
  };

  const handleSyncAccount = async (accountId: string) => {
    // Simulate account sync
    setAccounts(prev => prev.map(account => 
      account.id === accountId 
        ? { ...account, lastSync: new Date() }
        : account
    ));
    alert('Account synced successfully!');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Facebook': return '📘';
      case 'LinkedIn': return '💼';
      case 'Instagram': return '📷';
      case 'Twitter': return '🐦';
      case 'Email': return '📧';
      default: return '📱';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'Facebook': return 'text-blue-600';
      case 'LinkedIn': return 'text-blue-700';
      case 'Instagram': return 'text-pink-600';
      case 'Twitter': return 'text-blue-400';
      case 'Email': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUsagePercentage = (used: number, total: number) => {
    return total > 0 ? (used / total) * 100 : 0;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Account Management</h2>
          <p className="text-gray-600 mt-1">
            Manage connected accounts and their settings
          </p>
        </div>
        <div className="text-sm text-gray-600">
          {accounts.length} connected accounts
        </div>
      </div>

      {/* Accounts List */}
      <div className="space-y-4">
        {accounts.map((account) => (
          <div key={account.id} className="card">
            <div className="card-content">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <img
                    src={account.avatar}
                    alt={account.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900">{account.name}</h3>
                      {account.verified && (
                        <span className="text-blue-500 text-sm">✓</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className={`text-lg ${getPlatformColor(account.platform)}`}>
                        {getPlatformIcon(account.platform)}
                      </span>
                      <span className="text-sm text-gray-600">{account.platform}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-600">{account.username}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span>{account.followers.toLocaleString()} followers</span>
                      <span>•</span>
                      <span>Connected {formatDate(account.connectedAt)}</span>
                      <span>•</span>
                      <span>Last sync {formatDate(account.lastSync)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedAccount(account);
                      setShowSettingsModal(true);
                    }}
                    className="btn-outline btn-sm"
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => handleSyncAccount(account.id)}
                    className="btn-outline btn-sm"
                  >
                    Sync
                  </button>
                </div>
              </div>

              {/* Account Stats */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Post Limits */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Daily Posts</span>
                    <span className={`text-sm font-medium ${getUsageColor(getUsagePercentage(account.limits.usedPosts, account.limits.dailyPosts))}`}>
                      {account.limits.usedPosts}/{account.limits.dailyPosts}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        getUsagePercentage(account.limits.usedPosts, account.limits.dailyPosts) >= 90 ? 'bg-red-500' :
                        getUsagePercentage(account.limits.usedPosts, account.limits.dailyPosts) >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${getUsagePercentage(account.limits.usedPosts, account.limits.dailyPosts)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Monthly Posts</span>
                    <span className={`text-sm font-medium ${getUsageColor(getUsagePercentage(account.limits.usedMonthlyPosts, account.limits.monthlyPosts))}`}>
                      {account.limits.usedMonthlyPosts}/{account.limits.monthlyPosts}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        getUsagePercentage(account.limits.usedMonthlyPosts, account.limits.monthlyPosts) >= 90 ? 'bg-red-500' :
                        getUsagePercentage(account.limits.usedMonthlyPosts, account.limits.monthlyPosts) >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${getUsagePercentage(account.limits.usedMonthlyPosts, account.limits.monthlyPosts)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Settings Status */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Settings</div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Auto Post:</span>
                      <span className={account.settings.autoPost ? 'text-green-600' : 'text-gray-400'}>
                        {account.settings.autoPost ? 'On' : 'Off'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Auto Reply:</span>
                      <span className={account.settings.autoReply ? 'text-green-600' : 'text-gray-400'}>
                        {account.settings.autoReply ? 'On' : 'Off'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Sync:</span>
                      <span className="text-gray-600">{account.settings.syncFrequency}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Permissions</h4>
                  <button
                    onClick={() => handleRefreshPermissions(account.id)}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Refresh
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {account.permissions.map((permission, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                    >
                      {permission.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Account Settings - {selectedAccount.name}
                </h2>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Auto Post Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Automation Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Auto Post</label>
                      <p className="text-xs text-gray-600">Automatically post scheduled content</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedAccount.settings.autoPost}
                      onChange={(e) => setSelectedAccount({
                        ...selectedAccount,
                        settings: { ...selectedAccount.settings, autoPost: e.target.checked }
                      })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Auto Reply</label>
                      <p className="text-xs text-gray-600">Automatically reply to messages</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedAccount.settings.autoReply}
                      onChange={(e) => setSelectedAccount({
                        ...selectedAccount,
                        settings: { ...selectedAccount.settings, autoReply: e.target.checked }
                      })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Notifications</label>
                      <p className="text-xs text-gray-600">Receive notifications for this account</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedAccount.settings.notifications}
                      onChange={(e) => setSelectedAccount({
                        ...selectedAccount,
                        settings: { ...selectedAccount.settings, notifications: e.target.checked }
                      })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Analytics</label>
                      <p className="text-xs text-gray-600">Track analytics for this account</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedAccount.settings.analytics}
                      onChange={(e) => setSelectedAccount({
                        ...selectedAccount,
                        settings: { ...selectedAccount.settings, analytics: e.target.checked }
                      })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Sync Frequency */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sync Settings</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sync Frequency</label>
                  <select
                    value={selectedAccount.settings.syncFrequency}
                    onChange={(e) => setSelectedAccount({
                      ...selectedAccount,
                      settings: { ...selectedAccount.settings, syncFrequency: e.target.value as any }
                    })}
                    className="input w-full"
                  >
                    <option value="realtime">Real-time</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                  </select>
                  <p className="text-xs text-gray-600 mt-1">
                    How often to sync data from this platform
                  </p>
                </div>
              </div>

              {/* Account Limits */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Limits</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Daily Post Limit</label>
                    <input
                      type="number"
                      value={selectedAccount.limits.dailyPosts}
                      onChange={(e) => setSelectedAccount({
                        ...selectedAccount,
                        limits: { ...selectedAccount.limits, dailyPosts: parseInt(e.target.value) || 0 }
                      })}
                      className="input w-full"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Post Limit</label>
                    <input
                      type="number"
                      value={selectedAccount.limits.monthlyPosts}
                      onChange={(e) => setSelectedAccount({
                        ...selectedAccount,
                        limits: { ...selectedAccount.limits, monthlyPosts: parseInt(e.target.value) || 0 }
                      })}
                      className="input w-full"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateSettings(selectedAccount.id, selectedAccount.settings)}
                  className="btn-primary"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
