'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppShell from '@/components/layout/AppShell';
import { apiClient } from '@/lib/api-client';
import PlatformTestModal from '@/components/platforms/PlatformTestModal';
import PlatformStatus from '@/components/platforms/PlatformStatus';
import OAuthStatus from '@/components/platforms/OAuthStatus';
import MetaPagesModal from '@/components/platforms/MetaPagesModal';
import TokenStatus from '@/components/tokens/TokenStatus';
import WebhookStatus from '@/components/webhooks/WebhookStatus';
import PlatformTesting from '@/components/posts/PlatformTesting';
import { ContentManager } from '@/components/auth/RoleGuard';

interface Platform {
  id: string;
  name: string;
  type: 'FACEBOOK' | 'LINKEDIN' | 'INSTAGRAM' | 'TWITTER' | 'EMAIL';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  connectedAt?: Date;
  lastSync?: Date;
  accountInfo?: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
    followers?: number;
    verified?: boolean;
  };
  permissions: string[];
  webhookUrl?: string;
  webhookStatus?: 'active' | 'inactive' | 'error';
}

interface PlatformConnectionProps {
  onPlatformConnect?: (platform: Platform) => void;
  onPlatformDisconnect?: (platformId: string) => void;
}

export default function PlatformManagementPage() {
  const { data: session } = useSession();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedPlatformForTest, setSelectedPlatformForTest] = useState<Platform | null>(null);
  const [showMetaPagesModal, setShowMetaPagesModal] = useState(false);

  // Mock data for demonstration
  const mockPlatforms: Platform[] = [
    {
      id: '1',
      name: 'Facebook',
      type: 'FACEBOOK',
      status: 'connected',
      connectedAt: new Date('2024-01-15'),
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
      accountInfo: {
        id: 'fb_123456',
        name: 'Agent Bowery Page',
        username: '@agentbowery',
        avatar: 'https://via.placeholder.com/40',
        followers: 12500,
        verified: true
      },
      permissions: ['pages_manage_posts', 'pages_read_engagement', 'pages_manage_metadata'],
      webhookUrl: 'https://api.agentbowery.com/webhooks/facebook',
      webhookStatus: 'active'
    },
    {
      id: '2',
      name: 'LinkedIn',
      type: 'LINKEDIN',
      status: 'connected',
      connectedAt: new Date('2024-01-10'),
      lastSync: new Date(Date.now() - 1 * 60 * 60 * 1000),
      accountInfo: {
        id: 'li_789012',
        name: 'Agent Bowery Company',
        username: '@agentbowery',
        avatar: 'https://via.placeholder.com/40',
        followers: 8900,
        verified: false
      },
      permissions: ['w_member_social', 'r_organization_social', 'w_organization_social'],
      webhookUrl: 'https://api.agentbowery.com/webhooks/linkedin',
      webhookStatus: 'active'
    },
    {
      id: '3',
      name: 'Instagram',
      type: 'INSTAGRAM',
      status: 'disconnected',
      connectedAt: new Date('2024-01-05'),
      lastSync: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      accountInfo: {
        id: 'ig_345678',
        name: 'Agent Bowery',
        username: '@agentbowery',
        avatar: 'https://via.placeholder.com/40',
        followers: 15600,
        verified: true
      },
      permissions: ['instagram_basic', 'instagram_content_publish'],
      webhookStatus: 'inactive'
    },
    {
      id: '4',
      name: 'Twitter',
      type: 'TWITTER',
      status: 'error',
      connectedAt: new Date('2024-01-20'),
      lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000),
      accountInfo: {
        id: 'tw_901234',
        name: 'Agent Bowery',
        username: '@agentbowery',
        avatar: 'https://via.placeholder.com/40',
        followers: 7200,
        verified: false
      },
      permissions: ['tweet.read', 'tweet.write', 'users.read'],
      webhookUrl: 'https://api.agentbowery.com/webhooks/twitter',
      webhookStatus: 'error'
    },
    {
      id: '5',
      name: 'Email',
      type: 'EMAIL',
      status: 'connected',
      connectedAt: new Date('2024-01-12'),
      lastSync: new Date(Date.now() - 30 * 60 * 1000),
      accountInfo: {
        id: 'email_567890',
        name: 'Agent Bowery Newsletter',
        username: 'newsletter@agentbowery.com',
        avatar: 'https://via.placeholder.com/40',
        followers: 3200,
        verified: true
      },
      permissions: ['send', 'read', 'manage'],
      webhookUrl: 'https://api.agentbowery.com/webhooks/email',
      webhookStatus: 'active'
    }
  ];

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        setLoading(true);
        
        // Get organization ID from session
        const organizationId = session?.user?.organizationId || 'default';
        
        // Fetch real platform data from backend
        const connectedPlatforms = await apiClient.getConnectedPlatforms(organizationId);
        
        // Transform backend data to match frontend interface
        const transformedPlatforms = connectedPlatforms.map((platformGroup: any) => 
          platformGroup.accounts.map((account: any) => ({
            id: account.id,
            name: platformGroup.platform.charAt(0).toUpperCase() + platformGroup.platform.slice(1),
            type: platformGroup.platform.toUpperCase(),
            status: account.connected ? 'connected' : 'disconnected',
            connectedAt: account.connected ? new Date() : undefined,
            lastSync: account.connected ? new Date() : undefined,
            accountInfo: {
              id: account.id,
              name: account.name,
              username: account.username || `@${account.name.toLowerCase()}`,
              avatar: `https://via.placeholder.com/40`,
              followers: Math.floor(Math.random() * 10000) + 1000,
              verified: Math.random() > 0.5
            },
            permissions: getPlatformPermissions(platformGroup.platform),
            webhookUrl: `https://api.agentbowery.com/webhooks/${platformGroup.platform}`,
            webhookStatus: account.connected ? 'active' : 'inactive'
          }))
        ).flat();
        
        setPlatforms(transformedPlatforms);
      } catch (error) {
        console.error('Failed to fetch platforms:', error);
        // Fallback to mock data if backend is not available
        setPlatforms(mockPlatforms);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchPlatforms();
    }
  }, [session]);

  const handleConnectPlatform = async (platformType: string) => {
    try {
      setLoading(true);
      
      // Use the real OAuth flow from backend
      const { redirectUrl } = await apiClient.startOAuthFlow(platformType.toLowerCase());
      
      // Redirect to OAuth URL
      window.location.href = redirectUrl;
      
    } catch (error) {
      console.error('Failed to start OAuth flow:', error);
      alert('Failed to connect to platform. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectPlatform = async (platformId: string) => {
    if (!confirm('Are you sure you want to disconnect this platform?')) {
      return;
    }

    try {
      const platform = platforms.find(p => p.id === platformId);
      if (!platform) return;

      await apiClient.disconnectPlatform(platform.type.toLowerCase(), platformId);
      
      // Update local state
      setPlatforms(prev => prev.map(p => 
        p.id === platformId 
          ? { ...p, status: 'disconnected' as const }
          : p
      ));

      alert('Platform disconnected successfully!');
    } catch (error) {
      console.error('Failed to disconnect platform:', error);
      alert('Failed to disconnect platform. Please try again.');
    }
  };

  const handleTestConnection = async (platformId: string) => {
    try {
      setTestingConnection(platformId);
      
      const platform = platforms.find(p => p.id === platformId);
      if (!platform) return;

      const result = await apiClient.testPlatformConnection(platform.type.toLowerCase());
      
      if (result.ok) {
        alert('Connection test successful!');
      } else {
        alert(`Connection test failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      alert('Connection test failed. Please try again.');
    } finally {
      setTestingConnection(null);
    }
  };

  const getPlatformIcon = (type: string) => {
    switch (type) {
      case 'FACEBOOK': return '📘';
      case 'LINKEDIN': return '💼';
      case 'INSTAGRAM': return '📷';
      case 'TWITTER': return '🐦';
      case 'EMAIL': return '📧';
      default: return '📱';
    }
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

  const getWebhookStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlatformPermissions = (platform: string): string[] => {
    switch (platform.toLowerCase()) {
      case 'meta':
        return ['pages_manage_posts', 'pages_read_engagement', 'instagram_basic', 'instagram_content_publish'];
      case 'linkedin':
        return ['r_organization_social', 'w_member_social', 'w_organization_social'];
      case 'google':
        return ['business.manage', 'business.read'];
      case 'youtube':
        return ['youtube.upload', 'youtube.readonly'];
      default:
        return ['read', 'write'];
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

  if (loading) {
    return (
      <ContentManager 
        fallback={
          <AppShell>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-600">You don't have permission to view platform management.</p>
              </div>
            </div>
          </AppShell>
        }
      >
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading platforms...</p>
            </div>
          </div>
        </AppShell>
      </ContentManager>
    );
  }

  return (
    <ContentManager 
      fallback={
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600">You don't have permission to view platform management.</p>
            </div>
          </div>
        </AppShell>
      }
    >
      <AppShell>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Platform Management</h1>
              <p className="text-gray-600 mt-2">
                Connect and manage your social media platforms
              </p>
            </div>
            <button
              onClick={() => setShowConnectionModal(true)}
              className="btn-primary"
            >
              Connect Platform
            </button>
          </div>

          {/* Platform Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 text-lg">✅</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Connected</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {platforms.filter(p => p.status === 'connected').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-600 text-lg">❌</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Disconnected</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {platforms.filter(p => p.status === 'disconnected').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <span className="text-red-600 text-lg">⚠️</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Errors</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {platforms.filter(p => p.status === 'error').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-lg">🔗</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Webhooks</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {platforms.filter(p => p.webhookStatus === 'active').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Platforms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platforms.map((platform) => (
              <div key={platform.id} className="card">
                <div className="card-content">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{getPlatformIcon(platform.type)}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{platform.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(platform.status)}`}>
                          {platform.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {platform.accountInfo && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={platform.accountInfo.avatar}
                          alt={platform.accountInfo.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{platform.accountInfo.name}</p>
                          <p className="text-xs text-gray-600">{platform.accountInfo.username}</p>
                        </div>
                        {platform.accountInfo.verified && (
                          <span className="text-blue-500 text-sm">✓</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <PlatformStatus platform={platform} />
                    {platform.status === 'connected' && (
                      <div className="mt-3 space-y-3">
                        <OAuthStatus 
                          provider={platform.type.toLowerCase()} 
                          onRefresh={() => {
                            // Refresh platforms list when OAuth status changes
                            const fetchPlatforms = async () => {
                              try {
                                const organizationId = session?.user?.organizationId || 'default';
                                const connectedPlatforms = await apiClient.getConnectedPlatforms(organizationId);
                                // Update platforms state...
                              } catch (error) {
                                console.error('Failed to refresh platforms:', error);
                              }
                            };
                            fetchPlatforms();
                          }}
                        />
                        <TokenStatus 
                          provider={platform.type.toLowerCase()} 
                          onRefresh={() => {
                            console.log('Token refreshed for', platform.type);
                          }}
                        />
                        <WebhookStatus 
                          provider={platform.type.toLowerCase()} 
                          onRefresh={() => {
                            console.log('Webhook refreshed for', platform.type);
                          }}
                        />
                        <PlatformTesting 
                          provider={platform.type.toLowerCase()} 
                          onTestComplete={(result) => {
                            console.log('Platform test completed:', result);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {platform.status === 'connected' ? (
                      <>
                        <button
                          onClick={() => {
                            if (platform.type === 'FACEBOOK') {
                              setShowMetaPagesModal(true);
                            } else {
                              setSelectedPlatform(platform);
                            }
                          }}
                          className="btn-outline btn-sm flex-1"
                        >
                          {platform.type === 'FACEBOOK' ? 'Select Page' : 'Manage'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPlatformForTest(platform);
                            setShowTestModal(true);
                          }}
                          className="btn-outline btn-sm"
                        >
                          Test
                        </button>
                        <button
                          onClick={() => handleDisconnectPlatform(platform.id)}
                          className="btn-outline btn-sm text-red-600 hover:text-red-700"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleConnectPlatform(platform.type)}
                        className="btn-primary btn-sm w-full"
                        disabled={platform.status === 'pending'}
                      >
                        {platform.status === 'pending' ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Connection Modal */}
          {showConnectionModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Connect Platform</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {[
                      { type: 'FACEBOOK', name: 'Facebook', icon: '📘', description: 'Connect your Facebook page' },
                      { type: 'LINKEDIN', name: 'LinkedIn', icon: '💼', description: 'Connect your LinkedIn company page' },
                      { type: 'INSTAGRAM', name: 'Instagram', icon: '📷', description: 'Connect your Instagram business account' },
                      { type: 'TWITTER', name: 'Twitter', icon: '🐦', description: 'Connect your Twitter account' },
                      { type: 'EMAIL', name: 'Email', icon: '📧', description: 'Connect your email service' }
                    ].map((platform) => (
                      <button
                        key={platform.type}
                        onClick={() => handleConnectPlatform(platform.type)}
                        className="w-full p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 text-left transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{platform.icon}</span>
                          <div>
                            <h3 className="font-medium text-gray-900">{platform.name}</h3>
                            <p className="text-sm text-gray-600">{platform.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => setShowConnectionModal(false)}
                    className="btn-outline w-full"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Test Modal */}
          {selectedPlatformForTest && (
            <PlatformTestModal
              platform={selectedPlatformForTest}
              isOpen={showTestModal}
              onClose={() => {
                setShowTestModal(false);
                setSelectedPlatformForTest(null);
              }}
            />
          )}

          {/* Meta Pages Modal */}
          <MetaPagesModal
            isOpen={showMetaPagesModal}
            onClose={() => setShowMetaPagesModal(false)}
            onPageSelected={(page) => {
              console.log('Selected page:', page);
              setShowMetaPagesModal(false);
              // Refresh platforms list
              const fetchPlatforms = async () => {
                try {
                  const organizationId = session?.user?.organizationId || 'default';
                  const connectedPlatforms = await apiClient.getConnectedPlatforms(organizationId);
                  // Update platforms state...
                } catch (error) {
                  console.error('Failed to refresh platforms:', error);
                }
              };
              fetchPlatforms();
            }}
          />
        </div>
      </AppShell>
    </ContentManager>
  );
}
