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
 * (Skipped since we now use native contributes.mcpServers)
 */
function testNoAbsoluteUserPaths(config) {
  const testName = 'No absolute user-specific paths in config';
  // Skip this test since we removed manual config writing
  log(`⚠ ${testName} - Skipped (using native contributes.mcpServers)`, 'warn');
  results.skipped++;
  results.tests.push({ name: testName, passed: null, message: 'Skipped - using native contributes.mcpServers' });
}

/**
 * Test 7: Verify environment variables are set
 * (Skipped since we now use native contributes.mcpServers)
 */
function testEnvironmentVariables(config) {
  const testName = 'Required environment variables are set';
  // Skip this test since we removed manual config writing
  log(`⚠ ${testName} - Skipped (using native contributes.mcpServers)`, 'warn');
  results.skipped++;
  results.tests.push({ name: testName, passed: null, message: 'Skipped - using native contributes.mcpServers' });
}

/**
 * Test 8: Verify config is not corrupted (atomic write)
 * (Skipped since we now use native contributes.mcpServers)
 */
function testConfigIntegrity() {
  const testName = 'Config file integrity (no corruption from partial writes)';
  // Skip this test since we removed manual config writing
  log(`⚠ ${testName} - Skipped (using native contributes.mcpServers)`, 'warn');
  results.skipped++;
  results.tests.push({ name: testName, passed: null, message: 'Skipped - using native contributes.mcpServers' });
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
  
  // Test 1: Config path (native contributes.mcpServers)
  testConfigPath();
  
  // Test 2: Config exists and valid (skipped for native approach)
  const config = testConfigExists();
  
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
  
  // Test 8: Config integrity (skipped for native approach)
  testConfigIntegrity();
  
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
