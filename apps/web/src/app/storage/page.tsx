'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import MediaUpload from '@/components/storage/MediaUpload';
import StorageUsageDashboard from '@/components/storage/StorageUsageDashboard';
import FileManagement from '@/components/storage/FileManagement';
import MediaProcessing from '@/components/media/MediaProcessing';

export default function StorageManagementPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'upload' | 'usage' | 'files' | 'processing'>('upload');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Storage Management</h1>
          <p className="mt-2 text-gray-600">
            Upload, manage, and organize your media files
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { key: 'upload', label: 'Upload Media', icon: '📤' },
              { key: 'usage', label: 'Storage Usage', icon: '📊' },
              { key: 'files', label: 'File Management', icon: '📁' },
              { key: 'processing', label: 'Media Processing', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'upload' && (
            <MediaUpload
              organizationId={session?.user?.organizationId}
              onUploadComplete={(file) => {
                console.log('File uploaded:', file);
                // Optionally switch to files tab to show the uploaded file
                setActiveTab('files');
              }}
              onUploadError={(error) => {
                console.error('Upload error:', error);
                alert('Upload failed: ' + error);
              }}
            />
          )}

          {activeTab === 'usage' && (
            <StorageUsageDashboard organizationId={session?.user?.organizationId} />
          )}

          {activeTab === 'files' && (
            <FileManagement organizationId={session?.user?.organizationId} />
          )}

          {activeTab === 'processing' && (
            <MediaProcessing organizationId={session?.user?.organizationId} />
          )}
        </div>
      </div>
    </div>
  );
}
