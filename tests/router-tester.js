/**
 * Router Tester
 *
 * Governance router logic tests:
 * - Domain/action routing
 * - Fallback behavior
 * - Error translation
 * - Diagnostics formatting
 * - Self-healing behavior
 * - Philosophy enforcement
 */

import { governanceRouterHandler, listGovernanceCapabilities } from '../lib/tools/governance-router-handler.js';
import fs from 'fs/promises';

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
 * Test 1: Domain routing
 */
async function testDomainRouting() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n🎯 Test 1: Domain Routing');

  const domains = ['files', 'backup', 'search', 'project', 'docs', 'workflow'];

  for (const domain of domains) {
    const result = await governanceRouterHandler({
      domain,
      action: 'unknown', // Use unknown action to test domain recognition
      payload: {},
    });

    // Should recognize domain but reject unknown action
    assert(result.status === 'error', `${domain}: Should recognize domain`);
    assert(!result.diagnostics.includes('Unknown domain'),
      `${domain}: Error should not be 'unknown domain'`);
  }
}

/**
 * Test 2: Action routing
 */
async function testActionRouting() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n🎬 Test 2: Action Routing');

  // Test files domain actions
  const fileActions = ['read', 'write', 'info', 'analyze', 'extract'];
  for (const action of fileActions) {
    const result = await governanceRouterHandler({
      domain: 'files',
      action,
      payload: { path: 'package.json' },
    });

    // Should route to handler (may succeed or fail based on file existence)
    assert(result.hasOwnProperty('status'), `files/${action}: Should return status`);
  }
}

/**
 * Test 3: Error translation
 */
async function testErrorTranslation() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n🌐 Test 3: Error Translation');

  // Missing domain
  const noDomain = await governanceRouterHandler({
    action: 'read',
    payload: {},
  });
  assert(noDomain.status === 'error', 'Should error on missing domain');
  assert(typeof noDomain.diagnostics === 'string', 'Diagnostics should be string');
  assert(typeof noDomain.next_steps === 'string', 'Next steps should be string');

  // Missing action
  const noAction = await governanceRouterHandler({
    domain: 'files',
    payload: {},
  });
  assert(noAction.status === 'error', 'Should error on missing action');

  // Unknown domain
  const unknownDomain = await governanceRouterHandler({
    domain: 'invalid_domain',
    action: 'read',
    payload: {},
  });
  assert(unknownDomain.status === 'error', 'Should error on unknown domain');
  assert(unknownDomain.diagnostics.includes('Unknown domain'), 'Should mention unknown domain');

  // Unknown action
  const unknownAction = await governanceRouterHandler({
    domain: 'files',
    action: 'invalid_action',
    payload: {},
  });
  assert(unknownAction.status === 'error', 'Should error on unknown action');
  assert(unknownAction.diagnostics.includes('Unknown action'), 'Should mention unknown action');
}

/**
 * Test 4: Diagnostics formatting
 */
async function testDiagnosticsFormatting() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n📊 Test 4: Diagnostics Formatting');

  const result = await governanceRouterHandler({
    domain: 'files',
    action: 'read',
    payload: { path: 'package.json' },
  });

  assert(typeof result.diagnostics === 'string', 'Diagnostics should be string');
  assert(result.diagnostics.length > 0, 'Diagnostics should not be empty');

  if (result.status === 'ok') {
    assert(result.diagnostics.includes('Successfully'), 'Success should indicate success');
  }
}

/**
 * Test 5: Response structure
 */
async function testResponseStructure() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n🏗️ Test 5: Response Structure');

  const result = await governanceRouterHandler({
    domain: 'files',
    action: 'info',
    payload: { path: 'package.json' },
  });

  // Check all required fields
  assert(result.hasOwnProperty('status'), 'Should have status');
  assert(result.hasOwnProperty('result'), 'Should have result');
  assert(result.hasOwnProperty('diagnostics'), 'Should have diagnostics');
  assert(result.hasOwnProperty('next_steps'), 'Should have next_steps');

  // Check status values
  assert(['ok', 'error', 'partial'].includes(result.status), 'Status should be valid');

  // Check types
  assert(typeof result.status === 'string', 'Status should be string');
  assert(typeof result.diagnostics === 'string', 'Diagnostics should be string');
  assert(typeof result.next_steps === 'string' || result.next_steps === null,
    'Next steps should be string or null');
}

/**
 * Test 6: Philosophy enforcement
 */
async function testPhilosophyEnforcement() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n📜 Test 6: Philosophy Enforcement');

  // Test surgical compliance - line count
  const lineCountResult = await governanceRouterHandler({
    domain: 'files',
    action: 'write',
    payload: {
      path: 'test.txt',
      content: '\n'.repeat(800), // Exceeds 700 line limit
    },
  });

  if (lineCountResult.status === 'error') {
    assert(lineCountResult.diagnostics.includes('line count') ||
           lineCountResult.diagnostics.includes('exceeds'),
    'Should enforce line count limit');
  }

  // Test surgical compliance - forbidden patterns
  const forbiddenResult = await governanceRouterHandler({
    domain: 'files',
    action: 'write',
    payload: {
      path: 'test.js',
      content: '// [REMOVED BY SWEObeyMe]: Forbidden Pattern("debug");',
    },
  });

  if (forbiddenResult.status === 'error') {
    assert(forbiddenResult.diagnostics.includes('Forbidden') ||
           forbiddenResult.diagnostics.includes('pattern'),
    'Should enforce forbidden patterns');
  }
}

/**
 * Test 7: Self-healing detection
 */
async function testSelfHealing() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n🔄 Test 7: Self-Healing Detection');

  // Create a test file
  const testFile = 'test-self-heal.txt';
  await fs.writeFile(testFile, 'original', 'utf-8');

  try {
    // Write invalid JSON to trigger validation error and potential rollback
    const result = await governanceRouterHandler({
      domain: 'files',
      action: 'write',
      payload: {
        path: testFile,
        content: '{ invalid',
      },
    });

    // Check if file was restored
    const content = await fs.readFile(testFile, 'utf-8');

    if (result.status === 'error') {
      assert(content === 'original' || result.diagnostics.includes('restore'),
        'Should restore original on error');
    }

  } finally {
    await fs.unlink(testFile).catch(() => {});
  }
}

/**
 * Test 8: Handler lookup
 */
async function testHandlerLookup() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n🔍 Test 8: Handler Lookup');

  const caps = listGovernanceCapabilities();

  // Verify all domains have handlers
  for (const [domain, actions] of Object.entries(caps.capabilities)) {
    assert(actions.actions.length > 0, `${domain}: Should have at least one action`);
    assert(actions.handlerCount > 0, `${domain}: Should have at least one handler`);
  }
}

/**
 * Run all tests
 */
export async function runRouterTests() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n' + '='.repeat(60));
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('Router Tests');
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('='.repeat(60));

  try {
    await testDomainRouting();
    await testActionRouting();
    await testErrorTranslation();
    await testDiagnosticsFormatting();
    await testResponseStructure();
    await testPhilosophyEnforcement();
    await testSelfHealing();
    await testHandlerLookup();
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
  runRouterTests();
}
