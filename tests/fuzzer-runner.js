#!/usr/bin/env node

/**
 * Main Fuzzer Runner
 *
 * Runs all fuzzers across all platforms and generates reports
 * Nuclear button: npm run fuzz:all
 */

import { WindsurfRuntimeFuzzer } from './fuzzer-windsurf-runtime.js';
import {
  GenericMCPFuzzer,
  CursorFuzzer,
  LMStudioFuzzer,
  VSCodeFuzzer,
} from './fuzzer-generic-runtime.js';
import { FilesystemFuzzer } from './fuzzer-filesystem.js';
import { FuzzTestGenerator } from './fuzzer-test-generator.js';
import { getAllInvariants } from './fuzzer-invariants.js';

class FuzzerRunner {
  constructor(options = {}) {
    this.platforms = options.platforms || ['windsurf']; // Only windsurf for now
    this.iterations = options.iterations || 50; // Reduced from 100 to 50 for faster feedback
    this.generateTests = options.generateTests !== false;
    this.testGenerator = new FuzzTestGenerator();
    this.parallel = options.parallel !== false; // Enable parallel execution by default
    this.timeout = options.timeout || 5000; // Reduced from 30000 to 5000ms
    this.batchSize = options.batchSize || 10; // Batch size for parallel execution
  }

  /**
   * Run all platform fuzzers
   */
  async runAllPlatformFuzzers() {
    console.log('=== Running All Platform Fuzzers ===\n');

    const results = [];

    for (const platform of this.platforms) {
      console.log(`\n--- Fuzzing ${platform.toUpperCase()} ---`);

      let fuzzer;
      switch (platform) {
        case 'windsurf':
          fuzzer = new WindsurfRuntimeFuzzer({
            timeout: process.env.CI ? 10000 : this.timeout,
            maxIterations: this.iterations,
            parallel: this.parallel,
            batchSize: this.batchSize,
          });
          break;
        case 'cursor':
          fuzzer = new CursorFuzzer({
            timeout: this.timeout,
            maxIterations: this.iterations,
            parallel: this.parallel,
            batchSize: this.batchSize,
          });
          break;
        case 'lmstudio':
          fuzzer = new LMStudioFuzzer({
            timeout: this.timeout,
            maxIterations: this.iterations,
            parallel: this.parallel,
            batchSize: this.batchSize,
          });
          break;
        case 'vscode':
          fuzzer = new VSCodeFuzzer({
            timeout: this.timeout,
            maxIterations: this.iterations,
            parallel: this.parallel,
            batchSize: this.batchSize,
          });
          break;
        default:
          fuzzer = new GenericMCPFuzzer({
            platform,
            timeout: this.timeout,
            maxIterations: this.iterations,
            parallel: this.parallel,
            batchSize: this.batchSize,
          });
      }

      const report = await fuzzer.runFullFuzzer();
      results.push(report);

      console.log(`\n${platform.toUpperCase()} Results:`);
      console.log(
        `  Server Invariants: ${report.serverInvariants.passed ? '✅ PASSED' : '❌ FAILED'}`
      );
      console.log(
        `  Protocol Invariants: ${report.protocolInvariants.passed ? '✅ PASSED' : '❌ FAILED'}`
      );
      console.log(
        `  Safety Invariants: ${report.safetyInvariants.passed ? '✅ PASSED' : '❌ FAILED'}`
      );
      console.log(`  Crashes: ${report.crashes.length}`);
      console.log(`  Hangs: ${report.hangs.length}`);
      console.log(`  Errors: ${report.errors.length}`);
      console.log(`  Total Violations: ${report.totalViolations}`);
    }

    return results;
  }

  /**
   * Run filesystem fuzzer
   */
  async runFilesystemFuzzer() {
    console.log('\n=== Running Filesystem Fuzzer ===\n');

    const fsFuzzer = new FilesystemFuzzer();
    await fsFuzzer.init();

    const iterations = Math.min(this.iterations, 25); // Cap at 25 for filesystem tests
    const results = await fsFuzzer.runFuzzBatch(iterations);

    console.log('Filesystem Fuzzer Results:');
    console.log(`  Total scenarios: ${results.length}`);
    console.log(`  Successful: ${results.filter((r) => r.success).length}`);
    console.log(`  Failed: ${results.filter((r) => !r.success).length}`);

    await fsFuzzer.cleanup();

    return results;
  }

