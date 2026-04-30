#!/usr/bin/env node

/**
 * UI Regression Tests
 * Validates all webview HTML generators to catch regressions before release.
 * Tests: [object Object] absence, tab layout integrity, nonce injection,
 * DOMContentLoaded guards, CSP compliance, and config message protocol.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoPath = path.join(__dirname, '..');

const results = { total: 0, passed: 0, failed: 0, errors: [] };

function assert(condition, testName, details = '') {
  results.total++;
  if (condition) {
    results.passed++;
    process.stdout.write(`  \u2713 ${testName}\n`);
    return true;
  } else {
    results.failed++;
    process.stdout.write(`  \u2717 FAIL: ${testName}${details ? ' \u2014 ' + details : ''}\n`);
    results.errors.push({ test: testName, details });
    return false;
  }
}

function readFile(relPath) {
  const absPath = path.join(repoPath, relPath);
  if (!fs.existsSync(absPath)) return null;
  return fs.readFileSync(absPath, 'utf-8');
}

// ─── Suite 1: Template file integrity ──────────────────────────────────────
console.log('\n=== Suite 1: Template File Integrity ===');

const templatePath = 'lib/csharp-settings-template.html';
const template = readFile(templatePath);
assert(template !== null, 'csharp-settings-template.html exists');

if (template) {
  // No [object Object] in static HTML
  assert(!template.includes('[object Object]'), 'Template contains no [object Object]');

  // Has correct flex layout (not height:100vh + overflow:hidden together)
  const hasOverflowHidden = /body\s*\{[^}]*overflow\s*:\s*hidden/s.test(template);
  assert(!hasOverflowHidden, 'body does not use overflow:hidden (causes tab collapse in sidebar)');

  // Has .container with flex
  assert(template.includes('.container'), 'Template has .container class');
  assert(/\.container\s*\{[^}]*display\s*:\s*flex/s.test(template), '.container uses flex layout');

  // Tabs are defined
  assert(template.includes('.tabs'), 'Template has .tabs class');
  assert(template.includes('.tab-panel'), 'Template has .tab-panel class');
  assert(template.includes('.tab-panel.active'), '.tab-panel.active visibility defined');

  // tab-panel default is display:none
  assert(
    /\.tab-panel\s*\{[^}]*display\s*:\s*none/s.test(template),
    '.tab-panel default is display:none'
  );

  // Script is wrapped in DOMContentLoaded
  assert(
    template.includes("document.addEventListener('DOMContentLoaded'") ||
      template.includes('document.addEventListener("DOMContentLoaded"'),
    'Script wrapped in DOMContentLoaded guard'
  );

  // Single script tag close
  const scriptCloseCount = (template.match(/<\/script>/g) || []).length;
  const scriptOpenCount = (template.match(/<script[^>]*>/g) || []).length;
  assert(
    scriptOpenCount === scriptCloseCount,
    `Script tags balanced (${scriptOpenCount} open, ${scriptCloseCount} close)`
  );

  // backupPath and stats are wrapped in String() to prevent [object Object]
  const backupPathAssign = template.match(/getElementById\('backupPath'\)\.textContent\s*=\s*(.+)/);
  const backupWrapped = !backupPathAssign || backupPathAssign[1].includes('String(');
  assert(backupWrapped, 'backupPath textContent wrapped in String() to prevent [object Object]');

  // vscode.postMessage for getConfig is present
  assert(
    template.includes("command: 'getConfig'") || template.includes('command:"getConfig"'),
    'Template sends getConfig on load'
  );

  // Tab switching logic present
  assert(
    template.includes('dataset.tab') || template.includes('data-tab'),
    'Tab switching uses data-tab attribute'
  );
}

// ─── Suite 2: Webview Provider Factory ─────────────────────────────────────
console.log('\n=== Suite 2: Webview Provider Factory ===');

const factoryPath = 'lib/ui/providers/webview-provider-factory.js';
const factory = readFile(factoryPath);
assert(factory !== null, 'webview-provider-factory.js exists');

if (factory) {
  // Must await async html generators
  assert(
    factory.includes('instanceof Promise ? await htmlResult : htmlResult') ||
      factory.includes('await htmlResult'),
    'Factory awaits async html generators (prevents Promise [object Object])'
  );

  // Must handle getConfig command
  assert(
    factory.includes("message.command === 'getConfig'") || factory.includes("'getConfig'"),
    'Factory handles getConfig message'
  );

  // Must handle updateConfig
  assert(
    factory.includes("'updateConfig'") || factory.includes('"updateConfig"'),
    'Factory handles updateConfig message'
  );

  // Must handle openSettings
  assert(
    factory.includes("'openSettings'") || factory.includes('"openSettings"'),
    'Factory handles openSettings message'
  );

  // postMessage with config shape
  assert(
    factory.includes('csharpBridge') && factory.includes('initialization'),
    'Factory sends correct config shape with csharpBridge and initialization'
  );
}

// ─── Suite 3: C# Bridge HTML Generator ─────────────────────────────────────
console.log('\n=== Suite 3: C# Bridge HTML Generator ===');

const bridgePath = 'lib/ui/generators/csharp-bridge-html.js';
const bridge = readFile(bridgePath);
assert(bridge !== null, 'csharp-bridge-html.js exists');

if (bridge) {
  // Uses fileURLToPath for Windows compatibility
  assert(bridge.includes('fileURLToPath'), 'Uses fileURLToPath for Windows path compatibility');

  // Is async (reads template file)
  assert(
    bridge.includes('async function') || bridge.includes('export async'),
    'getCSharpBridgeHtml is async'
  );

  // Has fallback
  assert(bridge.includes('getFallbackHtml'), 'Has fallback HTML on template read failure');

  // Fallback doesn't render objects
  assert(
    !bridge.includes('${detectors}') && !bridge.includes('${cfg}'),
    'Fallback does not render objects directly'
  );
}

// ─── Suite 4: Settings HTML Generator ──────────────────────────────────────
console.log('\n=== Suite 4: Settings HTML Generator ===');

const settingsPath = 'lib/ui/generators/settings-html.js';
const settings = readFile(settingsPath);
assert(settings !== null, 'settings-html.js exists');

if (settings) {
  assert(!settings.includes('[object Object]'), 'Settings HTML has no [object Object]');
  assert(
    settings.includes("document.addEventListener('DOMContentLoaded'") ||
      settings.includes('DOMContentLoaded'),
    'Settings script uses DOMContentLoaded'
  );
  assert(settings.includes('acquireVsCodeApi'), 'Settings HTML acquires VS Code API');
}

// ─── Suite 5: Admin Dashboard HTML Generator ───────────────────────────────
console.log('\n=== Suite 5: Admin Dashboard HTML Generator ===');

const adminPath = 'lib/ui/generators/admin-dashboard-html.js';
const admin = readFile(adminPath);
assert(admin !== null, 'admin-dashboard-html.js exists');

if (admin) {
  assert(!admin.includes('[object Object]'), 'Admin dashboard has no [object Object]');
  assert(
    admin.includes("document.addEventListener('DOMContentLoaded'") ||
      admin.includes('DOMContentLoaded'),
    'Admin script uses DOMContentLoaded'
  );
  assert(admin.includes('acquireVsCodeApi'), 'Admin HTML acquires VS Code API');
  assert(
    !admin.includes('openCSharpSettings') && !admin.includes('csharpSettings'),
    'Admin panel does not contain C# settings button (wrong panel)'
  );
}

// ─── Suite 6: CSharpSettingsProvider nonce injection ───────────────────────
console.log('\n=== Suite 6: CSharpSettingsProvider Nonce Injection ===');

const providerPath = 'lib/csharp-settings-provider.js';
const provider = readFile(providerPath);
assert(provider !== null, 'csharp-settings-provider.js exists');

if (provider) {
  // Must inject nonce on ALL script tags (via regex), not just first
  assert(
    provider.includes('/<script>/g') || provider.includes('replace(/<script>/g'),
    'Nonce injected into ALL script tags (not just first)'
  );

  assert(provider.includes('getNonce'), 'Provider generates nonce per session');

  assert(
    provider.includes('script-src') && provider.includes('nonce-'),
    'CSP header includes nonce-based script-src'
  );
}

// ─── Suite 7: project-awareness.js fs.existsSync fix ───────────────────────
console.log('\n=== Suite 7: project-awareness.js Sync FS Fix ===');

const awarenessPath = 'lib/project-awareness.js';
const awareness = readFile(awarenessPath);
assert(awareness !== null, 'project-awareness.js exists');

if (awareness) {
  // Must import fssync
  assert(
    awareness.includes("import fssync from 'fs'") || awareness.includes('import fssync from "fs"'),
    'Imports synchronous fs as fssync'
  );

  // ensureRegistryExists uses async fs methods (changed to async in v5.x)
  assert(
    awareness.includes('fssync.existsSync'),
    'ensureRegistryExists uses fssync.existsSync for checking'
  );
  assert(
    awareness.includes('fs.mkdir'),
    'ensureRegistryExists uses fs.mkdir (async) for creating directories'
  );
  assert(
    awareness.includes('fs.writeFile'),
    'ensureRegistryExists uses fs.writeFile (async) for writing files'
  );

  // fs/promises import still present for async ops
  assert(
    awareness.includes("import fs from 'fs/promises'") || awareness.includes("from 'fs/promises'"),
    'Async fs/promises still imported for async operations'
  );
}

// ─── Suite 8: esbuild corpus bundling ──────────────────────────────────────
console.log('\n=== Suite 8: Build Config Corpus Bundling ===');

const ebuildPath = 'esbuild.config.js';
const ebuild = readFile(ebuildPath);
assert(ebuild !== null, 'esbuild.config.js exists');

if (ebuild) {
  assert(ebuild.includes('copyCorpusFolder'), 'copyCorpusFolder function defined');
  assert(ebuild.includes('ide_mcp_corpus'), 'ide_mcp_corpus path referenced in build config');

  // Called in all build modes
  const publicCall = ebuild.indexOf('copyCorpusFolder', ebuild.indexOf('buildPublic'));
  const enterpriseCall = ebuild.indexOf('copyCorpusFolder', ebuild.indexOf('buildEnterprise'));
  const devCall = ebuild.indexOf('copyCorpusFolder', ebuild.indexOf('buildDev'));
  assert(publicCall > -1, 'copyCorpusFolder called in buildPublic');
  assert(enterpriseCall > -1, 'copyCorpusFolder called in buildEnterprise');
  assert(devCall > -1, 'copyCorpusFolder called in buildDev');
}

// ─── Suite 9: Corpus directory present ─────────────────────────────────────
console.log('\n=== Suite 9: Documentation Corpus Presence ===');

const corpusDir = path.join(repoPath, 'ide_mcp_corpus');
assert(fs.existsSync(corpusDir), 'ide_mcp_corpus directory exists');
if (fs.existsSync(corpusDir)) {
  const entries = fs.readdirSync(corpusDir);
  assert(entries.length > 0, `ide_mcp_corpus is non-empty (${entries.length} entries)`);

  const indexFile = path.join(corpusDir, 'index.json');
  assert(fs.existsSync(indexFile), 'ide_mcp_corpus/index.json exists');
}

// ─── Summary ─────────────────────────────────────────────────────────────
console.log('\n\u2554' + '\u2550'.repeat(60) + '\u2557');
console.log('\u2551  UI REGRESSION TEST RESULTS                              \u2551');
console.log('\u255a' + '\u2550'.repeat(60) + '\u255d');
console.log(`  Total:   ${results.total}`);
console.log(`  Passed:  ${results.passed} \u2713`);
console.log(`  Failed:  ${results.failed} \u2717`);
const rate = ((results.passed / results.total) * 100).toFixed(1);
console.log(`  Rate:    ${rate}%`);

if (results.failed > 0) {
  console.log('\nFailed tests:');
  results.errors.forEach((e) =>
    console.log(`  \u2717 ${e.test}${e.details ? ' \u2014 ' + e.details : ''}`)
  );
  console.log('\n\u2717 UI REGRESSION TESTS FAILED \u2014 Fix all issues before shipping.');
  process.exit(1);
} else {
  console.log('\n\u2713 ALL UI REGRESSION TESTS PASSED \u2014 UI is safe to ship.');
  process.exit(0);
}
