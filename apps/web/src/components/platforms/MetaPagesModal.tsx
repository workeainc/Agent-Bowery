'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface MetaPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPageSelected: (page: any) => void;
}

export default function MetaPagesModal({ isOpen, onClose, onPageSelected }: MetaPagesModalProps) {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchPages();
    }
  }, [isOpen]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.getMetaPages();
      setPages(result.pages || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Facebook pages');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPage = async () => {
    if (!selectedPageId) return;

    try {
      setLoading(true);
      const result = await apiClient.selectMetaPage(selectedPageId);
      const selectedPage = pages.find(p => p.id === selectedPageId);
      
      if (selectedPage) {
        onPageSelected(selectedPage);
      }
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to select page');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Select Facebook Page
          </h2>
        </div>
        
        <div className="p-6">
          {loading && !pages.length ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading pages...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">⚠️</div>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchPages}
                className="btn-outline"
              >
                Retry
              </button>
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No Facebook pages found.</p>
              <p className="text-sm text-gray-500 mt-2">
                Make sure you have pages associated with your Facebook account.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pages.map((page) => (
                <label
                  key={page.id}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="page"
                    value={page.id}
                    checked={selectedPageId === page.id}
                    onChange={(e) => setSelectedPageId(e.target.value)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{page.name}</div>
                    {page.category && (
                      <div className="text-sm text-gray-500">{page.category}</div>
                    )}
                    <div className="text-xs text-gray-400">ID: {page.id}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex space-x-3">
          <button
            onClick={handleSelectPage}
            disabled={loading || !selectedPageId}
            className="btn-primary flex-1"
          >
            {loading ? 'Selecting...' : 'Select Page'}
          </button>
          <button
            onClick={onClose}
            className="btn-outline flex-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
