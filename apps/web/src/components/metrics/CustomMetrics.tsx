'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface CustomMetricsProps {
  organizationId?: string;
}

export default function CustomMetrics({ organizationId }: CustomMetricsProps) {
  const [metricDefinitions, setMetricDefinitions] = useState<any[]>([]);
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'definitions' | 'dashboards' | 'create'>('definitions');
  const [showCreateMetric, setShowCreateMetric] = useState(false);
  const [showCreateDashboard, setShowCreateDashboard] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<any>(null);

  const [metricForm, setMetricForm] = useState({
    name: '',
    description: '',
    type: 'counter' as 'counter' | 'gauge' | 'histogram' | 'summary',
    labels: [] as string[],
    unit: ''
  });

  const [dashboardForm, setDashboardForm] = useState({
    name: '',
    description: '',
    widgets: [] as any[]
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [definitionsResult, dashboardsResult] = await Promise.all([
        apiClient.getMetricDefinitions(),
        apiClient.getMetricDashboards(organizationId)
      ]);
      
      setMetricDefinitions(definitionsResult.metrics);
      setDashboards(dashboardsResult.dashboards);
    } catch (err: any) {
      console.error('Failed to load metrics data:', err);
      setError(err.message || 'Failed to load metrics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const handleCreateMetric = async () => {
    try {
      setLoading(true);
      
      const result = await apiClient.createCustomMetric({
        ...metricForm,
        organizationId
      });
      
      if (result.success) {
        setShowCreateMetric(false);
        setMetricForm({
          name: '',
          description: '',
          type: 'counter',
          labels: [],
          unit: ''
        });
        await loadData();
      }
    } catch (err: any) {
      console.error('Failed to create metric:', err);
      alert('Failed to create metric: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDashboard = async () => {
    try {
      setLoading(true);
      
      const result = await apiClient.createMetricDashboard({
        ...dashboardForm,
        organizationId,
        widgets: dashboardForm.widgets
      });
      
      if (result.success) {
        setShowCreateDashboard(false);
        setDashboardForm({
          name: '',
          description: '',
          widgets: []
        });
        await loadData();
      }
    } catch (err: any) {
      console.error('Failed to create dashboard:', err);
      alert('Failed to create dashboard: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDashboard = async (dashboardId: string) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) return;
    
    try {
      setLoading(true);
      
      const result = await apiClient.deleteMetricDashboard(dashboardId);
      
      if (result.success) {
        await loadData();
      }
    } catch (err: any) {
      console.error('Failed to delete dashboard:', err);
      alert('Failed to delete dashboard: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const addLabel = () => {
    setMetricForm(prev => ({ ...prev, labels: [...prev.labels, ''] }));
  };

  const updateLabel = (index: number, value: string) => {
    setMetricForm(prev => ({
      ...prev,
      labels: prev.labels.map((label, i) => i === index ? value : label)
    }));
  };

  const removeLabel = (index: number) => {
    setMetricForm(prev => ({
      ...prev,
      labels: prev.labels.filter((_, i) => i !== index)
    }));
  };

  const getMetricTypeIcon = (type: string): string => {
    switch (type) {
      case 'counter': return '🔢';
      case 'gauge': return '📊';
      case 'histogram': return '📈';
      case 'summary': return '📋';
      default: return '❓';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'system': return 'bg-blue-100 text-blue-800';
      case 'application': return 'bg-green-100 text-green-800';
      case 'business': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Metrics Data</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadData}
                className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Custom Metrics</h2>
          <p className="text-gray-600 mt-1">
            Manage metric definitions and create custom dashboards
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateMetric(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Metric
          </button>
          <button
            onClick={() => setShowCreateDashboard(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Dashboard
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { key: 'definitions', label: 'Metric Definitions', icon: '📊' },
            { key: 'dashboards', label: 'Dashboards', icon: '📈' },
            { key: 'create', label: 'Quick Create', icon: '⚡' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'definitions' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Available Metrics ({metricDefinitions.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metricDefinitions.map((metric, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getMetricTypeIcon(metric.type)}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{metric.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(metric.category)}`}>
                          {metric.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{metric.description}</p>
                  
                  {metric.labels.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Labels:</p>
                      <div className="flex flex-wrap gap-1">
                        {metric.labels.map((label: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {metric.unit && (
                    <div className="text-xs text-gray-500">
                      Unit: {metric.unit}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dashboards' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Custom Dashboards ({dashboards.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboards.map((dashboard) => (
                <div key={dashboard.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{dashboard.name}</h4>
                      {dashboard.description && (
                        <p className="text-sm text-gray-600">{dashboard.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedDashboard(dashboard)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteDashboard(dashboard.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Widgets:</span>
                      <span>{dashboard.widgetCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{new Date(dashboard.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Modified:</span>
                      <span>{new Date(dashboard.lastModified).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <h4 className="font-medium text-gray-900">Create Custom Metric</h4>
                    <p className="text-sm text-gray-600">Define a new metric to track</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateMetric(true)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Metric
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">📈</span>
                  <div>
                    <h4 className="font-medium text-gray-900">Create Dashboard</h4>
                    <p className="text-sm text-gray-600">Build a custom metrics dashboard</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateDashboard(true)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Metric Modal */}
      {showCreateMetric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Custom Metric</h2>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Metric Name</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={metricForm.name}
                    onChange={(e) => setMetricForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., user_registrations"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    className="input w-full"
                    value={metricForm.type}
                    onChange={(e) => setMetricForm(prev => ({ ...prev, type: e.target.value as any }))}
                  >
                    <option value="counter">Counter</option>
                    <option value="gauge">Gauge</option>
                    <option value="histogram">Histogram</option>
                    <option value="summary">Summary</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="input w-full"
                  rows={3}
                  value={metricForm.description}
                  onChange={(e) => setMetricForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this metric measures"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit (optional)</label>
                <input
                  type="text"
                  className="input w-full"
                  value={metricForm.unit}
                  onChange={(e) => setMetricForm(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="e.g., bytes, seconds, percentage"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Labels</label>
                <div className="space-y-2">
                  {metricForm.labels.map((label, index) => (
                    <div key={index} className="flex space-x-2 items-center">
                      <input
                        type="text"
                        className="input flex-1"
                        value={label}
                        onChange={(e) => updateLabel(index, e.target.value)}
                        placeholder="e.g., environment, service"
                      />
                      <button
                        onClick={() => removeLabel(index)}
                        className="btn-outline btn-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button onClick={addLabel} className="btn-secondary btn-sm">
                    Add Label
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateMetric(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateMetric}
                  className="btn-primary"
                  disabled={!metricForm.name || !metricForm.description}
                >
                  Create Metric
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Dashboard Modal */}
      {showCreateDashboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Dashboard</h2>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dashboard Name</label>
                <input
                  type="text"
                  className="input w-full"
                  value={dashboardForm.name}
                  onChange={(e) => setDashboardForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., System Performance Dashboard"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="input w-full"
                  rows={3}
                  value={dashboardForm.description}
                  onChange={(e) => setDashboardForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose of this dashboard"
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Widgets can be added after creating the dashboard. You'll be able to configure charts, gauges, and tables for your metrics.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateDashboard(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDashboard}
                  className="btn-primary"
                  disabled={!dashboardForm.name}
                >
                  Create Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
