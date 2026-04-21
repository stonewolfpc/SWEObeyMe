#!/usr/bin/env node

/**
 * Git Configuration Validation Test
 * Ensures git repository configuration is clean and CI-compatible
 * This catches configuration issues that cause CI failures
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('=== Git Configuration Validation ===\n');

const repoPath = process.cwd();
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

console.log('\n=== Test Complete ===');

if (hasErrors) {
  console.log('\n❌ FAILED - Git configuration has errors that may cause CI failures');
  console.log('Fix the issues above before committing/pushing.');
  process.exit(1);
} else {
  console.log('\n✅ PASSED - Git configuration is clean and CI-compatible');
  process.exit(0);
}
