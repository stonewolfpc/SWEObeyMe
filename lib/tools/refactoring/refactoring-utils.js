/**
 * Refactoring Utility Functions
 * 
 * Responsibility: Provide advanced refactoring utilities for complex operations
 * 
 * @module lib/tools/refactoring/refactoring-utils
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Parse import statements from code
 * @param {string} code - Source code
 * @returns {Array} Array of import statements
 */
export function parseImports(code) {
  const imports = [];
  const patterns = [
    // ES6 imports
    /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g,
    /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
    /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
    // CommonJS require
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    // TypeScript import types
    /import\s+type\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      imports.push({
        statement: match[0],
        specifier: match[1],
        source: match[2],
        type: pattern.toString().includes('type') ? 'type' : 'value',
      });
    }
  }

  return imports;
}

/**
 * Extract symbols (functions, classes, variables) from code
 * @param {string} code - Source code
 * @returns {Object} Object with arrays of symbols
 */
export function extractSymbols(code) {
  const symbols = {
    functions: [],
    classes: [],
    variables: [],
    exports: [],
  };

  // Functions
  const functionPattern = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))/g;
  let match;
  while ((match = functionPattern.exec(code)) !== null) {
    symbols.functions.push(match[1] || match[2]);
  }

  // Classes
  const classPattern = /class\s+(\w+)/g;
  while ((match = classPattern.exec(code)) !== null) {
    symbols.classes.push(match[1]);
  }

  // Variables (const, let, var at top level)
  const variablePattern = /(?:const|let|var)\s+(\w+)\s*=/g;
  while ((match = variablePattern.exec(code)) !== null) {
    symbols.variables.push(match[1]);
  }

  // Exports
  const exportPattern = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
  while ((match = exportPattern.exec(code)) !== null) {
    symbols.exports.push(match[1]);
  }

  return symbols;
}

/**
 * Find references to a symbol across files
 * @param {string} projectRoot - Project root directory
 * @param {string} symbol - Symbol name
 * @param {Object} options - Options
 * @param {number} options.maxDepth - Maximum directory depth (default: 10)
 * @param {number} options.timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns {Array} Array of files containing references
 */
