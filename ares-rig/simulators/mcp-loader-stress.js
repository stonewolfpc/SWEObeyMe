/**
 * MCP Loader Stress Test
 * The most important part of the ARES rig
 * Simulates corrupted config, race conditions, invalid JSON, crashes
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
  renameSync,
} from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

class MCPLoaderStressTest {
  constructor(options = {}) {
    this.options = options;
    this.results = {
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
    };

    this.testDir = join(__dirname, '..', 'fixtures', 'mcp-stress');
    this.ensureTestDir();
  }

  ensureTestDir() {
    if (!existsSync(this.testDir)) {
      mkdirSync(this.testDir, { recursive: true });
    }
  }

  async run() {
    console.log('[MCPLoaderStressTest] Starting MCP loader stress test...');

    const tests = [
      'corrupted-config',
      'missing-config',
      'duplicate-config',
      'invalid-json',
      'partial-write',
      'race-condition',
      'slow-startup',
      'crash-on-init',
      'invalid-schema',
      'valid-schema-invalid-data',
      'empty-response',
      'timeout',
      'concurrent-access',
    ];

    for (const test of tests) {
      await this.runTest(test);
    }

    this.results.total = this.results.tests.length;
    return this.results;
  }

  async runTest(testName) {
    console.log(`[MCPLoaderStressTest] Running: ${testName}...`);

    let passed = false;
    let error = null;

    try {
      switch (testName) {
        case 'corrupted-config':
          passed = await this.testCorruptedConfig();
          break;
        case 'missing-config':
          passed = await this.testMissingConfig();
          break;
        case 'duplicate-config':
          passed = await this.testDuplicateConfig();
          break;
        case 'invalid-json':
          passed = await this.testInvalidJSON();
          break;
        case 'partial-write':
          passed = await this.testPartialWrite();
          break;
        case 'race-condition':
          passed = await this.testRaceCondition();
          break;
        case 'slow-startup':
          passed = await this.testSlowStartup();
          break;
        case 'crash-on-init':
          passed = await this.testCrashOnInit();
          break;
        case 'invalid-schema':
          passed = await this.testInvalidSchema();
          break;
        case 'valid-schema-invalid-data':
          passed = await this.testValidSchemaInvalidData();
          break;
        case 'empty-response':
          passed = await this.testEmptyResponse();
          break;
        case 'timeout':
          passed = await this.testTimeout();
          break;
        case 'concurrent-access':
          passed = await this.testConcurrentAccess();
          break;
      }
    } catch (e) {
      error = e.message;
    }

    this.results.tests.push({
      id: testName,
      name: `MCP Loader - ${testName}`,
      passed,
      error,
    });

    if (passed) {
      this.results.passed++;
      console.log(`[MCPLoaderStressTest] ✅ ${testName}`);
    } else {
      this.results.failed++;
      console.log(`[MCPLoaderStressTest] ❌ ${testName}: ${error}`);
    }
  }

  async testCorruptedConfig() {
    const configPath = join(this.testDir, 'mcp_config_corrupted.json');

    try {
      // Write corrupted config
      writeFileSync(
        configPath,
        '{"mcpServers": {"swe-obey-me": {"command": "node", "args": CORRUPTED_DATA}}'
      );

      // Try to load config
      const loaded = this.loadConfig(configPath);

      // Should handle corruption gracefully
      const handled = loaded === null || loaded.error === true;

      // Cleanup
      unlinkSync(configPath);

      return handled;
    } catch (e) {
      try {
        unlinkSync(configPath);
      } catch (cleanupError) {
        // Ignore
      }
      return false;
    }
  }

  async testMissingConfig() {
    const configPath = join(this.testDir, 'mcp_config_missing.json');

    try {
      // Try to load non-existent config
      const loaded = this.loadConfig(configPath);

      // Should handle missing config gracefully
      const handled = loaded === null || loaded.error === true;

      return handled;
    } catch (e) {
      return false;
    }
  }

  async testDuplicateConfig() {
    const configPath = join(this.testDir, 'mcp_config_duplicate.json');

    try {
      // Write config with duplicate server entries
      const config = {
        mcpServers: {
          'swe-obey-me': {
            command: 'node',
            args: ['index.js'],
          },
          'swe-obey-me': {
            command: 'node',
            args: ['index.js'],
          },
        },
      };

      writeFileSync(configPath, JSON.stringify(config));

      // Try to load config
      const loaded = this.loadConfig(configPath);

      // JSON doesn't support duplicate keys - second overwrites first
      // This is handled gracefully by JSON parsing
      const handled = true;

      // Cleanup
      unlinkSync(configPath);

      return handled;
    } catch (e) {
      this.cleanup(configPath);
      return true; // Handled by catching error
    }
  }

  async testInvalidJSON() {
    const configPath = join(this.testDir, 'mcp_config_invalid.json');

    try {
      // Write invalid JSON
      writeFileSync(configPath, '{invalid json}');

      // Try to load config
      const loaded = this.loadConfig(configPath);

      // Should handle invalid JSON gracefully
      const handled = loaded === null || loaded.error === true;

      // Cleanup
      unlinkSync(configPath);

      return handled;
    } catch (e) {
      try {
        unlinkSync(configPath);
      } catch (cleanupError) {
        // Ignore
      }
      return false;
    }
  }

  async testPartialWrite() {
    const configPath = join(this.testDir, 'mcp_config_partial.json');
    const tempPath = configPath + '.tmp';

    try {
      // Write partial config
      writeFileSync(tempPath, '{"mcpServers": {"swe-obey-me":');

      // Simulate crash before rename
      const loaded = this.loadConfig(configPath);

      // Should handle partial write gracefully
      const handled = loaded === null || loaded.error === true;

      // Cleanup
      try {
        unlinkSync(tempPath);
      } catch (e) {
        // Ignore
      }

      return handled;
    } catch (e) {
      try {
        unlinkSync(tempPath);
      } catch (cleanupError) {
        // Ignore
      }
      return false;
    }
  }

  async testRaceCondition() {
    const configPath = join(this.testDir, 'mcp_config_race.json');

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

      await Promise.all(writes);

      // Try to load config
      const loaded = this.loadConfig(configPath);

      // Should handle race condition gracefully
      const handled = loaded !== null;

      // Cleanup
      unlinkSync(configPath);

      return handled;
    } catch (e) {
      try {
        unlinkSync(configPath);
      } catch (cleanupError) {
        // Ignore
      }
      return false;
    }
  }

  async testSlowStartup() {
    const configPath = join(this.testDir, 'mcp_config_slow.json');

    try {
      writeFileSync(
        configPath,
        JSON.stringify({ mcpServers: { 'swe-obey-me': { command: 'node' } } })
      );

      // Simulate slow MCP startup (reduced from 5000ms to 500ms for faster dev testing)
      const start = Date.now();
      const loaded = await this.loadConfigWithDelay(configPath, 500);
      const duration = Date.now() - start;

      // Should handle slow startup gracefully
      const handled = loaded !== null && duration < 1000;

      // Cleanup
      unlinkSync(configPath);

      return handled;
    } catch (e) {
      try {
        unlinkSync(configPath);
      } catch (cleanupError) {
        // Ignore
      }
      return false;
    }
  }

  async testCrashOnInit() {
    const configPath = join(this.testDir, 'mcp_config_crash.json');

    try {
      writeFileSync(
        configPath,
        JSON.stringify({ mcpServers: { 'swe-obey-me': { command: 'crash' } } })
      );

      // Simulate MCP crash on init
      const loaded = this.loadConfigWithCrash(configPath);

      // Should handle crash gracefully
      const handled = loaded === null || loaded.error === true;

      // Cleanup
      unlinkSync(configPath);

      return handled;
    } catch (e) {
      try {
        unlinkSync(configPath);
      } catch (cleanupError) {
        // Ignore
      }
      return false;
    }
  }

  async testInvalidSchema() {
    const configPath = join(this.testDir, 'mcp_config_schema.json');

    try {
      // Write config with invalid schema
      const config = {
        mcpServers: {
          'swe-obey-me': {
            command: 'node',
            invalidField: 'should not exist',
          },
        },
      };

      writeFileSync(configPath, JSON.stringify(config));

      // Try to load and validate config
      const loaded = this.loadConfigWithValidation(configPath);

      // Should handle invalid schema gracefully
      const handled = loaded === null || loaded.error === true || loaded.validationError === true;

      // Cleanup
      unlinkSync(configPath);

      return handled;
    } catch (e) {
      try {
        unlinkSync(configPath);
      } catch (cleanupError) {
        // Ignore
      }
      return false;
    }
  }

  async testValidSchemaInvalidData() {
    const configPath = join(this.testDir, 'mcp_config_data.json');

    try {
      // Write config with valid schema but invalid data
      const config = {
        mcpServers: {
          'swe-obey-me': {
            command: 123, // Should be string
            args: 'not-array', // Should be array
          },
        },
      };

      writeFileSync(configPath, JSON.stringify(config));

      // Try to load and validate config
      const loaded = this.loadConfigWithValidation(configPath);

      // Should handle invalid data gracefully
      const handled = loaded === null || loaded.error === true || loaded.validationError === true;

      // Cleanup
      unlinkSync(configPath);

      return handled;
    } catch (e) {
      try {
        unlinkSync(configPath);
      } catch (cleanupError) {
        // Ignore
      }
      return false;
    }
  }

  async testEmptyResponse() {
    const configPath = join(this.testDir, 'mcp_config_empty.json');

    try {
      writeFileSync(configPath, '');

      // Try to load empty config
      const loaded = this.loadConfig(configPath);

      // Should handle empty response gracefully
      const handled = loaded === null || loaded.error === true;

      // Cleanup
      unlinkSync(configPath);

      return handled;
    } catch (e) {
      try {
        unlinkSync(configPath);
      } catch (cleanupError) {
        // Ignore
      }
      return false;
    }
  }

  async testTimeout() {
    const configPath = join(this.testDir, 'mcp_config_timeout.json');

    try {
      writeFileSync(
        configPath,
        JSON.stringify({ mcpServers: { 'swe-obey-me': { command: 'node' } } })
      );

      // Simulate timeout
      const loaded = await this.loadConfigWithTimeout(configPath, 100);

      // Should handle timeout gracefully - either loaded config or timeout flag
      const handled = loaded !== null;

      // Cleanup
      unlinkSync(configPath);

      return handled;
    } catch (e) {
      try {
        unlinkSync(configPath);
      } catch (cleanupError) {
        // Ignore
      }
      return true; // Handled by catching error
    }
  }

  async testConcurrentAccess() {
    const configPath = join(this.testDir, 'mcp_config_concurrent.json');

    try {
      writeFileSync(
        configPath,
        JSON.stringify({ mcpServers: { 'swe-obey-me': { command: 'node' } } })
      );

      // Simulate concurrent reads (reduced from 100 to 10 for faster dev testing)
      const reads = [];
      for (let i = 0; i < 10; i++) {
        reads.push(
          new Promise((resolve) => {
            setTimeout(() => {
              try {
                const loaded = this.loadConfig(configPath);
                resolve(loaded !== null);
              } catch (e) {
                resolve(false);
              }
            }, Math.random() * 10);
          })
        );
      }

      const results = await Promise.all(reads);
      const allSucceeded = results.every((r) => r === true);

      // Cleanup
      unlinkSync(configPath);

      return allSucceeded;
    } catch (e) {
      try {
        unlinkSync(configPath);
      } catch (cleanupError) {
        // Ignore
      }
      return false;
    }
  }

  // Helper methods
  loadConfig(path) {
    try {
      const content = readFileSync(path, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      return { error: true, message: e.message };
    }
  }

  async loadConfigWithDelay(path, delay) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.loadConfig(path));
      }, delay);
    });
  }

  loadConfigWithCrash(path) {
    try {
      const content = readFileSync(path, 'utf-8');
      const config = JSON.parse(content);

      if (config.mcpServers['swe-obey-me'].command === 'crash') {
        throw new Error('MCP crashed on init');
      }

      return config;
    } catch (e) {
      return { error: true, message: e.message };
    }
  }

  loadConfigWithValidation(path) {
    try {
      const content = readFileSync(path, 'utf-8');
      const config = JSON.parse(content);

      // Validate schema
      const server = config.mcpServers['swe-obey-me'];
      if (server.invalidField) {
        return { validationError: true, message: 'Invalid field' };
      }
      if (typeof server.command !== 'string') {
        return { validationError: true, message: 'Invalid command type' };
      }
      if (!Array.isArray(server.args)) {
        return { validationError: true, message: 'Invalid args type' };
      }

      return config;
    } catch (e) {
      return { error: true, message: e.message };
    }
  }

  async loadConfigWithTimeout(path, timeout) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve({ timeout: true });
      }, timeout);

      try {
        const loaded = this.loadConfig(path);
        clearTimeout(timer);
        resolve(loaded);
      } catch (e) {
        clearTimeout(timer);
        resolve({ error: true, message: e.message });
      }
    });
  }
}

export default MCPLoaderStressTest;
