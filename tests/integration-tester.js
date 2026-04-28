/**
 * Integration Tester
 *
 * Surface → Router → Handler flow tests:
 * - file_ops → router → handlers
 * - search_code → router → handlers
 * - backup_restore → router → handlers
 * - project_context → router → handlers
 * - docs_manage → router → handlers
 * - workflow_manage → router → handlers
 * - sweobeyme_execute → router → handlers
 */

import { toolHandlers } from '../lib/tools/handlers.js';
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
 * Test 1: file_ops → router → handlers
 */
async function testFileOpsFlow() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n📄 Test 1: file_ops Flow');

  const fileOps = toolHandlers.file_ops;
  assert(typeof fileOps === 'function', 'file_ops should be a function');

  // Test file_ops info
  const infoResult = await fileOps({
    operation: 'info',
    path: 'package.json',
  });

  assert(infoResult.hasOwnProperty('isError'), 'Should return MCP response format');

  // Test file_ops read
  const readResult = await fileOps({
    operation: 'read',
    path: 'package.json',
  });

  assert(readResult.hasOwnProperty('isError'), 'Should return MCP response format');
}

/**
 * Test 2: search_code → router → handlers
 */
async function testSearchCodeFlow() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n🔍 Test 2: search_code Flow');

  const searchCode = toolHandlers.search_code;
  assert(typeof searchCode === 'function', 'search_code should be a function');

  // Test search
  const result = await searchCode({
    Query: 'test',
    SearchPath: '.',
  });

  assert(result.hasOwnProperty('isError'), 'Should return MCP response format');
}

/**
 * Test 3: backup_restore → router → handlers
 */
async function testBackupRestoreFlow() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n💾 Test 3: backup_restore Flow');

  const backupRestore = toolHandlers.backup_restore;
  assert(typeof backupRestore === 'function', 'backup_restore should be a function');

  // Create test file
  const testFile = 'test-backup-flow.txt';
  await fs.writeFile(testFile, 'test content', 'utf-8');

  try {
    // Test backup operation
    const result = await backupRestore({
      operation: 'create',
      path: testFile,
    });

    assert(result.hasOwnProperty('isError'), 'Should return MCP response format');

  } finally {
    await fs.unlink(testFile).catch(() => {});
  }
}

/**
 * Test 4: project_context → router → handlers
 */
async function testProjectContextFlow() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n📁 Test 4: project_context Flow');

  const projectContext = toolHandlers.project_context;
  assert(typeof projectContext === 'function', 'project_context should be a function');

  // Test project context operation
  const result = await projectContext({
    operation: 'context',
  });

  assert(result.hasOwnProperty('isError'), 'Should return MCP response format');
}

/**
 * Test 5: docs_manage → router → handlers
 */
async function testDocsManageFlow() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n📚 Test 5: docs_manage Flow');

  const docsManage = toolHandlers.docs_manage;
  assert(typeof docsManage === 'function', 'docs_manage should be a function');

  // Test list_corpora
  const result = await docsManage({
    operation: 'list_corpora',
  });

  assert(result.hasOwnProperty('isError'), 'Should return MCP response format');
}

/**
 * Test 6: workflow_manage → router → handlers
 */
async function testWorkflowManageFlow() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n⚙️ Test 6: workflow_manage Flow');

  const workflowManage = toolHandlers.workflow_manage;
  assert(typeof workflowManage === 'function', 'workflow_manage should be a function');

  // Test workflow status
  const result = await workflowManage({
    operation: 'status',
  });

  assert(result.hasOwnProperty('isError'), 'Should return MCP response format');
}

/**
 * Test 7: sweobeyme_execute → router → handlers
 */
async function testSweobeymeExecuteFlow() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n🎯 Test 7: sweobeyme_execute Flow');

  const sweobeymeExecute = toolHandlers.sweobeyme_execute;
  assert(typeof sweobeymeExecute === 'function', 'sweobeyme_execute should be a function');

  // Test direct domain/action routing
  const result = await sweobeymeExecute({
    domain: 'files',
    action: 'read',
    payload: { path: 'package.json' },
  });

  assert(result.hasOwnProperty('isError'), 'Should return MCP response format');
}

/**
 * Test 8: End-to-end write and read cycle
 */
async function testEndToEndWriteRead() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n🔄 Test 8: End-to-End Write and Read');

  const testFile = 'test-e2e.txt';
  const testContent = 'Hello, SWEObeyMe!';

  try {
    // Write file
    const writeResult = await toolHandlers.file_ops({
      operation: 'write',
      path: testFile,
      content: testContent,
    });

    assert(!writeResult.isError, 'Write should succeed');

    // Read file
    const readResult = await toolHandlers.file_ops({
      operation: 'read',
      path: testFile,
    });

    assert(!readResult.isError, 'Read should succeed');

    // Verify content
    if (!readResult.isError && readResult.content) {
      const content = readResult.content[0]?.text || '';
      assert(content.includes(testContent), 'Read content should match written content');
    }

  } finally {
    await fs.unlink(testFile).catch(() => {});
  }
}

/**
 * Test 9: Error propagation through layers
 */
async function testErrorPropagation() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n⚠️ Test 9: Error Propagation');

  // Test invalid file path
  const result = await toolHandlers.file_ops({
    operation: 'read',
    path: 'non-existent-file-12345.txt',
  });

  assert(result.isError, 'Should return error for non-existent file');
  assert(result.content && result.content[0], 'Should have error content');
}

/**
 * Test 10: All surface tools accessible
 */
async function testAllSurfaceToolsAccessible() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n🧰 Test 10: All Surface Tools Accessible');

  const expectedTools = [
    'file_ops',
    'search_code',
    'backup_restore',
    'project_context',
    'docs_manage',
    'workflow_manage',
    'sweobeyme_execute',
  ];

  for (const toolName of expectedTools) {
    assert(toolHandlers[toolName], `${toolName} should be accessible`);
    assert(typeof toolHandlers[toolName] === 'function', `${toolName} should be a function`);
  }

  assert(Object.keys(toolHandlers).length === 7, 'Should have exactly 7 tools');
}

/**
 * Run all tests
 */
export async function runIntegrationTests() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n' + '='.repeat(60));
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('Integration Tests');
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('='.repeat(60));

  try {
    await testFileOpsFlow();
    await testSearchCodeFlow();
    await testBackupRestoreFlow();
    await testProjectContextFlow();
    await testDocsManageFlow();
    await testWorkflowManageFlow();
    await testSweobeymeExecuteFlow();
    await testEndToEndWriteRead();
    await testErrorPropagation();
    await testAllSurfaceToolsAccessible();
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
  runIntegrationTests();
}
