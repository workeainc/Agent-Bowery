'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { ContentItem } from '@/types';
import AppShell from '@/components/layout/AppShell';
import ContentPreview from '@/components/content/ContentPreview';
import Link from 'next/link';

export default function ContentPage() {
  const router = useRouter();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<ContentItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

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
              onClick={() => {
                // TODO: Implement import functionality
                alert('Import functionality coming soon!');
              }}
            >
              Import Content
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
              <select className="input">
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
              <select className="input">
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
              Content Items ({content.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {content.map((item) => (
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
                      onClick={() => {
                        // TODO: Implement schedule functionality
                        alert('Schedule functionality coming soon!');
                      }}
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {content.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
            <p className="text-gray-500 mb-4">
              Get started by creating your first piece of content.
            </p>
            <button 
              className="btn-primary"
              onClick={() => router.push('/content/create')}
            >
              Create Content
            </button>
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
    </AppShell>
  );
}
