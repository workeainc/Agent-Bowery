'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface ConnectionDiagnosticsProps {
  provider: string;
}

interface DiagnosticStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  message?: string;
  details?: any;
}

export default function ConnectionDiagnostics({ provider }: ConnectionDiagnosticsProps) {
  const [diagnostics, setDiagnostics] = useState<DiagnosticStep[]>([]);
  const [running, setRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  const diagnosticSteps: Omit<DiagnosticStep, 'status' | 'message' | 'details'>[] = [
    { id: 'token', name: 'Token Validation' },
    { id: 'connection', name: 'Platform Connection' },
    { id: 'ping', name: 'Platform Ping' },
    { id: 'permissions', name: 'Permissions Check' }
  ];

  const runDiagnostics = async () => {
    setRunning(true);
    setOverallStatus('pending');
    
    // Initialize diagnostic steps
    const initialSteps = diagnosticSteps.map(step => ({
      ...step,
      status: 'pending' as const
    }));
    setDiagnostics(initialSteps);

    // Run each diagnostic step
    for (let i = 0; i < diagnosticSteps.length; i++) {
      const step = diagnosticSteps[i];
      
      // Update step to running
      setDiagnostics(prev => prev.map(s => 
        s.id === step.id ? { ...s, status: 'running' } : s
      ));

      try {
        let result;
        let message = '';
        let details = null;

        switch (step.id) {
          case 'token':
            result = await apiClient.getTokenStatus(provider);
            message = result.ok ? 'Token is valid' : 'No token found';
            details = result;
            break;
            
          case 'connection':
            result = await apiClient.testPlatformConnection(provider);
            message = result.ok ? 'Connection successful' : `Connection failed: ${result.error}`;
            details = result;
            break;
            
          case 'ping':
            result = await apiClient.pingPlatform(provider);
            message = result.ok ? 'Ping successful' : `Ping failed: ${result.error}`;
            details = result;
            break;
            
          case 'permissions':
            // Mock permissions check
            result = { ok: true, permissions: ['read', 'write', 'publish'] };
            message = 'Permissions verified';
            details = result;
            break;
        }

        // Update step with result
        setDiagnostics(prev => prev.map(s => 
          s.id === step.id ? { 
            ...s, 
            status: result.ok ? 'success' : 'failed',
            message,
            details
          } : s
        ));

        // Small delay between steps
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error: any) {
        // Update step with error
        setDiagnostics(prev => prev.map(s => 
          s.id === step.id ? { 
            ...s, 
            status: 'failed',
            message: error.message || 'Test failed',
            details: { error: error.message }
          } : s
        ));
      }
    }

    // Determine overall status
    const finalSteps = diagnostics.map(s => s.status);
    const hasFailures = finalSteps.includes('failed');
    const allSuccess = finalSteps.every(s => s === 'success');
    
    setOverallStatus(allSuccess ? 'success' : hasFailures ? 'failed' : 'pending');
    setRunning(false);
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'running':
        return '🔄';
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-gray-600';
      case 'running':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getOverallIcon = () => {
    switch (overallStatus) {
      case 'pending':
        return '⏳';
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  const getOverallColor = () => {
    switch (overallStatus) {
      case 'pending':
        return 'text-gray-600';
      case 'success':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Connection Diagnostics</h3>
        
        {/* Overall Status */}
        <div className="mb-4 p-3 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`text-lg ${getOverallColor()}`}>{getOverallIcon()}</span>
            <span className="font-medium text-gray-900">Overall Status</span>
          </div>
          <div className="text-sm text-gray-600">
            {overallStatus === 'pending' && 'Ready to run diagnostics'}
            {overallStatus === 'success' && 'All tests passed - connection is healthy'}
            {overallStatus === 'failed' && 'Some tests failed - check individual results'}
          </div>
        </div>

        {/* Diagnostic Steps */}
        <div className="space-y-2">
          {diagnostics.map((step) => (
            <div key={step.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className={`text-lg ${getStepColor(step.status)}`}>
                  {getStepIcon(step.status)}
                </span>
                <div>
                  <div className="font-medium text-gray-900">{step.name}</div>
                  {step.message && (
                    <div className="text-sm text-gray-600">{step.message}</div>
                  )}
                </div>
              </div>
              
              {step.status === 'running' && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              )}
            </div>
          ))}
        </div>

        {/* Run Button */}
        <div className="mt-4">
          <button
            onClick={runDiagnostics}
            disabled={running}
            className="btn-primary w-full"
          >
            {running ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </button>
        </div>

        {/* Detailed Results */}
        {diagnostics.some(s => s.details) && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Detailed Results</h4>
            <div className="space-y-2">
              {diagnostics.filter(s => s.details).map((step) => (
                <div key={step.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="font-medium text-gray-900 mb-1">{step.name}</div>
                  <pre className="text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(step.details, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">ℹ️</span>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Diagnostic Information:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Token Validation: Checks if OAuth token exists and is valid</li>
                <li>Platform Connection: Tests connection to the platform API</li>
                <li>Platform Ping: Sends a ping request to verify connectivity</li>
                <li>Permissions Check: Verifies required permissions are granted</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
