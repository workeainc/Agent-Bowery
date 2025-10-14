'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface ErrorReportingProps {
  organizationId?: string;
}

export default function ErrorReporting({ organizationId }: ErrorReportingProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [selectedErrors, setSelectedErrors] = useState<string[]>([]);
  const [reportForm, setReportForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    assignedTo: '',
    tags: [] as string[]
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [reportsResult, errorsResult] = await Promise.all([
        apiClient.getErrorReports({ organizationId }),
        apiClient.getErrorLogs({ organizationId, resolved: false, limit: 100 })
      ]);
      
      setReports(reportsResult.reports);
      setErrors(errorsResult.errors);
    } catch (err: any) {
      console.error('Failed to load error reporting data:', err);
      setError(err.message || 'Failed to load error reporting data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const handleCreateReport = async () => {
    if (selectedErrors.length === 0) {
      alert('Please select at least one error to include in the report');
      return;
    }

    try {
      setLoading(true);
      
      const result = await apiClient.createErrorReport({
        ...reportForm,
        errorIds: selectedErrors,
        organizationId
      });
      
      if (result.success) {
        setShowCreateReport(false);
        setReportForm({
          title: '',
          description: '',
          priority: 'medium',
          assignedTo: '',
          tags: []
        });
        setSelectedErrors([]);
        await loadData();
      }
    } catch (err: any) {
      console.error('Failed to create error report:', err);
      alert('Failed to create error report: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReport = async (reportId: string, updates: any) => {
    try {
      setLoading(true);
      
      const result = await apiClient.updateErrorReport(reportId, updates);
      
      if (result.success) {
        await loadData();
      }
    } catch (err: any) {
      console.error('Failed to update error report:', err);
      alert('Failed to update error report: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100';
      case 'in_progress': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const addTag = () => {
    setReportForm(prev => ({ ...prev, tags: [...prev.tags, ''] }));
  };

  const updateTag = (index: number, value: string) => {
    setReportForm(prev => ({
      ...prev,
      tags: prev.tags.map((tag, i) => i === index ? value : tag)
    }));
  };

  const removeTag = (index: number) => {
    setReportForm(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
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
            <h3 className="text-sm font-medium text-red-800">Error Loading Reports</h3>
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
          <h2 className="text-xl font-semibold text-gray-900">Error Reports</h2>
          <p className="text-gray-600 mt-1">
            Create and manage error reports for tracking and resolution
          </p>
        </div>
        <button
          onClick={() => setShowCreateReport(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Report
        </button>
      </div>

      {/* Reports List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Error Reports ({reports.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {reports.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first error report to get started
              </p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{report.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                        {report.priority.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>ID: {report.id}</span>
                      <span>Errors: {report.errorIds.length}</span>
                      <span>Created: {formatDate(report.createdAt)}</span>
                      {report.assignedTo && (
                        <span>Assigned to: {report.assignedTo}</span>
                      )}
                    </div>
                    
                    {report.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {report.tags.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <select
                      value={report.status}
                      onChange={(e) => handleUpdateReport(report.id, { status: e.target.value })}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Report Modal */}
      {showCreateReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Error Report</h2>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Report Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Title</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={reportForm.title}
                    onChange={(e) => setReportForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Database Connection Issues"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    className="input w-full"
                    value={reportForm.priority}
                    onChange={(e) => setReportForm(prev => ({ ...prev, priority: e.target.value as any }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="input w-full"
                  rows={4}
                  value={reportForm.description}
                  onChange={(e) => setReportForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the issue and its impact..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To (optional)</label>
                <input
                  type="text"
                  className="input w-full"
                  value={reportForm.assignedTo}
                  onChange={(e) => setReportForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                  placeholder="User ID or email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="space-y-2">
                  {reportForm.tags.map((tag, index) => (
                    <div key={index} className="flex space-x-2 items-center">
                      <input
                        type="text"
                        className="input flex-1"
                        value={tag}
                        onChange={(e) => updateTag(index, e.target.value)}
                        placeholder="e.g., database, api, frontend"
                      />
                      <button
                        onClick={() => removeTag(index)}
                        className="btn-outline btn-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button onClick={addTag} className="btn-secondary btn-sm">
                    Add Tag
                  </button>
                </div>
              </div>

              {/* Error Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Errors ({selectedErrors.length} selected)
                </label>
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  {errors.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No unresolved errors available
                    </div>
                  ) : (
                    errors.map((error) => (
                      <div key={error.id} className="p-3 border-b border-gray-100 last:border-b-0">
                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedErrors.includes(error.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedErrors(prev => [...prev, error.id]);
                              } else {
                                setSelectedErrors(prev => prev.filter(id => id !== error.id));
                              }
                            }}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                error.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                error.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                error.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {error.severity}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                                {error.category}
                              </span>
                            </div>
                            <p className="text-sm text-gray-900 truncate">{error.message}</p>
                            <p className="text-xs text-gray-500">{formatDate(error.createdAt)}</p>
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateReport(false);
                    setReportForm({
                      title: '',
                      description: '',
                      priority: 'medium',
                      assignedTo: '',
                      tags: []
                    });
                    setSelectedErrors([]);
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateReport}
                  className="btn-primary"
                  disabled={!reportForm.title || !reportForm.description || selectedErrors.length === 0}
                >
                  Create Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
