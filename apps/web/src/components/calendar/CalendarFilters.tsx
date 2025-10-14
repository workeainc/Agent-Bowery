'use client';

import { useState } from 'react';

interface CalendarFiltersProps {
  events: Array<{
    id: string;
    title: string;
    start: Date;
    end: Date;
    platform: string;
    contentType: string;
    status: string;
  }>;
  onFilterChange: (filters: {
    platforms: string[];
    contentTypes: string[];
    statuses: string[];
    search: string;
  }) => void;
}

export default function CalendarFilters({ events, onFilterChange }: CalendarFiltersProps) {
  const [filters, setFilters] = useState({
    platforms: [] as string[],
    contentTypes: [] as string[],
    statuses: [] as string[],
    search: '',
  });

  const [showFilters, setShowFilters] = useState(false);

  // Get unique values for filter options
  const platforms = Array.from(new Set(events.map(e => e.platform)));
  const contentTypes = Array.from(new Set(events.map(e => e.contentType)));
  const statuses = Array.from(new Set(events.map(e => e.status)));

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleFilter = (type: 'platforms' | 'contentTypes' | 'statuses', value: string) => {
    const currentValues = filters[type];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    handleFilterChange({
      ...filters,
      [type]: newValues
    });
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      platforms: [],
      contentTypes: [],
      statuses: [],
      search: '',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'FACEBOOK': return '📘';
      case 'LINKEDIN': return '💼';
      case 'INSTAGRAM': return '📷';
      case 'TWITTER': return '🐦';
      case 'MAIL': return '📧';
      case 'BLOG': return '📝';
      default: return '📱';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeFiltersCount = filters.platforms.length + filters.contentTypes.length + filters.statuses.length + (filters.search ? 1 : 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-sm font-medium text-gray-900">Calendar Filters</h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
              {activeFiltersCount} active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={filters.search}
          onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
          className="input w-full"
          placeholder="Search events..."
        />
      </div>

      {showFilters && (
        <div className="space-y-4">
          {/* Platform Filters */}
          {platforms.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platforms ({filters.platforms.length}/{platforms.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => (
                  <button
                    key={platform}
                    onClick={() => toggleFilter('platforms', platform)}
                    className={`flex items-center space-x-2 px-3 py-1 text-sm font-medium rounded-full border ${
                      filters.platforms.includes(platform)
                        ? 'bg-primary-100 text-primary-700 border-primary-300'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <span>{getPlatformIcon(platform)}</span>
                    <span>{platform}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content Type Filters */}
          {contentTypes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Types ({filters.contentTypes.length}/{contentTypes.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {contentTypes.map((contentType) => (
                  <button
                    key={contentType}
                    onClick={() => toggleFilter('contentTypes', contentType)}
                    className={`px-3 py-1 text-sm font-medium rounded-full border ${
                      filters.contentTypes.includes(contentType)
                        ? 'bg-primary-100 text-primary-700 border-primary-300'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {contentType.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status Filters */}
          {statuses.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status ({filters.statuses.length}/{statuses.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => toggleFilter('statuses', status)}
                    className={`px-3 py-1 text-sm font-medium rounded-full border ${
                      filters.statuses.includes(status)
                        ? 'bg-primary-100 text-primary-700 border-primary-300'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getStatusColor(status).replace('text-', 'bg-').replace('bg-blue-800', 'bg-blue-500').replace('bg-green-800', 'bg-green-500').replace('bg-gray-800', 'bg-gray-500').replace('bg-red-800', 'bg-red-500')}`}></span>
                    {status}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Filter Presets */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Quick filters:</span>
          <button
            onClick={() => handleFilterChange({ ...filters, platforms: ['FACEBOOK', 'LINKEDIN'] })}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Professional
          </button>
          <span className="text-gray-300">•</span>
          <button
            onClick={() => handleFilterChange({ ...filters, platforms: ['INSTAGRAM', 'TWITTER'] })}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Social
          </button>
          <span className="text-gray-300">•</span>
          <button
            onClick={() => handleFilterChange({ ...filters, statuses: ['scheduled'] })}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Scheduled Only
          </button>
        </div>
      </div>
    </div>
  );
}
