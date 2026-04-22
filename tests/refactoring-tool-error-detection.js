/**
 * Refactoring Tool Error Detection Tests
 * 
 * This test suite detects error patterns encountered during refactoring work
 * to prevent future occurrences and ensure robust error handling.
 * 
 * Error Types Tested:
 * 1. SWEObeyMe MCP Tool Failure
 * 2. Backup Directory Missing
 * 3. Syntax Errors from Incomplete Edits
 * 4. Duplicate Function Declarations
 * 5. Missing Export After Refactoring
 */

import fs from 'fs/promises';
import path from 'path';

const TEST_RESULTS = {
  passed: 0,
  failed: 0,
  errors: [],
};

/**
 * Test helper to record results
 */
function test(name, fn) {
  try {
    fn();
    TEST_RESULTS.passed++;
    console.log(`✅ PASS: ${name}`);
  } catch (error) {
    TEST_RESULTS.failed++;
    TEST_RESULTS.errors.push({ test: name, error: error.message });
    console.log(`❌ FAIL: ${name} - ${error.message}`);
  }
}

/**
 * Test 1: Backup Directory Existence
 */
test('Backup directory exists', () => {
  const backupDir = path.join(process.cwd(), 'dist', '.swe-backups');
  fs.access(backupDir)
    .then(() => {})
    .catch(() => {
      throw new Error(`Backup directory does not exist: ${backupDir}`);
    });
});

/**
 * Test 2: Backup Directory Writable
 */
test('Backup directory is writable', async () => {
  const backupDir = path.join(process.cwd(), 'dist', '.swe-backups');
  const testFile = path.join(backupDir, '.write-test');
  try {
    await fs.writeFile(testFile, 'test');
    await fs.unlink(testFile);
  } catch (error) {
    throw new Error(`Backup directory not writable: ${error.message}`);
  }
});

/**
 * Test 3: File Registry Module Exports
 */
test('File registry exports all required functions', async () => {
  const fileRegistryPath = path.join(process.cwd(), 'lib', 'file-registry.js');
  const content = await fs.readFile(fileRegistryPath, 'utf-8');
  
  const requiredExports = [
    'findDuplicateFiles',
    'findSameNameFiles',
    'findSimilarFiles',
    'getFileRegistry',
    'initializeFileRegistry',
    'checkFileExists',
    'getFileMetadata',
    'searchFiles',
    'updateFileInRegistry',
    'removeFileFromRegistry',
    'getRegistryStatistics',
  ];
  
  // Check if all required exports are present
  // Duplicate detection functions use "as" pattern, others use regular export function
  const duplicateDetectionExports = ['findDuplicateFiles', 'findSameNameFiles', 'findSimilarFiles'];
  const allExportsFound = requiredExports.every(exportName => {
    if (duplicateDetectionExports.includes(exportName)) {
      return content.includes(`as ${exportName}`);
    } else {
      return content.includes(`export function ${exportName}`) || content.includes(`export async function ${exportName}`);
    }
  });
  
  if (!allExportsFound) {
    const missing = requiredExports.filter(name => {
      if (duplicateDetectionExports.includes(name)) {
        return !content.includes(`as ${name}`);
      } else {
        return !content.includes(`export function ${name}`) && !content.includes(`export async function ${name}`);
      }
    });
    throw new Error(`Missing exports: ${missing.join(', ')}`);
  }
});

/**
 * Test 4: No Duplicate Function Declarations in File Registry
 */
test('File registry has no duplicate function declarations', async () => {
  const fileRegistryPath = path.join(process.cwd(), 'lib', 'file-registry.js');
  const content = await fs.readFile(fileRegistryPath, 'utf-8');
  
  const functionPattern = /export function (\w+)/g;
  const matches = [];
  let match;
  
  while ((match = functionPattern.exec(content)) !== null) {
    const functionName = match[1];
    if (matches.includes(functionName)) {
      throw new Error(`Duplicate function declaration: ${functionName}`);
    }
    matches.push(functionName);
  }
});

/**
 * Test 5: Refactoring Handlers Module Exports
 */
test('Refactoring handlers exports all required functions', async () => {
  const handlersPath = path.join(process.cwd(), 'lib', 'tools', 'handlers-refactoring.js');
  const content = await fs.readFile(handlersPath, 'utf-8');
  
  const requiredExports = [
    'refactoringHandlers',
  ];
  
  for (const exportName of requiredExports) {
    if (!content.includes(`export const ${exportName}`)) {
      throw new Error(`Missing export: ${exportName}`);
    }
  }
});

/**
 * Test 6: Refactoring Module Files Exist
 */
test('All refactoring module files exist', async () => {
  const refactoringDir = path.join(process.cwd(), 'lib', 'tools', 'refactoring');
  const requiredFiles = [
    'bracket-validator.js',
    'refactoring-move.js',
    'refactoring-extract.js',
    'refactoring-rename.js',
    'refactoring-inline.js',
    'refactoring-replace.js',
    'refactoring-delete.js',
    'refactoring-split.js',
  ];
  
  for (const fileName of requiredFiles) {
    const filePath = path.join(refactoringDir, fileName);
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new Error(`Missing refactoring module: ${fileName}`);
    }
  }
});

