'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api-client';

interface AutopostSettings {
  organization_id: string;
  autopost_enabled: boolean;
  dry_run: boolean;
  updated_at?: string;
}

export default function AutopostControls() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<AutopostSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [formData, setFormData] = useState({
    autopost_enabled: false,
    dry_run: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const organizationId = session?.user?.organizationId || 'default';
      
      // Mock settings for demonstration
      const mockSettings: AutopostSettings = {
        organization_id: organizationId,
        autopost_enabled: false,
        dry_run: true,
        updated_at: '2024-01-10T10:00:00Z'
      };
      
      setSettings(mockSettings);
      setFormData({
        autopost_enabled: mockSettings.autopost_enabled,
        dry_run: mockSettings.dry_run
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const organizationId = session?.user?.organizationId || 'default';
      
      await apiClient.upsertAutopostSettings(organizationId, formData);
      
      const updatedSettings: AutopostSettings = {
        organization_id: organizationId,
        ...formData,
        updated_at: new Date().toISOString()
      };
      
      setSettings(updatedSettings);
      setShowSettingsModal(false);
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyStop = async () => {
    if (!confirm('Are you sure you want to emergency stop all autoposting? This will disable autoposting and enable dry-run mode.')) {
      return;
    }

    try {
      setLoading(true);
      const organizationId = session?.user?.organizationId || 'default';
      
      await apiClient.emergencyStopAutopost(organizationId);
      
      const updatedSettings: AutopostSettings = {
        organization_id: organizationId,
        autopost_enabled: false,
        dry_run: true,
        updated_at: new Date().toISOString()
      };
      
      setSettings(updatedSettings);
      setFormData({
        autopost_enabled: false,
        dry_run: true
      });
      
      alert('Emergency stop activated! All autoposting has been disabled.');
    } catch (error: any) {
      console.error('Failed to emergency stop:', error);
      alert('Failed to emergency stop: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    if (!confirm('Are you sure you want to resume autoposting? This will enable autoposting and disable dry-run mode.')) {
      return;
    }

    try {
      setLoading(true);
      const organizationId = session?.user?.organizationId || 'default';
      
      await apiClient.resumeAutopost(organizationId);
      
      const updatedSettings: AutopostSettings = {
        organization_id: organizationId,
        autopost_enabled: true,
        dry_run: false,
        updated_at: new Date().toISOString()
      };
      
      setSettings(updatedSettings);
      setFormData({
        autopost_enabled: true,
        dry_run: false
      });
      
      alert('Autoposting resumed successfully!');
    } catch (error: any) {
      console.error('Failed to resume:', error);
      alert('Failed to resume: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (enabled: boolean, dryRun: boolean) => {
    if (!enabled) return 'text-red-600';
    if (dryRun) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = (enabled: boolean, dryRun: boolean) => {
    if (!enabled) return '⏸️';
    if (dryRun) return '🧪';
    return '▶️';
  };

  const getStatusText = (enabled: boolean, dryRun: boolean) => {
    if (!enabled) return 'Disabled';
    if (dryRun) return 'Dry Run Mode';
    return 'Active';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Auto-Posting Controls</h2>
        <p className="text-sm text-gray-600 mb-6">
          Manage automatic content publishing settings and emergency controls.
        </p>

        {/* Current Status */}
        <div className="card mb-6">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">{getStatusIcon(settings?.autopost_enabled || false, settings?.dry_run || true)}</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Current Status</h3>
                  <p className={`text-sm font-medium ${getStatusColor(settings?.autopost_enabled || false, settings?.dry_run || true)}`}>
                    {getStatusText(settings?.autopost_enabled || false, settings?.dry_run || true)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  Organization: {settings?.organization_id || 'Default'}
                </div>
                <div className="text-xs text-gray-500">
                  Updated: {settings?.updated_at ? formatDate(settings.updated_at) : 'Never'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 text-left transition-colors"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⚙️</span>
              <div>
                <h4 className="font-medium text-gray-900">Configure Settings</h4>
                <p className="text-sm text-gray-600">Adjust autoposting preferences</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleEmergencyStop}
            disabled={loading || !settings?.autopost_enabled}
            className="p-4 border border-red-200 rounded-lg hover:border-red-300 hover:bg-red-50 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🛑</span>
              <div>
                <h4 className="font-medium text-red-900">Emergency Stop</h4>
                <p className="text-sm text-red-600">Immediately stop all autoposting</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleResume}
            disabled={loading || settings?.autopost_enabled}
            className="p-4 border border-green-200 rounded-lg hover:border-green-300 hover:bg-green-50 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">▶️</span>
              <div>
                <h4 className="font-medium text-green-900">Resume Autoposting</h4>
                <p className="text-sm text-green-600">Re-enable autoposting</p>
              </div>
            </div>
          </button>
        </div>

        {/* Settings Details */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Current Settings</h3>
            <p className="card-description">Autoposting configuration details</p>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Autoposting Status
                </label>
                <div className={`text-sm font-medium ${getStatusColor(settings?.autopost_enabled || false, settings?.dry_run || true)}`}>
                  {settings?.autopost_enabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dry Run Mode
                </label>
                <div className={`text-sm font-medium ${settings?.dry_run ? 'text-yellow-600' : 'text-green-600'}`}>
                  {settings?.dry_run ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>

            {settings?.updated_at && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Last Updated: {formatDate(settings.updated_at)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Configure Autoposting</h2>
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
              
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Enable Autoposting</label>
                      <p className="text-xs text-gray-600">Allow automatic content publishing</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.autopost_enabled}
                        onChange={(e) => setFormData(prev => ({ ...prev, autopost_enabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Dry Run Mode</label>
                      <p className="text-xs text-gray-600">Test mode - no actual posting</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.dry_run}
                        onChange={(e) => setFormData(prev => ({ ...prev, dry_run: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Information */}
        <div className="card">
          <div className="card-content">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Autoposting Help</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-lg">ℹ️</span>
                <div>
                  <p className="font-medium text-gray-900">Autoposting</p>
                  <p>When enabled, content will be automatically published according to schedules.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600 text-lg">🧪</span>
                <div>
                  <p className="font-medium text-gray-900">Dry Run Mode</p>
                  <p>Test mode that simulates posting without actually publishing content.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-red-600 text-lg">🛑</span>
                <div>
                  <p className="font-medium text-gray-900">Emergency Stop</p>
                  <p>Immediately stops all autoposting and enables dry-run mode for safety.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