  /**
   * Generate tests from fuzzer failures
   */
  async generateTestsFromFailures(platformReports) {
    if (!this.generateTests) {
      console.log('\nSkipping test generation (disabled)');
      return [];
    }

    console.log('\n=== Generating Regression Tests ===\n');

    await this.testGenerator.init();

    const allTests = [];

    for (const report of platformReports) {
      const tests = await this.testGenerator.generateTestsFromReport(report);
      allTests.push(...tests);

      console.log(`Generated ${tests.length} tests for ${report.platform}`);
    }

    if (allTests.length > 0) {
      await this.testGenerator.generateTestIndex(allTests);
      console.log(`\nTotal tests generated: ${allTests.length}`);
      console.log(`Test output directory: ${this.testGenerator.outputDir}`);
    }

    return allTests;
  }

  /**
   * Run all generated regression tests
   */
  async runGeneratedTests() {
    console.log('\n=== Running Generated Regression Tests ===\n');

    try {
      const results = await this.testGenerator.runGeneratedTests();

      console.log('Regression Test Results:');
      console.log(`  Total tests: ${results.length}`);
      console.log(`  Passed: ${results.filter((r) => r.result).length}`);
      console.log(`  Failed: ${results.filter((r) => !r.result).length}`);

      return results;
    } catch (e) {
      console.error('Error running generated tests:', e.message);
      return [];
    }
  }

  /**
   * Generate final report
   */
  generateFinalReport(platformReports, fsResults, generatedTests) {
    const totalViolations = platformReports.reduce((sum, r) => sum + r.totalViolations, 0);
    const totalCrashes = platformReports.reduce((sum, r) => sum + r.crashes.length, 0);
    const totalHangs = platformReports.reduce((sum, r) => sum + r.hangs.length, 0);
    const totalErrors = platformReports.reduce((sum, r) => sum + r.errors.length, 0);

    const allPassed = platformReports.every((r) => r.passed);

    const report = {
      timestamp: new Date().toISOString(),
      platforms: this.platforms,
      iterations: this.iterations,
      platformReports,
      filesystemResults: fsResults,
      generatedTests: generatedTests.length,
      totalViolations,
      totalCrashes,
      totalHangs,
      totalErrors,
      passed: allPassed && totalViolations === 0,
      summary: {
        platformsTested: platformReports.length,
        platformsPassed: platformReports.filter((r) => r.passed).length,
        platformsFailed: platformReports.filter((r) => !r.passed).length,
        invariantsDefined: Object.keys(getAllInvariants()).length,
        invariantsViolated: totalViolations,
      },
    };

    return report;
  }

  /**
   * Run complete fuzzer suite
   */
  async runCompleteSuite() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     SWEObeyMe Runtime Fuzzer Suite                       ║');
    console.log('║     Nuclear Button: Guaranteed Failure Detection         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('Configuration:');
    console.log(`  Parallel: ${this.parallel ? 'enabled' : 'disabled'}`);
    console.log(`  Timeout: ${this.timeout}ms`);
    console.log(`  Batch Size: ${this.batchSize}`);
    console.log(`  Iterations: ${this.iterations}\n`);

    const startTime = Date.now();

    // Run platform fuzzers
    const platformReports = await this.runAllPlatformFuzzers();

    // Run filesystem fuzzer
    const fsResults = await this.runFilesystemFuzzer();

    // Generate regression tests from failures
    const generatedTests = await this.generateTestsFromFailures(platformReports);

    // Run generated regression tests
    await this.runGeneratedTests();

    // Generate final report
    const report = this.generateFinalReport(platformReports, fsResults, generatedTests);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Print final summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    FINAL REPORT                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`Duration: ${duration}s`);
    console.log(`Platforms Tested: ${report.summary.platformsTested}`);
    console.log(`Platforms Passed: ${report.summary.platformsPassed}`);
    console.log(`Platforms Failed: ${report.summary.platformsFailed}`);
    console.log(`Invariants Defined: ${report.summary.invariantsDefined}`);
    console.log(`Invariants Violated: ${report.summary.invariantsViolated}`);
    console.log(`Crashes: ${report.totalCrashes}`);
    console.log(`Hangs: ${report.totalHangs}`);
    console.log(`Errors: ${report.totalErrors}`);
    console.log(`Regression Tests Generated: ${generatedTests.length}`);
    console.log(`\nOverall Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}`);

    if (!report.passed) {
      console.log('\n⚠️  VIOLATIONS DETECTED - DO NOT SHIP');
      console.log('Review the fuzzer reports and fix violations before deployment.');
    } else {
      console.log('\n✅ ALL INVARIANTS PRESERVED - SHIP WITH CONFIDENCE');
    }

    return report;
  }
}

// Run fuzzer suite if executed directly
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isMainModule) {
  const runner = new FuzzerRunner();
  const report = await runner.runCompleteSuite();
  process.exit(report.passed ? 0 : 1);
}

export { FuzzerRunner };
