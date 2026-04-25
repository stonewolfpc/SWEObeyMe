/**
 * SWEObeyMe Diagnostic Audit
 *
 * Tests all subsystems for silent failures:
 * - Docs/corpus search (format mismatch)
 * - Webview provider IDs (grey box bug)
 * - Language bridge registration (C#/C++ Monaco)
 * - Command registration
 * - MCP tool handler wiring
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

let passed = 0;
let failed = 0;
const failures = [];

function pass(name) {
  console.log(`  ✅ ${name}`);
  passed++;
}

function fail(name, detail) {
  console.log(`  ❌ ${name}`);
  if (detail) console.log(`     → ${detail}`);
  failed++;
  failures.push({ name, detail });
}

function section(title) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(60));
}

// ─────────────────────────────────────────────────────────────
section('1. PACKAGE.JSON INTEGRITY');
// ─────────────────────────────────────────────────────────────

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const declaredViews = pkg.contributes?.views?.sweObeyMe?.map((v) => v.id) || [];
const declaredCommands = pkg.contributes?.commands?.map((c) => c.command) || [];

console.log(`  Declared views: ${declaredViews.join(', ')}`);
console.log(`  Declared commands: ${declaredCommands.length}`);

if (declaredViews.length > 0) pass('Views declared in package.json');
else fail('No views declared in package.json');

if (declaredCommands.length > 0) pass(`${declaredCommands.length} commands declared`);
else fail('No commands declared');

// ─────────────────────────────────────────────────────────────
section('2. EXTENSION.JS — VIEW ID & COMMAND WIRING');
// ─────────────────────────────────────────────────────────────

const extensionSrc = fs.readFileSync(path.join(root, 'extension.js'), 'utf8');

for (const viewId of declaredViews) {
  if (extensionSrc.includes(`'${viewId}'`) || extensionSrc.includes(`"${viewId}"`)) {
    pass(`View provider registered: ${viewId}`);
  } else {
    fail(`View provider NOT registered: ${viewId}`, 'Grey box bug - provider ID mismatch');
  }
}

for (const cmd of declaredCommands) {
  if (extensionSrc.includes(`'${cmd}'`) || extensionSrc.includes(`"${cmd}"`)) {
    pass(`Command registered: ${cmd}`);
  } else {
    fail(`Command NOT registered: ${cmd}`, 'Button will silently do nothing');
  }
}

// Check language bridge is wired
if (extensionSrc.includes('setupLanguageBridges')) {
  pass('Language bridges wired in activate()');
} else {
  fail(
    'setupLanguageBridges NOT called in activate()',
    'C# and C++ Monaco diagnostics will never fire'
  );
}

// Check CheckpointManager receives context
if (
  extensionSrc.includes('loadCheckpointManager(context)') ||
  extensionSrc.includes('new CheckpointManager(context)')
) {
  pass('CheckpointManager receives context');
} else {
  fail('CheckpointManager instantiated without context', 'Will crash on globalStorageUri');
}

// ─────────────────────────────────────────────────────────────
section('3. DOCS / CORPUS SEARCH');
// ─────────────────────────────────────────────────────────────

const { docs_lookup_handler, docs_list_corpora_handler, docs_list_categories_handler } =
  await import(
    `file:///${path.join(root, 'lib', 'tools', 'docs-handlers.js').replace(/\\/g, '/')}`
  );

// Test unified corpus returns MCP format (the fixed bug)
try {
  const r = await docs_lookup_handler({ query: 'MCP server', corpus: 'unified' });
  if (r?.content?.[0]?.text) {
    if (r.content[0].text.includes('No results') || r.content[0].text.includes('[')) {
      pass('Unified corpus returns MCP content format');
    } else {
      fail('Unified corpus returned unexpected text', r.content[0].text.slice(0, 80));
    }
  } else {
    fail('Unified corpus returned non-MCP format', JSON.stringify(r).slice(0, 80));
  }
} catch (e) {
  fail('Unified corpus handler threw', e.message);
}

// Test all-corpora search returns results
try {
  const r = await docs_lookup_handler({ query: 'C# error detection' });
  if (r?.content?.[0]?.text && r.content[0].text.length > 100) {
    pass('All-corpora search returns content');
  } else {
    fail('All-corpora search returned empty or no content');
  }
} catch (e) {
  fail('All-corpora search threw', e.message);
}

// Test list_corpora
try {
  const r = await docs_list_corpora_handler();
  if (r?.content?.[0]?.text?.includes('unified')) {
    pass('docs_list_corpora returns corpora list');
  } else {
    fail('docs_list_corpora missing unified corpus');
  }
} catch (e) {
  fail('docs_list_corpora threw', e.message);
}

// Test each corpus individually
const testCorpora = ['unified', 'math', 'fdq', 'training', 'godot', 'llama'];
for (const corpus of testCorpora) {
  try {
    const r = await docs_lookup_handler({ query: 'test', corpus });
    if (r?.content?.[0]?.text !== undefined) {
      pass(`Corpus "${corpus}" returns MCP format`);
    } else {
      fail(`Corpus "${corpus}" returns non-MCP format`, JSON.stringify(r).slice(0, 60));
    }
  } catch (e) {
    fail(`Corpus "${corpus}" handler threw`, e.message);
  }
}

// ─────────────────────────────────────────────────────────────
section('4. MCP TOOL HANDLER WIRING');
// ─────────────────────────────────────────────────────────────

const { toolHandlers } = await import(
  `file:///${path.join(root, 'lib', 'tools', 'handlers.js').replace(/\\/g, '/')}`
);

const criticalTools = [
  'docs_lookup',
  'docs_list_corpora',
  'docs_list_categories',
  'docs_verify',
  'write_file',
  'read_file',
  'get_file_context',
  'analyze_change_impact',
  'get_csharp_errors',
  'get_csharp_errors_for_file',
  'detect_godot_project',
  'godot_lookup',
  'index_project_structure',
  'find_code_files',
];

for (const tool of criticalTools) {
  if (typeof toolHandlers[tool] === 'function') {
    pass(`Tool handler: ${tool}`);
  } else {
    fail(`Missing tool handler: ${tool}`, 'Will return SCRIPT_MISSING or silent error in MCP');
  }
}

// Check total tool count
const toolCount = Object.keys(toolHandlers).length;
if (toolCount < 80) {
  fail(`Low tool count: ${toolCount}`, 'Expected 90+');
} else {
  pass(`Total tool handlers: ${toolCount}`);
}

// ─────────────────────────────────────────────────────────────
section('5. CORPUS FILE INTEGRITY');
// ─────────────────────────────────────────────────────────────

const corpora = [
  'csharp_dotnet_corpus',
  'cpp_corpus',
  'git_corpus',
  'typescript_javascript_corpus',
  'vscode_extension_corpus',
  'mcp_implementation_corpus',
  'nodejs_runtime_corpus',
  'testing_qa_corpus',
  'build_deployment_corpus',
];

for (const corpus of corpora) {
  const indexPath = path.join(root, corpus, 'index.json');
  if (!fs.existsSync(indexPath)) {
    fail(`Missing index.json: ${corpus}`, 'Corpus invisible to search');
    continue;
  }
  try {
    const idx = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const docCount = idx.categories?.reduce((n, c) => n + (c.documents?.length || 0), 0) || 0;
    if (docCount === 0) {
      fail(`Empty corpus: ${corpus}`, 'Has index.json but zero documents');
    } else {
      pass(`Corpus ${corpus}: ${docCount} docs across ${idx.categories?.length || 0} categories`);
    }
  } catch (e) {
    fail(`Corrupt index.json: ${corpus}`, e.message);
  }
}

// ─────────────────────────────────────────────────────────────
section('6. C++ BRIDGE ANALYSIS');
// ─────────────────────────────────────────────────────────────

try {
  const { analyzeCppFile } = await import(
    `file:///${path.join(root, 'lib', 'cpp-bridge.js').replace(/\\/g, '/')}`
  );

  const testCpp = `
#include <iostream>
int* ptr = new int(5);
void badFunc() {
  char* buf = (char*)malloc(100);
  strcpy(buf, "hello world this is a test");
  int* p = new int(42);
  std::cout << p->ToString() << std::endl;
}
int main() { return 0; }
`;

  const tmpFile = path.join(root, 'temp', '__test__.cpp');
  fs.writeFileSync(tmpFile, testCpp);

  const result = await analyzeCppFile(tmpFile, { severityThreshold: 0, confidenceThreshold: 0 });

  fs.unlinkSync(tmpFile);

  if (result?.errors?.length > 0) {
    pass(`C++ bridge detects issues: ${result.errors.length} findings`);
    for (const e of result.errors.slice(0, 3)) {
      console.log(`     → [${e.color}] ${e.id}: ${e.name}`);
    }
  } else {
    fail('C++ bridge returned no findings for known-bad code');
  }
} catch (e) {
  fail('C++ bridge analysis threw', e.message);
}

// ─────────────────────────────────────────────────────────────
section('7. WEBVIEW HTML GENERATORS');
// ─────────────────────────────────────────────────────────────

// Mock vscode for standalone testing
const mockWebview = { cspNonce: null };
const mockVscode = {
  workspace: { getConfiguration: () => ({ get: (k, d) => d }) },
  extensions: { getExtension: () => ({ packageJSON: { version: '3.0.0' } }) },
};

// Inject mock if running outside vscode
const genFiles = [
  { file: 'settings-html.js', fn: 'getSettingsHtml' },
  { file: 'csharp-bridge-html.js', fn: 'getCSharpBridgeHtml' },
  { file: 'admin-dashboard-html.js', fn: 'getAdminDashboardHtml' },
];

for (const { file, fn } of genFiles) {
  const fPath = path.join(root, 'lib', 'ui', 'generators', file);
  if (!fs.existsSync(fPath)) {
    fail(`Missing generator: ${file}`);
    continue;
  }
  try {
    const src = fs.readFileSync(fPath, 'utf8');
    if (src.includes(`export function ${fn}`)) {
      pass(`Generator exists and exports ${fn}: ${file}`);
    } else {
      fail(`Generator missing export ${fn}: ${file}`);
    }
    // Check for inline event handlers (CSP violation)
    if (src.match(/on(click|change|input)=/)) {
      fail(`Inline event handlers in ${file}`, 'Will break under CSP - use addEventListener');
    } else {
      pass(`No inline event handlers (CSP safe): ${file}`);
    }
  } catch (e) {
    fail(`Failed to read ${file}`, e.message);
  }
}

// ─────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(60)}`);
console.log('  DIAGNOSTIC AUDIT REPORT');
console.log('═'.repeat(60));
console.log(`  ✅ Passed: ${passed}`);
console.log(`  ❌ Failed: ${failed}`);

if (failures.length > 0) {
  console.log('\n  FAILURES:');
  for (const f of failures) {
    console.log(`    ❌ ${f.name}`);
    if (f.detail) console.log(`       → ${f.detail}`);
  }
}

console.log('═'.repeat(60));

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n  ALL CHECKS PASSED\n');
}
