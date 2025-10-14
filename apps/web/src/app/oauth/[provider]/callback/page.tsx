'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AppShell from '@/components/layout/AppShell';
import { ContentManager } from '@/components/auth/RoleGuard';

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [provider, setProvider] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Extract provider from URL path
    const pathParts = window.location.pathname.split('/');
    const providerFromPath = pathParts[pathParts.length - 2]; // /oauth/{provider}/callback
    setProvider(providerFromPath);

    if (error) {
      setStatus('error');
      setMessage(errorDescription || `OAuth error: ${error}`);
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setMessage('Missing authorization code or state parameter');
      return;
    }

    // The backend handles the callback automatically
    // We just need to show success and redirect
    setStatus('success');
    setMessage(`${providerFromPath} connected successfully!`);
    
    // Redirect to platforms page after 3 seconds
    setTimeout(() => {
      router.push('/platforms');
    }, 3000);
  }, [searchParams, router]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>;
      case 'success':
        return <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-green-600 text-2xl">✓</span>
        </div>;
      case 'error':
        return <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-600 text-2xl">✗</span>
        </div>;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <ContentManager fallback={
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to manage OAuth connections.</p>
          </div>
        </div>
      </AppShell>
    }>
      <AppShell>
        <div className="max-w-md mx-auto mt-16">
          <div className="card">
            <div className="card-content text-center">
              {getStatusIcon()}
              
              <h2 className={`text-xl font-semibold mb-4 ${getStatusColor()}`}>
                {status === 'loading' && 'Processing OAuth...'}
                {status === 'success' && 'Connection Successful!'}
                {status === 'error' && 'Connection Failed'}
              </h2>
              
              <p className="text-gray-600 mb-6">{message}</p>
              
              {status === 'success' && (
                <p className="text-sm text-gray-500 mb-4">
                  Redirecting to platform management...
                </p>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => router.push('/platforms')}
                  className="btn-primary flex-1"
                >
                  Back to Platforms
                </button>
                
                {status === 'error' && (
                  <button
                    onClick={() => router.push('/platforms')}
                    className="btn-outline flex-1"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ContentManager>
  );
}
