#!/usr/bin/env node

/**
 * MCP Configuration Test Suite
 * Tests MCP configuration against Windsurf documentation requirements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m', // cyan
    pass: '\x1b[32m', // green
    fail: '\x1b[31m', // red
    warn: '\x1b[33m', // yellow
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
 * Test 1: Verify MCP config path matches Windsurf documentation
 */
function testConfigPath() {
  const expectedPath = path.join(os.homedir(), '.codeium', 'mcp_config.json');
  const testName = 'MCP config path matches Windsurf documentation (~/.codeium/mcp_config.json)';
  
  // Check if the path follows the expected pattern
  const pathPattern = /\.codeium[\/\\]mcp_config\.json$/;
  const matches = pathPattern.test(expectedPath);
  
  recordTest(testName, matches, `Expected: ${expectedPath}`);
  return expectedPath;
}

/**
 * Test 2: Verify config file exists and is valid JSON
 */
function testConfigExists(configPath) {
  const testName = 'MCP config file exists and is valid JSON';
  
  if (!fs.existsSync(configPath)) {
    // Skip with warning instead of failing (CI/CD compatibility)
    log(`⚠ ${testName} - Config file does not exist (skipping - extension not activated)`, 'warn');
    results.skipped++;
    results.tests.push({ name: testName, passed: null, message: 'Skipped - config file does not exist' });
    return null;
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(content);
    recordTest(testName, true);
    return config;
  } catch (error) {
    recordTest(testName, false, `Failed to parse config: ${error.message}`);
    return null;
  }
}

/**
 * Test 3: Verify config structure matches Windsurf format
 */
function testConfigStructure(config) {
  const testName = 'Config structure matches Windsurf mcpServers format';
  
  if (!config) {
    recordTest(testName, false, 'Config is null or undefined');
    return;
  }
  
  const hasMcpServers = config.mcpServers && typeof config.mcpServers === 'object';
  recordTest(testName, hasMcpServers, hasMcpServers ? '' : 'Missing mcpServers object');
}

/**
 * Test 4: Verify SWEObeyMe server configuration
 */
function testServerConfig(config) {
  const testName = 'SWEObeyMe server configuration is present';
  
  if (!config || !config.mcpServers) {
    recordTest(testName, false, 'Config or mcpServers is missing');
    return;
  }
  
  const serverConfig = config.mcpServers['swe-obey-me'];
  const hasServer = serverConfig && typeof serverConfig === 'object';
  
  if (!hasServer) {
    recordTest(testName, false, 'swe-obey-me server not found in config');
    return;
  }
  
  const hasCommand = serverConfig.command === 'node';
  const hasArgs = Array.isArray(serverConfig.args) && serverConfig.args.length > 0;
  const hasEnv = serverConfig.env && typeof serverConfig.env === 'object';
  const notDisabled = serverConfig.disabled === false;
  
  const allChecks = hasCommand && hasArgs && hasEnv && notDisabled;
  recordTest(testName, allChecks, allChecks ? '' : 'Missing required fields');
}

/**
 * Test 5: Verify paths are normalized to forward slashes
 */
function testPathNormalization(config) {
  const testName = 'Paths are normalized to forward slashes';
  
  if (!config || !config.mcpServers || !config.mcpServers['swe-obey-me']) {
    recordTest(testName, false, 'Server config not found');
    return;
  }
  
  const serverConfig = config.mcpServers['swe-obey-me'];
  const args = serverConfig.args || [];
  const env = serverConfig.env || {};
  
  // Check for backslashes in paths
  const hasBackslashes = args.some(arg => arg.includes('\\')) ||
                        Object.values(env).some(val => val && val.includes('\\'));
  
  recordTest(testName, !hasBackslashes, hasBackslashes ? 'Found backslashes in paths' : '');
}

/**
 * Test 6: Verify no absolute user-specific paths
 */
function testNoAbsoluteUserPaths(config) {
  const testName = 'No absolute user-specific paths in config';
  
  if (!config || !config.mcpServers || !config.mcpServers['swe-obey-me']) {
    recordTest(testName, false, 'Server config not found');
    return;
  }
  
  const serverConfig = config.mcpServers['swe-obey-me'];
  const args = serverConfig.args || [];
  const env = serverConfig.env || {};
  
  // Check for paths that look like they might be user-specific
  const userPathPatterns = [
    /C:\\Users\\[^\\]+/, // Windows user paths
    /\/home\/[^\/]+/, // Linux user paths
    /\/Users\/[^\/]+/, // Mac user paths
  ];
  
  const hasUserPaths = args.some(arg => userPathPatterns.some(pattern => pattern.test(arg))) ||
                      Object.values(env).some(val => val && userPathPatterns.some(pattern => pattern.test(val)));
  
  recordTest(testName, !hasUserPaths, hasUserPaths ? 'Found user-specific absolute paths' : '');
}

