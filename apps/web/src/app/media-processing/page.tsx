'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import MediaProcessing from '@/components/media/MediaProcessing';
import MediaOptimization from '@/components/media/MediaOptimization';
import MediaFormatConversion from '@/components/media/MediaFormatConversion';

export default function MediaProcessingPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'processing' | 'optimization' | 'conversion'>('processing');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Media Processing</h1>
          <p className="mt-2 text-gray-600">
            Optimize, convert, and process your media files for better performance
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { key: 'processing', label: 'Batch Processing', icon: '⚙️' },
              { key: 'optimization', label: 'Media Optimization', icon: '🎯' },
              { key: 'conversion', label: 'Format Conversion', icon: '🔄' }
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
          {activeTab === 'processing' && (
            <MediaProcessing organizationId={session?.user?.organizationId} />
          )}

          {activeTab === 'optimization' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select File for Optimization</h3>
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">File Selection Required</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Please select a file from the Batch Processing tab to optimize
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'conversion' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select File for Conversion</h3>
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">File Selection Required</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Please select a file from the Batch Processing tab to convert
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
