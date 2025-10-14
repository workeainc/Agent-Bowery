'use client';

import { useState, useEffect } from 'react';

interface CRMConnection {
  id: string;
  name: string;
  type: 'salesforce' | 'hubspot' | 'pipedrive' | 'zoho' | 'custom';
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  apiKey?: string;
  apiUrl?: string;
  lastSync?: Date;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  fieldMappings: Array<{
    agentBoweryField: string;
    crmField: string;
    direction: 'import' | 'export' | 'bidirectional';
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface CRMSyncLog {
  id: string;
  connectionId: string;
  type: 'import' | 'export' | 'sync';
  status: 'success' | 'error' | 'partial';
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

interface CRMIntegrationProps {
  onConnectionUpdate?: (connection: CRMConnection) => void;
}

export default function CRMIntegration({ onConnectionUpdate }: CRMIntegrationProps) {
  const [connections, setConnections] = useState<CRMConnection[]>([]);
  const [syncLogs, setSyncLogs] = useState<CRMSyncLog[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<CRMConnection | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<CRMConnection | null>(null);
  const [syncingConnection, setSyncingConnection] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'salesforce' as CRMConnection['type'],
    apiKey: '',
    apiUrl: '',
    syncFrequency: 'daily' as CRMConnection['syncFrequency'],
    fieldMappings: [] as CRMConnection['fieldMappings']
  });

  // Mock data for demonstration
  const mockConnections: CRMConnection[] = [
    {
      id: '1',
      name: 'Salesforce Production',
      type: 'salesforce',
      status: 'connected',
      apiKey: 'sf_prod_key_***',
      apiUrl: 'https://company.salesforce.com',
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
      syncFrequency: 'hourly',
      fieldMappings: [
        { agentBoweryField: 'name', crmField: 'Name', direction: 'bidirectional' },
        { agentBoweryField: 'email', crmField: 'Email', direction: 'bidirectional' },
        { agentBoweryField: 'company', crmField: 'Company', direction: 'bidirectional' },
        { agentBoweryField: 'score', crmField: 'Lead_Score__c', direction: 'export' },
        { agentBoweryField: 'status', crmField: 'Status', direction: 'bidirectional' }
      ],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-20')
    },
    {
      id: '2',
      name: 'HubSpot Marketing',
      type: 'hubspot',
      status: 'connected',
      apiKey: 'hs_marketing_key_***',
      apiUrl: 'https://api.hubapi.com',
      lastSync: new Date(Date.now() - 4 * 60 * 60 * 1000),
      syncFrequency: 'daily',
      fieldMappings: [
        { agentBoweryField: 'name', crmField: 'firstname', direction: 'bidirectional' },
        { agentBoweryField: 'email', crmField: 'email', direction: 'bidirectional' },
        { agentBoweryField: 'company', crmField: 'company', direction: 'bidirectional' },
        { agentBoweryField: 'phone', crmField: 'phone', direction: 'bidirectional' },
        { agentBoweryField: 'source', crmField: 'hs_lead_source', direction: 'import' }
      ],
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-18')
    },
    {
      id: '3',
      name: 'Pipedrive Sales',
      type: 'pipedrive',
      status: 'error',
      apiKey: 'pd_sales_key_***',
      apiUrl: 'https://api.pipedrive.com',
      lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000),
      syncFrequency: 'daily',
      fieldMappings: [
        { agentBoweryField: 'name', crmField: 'name', direction: 'bidirectional' },
        { agentBoweryField: 'email', crmField: 'email', direction: 'bidirectional' },
        { agentBoweryField: 'company', crmField: 'org_name', direction: 'bidirectional' },
        { agentBoweryField: 'estimatedValue', crmField: 'value', direction: 'export' }
      ],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-19')
    }
  ];

  const mockSyncLogs: CRMSyncLog[] = [
    {
      id: '1',
      connectionId: '1',
      type: 'sync',
      status: 'success',
      recordsProcessed: 150,
      recordsSucceeded: 150,
      recordsFailed: 0,
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000)
    },
    {
      id: '2',
      connectionId: '2',
      type: 'import',
      status: 'partial',
      recordsProcessed: 75,
      recordsSucceeded: 70,
      recordsFailed: 5,
      startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 3 * 60 * 1000),
      errorMessage: '5 records failed due to invalid email format'
    },
    {
      id: '3',
      connectionId: '3',
      type: 'export',
      status: 'error',
      recordsProcessed: 0,
      recordsSucceeded: 0,
      recordsFailed: 0,
      startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      errorMessage: 'API authentication failed'
    }
  ];

  useEffect(() => {
    setConnections(mockConnections);
    setSyncLogs(mockSyncLogs);
  }, []);

  const handleCreateConnection = () => {
    const newConnection: CRMConnection = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      status: 'disconnected',
      apiKey: formData.apiKey,
      apiUrl: formData.apiUrl,
      syncFrequency: formData.syncFrequency,
      fieldMappings: formData.fieldMappings,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setConnections(prev => [newConnection, ...prev]);
    setShowCreateModal(false);
    resetForm();
    alert('CRM connection created successfully!');
  };

  const handleEditConnection = () => {
    if (!editingConnection) return;

    const updatedConnection: CRMConnection = {
      ...editingConnection,
      name: formData.name,
      type: formData.type,
      apiKey: formData.apiKey,
      apiUrl: formData.apiUrl,
      syncFrequency: formData.syncFrequency,
      fieldMappings: formData.fieldMappings,
      updatedAt: new Date()
    };

    setConnections(prev => prev.map(connection => 
      connection.id === editingConnection.id ? updatedConnection : connection
    ));
    setShowEditModal(false);
    setEditingConnection(null);
    resetForm();
    alert('CRM connection updated successfully!');
  };

  const handleDeleteConnection = (connectionId: string) => {
    if (!confirm('Are you sure you want to delete this CRM connection?')) {
      return;
    }
    setConnections(prev => prev.filter(connection => connection.id !== connectionId));
    alert('CRM connection deleted successfully!');
  };

  const handleTestConnection = async (connectionId: string) => {
    setConnections(prev => prev.map(connection => 
      connection.id === connectionId 
        ? { ...connection, status: 'syncing' }
        : connection
    ));

    // Simulate connection test
    setTimeout(() => {
      setConnections(prev => prev.map(connection => 
        connection.id === connectionId 
          ? { ...connection, status: 'connected', lastSync: new Date() }
          : connection
      ));
      alert('Connection test successful!');
    }, 2000);
  };

  const handleSyncConnection = async (connectionId: string) => {
    setSyncingConnection(connectionId);
    setConnections(prev => prev.map(connection => 
      connection.id === connectionId 
        ? { ...connection, status: 'syncing' }
        : connection
    ));

    // Simulate sync process
    setTimeout(() => {
      setConnections(prev => prev.map(connection => 
        connection.id === connectionId 
          ? { ...connection, status: 'connected', lastSync: new Date() }
          : connection
      ));
      setSyncingConnection(null);
      alert('Sync completed successfully!');
    }, 3000);
  };

  const handleConnectionSelect = (connection: CRMConnection) => {
    setSelectedConnection(connection);
  };

  const handleOpenEditModal = (connection: CRMConnection) => {
    setEditingConnection(connection);
    setFormData({
      name: connection.name,
      type: connection.type,
      apiKey: connection.apiKey || '',
      apiUrl: connection.apiUrl || '',
      syncFrequency: connection.syncFrequency,
      fieldMappings: connection.fieldMappings
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'salesforce',
      apiKey: '',
      apiUrl: '',
      syncFrequency: 'daily',
      fieldMappings: []
    });
  };

  const addFieldMapping = () => {
    setFormData(prev => ({
      ...prev,
      fieldMappings: [...prev.fieldMappings, { agentBoweryField: '', crmField: '', direction: 'bidirectional' }]
    }));
  };

  const removeFieldMapping = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fieldMappings: prev.fieldMappings.filter((_, i) => i !== index)
    }));
  };

  const updateFieldMapping = (index: number, field: keyof CRMConnection['fieldMappings'][0], value: any) => {
    setFormData(prev => ({
      ...prev,
      fieldMappings: prev.fieldMappings.map((mapping, i) => 
        i === index ? { ...mapping, [field]: value } : mapping
      )
    }));
  };

  const getCRMTypeOptions = () => [
    { value: 'salesforce', label: 'Salesforce', icon: '☁️' },
    { value: 'hubspot', label: 'HubSpot', icon: '🟠' },
    { value: 'pipedrive', label: 'Pipedrive', icon: '🔵' },
    { value: 'zoho', label: 'Zoho CRM', icon: '🟣' },
    { value: 'custom', label: 'Custom API', icon: '⚙️' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'disconnected': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'syncing': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCRMIcon = (type: string) => {
    const option = getCRMTypeOptions().find(opt => opt.value === type);
    return option?.icon || '📊';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFieldOptions = () => [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'company', label: 'Company' },
    { value: 'title', label: 'Title' },
    { value: 'source', label: 'Source' },
    { value: 'status', label: 'Status' },
    { value: 'score', label: 'Score' },
    { value: 'priority', label: 'Priority' },
    { value: 'estimatedValue', label: 'Estimated Value' },
    { value: 'notes', label: 'Notes' },
    { value: 'tags', label: 'Tags' }
  ];

  const getDirectionOptions = () => [
    { value: 'import', label: 'Import Only' },
    { value: 'export', label: 'Export Only' },
    { value: 'bidirectional', label: 'Bidirectional' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">CRM Integration</h2>
          <p className="text-gray-600 mt-1">
            Connect and sync with external CRM systems
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Add CRM Connection
        </button>
      </div>

      {/* CRM Connections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connections.map((connection) => (
          <div
            key={connection.id}
            className={`card cursor-pointer transition-all ${
              selectedConnection?.id === connection.id ? 'ring-2 ring-primary-500' : 'hover:shadow-lg'
            }`}
            onClick={() => handleConnectionSelect(connection)}
          >
            <div className="card-content">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                    {getCRMIcon(connection.type)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{connection.name}</h3>
                    <p className="text-sm text-gray-600">
                      {getCRMTypeOptions().find(opt => opt.value === connection.type)?.label}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(connection.status)}`}>
                    {connection.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Sync:</span>
                  <span className="font-medium text-gray-900">
                    {connection.lastSync ? formatDate(connection.lastSync) : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sync Frequency:</span>
                  <span className="font-medium text-gray-900">{connection.syncFrequency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Field Mappings:</span>
                  <span className="font-medium text-gray-900">{connection.fieldMappings.length}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestConnection(connection.id);
                  }}
                  className="btn-outline btn-sm flex-1"
                  disabled={connection.status === 'syncing'}
                >
                  {connection.status === 'syncing' ? 'Testing...' : 'Test'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSyncConnection(connection.id);
                  }}
                  className="btn-outline btn-sm"
                  disabled={connection.status === 'syncing' || syncingConnection === connection.id}
                >
                  {syncingConnection === connection.id ? 'Syncing...' : 'Sync'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditModal(connection);
                  }}
                  className="btn-outline btn-sm"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConnection(connection.id);
                  }}
                  className="btn-outline btn-sm text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sync Logs */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Sync Activity</h3>
          <p className="card-description">Latest synchronization logs</p>
        </div>
        <div className="card-content">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connection</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {syncLogs.map((log) => {
                  const connection = connections.find(c => c.id === log.connectionId);
                  const duration = log.completedAt ? 
                    Math.round((log.completedAt.getTime() - log.startedAt.getTime()) / 1000) : 
                    'In Progress';
                  
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getCRMIcon(connection?.type || 'custom')}</span>
                          <span className="text-sm font-medium text-gray-900">{connection?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{log.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSyncStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.recordsSucceeded}/{log.recordsProcessed}
                        {log.recordsFailed > 0 && (
                          <span className="text-red-600 ml-1">({log.recordsFailed} failed)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.startedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {typeof duration === 'number' ? `${duration}s` : duration}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Connection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add CRM Connection</h2>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Connection Name</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter connection name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CRM Type</label>
                  <select
                    className="input w-full"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as CRMConnection['type'] }))}
                  >
                    {getCRMTypeOptions().map(option => (
                      <option key={option.value} value={option.value}>{option.icon} {option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                  <input
                    type="password"
                    className="input w-full"
                    value={formData.apiKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter API key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API URL</label>
                  <input
                    type="url"
                    className="input w-full"
                    value={formData.apiUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiUrl: e.target.value }))}
                    placeholder="Enter API URL"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sync Frequency</label>
                <select
                  className="input w-full"
                  value={formData.syncFrequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, syncFrequency: e.target.value as CRMConnection['syncFrequency'] }))}
                >
                  <option value="realtime">Real-time</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Field Mappings</label>
                  <button
                    onClick={addFieldMapping}
                    className="btn-outline btn-sm"
                  >
                    Add Mapping
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.fieldMappings.map((mapping, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Agent Bowery Field</label>
                        <select
                          className="input w-full"
                          value={mapping.agentBoweryField}
                          onChange={(e) => updateFieldMapping(index, 'agentBoweryField', e.target.value)}
                        >
                          {getFieldOptions().map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">CRM Field</label>
                        <input
                          type="text"
                          className="input w-full"
                          value={mapping.crmField}
                          onChange={(e) => updateFieldMapping(index, 'crmField', e.target.value)}
                          placeholder="Enter CRM field name"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Direction</label>
                        <select
                          className="input w-full"
                          value={mapping.direction}
                          onChange={(e) => updateFieldMapping(index, 'direction', e.target.value)}
                        >
                          {getDirectionOptions().map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => removeFieldMapping(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {formData.fieldMappings.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🔗</div>
                      <p>No field mappings defined. Click "Add Mapping" to get started.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateConnection}
                  className="btn-primary"
                  disabled={!formData.name || !formData.apiKey}
                >
                  Create Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Connection Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit CRM Connection</h2>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Same form fields as create modal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Connection Name</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter connection name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CRM Type</label>
                  <select
                    className="input w-full"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as CRMConnection['type'] }))}
                  >
                    {getCRMTypeOptions().map(option => (
                      <option key={option.value} value={option.value}>{option.icon} {option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                  <input
                    type="password"
                    className="input w-full"
                    value={formData.apiKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter API key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API URL</label>
                  <input
                    type="url"
                    className="input w-full"
                    value={formData.apiUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiUrl: e.target.value }))}
                    placeholder="Enter API URL"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sync Frequency</label>
                <select
                  className="input w-full"
                  value={formData.syncFrequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, syncFrequency: e.target.value as CRMConnection['syncFrequency'] }))}
                >
                  <option value="realtime">Real-time</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              {/* Field Mappings section - same as create modal */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Field Mappings</label>
                  <button
                    onClick={addFieldMapping}
                    className="btn-outline btn-sm"
                  >
                    Add Mapping
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.fieldMappings.map((mapping, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Agent Bowery Field</label>
                        <select
                          className="input w-full"
                          value={mapping.agentBoweryField}
                          onChange={(e) => updateFieldMapping(index, 'agentBoweryField', e.target.value)}
                        >
                          {getFieldOptions().map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">CRM Field</label>
                        <input
                          type="text"
                          className="input w-full"
                          value={mapping.crmField}
                          onChange={(e) => updateFieldMapping(index, 'crmField', e.target.value)}
                          placeholder="Enter CRM field name"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Direction</label>
                        <select
                          className="input w-full"
                          value={mapping.direction}
                          onChange={(e) => updateFieldMapping(index, 'direction', e.target.value)}
                        >
                          {getDirectionOptions().map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => removeFieldMapping(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingConnection(null);
                    resetForm();
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditConnection}
                  className="btn-primary"
                  disabled={!formData.name || !formData.apiKey}
                >
                  Update Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