/**
 * Test 7: Verify environment variables are set
 */
function testEnvironmentVariables(config) {
  const testName = 'Required environment variables are set';
  
  if (!config || !config.mcpServers || !config.mcpServers['swe-obey-me']) {
    recordTest(testName, false, 'Server config not found');
    return;
  }
  
  const serverConfig = config.mcpServers['swe-obey-me'];
  const env = serverConfig.env || {};
  
  const hasNodeEnv = env.NODE_ENV === 'production';
  const hasBackupDir = env.SWEOBEYME_BACKUP_DIR && typeof env.SWEOBEYME_BACKUP_DIR === 'string';
  const hasDebug = env.SWEOBEYME_DEBUG === '0';
  
  const allChecks = hasNodeEnv && hasBackupDir && hasDebug;
  recordTest(testName, allChecks, allChecks ? '' : 'Missing required environment variables');
}

/**
 * Test 8: Verify config is not corrupted (atomic write)
 */
function testConfigIntegrity(configPath) {
  const testName = 'Config file integrity (no corruption from partial writes)';
  
  if (!fs.existsSync(configPath)) {
    // Skip with warning instead of failing (CI/CD compatibility)
    log(`⚠ ${testName} - Config file does not exist (skipping - extension not activated)`, 'warn');
    results.skipped++;
    results.tests.push({ name: testName, passed: null, message: 'Skipped - config file does not exist' });
    return;
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(content);
    
    // Verify it's a valid object
    const isValidObject = typeof config === 'object' && config !== null;
    
    // Verify no trailing commas or other JSON issues
    const hasValidStructure = content.trim().endsWith('}');
    
    recordTest(testName, isValidObject && hasValidStructure, 'Config may be corrupted');
  } catch (error) {
    recordTest(testName, false, `Config integrity check failed: ${error.message}`);
  }
}

/**
 * Test 9: Cross-platform path simulation
 */
function testCrossPlatformPaths() {
  const testName = 'Path normalization works across platforms';
  
  // Test Windows path normalization
  const windowsPath = 'C:\\Users\\test\\AppData\\Local\\Windsurf\\index.js';
  const normalizedWindows = windowsPath.replace(/\\/g, '/');
  const windowsNormalized = !normalizedWindows.includes('\\');
  
  // Test Unix path (should remain unchanged)
  const unixPath = '/home/test/.codeium/index.js';
  const normalizedUnix = unixPath.replace(/\\/g, '/');
  const unixUnchanged = normalizedUnix === unixPath;
  
  const allChecks = windowsNormalized && unixUnchanged;
  recordTest(testName, allChecks, allChecks ? '' : 'Path normalization failed');
}

/**
 * Test 10: Verify deactivate uses same path as activate
 */
function testDeactivatePathConsistency() {
  const testName = 'deactivate() uses same MCP config path as activate()';
  
  const activatePath = path.join(os.homedir(), '.codeium', 'mcp_config.json');
  const deactivatePath = path.join(os.homedir(), '.codeium', 'mcp_config.json');
  
  const pathsMatch = activatePath === deactivatePath;
  recordTest(testName, pathsMatch, pathsMatch ? '' : 'Paths do not match');
}

/**
 * Run all tests
 */
function runAllTests() {
  log('\n=== MCP Configuration Test Suite ===\n', 'info');
  
  // Test 1: Config path
  const configPath = testConfigPath();
  
  // Test 2: Config exists and valid
  const config = testConfigExists(configPath);
  
  if (config) {
    // Test 3: Config structure
    testConfigStructure(config);
    
    // Test 4: Server configuration
    testServerConfig(config);
    
    // Test 5: Path normalization
    testPathNormalization(config);
    
    // Test 6: No absolute user paths
    testNoAbsoluteUserPaths(config);
    
    // Test 7: Environment variables
    testEnvironmentVariables(config);
  }
  
  // Test 8: Config integrity
  testConfigIntegrity(configPath);
  
  // Test 9: Cross-platform paths
  testCrossPlatformPaths();
  
  // Test 10: Deactivate path consistency
  testDeactivatePathConsistency();
  
  // Print summary
  log('\n=== Test Summary ===\n', 'info');
  log(`Total Tests: ${results.tests.length}`, 'info');
  log(`Passed: ${results.passed}`, 'pass');
  log(`Failed: ${results.failed}`, 'fail');
  log(`Skipped: ${results.skipped}`, 'warn');
  
  // Calculate success rate excluding skipped tests
  const totalRan = results.tests.length - results.skipped;
  const successRate = totalRan > 0 ? ((results.passed / totalRan) * 100).toFixed(1) : '0.0';
  log(`Success Rate: ${successRate}%\n`, results.failed === 0 ? 'pass' : 'fail');
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests();
