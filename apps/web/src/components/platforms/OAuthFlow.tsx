'use client';

import { useState, useEffect } from 'react';

interface OAuthConfig {
  platform: string;
  clientId: string;
  redirectUri: string;
  scope: string[];
  authUrl: string;
  tokenUrl: string;
  refreshUrl?: string;
}

interface OAuthFlowProps {
  onOAuthSuccess?: (platform: string, tokens: any) => void;
  onOAuthError?: (platform: string, error: string) => void;
}

export default function OAuthFlow({ onOAuthSuccess, onOAuthError }: OAuthFlowProps) {
  const [oauthConfigs, setOauthConfigs] = useState<OAuthConfig[]>([]);
  const [activeFlow, setActiveFlow] = useState<string | null>(null);
  const [oauthStep, setOauthStep] = useState<'initiate' | 'authorize' | 'callback' | 'complete'>('initiate');
  const [tokens, setTokens] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Mock OAuth configurations
  const mockOAuthConfigs: OAuthConfig[] = [
    {
      platform: 'Facebook',
      clientId: 'fb_client_123456',
      redirectUri: 'https://app.agentbowery.com/oauth/facebook/callback',
      scope: ['pages_manage_posts', 'pages_read_engagement', 'pages_manage_metadata'],
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      refreshUrl: 'https://graph.facebook.com/v18.0/oauth/access_token'
    },
    {
      platform: 'LinkedIn',
      clientId: 'li_client_789012',
      redirectUri: 'https://app.agentbowery.com/oauth/linkedin/callback',
      scope: ['w_member_social', 'r_organization_social', 'w_organization_social'],
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      refreshUrl: 'https://www.linkedin.com/oauth/v2/accessToken'
    },
    {
      platform: 'Instagram',
      clientId: 'ig_client_345678',
      redirectUri: 'https://app.agentbowery.com/oauth/instagram/callback',
      scope: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_comments'],
      authUrl: 'https://api.instagram.com/oauth/authorize',
      tokenUrl: 'https://api.instagram.com/oauth/access_token',
      refreshUrl: 'https://api.instagram.com/oauth/access_token'
    },
    {
      platform: 'Twitter',
      clientId: 'tw_client_901234',
      redirectUri: 'https://app.agentbowery.com/oauth/twitter/callback',
      scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      authUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      refreshUrl: 'https://api.twitter.com/2/oauth2/token'
    }
  ];

  useEffect(() => {
    setOauthConfigs(mockOAuthConfigs);
  }, []);

  const initiateOAuthFlow = async (platform: string) => {
    const config = oauthConfigs.find(c => c.platform === platform);
    if (!config) {
      setError(`OAuth configuration not found for ${platform}`);
      return;
    }

    setActiveFlow(platform);
    setOauthStep('authorize');
    setError(null);

    // In a real app, this would redirect to the OAuth provider
    // For demo purposes, we'll simulate the flow
    console.log('Initiating OAuth flow for:', platform);
    console.log('Auth URL:', config.authUrl);
    console.log('Client ID:', config.clientId);
    console.log('Redirect URI:', config.redirectUri);
    console.log('Scope:', config.scope.join(' '));

    // Simulate OAuth authorization
    setTimeout(() => {
      setOauthStep('callback');
      simulateOAuthCallback(platform);
    }, 2000);
  };

  const simulateOAuthCallback = async (platform: string) => {
    // Simulate OAuth callback with authorization code
    const mockAuthCode = `auth_code_${platform.toLowerCase()}_${Date.now()}`;
    
    setOauthStep('callback');
    
    // Simulate token exchange
    setTimeout(() => {
      exchangeCodeForTokens(platform, mockAuthCode);
    }, 1500);
  };

  const exchangeCodeForTokens = async (platform: string, authCode: string) => {
    const config = oauthConfigs.find(c => c.platform === platform);
    if (!config) {
      setError(`OAuth configuration not found for ${platform}`);
      return;
    }

    try {
      // Simulate token exchange
      const mockTokens = {
        access_token: `access_token_${platform.toLowerCase()}_${Date.now()}`,
        refresh_token: `refresh_token_${platform.toLowerCase()}_${Date.now()}`,
        expires_in: 3600,
        token_type: 'Bearer',
        scope: config.scope.join(' ')
      };

      setTokens(mockTokens);
      setOauthStep('complete');

      // In a real app, this would make an API call to exchange the code for tokens
      console.log('Exchanging code for tokens:', {
        platform,
        authCode,
        tokenUrl: config.tokenUrl,
        clientId: config.clientId,
        redirectUri: config.redirectUri
      });

      if (onOAuthSuccess) {
        onOAuthSuccess(platform, mockTokens);
      }

      // Reset flow after 3 seconds
      setTimeout(() => {
        setActiveFlow(null);
        setOauthStep('initiate');
        setTokens(null);
        setError(null);
      }, 3000);

    } catch (err) {
      setError(`Failed to exchange code for tokens: ${err}`);
      if (onOAuthError) {
        onOAuthError(platform, `Failed to exchange code for tokens: ${err}`);
      }
    }
  };

  const refreshTokens = async (platform: string) => {
    const config = oauthConfigs.find(c => c.platform === platform);
    if (!config || !config.refreshUrl) {
      setError(`Refresh token URL not configured for ${platform}`);
      return;
    }

    try {
      // Simulate token refresh
      const mockRefreshedTokens = {
        access_token: `refreshed_access_token_${platform.toLowerCase()}_${Date.now()}`,
        expires_in: 3600,
        token_type: 'Bearer'
      };

      setTokens(mockRefreshedTokens);
      alert('Tokens refreshed successfully!');

      console.log('Refreshing tokens:', {
        platform,
        refreshUrl: config.refreshUrl
      });

    } catch (err) {
      setError(`Failed to refresh tokens: ${err}`);
    }
  };

  const revokeTokens = async (platform: string) => {
    try {
      // Simulate token revocation
      setTokens(null);
      setActiveFlow(null);
      setOauthStep('initiate');
      setError(null);
      
      alert('Tokens revoked successfully!');

      console.log('Revoking tokens for:', platform);

    } catch (err) {
      setError(`Failed to revoke tokens: ${err}`);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Facebook': return '📘';
      case 'LinkedIn': return '💼';
      case 'Instagram': return '📷';
      case 'Twitter': return '🐦';
      default: return '📱';
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'initiate': return '🚀';
      case 'authorize': return '🔐';
      case 'callback': return '🔄';
      case 'complete': return '✅';
      default: return '❓';
    }
  };

  const getStepColor = (step: string) => {
    switch (step) {
      case 'initiate': return 'text-gray-600';
      case 'authorize': return 'text-blue-600';
      case 'callback': return 'text-yellow-600';
      case 'complete': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">OAuth Flow Integration</h2>
          <p className="text-gray-600 mt-1">
            Manage OAuth connections and token flows
          </p>
        </div>
        <div className="text-sm text-gray-600">
          {oauthConfigs.length} platforms configured
        </div>
      </div>

      {/* OAuth Status */}
      {activeFlow && (
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getPlatformIcon(activeFlow)}</span>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">OAuth Flow - {activeFlow}</h3>
                  <p className="text-sm text-gray-600">Current step: {oauthStep}</p>
                </div>
              </div>
              <div className={`flex items-center space-x-2 ${getStepColor(oauthStep)}`}>
                <span className="text-lg">{getStepIcon(oauthStep)}</span>
                <span className="text-sm font-medium capitalize">{oauthStep}</span>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center space-x-4 mb-6">
              {['initiate', 'authorize', 'callback', 'complete'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    oauthStep === step ? 'bg-primary-500 text-white' :
                    ['initiate', 'authorize', 'callback', 'complete'].indexOf(oauthStep) > index ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    oauthStep === step ? 'text-primary-600' :
                    ['initiate', 'authorize', 'callback', 'complete'].indexOf(oauthStep) > index ? 'text-green-600' :
                    'text-gray-500'
                  }`}>
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </span>
                  {index < 3 && (
                    <div className={`w-8 h-0.5 ml-4 ${
                      ['initiate', 'authorize', 'callback', 'complete'].indexOf(oauthStep) > index ? 'bg-green-500' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>

            {/* Current Step Details */}
            {oauthStep === 'authorize' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Authorization Required</h4>
                <p className="text-sm text-blue-800">
                  Redirecting to {activeFlow} for authorization. Please grant the requested permissions.
                </p>
              </div>
            )}

            {oauthStep === 'callback' && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Processing Authorization</h4>
                <p className="text-sm text-yellow-800">
                  Exchanging authorization code for access tokens...
                </p>
              </div>
            )}

            {oauthStep === 'complete' && tokens && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">OAuth Flow Complete</h4>
                <p className="text-sm text-green-800 mb-3">
                  Successfully obtained access tokens for {activeFlow}.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Access Token:</span>
                    <span className="text-green-800 font-mono text-xs">
                      {tokens.access_token.substring(0, 20)}...
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Expires In:</span>
                    <span className="text-green-800">{tokens.expires_in} seconds</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Scope:</span>
                    <span className="text-green-800">{tokens.scope}</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 p-4 rounded-lg mt-4">
                <h4 className="font-medium text-red-900 mb-2">OAuth Error</h4>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OAuth Configurations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {oauthConfigs.map((config) => (
          <div key={config.platform} className="card">
            <div className="card-content">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getPlatformIcon(config.platform)}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{config.platform}</h3>
                    <p className="text-sm text-gray-600">OAuth Configuration</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => initiateOAuthFlow(config.platform)}
                    className="btn-primary btn-sm"
                    disabled={activeFlow === config.platform}
                  >
                    {activeFlow === config.platform ? 'In Progress...' : 'Connect'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Client ID</label>
                  <p className="text-sm text-gray-900 font-mono">{config.clientId}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Redirect URI</label>
                  <p className="text-sm text-gray-900 font-mono">{config.redirectUri}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Scope</label>
                  <div className="flex flex-wrap gap-1">
                    {config.scope.map((scope, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Auth URL</label>
                  <p className="text-sm text-gray-900 font-mono text-xs">{config.authUrl}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Token URL</label>
                  <p className="text-sm text-gray-900 font-mono text-xs">{config.tokenUrl}</p>
                </div>
              </div>

              {/* Token Management */}
              {tokens && activeFlow === config.platform && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => refreshTokens(config.platform)}
                      className="btn-outline btn-sm"
                    >
                      Refresh Tokens
                    </button>
                    <button
                      onClick={() => revokeTokens(config.platform)}
                      className="btn-outline btn-sm text-red-600 hover:text-red-700"
                    >
                      Revoke Tokens
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* OAuth Flow Documentation */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">OAuth Flow Documentation</h3>
          <p className="card-description">Understanding the OAuth 2.0 flow</p>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">1. Initiate Flow</h4>
              <p className="text-sm text-gray-600">
                Start the OAuth flow by clicking "Connect" on a platform. This will redirect the user to the platform's authorization server.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">2. Authorization</h4>
              <p className="text-sm text-gray-600">
                The user grants permissions to your application. The platform redirects back with an authorization code.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">3. Token Exchange</h4>
              <p className="text-sm text-gray-600">
                Exchange the authorization code for access and refresh tokens using the platform's token endpoint.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">4. Complete</h4>
              <p className="text-sm text-gray-600">
                Store the tokens securely and use them to make API calls to the platform on behalf of the user.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
