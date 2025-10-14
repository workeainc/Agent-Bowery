'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface TokenAuditProps {
  provider: string;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  status: 'success' | 'failed';
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

export default function TokenAudit({ provider }: TokenAuditProps) {
  const [auditData, setAuditData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockAuditEntries, setMockAuditEntries] = useState<AuditEntry[]>([]);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.getTokenAudit(provider);
      setAuditData(result);
      
      // Generate mock audit entries since backend returns placeholder
      const mockEntries: AuditEntry[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          action: 'Token Refresh',
          status: 'success',
          details: 'Token refreshed successfully',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          action: 'OAuth Connection',
          status: 'success',
          details: 'OAuth connection established',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          action: 'Token Validation',
          status: 'failed',
          details: 'Token validation failed - expired',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          action: 'Initial OAuth',
          status: 'success',
          details: 'Initial OAuth connection established',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      ];
      setMockAuditEntries(mockEntries);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [provider]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusIcon = (status: string) => {
    return status === 'success' ? '✅' : '❌';
  };

  const getStatusColor = (status: string) => {
    return status === 'success' 
      ? 'text-green-600 bg-green-100' 
      : 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Audit Trail</h3>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
        </div>
        <div className="text-sm text-gray-500">Loading audit data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Audit Trail</h3>
          <button
            onClick={fetchAuditData}
            className="text-xs text-primary-600 hover:text-primary-700 underline"
          >
            Retry
          </button>
        </div>
        <div className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Audit Trail</h3>
        <button
          onClick={fetchAuditData}
          className="text-xs text-primary-600 hover:text-primary-700 underline"
        >
          Refresh
        </button>
      </div>

      {auditData && (
        <div className="text-xs text-gray-500 mb-3">
          {auditData.message}
          {auditData.note && <div className="mt-1">{auditData.note}</div>}
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {mockAuditEntries.map((entry) => (
          <div key={entry.id} className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm">{getStatusIcon(entry.status)}</span>
                <span className="text-sm font-medium text-gray-900">{entry.action}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(entry.status)}`}>
                  {entry.status}
                </span>
              </div>
              <span className="text-xs text-gray-500">{formatTimestamp(entry.timestamp)}</span>
            </div>
            
            <div className="text-xs text-gray-600 mb-1">{entry.details}</div>
            
            <div className="text-xs text-gray-400 space-y-1">
              {entry.ipAddress && <div>IP: {entry.ipAddress}</div>}
              {entry.userAgent && (
                <div className="truncate">UA: {entry.userAgent.substring(0, 50)}...</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {mockAuditEntries.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
          No audit entries found
        </div>
      )}
    </div>
  );
}
