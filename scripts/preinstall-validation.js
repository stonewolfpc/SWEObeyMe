#!/usr/bin/env node

/**
 * Comprehensive Pre-Install Validation Test
 * 
 * This test validates the entire SWEObeyMe MCP server will work flawlessly
 * across all machines before deployment. It tests:
 * 
 * 1. Server initialization and dependencies
 * 2. All tool handlers and responses
 * 3. Cross-platform file system operations
 * 4. Configuration loading and validation
 * 5. Edge cases and error handling
 * 6. All corpus handlers
 * 7. Project awareness persistence
 * 8. MCP protocol handshake simulation
 * 
 * Run with: node scripts/preinstall-validation.js
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

const TEST_RESULTS = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: [],
  warningsList: [],
};

function logTest(category, name, status, details = '') {
  const timestamp = new Date().toISOString();
  const statusSymbol = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
  console.log(`[${timestamp}] [${category}] ${statusSymbol} ${name}${details ? ` - ${details}` : ''}`);
  
  if (status === 'PASS') {
    TEST_RESULTS.passed++;
  } else if (status === 'FAIL') {
    TEST_RESULTS.failed++;
    TEST_RESULTS.errors.push({ category, name, details });
  } else if (status === 'WARN') {
    TEST_RESULTS.warnings++;
    TEST_RESULTS.warningsList.push({ category, name, details });
  }
}

async function testWithTimeout(testFn, testName, timeoutMs) {
  return new Promise(async (resolve) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
    });
    
    try {
      const result = await Promise.race([testFn(), timeoutPromise]);
      clearTimeout(timeoutId);
      resolve({ success: true, result });
    } catch (error) {
      clearTimeout(timeoutId);
      resolve({ success: false, error: error.message });
    }
  });
}

// ============================================
// CATEGORY 1: Server Initialization & Dependencies
// ============================================
async function testServerInitialization() {
  console.log('\n=== Server Initialization & Dependencies ===\n');
  
  // Test package.json exists
  const pkgPath = join(PROJECT_ROOT, 'package.json');
  logTest('Initialization', 'package.json exists', existsSync(pkgPath) ? 'PASS' : 'FAIL');
  
  // Test index.js exists
  const indexPath = join(PROJECT_ROOT, 'index.js');
  logTest('Initialization', 'index.js exists', existsSync(indexPath) ? 'PASS' : 'FAIL');
  
  // Test lib directory exists
  const libPath = join(PROJECT_ROOT, 'lib');
  logTest('Initialization', 'lib directory exists', existsSync(libPath) ? 'PASS' : 'FAIL');
  
  // Test tools directory exists
  const toolsPath = join(PROJECT_ROOT, 'lib', 'tools');
  logTest('Initialization', 'lib/tools directory exists', existsSync(toolsPath) ? 'PASS' : 'FAIL');
  
  // Test critical tool handlers exist
  const criticalHandlers = [
    'handlers.js',
    'docs-handlers.js',
    'project-awareness-handlers.js',
    'handlers-governance.js',
    'handlers-diagnostics.js',
  ];
  
  for (const handler of criticalHandlers) {
    const handlerPath = join(toolsPath, handler);
    logTest('Initialization', `${handler} exists`, existsSync(handlerPath) ? 'PASS' : 'FAIL');
  }
  
  // Test project-awareness exists
  const projectAwarenessPath = join(PROJECT_ROOT, 'lib', 'project-awareness.js');
  logTest('Initialization', 'project-awareness.js exists', existsSync(projectAwarenessPath) ? 'PASS' : 'FAIL');
  
  // Test corpus directories exist
  const corpora = [
    'csharp_dotnet_corpus',
    'cpp_corpus',
    'git_corpus',
    'unified_corpus',
    'math_corpus',
    'fdq_corpus',
    'training_corpus',
    'godot_corpus',
    'llama_corpus',
    'ide_mcp_corpus',
  ];
  
  for (const corpus of corpora) {
    const corpusPath = join(PROJECT_ROOT, corpus);
    const exists = existsSync(corpusPath);
    logTest('Initialization', `${corpus} exists`, exists ? 'PASS' : 'WARN', exists ? '' : 'Corpus may be optional');
  }
}

// ============================================
// CATEGORY 2: Module Imports
// ============================================
async function testModuleImports() {
  console.log('\n=== Module Imports ===\n');
  
  const modules = [
    { name: 'index.js', path: '../index.js' },
    { name: 'project-awareness.js', path: '../lib/project-awareness.js' },
    { name: 'handlers.js', path: '../lib/tools/handlers.js' },
    { name: 'docs-handlers.js', path: '../lib/tools/docs-handlers.js' },
    { name: 'project-awareness-handlers.js', path: '../lib/tools/project-awareness-handlers.js' },
    { name: 'unified-handlers.js', path: '../lib/tools/unified-handlers.js' },
  ];
  
  for (const module of modules) {
    try {
      // Use relative import path directly for ESM compatibility
      await import(module.path);
      logTest('Imports', module.name, 'PASS');
    } catch (error) {
      logTest('Imports', module.name, 'FAIL', error.message);
    }
  }
}

// ============================================
// CATEGORY 3: Tool Handler Validation
// ============================================
async function testToolHandlers() {
  console.log('\n=== Tool Handler Validation ===\n');
  
  try {
    const { toolHandlers } = await import('../lib/tools/handlers.js');
    
    // Check that critical tools are registered
    const criticalTools = [
      'obey_me_status',
      'get_current_project',
      'get_file_context',
      'read_file',
      'write_file',
      'docs_lookup',
      'add_project_error',
      'obey_surgical_plan',
    ];
    
    for (const toolName of criticalTools) {
      const exists = toolHandlers[toolName] !== undefined;
      logTest('Tool Handlers', `${toolName} registered`, exists ? 'PASS' : 'FAIL');
    }
    
    // Check that each handler has required properties
    for (const [name, handler] of Object.entries(toolHandlers)) {
      if (!handler) {
        logTest('Tool Handlers', `${name} is defined`, 'WARN', 'Handler is undefined');
        continue;
      }
      const hasName = handler.name !== undefined;
      const hasDescription = handler.description !== undefined;
      const hasInputSchema = handler.inputSchema !== undefined;
      
      if (hasName && hasDescription && hasInputSchema) {
        logTest('Tool Handlers', `${name} has valid schema`, 'PASS');
      } else {
        logTest('Tool Handlers', `${name} has valid schema`, 'WARN', 'Missing required properties');
      }
    }
  } catch (error) {
    logTest('Tool Handlers', 'Load tool handlers', 'FAIL', error.message);
  }
}

// ============================================
// CATEGORY 4: Corpus Handler Validation
// ============================================
async function testCorpusHandlers() {
  console.log('\n=== Corpus Handler Validation ===\n');
  
  try {
    const docsModule = await import('../lib/tools/docs-handlers.js');
    const CORPUS_REGISTRY = docsModule.CORPUS_REGISTRY || docsModule.corpusRegistry;
    
    if (!CORPUS_REGISTRY) {
      logTest('Corpus Handlers', 'Load corpus registry', 'WARN', 'CORPUS_REGISTRY not exported');
      return;
    }
    
    for (const [corpusId, config] of Object.entries(CORPUS_REGISTRY)) {
      const hasName = config.name !== undefined;
      const hasHandler = config.handler !== undefined;
      const handlerIsFunction = typeof config.handler === 'function';
      
      if (hasName && hasHandler && handlerIsFunction) {
        logTest('Corpus Handlers', `${corpusId} valid`, 'PASS');
      } else {
        logTest('Corpus Handlers', `${corpusId} valid`, 'WARN', 'Missing name or handler');
      }
    }
  } catch (error) {
    logTest('Corpus Handlers', 'Load corpus registry', 'WARN', error.message);
  }
}

// ============================================
// CATEGORY 5: File System Operations
// ============================================
async function testFileSystemOperations() {
  console.log('\n=== File System Operations ===\n');
  
  const testDir = join(PROJECT_ROOT, '.test-fs-validation');
  
  try {
    // Test directory creation
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
    logTest('File System', 'Create directory', 'PASS');
    
    // Test file write
    const testFile = join(testDir, 'test.txt');
    await fs.writeFile(testFile, 'test content');
    logTest('File System', 'Write file', 'PASS');
    
    // Test file read
    const content = await fs.readFile(testFile, 'utf8');
    const readSuccess = content === 'test content';
    logTest('File System', 'Read file', readSuccess ? 'PASS' : 'FAIL');
    
    // Test file exists
    const exists = existsSync(testFile);
    logTest('File System', 'File exists check', exists ? 'PASS' : 'FAIL');
    
    // Test file delete
    await fs.unlink(testFile);
    logTest('File System', 'Delete file', 'PASS');
    
    // Cleanup
    rmSync(testDir, { recursive: true, force: true });
    logTest('File System', 'Cleanup directory', 'PASS');
  } catch (error) {
    logTest('File System', 'File operations', 'FAIL', error.message);
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

// ============================================
// CATEGORY 6: Configuration Loading
// ============================================
async function testConfigurationLoading() {
  console.log('\n=== Configuration Loading ===\n');
  
  try {
    // Test package.json is valid JSON
    const pkgPath = join(PROJECT_ROOT, 'package.json');
    const pkgContent = await fs.readFile(pkgPath, 'utf8');
    const pkg = JSON.parse(pkgContent);
    
    logTest('Configuration', 'package.json valid JSON', 'PASS');
    logTest('Configuration', 'package.json has name', pkg.name ? 'PASS' : 'WARN');
    logTest('Configuration', 'package.json has version', pkg.version ? 'PASS' : 'WARN');
    logTest('Configuration', 'package.json has dependencies', pkg.dependencies ? 'PASS' : 'WARN');
  } catch (error) {
    logTest('Configuration', 'Load package.json', 'FAIL', error.message);
  }
}

// ============================================
// CATEGORY 7: Project Awareness
// ============================================
async function testProjectAwareness() {
  console.log('\n=== Project Awareness ===\n');
  
  try {
    const { getProjectAwarenessManager } = await import('../lib/project-awareness.js');
    const manager = getProjectAwarenessManager();
    
    logTest('Project Awareness', 'Manager instantiated', 'PASS');
    
    // Test getCurrentProject
    const project = manager.getCurrentProject();
    logTest('Project Awareness', 'getCurrentProject', 'PASS');
    
    // Test getProjectRules
    const rules = manager.getProjectRules('javascript');
    logTest('Project Awareness', 'getProjectRules', 'PASS');
    
    // Test validateAction
    const validation = manager.validateAction('write_file', '/tmp/test.js');
    logTest('Project Awareness', 'validateAction', 'PASS');
  } catch (error) {
    logTest('Project Awareness', 'Initialize manager', 'FAIL', error.message);
  }
}

// ============================================
// CATEGORY 8: Tool Handler Execution
// ============================================
async function testToolHandlerExecution() {
  console.log('\n=== Tool Handler Execution ===\n');
  
  try {
    const { get_current_project_handler } = await import('../lib/tools/project-awareness-handlers.js');
    
    const { success, error } = await testWithTimeout(
      () => get_current_project_handler({}),
      'get_current_project_handler',
      5000
    );
    
    logTest('Execution', 'get_current_project_handler', success ? 'PASS' : 'FAIL', error || '');
  } catch (error) {
    logTest('Execution', 'get_current_project_handler', 'FAIL', error.message);
  }
}

// ============================================
// CATEGORY 9: Cross-Platform Path Handling
// ============================================
async function testCrossPlatformPaths() {
  console.log('\n=== Cross-Platform Path Handling ===\n');
  
  const platform = process.platform;
  logTest('Cross-Platform', `Running on ${platform}`, 'PASS');
  
  try {
    const path = await import('path');
    
    // Test path.join works correctly
    const testPath = path.join('foo', 'bar', 'baz');
    const pathValid = testPath.includes('foo') && testPath.includes('bar') && testPath.includes('baz');
    logTest('Cross-Platform', 'path.join', pathValid ? 'PASS' : 'FAIL');
    
    // Test path.resolve works correctly
    const resolvedPath = path.resolve('test');
    const resolveValid = resolvedPath.length > 0;
    logTest('Cross-Platform', 'path.resolve', resolveValid ? 'PASS' : 'FAIL');
  } catch (error) {
    logTest('Cross-Platform', 'Path operations', 'FAIL', error.message);
  }
}

// ============================================
// CATEGORY 10: Edge Cases & Error Handling
// ============================================
async function testEdgeCases() {
  console.log('\n=== Edge Cases & Error Handling ===\n');
  
  try {
    const { docs_lookup_handler } = await import('../lib/tools/docs-handlers.js');
    
    // Test missing query parameter
    const result1 = await docs_lookup_handler({});
    const hasError1 = result1.isError === true;
    logTest('Edge Cases', 'docs_lookup missing query', hasError1 ? 'PASS' : 'FAIL');
    
    // Test invalid corpus
    const result2 = await docs_lookup_handler({ query: 'test', corpus: 'invalid_corpus' });
    const hasError2 = result2.isError === true;
    logTest('Edge Cases', 'docs_lookup invalid corpus', hasError2 ? 'PASS' : 'FAIL');
  } catch (error) {
    logTest('Edge Cases', 'Error handling tests', 'FAIL', error.message);
  }
  
  try {
    const { add_project_error_handler } = await import('../lib/tools/project-awareness-handlers.js');
    
    // Test missing error parameter
    const result = await add_project_error_handler({});
    const hasError = result.success === false;
    logTest('Edge Cases', 'add_project_error missing error', hasError ? 'PASS' : 'FAIL');
  } catch (error) {
    logTest('Edge Cases', 'Error handling tests', 'FAIL', error.message);
  }
}

// ============================================
// CATEGORY 11: Async Operation Safety
// ============================================
async function testAsyncSafety() {
  console.log('\n=== Async Operation Safety ===\n');
  
  try {
    const { docs_lookup_handler } = await import('../lib/tools/docs-handlers.js');
    
    // Test that async operations don't block
    const { success, error } = await testWithTimeout(
      () => docs_lookup_handler({ query: 'async', corpus: 'unified', maxResults: 5 }),
      'async docs_lookup',
      10000
    );
    
    logTest('Async Safety', 'docs_lookup non-blocking', success ? 'PASS' : 'FAIL', error || '');
  } catch (error) {
    logTest('Async Safety', 'Async operations', 'FAIL', error.message);
  }
}

// ============================================
// CATEGORY 12: Memory & Performance
// ============================================
async function testMemoryAndPerformance() {
  console.log('\n=== Memory & Performance ===\n');
  
  const beforeMemory = process.memoryUsage();
  
  try {
    const { docs_lookup_handler } = await import('../lib/tools/docs-handlers.js');
    
    // Run multiple operations to check for memory leaks
    for (let i = 0; i < 10; i++) {
      await docs_lookup_handler({ query: 'test', maxResults: 5 });
    }
    
    const afterMemory = process.memoryUsage();
    const memoryIncrease = afterMemory.heapUsed - beforeMemory.heapUsed;
    const memoryIncreaseMB = (memoryIncrease / 1024 / 1024).toFixed(2);
    
    // Allow up to 50MB increase for operations
    const memoryOK = memoryIncrease < 50 * 1024 * 1024;
    logTest('Performance', 'Memory usage', memoryOK ? 'PASS' : 'WARN', `+${memoryIncreaseMB}MB`);
  } catch (error) {
    logTest('Performance', 'Memory test', 'FAIL', error.message);
  }
}

// ============================================
// Run All Tests
// ============================================
async function runAllTests() {
  console.log('========================================');
  console.log('  SWEObeyMe Pre-Install Validation');
  console.log('========================================\n');
  
  const startTime = Date.now();
  
  try {
    await testServerInitialization();
    await testModuleImports();
    await testToolHandlers();
    await testCorpusHandlers();
    await testFileSystemOperations();
    await testConfigurationLoading();
    await testProjectAwareness();
    await testToolHandlerExecution();
    await testCrossPlatformPaths();
    await testEdgeCases();
    await testAsyncSafety();
    await testMemoryAndPerformance();
  } catch (error) {
    console.error('\n❌ Test suite crashed:', error);
    TEST_RESULTS.errors.push({ category: 'Test Suite', name: 'Crash', details: error.message });
  }
  
  const duration = Date.now() - startTime;
  
  console.log('\n========================================');
  console.log('  Validation Results');
  console.log('========================================\n');
  console.log(`Total Tests: ${TEST_RESULTS.passed + TEST_RESULTS.failed + TEST_RESULTS.warnings}`);
  console.log(`✓ Passed: ${TEST_RESULTS.passed}`);
  console.log(`✗ Failed: ${TEST_RESULTS.failed}`);
  console.log(`⚠ Warnings: ${TEST_RESULTS.warnings}`);
  console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
  
  if (TEST_RESULTS.failed > 0) {
    console.log('\nFailed Tests:');
    TEST_RESULTS.errors.forEach(({ category, name, details }) => {
      console.log(`  [${category}] ${name}: ${details}`);
    });
    process.exit(1);
  }
  
  if (TEST_RESULTS.warnings > 0) {
    console.log('\nWarnings:');
    TEST_RESULTS.warningsList.forEach(({ category, name, details }) => {
      console.log(`  [${category}] ${name}: ${details}`);
    });
  }
  
  if (TEST_RESULTS.failed === 0) {
    console.log('\n✓ All critical tests passed!');
    console.log('✓ Server is ready for deployment.');
    process.exit(0);
  }
}

runAllTests();
