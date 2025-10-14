'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useSession } from 'next-auth/react';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export default function UserProfileManager() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const userProfile = await apiClient.getCurrentUser();
      setProfile(userProfile);
      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || '',
      });
    } catch (err: any) {
      console.error('Failed to load user profile:', err);
      setError(err.message || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Note: This would need a backend endpoint for updating user profile
      // For now, we'll just simulate the update
      const updatedProfile = {
        ...profile,
        name: formData.name,
        email: formData.email,
        updatedAt: new Date().toISOString(),
      };

      setProfile(updatedProfile);
      setEditing(false);

      // Update the session if needed
      await update({
        ...session,
        user: {
          ...session?.user,
          name: formData.name,
          email: formData.email,
        },
      });
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && !profile) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">User Profile</h3>
        <p className="card-description">Manage your account information and settings</p>
      </div>
      <div className="card-content">
        <div className="space-y-6">
          {/* Profile Information */}
          {profile && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-900">Profile Information</h4>
                {!editing && (
                  <button
                    onClick={handleEdit}
                    className="btn-secondary"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input w-full"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">{profile.name || 'Not set'}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input w-full"
                      placeholder="Enter your email"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">{profile.email}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User ID
                  </label>
                  <div className="text-sm text-gray-900 font-mono">{profile.id}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <div className="text-sm text-gray-900 capitalize">{profile.role}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization ID
                  </label>
                  <div className="text-sm text-gray-900 font-mono">{profile.organizationId}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Member Since
                  </label>
                  <div className="text-sm text-gray-900">{formatDate(profile.createdAt)}</div>
                </div>
              </div>

              {/* Edit Actions */}
              {editing && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleCancel}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Session Information */}
          {session && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Session Information</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Session Status:</span>
                    <span className="ml-2 text-green-600">Active</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Provider:</span>
                    <span className="ml-2 text-gray-900">NextAuth</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Last Updated:</span>
                    <span className="ml-2 text-gray-900">{formatDate(session.user?.updatedAt || new Date().toISOString())}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Permissions:</span>
                    <span className="ml-2 text-gray-900">{session.user?.permissions?.length || 0} permissions</span>
                  </div>
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Profile Management</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-lg">👤</span>
                <div>
                  <p className="font-medium">Account Information</p>
                  <p>Update your name and email address. Changes are reflected across the application.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-lg">🔒</span>
                <div>
                  <p className="font-medium">Security</p>
                  <p>Your user ID and role are managed by administrators and cannot be changed here.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-lg">🔄</span>
                <div>
                  <p className="font-medium">Session Sync</p>
                  <p>Profile changes are automatically synced with your active session.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
