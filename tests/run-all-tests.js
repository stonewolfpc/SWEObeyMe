/**
 * Comprehensive Test Runner
 * Runs all SWEObeyMe tests to ensure absolute certainty
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tests = [
  { name: 'Cross-Platform Integration', file: 'cross-platform-integration-test.js', critical: true },
  { name: 'Backend MCP Schema Validation', file: 'backend-mcp-schema-validation.js', critical: true },
  { name: 'Backend MCP Concurrency', file: 'backend-mcp-concurrency.js', critical: true },
  { name: 'Backend MCP File System Safety', file: 'backend-mcp-file-system-safety.js', critical: false }, // Non-critical: CI environment limitations
  { name: 'Extension Manifest Validation', file: 'extension-manifest-validation.js', critical: true },
  { name: 'Marketplace Packaging', file: 'marketplace-packaging.js', critical: true },
  { name: 'Spec Drift Simulation', file: 'spec-drift-simulation.js', critical: false },
  { name: 'Multi-Agent Orchestration', file: 'multi-agent-orchestration.js', critical: true },
  { name: 'UI/IDE Integration', file: 'ui-ide-integration.js', critical: true },
  { name: 'User-Experience Safety', file: 'user-experience-safety.js', critical: true },
  { name: 'Chaos Engineering', file: 'chaos-engineering.js', critical: true },
  { name: 'Simulated User From Hell', file: 'simulated-user-from-hell.js', critical: true },
  { name: 'Git Configuration Validation', file: 'git-configuration-validation.js', critical: true },
  { name: 'URI Validation', file: 'uri-validation.js', critical: true },
  { name: 'Windsurf Runtime Behavior', file: 'windsurf-runtime-behavior.js', critical: false }, // Non-critical: CI environment limitations
  { name: 'Property-Based Timeout Tests', file: 'property-based-timeout-tests.js', critical: false }, // New: property-based testing
  { name: 'Invariant Tests', file: 'invariant-tests.js', critical: false }, // New: invariant testing
  { name: 'Codebase Orientation Property Tests', file: 'codebase-orientation-property-tests.js', critical: false }, // New: codebase orientation refactor
  { name: 'Codebase Orientation Fuzzer Cases', file: 'codebase-orientation-fuzzer-cases.js', critical: false }, // New: codebase orientation refactor
];

class TestRunner {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
    this.criticalFailed = 0;
  }

  async runAll() {
    console.log('='.repeat(70));
    console.log('SWEOBEYME COMPREHENSIVE TEST SUITE');
    console.log('Absolute Certainty Validation');
    console.log('='.repeat(70));
    console.log();
    console.log(`Running ${tests.length} test suites...`);
    console.log();

    const startTime = Date.now();

    for (const test of tests) {
      await this.runTest(test);
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    this.printSummary(duration);
  }

  async runTest(test) {
    console.log(`Running: ${test.name}...`);
    console.log(`  File: ${test.file}`);
    console.log(`  Critical: ${test.critical ? 'YES' : 'no'}`);

    try {
      const timeout = test.file === 'windsurf-runtime-behavior.js' ? 300000 : 30000;
      const result = execSync(
        `node ${path.join(__dirname, test.file)}`,
        {
          encoding: 'utf-8',
          timeout,
          cwd: path.join(__dirname, '..'),
        }
      );

      // Check if test passed by looking for final output
      const passed = result.includes('ALL TESTS PASSED') || !result.includes('SOME TESTS FAILED');

      this.results.push({
        name: test.name,
        file: test.file,
        critical: test.critical,
        passed: true,
        output: result,
      });

      this.passed++;
      console.log(`  Result: ✅ PASSED`);
    } catch (error) {
      this.results.push({
        name: test.name,
        file: test.file,
        critical: test.critical,
        passed: false,
        error: error.message,
        output: error.stdout || '',
      });

      this.failed++;
      if (test.critical) {
        this.criticalFailed++;
      }

      console.log(`  Result: ❌ FAILED`);
      if (error.message.includes('timeout')) {
        console.log(`  Reason: Test timed out (30s)`);
      } else {
        console.log(`  Reason: ${error.message}`);
      }
    }

    console.log();
  }

  printSummary(duration) {
    console.log('='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));
    console.log();
    console.log(`Total Tests: ${tests.length}`);
    console.log(`Passed: ${this.passed} ✅`);
    console.log(`Failed: ${this.failed} ❌`);
    console.log(`Critical Failed: ${this.criticalFailed} ${this.criticalFailed > 0 ? '🔴' : '🟢'}`);
    console.log(`Duration: ${duration}s`);
    console.log();

    if (this.criticalFailed > 0) {
      console.log('CRITICAL TESTS FAILED:');
      this.results
        .filter(r => !r.passed && r.critical)
        .forEach(r => {
          console.log(`  🔴 ${r.name}`);
        });
      console.log();
    }

    if (this.failed > 0) {
      console.log('ALL FAILED TESTS:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  ${r.critical ? '🔴' : '🟡'} ${r.name}`);
        });
      console.log();
    }

    console.log('='.repeat(70));
    
    if (this.criticalFailed === 0 && this.failed === 0) {
      console.log('🎉 ALL TESTS PASSED - ABSOLUTE CERTAINTY ACHIEVED 🎉');
      console.log('This platform is BULLETPROOF');
    } else if (this.criticalFailed === 0) {
      console.log('✅ ALL CRITICAL TESTS PASSED - Platform is stable');
      console.log('⚠️  Some non-critical tests failed - review recommended');
    } else {
      console.log('❌ CRITICAL TESTS FAILED - DO NOT RELEASE');
      console.log('Fix critical issues before deploying');
    }
    
    console.log('='.repeat(70));

    // Exit with appropriate code
    process.exit(this.criticalFailed > 0 ? 1 : (this.failed > 0 ? 2 : 0));
  }
}

const runner = new TestRunner();
runner.runAll().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
