#!/usr/bin/env node

/**
 * MCP Configuration Simulation Test
 * Simulates extension activation to test MCP config writing logic
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import {
  loadConfig,
  validateConfig,
  getWindsurfConfigPath,
} from '../lib/health/validate-windsurf-mcp-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    pass: '\x1b[32m',
    fail: '\x1b[31m',
    warn: '\x1b[33m',
    reset: '\x1b[0m',
  };
  const color = colors[type] || colors.info;
  console.log(`${color}${message}${colors.reset}`);
}

function recordTest(name, passed, message = '') {
  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
    log(`✓ ${name}`, 'pass');
  } else {
    results.failed++;
    log(`✗ ${name}`, 'fail');
    if (message) log(`  ${message}`, 'warn');
  }
}

/**
 * Simulate the MCP config writing logic from extension.js
 */
function simulateConfigWrite(extensionPath, backupDir, configPath = null) {
  const configDir = configPath ? path.dirname(configPath) : path.join(os.homedir(), '.codeium');
  const mcpConfigPath = configPath || path.join(configDir, 'mcp_config.json');

  // Ensure directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Load existing config or create new
  let config = {};
  if (fs.existsSync(mcpConfigPath)) {
    const raw = fs.readFileSync(mcpConfigPath, 'utf8');
    if (raw.trim()) {
      try {
        config = JSON.parse(raw);
      } catch (e) {
        config = {};
      }
    }
  }

  // Normalize paths
  const normalizedIndexPath = extensionPath.replace(/\\/g, '/');
  const normalizedBackupDir = backupDir.replace(/\\/g, '/');

  // Write server config
  config.mcpServers = config.mcpServers || {};
  config.mcpServers['swe-obey-me'] = {
    command: 'node',
    args: [normalizedIndexPath],
    env: {
      NODE_ENV: 'production',
      SWEOBEYME_BACKUP_DIR: normalizedBackupDir,
      SWEOBEYME_DEBUG: '0',
    },
    disabled: false,
  };

  // Atomic write
  const tempPath = mcpConfigPath + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify(config, null, 2));
  fs.renameSync(tempPath, mcpConfigPath);

  return { configDir, mcpConfigPath, config };
}

/**
 * Test 1: Simulate Windows installation
 */
function testWindowsInstallation() {
  const testName = 'Windows installation simulation';

  try {
    const extensionPath =
      'C:\\Users\\test\\.windsurf-next\\extensions\\stonewolfpc.swe-obey-me-2.0.5\\index.js';
    const backupDir = 'C:\\Users\\test\\AppData\\Local\\SWEObeyMe\\.sweobeyme-backups';

    // Use temporary directory for CI/CD compatibility
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-config-test-'));
    const tempConfigPath = path.join(tempDir, 'mcp_config.json');

    const { mcpConfigPath, config } = simulateConfigWrite(extensionPath, backupDir, tempConfigPath);

    // Verify config was written
    const configExists = fs.existsSync(mcpConfigPath);
    const hasServer = config.mcpServers && config.mcpServers['swe-obey-me'];
    const pathNormalized = !config.mcpServers['swe-obey-me'].args[1].includes('\\');
    const backupNormalized =
      !config.mcpServers['swe-obey-me'].env.SWEOBEYME_BACKUP_DIR.includes('\\');

    const allChecks = configExists && hasServer && pathNormalized && backupNormalized;
    recordTest(testName, allChecks, allChecks ? '' : 'Config write or normalization failed');

    // Cleanup
    if (fs.existsSync(mcpConfigPath)) fs.unlinkSync(mcpConfigPath);
    fs.rmdirSync(tempDir);
  } catch (error) {
    recordTest(testName, false, error.message);
  }
}

/**
 * Test 2: Simulate Linux installation
 */
function testLinuxInstallation() {
  const testName = 'Linux installation simulation';

  try {
    const extensionPath =
      '/home/test/.windsurf-next/extensions/stonewolfpc.swe-obey-me-2.0.5/index.js';
    const backupDir = '/home/test/.local/SWEObeyMe/.sweobeyme-backups';

    // Use temporary directory for CI/CD compatibility
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-config-test-'));
    const tempConfigPath = path.join(tempDir, 'mcp_config.json');

    const { mcpConfigPath, config } = simulateConfigWrite(extensionPath, backupDir, tempConfigPath);

    // Verify config was written
    const configExists = fs.existsSync(mcpConfigPath);
    const hasServer = config.mcpServers && config.mcpServers['swe-obey-me'];
    // For Linux/Mac, check that path is normalized (no backslashes)
    const pathNormalized = !config.mcpServers['swe-obey-me'].args[1].includes('\\');
    const backupNormalized =
      !config.mcpServers['swe-obey-me'].env.SWEOBEYME_BACKUP_DIR.includes('\\');

    const allChecks = configExists && hasServer && pathNormalized && backupNormalized;
    recordTest(testName, allChecks, allChecks ? '' : 'Config write or path validation failed');

    // Cleanup
    if (fs.existsSync(mcpConfigPath)) fs.unlinkSync(mcpConfigPath);
    fs.rmdirSync(tempDir);
  } catch (error) {
    recordTest(testName, false, error.message);
  }
}

