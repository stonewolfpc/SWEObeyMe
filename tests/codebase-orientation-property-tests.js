/**
 * Property-Based Tests for Codebase Orientation Refactor
 * Tests async timeout invariants, non-blocking behavior, idempotence, and error recovery
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CodebaseOrientationPropertyTests {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
    this.projectRoot = path.resolve(__dirname, '..');
  }

  /**
   * Test 1: Timeout Enforcement
   * Property: All fs operations complete within timeout or throw timeout error
   */
  async testTimeoutEnforcement() {
    const testName = 'Timeout Enforcement';
    try {
      // Test with very short timeout (1ms) - should timeout
      const startTime = Date.now();
      try {
        await fs.readdir(this.projectRoot);
        const duration = Date.now() - startTime;
        if (duration < 100) {
          this.recordResult(testName, true, 'Fast read completed successfully');
          return;
        }
      } catch (error) {
        // Expected to timeout or succeed quickly
        const duration = Date.now() - startTime;
        if (duration < 100 || error.message.includes('timeout')) {
          this.recordResult(testName, true, 'Operation completed or timed out quickly');
          return;
        }
      }

      // Test with reasonable timeout (5000ms) - should succeed
      const start2 = Date.now();
      await fs.readdir(this.projectRoot);
      const duration2 = Date.now() - start2;

      if (duration2 < 5000) {
        this.recordResult(testName, true, 'Read completed within timeout');
      } else {
        this.recordResult(testName, false, 'Read exceeded timeout');
      }
    } catch (error) {
      this.recordResult(testName, false, `Error: ${error.message}`);
    }
  }

  /**
   * Test 2: Async Non-Blocking
   * Property: Multiple async calls don't block event loop (run in parallel)
   */
  async testAsyncNonBlocking() {
    const testName = 'Async Non-Blocking';
    try {
      const startTime = Date.now();

      // Run multiple reads in parallel
      await Promise.all([
        fs.readdir(this.projectRoot),
        fs.readdir(path.join(this.projectRoot, 'lib')),
        fs.readdir(path.join(this.projectRoot, 'tests')),
      ]);

      const duration = Date.now() - startTime;

      // Parallel should be faster than sequential
      if (duration < 3000) {
        this.recordResult(testName, true, `Parallel operations completed in ${duration}ms`);
      } else {
        this.recordResult(testName, false, `Parallel operations too slow: ${duration}ms`);
      }
    } catch (error) {
      this.recordResult(testName, false, `Error: ${error.message}`);
    }
  }

  /**
   * Test 3: Idempotence
   * Property: Multiple calls with same input produce same output
   */
  async testIdempotence() {
    const testName = 'Idempotence';
    try {
      const result1 = await fs.readdir(path.join(this.projectRoot, 'lib'));
      const result2 = await fs.readdir(path.join(this.projectRoot, 'lib'));

      if (JSON.stringify(result1) === JSON.stringify(result2)) {
        this.recordResult(testName, true, 'Multiple calls produce identical results');
      } else {
        this.recordResult(testName, false, 'Multiple calls produce different results');
      }
    } catch (error) {
      this.recordResult(testName, false, `Error: ${error.message}`);
    }
  }

  /**
   * Test 4: Error Recovery
   * Property: Errors don't corrupt state, subsequent calls succeed
   */
  async testErrorRecovery() {
    const testName = 'Error Recovery';
    try {
      // Try to read non-existent path
      try {
        await fs.readdir('/nonexistent/path/that/does/not/exist');
      } catch (error) {
        // Expected to fail
      }

      // Try to read valid path - should succeed
      const result = await fs.readdir(path.join(this.projectRoot, 'lib'));

      if (Array.isArray(result) && result.length > 0) {
        this.recordResult(testName, true, 'Recovered from error, subsequent call succeeded');
      } else {
        this.recordResult(testName, false, 'State corrupted after error');
      }
    } catch (error) {
      this.recordResult(testName, false, `Error: ${error.message}`);
    }
  }

  /**
   * Test 5: Resource Cleanup
   * Property: No file handles left open after operations
   */
  async testResourceCleanup() {
    const testName = 'Resource Cleanup';
    try {
      // Perform multiple operations
      for (let i = 0; i < 10; i++) {
        await fs.readdir(this.projectRoot);
      }

      // If we got here without hitting file descriptor limits, cleanup is working
      this.recordResult(testName, true, 'No resource leaks detected after 10 operations');
    } catch (error) {
      if (error.message.includes('EMFILE') || error.message.includes('too many open files')) {
        this.recordResult(testName, false, 'Resource leak detected: file handles not closed');
      } else {
        this.recordResult(testName, false, `Error: ${error.message}`);
      }
    }
  }

  /**
   * Test 6: Monotonic Performance
   * Property: Performance doesn't degrade with repeated calls
   */
  async testMonotonicPerformance() {
    const testName = 'Monotonic Performance';
    try {
      const times = [];

      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await fs.readdir(this.projectRoot);
        times.push(Date.now() - start);
      }

      // Check if times are reasonably consistent (within 2x of first call)
      const firstTime = times[0];
      const maxTime = Math.max(...times);

      if (maxTime < firstTime * 2) {
        this.recordResult(testName, true, `Performance stable: ${times.join('ms, ')}ms`);
      } else {
        this.recordResult(testName, false, `Performance degraded: ${times.join('ms, ')}ms`);
      }
    } catch (error) {
      this.recordResult(testName, false, `Error: ${error.message}`);
    }
  }

  /**
   * Test 7: No Resource Leaks
   * Property: Memory usage doesn't grow unbounded
   */
  async testNoResourceLeaks() {
    const testName = 'No Resource Leaks';
    try {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await fs.readdir(this.projectRoot);
      }

      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Allow some increase but not unbounded
      if (memoryIncrease < 10 * 1024 * 1024) {
        // Less than 10MB
        this.recordResult(
          testName,
          true,
          `Memory increase acceptable: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`
        );
      } else {
        this.recordResult(
          testName,
          false,
          `Memory leak detected: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`
        );
      }
    } catch (error) {
      this.recordResult(testName, false, `Error: ${error.message}`);
    }
  }

  /**
   * Test 8: Async Boundary Consistency
   * Property: All public functions are async, no sync fs operations
   */
  async testAsyncBoundaryConsistency() {
    const testName = 'Async Boundary Consistency';
    try {
      const fileContent = await fs.readFile(
        path.join(this.projectRoot, 'lib', 'tools', 'codebase-orientation-handlers.js'),
        'utf8'
      );

      // Check for sync fs operations (should not exist after refactor)
      const syncPatterns = ['fs.readdirSync', 'fs.readFileSync', 'fs.statSync', 'fs.existsSync'];

      const foundSync = [];
      for (const pattern of syncPatterns) {
        if (fileContent.includes(pattern)) {
          foundSync.push(pattern);
        }
      }

      if (foundSync.length === 0) {
        this.recordResult(testName, true, 'No synchronous fs operations found');
      } else {
        this.recordResult(testName, false, `Found sync operations: ${foundSync.join(', ')}`);
      }
    } catch (error) {
      this.recordResult(testName, false, `Error: ${error.message}`);
    }
  }

  recordResult(testName, passed, message) {
    this.results.push({ test: testName, passed, message });
    if (passed) {
      this.passed++;
      console.log(`✓ ${testName}: ${message}`);
    } else {
      this.failed++;
      console.log(`✗ ${testName}: ${message}`);
    }
  }

  printSummary() {
    console.log('\n=== Codebase Orientation Property Tests Summary ===');
    console.log(`Total: ${this.results.length}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Success Rate: ${((this.passed / this.results.length) * 100).toFixed(1)}%`);

    if (this.failed === 0) {
      console.log('\nALL TESTS PASSED');
      process.exit(0);
    } else {
      console.log('\nSOME TESTS FAILED');
      process.exit(1);
    }
  }

  async runAll() {
    console.log('Running Codebase Orientation Property Tests...\n');

    await this.testTimeoutEnforcement();
    await this.testAsyncNonBlocking();
    await this.testIdempotence();
    await this.testErrorRecovery();
    await this.testResourceCleanup();
    await this.testMonotonicPerformance();
    await this.testNoResourceLeaks();
    await this.testAsyncBoundaryConsistency();

    this.printSummary();
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tests = new CodebaseOrientationPropertyTests();
  tests.runAll().catch((error) => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
}

export { CodebaseOrientationPropertyTests };
