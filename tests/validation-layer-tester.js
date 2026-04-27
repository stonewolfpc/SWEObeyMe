/**
 * Validation Layer Tester
 * 
 * Structural tests for the governance architecture:
 * - Line count limits
 * - Forbidden patterns
 * - Naming conventions
 * - Directory structure
 * - Handler purity
 * - Router schema compliance
 */

import { governanceRouterHandler, listGovernanceCapabilities } from '../lib/tools/governance-router-handler.js';
import { MAX_LINES, FORBIDDEN_PATTERNS, getAllConfig } from '../lib/config.js';
import fs from 'fs/promises';
import path from 'path';

const TEST_RESULTS = {
  passed: 0,
  failed: 0,
  errors: [],
};

function assert(condition, message) {
  if (condition) {
    TEST_RESULTS.passed++;
    // [REMOVED BY SWEObeyMe]: Forbidden Pattern(`  ✓ ${message}`);
  } else {
    TEST_RESULTS.failed++;
    TEST_RESULTS.errors.push(message);
    console.error(`  ✗ ${message}`);
  }
}

/**
 * Test 1: Line count limits
 */
async function testLineCountLimits() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n📏 Test 1: Line Count Limits');
  
  const maxLines = MAX_LINES();
  assert(maxLines === 700, `Max lines should be 700, got ${maxLines}`);
  
  // Test governance router enforces line count
  const result = await governanceRouterHandler({
    domain: 'files',
    action: 'write',
    payload: {
      path: 'test.txt',
      content: '\n'.repeat(701), // 701 lines (exceeds limit)
    },
  });
  
  assert(result.status === 'error', 'Should reject files exceeding line count');
  assert(result.diagnostics.includes('line count'), 'Error should mention line count');
}

/**
 * Test 2: Forbidden patterns
 */
async function testForbiddenPatterns() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n🚫 Test 2: Forbidden Patterns');
  
  const patterns = FORBIDDEN_PATTERNS();
  assert(patterns.includes('console\\.log'), 'Should include // [REMOVED BY SWEObeyMe]: Forbidden Pattern pattern');
  assert(patterns.includes('// [REMOVED BY SWEObeyMe]: Forbidden Pattern'), 'Should include // [REMOVED BY SWEObeyMe]: Forbidden Pattern pattern');
  assert(patterns.includes('eval\\('), 'Should include eval pattern');
  assert(patterns.includes('// [REMOVED BY SWEObeyMe]: Forbidden Pattern'), 'Should include // [REMOVED BY SWEObeyMe]: Forbidden Pattern pattern');
  
  // Test governance router detects forbidden patterns
  const result = await governanceRouterHandler({
    domain: 'files',
    action: 'write',
    payload: {
      path: 'test.js',
      content: '// [REMOVED BY SWEObeyMe]: Forbidden Pattern("debug");',
    },
  });
  
  assert(result.status === 'error', 'Should reject files with forbidden patterns');
  assert(result.diagnostics.includes('Forbidden pattern'), 'Error should mention forbidden pattern');
}

/**
 * Test 3: Router schema compliance
 */
async function testRouterSchemaCompliance() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n📋 Test 3: Router Schema Compliance');
  
  // Test missing domain
  const noDomain = await governanceRouterHandler({
    action: 'read',
    payload: { path: 'test.txt' },
  });
  assert(noDomain.status === 'error', 'Should reject missing domain');
  assert(noDomain.diagnostics.includes('domain'), 'Error should mention domain');
  
  // Test missing action
  const noAction = await governanceRouterHandler({
    domain: 'files',
    payload: { path: 'test.txt' },
  });
  assert(noAction.status === 'error', 'Should reject missing action');
  assert(noAction.diagnostics.includes('action'), 'Error should mention action');
  
  // Test unknown domain
  const unknownDomain = await governanceRouterHandler({
    domain: 'unknown',
    action: 'read',
    payload: {},
  });
  assert(unknownDomain.status === 'error', 'Should reject unknown domain');
  
  // Test unknown action
  const unknownAction = await governanceRouterHandler({
    domain: 'files',
    action: 'unknown',
    payload: {},
  });
  assert(unknownAction.status === 'error', 'Should reject unknown action');
}

