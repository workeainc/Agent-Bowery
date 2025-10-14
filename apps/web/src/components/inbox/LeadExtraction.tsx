'use client';

import { useState, useEffect } from 'react';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  platform: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  score: number;
  tags: string[];
  lastActivity: Date;
  conversationId: string;
  notes: string;
  createdAt: Date;
}

interface LeadExtractionProps {
  onLeadUpdate?: (lead: Lead) => void;
}

export default function LeadExtraction({ onLeadUpdate }: LeadExtractionProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'qualified' | 'converted'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for demonstration
  const mockLeads: Lead[] = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+1-555-0123',
      company: 'Tech Solutions Inc.',
      platform: 'FACEBOOK',
      source: 'Message Inquiry',
      status: 'new',
      score: 85,
      tags: ['pricing', 'enterprise'],
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
      conversationId: 'conv1',
      notes: 'Interested in enterprise pricing. Very responsive.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.j@company.com',
      phone: '+1-555-0456',
      company: 'Marketing Pro',
      platform: 'LINKEDIN',
      source: 'Content Engagement',
      status: 'qualified',
      score: 92,
      tags: ['marketing', 'content'],
      lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000),
      conversationId: 'conv2',
      notes: 'Marketing manager looking for content solutions.',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      id: '3',
      name: 'Mike Wilson',
      email: 'mike.wilson@startup.io',
      phone: '+1-555-0789',
      company: 'StartupXYZ',
      platform: 'INSTAGRAM',
      source: 'Product Inquiry',
      status: 'contacted',
      score: 78,
      tags: ['startup', 'product'],
      lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000),
      conversationId: 'conv3',
      notes: 'Startup founder asking about product features.',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
    }
  ];

  useEffect(() => {
    setLeads(mockLeads);
  }, []);

  const handleStatusUpdate = (leadId: string, newStatus: Lead['status']) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    ));
    
    const updatedLead = leads.find(lead => lead.id === leadId);
    if (updatedLead && onLeadUpdate) {
      onLeadUpdate({ ...updatedLead, status: newStatus });
    }
  };

  const handleScoreUpdate = (leadId: string, newScore: number) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId ? { ...lead, score: newScore } : lead
    ));
  };

  const handleNotesUpdate = (leadId: string, notes: string) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId ? { ...lead, notes } : lead
    ));
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'FACEBOOK': return '📘';
      case 'LINKEDIN': return '💼';
      case 'INSTAGRAM': return '📷';
      case 'TWITTER': return '🐦';
      case 'EMAIL': return '📧';
      default: return '📱';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredLeads = leads.filter(lead => {
    if (activeFilter !== 'all' && lead.status !== activeFilter) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        lead.name.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.company?.toLowerCase().includes(query) ||
        lead.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Lead Extraction</h2>
          <p className="text-gray-600 mt-1">
            Manage and track leads from social media interactions
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {leads.length} total leads • {leads.filter(l => l.status === 'new').length} new
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full"
              placeholder="Search leads..."
            />
          </div>
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All', count: leads.length },
              { key: 'new', label: 'New', count: leads.filter(l => l.status === 'new').length },
              { key: 'qualified', label: 'Qualified', count: leads.filter(l => l.status === 'qualified').length },
              { key: 'converted', label: 'Converted', count: leads.filter(l => l.status === 'converted').length }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key as any)}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  activeFilter === filter.key
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads List */}
        <div className="lg:col-span-1 space-y-4">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className={`card cursor-pointer ${
                selectedLead?.id === lead.id ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <div className="card-content">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{lead.name}</h3>
                      <p className="text-sm text-gray-600">{lead.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getPlatformIcon(lead.platform)}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Lead Score</span>
                    <span className={`text-sm font-medium ${getScoreColor(lead.score)}`}>
                      {lead.score}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        lead.score >= 80 ? 'bg-green-500' :
                        lead.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${lead.score}%` }}
                    ></div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {lead.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="text-xs text-gray-500">
                    Last activity: {lead.lastActivity.toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredLeads.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">🎯</div>
              <p className="text-gray-500">No leads found</p>
            </div>
          )}
        </div>

        {/* Lead Details */}
        <div className="lg:col-span-2">
          {selectedLead ? (
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl">
                      {selectedLead.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{selectedLead.name}</h3>
                      <p className="text-sm text-gray-600">{selectedLead.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getPlatformIcon(selectedLead.platform)}</span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedLead.status)}`}>
                      {selectedLead.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card-content space-y-6">
                {/* Contact Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={selectedLead.email || ''}
                        className="input w-full"
                        placeholder="No email provided"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={selectedLead.phone || ''}
                        className="input w-full"
                        placeholder="No phone provided"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Lead Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Lead Score</h4>
                    <span className={`text-lg font-bold ${getScoreColor(selectedLead.score)}`}>
                      {selectedLead.score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        selectedLead.score >= 80 ? 'bg-green-500' :
                        selectedLead.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${selectedLead.score}%` }}
                    ></div>
                  </div>
                </div>

                {/* Status Management */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Status Management</h4>
                  <div className="flex space-x-2">
                    {[
                      { key: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' },
                      { key: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
                      { key: 'qualified', label: 'Qualified', color: 'bg-green-100 text-green-800' },
                      { key: 'converted', label: 'Converted', color: 'bg-purple-100 text-purple-800' },
                      { key: 'lost', label: 'Lost', color: 'bg-red-100 text-red-800' }
                    ].map((status) => (
                      <button
                        key={status.key}
                        onClick={() => handleStatusUpdate(selectedLead.id, status.key as Lead['status'])}
                        className={`px-3 py-1 text-sm font-medium rounded ${
                          selectedLead.status === status.key
                            ? status.color
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLead.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-sm font-medium bg-primary-100 text-primary-800 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Notes</h4>
                  <textarea
                    value={selectedLead.notes}
                    onChange={(e) => handleNotesUpdate(selectedLead.id, e.target.value)}
                    className="input w-full h-24 resize-none"
                    placeholder="Add notes about this lead..."
                  />
                </div>

                {/* Lead Information */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                    <p className="text-sm text-gray-900">{selectedLead.source}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                    <p className="text-sm text-gray-900">{selectedLead.platform}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                    <p className="text-sm text-gray-900">{selectedLead.createdAt.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Activity</label>
                    <p className="text-sm text-gray-900">{selectedLead.lastActivity.toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-content">
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">👤</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a lead</h3>
                  <p className="text-gray-500">
                    Choose a lead from the list to view details and manage
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
