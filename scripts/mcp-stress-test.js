#!/usr/bin/env node

/**
 * Comprehensive MCP Server Stress Test
 *
 * This test stress-tests the entire MCP server to ensure:
 * - docs_lookup doesn't freeze with any corpus
 * - add_project_error doesn't freeze
 * - Timeout protection works
 * - Async file operations don't block
 * - Parallel operations work correctly
 *
 * Run with: node scripts/mcp-stress-test.js
 */

import { docs_lookup_handler } from '../lib/tools/docs-handlers.js';
import {
  add_project_error_handler,
  add_pending_task_handler,
} from '../lib/tools/project-awareness-handlers.js';
import { godot_lookup_handler } from '../lib/tools/godot-handlers.js';

const TEST_RESULTS = {
  passed: 0,
  failed: 0,
  errors: [],
};

function logTest(name, status, details = '') {
  const timestamp = new Date().toISOString();
  const statusSymbol = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
  console.log(`[${timestamp}] ${statusSymbol} ${name}${details ? ` - ${details}` : ''}`);

  if (status === 'PASS') {
    TEST_RESULTS.passed++;
  } else if (status === 'FAIL') {
    TEST_RESULTS.failed++;
    TEST_RESULTS.errors.push({ name, details });
  }
}

async function testWithTimeout(testFn, testName, timeoutMs) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    try {
      const result = await Promise.race([testFn(), timeoutPromise]);
      clearTimeout(timeoutId);
      resolve({ success: true, result });
    } catch (error) {
      clearTimeout(timeoutId);
      resolve({ success: false, error: error.message });
    }
  });
}

async function testDocsLookupAllCorpora() {
  console.log('\n=== Testing docs_lookup with all corpora ===\n');

  const corpora = ['unified', 'math', 'fdq', 'training', 'godot', 'llama'];
  const queries = ['async', 'error', 'validation', 'project', 'file'];

  for (const corpus of corpora) {
    for (const query of queries) {
      const testName = `docs_lookup(${corpus}, "${query}")`;
      const { success, error } = await testWithTimeout(
        () => docs_lookup_handler({ query, corpus, maxResults: 5 }),
        testName,
        10000 // 10 second timeout
      );

      if (success) {
        logTest(testName, 'PASS');
      } else {
        logTest(testName, 'FAIL', error);
      }
    }
  }

  // Test without corpus (search all)
  const testName = 'docs_lookup(all corpora, "async")';
  const { success, error } = await testWithTimeout(
    () => docs_lookup_handler({ query: 'async', maxResults: 10 }),
    testName,
    30000 // 30 second timeout for all corpora
  );

  if (success) {
    logTest(testName, 'PASS');
  } else {
    logTest(testName, 'FAIL', error);
  }
}

async function testProjectAwareness() {
  console.log('\n=== Testing project awareness operations ===\n');

  // Test add_project_error
  const testName1 = 'add_project_error';
  const { success: success1, error: error1 } = await testWithTimeout(
    () => add_project_error_handler({ error: 'Test error message' }),
    testName1,
    5000
  );

  if (success1) {
    logTest(testName1, 'PASS');
  } else {
    logTest(testName1, 'FAIL', error1);
  }

  // Test add_pending_task
  const testName2 = 'add_pending_task';
  const { success: success2, error: error2 } = await testWithTimeout(
    () => add_pending_task_handler({ task: 'Test task description' }),
    testName2,
    5000
  );

  if (success2) {
    logTest(testName2, 'PASS');
  } else {
    logTest(testName2, 'FAIL', error2);
  }
}

// async function testUnifiedHandlers() {
//   console.log('\n=== Testing unified handlers directly ===\n');
//
//   const queries = ['async', 'error', 'validation', 'git', 'security'];
//
//   for (const query of queries) {
//     const testName = `unified_lookup("${query}")`;
//     const { success, error } = await testWithTimeout(
//       () => unifiedHandlers.unified_lookup({ query }),
//       testName,
//       10000
//     );
//
//     if (success) {
//       logTest(testName, 'PASS');
//     } else {
//       logTest(testName, 'FAIL', error);
//     }
//   }
// }

