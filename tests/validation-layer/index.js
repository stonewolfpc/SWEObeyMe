/**
 * Validation Layer Index
 *
 * Unified entry point for all validation layer tests.
 * Organizes tests into categories and provides unified reporting.
 */

import { runValidationLayerTests } from '../validation-layer-tester.js';
import { runSafetyTests } from '../safety-tester.js';
import { runRouterTests } from '../router-tester.js';
import { runIntegrationTests } from '../integration-tester.js';
import { runChaosTests } from '../chaos-tester.js';

// Test category registry
const TEST_CATEGORIES = {
  structural: {
    name: 'Structural Tests',
    runner: runValidationLayerTests,
    description: 'Line count limits, forbidden patterns, naming conventions, directory structure',
  },
  safety: {
    name: 'Safety Tests',
    runner: runSafetyTests,
    description: 'Backup-before-edit, rollback correctness, no partial writes, path validation',
  },
  router: {
    name: 'Router Tests',
    runner: runRouterTests,
    description: 'Domain/action routing, error translation, diagnostics, philosophy enforcement',
  },
  integration: {
    name: 'Integration Tests',
    runner: runIntegrationTests,
    description: 'Surface→Router→Handler flow, end-to-end operations',
  },
  chaos: {
    name: 'Chaos Tests',
    runner: runChaosTests,
    description: 'Concurrency, random sequences, malformed inputs, resilience under stress',
  },
};

/**
 * Run all validation layer tests
 */
export async function runAllValidationTests(categories = Object.keys(TEST_CATEGORIES)) {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n' + '='.repeat(70));
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('SWEObeyMe Validation Layer Test Suite');
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('='.repeat(70));

  const results = {};
  let totalPassed = 0;
  let totalFailed = 0;

  for (const categoryKey of categories) {
    const category = TEST_CATEGORIES[categoryKey];
    if (!category) {
      console.warn(`Unknown test category: ${categoryKey}`);
      continue;
    }

    // [REMOVED BY SWEObeyMe]: Forbidden Pattern(`\n📦 Running: ${category.name}`);
    // [REMOVED BY SWEObeyMe]: Forbidden Pattern(`   ${category.description}`);

    try {
      const result = await category.runner();
      results[categoryKey] = result;
      totalPassed += result.passed;
      totalFailed += result.failed;
    } catch (error) {
      console.error(`Error running ${category.name}:`, error);
      results[categoryKey] = {
        passed: 0,
        failed: 1,
        errors: [error.message],
      };
      totalFailed += 1;
    }
  }

  // Print summary
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('\n' + '='.repeat(70));
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('VALIDATION LAYER SUMMARY');
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('='.repeat(70));

  for (const [key, result] of Object.entries(results)) {
    const category = TEST_CATEGORIES[key];
    const status = result.failed === 0 ? '✓' : '✗';
    // [REMOVED BY SWEObeyMe]: Forbidden Pattern(`${status} ${category.name}: ${result.passed} passed, ${result.failed} failed`);
  }

  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('-'.repeat(70));
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern(`TOTAL: ${totalPassed} passed, ${totalFailed} failed`);

  const success = totalFailed === 0;
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern(`STATUS: ${success ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('='.repeat(70));

  return {
    success,
    totalPassed,
    totalFailed,
    results,
  };
}

/**
 * Run specific test category
 */
export async function runTestCategory(categoryKey) {
  const category = TEST_CATEGORIES[categoryKey];
  if (!category) {
    throw new Error(`Unknown test category: ${categoryKey}. Valid: ${Object.keys(TEST_CATEGORIES).join(', ')}`);
  }

  return await category.runner();
}

/**
 * List available test categories
 */
export function listTestCategories() {
  return Object.entries(TEST_CATEGORIES).map(([key, category]) => ({
    key,
    name: category.name,
    description: category.description,
  }));
}

/**
 * Get test history (placeholder for future persistence)
 */
export function getTestHistory() {
  // Future: Load from .swe-backups/test-history.json
  return [];
}

/**
 * Save test result (placeholder for future persistence)
 */
export function saveTestResult(result) {
  // Future: Append to .swe-backups/test-history.json
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('Test result saved (placeholder)');
}

// Run all tests if executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runAllValidationTests().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}
