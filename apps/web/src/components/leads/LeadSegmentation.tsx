'use client';

import { useState, useEffect } from 'react';

interface SegmentCriteria {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: string | number | string[];
}

interface LeadSegment {
  id: string;
  name: string;
  description?: string;
  criteria: SegmentCriteria[];
  leadCount: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  color: string;
  tags: string[];
}

interface LeadSegmentationProps {
  onSegmentSelect?: (segment: LeadSegment) => void;
}

export default function LeadSegmentation({ onSegmentSelect }: LeadSegmentationProps) {
  const [segments, setSegments] = useState<LeadSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<LeadSegment | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState<LeadSegment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: [] as SegmentCriteria[],
    color: '#3B82F6',
    tags: [] as string[]
  });

  // Mock data for demonstration
  const mockSegments: LeadSegment[] = [
    {
      id: '1',
      name: 'Hot Leads',
      description: 'High-scoring leads with recent activity',
      criteria: [
        { field: 'score', operator: 'greater_than', value: 80 },
        { field: 'status', operator: 'in', value: ['qualified', 'contacted'] },
        { field: 'lastContact', operator: 'greater_than', value: '7 days ago' }
      ],
      leadCount: 12,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-20'),
      isActive: true,
      color: '#EF4444',
      tags: ['priority', 'sales']
    },
    {
      id: '2',
      name: 'Enterprise Prospects',
      description: 'Large companies with high estimated value',
      criteria: [
        { field: 'company', operator: 'contains', value: 'Inc' },
        { field: 'estimatedValue', operator: 'greater_than', value: 50000 },
        { field: 'title', operator: 'in', value: ['CEO', 'CTO', 'VP', 'Director'] }
      ],
      leadCount: 8,
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-18'),
      isActive: true,
      color: '#8B5CF6',
      tags: ['enterprise', 'high-value']
    },
    {
      id: '3',
      name: 'Cold Leads',
      description: 'Leads that haven\'t been contacted recently',
      criteria: [
        { field: 'status', operator: 'equals', value: 'new' },
        { field: 'lastContact', operator: 'less_than', value: '30 days ago' },
        { field: 'score', operator: 'less_than', value: 50 }
      ],
      leadCount: 25,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-19'),
      isActive: true,
      color: '#6B7280',
      tags: ['follow-up', 'nurturing']
    },
    {
      id: '4',
      name: 'LinkedIn Leads',
      description: 'Leads sourced from LinkedIn',
      criteria: [
        { field: 'source', operator: 'equals', value: 'LinkedIn' },
        { field: 'status', operator: 'not_equals', value: 'converted' }
      ],
      leadCount: 18,
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-21'),
      isActive: true,
      color: '#0077B5',
      tags: ['linkedin', 'social']
    },
    {
      id: '5',
      name: 'High Priority',
      description: 'Urgent leads requiring immediate attention',
      criteria: [
        { field: 'priority', operator: 'equals', value: 'urgent' },
        { field: 'status', operator: 'not_equals', value: 'converted' }
      ],
      leadCount: 5,
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-21'),
      isActive: true,
      color: '#F59E0B',
      tags: ['urgent', 'priority']
    }
  ];

  useEffect(() => {
    setSegments(mockSegments);
  }, []);

  const handleCreateSegment = () => {
    const newSegment: LeadSegment = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      criteria: formData.criteria,
      leadCount: 0, // Would be calculated based on criteria
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      color: formData.color,
      tags: formData.tags
    };

    setSegments(prev => [newSegment, ...prev]);
    setShowCreateModal(false);
    resetForm();
    alert('Segment created successfully!');
  };

  const handleEditSegment = () => {
    if (!editingSegment) return;

    const updatedSegment: LeadSegment = {
      ...editingSegment,
      name: formData.name,
      description: formData.description,
      criteria: formData.criteria,
      color: formData.color,
      tags: formData.tags,
      updatedAt: new Date()
    };

    setSegments(prev => prev.map(segment => 
      segment.id === editingSegment.id ? updatedSegment : segment
    ));
    setShowEditModal(false);
    setEditingSegment(null);
    resetForm();
    alert('Segment updated successfully!');
  };

  const handleDeleteSegment = (segmentId: string) => {
    if (!confirm('Are you sure you want to delete this segment?')) {
      return;
    }
    setSegments(prev => prev.filter(segment => segment.id !== segmentId));
    alert('Segment deleted successfully!');
  };

  const handleToggleActive = (segmentId: string) => {
    setSegments(prev => prev.map(segment => 
      segment.id === segmentId 
        ? { ...segment, isActive: !segment.isActive, updatedAt: new Date() }
        : segment
    ));
  };

  const handleSegmentSelect = (segment: LeadSegment) => {
    setSelectedSegment(segment);
    if (onSegmentSelect) {
      onSegmentSelect(segment);
    }
  };

  const handleOpenEditModal = (segment: LeadSegment) => {
    setEditingSegment(segment);
    setFormData({
      name: segment.name,
      description: segment.description || '',
      criteria: segment.criteria,
      color: segment.color,
      tags: segment.tags
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      criteria: [],
      color: '#3B82F6',
      tags: []
    });
  };

  const addCriterion = () => {
    setFormData(prev => ({
      ...prev,
      criteria: [...prev.criteria, { field: 'score', operator: 'equals', value: '' }]
    }));
  };

  const removeCriterion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index)
    }));
  };

  const updateCriterion = (index: number, field: keyof SegmentCriteria, value: any) => {
    setFormData(prev => ({
      ...prev,
      criteria: prev.criteria.map((criterion, i) => 
        i === index ? { ...criterion, [field]: value } : criterion
      )
    }));
  };

  const getFieldOptions = () => [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'company', label: 'Company' },
    { value: 'title', label: 'Title' },
    { value: 'source', label: 'Source' },
    { value: 'status', label: 'Status' },
    { value: 'score', label: 'Score' },
    { value: 'priority', label: 'Priority' },
    { value: 'estimatedValue', label: 'Estimated Value' },
    { value: 'lastContact', label: 'Last Contact' },
    { value: 'createdAt', label: 'Created Date' }
  ];

  const getOperatorOptions = () => [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Not Contains' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'in', label: 'In' },
    { value: 'not_in', label: 'Not In' }
  ];

  const getStatusOptions = () => [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'converted', label: 'Converted' },
    { value: 'archived', label: 'Archived' }
  ];

  const getPriorityOptions = () => [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const getSourceOptions = () => [
    { value: 'Website', label: 'Website' },
    { value: 'LinkedIn', label: 'LinkedIn' },
    { value: 'Facebook', label: 'Facebook' },
    { value: 'Referral', label: 'Referral' },
    { value: 'Conference', label: 'Conference' }
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSegmentIcon = (segment: LeadSegment) => {
    if (segment.name.includes('Hot')) return '🔥';
    if (segment.name.includes('Enterprise')) return '🏢';
    if (segment.name.includes('Cold')) return '❄️';
    if (segment.name.includes('LinkedIn')) return '💼';
    if (segment.name.includes('Priority')) return '⚡';
    return '📊';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Lead Segmentation</h2>
          <p className="text-gray-600 mt-1">
            Create and manage lead segments for targeted campaigns
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Create Segment
        </button>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className={`card cursor-pointer transition-all ${
              selectedSegment?.id === segment.id ? 'ring-2 ring-primary-500' : 'hover:shadow-lg'
            }`}
            onClick={() => handleSegmentSelect(segment)}
          >
            <div className="card-content">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                    style={{ backgroundColor: segment.color }}
                  >
                    {getSegmentIcon(segment)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{segment.name}</h3>
                    <p className="text-sm text-gray-600">{segment.leadCount} leads</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(segment.id);
                    }}
                    className={`w-3 h-3 rounded-full ${
                      segment.isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    title={segment.isActive ? 'Active' : 'Inactive'}
                  />
                </div>
              </div>

              {segment.description && (
                <p className="text-sm text-gray-600 mb-4">{segment.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="text-xs font-medium text-gray-700">Criteria:</div>
                {segment.criteria.slice(0, 2).map((criterion, index) => (
                  <div key={index} className="text-xs text-gray-600">
                    {criterion.field} {criterion.operator} {Array.isArray(criterion.value) ? criterion.value.join(', ') : criterion.value}
                  </div>
                ))}
                {segment.criteria.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{segment.criteria.length - 2} more criteria
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {segment.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Updated {formatDate(segment.updatedAt)}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(segment);
                    }}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSegment(segment.id);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Segment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create New Segment</h2>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Segment Name</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter segment name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <input
                    type="color"
                    className="input w-full h-10"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="input w-full"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter segment description"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Criteria</label>
                  <button
                    onClick={addCriterion}
                    className="btn-outline btn-sm"
                  >
                    Add Criterion
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.criteria.map((criterion, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <select
                          className="input w-full mb-2"
                          value={criterion.field}
                          onChange={(e) => updateCriterion(index, 'field', e.target.value)}
                        >
                          {getFieldOptions().map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <select
                          className="input w-full mb-2"
                          value={criterion.operator}
                          onChange={(e) => updateCriterion(index, 'operator', e.target.value)}
                        >
                          {getOperatorOptions().map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        {criterion.field === 'status' ? (
                          <select
                            className="input w-full mb-2"
                            value={criterion.value as string}
                            onChange={(e) => updateCriterion(index, 'value', e.target.value)}
                          >
                            {getStatusOptions().map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        ) : criterion.field === 'priority' ? (
                          <select
                            className="input w-full mb-2"
                            value={criterion.value as string}
                            onChange={(e) => updateCriterion(index, 'value', e.target.value)}
                          >
                            {getPriorityOptions().map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        ) : criterion.field === 'source' ? (
                          <select
                            className="input w-full mb-2"
                            value={criterion.value as string}
                            onChange={(e) => updateCriterion(index, 'value', e.target.value)}
                          >
                            {getSourceOptions().map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className="input w-full mb-2"
                            value={criterion.value as string}
                            onChange={(e) => updateCriterion(index, 'value', e.target.value)}
                            placeholder="Enter value"
                          />
                        )}
                      </div>
                      <button
                        onClick={() => removeCriterion(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {formData.criteria.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📊</div>
                      <p>No criteria defined. Click "Add Criterion" to get started.</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) }))}
                  placeholder="Enter tags separated by commas"
                />
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
                  onClick={handleCreateSegment}
                  className="btn-primary"
                  disabled={!formData.name || formData.criteria.length === 0}
                >
                  Create Segment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Segment Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Segment</h2>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Same form fields as create modal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Segment Name</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter segment name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <input
                    type="color"
                    className="input w-full h-10"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="input w-full"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter segment description"
                />
              </div>

              {/* Criteria section - same as create modal */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Criteria</label>
                  <button
                    onClick={addCriterion}
                    className="btn-outline btn-sm"
                  >
                    Add Criterion
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.criteria.map((criterion, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <select
                          className="input w-full mb-2"
                          value={criterion.field}
                          onChange={(e) => updateCriterion(index, 'field', e.target.value)}
                        >
                          {getFieldOptions().map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <select
                          className="input w-full mb-2"
                          value={criterion.operator}
                          onChange={(e) => updateCriterion(index, 'operator', e.target.value)}
                        >
                          {getOperatorOptions().map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          className="input w-full mb-2"
                          value={criterion.value as string}
                          onChange={(e) => updateCriterion(index, 'value', e.target.value)}
                          placeholder="Enter value"
                        />
                      </div>
                      <button
                        onClick={() => removeCriterion(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) }))}
                  placeholder="Enter tags separated by commas"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingSegment(null);
                    resetForm();
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSegment}
                  className="btn-primary"
                  disabled={!formData.name || formData.criteria.length === 0}
                >
                  Update Segment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
