'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export default function SystemControls() {
  const [systemFlags, setSystemFlags] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pauseReason, setPauseReason] = useState('');
  const [showPauseModal, setShowPauseModal] = useState(false);

  const loadSystemFlags = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getSystemFlags();
      setSystemFlags(result);
    } catch (err: any) {
      console.error('Failed to load system flags:', err);
      setError(err.message || 'Failed to load system flags');
    } finally {
      setLoading(false);
    }
  };

  const pauseSystem = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.pauseSystem(pauseReason || undefined);
      
      if (result.success) {
        await loadSystemFlags(); // Reload flags
        setShowPauseModal(false);
        setPauseReason('');
      }
    } catch (err: any) {
      console.error('Failed to pause system:', err);
      setError(err.message || 'Failed to pause system');
    } finally {
      setLoading(false);
    }
  };

  const resumeSystem = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.resumeSystem();
      
      if (result.success) {
        await loadSystemFlags(); // Reload flags
      }
    } catch (err: any) {
      console.error('Failed to resume system:', err);
      setError(err.message || 'Failed to resume system');
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flagName: string, currentValue: boolean) => {
    try {
      setLoading(true);
      setError(null);

      // Note: This would need a backend endpoint to toggle individual flags
      // For now, we'll just update the local state
      setSystemFlags({
        ...systemFlags,
        flags: systemFlags.flags.map((flag: any) => 
          flag.name === flagName ? { ...flag, value: !currentValue } : flag
        ),
      });
    } catch (err: any) {
      console.error('Failed to toggle flag:', err);
      setError(err.message || 'Failed to toggle flag');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'security': return 'text-red-600 bg-red-100';
      case 'performance': return 'text-blue-600 bg-blue-100';
      case 'feature': return 'text-green-600 bg-green-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (paused: boolean) => {
    return paused ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100';
  };

  useEffect(() => {
    loadSystemFlags();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">System Controls</h3>
          <p className="text-sm text-gray-600">Manage system flags and global operations</p>
        </div>
        <button
          onClick={loadSystemFlags}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* System Status */}
      {systemFlags && (
        <div className="space-y-6">
          {/* System Status */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">System Status</h4>
              <div className="flex items-center space-x-2">
                <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(systemFlags.systemStatus.paused)}`}>
                  {systemFlags.systemStatus.paused ? 'PAUSED' : 'ACTIVE'}
                </span>
              </div>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {systemFlags.systemStatus.paused ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <span className="text-red-600 text-lg">⏸️</span>
                      <div>
                        <h5 className="font-medium text-red-900 mb-1">System Paused</h5>
                        <p className="text-sm text-red-800">
                          All operations are currently paused. Content processing and publishing are suspended.
                        </p>
                        {systemFlags.systemStatus.pausedAt && (
                          <p className="text-sm text-red-700 mt-1">
                            Paused at: {formatDate(systemFlags.systemStatus.pausedAt)}
                          </p>
                        )}
                        {systemFlags.systemStatus.pausedBy && (
                          <p className="text-sm text-red-700">
                            Paused by: {systemFlags.systemStatus.pausedBy}
                          </p>
                        )}
                        {systemFlags.systemStatus.pausedReason && (
                          <p className="text-sm text-red-700">
                            Reason: {systemFlags.systemStatus.pausedReason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={resumeSystem}
                        disabled={loading}
                        className="btn-primary"
                      >
                        {loading ? 'Resuming...' : 'Resume System'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <span className="text-green-600 text-lg">▶️</span>
                      <div>
                        <h5 className="font-medium text-green-900 mb-1">System Active</h5>
                        <p className="text-sm text-green-800">
                          All operations are running normally. Content processing and publishing are active.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => setShowPauseModal(true)}
                        className="btn-secondary"
                      >
                        Pause System
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* System Flags */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">System Flags</h4>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                {systemFlags.flags.map((flag: any, index: number) => (
                  <div key={flag.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h5 className="font-medium text-gray-900">{flag.name}</h5>
                        <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(flag.category)}`}>
                          {flag.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{flag.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Last modified: {formatDate(flag.lastModified)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        flag.value ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                      }`}>
                        {flag.value ? 'Enabled' : 'Disabled'}
                      </span>
                      <button
                        onClick={() => toggleFlag(flag.name, flag.value)}
                        disabled={loading}
                        className={`btn-secondary text-xs ${
                          flag.value ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                        }`}
                      >
                        {flag.value ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                ))}

                {systemFlags.flags.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">⚙️</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No System Flags</h3>
                    <p className="text-gray-600">No system flags are currently configured.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pause Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Pause System</h2>
                <button
                  onClick={() => setShowPauseModal(false)}
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
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <span className="text-yellow-600 text-lg">⚠️</span>
                    <div>
                      <h5 className="font-medium text-yellow-900 mb-1">Warning</h5>
                      <p className="text-sm text-yellow-800">
                        Pausing the system will stop all content processing and publishing operations. 
                        This action should only be used for maintenance or emergency situations.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Pausing (Optional)
                  </label>
                  <textarea
                    value={pauseReason}
                    onChange={(e) => setPauseReason(e.target.value)}
                    className="input w-full h-20 resize-none"
                    placeholder="Enter reason for pausing the system..."
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowPauseModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={pauseSystem}
                disabled={loading}
                className="btn-primary bg-red-600 hover:bg-red-700"
              >
                {loading ? 'Pausing...' : 'Pause System'}
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
        <h4 className="font-medium text-purple-900 mb-2">System Controls</h4>
        <div className="space-y-2 text-sm text-purple-800">
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">⚙️</span>
            <div>
              <p className="font-medium">System Flags</p>
              <p>Manage system-wide configuration flags for features, security, and performance.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">⏸️</span>
            <div>
              <p className="font-medium">System Pause/Resume</p>
              <p>Emergency controls to pause or resume all system operations for maintenance.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">🔒</span>
            <div>
              <p className="font-medium">Security Controls</p>
              <p>Manage security-related flags and system-wide security settings.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 text-lg">📊</span>
            <div>
              <p className="font-medium">Performance Flags</p>
              <p>Control performance-related settings and optimization features.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