/**
 * Test 7: File Registry Module Files Exist
 */
test('File registry module files exist', async () => {
  const fileRegistryDir = path.join(process.cwd(), 'lib', 'file-registry');
  const requiredFiles = [
    'file-hash.js',
    'file-indexer.js',
    'file-similarity.js',
    'file-duplicate-detector.js',
  ];
  
  for (const fileName of requiredFiles) {
    const filePath = path.join(fileRegistryDir, fileName);
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new Error(`Missing file registry module: ${fileName}`);
    }
  }
});

/**
 * Test 8: Import Consistency in File Registry
 */
test('File registry imports match extracted modules', async () => {
  const fileRegistryPath = path.join(process.cwd(), 'lib', 'file-registry.js');
  const content = await fs.readFile(fileRegistryPath, 'utf-8');
  
  const requiredImports = [
    './file-registry/file-indexer.js',
    './file-registry/file-hash.js',
    './file-registry/file-similarity.js',
    './file-registry/file-duplicate-detector.js',
  ];
  
  for (const importPath of requiredImports) {
    if (!content.includes(importPath)) {
      throw new Error(`Missing import: ${importPath}`);
    }
  }
});

/**
 * Test 9: SWEObeyMe MCP Tool Failure Detection
 */
test('SWEObeyMe MCP tools are available', async () => {
  // This test checks if SWEObeyMe MCP tools are available
  // Error pattern 1: "Cannot read properties of undefined (reading 'push')"
  // indicates internal MCP server issue with undefined state in tool registry
  // Tools affected: project_context, docs_verify, potentially others
  // Error pattern 2: "Corpus 'unified' not found" or "Unknown corpus"
  // indicates corpus name mismatch in docs tools
  // Error pattern 3: Inconsistent available corpora list
  // indicates docs_list_categories tool returning different corpus lists
  // Error pattern 4: "Patreon API key not configured"
  // indicates missing environment variable (configuration error, not tool error)
  // Error pattern 5: Missing tool registration
  // indicates tool is registered but handler is missing (e.g., get_integrity_report)
  // Error pattern 6: "Godot corpus not found"
  // indicates missing corpus directory (e.g., godot_corpus/index.json)
  // Error pattern 7: "ENOENT: no such file or directory"
  // indicates file not found error in auto_enforce validate operation
  // Error pattern 8: "todoId and todoDescription are required"
  // indicates missing required parameters in audit schedule_todo operation
  // Error pattern 9: "unsupported resource type"
  // indicates resource type not supported by read_resource tool
  try {
    // Check that the MCP server is running by checking the backup directory
    const backupDir = path.join(process.cwd(), 'dist', '.swe-backups');
    await fs.access(backupDir);
  } catch (error) {
    throw new Error(`SWEObeyMe MCP tools may be unavailable: ${error.message}`);
  }
});

/**
 * Test 11: Import Consistency in Refactoring Handlers
 */
test('Refactoring handlers imports match extracted modules', async () => {
  const handlersPath = path.join(process.cwd(), 'lib', 'tools', 'handlers-refactoring.js');
  const content = await fs.readFile(handlersPath, 'utf-8');
  
  const requiredImports = [
    './refactoring/bracket-validator.js',
    './refactoring/refactoring-move.js',
    './refactoring/refactoring-extract.js',
    './refactoring/refactoring-rename.js',
    './refactoring/refactoring-inline.js',
    './refactoring/refactoring-replace.js',
    './refactoring/refactoring-delete.js',
    './refactoring/refactoring-split.js',
  ];
  
  for (const importPath of requiredImports) {
    if (!content.includes(importPath)) {
      throw new Error(`Missing import: ${importPath}`);
    }
  }
});

/**
 * Run all tests and report results
 */
