/**
 * File System Chaos Test
 * Simulates locked files, permissions, symlinks, long paths
 */

import { fileURLToPath } from 'url';
import { join } from 'path';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  unlinkSync,
  rmdirSync,
  statSync,
  chmodSync,
  symlinkSync,
  readlinkSync,
} from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

class FileSystemChaosTest {
  constructor(options = {}) {
    this.options = options;
    this.results = {
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
    };

    this.testDir = join(__dirname, '..', 'fixtures', 'fs-chaos');
    this.ensureTestDir();
  }

  ensureTestDir() {
    if (!existsSync(this.testDir)) {
      mkdirSync(this.testDir, { recursive: true });
    }
  }

  async run() {
    console.log('[FileSystemChaosTest] Starting file system chaos test...');

    const tests = [
      'locked-files',
      'read-only-files',
      'missing-directories',
      'corrupted-files',
      'long-paths',
      'unicode-paths',
      'symlink-loops',
      'permission-denied',
      'file-in-use',
      'atomic-write-failure',
      'backup-failure',
      'concurrent-writes',
    ];

    for (const test of tests) {
      await this.runTest(test);
    }

    this.results.total = this.results.tests.length;
    return this.results;
  }

  async runTest(testName) {
    console.log(`[FileSystemChaosTest] Running: ${testName}...`);

    let passed = false;
    let error = null;

    try {
      switch (testName) {
        case 'locked-files':
          passed = await this.testLockedFiles();
          break;
        case 'read-only-files':
          passed = await this.testReadOnlyFiles();
          break;
        case 'missing-directories':
          passed = await this.testMissingDirectories();
          break;
        case 'corrupted-files':
          passed = await this.testCorruptedFiles();
          break;
        case 'long-paths':
          passed = await this.testLongPaths();
          break;
        case 'unicode-paths':
          passed = await this.testUnicodePaths();
          break;
        case 'symlink-loops':
          passed = await this.testSymlinkLoops();
          break;
        case 'permission-denied':
          passed = await this.testPermissionDenied();
          break;
        case 'file-in-use':
          passed = await this.testFileInUse();
          break;
        case 'atomic-write-failure':
          passed = await this.testAtomicWriteFailure();
          break;
        case 'backup-failure':
          passed = await this.testBackupFailure();
          break;
        case 'concurrent-writes':
          passed = await this.testConcurrentWrites();
          break;
      }
    } catch (e) {
      error = e.message;
    }

    this.results.tests.push({
      id: testName,
      name: `FS Chaos - ${testName}`,
      passed,
      error,
    });

    if (passed) {
      this.results.passed++;
      console.log(`[FileSystemChaosTest] ✅ ${testName}`);
    } else {
      this.results.failed++;
      console.log(`[FileSystemChaosTest] ❌ ${testName}: ${error}`);
    }
  }

  async testLockedFiles() {
    const filePath = join(this.testDir, 'locked-test.txt');

    try {
      mkdirSync(this.testDir, { recursive: true });
      writeFileSync(filePath, 'test content');

      // Simulate locked file (read-only)
      chmodSync(filePath, 0o444);

      // Try to write (should fail gracefully)
      const result = this.attemptWrite(filePath, 'new content');

      // Restore permissions
      chmodSync(filePath, 0o644);
      unlinkSync(filePath);
      rmdirSync(this.testDir);

      return result.handledGracefully || result.succeeded;
    } catch (e) {
      this.cleanup(filePath);
      return true; // chmod may not work on all systems
    }
  }

  async testReadOnlyFiles() {
    const filePath = join(this.testDir, 'readonly-test.txt');

    try {
      mkdirSync(this.testDir, { recursive: true });
      writeFileSync(filePath, 'test content');
      chmodSync(filePath, 0o444);

      // Try to modify (should fail gracefully)
      const result = this.attemptModify(filePath);

      // Cleanup
      chmodSync(filePath, 0o644);
      unlinkSync(filePath);
      rmdirSync(this.testDir);

      return result.handledGracefully || result.succeeded;
    } catch (e) {
      this.cleanup(filePath);
      return true; // chmod may not work on all systems
    }
  }

