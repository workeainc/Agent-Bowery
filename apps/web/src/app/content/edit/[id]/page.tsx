'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ContentType, ContentStatus, ContentItem } from '@/types';
import AppShell from '@/components/layout/AppShell';
import ContentEditor from '@/components/content/ContentEditor';
import { ContentManager } from '@/components/auth/RoleGuard';
import { apiClient } from '@/lib/api-client';

export default function EditContentPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [showVersions, setShowVersions] = useState(true);

  const contentId = params.id as string;

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoadingContent(true);
        
        // Mock content data - in a real app, this would fetch from API
        const mockContent: ContentItem = {
          id: contentId,
          title: 'Sample Content for Editing',
          type: 'BLOG',
          status: 'DRAFT',
          tags: ['sample', 'editing'],
          metadata: { author: 'Admin', body: 'Initial draft body' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          versions: [
            { id: 'v2', contentItemId: contentId, version: 2, body: 'Second revision body', metadataJson: {}, createdAt: new Date().toISOString() },
            { id: 'v1', contentItemId: contentId, version: 1, body: 'First draft body', metadataJson: {}, createdAt: new Date(Date.now() - 86400000).toISOString() }
          ],
          schedules: [],
        };
        
        setContent(mockContent);
      } catch (error) {
        console.error('Failed to fetch content:', error);
        alert('Failed to load content. Please try again.');
        router.push('/content');
      } finally {
        setLoadingContent(false);
      }
    };

    if (contentId) {
      fetchContent();
    }
  }, [contentId, router]);

  const handleSave = async (data: {
    title: string;
    type: ContentType;
    status: ContentStatus;
    tags: string[];
    body: string;
  }) => {
    setLoading(true);
    
    try {
      await apiClient.updateContent(contentId, {
        title: data.title,
        type: data.type,
        status: data.status,
        tags: data.tags,
        metadata: { body: data.body },
      });
      alert('Content updated successfully');
      
      // Redirect back to content list
      router.push('/content');
    } catch (error) {
      console.error('Failed to update content:', error);
      alert('Failed to update content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/content');
  };

  if (loadingContent) {
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

  if (!content) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Content Not Found</h1>
            <p className="text-gray-600 mb-4">The content you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/content')}
              className="btn-primary"
            >
              Back to Content
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <ContentManager fallback={
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to edit content.</p>
          </div>
        </div>
      </AppShell>
    }>
      <AppShell>
        {/* Versions panel */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Edit Content</h2>
          <button
            className="btn-ghost btn-sm"
            onClick={() => setShowVersions(!showVersions)}
          >
            {showVersions ? 'Hide' : 'Show'} Versions
          </button>
        </div>

        {showVersions && (
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Version History</h3>
            <div className="space-y-2">
              {content.versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between text-sm">
                  <div className="text-gray-700">Version {v.version}</div>
                  <div className="text-gray-500">{new Date(v.createdAt).toLocaleString()}</div>
                  <div className="flex gap-2">
                    <button
                      className="btn-outline btn-sm"
                      onClick={() => alert(`Compare current with version ${v.version} (mock)`) }
                    >
                      Compare
                    </button>
                    <button
                      className="btn-outline btn-sm"
                      onClick={() => alert(`Restore version ${v.version} (mock)`) }
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ContentEditor
          initialData={{
            title: content.title,
            type: content.type,
            status: content.status,
            tags: content.tags,
            body: content.metadata.body || 'Enter your content here...'
          }}
          onSave={handleSave}
          onCancel={handleCancel}
          loading={loading}
        />
      </AppShell>
    </ContentManager>
  );
}
