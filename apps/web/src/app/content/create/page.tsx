'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ContentType, ContentStatus } from '@/types';
import AppShell from '@/components/layout/AppShell';
import ContentEditor from '@/components/content/ContentEditor';
import { apiClient } from '@/lib/api-client';
import { ContentManager } from '@/components/auth/RoleGuard';

export default function CreateContentPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const handleSave = async (data: {
    title: string;
    type: ContentType;
    status: ContentStatus;
    tags: string[];
    body: string;
  }) => {
    setLoading(true);
    
    try {
      await apiClient.createContent({
        title: data.title,
        type: data.type,
        status: data.status,
        tags: data.tags,
        metadata: { body: data.body },
      });
      alert('Content saved successfully');
      
      // Redirect back to content list
      router.push('/content');
    } catch (error) {
      console.error('Failed to save content:', error);
      alert('Failed to save content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/content');
  };

  return (
    <ContentManager fallback={
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to create content.</p>
          </div>
        </div>
      </AppShell>
    }>
      <AppShell>
        <ContentEditor
          onSave={handleSave}
          onCancel={handleCancel}
          loading={loading}
        />
      </AppShell>
    </ContentManager>
  );
}