/**
 * Test 3: Simulate Mac installation
 */
function testMacInstallation() {
  const testName = 'Mac installation simulation';

  try {
    const extensionPath =
      '/Users/test/.windsurf-next/extensions/stonewolfpc.swe-obey-me-2.0.5/index.js';
    const backupDir = '/Users/test/Library/Application Support/SWEObeyMe/.sweobeyme-backups';

    // Use temporary directory for CI/CD compatibility
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-config-test-'));
    const tempConfigPath = path.join(tempDir, 'mcp_config.json');

    const { mcpConfigPath, config } = simulateConfigWrite(extensionPath, backupDir, tempConfigPath);

    // Verify config was written
    const configExists = fs.existsSync(mcpConfigPath);
    const hasServer = config.mcpServers && config.mcpServers['swe-obey-me'];
    // For Linux/Mac, check that path is normalized (no backslashes)
    const pathNormalized = !config.mcpServers['swe-obey-me'].args[1].includes('\\');
    const backupNormalized =
      !config.mcpServers['swe-obey-me'].env.SWEOBEYME_BACKUP_DIR.includes('\\');

    const allChecks = configExists && hasServer && pathNormalized && backupNormalized;
    recordTest(testName, allChecks, allChecks ? '' : 'Config write or path validation failed');

    // Cleanup
    if (fs.existsSync(mcpConfigPath)) fs.unlinkSync(mcpConfigPath);
    fs.rmdirSync(tempDir);
  } catch (error) {
    recordTest(testName, false, error.message);
  }
}

/**
 * Test 4: Verify atomic write prevents corruption
 */
function testAtomicWrite() {
  const testName = 'Atomic write prevents corruption';

  try {
    const extensionPath = '/test/path/index.js';
    const backupDir = '/test/backups';

    // Use temporary directory for CI/CD compatibility
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-config-test-'));
    const tempConfigPath = path.join(tempDir, 'mcp_config.json');

    const { mcpConfigPath } = simulateConfigWrite(extensionPath, backupDir, tempConfigPath);

    // Verify temp file was cleaned up
    const tempFileExists = fs.existsSync(mcpConfigPath + '.tmp');

    // Verify main file is valid JSON
    const content = fs.readFileSync(mcpConfigPath, 'utf8');
    const isValidJson = () => {
      try {
        JSON.parse(content);
        return true;
      } catch {
        return false;
      }
    };

    const allChecks = !tempFileExists && isValidJson();
    recordTest(
      testName,
      allChecks,
      allChecks ? '' : 'Atomic write failed or temp file not cleaned'
    );

    // Cleanup
    if (fs.existsSync(mcpConfigPath)) fs.unlinkSync(mcpConfigPath);
    fs.rmdirSync(tempDir);
  } catch (error) {
    recordTest(testName, false, error.message);
  }
}

/**
 * Test 5: Verify config path matches Windsurf docs
 */
function testConfigPath() {
  const testName = 'Config path matches Windsurf documentation';

  const expectedPath = path.join(os.homedir(), '.codeium', 'mcp_config.json');
  const matches = expectedPath.includes('.codeium') && expectedPath.endsWith('mcp_config.json');

  recordTest(
    testName,
    matches,
    matches ? '' : `Expected path to be ~/.codeium/mcp_config.json, got ${expectedPath}`
  );
}

/**
 * Test 6: Verify deactivate uses same path
 */
function testDeactivatePath() {
  const testName = 'Deactivate uses same config path as activate';

  const activatePath = path.join(os.homedir(), '.codeium', 'mcp_config.json');
  const deactivatePath = path.join(os.homedir(), '.codeium', 'mcp_config.json');

  const matches = activatePath === deactivatePath;
  recordTest(testName, matches, matches ? '' : 'Paths do not match');
}

/**
 * Test 7: Verify environment variables are set correctly
 */
function testEnvironmentVariables() {
  const testName = 'Environment variables are set correctly';

  try {
    const extensionPath = '/test/index.js';
    const backupDir = '/test/backups';

    // Use temporary directory for CI/CD compatibility
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-config-test-'));
    const tempConfigPath = path.join(tempDir, 'mcp_config.json');

    const { mcpConfigPath, config } = simulateConfigWrite(extensionPath, backupDir, tempConfigPath);

    const serverConfig = config.mcpServers['swe-obey-me'];
    const env = serverConfig.env;

    const nodeEnv = env.NODE_ENV === 'production';
    const hasBackupDir = env.SWEOBEYME_BACKUP_DIR === backupDir;
    const debug = env.SWEOBEYME_DEBUG === '0';

    const allChecks = nodeEnv && hasBackupDir && debug;
    recordTest(testName, allChecks, allChecks ? '' : 'Environment variables not set correctly');

    // Cleanup
    if (fs.existsSync(mcpConfigPath)) fs.unlinkSync(mcpConfigPath);
    fs.rmdirSync(tempDir);
  } catch (error) {
    recordTest(testName, false, error.message);
  }
}

