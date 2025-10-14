'use client';

import { useState, useEffect } from 'react';

interface SystemConfig {
  id: string;
  category: string;
  name: string;
  description: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea';
  options?: string[];
  isRequired: boolean;
  isActive: boolean;
  updatedAt: Date;
  updatedBy: string;
}

interface SystemConfigurationProps {
  onConfigChange?: (config: SystemConfig) => void;
}

export default function SystemConfiguration({ onConfigChange }: SystemConfigurationProps) {
  const [systemConfigs, setSystemConfigs] = useState<SystemConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<SystemConfig | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'updated'>('name');
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    description: '',
    value: '',
    type: 'string' as SystemConfig['type'],
    options: [] as string[],
    isRequired: false,
    isActive: true
  });

  // Mock data for demonstration
  const mockSystemConfigs: SystemConfig[] = [
    {
      id: '1',
      category: 'General',
      name: 'site_name',
      description: 'The name of the application',
      value: 'Agent Bowery',
      type: 'string',
      isRequired: true,
      isActive: true,
      updatedAt: new Date('2024-01-20'),
      updatedBy: 'Admin User'
    },
    {
      id: '2',
      category: 'General',
      name: 'site_description',
      description: 'Description of the application',
      value: 'AI-powered content management and social media automation platform',
      type: 'textarea',
      isRequired: false,
      isActive: true,
      updatedAt: new Date('2024-01-19'),
      updatedBy: 'Admin User'
    },
    {
      id: '3',
      category: 'General',
      name: 'maintenance_mode',
      description: 'Enable maintenance mode for the application',
      value: false,
      type: 'boolean',
      isRequired: false,
      isActive: true,
      updatedAt: new Date('2024-01-18'),
      updatedBy: 'Admin User'
    },
    {
      id: '4',
      category: 'API',
      name: 'api_rate_limit',
      description: 'Maximum API requests per minute',
      value: 1000,
      type: 'number',
      isRequired: true,
      isActive: true,
      updatedAt: new Date('2024-01-17'),
      updatedBy: 'Admin User'
    },
    {
      id: '5',
      category: 'API',
      name: 'api_timeout',
      description: 'API request timeout in seconds',
      value: 30,
      type: 'number',
      isRequired: true,
      isActive: true,
      updatedAt: new Date('2024-01-16'),
      updatedBy: 'Admin User'
    },
    {
      id: '6',
      category: 'API',
      name: 'api_version',
      description: 'Current API version',
      value: 'v1',
      type: 'select',
      options: ['v1', 'v2', 'v3'],
      isRequired: true,
      isActive: true,
      updatedAt: new Date('2024-01-15'),
      updatedBy: 'Admin User'
    },
    {
      id: '7',
      category: 'Email',
      name: 'smtp_host',
      description: 'SMTP server hostname',
      value: 'smtp.gmail.com',
      type: 'string',
      isRequired: true,
      isActive: true,
      updatedAt: new Date('2024-01-14'),
      updatedBy: 'Admin User'
    },
    {
      id: '8',
      category: 'Email',
      name: 'smtp_port',
      description: 'SMTP server port',
      value: 587,
      type: 'number',
      isRequired: true,
      isActive: true,
      updatedAt: new Date('2024-01-13'),
      updatedBy: 'Admin User'
    },
    {
      id: '9',
      category: 'Email',
      name: 'email_enabled',
      description: 'Enable email notifications',
      value: true,
      type: 'boolean',
      isRequired: false,
      isActive: true,
      updatedAt: new Date('2024-01-12'),
      updatedBy: 'Admin User'
    },
    {
      id: '10',
      category: 'Security',
      name: 'password_min_length',
      description: 'Minimum password length',
      value: 8,
      type: 'number',
      isRequired: true,
      isActive: true,
      updatedAt: new Date('2024-01-11'),
      updatedBy: 'Admin User'
    },
    {
      id: '11',
      category: 'Security',
      name: 'session_timeout',
      description: 'Session timeout in minutes',
      value: 60,
      type: 'number',
      isRequired: true,
      isActive: true,
      updatedAt: new Date('2024-01-10'),
      updatedBy: 'Admin User'
    },
    {
      id: '12',
      category: 'Security',
      name: 'two_factor_enabled',
      description: 'Enable two-factor authentication',
      value: true,
      type: 'boolean',
      isRequired: false,
      isActive: true,
      updatedAt: new Date('2024-01-09'),
      updatedBy: 'Admin User'
    },
    {
      id: '13',
      category: 'Storage',
      name: 'max_file_size',
      description: 'Maximum file upload size in MB',
      value: 10,
      type: 'number',
      isRequired: true,
      isActive: true,
      updatedAt: new Date('2024-01-08'),
      updatedBy: 'Admin User'
    },
    {
      id: '14',
      category: 'Storage',
      name: 'allowed_file_types',
      description: 'Comma-separated list of allowed file types',
      value: 'jpg,jpeg,png,gif,pdf,doc,docx,txt',
      type: 'string',
      isRequired: true,
      isActive: true,
      updatedAt: new Date('2024-01-07'),
      updatedBy: 'Admin User'
    },
    {
      id: '15',
      category: 'Analytics',
      name: 'analytics_enabled',
      description: 'Enable analytics tracking',
      value: true,
      type: 'boolean',
      isRequired: false,
      isActive: true,
      updatedAt: new Date('2024-01-06'),
      updatedBy: 'Admin User'
    },
    {
      id: '16',
      category: 'Analytics',
      name: 'analytics_retention_days',
      description: 'Number of days to retain analytics data',
      value: 365,
      type: 'number',
      isRequired: true,
      isActive: true,
      updatedAt: new Date('2024-01-05'),
      updatedBy: 'Admin User'
    }
  ];

  useEffect(() => {
    setSystemConfigs(mockSystemConfigs);
  }, []);

  const handleCreateConfig = () => {
    const newConfig: SystemConfig = {
      id: Date.now().toString(),
      category: formData.category,
      name: formData.name,
      description: formData.description,
      value: formData.value,
      type: formData.type,
      options: formData.options,
      isRequired: formData.isRequired,
      isActive: formData.isActive,
      updatedAt: new Date(),
      updatedBy: 'Current User'
    };

    setSystemConfigs(prev => [newConfig, ...prev]);
    setShowCreateModal(false);
    resetForm();
    alert('System configuration created successfully!');
  };

  const handleEditConfig = () => {
    if (!editingConfig) return;

    const updatedConfig: SystemConfig = {
      ...editingConfig,
      category: formData.category,
      name: formData.name,
      description: formData.description,
      value: formData.value,
      type: formData.type,
      options: formData.options,
      isRequired: formData.isRequired,
      isActive: formData.isActive,
      updatedAt: new Date(),
      updatedBy: 'Current User'
    };

    setSystemConfigs(prev => prev.map(config => 
      config.id === editingConfig.id ? updatedConfig : config
    ));
    setShowEditModal(false);
    setEditingConfig(null);
    resetForm();
    alert('System configuration updated successfully!');
  };

  const handleDeleteConfig = (configId: string) => {
    if (!confirm('Are you sure you want to delete this system configuration?')) {
      return;
    }
    setSystemConfigs(prev => prev.filter(config => config.id !== configId));
    alert('System configuration deleted successfully!');
  };

  const handleToggleActive = (configId: string) => {
    setSystemConfigs(prev => prev.map(config => 
      config.id === configId 
        ? { ...config, isActive: !config.isActive, updatedAt: new Date(), updatedBy: 'Current User' }
        : config
    ));
  };

  const handleConfigSelect = (config: SystemConfig) => {
    setSelectedConfig(config);
    if (onConfigChange) {
      onConfigChange(config);
    }
  };

  const handleOpenEditModal = (config: SystemConfig) => {
    setEditingConfig(config);
    setFormData({
      category: config.category,
      name: config.name,
      description: config.description,
      value: config.value.toString(),
      type: config.type,
      options: config.options || [],
      isRequired: config.isRequired,
      isActive: config.isActive
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      category: '',
      name: '',
      description: '',
      value: '',
      type: 'string',
      options: [],
      isRequired: false,
      isActive: true
    });
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  const filteredConfigs = systemConfigs.filter(config => {
    const matchesSearch = searchQuery === '' || 
      config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || config.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedConfigs = [...filteredConfigs].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'category':
        return a.category.localeCompare(b.category);
      case 'updated':
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      default:
        return 0;
    }
  });

  const getCategoryOptions = () => [
    'General', 'API', 'Email', 'Security', 'Storage', 'Analytics', 'Database', 'Cache', 'Logging'
  ];

  const getTypeOptions = () => [
    { value: 'string', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'select', label: 'Select' },
    { value: 'textarea', label: 'Text Area' }
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'General': return '⚙️';
      case 'API': return '🔌';
      case 'Email': return '📧';
      case 'Security': return '🔒';
      case 'Storage': return '💾';
      case 'Analytics': return '📊';
      case 'Database': return '🗄️';
      case 'Cache': return '⚡';
      case 'Logging': return '📝';
      default: return '🔧';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'string': return '📝';
      case 'number': return '🔢';
      case 'boolean': return '✅';
      case 'select': return '📋';
      case 'textarea': return '📄';
      default: return '❓';
    }
  };

  const renderValue = (config: SystemConfig) => {
    switch (config.type) {
      case 'boolean':
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            config.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {config.value ? 'Enabled' : 'Disabled'}
          </span>
        );
      case 'number':
        return <span className="font-mono text-sm">{config.value}</span>;
      case 'select':
        return <span className="text-sm">{config.value}</span>;
      case 'textarea':
        return (
          <div className="text-sm text-gray-600 max-w-xs truncate">
            {config.value.toString().substring(0, 50)}
            {config.value.toString().length > 50 && '...'}
          </div>
        );
      default:
        return <span className="text-sm">{config.value}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">System Configuration</h2>
          <p className="text-gray-600 mt-1">
            Manage system settings and configuration parameters
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Add Configuration
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <input
                type="text"
                placeholder="Search configurations..."
                className="input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="input"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {getCategoryOptions().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                className="input"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="name">Sort by Name</option>
                <option value="category">Sort by Category</option>
                <option value="updated">Sort by Updated</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {sortedConfigs.length} of {systemConfigs.length} configurations
            </div>
          </div>
        </div>
      </div>

      {/* System Configurations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedConfigs.map((config) => (
          <div
            key={config.id}
            className={`card cursor-pointer transition-all ${
              selectedConfig?.id === config.id ? 'ring-2 ring-primary-500' : 'hover:shadow-lg'
            }`}
            onClick={() => handleConfigSelect(config)}
          >
            <div className="card-content">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                    {getCategoryIcon(config.category)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{config.name}</h3>
                    <p className="text-sm text-gray-600">{config.category}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getTypeIcon(config.type)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(config.id);
                    }}
                    className={`w-3 h-3 rounded-full ${
                      config.isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    title={config.isActive ? 'Active' : 'Inactive'}
                  />
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{config.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900 capitalize">{config.type}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Required:</span>
                  <span className={`font-medium ${config.isRequired ? 'text-red-600' : 'text-gray-900'}`}>
                    {config.isRequired ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Updated:</span>
                  <span className="font-medium text-gray-900">{formatDate(config.updatedAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Updated By:</span>
                  <span className="font-medium text-gray-900">{config.updatedBy}</span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2">Current Value:</p>
                <div className="p-2 bg-gray-50 rounded-lg">
                  {renderValue(config)}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditModal(config);
                  }}
                  className="btn-outline btn-sm flex-1"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConfig(config.id);
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

      {/* Create Configuration Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add System Configuration</h2>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    className="input w-full"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">Select category</option>
                    {getCategoryOptions().map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    className="input w-full"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as SystemConfig['type'] }))}
                  >
                    {getTypeOptions().map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Configuration Name</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter configuration name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="input w-full"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter configuration description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Value</label>
                {formData.type === 'textarea' ? (
                  <textarea
                    className="input w-full"
                    rows={4}
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Enter default value"
                  />
                ) : formData.type === 'boolean' ? (
                  <select
                    className="input w-full"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value === 'true' }))}
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : (
                  <input
                    type={formData.type === 'number' ? 'number' : 'text'}
                    className="input w-full"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Enter default value"
                  />
                )}
              </div>

              {formData.type === 'select' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">Options</label>
                    <button
                      onClick={addOption}
                      className="btn-outline btn-sm"
                    >
                      Add Option
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          className="input flex-1"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder="Option value"
                        />
                        <button
                          onClick={() => removeOption(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {formData.options.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <div className="text-2xl mb-1">📋</div>
                        <p className="text-sm">No options defined. Click "Add Option" to get started.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isRequired"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={formData.isRequired}
                    onChange={(e) => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
                  />
                  <label htmlFor="isRequired" className="ml-2 block text-sm text-gray-700">
                    Required configuration
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Configuration is active
                  </label>
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
                  onClick={handleCreateConfig}
                  className="btn-primary"
                  disabled={!formData.name || !formData.category}
                >
                  Add Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Configuration Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit System Configuration</h2>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Same form fields as create modal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    className="input w-full"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">Select category</option>
                    {getCategoryOptions().map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    className="input w-full"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as SystemConfig['type'] }))}
                  >
                    {getTypeOptions().map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Configuration Name</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter configuration name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="input w-full"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter configuration description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                {formData.type === 'textarea' ? (
                  <textarea
                    className="input w-full"
                    rows={4}
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Enter value"
                  />
                ) : formData.type === 'boolean' ? (
                  <select
                    className="input w-full"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value === 'true' }))}
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : (
                  <input
                    type={formData.type === 'number' ? 'number' : 'text'}
                    className="input w-full"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Enter value"
                  />
                )}
              </div>

              {formData.type === 'select' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">Options</label>
                    <button
                      onClick={addOption}
                      className="btn-outline btn-sm"
                    >
                      Add Option
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          className="input flex-1"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder="Option value"
                        />
                        <button
                          onClick={() => removeOption(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isRequiredEdit"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={formData.isRequired}
                    onChange={(e) => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
                  />
                  <label htmlFor="isRequiredEdit" className="ml-2 block text-sm text-gray-700">
                    Required configuration
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActiveEdit"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <label htmlFor="isActiveEdit" className="ml-2 block text-sm text-gray-700">
                    Configuration is active
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingConfig(null);
                    resetForm();
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditConfig}
                  className="btn-primary"
                  disabled={!formData.name || !formData.category}
                >
                  Update Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
