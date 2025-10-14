'use client';

import { useState, useEffect } from 'react';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
  duration?: number;
}

interface PlatformTest {
  platform: string;
  status: 'idle' | 'testing' | 'completed' | 'error';
  results: TestResult[];
  startTime?: Date;
  endTime?: Date;
  overallStatus: 'pass' | 'fail' | 'warning';
}

interface PlatformTestingProps {
  onTestComplete?: (platform: string, results: TestResult[]) => void;
}

export default function PlatformTesting({ onTestComplete }: PlatformTestingProps) {
  const [platformTests, setPlatformTests] = useState<PlatformTest[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);

  // Mock platform tests
  const mockPlatformTests: PlatformTest[] = [
    {
      platform: 'Facebook',
      status: 'idle',
      results: [],
      overallStatus: 'pass'
    },
    {
      platform: 'LinkedIn',
      status: 'idle',
      results: [],
      overallStatus: 'pass'
    },
    {
      platform: 'Instagram',
      status: 'idle',
      results: [],
      overallStatus: 'pass'
    },
    {
      platform: 'Twitter',
      status: 'idle',
      results: [],
      overallStatus: 'pass'
    },
    {
      platform: 'Email',
      status: 'idle',
      results: [],
      overallStatus: 'pass'
    }
  ];

  useEffect(() => {
    setPlatformTests(mockPlatformTests);
  }, []);

  const runPlatformTests = async (platform: string) => {
    const testIndex = platformTests.findIndex(test => test.platform === platform);
    if (testIndex === -1) return;

    // Set testing status
    setPlatformTests(prev => prev.map(test => 
      test.platform === platform 
        ? { ...test, status: 'testing', startTime: new Date(), results: [] }
        : test
    ));

    // Simulate running tests
    const tests = getTestsForPlatform(platform);
    const results: TestResult[] = [];

    for (const test of tests) {
      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await simulateTest(test, platform);
      results.push(result);

      // Update results in real-time
      setPlatformTests(prev => prev.map(test => 
        test.platform === platform 
          ? { ...test, results: [...results] }
          : test
      ));
    }

    // Complete testing
    const overallStatus = results.every(r => r.status === 'pass') ? 'pass' : 
                        results.some(r => r.status === 'fail') ? 'fail' : 'warning';

    setPlatformTests(prev => prev.map(test => 
      test.platform === platform 
        ? { 
            ...test, 
            status: 'completed', 
            endTime: new Date(),
            overallStatus,
            results 
          }
        : test
    ));

    if (onTestComplete) {
      onTestComplete(platform, results);
    }
  };

  const getTestsForPlatform = (platform: string): string[] => {
    const baseTests = ['Authentication', 'API Access', 'Rate Limits', 'Webhook'];
    
    switch (platform) {
      case 'Facebook':
        return [...baseTests, 'Page Access', 'Post Publishing', 'Analytics'];
      case 'LinkedIn':
        return [...baseTests, 'Company Page', 'Content Publishing', 'Engagement'];
      case 'Instagram':
        return [...baseTests, 'Business Account', 'Media Upload', 'Stories'];
      case 'Twitter':
        return [...baseTests, 'Tweet Publishing', 'Media Upload', 'User Data'];
      case 'Email':
        return [...baseTests, 'SMTP Connection', 'Template Rendering', 'Delivery'];
      default:
        return baseTests;
    }
  };

  const simulateTest = async (testName: string, platform: string): Promise<TestResult> => {
    // Simulate different test outcomes
    const outcomes = [
      { status: 'pass' as const, message: 'Test passed successfully' },
      { status: 'warning' as const, message: 'Test passed with warnings' },
      { status: 'fail' as const, message: 'Test failed' }
    ];

    // Weighted random selection (80% pass, 15% warning, 5% fail)
    const random = Math.random();
    let outcome;
    if (random < 0.8) {
      outcome = outcomes[0];
    } else if (random < 0.95) {
      outcome = outcomes[1];
    } else {
      outcome = outcomes[2];
    }

    const duration = Math.random() * 2000 + 500; // 500-2500ms

    return {
      test: testName,
      status: outcome.status,
      message: outcome.message,
      details: getTestDetails(testName, platform, outcome.status),
      duration: Math.round(duration)
    };
  };

  const getTestDetails = (testName: string, platform: string, status: string): string => {
    const details = {
      'Authentication': {
        pass: 'OAuth tokens are valid and not expired',
        warning: 'Token expires soon, consider refreshing',
        fail: 'Invalid or expired authentication tokens'
      },
      'API Access': {
        pass: 'API endpoints are accessible and responding',
        warning: 'Some API endpoints have limited access',
        fail: 'API access denied or endpoints unavailable'
      },
      'Rate Limits': {
        pass: 'Rate limits are within acceptable range',
        warning: 'Approaching rate limit thresholds',
        fail: 'Rate limits exceeded or too restrictive'
      },
      'Webhook': {
        pass: 'Webhook endpoint is active and receiving events',
        warning: 'Webhook endpoint responding slowly',
        fail: 'Webhook endpoint not responding or misconfigured'
      }
    };

    return details[testName as keyof typeof details]?.[status as keyof typeof details[testName]] || 'No additional details';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return '✅';
      case 'warning': return '⚠️';
      case 'fail': return '❌';
      case 'testing': return '🔄';
      case 'idle': return '⏸️';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'fail': return 'text-red-600 bg-red-100';
      case 'testing': return 'text-blue-600 bg-blue-100';
      case 'idle': return 'text-gray-600 bg-gray-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Facebook': return '📘';
      case 'LinkedIn': return '💼';
      case 'Instagram': return '📷';
      case 'Twitter': return '🐦';
      case 'Email': return '📧';
      default: return '📱';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Platform Testing</h2>
          <p className="text-gray-600 mt-1">
            Test platform connections and API functionality
          </p>
        </div>
        <button
          onClick={() => setShowTestModal(true)}
          className="btn-primary"
        >
          Run All Tests
        </button>
      </div>

      {/* Platform Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platformTests.map((test) => (
          <div key={test.platform} className="card">
            <div className="card-content">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getPlatformIcon(test.platform)}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{test.platform}</h3>
                    <p className="text-sm text-gray-600">Platform Tests</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getStatusIcon(test.status)}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(test.status)}`}>
                    {test.status}
                  </span>
                </div>
              </div>

              {/* Test Results Summary */}
              {test.results.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Tests Run:</span>
                    <span className="font-medium text-gray-900">{test.results.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Passed:</span>
                    <span className="font-medium text-green-600">
                      {test.results.filter(r => r.status === 'pass').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Warnings:</span>
                    <span className="font-medium text-yellow-600">
                      {test.results.filter(r => r.status === 'warning').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Failed:</span>
                    <span className="font-medium text-red-600">
                      {test.results.filter(r => r.status === 'fail').length}
                    </span>
                  </div>
                </div>
              )}

              {/* Test Duration */}
              {test.startTime && test.endTime && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium text-gray-900">
                      {formatDuration(test.endTime.getTime() - test.startTime.getTime())}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => runPlatformTests(test.platform)}
                  className="btn-primary btn-sm flex-1"
                  disabled={test.status === 'testing'}
                >
                  {test.status === 'testing' ? 'Testing...' : 'Run Tests'}
                </button>
                {test.results.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedPlatform(test.platform);
                      setShowTestModal(true);
                    }}
                    className="btn-outline btn-sm"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Test Details Modal */}
      {showTestModal && selectedPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Test Results - {selectedPlatform}
                </h2>
                <button
                  onClick={() => {
                    setShowTestModal(false);
                    setSelectedPlatform(null);
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
              {(() => {
                const test = platformTests.find(t => t.platform === selectedPlatform);
                if (!test || test.results.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-2">🧪</div>
                      <p className="text-gray-500">No test results available</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {test.results.map((result, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{getStatusIcon(result.status)}</span>
                            <h3 className="font-medium text-gray-900">{result.test}</h3>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(result.status)}`}>
                            {result.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                        {result.details && (
                          <p className="text-xs text-gray-500 mb-2">{result.details}</p>
                        )}
                        {result.duration && (
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Duration: {formatDuration(result.duration)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowTestModal(false);
                    setSelectedPlatform(null);
                  }}
                  className="btn-outline"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (selectedPlatform) {
                      runPlatformTests(selectedPlatform);
                    }
                  }}
                  className="btn-primary"
                >
                  Run Tests Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