/**
 * Test 4: Response format compliance
 */
async function testResponseFormatCompliance() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n📦 Test 4: Response Format Compliance');
  
  const result = await governanceRouterHandler({
    domain: 'files',
    action: 'read',
    payload: { path: 'package.json' },
  });
  
  assert(result.hasOwnProperty('status'), 'Response should have status property');
  assert(result.hasOwnProperty('result'), 'Response should have result property');
  assert(result.hasOwnProperty('diagnostics'), 'Response should have diagnostics property');
  assert(result.hasOwnProperty('next_steps'), 'Response should have next_steps property');
  assert(['ok', 'error', 'partial'].includes(result.status), 'Status should be ok, error, or partial');
}

/**
 * Test 5: Handler purity check
 */
async function testHandlerPurity() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n🧪 Test 5: Handler Purity Check');
  
  // Call same operation twice with same input
  const payload = { domain: 'files', action: 'read', payload: { path: 'package.json' } };
  
  const result1 = await governanceRouterHandler(payload);
  const result2 = await governanceRouterHandler(payload);
  
  // Results should be consistent (both succeed or both fail)
  assert(result1.status === result2.status, 'Handler should be deterministic');
}

/**
 * Test 6: Governance capabilities
 */
async function testGovernanceCapabilities() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n🎯 Test 6: Governance Capabilities');
  
  const caps = listGovernanceCapabilities();
  
  assert(caps.totalDomains > 0, 'Should have at least one domain');
  assert(caps.totalHandlers > 0, 'Should have at least one handler');
  assert(caps.capabilities.files, 'Should have files domain');
  assert(caps.capabilities.backup, 'Should have backup domain');
  assert(caps.capabilities.search, 'Should have search domain');
  assert(caps.capabilities.project, 'Should have project domain');
}

/**
 * Test 7: Directory structure validation
 */
async function testDirectoryStructure() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n📁 Test 7: Directory Structure');
  
  // Check surface directory exists
  const surfaceDir = await fs.access('lib/tools/surface').then(() => true).catch(() => false);
  assert(surfaceDir, 'Surface directory should exist');
  
  // Check surface files exist
  const surfaceFiles = [
    'lib/tools/surface/file-ops-surface.js',
    'lib/tools/surface/backup-restore-surface.js',
    'lib/tools/surface/project-context-surface.js',
    'lib/tools/surface/sweobeyme-execute-surface.js',
  ];
  
  for (const file of surfaceFiles) {
    const exists = await fs.access(file).then(() => true).catch(() => false);
    assert(exists, `${file} should exist`);
  }
}

/**
 * Run all tests
 */
export async function runValidationLayerTests() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n' + '='.repeat(60));
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('Validation Layer Tests');
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('='.repeat(60));
  
  try {
    await testLineCountLimits();
    await testForbiddenPatterns();
    await testRouterSchemaCompliance();
    await testResponseFormatCompliance();
    await testHandlerPurity();
    await testGovernanceCapabilities();
    await testDirectoryStructure();
  } catch (error) {
    console.error('Test suite error:', error);
    TEST_RESULTS.errors.push(error.message);
  }
  
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n' + '='.repeat(60));
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern(`Results: ${TEST_RESULTS.passed} passed, ${TEST_RESULTS.failed} failed`);
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('='.repeat(60));
  
  if (TEST_RESULTS.errors.length > 0) {
    console.error('\nErrors:');
    TEST_RESULTS.errors.forEach((err, i) => console.error(`  ${i + 1}. ${err}`));
  }
  
  return TEST_RESULTS;
}

// Run if executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runValidationLayerTests();
}
