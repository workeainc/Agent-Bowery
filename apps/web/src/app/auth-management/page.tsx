'use client';

import { ContentManager } from '@/components/auth/RoleGuard';
import { AppShell } from '@/components/layout/AppShell';
import DevTokenGenerator from '@/components/auth/DevTokenGenerator';
import TokenRefreshHandler from '@/components/auth/TokenRefreshHandler';
import UserProfileManager from '@/components/auth/UserProfileManager';

export default function AuthManagementPage() {
  return (
    <ContentManager
      fallback={
        <AppShell>
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Authentication Management</h1>
                  <p className="text-gray-600">Manage tokens, refresh authentication, and update your profile</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DevTokenGenerator />
                  <TokenRefreshHandler />
                </div>
                <UserProfileManager />
              </div>
            </div>
          </div>
        </AppShell>
      }
    >
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Authentication Management</h1>
              <p className="text-gray-600">Manage tokens, refresh authentication, and update your profile</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DevTokenGenerator />
              <TokenRefreshHandler />
            </div>
            <UserProfileManager />
          </div>
        </div>
      </div>
    </ContentManager>
  );
}
