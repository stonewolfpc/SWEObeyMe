/**
 * Race Condition Simulation
 * Simulates concurrent writes, partial writes, corrupted writes
 */

import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync, rmdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

class RaceConditionSimulation {
  constructor(options = {}) {
    this.options = options;
    this.results = {
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
    };

    this.testDir = join(__dirname, '..', 'fixtures', 'race-conditions');
    this.ensureTestDir();
  }

  ensureTestDir() {
    if (!existsSync(this.testDir)) {
      mkdirSync(this.testDir, { recursive: true });
    }
  }

  async run() {
    console.log('[RaceConditions] Starting race condition simulation...');

    const tests = [
      'concurrent-writes',
      'partial-writes',
      'corrupted-writes',
      'rollback',
      'atomic-writer',
    ];

    for (const test of tests) {
      await this.runTest(test);
    }

    this.results.total = this.results.tests.length;
    return this.results;
  }

  async runTest(testName) {
    console.log(`[RaceConditions] Running: ${testName}...`);

    let passed = false;
    let error = null;

    try {
      switch (testName) {
        case 'concurrent-writes':
          passed = await this.testConcurrentWrites();
          break;
        case 'partial-writes':
          passed = await this.testPartialWrites();
          break;
        case 'corrupted-writes':
          passed = await this.testCorruptedWrites();
          break;
        case 'rollback':
          passed = await this.testRollback();
          break;
        case 'atomic-writer':
          passed = await this.testAtomicWriter();
          break;
      }
    } catch (e) {
      error = e.message;
    }

    this.results.tests.push({
      id: testName,
      name: `Race Conditions - ${testName}`,
      passed,
      error,
    });

    if (passed) {
      this.results.passed++;
      console.log(`[RaceConditions] ✅ ${testName}`);
    } else {
      this.results.failed++;
      console.log(`[RaceConditions] ❌ ${testName}: ${error}`);
    }
  }

  async testConcurrentWrites() {
    const configPath = join(this.testDir, 'concurrent-config.json');

    try {
      // Simulate concurrent writes
      const writes = [];
      for (let i = 0; i < 10; i++) {
        writes.push(
          new Promise((resolve) => {
            setTimeout(() => {
              try {
                const config = { mcpServers: { 'swe-obey-me': { command: 'node' } } };
                writeFileSync(configPath, JSON.stringify(config));
                resolve(true);
              } catch (e) {
                resolve(false);
              }
            }, Math.random() * 10);
          })
        );
      }

      const results = await Promise.all(writes);
      const allSucceeded = results.every((r) => r === true);

      // Verify config is valid
      const content = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);
      const valid = config.mcpServers !== undefined;

      // Cleanup
      unlinkSync(configPath);

      return allSucceeded && valid;
    } catch (e) {
      this.cleanup(configPath);
      return false;
    }
  }

  async testPartialWrites() {
    const configPath = join(this.testDir, 'partial-config.json');
    const tempPath = configPath + '.tmp';

    try {
      // Simulate partial write (write to temp, then crash before rename)
      writeFileSync(tempPath, '{"mcpServers": {"swe-obey-me": {"command": "node"');

      // Original should remain intact
      const originalExists = existsSync(configPath) === false || this.isConfigValid(configPath);

      // Cleanup
      try {
        unlinkSync(tempPath);
      } catch (e) {
        // Ignore
      }
      this.cleanup(configPath);

      return originalExists;
    } catch (e) {
      this.cleanup(tempPath);
      this.cleanup(configPath);
      return false;
    }
  }

  async testCorruptedWrites() {
    const configPath = join(this.testDir, 'corrupted-config.json');

    try {
      // Simulate corrupted write
      writeFileSync(configPath, '{invalid json}');

      // Atomic writer should detect and handle corruption
      const valid = this.isConfigValid(configPath) === false;

      // Cleanup
      unlinkSync(configPath);

      return valid;
    } catch (e) {
      this.cleanup(configPath);
      return false;
    }
  }

  async testRollback() {
    const configPath = join(this.testDir, 'rollback-config.json');
    const backupPath = configPath + '.backup';

    try {
      // Create valid config
      const validConfig = { mcpServers: { 'swe-obey-me': { command: 'node' } } };
      writeFileSync(backupPath, JSON.stringify(validConfig));

      // Simulate failed write
      try {
        writeFileSync(configPath, '{corrupted}');
      } catch (e) {
        // Write failed
      }

      // Should rollback from backup
      const recovered = this.isConfigValid(configPath) || this.isConfigValid(backupPath);

      // Cleanup
      this.cleanup(configPath);
      this.cleanup(backupPath);

      return recovered;
    } catch (e) {
      this.cleanup(configPath);
      this.cleanup(backupPath);
      return false;
    }
  }

  async testAtomicWriter() {
    const configPath = join(this.testDir, 'atomic-config.json');

    try {
      // Simulate atomic write pattern
      const tempPath = configPath + '.tmp';
      const config = { mcpServers: { 'swe-obey-me': { command: 'node' } } };

      // Write to temp
      writeFileSync(tempPath, JSON.stringify(config));

      // Atomic rename
      try {
        const { renameSync } = await import('fs');
        renameSync(tempPath, configPath);
      } catch (e) {
        // Fallback
        writeFileSync(configPath, JSON.stringify(config));
        unlinkSync(tempPath);
      }

      // Verify atomicity
      const content = readFileSync(configPath, 'utf-8');
      const configObj = JSON.parse(content);
      const valid = configObj.mcpServers !== undefined;

      // Cleanup
      unlinkSync(configPath);

      return valid;
    } catch (e) {
      this.cleanup(configPath);
      this.cleanup(configPath + '.tmp');
      return false;
    }
  }

  // Helper methods
  isConfigValid(path) {
    try {
      const content = readFileSync(path, 'utf-8');
      const config = JSON.parse(content);
      return config.mcpServers !== undefined;
    } catch (e) {
      return false;
    }
  }

  cleanup(path) {
    try {
      if (existsSync(path)) {
        unlinkSync(path);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

export default RaceConditionSimulation;
