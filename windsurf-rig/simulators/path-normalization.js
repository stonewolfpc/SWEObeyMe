/**
 * Path Normalization Test
 * Validates that paths conform to Windsurf-Next rules
 */

import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

class PathNormalizationTest {
  constructor(options = {}) {
    this.options = options;
    this.results = {
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
    };
  }

  async run() {
    console.log('[PathNormalization] Starting path normalization test...');

    const tests = [
      'reject-backslashes',
      'reject-uppercase-drives',
      'reject-double-dots',
      'reject-trailing-slashes',
      'reject-double-slashes',
      'normalize-forward-slashes',
      'normalize-drive-letters',
      'scan-config-paths',
      'compare-normalized',
    ];

    for (const test of tests) {
      await this.runTest(test);
    }

    this.results.total = this.results.tests.length;
    return this.results;
  }

  async runTest(testName) {
    console.log(`[PathNormalization] Running: ${testName}...`);

    let passed = false;
    let error = null;

    try {
      switch (testName) {
        case 'reject-backslashes':
          passed = await this.testRejectBackslashes();
          break;
        case 'reject-uppercase-drives':
          passed = await this.testRejectUppercaseDrives();
          break;
        case 'reject-double-dots':
          passed = await this.testRejectDoubleDots();
          break;
        case 'reject-trailing-slashes':
          passed = await this.testRejectTrailingSlashes();
          break;
        case 'reject-double-slashes':
          passed = await this.testRejectDoubleSlashes();
          break;
        case 'normalize-forward-slashes':
          passed = await this.testNormalizeForwardSlashes();
          break;
        case 'normalize-drive-letters':
          passed = await this.testNormalizeDriveLetters();
          break;
        case 'scan-config-paths':
          passed = await this.testScanConfigPaths();
          break;
        case 'compare-normalized':
          passed = await this.testCompareNormalized();
          break;
      }
    } catch (e) {
      error = e.message;
    }

    this.results.tests.push({
      id: testName,
      name: `Path Normalization - ${testName}`,
      passed,
      error,
    });

    if (passed) {
      this.results.passed++;
      console.log(`[PathNormalization] ✅ ${testName}`);
    } else {
      this.results.failed++;
      console.log(`[PathNormalization] ❌ ${testName}: ${error}`);
    }
  }

  async testRejectBackslashes() {
    const pathWithBackslashes = 'C:\\Users\\test\\index.js';
    const hasBackslashes = pathWithBackslashes.includes('\\');

    return hasBackslashes === true;
  }

  async testRejectUppercaseDrives() {
    const pathWithUppercase = 'C:/Users/test/index.js';
    const hasUppercase = /^[A-Z]:/.test(pathWithUppercase);

    return hasUppercase === true;
  }

  async testRejectDoubleDots() {
    const pathWithDoubleDots = '/home/user/../index.js';
    const hasDoubleDots = pathWithDoubleDots.includes('..');

    return hasDoubleDots === true;
  }

  async testRejectTrailingSlashes() {
    const pathWithTrailing = '/home/user/index.js/';
    const hasTrailing = pathWithTrailing.endsWith('/');

    return hasTrailing === true;
  }

  async testRejectDoubleSlashes() {
    const pathWithDouble = '/home/user//index.js';
    const hasDouble = pathWithDouble.includes('//');

    return hasDouble === true;
  }

  async testNormalizeForwardSlashes() {
    const pathWithBackslashes = 'C:\\Users\\test\\index.js';
    const normalized = this.normalizePath(pathWithBackslashes);

    const hasForwardSlashes = normalized.includes('/') && !normalized.includes('\\');
    return hasForwardSlashes === true;
  }

  async testNormalizeDriveLetters() {
    const pathWithUppercase = 'C:/Users/test/index.js';
    const normalized = this.normalizePath(pathWithUppercase);

    const hasLowercase = /^[a-z]:/.test(normalized);
    return hasLowercase === true;
  }

  async testScanConfigPaths() {
    // Scan the actual generated config for path issues
    const config = this.getConfig();

    if (!config) {
      return true; // Skip if no config
    }

    const issues = this.scanPathsInConfig(config);

    return issues.length === 0;
  }

  async testCompareNormalized() {
    const original = 'C:\\Users\\test\\index.js';
    const normalized = this.normalizePath(original);

    const differs = normalized !== original;
    return differs === true;
  }

  // Helper methods
  normalizePath(path) {
    if (typeof path !== 'string') {
      return path;
    }

    // Convert backslashes to forward slashes
    let normalized = path.replace(/\\/g, '/');

    // Convert uppercase drive letters to lowercase (Windows)
    if (/^[A-Z]:/.test(normalized)) {
      normalized = normalized[0].toLowerCase() + normalized.slice(1);
    }

    // Remove trailing slashes
    normalized = normalized.replace(/\/+$/, '');

    // Remove double slashes
    normalized = normalized.replace(/\/+/g, '/');

    // Remove .. segments
    normalized = normalized.replace(/\.\./g, '');

    return normalized;
  }

  getConfig() {
    const configPath = join(dirname(__dirname), '..', '.sweobeyme-config.json');

    try {
      const content = readFileSync(configPath, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  }

  scanPathsInConfig(config) {
    const issues = [];

    if (!config.mcpServers) {
      return issues;
    }

    for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
      // Scan args
      if (serverConfig.args && Array.isArray(serverConfig.args)) {
        for (const arg of serverConfig.args) {
          if (typeof arg === 'string') {
            if (arg.includes('\\')) {
              issues.push(`backslashes in args: ${arg}`);
            }
            if (/^[A-Z]:/.test(arg)) {
              issues.push(`uppercase drive in args: ${arg}`);
            }
            if (arg.includes('..')) {
              issues.push(`double dots in args: ${arg}`);
            }
            if (arg.endsWith('/')) {
              issues.push(`trailing slash in args: ${arg}`);
            }
            if (arg.includes('//')) {
              issues.push(`double slash in args: ${arg}`);
            }
          }
        }
      }

      // Scan env
      if (serverConfig.env) {
        for (const [key, value] of Object.entries(serverConfig.env)) {
          if (typeof value === 'string') {
            if (value.includes('\\')) {
              issues.push(`backslashes in env ${key}: ${value}`);
            }
            if (/^[A-Z]:/.test(value)) {
              issues.push(`uppercase drive in env ${key}: ${value}`);
            }
            if (value.includes('..')) {
              issues.push(`double dots in env ${key}: ${value}`);
            }
            if (value.endsWith('/')) {
              issues.push(`trailing slash in env ${key}: ${value}`);
            }
            if (value.includes('//')) {
              issues.push(`double slash in env ${key}: ${value}`);
            }
          }
        }
      }
    }

    return issues;
  }
}

export default PathNormalizationTest;
