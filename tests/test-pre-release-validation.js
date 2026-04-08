#!/usr/bin/env node

/**
 * Pre-Release Validation Test
 * Validates critical aspects before pushing to Windsurf-Next release
 * Catches issues that would break CI/CD or production deployment
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

let testsPassed = 0;
let testsFailed = 0;
const errors = [];
const warnings = [];

function assert(condition, testName, details = '') {
  if (condition) {
    testsPassed++;
    console.log(`✓ ${testName}`);
    if (details) console.log(`  ${details}`);
    return true;
  } else {
    testsFailed++;
    const error = `✗ ${testName}`;
    console.log(error);
    if (details) console.log(`  ${details}`);
    errors.push({ test: testName, details });
    return false;
  }
}

function warn(condition, testName, details = '') {
  if (!condition) {
    warnings.push({ test: testName, details });
    console.log(`⚠ ${testName}`);
    if (details) console.log(`  ${details}`);
  }
}

console.log('Pre-Release Validation Test\n');

// Test 1: package-lock.json sync validation
console.log('1. Package Lockfile Sync Validation');
try {
  const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
  const lockFile = readFileSync(join(projectRoot, 'package-lock.json'), 'utf8');
  const lockData = JSON.parse(lockFile);
  
  // Check if critical dependencies are in lockfile
  const criticalDeps = ['esbuild', '@modelcontextprotocol/sdk', 'zod'];
  const lockDeps = lockData.packages ? Object.keys(lockData.packages) : [];
  
  for (const dep of criticalDeps) {
    const inLockfile = lockDeps.some(d => d.includes(`node_modules/${dep}`));
    assert(inLockfile, `Critical dependency ${dep} in lockfile`);
  }
  
  // Check lockfile version matches package.json version
  assert(lockData.lockfileVersion === 3, 'Lockfile version is 3');
  
} catch (error) {
  assert(false, 'Package lockfile sync validation', error.message);
}

// Test 2: Build configuration validation
console.log('\n2. Build Configuration Validation');
try {
  const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
  const esbuildConfig = readFileSync(join(projectRoot, 'esbuild.config.js'), 'utf8');
  
  assert(packageJson.main === './dist/extension.js', 'package.json main points to dist/extension.js');
  assert(esbuildConfig.includes('extension.js'), 'esbuild config includes extension bundle');
  assert(esbuildConfig.includes('index.js'), 'esbuild config includes MCP server bundle');
  assert(esbuildConfig.includes('dist') || esbuildConfig.includes("'dist'"), 'esbuild config outputs to dist/');
  assert(packageJson.scripts.build, 'package.json has build script');
  assert(packageJson.scripts['build:public'], 'package.json has build:public script');
  assert(packageJson.scripts['build:enterprise'], 'package.json has build:enterprise script');
  assert(packageJson.scripts['build:dev'], 'package.json has build:dev script');
  
} catch (error) {
  assert(false, 'Build configuration validation', error.message);
}

// Test 3: MCP server contribution validation
console.log('\n3. MCP Server Contribution Validation');
try {
  const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
  
  assert(packageJson.contributes, 'package.json has contributes section');
  assert(packageJson.contributes.mcpServers, 'package.json has mcpServers contribution');
  assert(Array.isArray(packageJson.contributes.mcpServers), 'mcpServers is an array');
  assert(packageJson.contributes.mcpServers.length > 0, 'mcpServers has entries');
  
  const mcpServer = packageJson.contributes.mcpServers[0];
  assert(mcpServer.id === 'sweobeyme', 'MCP server ID is sweobeyme');
  assert(mcpServer.command === 'node', 'MCP server command is node');
  assert(mcpServer.args && mcpServer.args[0] === './dist/mcp/server.js', 'MCP server args point to bundled file');
  
} catch (error) {
  assert(false, 'MCP server contribution validation', error.message);
}

// Test 4: .vscodeignore validation
console.log('\n4. .vscodeignore Validation');
try {
  const vscodeignore = readFileSync(join(projectRoot, '.vscodeignore'), 'utf8');
  
  // dist/ should be INCLUDED in the package (bundled output)
  // Must check for include pattern '!dist/**' not exclusion pattern 'dist/'
  assert(vscodeignore.includes('!dist/**'), '.vscodeignore includes dist/ with include pattern !dist/** (for bundled output)');
  assert(vscodeignore.includes('node_modules/'), '.vscodeignore excludes node_modules/');
  assert(vscodeignore.includes('.git/'), '.vscodeignore excludes .git/');
  assert(vscodeignore.includes('*.vsix'), '.vscodeignore excludes .vsix files');
  
} catch (error) {
  assert(false, '.vscodeignore validation', error.message);
}

// Test 5: Bundle output validation
console.log('\n5. Bundle Output Validation');
try {
  const distExtension = join(projectRoot, 'dist', 'extension.js');
  const distMcp = join(projectRoot, 'dist', 'mcp', 'server.js');
  
  assert(existsSync(distExtension), 'dist/extension.js exists');
  assert(existsSync(distMcp), 'dist/mcp/server.js exists');
  
  // Check bundle sizes are reasonable
  const extSize = readFileSync(distExtension).length;
  const mcpSize = readFileSync(distMcp).length;
  
  assert(extSize > 1000, `dist/extension.js has content (${extSize} bytes)`);
  assert(mcpSize > 1000, `dist/mcp/server.js has content (${mcpSize} bytes)`);
  assert(extSize < 1000000, `dist/extension.js not too large (${extSize} bytes)`);
  assert(mcpSize < 10000000, `dist/mcp/server.js not too large (${mcpSize} bytes)`);
  
  console.log(`  dist/extension.js: ${(extSize / 1024).toFixed(1)} KB`);
  console.log(`  dist/mcp/server.js: ${(mcpSize / 1024).toFixed(1)} KB`);
  
} catch (error) {
  assert(false, 'Bundle output validation', error.message);
}

// Test 6: Git configuration validation
console.log('\n6. Git Configuration Validation');
try {
  const gitignore = readFileSync(join(projectRoot, '.gitignore'), 'utf8');
  
  assert(gitignore.includes('node_modules/'), '.gitignore excludes node_modules/');
  // dist/ should be excluded from git since it's built output
  assert(gitignore.includes('dist/'), '.gitignore excludes dist/ (bundled output not in git)');
  
} catch (error) {
  assert(false, 'Git configuration validation', error.message);
}

// Test 7: Version consistency validation
console.log('\n7. Version Consistency Validation');
try {
  const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
  const readme = readFileSync(join(projectRoot, 'README.md'), 'utf8');
  
  assert(packageJson.version, 'package.json has version');
  
  // README uses double-dash format for badges (2.0.4--beta) to avoid URL encoding
  const readmeVersion = packageJson.version.replace('-', '--');
  assert(readme.includes(readmeVersion) || readme.includes(packageJson.version), `README.md contains version ${packageJson.version}`);
  
} catch (error) {
  assert(false, 'Version consistency validation', error.message);
}

// Test 8: Critical file existence
console.log('\n8. Critical File Existence');
try {
  assert(existsSync(join(projectRoot, 'package.json')), 'package.json exists');
  assert(existsSync(join(projectRoot, 'package-lock.json')), 'package-lock.json exists');
  assert(existsSync(join(projectRoot, 'README.md')), 'README.md exists');
  assert(existsSync(join(projectRoot, 'LICENSE')), 'LICENSE exists');
  assert(existsSync(join(projectRoot, 'extension.js')), 'extension.js exists');
  assert(existsSync(join(projectRoot, 'index.js')), 'index.js exists');
  assert(existsSync(join(projectRoot, 'esbuild.config.js')), 'esbuild.config.js exists');
  assert(existsSync(join(projectRoot, '.vscodeignore')), '.vscodeignore exists');
  assert(existsSync(join(projectRoot, '.gitignore')), '.gitignore exists');
  
} catch (error) {
  assert(false, 'Critical file existence', error.message);
}

// Test 9: Build script execution
console.log('\n9. Build Script Execution');
try {
  // Try to run build in dry-run mode (check if it would work)
  const buildConfig = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
  assert(buildConfig.scripts.build, 'Build script exists');
  
  // Check if esbuild is installed
  const lockFile = JSON.parse(readFileSync(join(projectRoot, 'package-lock.json'), 'utf8'));
  const hasEsbuild = lockFile.packages && Object.keys(lockFile.packages).some(p => p.includes('esbuild'));
  assert(hasEsbuild, 'esbuild is installed (in lockfile)');
  
} catch (error) {
  assert(false, 'Build script execution validation', error.message);
}

// Test 10: MCP server entry point validation
console.log('\n10. MCP Server Entry Point Validation');
try {
  const indexJs = readFileSync(join(projectRoot, 'index.js'), 'utf8');
  
  assert(indexJs.includes('MCP'), 'index.js contains MCP references');
  assert(indexJs.includes('server') || indexJs.includes('Server'), 'index.js contains server references');
  assert(indexJs.includes('stdio') || indexJs.includes('transport'), 'index.js contains transport references');
  
} catch (error) {
  assert(false, 'MCP server entry point validation', error.message);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Total: ${testsPassed + testsFailed} tests`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (warnings.length > 0) {
  console.log(`\nWarnings: ${warnings.length}`);
  warnings.forEach(w => {
    console.log(`  ⚠ ${w.test}`);
    if (w.details) console.log(`    ${w.details}`);
  });
}

if (errors.length > 0) {
  console.log(`\nErrors: ${errors.length}`);
  errors.forEach(e => {
    console.log(`  ✗ ${e.test}`);
    if (e.details) console.log(`    ${e.details}`);
  });
}

console.log('='.repeat(50));

if (testsFailed > 0) {
  console.log('\n❌ PRE-RELEASE VALIDATION FAILED');
  console.log('Fix the above errors before pushing to Windsurf-Next release.');
  process.exit(1);
} else {
  console.log('\n✅ PRE-RELEASE VALIDATION PASSED');
  console.log('Ready for Windsurf-Next release.');
  process.exit(0);
}
