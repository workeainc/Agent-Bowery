'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api-client';

interface QualityPolicy {
  organization_id: string;
  channel: string;
  min_readability?: number;
  max_similarity?: number;
  min_fact_supported_ratio?: number;
  toxicity_blocklist?: string[];
  language?: string;
  max_length?: number;
  updated_at?: string;
}

export default function QualityPolicyConfiguration() {
  const { data: session } = useSession();
  const [policies, setPolicies] = useState<QualityPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<QualityPolicy | null>(null);
  const [formData, setFormData] = useState({
    channel: 'default',
    min_readability: 60,
    max_similarity: 0.8,
    min_fact_supported_ratio: 0.7,
    toxicity_blocklist: '',
    language: 'en',
    max_length: 2000
  });

  // Mock policies for demonstration
  const mockPolicies: QualityPolicy[] = [
    {
      organization_id: 'org-1',
      channel: 'default',
      min_readability: 60,
      max_similarity: 0.8,
      min_fact_supported_ratio: 0.7,
      toxicity_blocklist: ['spam', 'hate', 'violence'],
      language: 'en',
      max_length: 2000,
      updated_at: '2024-01-10T10:00:00Z'
    },
    {
      organization_id: 'org-1',
      channel: 'social',
      min_readability: 50,
      max_similarity: 0.9,
      min_fact_supported_ratio: 0.6,
      toxicity_blocklist: ['spam', 'hate'],
      language: 'en',
      max_length: 500,
      updated_at: '2024-01-12T14:30:00Z'
    }
  ];

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      // Use mock data for demonstration
      setPolicies(mockPolicies);
    } catch (error) {
      console.error('Failed to load policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePolicy = async () => {
    try {
      setLoading(true);
      
      const organizationId = session?.user?.organizationId || 'default';
      const policyData = {
        min_readability: formData.min_readability,
        max_similarity: formData.max_similarity,
        min_fact_supported_ratio: formData.min_fact_supported_ratio,
        toxicity_blocklist: formData.toxicity_blocklist.split(',').map(s => s.trim()).filter(s => s),
        language: formData.language,
        max_length: formData.max_length
      };

      await apiClient.upsertQualityPolicy(organizationId, formData.channel, policyData);
      
      const newPolicy: QualityPolicy = {
        organization_id: organizationId,
        channel: formData.channel,
        ...policyData,
        updated_at: new Date().toISOString()
      };

      if (editingPolicy) {
        setPolicies(prev => prev.map(policy => 
          policy.channel === formData.channel ? newPolicy : policy
        ));
      } else {
        setPolicies(prev => [...prev, newPolicy]);
      }

      setShowCreateModal(false);
      setEditingPolicy(null);
      resetForm();
    } catch (error: any) {
      console.error('Failed to save policy:', error);
      alert('Failed to save policy: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPolicy = (policy: QualityPolicy) => {
    setEditingPolicy(policy);
    setFormData({
      channel: policy.channel,
      min_readability: policy.min_readability || 60,
      max_similarity: policy.max_similarity || 0.8,
      min_fact_supported_ratio: policy.min_fact_supported_ratio || 0.7,
      toxicity_blocklist: policy.toxicity_blocklist?.join(', ') || '',
      language: policy.language || 'en',
      max_length: policy.max_length || 2000
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      channel: 'default',
      min_readability: 60,
      max_similarity: 0.8,
      min_fact_supported_ratio: 0.7,
      toxicity_blocklist: '',
      language: 'en',
      max_length: 2000
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getReadabilityColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Quality Policy Configuration</h2>
            <p className="text-sm text-gray-600">Set content quality standards and validation rules</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingPolicy(null);
              setShowCreateModal(true);
            }}
            className="btn-primary"
          >
            Create Policy
          </button>
        </div>

        {/* Quality Policies List */}
        <div className="card">
          <div className="card-content">
            {policies.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">⭐</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Quality Policies</h3>
                <p className="text-gray-600">Create your first quality policy to set content standards.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {policies.map((policy, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-purple-600 text-lg">⭐</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Channel: {policy.channel}</h4>
                          <p className="text-sm text-gray-600">
                            Language: {policy.language} • Max Length: {policy.max_length}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEditPolicy(policy)}
                        className="btn-secondary btn-sm"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Min Readability
                        </label>
                        <div className={`text-sm font-medium ${getReadabilityColor(policy.min_readability || 0)}`}>
                          {policy.min_readability || 'Not set'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Similarity
                        </label>
                        <div className="text-sm text-gray-900">
                          {(policy.max_similarity || 0) * 100}%
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Min Fact Support
                        </label>
                        <div className="text-sm text-gray-900">
                          {(policy.min_fact_supported_ratio || 0) * 100}%
                        </div>
                      </div>
                    </div>

                    {policy.toxicity_blocklist && policy.toxicity_blocklist.length > 0 && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Toxicity Blocklist
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {policy.toxicity_blocklist.map((term, idx) => (
                            <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                              {term}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Updated: {formatDate(policy.updated_at || '')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingPolicy ? 'Edit Quality Policy' : 'Create Quality Policy'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingPolicy(null);
                      resetForm();
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
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Channel
                      </label>
                      <input
                        type="text"
                        value={formData.channel}
                        onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value }))}
                        className="input w-full"
                        placeholder="e.g., default, social, blog"
                        disabled={!!editingPolicy}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                        className="input w-full"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Readability Score (0-100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.min_readability}
                        onChange={(e) => setFormData(prev => ({ ...prev, min_readability: parseInt(e.target.value) }))}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Similarity (0-1)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.max_similarity}
                        onChange={(e) => setFormData(prev => ({ ...prev, max_similarity: parseFloat(e.target.value) }))}
                        className="input w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Fact Support Ratio (0-1)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.min_fact_supported_ratio}
                        onChange={(e) => setFormData(prev => ({ ...prev, min_fact_supported_ratio: parseFloat(e.target.value) }))}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Length
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.max_length}
                        onChange={(e) => setFormData(prev => ({ ...prev, max_length: parseInt(e.target.value) }))}
                        className="input w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Toxicity Blocklist (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.toxicity_blocklist}
                      onChange={(e) => setFormData(prev => ({ ...prev, toxicity_blocklist: e.target.value }))}
                      className="input w-full"
                      placeholder="e.g., spam, hate, violence"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPolicy(null);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePolicy}
                  disabled={loading || !formData.channel}
                  className="btn-primary"
                >
                  {loading ? 'Saving...' : editingPolicy ? 'Update Policy' : 'Create Policy'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Information */}
        <div className="card">
          <div className="card-content">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quality Policy Help</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-lg">ℹ️</span>
                <div>
                  <p className="font-medium text-gray-900">Readability Score</p>
                  <p>Higher scores mean easier to read content (0-100 scale).</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600 text-lg">✅</span>
                <div>
                  <p className="font-medium text-gray-900">Similarity Threshold</p>
                  <p>Maximum allowed similarity to existing content (0-1 scale).</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600 text-lg">⚠️</span>
                <div>
                  <p className="font-medium text-gray-900">Fact Support Ratio</p>
                  <p>Minimum percentage of claims that must be factually supported.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
