'use client';

import { useSession } from 'next-auth/react';
import { AdminOnly, RoleGuard } from '@/components/auth/RoleGuard';
import { ShieldCheckIcon, UsersIcon, CogIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function AdminPage() {
  const { data: session } = useSession();

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center">
          <ShieldCheckIcon className="h-8 w-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        </div>
        <p className="mt-2 text-gray-600">
          Administrative controls and system management
        </p>
      </div>

      {/* Admin-only content */}
      <AdminOnly
        fallback={
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Access Denied
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>You need administrator privileges to access this page.</p>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Management */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      User Management
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      Manage Users
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a href="/admin/users" className="font-medium text-primary-700 hover:text-primary-900">
                  View all users
                </a>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CogIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      System Settings
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      Configuration
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a href="/admin/settings" className="font-medium text-primary-700 hover:text-primary-900">
                  Configure system
                </a>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Security
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      Access Control
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a href="/admin/security" className="font-medium text-primary-700 hover:text-primary-900">
                  Security settings
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Admin Actions</h2>
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <RoleGuard permissions={['users:manage']}>
                  <button className="btn-primary w-full">
                    Manage Users
                  </button>
                </RoleGuard>
                
                <RoleGuard permissions={['settings:manage']}>
                  <button className="btn-secondary w-full">
                    System Settings
                  </button>
                </RoleGuard>
                
                <RoleGuard permissions={['admin:access']}>
                  <button className="btn-danger w-full">
                    Advanced Admin
                  </button>
                </RoleGuard>
                
                <RoleGuard permissions={['webhooks:manage']}>
                  <button className="btn-secondary w-full">
                    Webhook Management
                  </button>
                </RoleGuard>
              </div>
            </div>
          </div>
        </div>

        {/* Current User Info */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Current Session</h2>
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session?.user?.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session?.user?.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">{session?.user?.role}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Organization</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session?.user?.organizationId}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Permissions</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <div className="flex flex-wrap gap-2">
                      {session?.user?.permissions?.map((permission) => (
                        <span
                          key={permission}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </AdminOnly>
    </div>
  );
}
