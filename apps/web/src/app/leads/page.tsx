'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppShell from '@/components/layout/AppShell';
import { apiClient } from '@/lib/api-client';
import { ContentManager } from '@/components/auth/RoleGuard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

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
}

interface LeadDashboardProps {
  onLeadSelect?: (lead: Lead) => void;
}

export default function LeadManagementPage() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'contacted' | 'qualified' | 'converted'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'created' | 'name' | 'status'>('score');

  // Mock data for demonstration
  const mockLeads: Lead[] = [
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice.johnson@techcorp.com',
      phone: '+1-555-0123',
      company: 'TechCorp Inc.',
      title: 'Marketing Director',
      source: 'LinkedIn',
      status: 'qualified',
      score: 85,
      tags: ['enterprise', 'marketing', 'hot-lead'],
      notes: 'Interested in enterprise solution. Budget approved.',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      lastContact: new Date('2024-01-20'),
      nextFollowUp: new Date('2024-01-25'),
      assignedTo: 'John Smith',
      priority: 'high',
      estimatedValue: 50000,
      conversionProbability: 75
    },
    {
      id: '2',
      name: 'Bob Chen',
      email: 'bob.chen@startup.io',
      phone: '+1-555-0456',
      company: 'StartupIO',
      title: 'CEO',
      source: 'Website',
      status: 'contacted',
      score: 72,
      tags: ['startup', 'ceo', 'early-stage'],
      notes: 'Initial contact made. Interested in demo.',
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-21'),
      lastContact: new Date('2024-01-21'),
      nextFollowUp: new Date('2024-01-24'),
      assignedTo: 'Sarah Wilson',
      priority: 'medium',
      estimatedValue: 15000,
      conversionProbability: 60
    },
    {
      id: '3',
      name: 'Carol Davis',
      email: 'carol.davis@enterprise.com',
      phone: '+1-555-0789',
      company: 'Enterprise Solutions',
      title: 'VP of Sales',
      source: 'Referral',
      status: 'new',
      score: 68,
      tags: ['enterprise', 'referral', 'sales'],
      notes: 'Referred by existing customer. High potential.',
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20'),
      assignedTo: 'Mike Johnson',
      priority: 'high',
      estimatedValue: 75000,
      conversionProbability: 80
    },
    {
      id: '4',
      name: 'David Wilson',
      email: 'david.wilson@smallbiz.com',
      phone: '+1-555-0321',
      company: 'SmallBiz Co.',
      title: 'Owner',
      source: 'Facebook',
      status: 'contacted',
      score: 45,
      tags: ['small-business', 'owner', 'local'],
      notes: 'Small business owner. Price sensitive.',
      createdAt: new Date('2024-01-19'),
      updatedAt: new Date('2024-01-22'),
      lastContact: new Date('2024-01-22'),
      nextFollowUp: new Date('2024-01-26'),
      assignedTo: 'Lisa Brown',
      priority: 'low',
      estimatedValue: 5000,
      conversionProbability: 30
    },
    {
      id: '5',
      name: 'Emma Rodriguez',
      email: 'emma.rodriguez@globalcorp.com',
      phone: '+1-555-0654',
      company: 'GlobalCorp',
      title: 'CTO',
      source: 'Conference',
      status: 'qualified',
      score: 92,
      tags: ['enterprise', 'cto', 'technical', 'hot-lead'],
      notes: 'Met at conference. Very interested in technical capabilities.',
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-21'),
      lastContact: new Date('2024-01-21'),
      nextFollowUp: new Date('2024-01-23'),
      assignedTo: 'John Smith',
      priority: 'urgent',
      estimatedValue: 100000,
      conversionProbability: 90
    }
  ];

  useEffect(() => {
    // Set mock data for demo
    setLeads(mockLeads);
    setLoading(false);
  }, []);

  const handleCreateLead = (leadData: Partial<Lead>) => {
    const newLead: Lead = {
      id: Date.now().toString(),
      name: leadData.name || '',
      email: leadData.email || '',
      phone: leadData.phone || '',
      company: leadData.company || '',
      title: leadData.title || '',
      source: leadData.source || 'Website',
      status: 'new',
      score: 50,
      tags: leadData.tags || [],
      notes: leadData.notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedTo: leadData.assignedTo || 'Unassigned',
      priority: 'medium',
      estimatedValue: leadData.estimatedValue || 0,
      conversionProbability: 50
    };

    setLeads(prev => [newLead, ...prev]);
    setShowCreateModal(false);
    alert('Lead created successfully!');
  };

  const handleUpdateLead = (leadId: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId 
        ? { ...lead, ...updates, updatedAt: new Date() }
        : lead
    ));
    alert('Lead updated successfully!');
  };

  const handleDeleteLead = (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) {
      return;
    }
    setLeads(prev => prev.filter(lead => lead.id !== leadId));
    alert('Lead deleted successfully!');
  };

  const filteredLeads = leads.filter(lead => {
    const matchesFilter = activeFilter === 'all' || lead.status === activeFilter;
    const matchesSearch = searchQuery === '' || 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.score - a.score;
      case 'created':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

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
      year: 'numeric'
    });
  };

  // Dashboard metrics
  const totalLeads = leads.length;
  const newLeads = leads.filter(lead => lead.status === 'new').length;
  const qualifiedLeads = leads.filter(lead => lead.status === 'qualified').length;
  const convertedLeads = leads.filter(lead => lead.status === 'converted').length;
  const totalValue = leads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);
  const avgScore = leads.length > 0 ? Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length) : 0;

  // Chart data
  const statusData = [
    { status: 'New', count: leads.filter(l => l.status === 'new').length },
    { status: 'Contacted', count: leads.filter(l => l.status === 'contacted').length },
    { status: 'Qualified', count: leads.filter(l => l.status === 'qualified').length },
    { status: 'Converted', count: leads.filter(l => l.status === 'converted').length },
    { status: 'Archived', count: leads.filter(l => l.status === 'archived').length }
  ];

  const sourceData = [
    { source: 'LinkedIn', count: leads.filter(l => l.source === 'LinkedIn').length },
    { source: 'Website', count: leads.filter(l => l.source === 'Website').length },
    { source: 'Referral', count: leads.filter(l => l.source === 'Referral').length },
    { source: 'Facebook', count: leads.filter(l => l.source === 'Facebook').length },
    { source: 'Conference', count: leads.filter(l => l.source === 'Conference').length }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <ContentManager fallback={
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600">You don't have permission to view lead management.</p>
            </div>
          </div>
        </AppShell>
      }>
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading leads...</p>
            </div>
          </div>
        </AppShell>
      </ContentManager>
    );
  }

  return (
    <ContentManager fallback={
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to view lead management.</p>
          </div>
        </div>
      </AppShell>
    }>
      <AppShell>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
              <p className="text-gray-600 mt-2">
                Track and manage your sales leads with scoring and automation
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Add Lead
            </button>
          </div>

          {/* Dashboard Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-lg">👥</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 text-lg">⭐</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Qualified Leads</p>
                    <p className="text-2xl font-bold text-gray-900">{qualifiedLeads}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 text-lg">💰</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <span className="text-yellow-600 text-lg">📊</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Score</p>
                    <p className="text-2xl font-bold text-gray-900">{avgScore}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Lead Status Distribution</h3>
                <p className="card-description">Leads by status</p>
              </div>
              <div className="card-content">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, count }) => `${status} ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Lead Sources</h3>
                <p className="card-description">Leads by source</p>
              </div>
              <div className="card-content">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sourceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="source" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="card mb-6">
            <div className="card-content">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <input
                    type="text"
                    placeholder="Search leads..."
                    className="input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <select
                    className="input"
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value as any)}
                  >
                    <option value="all">All Status</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                  </select>
                  <select
                    className="input"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="score">Sort by Score</option>
                    <option value="created">Sort by Created</option>
                    <option value="name">Sort by Name</option>
                    <option value="status">Sort by Status</option>
                  </select>
                </div>
                <div className="text-sm text-gray-600">
                  {sortedLeads.length} of {totalLeads} leads
                </div>
              </div>
            </div>
          </div>

          {/* Leads List */}
          <div className="card">
            <div className="card-content p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {lead.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                              <div className="text-sm text-gray-500">{lead.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{lead.company}</div>
                          <div className="text-sm text-gray-500">{lead.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.source}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getScoreColor(lead.score)}`}>
                            {lead.score}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(lead.priority)}`}>
                            {lead.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lead.estimatedValue ? formatCurrency(lead.estimatedValue) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setShowLeadModal(true);
                              }}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Create Lead Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Add New Lead</h2>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input type="text" className="input w-full" placeholder="Lead name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input type="email" className="input w-full" placeholder="lead@example.com" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input type="tel" className="input w-full" placeholder="+1-555-0123" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                      <input type="text" className="input w-full" placeholder="Company name" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <input type="text" className="input w-full" placeholder="Job title" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                      <select className="input w-full">
                        <option value="Website">Website</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Referral">Referral</option>
                        <option value="Conference">Conference</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea className="input w-full" rows={3} placeholder="Additional notes..."></textarea>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleCreateLead({})}
                      className="btn-primary"
                    >
                      Create Lead
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lead Detail Modal */}
          {showLeadModal && selectedLead && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">{selectedLead.name}</h2>
                    <button
                      onClick={() => setShowLeadModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <p className="text-sm text-gray-900">{selectedLead.email}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <p className="text-sm text-gray-900">{selectedLead.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Company</label>
                            <p className="text-sm text-gray-900">{selectedLead.company || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <p className="text-sm text-gray-900">{selectedLead.title || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Details</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedLead.status)}`}>
                              {selectedLead.status}
                            </span>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Score</label>
                            <span className={`text-lg font-bold ${getScoreColor(selectedLead.score)}`}>
                              {selectedLead.score}
                            </span>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Priority</label>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedLead.priority)}`}>
                              {selectedLead.priority}
                            </span>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Source</label>
                            <p className="text-sm text-gray-900">{selectedLead.source}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Estimated Value</label>
                            <p className="text-lg font-bold text-gray-900">
                              {selectedLead.estimatedValue ? formatCurrency(selectedLead.estimatedValue) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Conversion Probability</label>
                            <p className="text-lg font-bold text-gray-900">
                              {selectedLead.conversionProbability || 0}%
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Created</label>
                            <p className="text-sm text-gray-900">{formatDate(selectedLead.createdAt)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Last Contact</label>
                            <p className="text-sm text-gray-900">
                              {selectedLead.lastContact ? formatDate(selectedLead.lastContact) : 'Never'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Next Follow-up</label>
                            <p className="text-sm text-gray-900">
                              {selectedLead.nextFollowUp ? formatDate(selectedLead.nextFollowUp) : 'Not scheduled'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedLead.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {selectedLead.notes && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                          <p className="text-sm text-gray-900">{selectedLead.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowLeadModal(false)}
                      className="btn-outline"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        // Handle lead update
                        setShowLeadModal(false);
                      }}
                      className="btn-primary"
                    >
                      Update Lead
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ContentManager>
  );
}