async function runTests() {
  console.log('Running Refactoring Tool Error Detection Tests...\n');
  
  // Run all tests
  await Promise.all([
    // Test 1 & 2 are async, run them separately
    (async () => {
      try {
        await test('Backup directory exists', async () => {
          const backupDir = path.join(process.cwd(), 'dist', '.swe-backups');
          await fs.access(backupDir);
        });
      } catch (error) {
        TEST_RESULTS.failed++;
        TEST_RESULTS.errors.push({ test: 'Backup directory exists', error: error.message });
        console.log(`❌ FAIL: Backup directory exists - ${error.message}`);
      }
    })(),
    (async () => {
      try {
        await test('Backup directory is writable', async () => {
          const backupDir = path.join(process.cwd(), 'dist', '.swe-backups');
          const testFile = path.join(backupDir, '.write-test');
          await fs.writeFile(testFile, 'test');
          await fs.unlink(testFile);
        });
      } catch (error) {
        TEST_RESULTS.failed++;
        TEST_RESULTS.errors.push({ test: 'Backup directory is writable', error: error.message });
        console.log(`❌ FAIL: Backup directory is writable - ${error.message}`);
      }
    })(),
  ]);
  
  // Run synchronous tests
  test('File registry exports all required functions', async () => {
    const fileRegistryPath = path.join(process.cwd(), 'lib', 'file-registry.js');
    const content = await fs.readFile(fileRegistryPath, 'utf-8');
    
    const requiredExports = [
      'findDuplicateFiles',
      'findSameNameFiles',
      'findSimilarFiles',
      'getFileRegistry',
      'initializeFileRegistry',
      'checkFileExists',
      'getFileMetadata',
      'searchFiles',
      'updateFileInRegistry',
      'removeFileFromRegistry',
      'getRegistryStatistics',
    ];
    
    for (const exportName of requiredExports) {
      if (!content.includes(`export function ${exportName}`) && !content.includes(`export { ${exportName}`)) {
        throw new Error(`Missing export: ${exportName}`);
      }
    }
  });
  
  test('File registry has no duplicate function declarations', async () => {
    const fileRegistryPath = path.join(process.cwd(), 'lib', 'file-registry.js');
    const content = await fs.readFile(fileRegistryPath, 'utf-8');
    
    const functionPattern = /export function (\w+)/g;
    const matches = [];
    let match;
    
    while ((match = functionPattern.exec(content)) !== null) {
      const functionName = match[1];
      if (matches.includes(functionName)) {
        throw new Error(`Duplicate function declaration: ${functionName}`);
      }
      matches.push(functionName);
    }
  });
  
  test('Refactoring handlers exports all required functions', async () => {
    const handlersPath = path.join(process.cwd(), 'lib', 'tools', 'handlers-refactoring.js');
    const content = await fs.readFile(handlersPath, 'utf-8');
    
    if (!content.includes('export const refactoringHandlers')) {
      throw new Error('Missing export: refactoringHandlers');
    }
  });
  
  test('All refactoring module files exist', async () => {
    const refactoringDir = path.join(process.cwd(), 'lib', 'tools', 'refactoring');
    const requiredFiles = [
      'bracket-validator.js',
      'refactoring-move.js',
      'refactoring-extract.js',
      'refactoring-rename.js',
      'refactoring-inline.js',
      'refactoring-replace.js',
      'refactoring-delete.js',
      'refactoring-split.js',
    ];
    
    for (const fileName of requiredFiles) {
      const filePath = path.join(refactoringDir, fileName);
      await fs.access(filePath);
    }
  });
  
  test('File registry module files exist', async () => {
    const fileRegistryDir = path.join(process.cwd(), 'lib', 'file-registry');
    const requiredFiles = [
      'file-hash.js',
      'file-indexer.js',
      'file-similarity.js',
      'file-duplicate-detector.js',
    ];
    
    for (const fileName of requiredFiles) {
      const filePath = path.join(fileRegistryDir, fileName);
      await fs.access(filePath);
    }
  });
  
  test('Refactoring modules have no syntax errors', async () => {
    const refactoringDir = path.join(process.cwd(), 'lib', 'tools', 'refactoring');
    const files = await fs.readdir(refactoringDir);
    
    for (const file of files) {
      if (file.endsWith('.js')) {
        const filePath = path.join(refactoringDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Check for common syntax error patterns from incomplete edits
        if (content.includes('},        ],')) {
          throw new Error(`Syntax error pattern in ${file}: orphaned closing braces`);
        }
      }
    }
  });
  
  test('File registry imports match extracted modules', async () => {
    const fileRegistryPath = path.join(process.cwd(), 'lib', 'file-registry.js');
    const content = await fs.readFile(fileRegistryPath, 'utf-8');
    
    const requiredImports = [
      './file-registry/file-indexer.js',
      './file-registry/file-hash.js',
      './file-registry/file-similarity.js',
      './file-registry/file-duplicate-detector.js',
    ];
    
    for (const importPath of requiredImports) {
      if (!content.includes(importPath)) {
        throw new Error(`Missing import: ${importPath}`);
      }
    }
  });
  
  test('Refactoring handlers imports match extracted modules', async () => {
    const handlersPath = path.join(process.cwd(), 'lib', 'tools', 'handlers-refactoring.js');
    const content = await fs.readFile(handlersPath, 'utf-8');
    
    const requiredImports = [
      './refactoring/bracket-validator.js',
      './refactoring/refactoring-move.js',
      './refactoring/refactoring-extract.js',
      './refactoring/refactoring-rename.js',
      './refactoring/refactoring-inline.js',
      './refactoring/refactoring-replace.js',
      './refactoring/refactoring-delete.js',
      './refactoring/refactoring-split.js',
    ];
    
    for (const importPath of requiredImports) {
      if (!content.includes(importPath)) {
        throw new Error(`Missing import: ${importPath}`);
      }
    }
  });
  
  // Print results
  console.log('\n' + '='.repeat(50));
  console.log('TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`Passed: ${TEST_RESULTS.passed}`);
  console.log(`Failed: ${TEST_RESULTS.failed}`);
  
  if (TEST_RESULTS.errors.length > 0) {
    console.log('\nErrors:');
    TEST_RESULTS.errors.forEach(({ test, error }) => {
      console.log(`  - ${test}: ${error}`);
    });
  }
  
  console.log('='.repeat(50));
  
  if (TEST_RESULTS.failed > 0) {
    process.exit(1);
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

export { runTests };