// async function testOtherCorpusHandlers() {
//   console.log('\n=== Testing other corpus handlers ===\n');
//
//   // Test math handler
//   const testName1 = 'math_lookup';
//   const { success: success1, error: error1 } = await testWithTimeout(
//     () => math_lookup_handler({ query: 'complexity', maxResults: 5 }),
//     testName1,
//     5000
//   );
//
//   if (success1) {
//     logTest(testName1, 'PASS');
//   } else {
//     logTest(testName1, 'FAIL', error1);
//   }
//
//   // Test FDQ handler
//   const testName2 = 'fdq_lookup';
//   const { success: success2, error: error2 } = await testWithTimeout(
//     () => fdq_lookup_handler({ query: 'quantization', maxResults: 5 }),
//     testName2,
//     5000
//   );
//
//   if (success2) {
//     logTest(testName2, 'PASS');
//   } else {
//     logTest(testName2, 'FAIL', error2);
//   }
//
//   // Test training handler
//   const testName3 = 'training_lookup';
//   const { success: success3, error: error3 } = await testWithTimeout(
//     () => training_lookup_handler({ query: 'gradient', maxResults: 5 }),
//     testName3,
//     5000
//   );
//
//   if (success3) {
//     logTest(testName3, 'PASS');
//   } else {
//     logTest(testName3, 'FAIL', error3);
//   }
// }

async function testParallelOperations() {
  console.log('\n=== Testing parallel operations ===\n');

  const testName = 'Parallel docs_lookup calls';
  const { success, error } = await testWithTimeout(
    async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(docs_lookup_handler({ query: 'test', maxResults: 5 }));
      }
      await Promise.all(promises);
    },
    testName,
    60000 // 60 second timeout for parallel ops
  );

  if (success) {
    logTest(testName, 'PASS');
  } else {
    logTest(testName, 'FAIL', error);
  }
}

async function testTimeoutProtection() {
  console.log('\n=== Testing timeout protection ===\n');

  // Test with a query that should timeout if corpus is slow
  const testName = 'Timeout protection (slow corpus)';
  const { success, error } = await testWithTimeout(
    () => docs_lookup_handler({ query: 'test', corpus: 'unified', maxResults: 5 }),
    testName,
    10000 // Should complete within 10s even if slow
  );

  if (success) {
    logTest(testName, 'PASS');
  } else {
    logTest(testName, 'FAIL', error);
  }
}

async function runAllTests() {
  console.log('========================================');
  console.log('  MCP Server Comprehensive Stress Test');
  console.log('========================================\n');

  const startTime = Date.now();

  try {
    await testDocsLookupAllCorpora();
    await testProjectAwareness();
    // await testUnifiedHandlers();
    // await testOtherCorpusHandlers();
    await testParallelOperations();
    await testTimeoutProtection();
  } catch (error) {
    console.error('\n❌ Test suite crashed:', error);
    TEST_RESULTS.errors.push({ name: 'Test Suite', details: error.message });
  }

  const duration = Date.now() - startTime;

  console.log('\n========================================');
  console.log('  Test Results');
  console.log('========================================\n');
  console.log(`Total Tests: ${TEST_RESULTS.passed + TEST_RESULTS.failed}`);
  console.log(`✓ Passed: ${TEST_RESULTS.passed}`);
  console.log(`✗ Failed: ${TEST_RESULTS.failed}`);
  console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);

  if (TEST_RESULTS.failed > 0) {
    console.log('\nFailed Tests:');
    TEST_RESULTS.errors.forEach(({ name, details }) => {
      console.log(`  - ${name}: ${details}`);
    });
    process.exit(1);
  } else {
    console.log('\n✓ All tests passed!');
    process.exit(0);
  }
}

runAllTests();
