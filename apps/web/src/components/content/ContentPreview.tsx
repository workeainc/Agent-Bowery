'use client';

import { useState } from 'react';
import { ContentItem } from '@/types';

interface ContentPreviewProps {
  content: ContentItem;
  onClose: () => void;
}

export default function ContentPreview({ content, onClose }: ContentPreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'metadata' | 'platforms'>('preview');
  const [platformTab, setPlatformTab] = useState<'FACEBOOK' | 'LINKEDIN' | 'INSTAGRAM'>('FACEBOOK');

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

  const renderContent = (body: string) => {
    // Simple markdown-like rendering
    return body
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/---/g, '<hr class="my-4 border-gray-300">')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Content Preview</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'preview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'metadata'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Metadata
            </button>
            <button
              onClick={() => setActiveTab('platforms')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'platforms'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Platforms
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'preview' ? (
            <div className="space-y-6">
              {/* Title and Status */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{content.title}</h1>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(content.type)}`}>
                    {content.type.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(content.status)}`}>
                    {content.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Tags */}
              {content.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {content.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Body */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Content</h3>
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: renderContent(content.metadata.body || 'No content available.') 
                  }}
                />
              </div>
            </div>
          ) : activeTab === 'metadata' ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Basic Information</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-gray-500">ID</dt>
                    <dd className="text-sm text-gray-900">{content.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Type</dt>
                    <dd className="text-sm text-gray-900">{content.type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Status</dt>
                    <dd className="text-sm text-gray-900">{content.status}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Created</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(content.createdAt).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Updated</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(content.updatedAt).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Versions</dt>
                    <dd className="text-sm text-gray-900">{content.versions.length}</dd>
                  </div>
                </dl>
              </div>

              {content.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {content.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Metadata</h3>
                <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-x-auto">
                  {JSON.stringify(content.metadata, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Platform tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-6">
                  {(['FACEBOOK', 'LINKEDIN', 'INSTAGRAM'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatformTab(p)}
                      className={`py-2 px-1 border-b-2 text-sm ${
                        platformTab === p
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Simple platform-specific frames */}
              <div className="space-y-4">
                {platformTab === 'FACEBOOK' && (
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">f</div>
                      <div>
                        <div className="text-sm font-semibold">Page Name</div>
                        <div className="text-xs text-gray-500">Just now · Public</div>
                      </div>
                    </div>
                    <div className="text-sm leading-6" dangerouslySetInnerHTML={{ __html: renderContent(content.metadata.body || '') }} />
                    <div className="mt-3 text-xs text-gray-500">Like · Comment · Share</div>
                  </div>
                )}

                {platformTab === 'LINKEDIN' && (
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded bg-blue-700 text-white flex items-center justify-center">in</div>
                      <div>
                        <div className="text-sm font-semibold">Company Name</div>
                        <div className="text-xs text-gray-500">Promoted · 1m</div>
                      </div>
                    </div>
                    <div className="text-sm leading-6" dangerouslySetInnerHTML={{ __html: renderContent(content.metadata.body || '') }} />
                    <div className="mt-3 text-xs text-gray-500">Like · Comment · Repost · Send</div>
                  </div>
                )}

                {platformTab === 'INSTAGRAM' && (
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center">IG</div>
                      <div className="text-sm font-semibold">@brand_handle</div>
                    </div>
                    <div className="border rounded mb-3 aspect-[4/3] bg-gray-100 flex items-center justify-center text-gray-400 text-sm">Image/Video</div>
                    <div className="text-sm" dangerouslySetInnerHTML={{ __html: renderContent(content.metadata.body || '') }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="btn-outline"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
