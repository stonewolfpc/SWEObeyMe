#!/usr/bin/env node

/**
 * Git Configuration Validation Test
 * Comprehensively validates git repo, codebase integrity, and CI compatibility.
 * Every check MUST pass before a release is cut.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Git Configuration Validation (Comprehensive) ===\n');

const repoPath = path.join(__dirname, '..');
const gitConfigPath = path.join(repoPath, '.git', 'config');
const gitModulesPath = path.join(repoPath, '.gitmodules');

let hasErrors = false;
let warningCount = 0;

function pass(msg) { console.log(`  ✅ ${msg}`); }
function warn(msg) { console.log(`  ⚠️  WARNING: ${msg}`); warningCount++; }
function fail(msg) { console.log(`  ❌ ERROR: ${msg}`); hasErrors = true; }

function exec(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf-8', cwd: repoPath, ...opts }).trim();
}
function execSafe(cmd, opts = {}) {
  try { return exec(cmd, opts); } catch { return null; }
}

// ─── Check 1: .git/config exists ───────────────────────────────────────────
console.log('Check 1: .git/config file');
try {
  const configContent = fs.readFileSync(gitConfigPath, 'utf-8');
  pass('.git/config exists and readable');

  const problematicSettings = [
    'core.sshCommand',
    'http.https://github.com/.extraheader',
    'http.https://gitlab.com/.extraheader',
  ];
  problematicSettings.forEach((setting) => {
    if (configContent.includes(setting)) {
      fail(`Problematic CI-breaking setting found: ${setting} — remove from .git/config`);
    }
  });

  if (configContent.includes('includeIf')) {
    warn('includeIf settings present — may cause CI safe.directory issues');
  } else {
    pass('No includeIf settings');
  }
} catch (error) {
  fail(`Cannot read .git/config: ${error.message}`);
}

// ─── Check 2: .gitmodules ───────────────────────────────────────────────────
console.log('\nCheck 2: Submodule configuration');
if (fs.existsSync(gitModulesPath)) {
  try {
    const modulesContent = fs.readFileSync(gitModulesPath, 'utf-8');
    const submodules = (modulesContent.match(/\[submodule/g) || []).length;
    console.log(`  ℹ️  Found ${submodules} submodule(s)`);
    if (modulesContent.includes('core.sshCommand') || modulesContent.includes('extraheader')) {
      fail('Problematic settings in .gitmodules');
    } else {
      pass('Submodule config clean');
    }
  } catch (error) {
    fail(`Cannot read .gitmodules: ${error.message}`);
  }
} else {
  pass('No submodules (.gitmodules not present)');
}

// ─── Check 3: Git queryable ─────────────────────────────────────────────────
console.log('\nCheck 3: Git config query');
if (execSafe('git config --local --list') !== null) {
  pass('Git config is queryable');
} else {
  fail('Cannot query git config — repo may be corrupt or not initialized');
}

// ─── Check 4: Global config interference ────────────────────────────────────
console.log('\nCheck 4: Global config interference');
const globalSsh = execSafe('git config --global core.sshCommand');
if (globalSsh) { warn(`Global core.sshCommand is set: ${globalSsh}`); }
else { pass('No global core.sshCommand'); }

const globalHeader = execSafe('git config --global http.https://github.com/.extraheader');
if (globalHeader) { warn(`Global GitHub extraheader is set — may break CI push`); }
else { pass('No global GitHub extraheader'); }

// ─── Check 5: Repository state ──────────────────────────────────────────────
console.log('\nCheck 5: Repository working directory state');
try {
  const status = exec('git status --porcelain');
  const changes = status.split('\n').filter(l => l.trim());
  if (changes.length > 0) {
    warn(`${changes.length} uncommitted change(s) — commit or stash before releasing`);
  } else {
    pass('Working directory clean');
  }
} catch (error) {
  fail(`Cannot check git status: ${error.message}`);
}

// ─── Check 6: Remote origin configured ──────────────────────────────────────
console.log('\nCheck 6: Remote origin');
const remoteUrl = execSafe('git remote get-url origin');
if (remoteUrl) {
  pass(`Remote origin configured: ${remoteUrl}`);
} else {
  fail('No remote origin configured — cannot push or publish');
}

// ─── Check 7: Current branch is releasable ──────────────────────────────────
console.log('\nCheck 7: Current branch');
const branch = execSafe('git rev-parse --abbrev-ref HEAD');
if (!branch) {
  fail('Cannot determine current branch');
} else if (branch === 'HEAD') {
  fail('Detached HEAD state — not on a branch, cannot push');
} else {
  pass(`On branch: ${branch}`);
}

// ─── Check 8: No merge conflicts in tree ────────────────────────────────────
console.log('\nCheck 8: Merge conflict markers');
try {
  const conflictFiles = exec('git diff --check', { stdio: ['pipe', 'pipe', 'pipe'] });
  if (conflictFiles.trim()) {
    fail(`Conflict markers or whitespace errors found:\n     ${conflictFiles.trim().split('\n').join('\n     ')}`);
  } else {
    pass('No conflict markers or whitespace errors');
  }
} catch (e) {
  if (e.stdout && e.stdout.trim()) {
    fail(`Conflict/whitespace errors in tracked files:\n     ${e.stdout.trim().split('\n').join('\n     ')}`);
  } else {
    pass('No conflict markers detected');
  }
}

// ─── Check 9: package.json version matches CHANGELOG ────────────────────────
console.log('\nCheck 9: Version consistency');
try {
  const pkgPath = path.join(repoPath, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const version = pkg.version;
  pass(`package.json version: ${version}`);

  const readmePath = path.join(repoPath, 'README.md');
  if (fs.existsSync(readmePath)) {
    const readme = fs.readFileSync(readmePath, 'utf-8');
    if (!readme.includes(version)) {
      fail(`README.md does not reference current version ${version}`);
    } else {
      pass(`README.md references version ${version}`);
    }
  }
} catch (e) {
  fail(`Cannot validate version: ${e.message}`);
}

// ─── Check 10: Required release files exist ─────────────────────────────────
console.log('\nCheck 10: Required release files');
const requiredFiles = [
  'package.json',
  'README.md',
  'extension.js',
  'index.js',
  'icon.png',
  'LICENSE',
];
requiredFiles.forEach(f => {
  const p = path.join(repoPath, f);
  if (fs.existsSync(p)) { pass(`${f} exists`); }
  else { fail(`Required file missing: ${f}`); }
});

// ─── Check 11: No debug/forbidden patterns in source ────────────────────────
console.log('\nCheck 11: Forbidden patterns in source');
const srcDirs = ['lib', 'extension.js', 'index.js'];
const forbiddenPatterns = [
  { pattern: /debugger;/, label: 'debugger statement' },
  { pattern: /\bconsole\.log\(/, label: 'console.log (use structured logging)' },
  { pattern: /\beval\(/, label: 'eval() call' },
  { pattern: /\/\/\s*TODO[^:]/i, label: 'TODO comment without colon' },
];

function scanForForbidden(dir) {
  if (!fs.existsSync(path.join(repoPath, dir))) return;
  const result = execSafe(`git grep -rn --include="*.js" -E "${forbiddenPatterns.map(p => p.pattern.source).join('|')}" -- ${dir}`);
  if (result && result.trim()) {
    const lines = result.trim().split('\n');
    lines.forEach(line => {
      forbiddenPatterns.forEach(fp => {
        if (fp.pattern.test(line)) {
          fail(`Found ${fp.label} in: ${line.split(':').slice(0, 2).join(':')}`);
        }
      });
    });
  } else {
    pass(`No forbidden patterns in ${dir}`);
  }
}
srcDirs.forEach(scanForForbidden);

// ─── Check 12: ide_mcp_corpus exists and is non-empty ───────────────────────
console.log('\nCheck 12: Documentation corpus present');
const corpusPath = path.join(repoPath, 'ide_mcp_corpus');
if (!fs.existsSync(corpusPath)) {
  fail('ide_mcp_corpus directory is MISSING — corpus will not be available in builds');
} else {
  const corpusEntries = fs.readdirSync(corpusPath);
  if (corpusEntries.length === 0) {
    fail('ide_mcp_corpus directory is empty — documentation not bundled');
  } else {
    pass(`ide_mcp_corpus present with ${corpusEntries.length} top-level entries`);
  }
}

// ─── Check 13: Platform-specific command validation ─────────────────────────
console.log('\nCheck 13: Platform-specific command validation');
const platform = process.platform;
const windsurfTestPath = path.join(__dirname, 'windsurf-runtime-behavior.js');
try {
  const windsurfTest = fs.readFileSync(windsurfTestPath, 'utf-8');
  if (platform !== 'win32' && windsurfTest.includes("execSync('where")) {
    fail('windsurf-runtime-behavior.js uses Windows-only "where" on Unix — will break CI');
  } else if (platform === 'win32' && windsurfTest.includes("execSync('which")) {
    fail('windsurf-runtime-behavior.js uses Unix-only "which" on Windows — will break CI');
  } else {
    pass(`Platform commands correct for ${platform}`);
  }
} catch (error) {
  warn(`Could not validate windsurf-runtime-behavior.js: ${error.message}`);
}

// ─── Check 14: No files exceeding 700-line surgical limit ───────────────────
console.log('\nCheck 14: File size compliance (700-line surgical limit)');
try {
  const jsFiles = exec('git ls-files -- "*.js" ":!:tests/*" ":!:node_modules/*"').split('\n').filter(Boolean);
  let oversizeCount = 0;
  jsFiles.forEach(relPath => {
    const absPath = path.join(repoPath, relPath);
    if (!fs.existsSync(absPath)) return;
    const lineCount = fs.readFileSync(absPath, 'utf-8').split('\n').length;
    if (lineCount > 700) {
      warn(`${relPath} has ${lineCount} lines (exceeds 700-line limit)`);
      oversizeCount++;
    }
  });
  if (oversizeCount === 0) { pass('All source files within 700-line limit'); }
} catch (e) {
  warn(`Could not check file sizes: ${e.message}`);
}

// ─── Check 15: Last commit has a message ────────────────────────────────────
console.log('\nCheck 15: Last commit message');
const lastCommit = execSafe('git log -1 --pretty=format:"%s"');
if (!lastCommit || lastCommit.trim().length < 3) {
  fail('Last commit has an empty or trivial message');
} else {
  pass(`Last commit: "${lastCommit.trim()}"`);
}

// ─── Summary ────────────────────────────────────────────────────────────────
console.log('\n=== Test Complete ===');
if (warningCount > 0) console.log(`${warningCount} warning(s) — review before shipping.`);

if (hasErrors) {
  console.log('\n❌ FAILED — Fix all errors above before committing/pushing/publishing.');
  process.exit(1);
} else {
  console.log('\n✅ PASSED — Git configuration and codebase are CI-compatible and release-ready.');
  process.exit(0);
}
