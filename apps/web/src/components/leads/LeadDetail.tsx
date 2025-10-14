'use client';

import { useState, useEffect } from 'react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'archived';
  score: number;
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  lastContact?: Date;
  nextFollowUp?: Date;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedValue?: number;
  conversionProbability?: number;
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  customFields?: Record<string, any>;
}

interface LeadDetailProps {
  lead: Lead;
  onLeadUpdate?: (lead: Lead) => void;
  onLeadDelete?: (leadId: string) => void;
}

export default function LeadDetail({ lead, onLeadUpdate, onLeadDelete }: LeadDetailProps) {
  const [editingLead, setEditingLead] = useState<Lead>(lead);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'notes' | 'documents' | 'settings'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    setEditingLead(lead);
  }, [lead]);

  const handleSave = () => {
    if (onLeadUpdate) {
      onLeadUpdate(editingLead);
    }
    setIsEditing(false);
    alert('Lead updated successfully!');
  };

  const handleCancel = () => {
    setEditingLead(lead);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onLeadDelete) {
      onLeadDelete(lead.id);
    }
    setShowDeleteModal(false);
  };

  const handleFieldChange = (field: keyof Lead, value: any) => {
    setEditingLead(prev => ({
      ...prev,
      [field]: value,
      updatedAt: new Date()
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-blue-600 bg-blue-100';
      case 'contacted': return 'text-yellow-600 bg-yellow-100';
      case 'qualified': return 'text-green-600 bg-green-100';
      case 'converted': return 'text-purple-600 bg-purple-100';
      case 'archived': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="card mb-6">
        <div className="card-content">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-700">
                  {getInitials(editingLead.name)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{editingLead.name}</h1>
                <p className="text-gray-600">{editingLead.title} at {editingLead.company}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(editingLead.status)}`}>
                    {editingLead.status}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(editingLead.priority)}`}>
                    {editingLead.priority}
                  </span>
                  <span className={`text-sm font-medium ${getScoreColor(editingLead.score)}`}>
                    Score: {editingLead.score}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <button onClick={handleSave} className="btn-primary">
                    Save
                  </button>
                  <button onClick={handleCancel} className="btn-outline">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsEditing(true)} className="btn-outline">
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="btn-outline text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'activity', label: 'Activity' },
            { key: 'notes', label: 'Notes' },
            { key: 'documents', label: 'Documents' },
            { key: 'settings', label: 'Settings' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Information */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Contact Information</h3>
              </div>
              <div className="card-content">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="input w-full"
                          value={editingLead.name}
                          onChange={(e) => handleFieldChange('name', e.target.value)}
                        />
                      ) : (
                        <p className="text-sm text-gray-900">{editingLead.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          className="input w-full"
                          value={editingLead.email}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                        />
                      ) : (
                        <p className="text-sm text-gray-900">{editingLead.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          className="input w-full"
                          value={editingLead.phone || ''}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                        />
                      ) : (
                        <p className="text-sm text-gray-900">{editingLead.phone || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="input w-full"
                          value={editingLead.company || ''}
                          onChange={(e) => handleFieldChange('company', e.target.value)}
                        />
                      ) : (
                        <p className="text-sm text-gray-900">{editingLead.company || 'N/A'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="input w-full"
                          value={editingLead.title || ''}
                          onChange={(e) => handleFieldChange('title', e.target.value)}
                        />
                      ) : (
                        <p className="text-sm text-gray-900">{editingLead.title || 'N/A'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                      {isEditing ? (
                        <select
                          className="input w-full"
                          value={editingLead.source}
                          onChange={(e) => handleFieldChange('source', e.target.value)}
                        >
                          <option value="Website">Website</option>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="Facebook">Facebook</option>
                          <option value="Referral">Referral</option>
                          <option value="Conference">Conference</option>
                        </select>
                      ) : (
                        <p className="text-sm text-gray-900">{editingLead.source}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            {editingLead.address && (
              <div className="card mt-6">
                <div className="card-header">
                  <h3 className="card-title">Address</h3>
                </div>
                <div className="card-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                      <p className="text-sm text-gray-900">{editingLead.address.street || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <p className="text-sm text-gray-900">{editingLead.address.city || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <p className="text-sm text-gray-900">{editingLead.address.state || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                      <p className="text-sm text-gray-900">{editingLead.address.zip || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Social Profiles */}
            {editingLead.socialProfiles && (
              <div className="card mt-6">
                <div className="card-header">
                  <h3 className="card-title">Social Profiles</h3>
                </div>
                <div className="card-content">
                  <div className="space-y-3">
                    {editingLead.socialProfiles.linkedin && (
                      <div className="flex items-center space-x-3">
                        <span className="text-blue-600">💼</span>
                        <a href={editingLead.socialProfiles.linkedin} className="text-sm text-blue-600 hover:text-blue-800">
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                    {editingLead.socialProfiles.twitter && (
                      <div className="flex items-center space-x-3">
                        <span className="text-blue-400">🐦</span>
                        <a href={editingLead.socialProfiles.twitter} className="text-sm text-blue-600 hover:text-blue-800">
                          Twitter Profile
                        </a>
                      </div>
                    )}
                    {editingLead.socialProfiles.facebook && (
                      <div className="flex items-center space-x-3">
                        <span className="text-blue-600">📘</span>
                        <a href={editingLead.socialProfiles.facebook} className="text-sm text-blue-600 hover:text-blue-800">
                          Facebook Profile
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lead Details Sidebar */}
          <div className="space-y-6">
            {/* Lead Status */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Lead Status</h3>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    {isEditing ? (
                      <select
                        className="input w-full"
                        value={editingLead.status}
                        onChange={(e) => handleFieldChange('status', e.target.value)}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="converted">Converted</option>
                        <option value="archived">Archived</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(editingLead.status)}`}>
                        {editingLead.status}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    {isEditing ? (
                      <select
                        className="input w-full"
                        value={editingLead.priority}
                        onChange={(e) => handleFieldChange('priority', e.target.value)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(editingLead.priority)}`}>
                        {editingLead.priority}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="input w-full"
                        value={editingLead.score}
                        onChange={(e) => handleFieldChange('score', parseInt(e.target.value))}
                      />
                    ) : (
                      <span className={`text-lg font-bold ${getScoreColor(editingLead.score)}`}>
                        {editingLead.score}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Financial Information</h3>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Value</label>
                    {isEditing ? (
                      <input
                        type="number"
                        className="input w-full"
                        value={editingLead.estimatedValue || ''}
                        onChange={(e) => handleFieldChange('estimatedValue', parseInt(e.target.value) || 0)}
                      />
                    ) : (
                      <p className="text-lg font-bold text-gray-900">
                        {editingLead.estimatedValue ? formatCurrency(editingLead.estimatedValue) : 'N/A'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Conversion Probability</label>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="input w-full"
                        value={editingLead.conversionProbability || ''}
                        onChange={(e) => handleFieldChange('conversionProbability', parseInt(e.target.value) || 0)}
                      />
                    ) : (
                      <p className="text-lg font-bold text-gray-900">
                        {editingLead.conversionProbability || 0}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Timeline</h3>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="text-sm text-gray-900">{formatDate(editingLead.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Contact</label>
                    <p className="text-sm text-gray-900">
                      {editingLead.lastContact ? formatDate(editingLead.lastContact) : 'Never'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Next Follow-up</label>
                    <p className="text-sm text-gray-900">
                      {editingLead.nextFollowUp ? formatDate(editingLead.nextFollowUp) : 'Not scheduled'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                    <p className="text-sm text-gray-900">{editingLead.assignedTo || 'Unassigned'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Tags</h3>
              </div>
              <div className="card-content">
                <div className="flex flex-wrap gap-2">
                  {editingLead.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Activity Timeline</h3>
          </div>
          <div className="card-content">
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📅</div>
              <p>Activity timeline will be implemented here</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Notes</h3>
          </div>
          <div className="card-content">
            {isEditing ? (
              <textarea
                className="input w-full h-32"
                value={editingLead.notes || ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="Add notes about this lead..."
              />
            ) : (
              <p className="text-sm text-gray-900">{editingLead.notes || 'No notes available'}</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Documents</h3>
          </div>
          <div className="card-content">
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📄</div>
              <p>Document management will be implemented here</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Lead Settings</h3>
          </div>
          <div className="card-content">
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">⚙️</div>
              <p>Lead settings will be implemented here</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Delete Lead</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this lead? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="btn-primary bg-red-600 hover:bg-red-700"
                >
                  Delete Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