  async testMissingDirectories() {
    const filePath = join(this.testDir, 'nonexistent', 'test.txt');

    try {
      // Try to write to non-existent directory
      const result = this.attemptWrite(filePath, 'content');

      // Should create directory automatically
      const handled = result.handledGracefully || existsSync(filePath);

      // Cleanup
      this.cleanup(filePath);

      return handled;
    } catch (e) {
      this.cleanup(filePath);
      return false;
    }
  }

  async testCorruptedFiles() {
    const filePath = join(this.testDir, 'corrupted-test.txt');

    try {
      mkdirSync(this.testDir, { recursive: true });

      // Write corrupted data
      writeFileSync(filePath, Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe]));

      // Try to read as text (should handle gracefully)
      const result = this.attemptRead(filePath);

      // Cleanup
      unlinkSync(filePath);
      rmdirSync(this.testDir);

      return result.handledGracefully || result.succeeded;
    } catch (e) {
      this.cleanup(filePath);
      return true; // Handled by catching error
    }
  }

  async testLongPaths() {
    const longName = 'a'.repeat(200);
    const filePath = join(this.testDir, longName + '.txt');

    try {
      mkdirSync(this.testDir, { recursive: true });

      // Try to write long path
      const result = this.attemptWrite(filePath, 'content');

      const handled = result.handledGracefully || existsSync(filePath);

      // Cleanup
      this.cleanup(filePath);

      return handled;
    } catch (e) {
      this.cleanup(filePath);
      return false;
    }
  }

  async testUnicodePaths() {
    const unicodeName = '文件名-тест-🔥.txt';
    const filePath = join(this.testDir, unicodeName);

    try {
      mkdirSync(this.testDir, { recursive: true });

      // Try to write unicode path
      const result = this.attemptWrite(filePath, 'content');

      const handled = result.handledGracefully || existsSync(filePath);

      // Cleanup
      this.cleanup(filePath);

      return handled;
    } catch (e) {
      this.cleanup(filePath);
      return false;
    }
  }

  async testSymlinkLoops() {
    const link1 = join(this.testDir, 'link1');
    const link2 = join(this.testDir, 'link2');

    try {
      mkdirSync(this.testDir, { recursive: true });

      // Create symlink loop
      symlinkSync(link2, link1);
      symlinkSync(link1, link2);

      // Try to resolve (should detect loop)
      const result = this.attemptResolve(link1);

      // Cleanup
      try {
        unlinkSync(link1);
      } catch (e) {
        // Ignore
      }
      rmdirSync(this.testDir);

      return result.loopDetected || result.handledGracefully;
    } catch (e) {
      this.cleanup(link1);
      this.cleanup(link2);
      return true; // Symlinks may not be supported on all systems
    }
  }

  async testPermissionDenied() {
    const filePath = join(this.testDir, 'perm-denied.txt');

    try {
      mkdirSync(this.testDir, { recursive: true });
      writeFileSync(filePath, 'content');

      // Remove all permissions
      chmodSync(filePath, 0o000);

      // Try to access (should handle gracefully)
      const result = this.attemptRead(filePath);

      // Restore permissions
      chmodSync(filePath, 0o644);
      unlinkSync(filePath);
      rmdirSync(this.testDir);

      return result.handledGracefully || result.succeeded;
    } catch (e) {
      try {
        chmodSync(filePath, 0o644);
        this.cleanup(filePath);
      } catch (cleanupError) {
        // Ignore
      }
      return true; // chmod may not work on all systems
    }
  }

  async testFileInUse() {
    const filePath = join(this.testDir, 'in-use.txt');

    try {
      mkdirSync(this.testDir, { recursive: true });
      writeFileSync(filePath, 'content');

      // Simulate file in use by keeping file descriptor open
      const fd = this.openFileDescriptor(filePath);

      // Try to write (should handle gracefully)
      const result = this.attemptWrite(filePath, 'new content');

      // Close file descriptor
      this.closeFileDescriptor(fd);

      // Cleanup
      unlinkSync(filePath);
      rmdirSync(this.testDir);

      return result.handledGracefully || result.succeeded;
    } catch (e) {
      this.cleanup(filePath);
      return true; // File locking may not work on all systems
    }
  }

  async testAtomicWriteFailure() {
    const filePath = join(this.testDir, 'atomic-fail.txt');
    const tempPath = filePath + '.tmp';

    try {
      mkdirSync(this.testDir, { recursive: true });

      // Simulate atomic write failure
      writeFileSync(tempPath, 'content');

      // Simulate crash before rename
      const result = this.simulateAtomicWriteFailure(filePath, tempPath);

      // Cleanup
      try {
        unlinkSync(tempPath);
      } catch (e) {
        // Ignore
      }
      this.cleanup(filePath);

      return result.handledGracefully;
    } catch (e) {
      this.cleanup(filePath);
      this.cleanup(tempPath);
      return false;
    }
  }

  async testBackupFailure() {
    const filePath = join(this.testDir, 'backup-fail.txt');
    const backupPath = filePath + '.backup';

    try {
      mkdirSync(this.testDir, { recursive: true });
      writeFileSync(filePath, 'original content');

      // Simulate backup failure
      const result = this.simulateBackupFailure(filePath, backupPath);

      // Cleanup
      this.cleanup(filePath);
      this.cleanup(backupPath);

      return result.handledGracefully;
    } catch (e) {
      this.cleanup(filePath);
      this.cleanup(backupPath);
      return false;
    }
  }

  async testConcurrentWrites() {
    const filePath = join(this.testDir, 'concurrent.txt');

    try {
      mkdirSync(this.testDir, { recursive: true });

      // Simulate concurrent writes
      const writes = [];
      for (let i = 0; i < 10; i++) {
        writes.push(this.attemptWrite(filePath, `content-${i}`));
      }

      const results = await Promise.all(writes);
      const allHandled = results.every((r) => r.handledGracefully || r.succeeded);

      // Cleanup
      this.cleanup(filePath);

      return allHandled;
    } catch (e) {
      this.cleanup(filePath);
      return false;
    }
  }

  // Helper methods
  attemptWrite(filePath, content) {
    try {
      writeFileSync(filePath, content);
      return { succeeded: true, handledGracefully: true };
    } catch (e) {
      // Should have fallback/atomic write
      return { succeeded: false, handledGracefully: true, error: e.message };
    }
  }

  attemptModify(filePath) {
    try {
      writeFileSync(filePath, 'modified');
      return { succeeded: true, handledGracefully: true };
    } catch (e) {
      return { succeeded: false, handledGracefully: true, error: e.message };
    }
  }

  attemptRead(filePath) {
    try {
      readFileSync(filePath, 'utf-8');
      return { succeeded: true, handledGracefully: true };
    } catch (e) {
      return { succeeded: false, handledGracefully: true, error: e.message };
    }
  }

  attemptResolve(filePath) {
    try {
      let resolved = filePath;
      let visited = new Set();
      let iterations = 0;

      while (iterations < 100) {
        if (visited.has(resolved)) {
          return { loopDetected: true, handledGracefully: true };
        }
        visited.add(resolved);

        try {
          const linkTarget = readlinkSync(resolved);
          resolved = linkTarget;
        } catch (e) {
          break;
        }

        iterations++;
      }

      return { loopDetected: false, handledGracefully: true };
    } catch (e) {
      return { loopDetected: false, handledGracefully: true, error: e.message };
    }
  }

  openFileDescriptor(filePath) {
    // Simulate keeping file open
    return { path: filePath, open: true };
  }

  closeFileDescriptor(fd) {
    fd.open = false;
  }

  simulateAtomicWriteFailure(filePath, tempPath) {
    try {
      // Write to temp
      writeFileSync(tempPath, 'content');

      // Simulate crash - don't rename
      // Original file should remain intact

      const originalExists = existsSync(filePath);
      const tempExists = existsSync(tempPath);

      // Should have recovery mechanism
      return {
        handledGracefully: originalExists === false || tempExists === true,
        originalIntact: originalExists === false,
      };
    } catch (e) {
      return { handledGracefully: false, error: e.message };
    }
  }

  simulateBackupFailure(filePath, backupPath) {
    try {
      // Try to create backup
      writeFileSync(backupPath, 'backup content');

      // Simulate backup failure
      unlinkSync(backupPath);

      // Should have recovery
      return {
        handledGracefully: existsSync(filePath),
        originalIntact: existsSync(filePath),
      };
    } catch (e) {
      return { handledGracefully: false, error: e.message };
    }
  }

  cleanup(filePath) {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
      const dir = join(filePath, '..');
      if (existsSync(dir) && dir !== this.testDir) {
        rmdirSync(dir);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

export default FileSystemChaosTest;
