'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api-client';
import { ContentItem } from '@/types';
import AppShell from '@/components/layout/AppShell';
import ContentPreview from '@/components/content/ContentPreview';
import ScheduleModal from '@/components/content/ScheduleModal';
import ImportModal from '@/components/content/ImportModal';
import ContentOptimization from '@/components/content/ContentOptimization';
import SmartScheduleModal from '@/components/content/SmartScheduleModal';
import BrandComplianceValidation from '@/components/content/BrandComplianceValidation';
import BrandRuleEnforcement from '@/components/content/BrandRuleEnforcement';
import MediaUpload from '@/components/storage/MediaUpload';
import Link from 'next/link';

export default function ContentPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<ContentItem | null>(null);
  const [scheduleContent, setScheduleContent] = useState<ContentItem | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSmartScheduleModal, setShowSmartScheduleModal] = useState(false);
  const [optimizationContent, setOptimizationContent] = useState<ContentItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [showBrandCompliance, setShowBrandCompliance] = useState(false);
  const [showBrandEnforcement, setShowBrandEnforcement] = useState(false);
  const [complianceContent, setComplianceContent] = useState<ContentItem | null>(null);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: ''
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        // For now, we'll use mock data since the API might not be fully connected
        const mockContent: ContentItem[] = [
          {
            id: '1',
            title: 'Welcome to Agent Bowery',
            type: 'BLOG',
            status: 'PUBLISHED',
            tags: ['welcome', 'introduction'],
            metadata: { 
              author: 'Admin',
              body: 'Welcome to **Agent Bowery**, your AI-powered content management system!\n\nThis is a sample blog post to demonstrate the content management capabilities.\n\n---\n\n*Get started by creating your own content!*'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            versions: [],
            schedules: [],
          },
          {
            id: '2',
            title: 'Content Management Best Practices',
            type: 'NEWSLETTER',
            status: 'DRAFT',
            tags: ['best-practices', 'content'],
            metadata: { 
              author: 'Admin',
              body: 'Here are some **best practices** for content management:\n\n1. Plan your content calendar\n2. Use consistent formatting\n3. Review before publishing\n\n---\n\n*This newsletter is currently in draft status.*'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            versions: [],
            schedules: [],
          },
          {
            id: '3',
            title: 'Social Media Automation Tips',
            type: 'SOCIAL_POST',
            status: 'PENDING_APPROVAL',
            tags: ['social-media', 'automation'],
            metadata: { 
              author: 'Admin',
              body: '🚀 **Social Media Automation Tips**\n\n• Schedule posts in advance\n• Use consistent hashtags\n• Engage with your audience\n• Monitor performance metrics\n\n#SocialMedia #Automation #Marketing'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            versions: [],
            schedules: [],
          },
        ];
        setContent(mockContent);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch content:', err);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  // Filter content whenever content or filters change
  useEffect(() => {
    let filtered = [...content];

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // Filter by type
    if (filters.type) {
      filtered = filtered.filter(item => item.type === filters.type);
    }

    // Filter by search
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm) ||
        item.metadata.body?.toLowerCase().includes(searchTerm) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    setFilteredContent(filtered);
  }, [content, filters]);

  const handleSchedule = async (data: {
    contentId: string;
    platform: string;
    scheduledAt: string;
    targetAccount?: string;
  }) => {
    try {
      // In a real app, this would call the API to schedule content
      console.log('Scheduling content:', data);
      
      // For now, we'll just show a success message
      // In a real implementation, you would call:
      // await apiClient.scheduleContent(data);
      
      // Update the content item to show it's scheduled
      setContent(prevContent => 
        prevContent.map(item => 
          item.id === data.contentId 
            ? { ...item, status: 'SCHEDULED' as any }
            : item
        )
      );
    } catch (error) {
      console.error('Failed to schedule content:', error);
      throw error;
    }
  };

  const handleImport = async (data: {
    title: string;
    type: string;
    content: string;
    tags: string[];
  }) => {
    try {
      // In a real app, this would call the API to create content
      console.log('Importing content:', data);
      
      // For now, we'll just add it to the local state
      const newContent: ContentItem = {
        id: Date.now().toString(), // Simple ID generation
        title: data.title,
        type: data.type as any,
        status: 'DRAFT',
        tags: data.tags,
        metadata: { 
          author: 'Imported',
          body: data.content
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versions: [],
        schedules: [],
      };
      
      setContent(prevContent => [newContent, ...prevContent]);
    } catch (error) {
      console.error('Failed to import content:', error);
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'PENDING_APPROVAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BLOG':
        return 'bg-purple-100 text-purple-800';
      case 'NEWSLETTER':
        return 'bg-indigo-100 text-indigo-800';
      case 'SOCIAL_POST':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading content...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
            <p className="text-gray-600 mt-2">
              Create, edit, and manage your content
            </p>
          </div>
          <div className="flex space-x-3">
            <button 
              className="btn-outline"
              onClick={() => setShowImportModal(true)}
            >
              Import Content
            </button>
            <button 
              className="btn-outline"
              onClick={() => setShowMediaUpload(true)}
            >
              Upload Media
            </button>
            <button 
              className="btn-primary"
              onClick={() => router.push('/content/create')}
            >
              Create New Content
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select 
                className="input"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select 
                className="input"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="BLOG">Blog</option>
                <option value="NEWSLETTER">Newsletter</option>
                <option value="SOCIAL_POST">Social Post</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search content..."
                className="input"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          {/* Bulk actions */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {Object.values(selectedIds).filter(Boolean).length} selected
            </div>
            <div className="flex gap-2">
              <button
                className="btn-outline btn-sm"
                onClick={async () => {
                  const ids = Object.entries(selectedIds).filter(([_, v]) => v).map(([k]) => k);
                  if (ids.length === 0) return alert('Select items first');
                  try {
                    await apiClient.bulkApproveContent(ids);
                    alert('Approved selected');
                  } catch (e) {
                    alert('Failed bulk approve');
                  }
                }}
              >
                Approve Selected
              </button>
              <button
                className="btn-outline btn-sm"
                onClick={async () => {
                  const ids = Object.entries(selectedIds).filter(([_, v]) => v).map(([k]) => k);
                  if (ids.length === 0) return alert('Select items first');
                  try {
                    await apiClient.bulkRejectContent(ids);
                    alert('Rejected selected');
                  } catch (e) {
                    alert('Failed bulk reject');
                  }
                }}
              >
                Reject Selected
              </button>
              <button
                className="btn-outline btn-sm"
                onClick={() => setSelectedIds({})}
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>

        {/* Content List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Content Items ({filteredContent.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredContent.map((item) => (
              <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={!!selectedIds[item.id]}
                      onChange={(e) => setSelectedIds({ ...selectedIds, [item.id]: e.target.checked })}
                    />
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {item.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(item.type)}`}>
                        {item.type.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
                      {item.tags.length > 0 && (
                        <div className="flex space-x-1">
                          {item.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="btn-ghost btn-sm"
                      onClick={async () => {
                        try {
                          await apiClient.approveContent(item.id);
                          alert('Approved');
                        } catch (e) {
                          alert('Failed to approve');
                        }
                      }}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-ghost btn-sm"
                      onClick={async () => {
                        try {
                          await apiClient.rejectContent(item.id);
                          alert('Rejected');
                        } catch (e) {
                          alert('Failed to reject');
                        }
                      }}
                    >
                      Reject
                    </button>
                    <button 
                      className="btn-ghost btn-sm"
                      onClick={() => setPreviewContent(item)}
                    >
                      View
                    </button>
                    <button 
                      className="btn-ghost btn-sm"
                      onClick={() => router.push(`/content/edit/${item.id}`)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-ghost btn-sm"
                      onClick={() => setOptimizationContent(item)}
                    >
                      Optimize
                    </button>
                    <button 
                      className="btn-ghost btn-sm"
                      onClick={() => setScheduleContent(item)}
                    >
                      Schedule
                    </button>
                    <button 
                      className="btn-ghost btn-sm"
                      onClick={() => {
                        setScheduleContent(item);
                        setShowSmartScheduleModal(true);
                      }}
                    >
                      Smart Schedule
                    </button>
                    <button 
                      className="btn-ghost btn-sm"
                      onClick={() => {
                        setComplianceContent(item);
                        setShowBrandCompliance(true);
                      }}
                    >
                      Check Compliance
                    </button>
                    <button 
                      className="btn-ghost btn-sm"
                      onClick={() => {
                        setComplianceContent(item);
                        setShowBrandEnforcement(true);
                      }}
                    >
                      Enforce Rules
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredContent.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {content.length === 0 ? 'No content yet' : 'No content matches your filters'}
            </h3>
            <p className="text-gray-500 mb-4">
              {content.length === 0 
                ? 'Get started by creating your first piece of content.'
                : 'Try adjusting your filters or search terms.'
              }
            </p>
            {content.length === 0 ? (
              <button 
                className="btn-primary"
                onClick={() => router.push('/content/create')}
              >
                Create Content
              </button>
            ) : (
              <button 
                className="btn-outline"
                onClick={() => setFilters({ status: '', type: '', search: '' })}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content Preview Modal */}
      {previewContent && (
        <ContentPreview
          content={previewContent}
          onClose={() => setPreviewContent(null)}
        />
      )}

      {/* Schedule Modal */}
      {scheduleContent && (
        <ScheduleModal
          content={scheduleContent}
          onClose={() => setScheduleContent(null)}
          onSchedule={handleSchedule}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />
      )}

      {/* Content Optimization Modal */}
      {optimizationContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Content Optimization</h2>
                <button
                  onClick={() => setOptimizationContent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <ContentOptimization
                contentId={optimizationContent.id}
                content={{
                  title: optimizationContent.title,
                  body: optimizationContent.metadata?.body || '',
                  platform: optimizationContent.type === 'SOCIAL_POST' ? 'meta' : undefined
                }}
                onOptimized={(optimized) => {
                  console.log('Content optimized:', optimized);
                  // Update the content item with optimized version
                  setContent(prev => prev.map(item => 
                    item.id === optimizationContent.id 
                      ? { ...item, metadata: { ...item.metadata, ...optimized } }
                      : item
                  ));
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Smart Schedule Modal */}
      {showSmartScheduleModal && scheduleContent && (
        <SmartScheduleModal
          contentId={scheduleContent.id}
          isOpen={showSmartScheduleModal}
          onClose={() => {
            setShowSmartScheduleModal(false);
            setScheduleContent(null);
          }}
          onScheduleCreated={(schedule) => {
            console.log('Smart schedule created:', schedule);
            alert('Smart schedule created successfully!');
          }}
        />
      )}

      {/* Brand Compliance Validation Modal */}
      {showBrandCompliance && complianceContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Brand Compliance Validation</h2>
                <button
                  onClick={() => {
                    setShowBrandCompliance(false);
                    setComplianceContent(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <BrandComplianceValidation
                contentId={complianceContent.id}
                organizationId={session?.user?.organizationId}
                onValidationComplete={(result) => {
                  console.log('Brand compliance validation completed:', result);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Brand Rule Enforcement Modal */}
      {showBrandEnforcement && complianceContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Brand Rule Enforcement</h2>
                <button
                  onClick={() => {
                    setShowBrandEnforcement(false);
                    setComplianceContent(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <BrandRuleEnforcement
                contentId={complianceContent.id}
                organizationId={session?.user?.organizationId}
                onEnforcementComplete={(result) => {
                  console.log('Brand rule enforcement completed:', result);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Media Upload Modal */}
      {showMediaUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Upload Media</h2>
                <button
                  onClick={() => setShowMediaUpload(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <MediaUpload
                organizationId={session?.user?.organizationId}
                onUploadComplete={(file) => {
                  console.log('Media uploaded:', file);
                  setShowMediaUpload(false);
                }}
                onUploadError={(error) => {
                  console.error('Upload error:', error);
                  alert('Upload failed: ' + error);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
