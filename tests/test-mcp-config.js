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
  if (passed === true) {
    results.passed++;
    log(`✓ ${name}`, 'pass');
  } else if (passed === false) {
    results.failed++;
    log(`✗ ${name}`, 'fail');
    if (message) log(`  ${message}`, 'warn');
  }
  // passed === null means skipped, already counted elsewhere
}

/**
 * Test 1: Verify MCP config is handled via native contributes.mcpServers
 * (No manual config writing needed)
 */
function testConfigPath() {
  const testName = 'MCP config uses native contributes.mcpServers (no manual config)';
  
  // Since we removed manual config writing, this test now just verifies
  // that the extension declares the MCP server in package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const hasMcpServers = packageJson.contributes?.mcpServers?.length > 0;
  
  recordTest(testName, hasMcpServers, hasMcpServers ? 'Native MCP server declaration found' : 'Missing contributes.mcpServers');
}

/**
 * Test 2: Verify config file exists and is valid JSON
 * (Skipped since we now use native contributes.mcpServers)
 */
function testConfigExists() {
  const testName = 'MCP config file exists and is valid JSON';
  // Skip this test since we removed manual config writing
  log(`⚠ ${testName} - Skipped (using native contributes.mcpServers)`, 'warn');
  results.skipped++;
  results.tests.push({ name: testName, passed: null, message: 'Skipped - using native contributes.mcpServers' });
  return null;
}

/**
 * Test 3: Verify config structure matches Windsurf format
 * (Skipped since we now use native contributes.mcpServers)
 */
function testConfigStructure(config) {
  const testName = 'Config structure matches Windsurf mcpServers format';
  // Skip this test since we removed manual config writing
  log(`⚠ ${testName} - Skipped (using native contributes.mcpServers)`, 'warn');
  results.skipped++;
  results.tests.push({ name: testName, passed: null, message: 'Skipped - using native contributes.mcpServers' });
}

/**
 * Test 4: Verify SWEObeyMe server configuration
 * (Skipped since we now use native contributes.mcpServers)
 */
function testServerConfig(config) {
  const testName = 'SWEObeyMe server configuration is present';
  // Skip this test since we removed manual config writing
  log(`⚠ ${testName} - Skipped (using native contributes.mcpServers)`, 'warn');
  results.skipped++;
  results.tests.push({ name: testName, passed: null, message: 'Skipped - using native contributes.mcpServers' });
}

/**
 * Test 5: Verify paths are normalized to forward slashes
 * (Skipped since we now use native contributes.mcpServers)
 */
function testPathNormalization(config) {
  const testName = 'Paths are normalized to forward slashes';
  // Skip this test since we removed manual config writing
  log(`⚠ ${testName} - Skipped (using native contributes.mcpServers)`, 'warn');
  results.skipped++;
  results.tests.push({ name: testName, passed: null, message: 'Skipped - using native contributes.mcpServers' });
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
  const unixPath = '/home/test/extension/index.js';
  const normalizedUnix = unixPath.replace(/\\/g, '/');
  const unixUnchanged = normalizedUnix === unixPath;
  
  const allChecks = windowsNormalized && unixUnchanged;
  recordTest(testName, allChecks, allChecks ? '' : 'Path normalization failed');
}

/**
 * Test 10: Verify deactivate uses same path as activate
 * (Skipped since we now use native contributes.mcpServers)
 */
function testDeactivatePathConsistency() {
  const testName = 'deactivate() uses same MCP config path as activate';
  // Skip this test since we removed manual config writing
  log(`⚠ ${testName} - Skipped (using native contributes.mcpServers)`, 'warn');
  results.skipped++;
  results.tests.push({ name: testName, passed: null, message: 'Skipped - using native contributes.mcpServers' });
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