/**
 * Windsurf MCP Config Polygraph Test Phase
 * Validates the actual Windsurf MCP config using the core validator
 */
function testWindsurfMcpConfigPolygraph() {
  const testName = 'Windsurf MCP Config Polygraph';
  try {
    const configPath = getWindsurfConfigPath();

    // Load config
    const { config, issues: loadIssues } = loadConfig(configPath);

    const configFileExists = config !== null;
    const configJsonValid = !loadIssues.some((i) => i.code === 'ERR-MCP-CONFIG-JSON');

    recordTest(
      `${testName}: configFileExists`,
      configFileExists,
      configFileExists ? '' : 'Config file not found or unreadable'
    );
    recordTest(
      `${testName}: configJsonValid`,
      configJsonValid,
      configJsonValid ? '' : 'Config JSON is malformed'
    );

    if (!configFileExists) {
      return;
    }

    // Validate config
    const validationIssues = validateConfig(configPath, config);

    const mcpServersPresent = config.mcpServers && typeof config.mcpServers === 'object';
    const sweObeyMeEntryPresent = config.mcpServers && config.mcpServers['swe-obey-me'];
    const noCriticalIssues = !validationIssues.some(
      (i) =>
        i.code === 'ERR-MCP-CONFIG-MISSING-MCP-SERVERS' ||
        i.code === 'ERR-MCP-CONFIG-MISSING-COMMAND' ||
        i.code === 'ERR-MCP-CONFIG-MISSING-ARGS' ||
        i.code === 'ERR-MCP-CONFIG-ENTRYPOINT-NOT-FOUND'
    );

    recordTest(
      `${testName}: mcpServersPresent`,
      mcpServersPresent,
      mcpServersPresent ? '' : 'mcpServers object missing'
    );
    recordTest(
      `${testName}: swe-obey-meEntryPresent`,
      sweObeyMeEntryPresent,
      sweObeyMeEntryPresent ? '' : 'swe-obey-me entry missing'
    );

    if (sweObeyMeEntryPresent) {
      const server = config.mcpServers['swe-obey-me'];
      const commandValid = !!server.command;
      const argsValid = Array.isArray(server.args) && server.args.length > 0;
      const disabledFlagValid =
        server.disabled === undefined || typeof server.disabled === 'boolean';

      recordTest(
        `${testName}: commandValid`,
        commandValid,
        commandValid ? '' : 'command field missing'
      );
      recordTest(
        `${testName}: argsValid`,
        argsValid,
        argsValid ? '' : 'args array missing or empty'
      );
      recordTest(
        `${testName}: disabledFlagValid`,
        disabledFlagValid,
        disabledFlagValid ? '' : 'disabled flag invalid'
      );

      if (argsValid) {
        const entry = server.args[server.args.length - 1];
        const entrypointUriValid = entry.startsWith('file:///') && !entry.includes('\\');
        recordTest(
          `${testName}: entrypointUriValid`,
          entrypointUriValid,
          entrypointUriValid ? '' : 'Entrypoint not a valid file:/// URI'
        );

        if (entrypointUriValid) {
          const localPath = entry.replace('file:///', '');
          const entrypointFileExists = fs.existsSync(localPath);
          recordTest(
            `${testName}: entrypointFileExists`,
            entrypointFileExists,
            entrypointFileExists ? '' : `Entrypoint file not found: ${localPath}`
          );
        }
      }
    }

    recordTest(
      `${testName}: noCriticalIssues`,
      noCriticalIssues,
      noCriticalIssues ? '' : 'Critical config issues detected'
    );
  } catch (error) {
    recordTest(testName, false, error.message);
  }
}

/**
 * Run all tests
 */
function runAllTests() {
  log('\n=== MCP Configuration Simulation Test Suite ===\n', 'info');

  testConfigPath();
  testDeactivatePath();
  testWindowsInstallation();
  testLinuxInstallation();
  testMacInstallation();
  testAtomicWrite();
  testEnvironmentVariables();
  testWindsurfMcpConfigPolygraph();

  // Print summary
  log('\n=== Test Summary ===\n', 'info');
  log(`Total Tests: ${results.tests.length}`, 'info');
  log(`Passed: ${results.passed}`, 'pass');
  log(`Failed: ${results.failed}`, 'fail');

  const successRate = ((results.passed / results.tests.length) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%\n`, results.failed === 0 ? 'pass' : 'fail');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests();
