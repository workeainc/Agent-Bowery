'use client';

import { useState } from 'react';

interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  dataType: 'analytics' | 'content' | 'platform' | 'roi' | 'all';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeCharts: boolean;
  includeRawData: boolean;
  includeSummary: boolean;
}

interface DataExportProps {
  onExport?: (options: ExportOptions) => void;
}

export default function DataExport({ onExport }: DataExportProps) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    dataType: 'all',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    includeCharts: false,
    includeRawData: true,
    includeSummary: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate export process
      const steps = [
        'Preparing data...',
        'Generating report...',
        'Creating charts...',
        'Formatting output...',
        'Finalizing export...'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setExportProgress(((i + 1) / steps.length) * 100);
      }

      // In a real app, this would trigger the actual export
      if (onExport) {
        onExport(exportOptions);
      }

      // Simulate file download
      const fileName = `analytics-export-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      const mockData = generateMockExportData(exportOptions);
      
      if (exportOptions.format === 'csv') {
        downloadCSV(mockData, fileName);
      } else if (exportOptions.format === 'excel') {
        downloadExcel(mockData, fileName);
      } else if (exportOptions.format === 'pdf') {
        downloadPDF(mockData, fileName);
      } else if (exportOptions.format === 'json') {
        downloadJSON(mockData, fileName);
      }

      setShowExportModal(false);
      alert('Export completed successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const generateMockExportData = (options: ExportOptions) => {
    // Mock data based on export options
    const baseData = {
      exportDate: new Date().toISOString(),
      dateRange: options.dateRange,
      dataType: options.dataType,
      format: options.format
    };

    if (options.dataType === 'analytics' || options.dataType === 'all') {
      return {
        ...baseData,
        analytics: [
          { date: '2024-01-01', views: 1200, engagement: 85, clicks: 45 },
          { date: '2024-01-02', views: 1500, engagement: 92, clicks: 67 },
          { date: '2024-01-03', views: 1100, engagement: 78, clicks: 34 }
        ]
      };
    }

    if (options.dataType === 'content' || options.dataType === 'all') {
      return {
        ...baseData,
        content: [
          { title: 'AI Revolution', platform: 'LinkedIn', views: 8500, engagement: 9.2 },
          { title: 'Product Launch', platform: 'Facebook', views: 12000, engagement: 8.7 }
        ]
      };
    }

    if (options.dataType === 'platform' || options.dataType === 'all') {
      return {
        ...baseData,
        platforms: [
          { platform: 'Facebook', followers: 12500, engagement: 4.2, reach: 8500 },
          { platform: 'LinkedIn', followers: 8900, engagement: 6.8, reach: 6200 }
        ]
      };
    }

    if (options.dataType === 'roi' || options.dataType === 'all') {
      return {
        ...baseData,
        roi: [
          { period: '2024-01', revenue: 15000, cost: 5000, roi: 200 },
          { period: '2024-02', revenue: 18000, cost: 6000, roi: 200 }
        ]
      };
    }

    return baseData;
  };

  const downloadCSV = (data: any, fileName: string) => {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  const downloadExcel = (data: any, fileName: string) => {
    // In a real app, you would use a library like xlsx
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName.replace('.xlsx', '.json');
    link.click();
  };

  const downloadPDF = (data: any, fileName: string) => {
    // In a real app, you would use a library like jsPDF
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName.replace('.pdf', '.json');
    link.click();
  };

  const downloadJSON = (data: any, fileName: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  const convertToCSV = (data: any): string => {
    if (Array.isArray(data)) {
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      
      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value}"` : value;
        });
        csvRows.push(values.join(','));
      }
      
      return csvRows.join('\n');
    }
    
    return JSON.stringify(data, null, 2);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv': return '📊';
      case 'excel': return '📈';
      case 'pdf': return '📄';
      case 'json': return '🔧';
      default: return '📁';
    }
  };

  const getDataTypeIcon = (type: string) => {
    switch (type) {
      case 'analytics': return '📊';
      case 'content': return '📝';
      case 'platform': return '🌐';
      case 'roi': return '💰';
      case 'all': return '📋';
      default: return '📁';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Data Export</h2>
          <p className="text-gray-600 mt-1">
            Export analytics data in various formats
          </p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="btn-primary"
        >
          Export Data
        </button>
      </div>

      {/* Export Options Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📊</span>
              <div>
                <h3 className="font-medium text-gray-900">Analytics Data</h3>
                <p className="text-sm text-gray-600">Performance metrics and trends</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setExportOptions({ ...exportOptions, dataType: 'analytics' })}
                className="btn-outline btn-sm w-full"
              >
                Export Analytics
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📝</span>
              <div>
                <h3 className="font-medium text-gray-900">Content Data</h3>
                <p className="text-sm text-gray-600">Content performance and metrics</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setExportOptions({ ...exportOptions, dataType: 'content' })}
                className="btn-outline btn-sm w-full"
              >
                Export Content
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🌐</span>
              <div>
                <h3 className="font-medium text-gray-900">Platform Data</h3>
                <p className="text-sm text-gray-600">Platform-specific metrics</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setExportOptions({ ...exportOptions, dataType: 'platform' })}
                className="btn-outline btn-sm w-full"
              >
                Export Platforms
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">💰</span>
              <div>
                <h3 className="font-medium text-gray-900">ROI Data</h3>
                <p className="text-sm text-gray-600">Return on investment metrics</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setExportOptions({ ...exportOptions, dataType: 'roi' })}
                className="btn-outline btn-sm w-full"
              >
                Export ROI
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📋</span>
              <div>
                <h3 className="font-medium text-gray-900">All Data</h3>
                <p className="text-sm text-gray-600">Complete analytics export</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setExportOptions({ ...exportOptions, dataType: 'all' })}
                className="btn-outline btn-sm w-full"
              >
                Export All
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⚙️</span>
              <div>
                <h3 className="font-medium text-gray-900">Custom Export</h3>
                <p className="text-sm text-gray-600">Configure export options</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setShowExportModal(true)}
                className="btn-primary btn-sm w-full"
              >
                Custom Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Export Data</h2>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Export Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'csv', label: 'CSV', description: 'Spreadsheet format' },
                    { key: 'excel', label: 'Excel', description: 'Excel workbook' },
                    { key: 'pdf', label: 'PDF', description: 'PDF report' },
                    { key: 'json', label: 'JSON', description: 'Raw data format' }
                  ].map((format) => (
                    <button
                      key={format.key}
                      onClick={() => setExportOptions({ ...exportOptions, format: format.key as any })}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        exportOptions.format === format.key
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getFormatIcon(format.key)}</span>
                        <div>
                          <div className="font-medium text-gray-900">{format.label}</div>
                          <div className="text-sm text-gray-600">{format.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Data Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'analytics', label: 'Analytics', description: 'Performance metrics' },
                    { key: 'content', label: 'Content', description: 'Content performance' },
                    { key: 'platform', label: 'Platform', description: 'Platform metrics' },
                    { key: 'roi', label: 'ROI', description: 'ROI tracking' },
                    { key: 'all', label: 'All Data', description: 'Complete export' }
                  ].map((type) => (
                    <button
                      key={type.key}
                      onClick={() => setExportOptions({ ...exportOptions, dataType: type.key as any })}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        exportOptions.dataType === type.key
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getDataTypeIcon(type.key)}</span>
                        <div>
                          <div className="font-medium text-gray-900">{type.label}</div>
                          <div className="text-sm text-gray-600">{type.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={exportOptions.dateRange.start.toISOString().split('T')[0]}
                      onChange={(e) => setExportOptions({
                        ...exportOptions,
                        dateRange: { ...exportOptions.dateRange, start: new Date(e.target.value) }
                      })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={exportOptions.dateRange.end.toISOString().split('T')[0]}
                      onChange={(e) => setExportOptions({
                        ...exportOptions,
                        dateRange: { ...exportOptions.dateRange, end: new Date(e.target.value) }
                      })}
                      className="input w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Export Options</label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeCharts"
                      checked={exportOptions.includeCharts}
                      onChange={(e) => setExportOptions({ ...exportOptions, includeCharts: e.target.checked })}
                      className="mr-3"
                    />
                    <label htmlFor="includeCharts" className="text-sm text-gray-700">
                      Include charts and visualizations
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeRawData"
                      checked={exportOptions.includeRawData}
                      onChange={(e) => setExportOptions({ ...exportOptions, includeRawData: e.target.checked })}
                      className="mr-3"
                    />
                    <label htmlFor="includeRawData" className="text-sm text-gray-700">
                      Include raw data
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeSummary"
                      checked={exportOptions.includeSummary}
                      onChange={(e) => setExportOptions({ ...exportOptions, includeSummary: e.target.checked })}
                      className="mr-3"
                    />
                    <label htmlFor="includeSummary" className="text-sm text-gray-700">
                      Include summary statistics
                    </label>
                  </div>
                </div>
              </div>

              {/* Export Progress */}
              {isExporting && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Exporting...</span>
                    <span className="text-sm text-gray-600">{Math.round(exportProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${exportProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="btn-outline"
                  disabled={isExporting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  className="btn-primary"
                  disabled={isExporting}
                >
                  {isExporting ? 'Exporting...' : 'Export Data'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
