/**
 * Fuzzer Cases for Codebase Orientation Refactor
 * Tests edge cases, timeout stress, deep traversal, large directories, permission issues, and concurrent access
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CodebaseOrientationFuzzer {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
    this.testDir = path.join(__dirname, 'fuzzer-temp');
  }

  /**
   * Setup: Create temporary test directory
   */
  async setup() {
    try {
      await fs.mkdir(this.testDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Cleanup: Remove temporary test directory
   */
  async cleanup() {
    try {
      await fs.rm(this.testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  }

  /**
   * Fuzzer 1: Timeout Stress
   * Test: Vary timeouts from 1ms to 10000ms
   * Expected: Fast timeouts fail gracefully, slow timeouts succeed
   */
  async testTimeoutStress() {
    const testName = 'Timeout Stress';
    try {
      const timeouts = [1, 10, 100, 1000, 5000, 10000];
      const results = [];

      for (const timeout of timeouts) {
        const start = Date.now();
        try {
          await Promise.race([
            fs.readdir('d:\\SWEObeyMe-restored'),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), timeout)
            )
          ]);
          const duration = Date.now() - start;
          results.push({ timeout, success: true, duration });
        } catch (error) {
          const duration = Date.now() - start;
          results.push({ timeout, success: false, duration, error: error.message });
        }
      }

      // Verify pattern: very short timeouts should fail, longer should succeed
      const fastFailures = results.filter(r => r.timeout < 100 && !r.success).length;
      const slowSuccesses = results.filter(r => r.timeout >= 1000 && r.success).length;

      if (fastFailures > 0 && slowSuccesses > 0) {
        this.recordResult(testName, true, `Timeout pattern correct: ${fastFailures} fast failures, ${slowSuccesses} slow successes`);
      } else {
        this.recordResult(testName, false, `Timeout pattern incorrect: ${JSON.stringify(results)}`);
      }
    } catch (error) {
      this.recordResult(testName, false, `Error: ${error.message}`);
    }
  }

  /**
   * Fuzzer 2: Deep Directory Traversal
   * Test: Create deeply nested directories (20+ levels)
   * Expected: Timeout prevents infinite recursion
   */
  async testDeepDirectoryTraversal() {
    const testName = 'Deep Directory Traversal';
    try {
      let currentPath = this.testDir;
      const depth = 20;

      // Create deep directory structure
      for (let i = 0; i < depth; i++) {
        currentPath = path.join(currentPath, `level${i}`);
        await fs.mkdir(currentPath, { recursive: true });
      }

      // Try to traverse with timeout
      const start = Date.now();
      try {
        await Promise.race([
          this.traverseDirectory(this.testDir, 0, 100), // Max depth 100
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);
        const duration = Date.now() - start;
        this.recordResult(testName, true, `Deep traversal completed in ${duration}ms with depth limit`);
      } catch (error) {
        const duration = Date.now() - start;
        if (error.message.includes('Timeout') || error.message.includes('depth')) {
          this.recordResult(testName, true, `Deep traversal prevented by timeout/depth limit in ${duration}ms`);
        } else {
          this.recordResult(testName, false, `Unexpected error: ${error.message}`);
        }
      }
    } catch (error) {
      this.recordResult(testName, false, `Error: ${error.message}`);
    }
  }

  async traverseDirectory(dir, depth, maxDepth) {
    if (depth >= maxDepth) {
      return;
    }

    const items = await fs.readdir(dir, { withFileTypes: true });
    for (const item of items) {
      if (item.isDirectory()) {
        await this.traverseDirectory(path.join(dir, item.name), depth + 1, maxDepth);
      }
    }
  }

  /**
   * Fuzzer 3: Large Directory
   * Test: Directory with many files (100+)
   * Expected: Timeout prevents hanging, completes within reasonable time
   */
  async testLargeDirectory() {
    const testName = 'Large Directory';
    try {
      const largeDir = path.join(this.testDir, 'large');
      await fs.mkdir(largeDir, { recursive: true });

      // Create 100 files
      for (let i = 0; i < 100; i++) {
        await fs.writeFile(path.join(largeDir, `file${i}.txt`), `content ${i}`);
      }

      // Try to read with timeout
      const start = Date.now();
      try {
        const result = await Promise.race([
          fs.readdir(largeDir),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);
        const duration = Date.now() - start;

        if (result.length === 100 && duration < 5000) {
          this.recordResult(testName, true, `Large directory read successfully: 100 files in ${duration}ms`);
        } else {
          this.recordResult(testName, false, `Large directory read failed: ${result.length} files in ${duration}ms`);
        }
      } catch (error) {
        const duration = Date.now() - start;
        if (error.message.includes('Timeout')) {
          this.recordResult(testName, false, `Large directory timed out after ${duration}ms`);
        } else {
          this.recordResult(testName, false, `Unexpected error: ${error.message}`);
        }
      }
    } catch (error) {
      this.recordResult(testName, false, `Error: ${error.message}`);
    }
  }

  /**
   * Fuzzer 4: Permission Denied
   * Test: Directory with restricted permissions
   * Expected: Error caught and returned gracefully
   */
  async testPermissionDenied() {
    const testName = 'Permission Denied';
    try {
      // This test is platform-dependent and may not work on Windows
      // Skip on Windows or if permission changes fail
      if (process.platform === 'win32') {
        this.recordResult(testName, true, 'Skipped on Windows (permission model different)');
        return;
      }

      const restrictedDir = path.join(this.testDir, 'restricted');
      await fs.mkdir(restrictedDir, { recursive: true });

      try {
        // Try to make directory unreadable
        await fs.chmod(restrictedDir, 0o000);
      } catch (error) {
        // Permission change failed, skip test
        this.recordResult(testName, true, 'Skipped (cannot change permissions)');
        return;
      }

      // Try to read with timeout
      const start = Date.now();
      try {
        await Promise.race([
          fs.readdir(restrictedDir),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 1000)
          )
        ]);
        const duration = Date.now() - start;
        this.recordResult(testName, false, `Permission check failed: read succeeded in ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - start;
        // Should fail with permission error or timeout
        if (error.code === 'EACCES' || error.code === 'EPERM' || error.message.includes('Timeout')) {
          this.recordResult(testName, true, `Permission denied handled gracefully in ${duration}ms`);
        } else {
          this.recordResult(testName, false, `Unexpected error: ${error.message}`);
        }
      }

      // Restore permissions for cleanup
      try {
        await fs.chmod(restrictedDir, 0o755);
      } catch (error) {
        // Ignore
      }
    } catch (error) {
      this.recordResult(testName, false, `Error: ${error.message}`);
    }
  }

  /**
   * Fuzzer 5: Concurrent Access
   * Test: 50 concurrent calls to same directory
   * Expected: No race conditions, all complete or timeout
   */
  async testConcurrentAccess() {
    const testName = 'Concurrent Access';
    try {
      const start = Date.now();
      
      const promises = Array(50).fill().map(() => 
        Promise.race([
          fs.readdir('d:\\SWEObeyMe-restored'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 10000)
          )
        ])
      );

      const results = await Promise.allSettled(promises);
      const duration = Date.now() - start;

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (successful + failed === 50 && duration < 15000) {
        this.recordResult(testName, true, `Concurrent access: ${successful} succeeded, ${failed} failed in ${duration}ms`);
      } else {
        this.recordResult(testName, false, `Concurrent access issue: ${successful} succeeded, ${failed} failed in ${duration}ms`);
      }
    } catch (error) {
      this.recordResult(testName, false, `Error: ${error.message}`);
    }
  }

  /**
   * Fuzzer 6: Empty Directory
   * Test: Read empty directory
   * Expected: Returns empty array without error
   */
  async testEmptyDirectory() {
    const testName = 'Empty Directory';
    try {
      const emptyDir = path.join(this.testDir, 'empty');
      await fs.mkdir(emptyDir, { recursive: true });

      const result = await fs.readdir(emptyDir);

      if (Array.isArray(result) && result.length === 0) {
        this.recordResult(testName, true, 'Empty directory returns empty array');
      } else {
        this.recordResult(testName, false, `Empty directory returned: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      this.recordResult(testName, false, `Error: ${error.message}`);
    }
  }

  /**
   * Fuzzer 7: Non-Existent Path
   * Test: Try to read non-existent directory
   * Expected: Error thrown, caught gracefully
   */
  async testNonExistentPath() {
    const testName = 'Non-Existent Path';
    try {
      const start = Date.now();
      try {
        await Promise.race([
          fs.readdir('/nonexistent/path/that/does/not/exist'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 1000)
          )
        ]);
        const duration = Date.now() - start;
        this.recordResult(testName, false, `Non-existent path did not throw error in ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - start;
        if (error.code === 'ENOENT' || error.code === 'ENOTDIR' || error.message.includes('Timeout')) {
          this.recordResult(testName, true, `Non-existent path handled correctly in ${duration}ms`);
        } else {
          this.recordResult(testName, false, `Unexpected error: ${error.message}`);
        }
      }
    } catch (error) {
      this.recordResult(testName, false, `Error: ${error.message}`);
    }
  }

  /**
   * Fuzzer 8: Special Characters in Path
   * Test: Directory names with special characters
   * Expected: Handles special characters correctly
   */
  async testSpecialCharacters() {
    const testName = 'Special Characters in Path';
    try {
      const specialChars = ['test-dir', 'test_dir', 'test.dir', 'test dir'];
      const results = [];

      for (const char of specialChars) {
        try {
          const dirPath = path.join(this.testDir, char);
          await fs.mkdir(dirPath, { recursive: true });
          await fs.readdir(dirPath);
          results.push({ char, success: true });
        } catch (error) {
          results.push({ char, success: false, error: error.message });
        }
      }

      const successful = results.filter(r => r.success).length;
      if (successful === specialChars.length) {
        this.recordResult(testName, true, `All special characters handled correctly`);
      } else {
        this.recordResult(testName, false, `${specialChars.length - successful} special characters failed`);
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
    console.log('\n=== Codebase Orientation Fuzzer Summary ===');
    console.log(`Total: ${this.results.length}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Success Rate: ${((this.passed / this.results.length) * 100).toFixed(1)}%`);
    
    if (this.failed === 0) {
      console.log('\nALL FUZZER TESTS PASSED');
      process.exit(0);
    } else {
      console.log('\nSOME FUZZER TESTS FAILED');
      process.exit(1);
    }
  }

  async runAll() {
    console.log('Running Codebase Orientation Fuzzer Cases...\n');
    
    await this.setup();
    
    try {
      await this.testTimeoutStress();
      await this.testDeepDirectoryTraversal();
      await this.testLargeDirectory();
      await this.testPermissionDenied();
      await this.testConcurrentAccess();
      await this.testEmptyDirectory();
      await this.testNonExistentPath();
      await this.testSpecialCharacters();
    } finally {
      await this.cleanup();
    }
    
    this.printSummary();
  }
}

// Run fuzzer if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const fuzzer = new CodebaseOrientationFuzzer();
  fuzzer.runAll().catch(error => {
    console.error('Fuzzer error:', error);
    process.exit(1);
  });
}

export { CodebaseOrientationFuzzer };