export async function findSymbolReferences(projectRoot, symbol, options = {}) {
  const { maxDepth = 10, timeoutMs = 5000 } = options;
  const references = [];
  const pattern = new RegExp(`\\b${symbol}\\b`, 'g');
  const startTime = Date.now();
  const visitedDirs = new Set();

  async function searchDirectory(dir, depth = 0) {
    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Search timeout after ${timeoutMs}ms`);
    }

    // Check depth limit
    if (depth > maxDepth) {
      return;
    }

    // Check for circular references
    const normalizedDir = path.normalize(dir);
    if (visitedDirs.has(normalizedDir)) {
      return;
    }
    visitedDirs.add(normalizedDir);

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        // Check timeout again during iteration
        if (Date.now() - startTime > timeoutMs) {
          throw new Error(`Search timeout after ${timeoutMs}ms`);
        }

        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await searchDirectory(fullPath, depth + 1);
        } else if (entry.isFile() && /\.(js|ts|jsx|tsx)$/.test(entry.name)) {
          try {
            const content = await fs.readFile(fullPath, 'utf-8');
            if (pattern.test(content)) {
              references.push(fullPath);
            }
          } catch (e) {
            // Skip files we can't read
          }
        }
      }
    } catch (e) {
      // Skip directories we can't read or timeout errors
      if (e.message && e.message.includes('timeout')) {
        throw e;
      }
    }
  }

  try {
    await searchDirectory(projectRoot);
  } catch (e) {
    if (e.message && e.message.includes('timeout')) {
      console.warn(`[findSymbolReferences] Search timed out after ${timeoutMs}ms, returning ${references.length} partial results`);
    } else {
      throw e;
    }
  }

  return references;
}

/**
 * Generate import statement for extracted code
 * @param {string} targetFile - Target file path
 * @param {Array} symbols - Symbols to import
 * @param {boolean} isType - Whether imports are type imports
 * @returns {string} Import statement
 */
export function generateImportStatement(targetFile, symbols, isType = false) {
  const specifier = symbols.length === 1 ? symbols[0] : `{ ${symbols.join(', ')} }`;
  const typeKeyword = isType ? 'type ' : '';
  return `import ${typeKeyword}${specifier} from '${targetFile}';`;
}

/**
 * Insert import statement into code
 * @param {string} code - Source code
 * @param {string} importStatement - Import statement to insert
 * @returns {string} Code with import inserted
 */
export function insertImportStatement(code, importStatement) {
  const lines = code.split('\n');
  
  // Find the last import statement
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import') || lines[i].trim().startsWith('require')) {
      lastImportIndex = i;
    }
  }
  
  // Insert after last import or at the beginning
  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, importStatement);
  } else {
    lines.unshift(importStatement);
  }
  
  return lines.join('\n');
}

/**
 * Remove unused imports from code
 * @param {string} code - Source code
 * @returns {string} Code with unused imports removed
 */
export function removeUnusedImports(code) {
  const imports = parseImports(code);
  const symbols = extractSymbols(code);
  const usedSymbols = new Set([...symbols.functions, ...symbols.classes, ...symbols.variables]);
  
  let newCode = code;
  
  for (const imp of imports) {
    const importedSymbols = imp.specifier.split(',').map(s => s.trim());
    const usedImportedSymbols = importedSymbols.filter(s => usedSymbols.has(s));
    
    if (usedImportedSymbols.length === 0) {
      // Remove entire import
      newCode = newCode.replace(imp.statement + '\n', '');
      newCode = newCode.replace(imp.statement, '');
    } else if (usedImportedSymbols.length < importedSymbols.length) {
      // Update import to only include used symbols
      const newSpecifier = usedImportedSymbols.length === 1 
        ? usedImportedSymbols[0]
        : `{ ${usedImportedSymbols.join(', ')} }`;
      const newStatement = imp.statement.replace(imp.specifier, newSpecifier);
      newCode = newCode.replace(imp.statement, newStatement);
    }
  }
  
  return newCode;
}

/**
 * Detect code blocks based on delimiters (functions, classes, etc.)
 * @param {string} code - Source code
 * @returns {Array} Array of detected blocks
 */
export function detectCodeBlocks(code) {
  const blocks = [];
  
  // Function blocks
  const functionPattern = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gs;
  let match;
  while ((match = functionPattern.exec(code)) !== null) {
    blocks.push({
      type: 'function',
      name: match[1] || match[2],
      code: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  
  // Class blocks
  const classPattern = /class\s+(\w+)\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gs;
  while ((match = classPattern.exec(code)) !== null) {
    blocks.push({
      type: 'class',
      name: match[1],
      code: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  
  return blocks;
}

/**
 * Preserve comments from source code
 * @param {string} code - Source code
 * @returns {Object} Object with comment mappings
 */
export function extractComments(code) {
  const comments = [];
  const patterns = [
    // Single-line comments
    /\/\/(.*)$/gm,
    // Multi-line comments
    /\/\*([\s\S]*?)\*\//g,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      comments.push({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }
  
  return comments;
}

/**
 * Calculate dependency graph for a file
 * @param {string} filePath - File path
 * @param {string} projectRoot - Project root
 * @returns {Object} Dependency graph
 */
export async function buildDependencyGraph(filePath, projectRoot) {
  const code = await fs.readFile(filePath, 'utf-8');
  const imports = parseImports(code);
  const dependencies = [];
  
  for (const imp of imports) {
    const resolvedPath = resolveImportPath(imp.source, path.dirname(filePath), projectRoot);
    if (resolvedPath) {
      dependencies.push({
        source: imp.source,
        specifier: imp.specifier,
        resolvedPath,
        type: imp.type,
      });
    }
  }
  
  return {
    file: filePath,
    imports,
    dependencies,
  };
}

/**
 * Resolve import path to absolute file path
 * @param {string} importPath - Import path
 * @param {string} fromDir - Directory of importing file
 * @param {string} projectRoot - Project root
 * @returns {string|null} Resolved path or null
 */
function resolveImportPath(importPath, fromDir, projectRoot) {
  // Handle relative imports
  if (importPath.startsWith('.')) {
    const resolved = path.resolve(fromDir, importPath);
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '/index.js', '/index.ts'];
    
    for (const ext of extensions) {
      const fullPath = resolved + ext;
      try {
        fs.accessSync(fullPath);
        return fullPath;
      } catch (e) {
        // Continue trying
      }
    }
  }
  
  // Handle node_modules imports
  const nodeModulesPath = path.join(projectRoot, 'node_modules', importPath);
  try {
    fs.accessSync(nodeModulesPath);
    return nodeModulesPath;
  } catch (e) {
    // Not in node_modules
  }
  
  return null;
}

/**
 * Validate that code doesn't break after refactoring
 * @param {string} code - Code to validate
 * @param {string} filePath - File path for error reporting
 * @returns {Object} Validation result
 */
export function validateRefactoredCode(code, filePath) {
  const errors = [];
  
  // Check for unmatched brackets
  const bracketStack = [];
  const brackets = { '(': ')', '[': ']', '{': '}' };
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    if (brackets[char]) {
      bracketStack.push(char);
    } else if (Object.values(brackets).includes(char)) {
      const last = bracketStack.pop();
      if (brackets[last] !== char) {
        errors.push(`Unmatched closing bracket '${char}' at position ${i}`);
      }
    }
  }
  
  if (bracketStack.length > 0) {
    errors.push(`${bracketStack.length} unclosed bracket(s)`);
  }
  
  // Check for syntax errors (basic)
  if (code.includes('function') && !code.includes('{')) {
    errors.push('Function declaration without body');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate preview of refactoring changes
 * @param {Object} changes - Changes to apply
 * @returns {Object} Preview with diff
 */
export function generateRefactoringPreview(changes) {
  const preview = {
    files: [],
    summary: '',
  };
  
  for (const change of changes) {
    const linesBefore = change.before.split('\n').length;
    const linesAfter = change.after.split('\n').length;
    const diff = linesAfter - linesBefore;
    
    preview.files.push({
      path: change.path,
      linesBefore,
      linesAfter,
      diff,
      preview: change.after.substring(0, 200) + (change.after.length > 200 ? '...' : ''),
    });
  }
  
  preview.summary = `Will modify ${preview.files.length} file(s), total line change: ${preview.files.reduce((sum, f) => sum + f.diff, 0)}`;
  
  return preview;
}
