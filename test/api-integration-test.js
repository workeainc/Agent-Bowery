#!/usr/bin/env node

/**
 * Agent Bowery API Integration Test Suite
 * 
 * This script tests all major API endpoints and functionality
 * Run with: node test/api-integration-test.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:44000';
const API_KEY = 'test-api-key';

// Test configuration
const config = {
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};

// Test state
let testState = {
  jwtToken: null,
  contentItemId: null,
  versionId: null,
  scheduleId: null,
  testResults: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function addResult(testName, success, message, data = null) {
  testState.testResults.push({
    test: testName,
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const response = await axios({
      method,
      url: endpoint,
      data,
      ...config,
      headers: { ...config.headers, ...headers }
    });
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
}

// Test functions
async function testHealthCheck() {
  log('Testing health check...');
  const result = await makeRequest('GET', '/health');
  
  if (result.success && result.data.status === 'ok') {
    log('Health check passed', 'success');
    addResult('Health Check', true, 'API is healthy');
  } else {
    log('Health check failed', 'error');
    addResult('Health Check', false, 'API health check failed', result.error);
  }
}

async function testAuthentication() {
  log('Testing authentication...');
  
  // Test API key authentication
  const apiKeyResult = await makeRequest('GET', '/health', null, { 'X-API-KEY': API_KEY });
  if (apiKeyResult.success) {
    log('API key authentication works', 'success');
    addResult('API Key Auth', true, 'API key authentication successful');
  } else {
    log('API key authentication failed', 'error');
    addResult('API Key Auth', false, 'API key authentication failed', apiKeyResult.error);
  }

  // Test JWT authentication
  const jwtResult = await makeRequest('GET', '/auth/dev-token?roles=admin');
  if (jwtResult.success && jwtResult.data.token) {
    testState.jwtToken = jwtResult.data.token;
    log('JWT token obtained', 'success');
    addResult('JWT Auth', true, 'JWT token generation successful');
  } else {
    log('JWT token generation failed', 'error');
    addResult('JWT Auth', false, 'JWT token generation failed', jwtResult.error);
  }
}

async function testContentManagement() {
  log('Testing content management...');
  
  if (!testState.jwtToken) {
    log('Skipping content tests - no JWT token', 'error');
    return;
  }

  const authHeaders = { 'Authorization': `Bearer ${testState.jwtToken}` };

  // Create content
  const createResult = await makeRequest('POST', '/content', {
    title: 'Integration Test Blog Post',
    type: 'BLOG',
    status: 'DRAFT',
    tags: ['test', 'integration'],
    metadata: { author: 'test-user' }
  }, { ...authHeaders, 'Idempotency-Key': 'test-create-' + Date.now() });

  if (createResult.success && createResult.data.id) {
    testState.contentItemId = createResult.data.id;
    log('Content created successfully', 'success');
    addResult('Create Content', true, 'Content creation successful', { id: testState.contentItemId });
  } else {
    log('Content creation failed', 'error');
    addResult('Create Content', false, 'Content creation failed', createResult.error);
    return;
  }

  // Create content version
  const versionResult = await makeRequest('POST', `/content/${testState.contentItemId}/version`, {
    body: 'This is the main content body for the integration test blog post. It contains detailed information and insights.',
    title: 'Integration Test Blog Post - Updated',
    summary: 'A test blog post for integration testing',
    mediaUrls: ['https://example.com/test-image.jpg'],
    metadata: { wordCount: 50, readingTime: '1 minute' }
  }, { ...authHeaders, 'Idempotency-Key': 'test-version-' + Date.now() });

  if (versionResult.success && versionResult.data.versionId) {
    testState.versionId = versionResult.data.versionId;
    log('Content version created successfully', 'success');
    addResult('Create Version', true, 'Content version creation successful', { versionId: testState.versionId });
  } else {
    log('Content version creation failed', 'error');
    addResult('Create Version', false, 'Content version creation failed', versionResult.error);
  }

  // Set current version
  const setVersionResult = await makeRequest('POST', `/content/${testState.contentItemId}/version/current`, {
    versionId: testState.versionId
  }, authHeaders);

  if (setVersionResult.success) {
    log('Current version set successfully', 'success');
    addResult('Set Current Version', true, 'Current version set successfully');
  } else {
    log('Setting current version failed', 'error');
    addResult('Set Current Version', false, 'Setting current version failed', setVersionResult.error);
  }
}

async function testContentApproval() {
  log('Testing content approval with previews...');
  
  if (!testState.jwtToken || !testState.contentItemId) {
    log('Skipping approval tests - missing prerequisites', 'error');
    return;
  }

  const authHeaders = { 'Authorization': `Bearer ${testState.jwtToken}` };

  // Approve content with preview generation
  const approveResult = await makeRequest('POST', `/content/${testState.contentItemId}/approve`, {
    approvedBy: 'test-admin',
    notes: 'Approved for integration testing',
    generatePreviews: true,
    platforms: ['FACEBOOK', 'LINKEDIN', 'YOUTUBE']
  }, { ...authHeaders, 'Idempotency-Key': 'test-approve-' + Date.now() });

  if (approveResult.success && approveResult.data.adaptedPreviews) {
    log('Content approved with previews generated', 'success');
    addResult('Approve Content', true, 'Content approval successful', { 
      previewCount: approveResult.data.previewCount,
      platforms: Object.keys(approveResult.data.adaptedPreviews)
    });
  } else {
    log('Content approval failed', 'error');
    addResult('Approve Content', false, 'Content approval failed', approveResult.error);
  }

  // Get content previews
  const previewsResult = await makeRequest('GET', `/content/${testState.contentItemId}/previews`, null, authHeaders);

  if (previewsResult.success && previewsResult.data.adaptedPreviews) {
    log('Content previews retrieved successfully', 'success');
    addResult('Get Previews', true, 'Content previews retrieval successful', {
      previewCount: Object.keys(previewsResult.data.adaptedPreviews).length
    });
  } else {
    log('Content previews retrieval failed', 'error');
    addResult('Get Previews', false, 'Content previews retrieval failed', previewsResult.error);
  }
}

async function testContentScheduling() {
  log('Testing content scheduling...');
  
  if (!testState.jwtToken || !testState.contentItemId) {
    log('Skipping scheduling tests - missing prerequisites', 'error');
    return;
  }

  const authHeaders = { 'Authorization': `Bearer ${testState.jwtToken}` };

  // Schedule content
  const scheduleResult = await makeRequest('POST', `/content/${testState.contentItemId}/schedule`, {
    platform: 'FACEBOOK',
    scheduledAt: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
    mediaUrls: ['https://example.com/test-image.jpg'],
    adaptedContent: {
      text: 'Adapted content for Facebook',
      hashtags: ['#test', '#integration']
    }
  }, { ...authHeaders, 'Idempotency-Key': 'test-schedule-' + Date.now() });

  if (scheduleResult.success && scheduleResult.data.scheduleId) {
    testState.scheduleId = scheduleResult.data.scheduleId;
    log('Content scheduled successfully', 'success');
    addResult('Schedule Content', true, 'Content scheduling successful', { 
      scheduleId: testState.scheduleId,
      platform: scheduleResult.data.platform
    });
  } else {
    log('Content scheduling failed', 'error');
    addResult('Schedule Content', false, 'Content scheduling failed', scheduleResult.error);
  }

  // Get due schedules
  const dueSchedulesResult = await makeRequest('GET', '/content/schedules/due', null, authHeaders);

  if (dueSchedulesResult.success) {
    log('Due schedules retrieved successfully', 'success');
    addResult('Get Due Schedules', true, 'Due schedules retrieval successful', {
      count: dueSchedulesResult.data.schedules?.length || 0
    });
  } else {
    log('Due schedules retrieval failed', 'error');
    addResult('Get Due Schedules', false, 'Due schedules retrieval failed', dueSchedulesResult.error);
  }
}

async function testContentAdaptation() {
  log('Testing content adaptation...');
  
  if (!testState.jwtToken || !testState.contentItemId) {
    log('Skipping adaptation tests - missing prerequisites', 'error');
    return;
  }

  const authHeaders = { 'Authorization': `Bearer ${testState.jwtToken}` };

  // Test content adaptation
  const adaptResult = await makeRequest('POST', `/content/${testState.contentItemId}/adapt`, {
    platform: 'FACEBOOK',
    mediaUrls: ['https://example.com/test-image.jpg']
  }, authHeaders);

  if (adaptResult.success && adaptResult.data.adapted) {
    log('Content adaptation successful', 'success');
    addResult('Adapt Content', true, 'Content adaptation successful', {
      platform: adaptResult.data.platform,
      validation: adaptResult.data.validation
    });
  } else {
    log('Content adaptation failed', 'error');
    addResult('Adapt Content', false, 'Content adaptation failed', adaptResult.error);
  }

  // Get platform rules
  const platformsResult = await makeRequest('GET', '/content/platforms', null, authHeaders);

  if (platformsResult.success && platformsResult.data.platforms) {
    log('Platform rules retrieved successfully', 'success');
    addResult('Get Platform Rules', true, 'Platform rules retrieval successful', {
      platformCount: platformsResult.data.platforms.length
    });
  } else {
    log('Platform rules retrieval failed', 'error');
    addResult('Get Platform Rules', false, 'Platform rules retrieval failed', platformsResult.error);
  }
}

async function testOAuthAndTokens() {
  log('Testing OAuth and token management...');
  
  if (!testState.jwtToken) {
    log('Skipping OAuth tests - no JWT token', 'error');
    return;
  }

  const authHeaders = { 'Authorization': `Bearer ${testState.jwtToken}` };

  // Test OAuth start endpoints
  const metaOAuthResult = await makeRequest('GET', '/oauth/meta/start');
  if (metaOAuthResult.success && metaOAuthResult.data.authUrl) {
    log('Meta OAuth URL generated successfully', 'success');
    addResult('Meta OAuth Start', true, 'Meta OAuth URL generation successful');
  } else {
    log('Meta OAuth URL generation failed', 'error');
    addResult('Meta OAuth Start', false, 'Meta OAuth URL generation failed', metaOAuthResult.error);
  }

  // Test dev token save
  const devSaveResult = await makeRequest('GET', '/oauth/meta/dev-save');
  if (devSaveResult.success) {
    log('Dev tokens saved successfully', 'success');
    addResult('Save Dev Tokens', true, 'Dev token save successful');
  } else {
    log('Dev token save failed', 'error');
    addResult('Save Dev Tokens', false, 'Dev token save failed', devSaveResult.error);
  }

  // Test token status
  const tokenStatusResult = await makeRequest('GET', '/tokens/meta/status', null, authHeaders);
  if (tokenStatusResult.success) {
    log('Token status retrieved successfully', 'success');
    addResult('Get Token Status', true, 'Token status retrieval successful', {
      status: tokenStatusResult.data.status,
      dummy: tokenStatusResult.data.dummy
    });
  } else {
    log('Token status retrieval failed', 'error');
    addResult('Get Token Status', false, 'Token status retrieval failed', tokenStatusResult.error);
  }
}

async function testWebhooks() {
  log('Testing webhook endpoints...');

  // Test Meta webhook verification
  const verifyResult = await makeRequest('GET', '/webhooks/meta?hub.mode=subscribe&hub.verify_token=dev-token&hub.challenge=test_challenge');
  if (verifyResult.success && verifyResult.data === 'test_challenge') {
    log('Meta webhook verification successful', 'success');
    addResult('Meta Webhook Verification', true, 'Meta webhook verification successful');
  } else {
    log('Meta webhook verification failed', 'error');
    addResult('Meta Webhook Verification', false, 'Meta webhook verification failed', verifyResult.error);
  }

  // Test Meta webhook event
  const webhookEventResult = await makeRequest('POST', '/webhooks/meta', {
    object: 'page',
    entry: [{
      id: '123',
      time: Math.floor(Date.now() / 1000),
      changes: [{
        field: 'feed',
        value: {
          item: 'comment',
          verb: 'add'
        }
      }]
    }]
  }, { 'X-Hub-Signature-256': 'sha256=test_signature' });

  if (webhookEventResult.success && webhookEventResult.data.ok) {
    log('Meta webhook event processed successfully', 'success');
    addResult('Meta Webhook Event', true, 'Meta webhook event processing successful', {
      idemKey: webhookEventResult.data.idemKey
    });
  } else {
    log('Meta webhook event processing failed', 'error');
    addResult('Meta Webhook Event', false, 'Meta webhook event processing failed', webhookEventResult.error);
  }
}

async function testRateLimiting() {
  log('Testing rate limiting...');

  const requests = [];
  for (let i = 0; i < 5; i++) {
    requests.push(makeRequest('GET', '/health'));
  }

  const results = await Promise.all(requests);
  const successCount = results.filter(r => r.success).length;
  
  if (successCount >= 4) { // Allow for some rate limiting
    log('Rate limiting test completed', 'success');
    addResult('Rate Limiting', true, 'Rate limiting test completed', {
      successfulRequests: successCount,
      totalRequests: requests.length
    });
  } else {
    log('Rate limiting test failed', 'error');
    addResult('Rate Limiting', false, 'Rate limiting test failed', {
      successfulRequests: successCount,
      totalRequests: requests.length
    });
  }
}

async function testIdempotency() {
  log('Testing idempotency...');

  const idempotencyKey = 'test-idempotency-' + Date.now();
  const authHeaders = { 'Authorization': `Bearer ${testState.jwtToken}` };

  // First request
  const firstResult = await makeRequest('POST', '/content', {
    title: 'Idempotency Test Post',
    type: 'BLOG',
    status: 'DRAFT'
  }, { ...authHeaders, 'Idempotency-Key': idempotencyKey });

  // Second request with same key
  const secondResult = await makeRequest('POST', '/content', {
    title: 'Idempotency Test Post - Different',
    type: 'BLOG',
    status: 'DRAFT'
  }, { ...authHeaders, 'Idempotency-Key': idempotencyKey });

  if (firstResult.success && secondResult.success && 
      firstResult.data.id === secondResult.data.id) {
    log('Idempotency test passed', 'success');
    addResult('Idempotency', true, 'Idempotency test successful', {
      firstId: firstResult.data.id,
      secondId: secondResult.data.id
    });
  } else {
    log('Idempotency test failed', 'error');
    addResult('Idempotency', false, 'Idempotency test failed', {
      firstResult: firstResult.success,
      secondResult: secondResult.success
    });
  }
}

// Main test runner
async function runTests() {
  log('Starting Agent Bowery API Integration Tests...', 'info');
  log('================================================', 'info');

  try {
    await testHealthCheck();
    await testAuthentication();
    await testContentManagement();
    await testContentApproval();
    await testContentScheduling();
    await testContentAdaptation();
    await testOAuthAndTokens();
    await testWebhooks();
    await testRateLimiting();
    await testIdempotency();

    // Print results
    log('================================================', 'info');
    log('Test Results Summary:', 'info');
    log('================================================', 'info');

    const passed = testState.testResults.filter(r => r.success).length;
    const failed = testState.testResults.filter(r => !r.success).length;
    const total = testState.testResults.length;

    log(`Total Tests: ${total}`, 'info');
    log(`Passed: ${passed}`, 'success');
    log(`Failed: ${failed}`, failed > 0 ? 'error' : 'success');

    if (failed > 0) {
      log('', 'info');
      log('Failed Tests:', 'error');
      testState.testResults
        .filter(r => !r.success)
        .forEach(result => {
          log(`  - ${result.test}: ${result.message}`, 'error');
        });
    }

    log('', 'info');
    log('Test completed!', 'info');

  } catch (error) {
    log(`Test runner error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runTests, testState };
