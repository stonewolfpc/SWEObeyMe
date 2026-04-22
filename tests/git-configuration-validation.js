#!/usr/bin/env node

/**
 * Git Configuration Validation Test
 * Ensures git repository configuration is clean and CI-compatible
 * This catches configuration issues that cause CI failures
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Git Configuration Validation ===\n');

const repoPath = path.join(__dirname, '..');
const gitConfigPath = path.join(repoPath, '.git', 'config');
const gitModulesPath = path.join(repoPath, '.gitmodules');

let hasErrors = false;

// Check 1: Verify .git/config exists and is readable
console.log('Check 1: .git/config file');
try {
  const configContent = fs.readFileSync(gitConfigPath, 'utf-8');
  console.log('  ✅ .git/config exists and readable');
  
  // Check for problematic settings
  const problematicSettings = [
    'core.sshCommand',
    'http.https://github.com/.extraheader',
  ];
  
  problematicSettings.forEach(setting => {
    if (configContent.includes(setting)) {
      console.log(`  ❌ ERROR: Problematic setting found: ${setting}`);
      console.log(`     This can cause CI failures. Remove from .git/config.`);
      hasErrors = true;
    }
  });
  
  if (!hasErrors) {
    console.log('  ✅ No problematic git config settings');
  }
} catch (error) {
  console.log(`  ❌ ERROR: Cannot read .git/config: ${error.message}`);
  hasErrors = true;
}

// Check 2: Check for includeIf.gitdir settings
console.log('\nCheck 2: includeIf.gitdir settings');
try {
  const configContent = fs.readFileSync(gitConfigPath, 'utf-8');
  if (configContent.includes('includeIf')) {
    console.log('  ⚠️  WARNING: includeIf settings present in .git/config');
    console.log('     These may cause CI issues with safe.directory');
  } else {
    console.log('  ✅ No includeIf settings');
  }
} catch (error) {
  // Ignore if config doesn't exist
}

// Check 3: Check for .gitmodules
console.log('\nCheck 3: Submodule configuration');
if (fs.existsSync(gitModulesPath)) {
  console.log('  ℹ️  .gitmodules exists - checking submodule config');
  try {
    const modulesContent = fs.readFileSync(gitModulesPath, 'utf-8');
    const submodules = (modulesContent.match(/\[submodule/g) || []).length;
    console.log(`  ℹ️  Found ${submodules} submodule(s)`);
    
    // Check for problematic submodule settings
    if (modulesContent.includes('core.sshCommand') || modulesContent.includes('extraheader')) {
      console.log('  ❌ ERROR: Problematic settings in .gitmodules');
      hasErrors = true;
    } else {
      console.log('  ✅ Submodule config looks clean');
    }
  } catch (error) {
    console.log(`  ❌ ERROR: Cannot read .gitmodules: ${error.message}`);
    hasErrors = true;
  }
} else {
  console.log('  ✅ No submodules (.gitmodules not present)');
}

// Check 4: Verify git config can be queried
console.log('\nCheck 4: Git config query');
try {
  execSync('git config --local --list', { encoding: 'utf-8', cwd: repoPath });
  console.log('  ✅ Git config is queryable');
} catch (error) {
  console.log(`  ❌ ERROR: Cannot query git config: ${error.message}`);
  hasErrors = true;
}

// Check 5: Verify no global config interference
console.log('\nCheck 5: Global config interference');
try {
  const globalSshCommand = execSync('git config --global core.sshCommand', { encoding: 'utf-8' }).trim();
  if (globalSshCommand) {
    console.log('  ⚠️  WARNING: Global core.sshCommand is set');
    console.log(`     Value: ${globalSshCommand}`);
    console.log('     This may interfere with CI operations');
  }
} catch (error) {
  // Not set is fine
  console.log('  ✅ No global core.sshCommand');
}

try {
  const globalExtraheader = execSync('git config --global http.https://github.com/.extraheader', { encoding: 'utf-8' }).trim();
  if (globalExtraheader) {
    console.log('  ⚠️  WARNING: Global http.https://github.com/.extraheader is set');
    console.log(`     Value: ${globalExtraheader}`);
    console.log('     This may interfere with CI operations');
  }
} catch (error) {
  // Not set is fine
  console.log('  ✅ No global http.https://github.com/.extraheader');
}

// Check 6: Verify repository is not in a weird state
console.log('\nCheck 6: Repository state');
try {
  const status = execSync('git status --porcelain', { encoding: 'utf-8', cwd: repoPath });
  const changes = status.trim().split('\n').filter(line => line.trim());
  if (changes.length > 0) {
    console.log(`  ⚠️  WARNING: ${changes.length} uncommitted changes`);
  } else {
    console.log('  ✅ Working directory clean');
  }
} catch (error) {
  console.log(`  ❌ ERROR: Cannot check git status: ${error.message}`);
  hasErrors = true;
}

// Check 7: Verify platform-specific commands in tests
console.log('\nCheck 7: Platform-specific command validation');
const platform = process.platform;
const windsurfTestPath = path.join(__dirname, 'windsurf-runtime-behavior.js');
let platformCheckPassed = true;

try {
  const windsurfTest = fs.readFileSync(windsurfTestPath, 'utf-8');
  
  // On Unix (Linux/macOS), should use 'which', not 'where'
  if (platform !== 'win32') {
    if (windsurfTest.includes("execSync('where")) {
      console.log('  ❌ ERROR: windsurf-runtime-behavior.js uses Windows-only "where" command on Unix');
      console.log('     This will cause CI failures on Linux/macOS runners');
      hasErrors = true;
      platformCheckPassed = false;
    }
  }
  
  // On Windows, should use 'where', not 'which'
  if (platform === 'win32') {
    if (windsurfTest.includes("execSync('which")) {
      console.log('  ❌ ERROR: windsurf-runtime-behavior.js uses Unix-only "which" command on Windows');
      console.log('     This will cause CI failures on Windows runners');
      hasErrors = true;
      platformCheckPassed = false;
    }
  }
  
  if (platformCheckPassed) {
    console.log(`  ✅ Platform-specific commands correct for ${platform}`);
  }
} catch (error) {
  console.log(`  ⚠️  WARNING: Could not validate windsurf-runtime-behavior.js: ${error.message}`);
}

console.log('\n=== Test Complete ===');

if (hasErrors) {
  console.log('\n❌ FAILED - Git configuration has errors that may cause CI failures');
  console.log('Fix the issues above before committing/pushing.');
  process.exit(1);
} else {
  console.log('\n✅ PASSED - Git configuration is clean and CI-compatible');
  process.exit(0);
}
