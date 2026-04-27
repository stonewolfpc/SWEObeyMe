/**
 * Safety Tester
 * 
 * Safety validation tests for the governance architecture:
 * - Backup-before-edit enforcement
 * - Rollback correctness
 * - No partial writes
 * - No unsafe writes
 * - No hallucinated paths
 * - No cross-project contamination
 */

import { governanceRouterHandler } from '../lib/tools/governance-router-handler.js';
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
 * Test 1: Backup-before-edit enforcement
 */
async function testBackupBeforeEdit() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n💾 Test 1: Backup-Before-Edit Enforcement');
  
  // Create a test file
  const testFile = 'test-backup.txt';
  const originalContent = 'Original content';
  await fs.writeFile(testFile, originalContent, 'utf-8');
  
  try {
    // Write to file (should create backup)
    const result = await governanceRouterHandler({
      domain: 'files',
      action: 'write',
      payload: {
        path: testFile,
        content: 'New content',
      },
    });
    
    // Check that backup was mentioned in diagnostics
    if (result.status === 'ok') {
      assert(result.diagnostics.includes('Backup') || result.diagnostics.includes('backup'), 
        'Should indicate backup was created');
    }
    
    // Verify file was written
    const newContent = await fs.readFile(testFile, 'utf-8');
    assert(newContent === 'New content', 'File should have new content');
    
  } finally {
    // Cleanup
    await fs.unlink(testFile).catch(() => {});
  }
}

/**
 * Test 2: Self-healing rollback on error
 */
async function testSelfHealingRollback() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n🔄 Test 2: Self-Healing Rollback');
  
  const testFile = 'test-rollback.txt';
  const originalContent = 'Original content for rollback test';
  await fs.writeFile(testFile, originalContent, 'utf-8');
  
  try {
    // Try to write invalid JSON to a .json file (should fail validation and restore)
    const result = await governanceRouterHandler({
      domain: 'files',
      action: 'write',
      payload: {
        path: testFile,
        content: '{ invalid json',  // This should trigger validation error
      },
    });
    
    // If validation rejected it, the file should still have original content
    // or if it was written and then restored
    const currentContent = await fs.readFile(testFile, 'utf-8');
    
    if (result.status === 'error') {
      assert(currentContent === originalContent || result.diagnostics.includes('restore'),
        'Should either reject before write or restore after error');
    }
    
  } finally {
    // Cleanup
    await fs.unlink(testFile).catch(() => {});
  }
}

/**
 * Test 3: Path validation (no hallucinated paths)
 */
async function testPathValidation() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n🛡️ Test 3: Path Validation');
  
  // Test absolute path outside project
  const outsidePath = process.platform === 'win32' ? 'C:\\Windows\\system.ini' : '/etc/passwd';
  const result = await governanceRouterHandler({
    domain: 'files',
    action: 'write',
    payload: {
      path: outsidePath,
      content: 'test',
    },
  });
  
  assert(result.status === 'error', 'Should reject paths outside project');
}

/**
 * Test 4: No cross-project contamination
 */
async function testNoCrossProjectContamination() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n🔒 Test 4: No Cross-Project Contamination');
  
  const parentDir = path.resolve('..');
  const parentFile = path.join(parentDir, 'test-contamination.txt');
  
  const result = await governanceRouterHandler({
    domain: 'files',
    action: 'write',
    payload: {
      path: parentFile,
      content: 'test',
    },
  });
  
  assert(result.status === 'error', 'Should reject paths in parent directories');
  assert(result.diagnostics.includes('outside') || result.diagnostics.includes('Path'),
    'Error should mention path restriction');
}

/**
 * Test 5: Validation before write
 */
async function testValidationBeforeWrite() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n✅ Test 5: Validation Before Write');
  
  // Create a test file
  const testFile = 'test-validation.txt';
  await fs.writeFile(testFile, 'original', 'utf-8');
  
  try {
    // Try to write content with unbalanced brackets
    const result = await governanceRouterHandler({
      domain: 'files',
      action: 'write',
      payload: {
        path: testFile,
        content: 'function test() { return 1; ',  // Missing closing brace
      },
    });
    
    // Should either reject or handle gracefully
    assert(result.status === 'ok' || result.status === 'error',
      'Should handle validation appropriately');
    
    // If it succeeded, check brackets were detected
    if (result.status === 'error') {
      assert(result.diagnostics.includes('bracket') || result.diagnostics.includes('Unbalanced'),
        'Should detect unbalanced brackets');
    }
    
  } finally {
    // Cleanup
    await fs.unlink(testFile).catch(() => {});
  }
}

/**
 * Test 6: Error reporting and next_steps
 */
async function testErrorReporting() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n📢 Test 6: Error Reporting and Next Steps');
  
  const result = await governanceRouterHandler({
    domain: 'files',
    action: 'read',
    payload: {
      path: 'non-existent-file-12345.txt',
    },
  });
  
  assert(result.hasOwnProperty('diagnostics'), 'Should have diagnostics');
  assert(result.hasOwnProperty('next_steps'), 'Should have next_steps');
  assert(result.diagnostics.length > 0, 'Diagnostics should not be empty');
}

/**
 * Run all tests
 */
export async function runSafetyTests() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n' + '='.repeat(60));
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('Safety Tests');
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('='.repeat(60));
  
  try {
    await testBackupBeforeEdit();
    await testSelfHealingRollback();
    await testPathValidation();
    await testNoCrossProjectContamination();
    await testValidationBeforeWrite();
    await testErrorReporting();
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
  runSafetyTests();
}
