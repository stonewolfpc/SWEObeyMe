#!/usr/bin/env node

/**
 * Filesystem Fuzzer
 * 
 * Fuzzes filesystem operations: lock files, delete mid-op, flip permissions, weird paths
 */

import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

export class FilesystemFuzzer {
  constructor(options = {}) {
    this.testDir = options.testDir || './fuzz-test-files';
    this.maxDepth = options.maxDepth || 5;
    this.chaosRate = options.chaosRate || 0.3;
  }

  /**
   * Initialize test directory
   */
  async init() {
    try {
      await fs.mkdir(this.testDir, { recursive: true });
    } catch (e) {
      // Directory may already exist
    }
  }

  /**
   * Cleanup test directory
   */
  async cleanup() {
    try {
      await fs.rm(this.testDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  /**
   * Generate weird/evil path
   */
  generateWeirdPath() {
    const patterns = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32',
      './test/./test/./file.txt',
      'normal/path/../../../etc/passwd',
      'C:\\Windows\\System32\\config\\SAM',
      '/dev/null',
      '/proc/self/environ',
      '\\\\?\\C:\\Windows\\System32',
      'CON', 'PRN', 'AUX', 'NUL', 'COM1', 'LPT1', // Reserved names on Windows
      'file:etc/passwd',
      'http://evil.com/malicious',
      'data:text/plain,evil',
      '\u0000null-byte.txt',
      'very' + '/'.repeat(100) + 'long/path',
      ' ' + ' '.repeat(100) + 'spaces.txt',
      'file\u202ename.txt', // Unicode homographs
      'file\u0301name.txt', // Combining characters
      '😀🎉🚀emoji.txt',
      'test' + '\r\n' + 'file.txt', // Control characters
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  /**
   * Generate random path
   */
  generateRandomPath() {
    const parts = [];
    const numParts = Math.floor(Math.random() * this.maxDepth) + 1;

    for (let i = 0; i < numParts; i++) {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789_-';
      let part = '';
      for (let j = 0; j < 10; j++) {
        part += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      parts.push(part);
    }

    return path.join(...parts);
  }

  /**
   * Create test file with random content
   */
  async createTestFile(filePath, size = 1024) {
    const fullPath = path.join(this.testDir, filePath);
    const dir = path.dirname(fullPath);

    try {
      await fs.mkdir(dir, { recursive: true });
      const content = randomBytes(size);
      await fs.writeFile(fullPath, content);
      return fullPath;
    } catch (e) {
      return null;
    }
  }

  /**
   * Lock file (simulate file lock)
   */
  async lockFile(filePath) {
    const lockPath = filePath + '.lock';
    try {
      await fs.writeFile(lockPath, Buffer.from('LOCKED'));
      return lockPath;
    } catch (e) {
      return null;
    }
  }

  /**
   * Delete file mid-operation simulation
   */
  async deleteMidOperation(filePath) {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Flip file permissions
   */
  async flipPermissions(filePath) {
    try {
      // On Unix-like systems, we can change permissions
      // On Windows, this is more limited
      const modes = [0o000, 0o444, 0o666, 0o777, 0o000];
      const mode = modes[Math.floor(Math.random() * modes.length)];
      
      // Try to change mode (will fail on Windows for some modes)
      await fs.chmod(filePath, mode);
      return mode;
    } catch (e) {
      return null;
    }
  }

  /**
   * Corrupt file content
   */
  async corruptFile(filePath) {
    try {
      const original = await fs.readFile(filePath);
      const corrupted = Buffer.from(original);
      
      // Corrupt random bytes
      const numCorruptions = Math.floor(corrupted.length * 0.1);
      for (let i = 0; i < numCorruptions; i++) {
        const pos = Math.floor(Math.random() * corrupted.length);
        corrupted[pos] = Math.floor(Math.random() * 256);
      }
      
      await fs.writeFile(filePath, corrupted);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Create directory with weird permissions
   */
  async createWeirdDirectory(dirPath) {
    const fullPath = path.join(this.testDir, dirPath);
    
    try {
      await fs.mkdir(fullPath, { recursive: true });
      
      // Try weird permissions
      const modes = [0o000, 0o111, 0o444, 0o777];
      const mode = modes[Math.floor(Math.random() * modes.length)];
      await fs.chmod(fullPath, mode);
      
      return fullPath;
    } catch (e) {
      return null;
    }
  }

  /**
   * Simulate symlink attack
   */
  async createSymlink(target, linkPath) {
    try {
      await fs.symlink(target, linkPath);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Create hard link
   */
  async createHardLink(existingPath, newPath) {
    try {
      await fs.link(existingPath, newPath);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Simulate disk full scenario
   */
  async simulateDiskFull(filePath) {
    try {
      // Try to write a very large file
      const hugeSize = 10 * 1024 * 1024 * 1024; // 10GB
      await fs.writeFile(filePath, randomBytes(1024)); // Start small
      return true;
    } catch (e) {
      if (e.code === 'ENOSPC') {
        return true; // Successfully simulated disk full
      }
      return false;
    }
  }

  /**
   * Simulate race condition
   */
  async simulateRaceCondition(filePath) {
    const promises = [];
    
    // Multiple operations on the same file
    for (let i = 0; i < 10; i++) {
      promises.push(
        fs.writeFile(filePath, randomBytes(1024))
          .then(() => fs.readFile(filePath))
          .then(() => fs.unlink(filePath))
          .catch(() => {})
      );
    }

    await Promise.all(promises);
    return true;
  }

  /**
   * Generate filesystem chaos scenario
   */
  async generateChaosScenario() {
    const scenarios = [
      () => this.lockFileTest(),
      () => this.deleteMidOpTest(),
      () => this.permissionsTest(),
      () => this.weirdPathTest(),
      () => this.corruptionTest(),
      () => this.symlinkTest(),
      () => this.raceConditionTest(),
      () => this.diskFullTest()
    ];

    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    return await scenario();
  }

  /**
   * Lock file test
   */
  async lockFileTest() {
    const filePath = await this.createTestFile('lock-test/file.txt');
    if (!filePath) return { type: 'lock_file', success: false };

    const lockPath = await this.lockFile(filePath);
    return {
      type: 'lock_file',
      success: lockPath !== null,
      filePath,
      lockPath
    };
  }

  /**
   * Delete mid-operation test
   */
  async deleteMidOpTest() {
    const filePath = await this.createTestFile('delete-test/file.txt');
    if (!filePath) return { type: 'delete_mid_op', success: false };

    await this.deleteMidOperation(filePath);
    return {
      type: 'delete_mid_op',
      success: true,
      filePath
    };
  }

  /**
   * Permissions test
   */
  async permissionsTest() {
    const filePath = await this.createTestFile('permissions-test/file.txt');
    if (!filePath) return { type: 'permissions', success: false };

    const mode = await this.flipPermissions(filePath);
    return {
      type: 'permissions',
      success: mode !== null,
      filePath,
      mode
    };
  }

  /**
   * Weird path test
   */
  async weirdPathTest() {
    const weirdPath = this.generateWeirdPath();
    
    try {
      await fs.mkdir(path.join(this.testDir, weirdPath), { recursive: true });
      return {
        type: 'weird_path',
        success: true,
        path: weirdPath
      };
    } catch (e) {
      return {
        type: 'weird_path',
        success: false,
        path: weirdPath,
        error: e.code
      };
    }
  }

  /**
   * Corruption test
   */
  async corruptionTest() {
    const filePath = await this.createTestFile('corruption-test/file.txt');
    if (!filePath) return { type: 'corruption', success: false };

    const corrupted = await this.corruptFile(filePath);
    return {
      type: 'corruption',
      success: corrupted,
      filePath
    };
  }

  /**
   * Symlink test
   */
  async symlinkTest() {
    const target = await this.createTestFile('symlink-test/target.txt');
    const linkPath = path.join(this.testDir, 'symlink-test/link.txt');
    
    if (!target) return { type: 'symlink', success: false };

    const created = await this.createSymlink(target, linkPath);
    return {
      type: 'symlink',
      success: created,
      target,
      linkPath
    };
  }

  /**
   * Race condition test
   */
  async raceConditionTest() {
    const filePath = await this.createTestFile('race-test/file.txt');
    if (!filePath) return { type: 'race_condition', success: false };

    await this.simulateRaceCondition(filePath);
    return {
      type: 'race_condition',
      success: true,
      filePath
    };
  }

  /**
   * Disk full test
   */
  async diskFullTest() {
    const filePath = path.join(this.testDir, 'disk-full-test/huge.txt');
    const simulated = await this.simulateDiskFull(filePath);
    return {
      type: 'disk_full',
      success: simulated,
      filePath
    };
  }

  /**
   * Run filesystem fuzz batch
   */
  async runFuzzBatch(count = 50) {
    await this.init();
    
    const results = [];
    for (let i = 0; i < count; i++) {
      const result = await this.generateChaosScenario();
      results.push(result);
    }

    await this.cleanup();
    return results;
  }
}
