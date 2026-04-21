import fs from 'fs/promises';
import path from 'path';
import {
  ENABLE_SYNTAX_VALIDATION,
  ENABLE_IMPORT_VALIDATION,
  ENABLE_ANTI_PATTERN_DETECTION,
  ENABLE_NAMING_VALIDATION,
} from './config.js';

/**
 * Validation tools for reducing hallucination risk
 */

/**
 * Validate syntax of JavaScript/TypeScript code with enhanced bracket matching
 */
export function validateSyntax(code) {
  const errors = [];
  const bracketErrors = [];

  // Enhanced bracket validation with depth tracking and line reporting
  const lines = code.split('\n');

  // Track bracket stacks with line numbers
  const braceStack = [];
  const parenStack = [];
  const bracketStack = [];

  // Track bracket pairs for visualization
  const bracePairs = [];
  const parenPairs = [];
  const bracketPairs = [];

  // Track maximum depth
  let maxBraceDepth = 0;
  let maxParenDepth = 0;
  let maxBracketDepth = 0;

  lines.forEach((line, lineNum) => {
    const lineNumber = lineNum + 1;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const prevChar = i > 0 ? line[i - 1] : '';

      // Handle string literals
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
      }

      // Skip bracket detection inside strings
      if (inString) continue;

      // Track braces {}
      if (char === '{') {
        const opening = { line: lineNumber, char: '{', depth: braceStack.length, column: i + 1 };
        braceStack.push(opening);
        maxBraceDepth = Math.max(maxBraceDepth, braceStack.length);
      } else if (char === '}') {
        if (braceStack.length === 0) {
          bracketErrors.push({
            type: 'extra_closing',
            bracket: '}',
            line: lineNumber,
            column: i + 1,
            message: `Extra closing brace } at line ${lineNumber} - no matching opening brace`,
          });
        } else {
          const opening = braceStack.pop();
          if (opening.char !== '{') {
            bracketErrors.push({
              type: 'mismatch',
              expected: '{',
              found: '}',
              line: lineNumber,
              column: i + 1,
              openingLine: opening.line,
              openingColumn: opening.column,
              message: `Mismatched brace at line ${lineNumber} - expected { but found }`,
            });
          } else {
            // Record matched pair for visualization
            bracePairs.push({
              opening: { line: opening.line, column: opening.column, depth: opening.depth },
              closing: { line: lineNumber, column: i + 1, depth: opening.depth },
            });
          }
        }
      }

      // Track parentheses ()
      if (char === '(') {
        const opening = { line: lineNumber, char: '(', depth: parenStack.length, column: i + 1 };
        parenStack.push(opening);
        maxParenDepth = Math.max(maxParenDepth, parenStack.length);
      } else if (char === ')') {
        if (parenStack.length === 0) {
          bracketErrors.push({
            type: 'extra_closing',
            bracket: ')',
            line: lineNumber,
            column: i + 1,
            message: `Extra closing parenthesis ) at line ${lineNumber} - no matching opening parenthesis`,
          });
        } else {
          const opening = parenStack.pop();
          if (opening.char !== '(') {
            bracketErrors.push({
              type: 'mismatch',
              expected: '(',
              found: ')',
              line: lineNumber,
              column: i + 1,
              openingLine: opening.line,
              openingColumn: opening.column,
              message: `Mismatched parenthesis at line ${lineNumber} - expected ( but found )`,
            });
          } else {
            // Record matched pair for visualization
            parenPairs.push({
              opening: { line: opening.line, column: opening.column, depth: opening.depth },
              closing: { line: lineNumber, column: i + 1, depth: opening.depth },
            });
          }
        }
      }

      // Track brackets []
      if (char === '[') {
        const opening = { line: lineNumber, char: '[', depth: bracketStack.length, column: i + 1 };
        bracketStack.push(opening);
        maxBracketDepth = Math.max(maxBracketDepth, bracketStack.length);
      } else if (char === ']') {
        if (bracketStack.length === 0) {
          bracketErrors.push({
            type: 'extra_closing',
            bracket: ']',
            line: lineNumber,
            column: i + 1,
            message: `Extra closing bracket ] at line ${lineNumber} - no matching opening bracket`,
          });
        } else {
          const opening = bracketStack.pop();
          if (opening.char !== '[') {
            bracketErrors.push({
              type: 'mismatch',
              expected: '[',
              found: ']',
              line: lineNumber,
              column: i + 1,
              openingLine: opening.line,
              openingColumn: opening.column,
              message: `Mismatched bracket at line ${lineNumber} - expected [ but found ]`,
            });
          } else {
            // Record matched pair for visualization
            bracketPairs.push({
              opening: { line: opening.line, column: opening.column, depth: opening.depth },
              closing: { line: lineNumber, column: i + 1, depth: opening.depth },
            });
          }
        }
      }
    }
  });

  // Check for unclosed brackets (stack not empty)
  if (braceStack.length > 0) {
    const unclosed = braceStack[braceStack.length - 1];
    bracketErrors.push({
      type: 'unclosed',
      bracket: '{',
      line: unclosed.line,
      column: unclosed.column,
      depth: unclosed.depth,
      message: `Unclosed opening brace { at line ${unclosed.line} (depth: ${unclosed.depth}) - missing closing brace`,
    });
  }

  if (parenStack.length > 0) {
    const unclosed = parenStack[parenStack.length - 1];
    bracketErrors.push({
      type: 'unclosed',
      bracket: '(',
      line: unclosed.line,
      column: unclosed.column,
      depth: unclosed.depth,
      message: `Unclosed opening parenthesis ( at line ${unclosed.line} (depth: ${unclosed.depth}) - missing closing parenthesis`,
    });
  }

  if (bracketStack.length > 0) {
    const unclosed = bracketStack[bracketStack.length - 1];
    bracketErrors.push({
      type: 'unclosed',
      bracket: '[',
      line: unclosed.line,
      column: unclosed.column,
      depth: unclosed.depth,
      message: `Unclosed opening bracket [ at line ${unclosed.line} (depth: ${unclosed.depth}) - missing closing bracket`,
    });
  }

  // Add bracket errors to main errors
  bracketErrors.forEach(err => errors.push(err.message));

  // Check for unclosed strings
  const singleQuotes = (code.match(/'/g) || []).length;
  const doubleQuotes = (code.match(/"/g) || []).length;
  if (singleQuotes % 2 !== 0) {
    errors.push('Unclosed single quotes');
  }
  if (doubleQuotes % 2 !== 0) {
    errors.push('Unclosed double quotes');
  }

  // Check for common syntax errors
  if (code.includes('function') && !code.includes('(')) {
    errors.push('Function declaration missing parentheses');
  }

  if (code.includes('=>') && !code.includes('(') && !code.includes('=> {')) {
    errors.push('Arrow function may be missing parentheses');
  }

  // Warn about deep nesting (depth > 5)
  if (maxBraceDepth > 5) {
    errors.push(`Deep brace nesting detected (max depth: ${maxBraceDepth}) - consider refactoring to reduce complexity`);
  }
  if (maxParenDepth > 5) {
    errors.push(`Deep parenthesis nesting detected (max depth: ${maxParenDepth}) - consider refactoring to reduce complexity`);
  }
  if (maxBracketDepth > 5) {
    errors.push(`Deep bracket nesting detected (max depth: ${maxBracketDepth}) - consider refactoring to reduce complexity`);
  }

  // Generate bracket visualization
  const bracketVisualization = generateBracketVisualization(bracePairs, parenPairs, bracketPairs, lines);

  return {
    valid: errors.length === 0,
    errors,
    bracketErrors,
    maxDepths: {
      braces: maxBraceDepth,
      parentheses: maxParenDepth,
      brackets: maxBracketDepth,
    },
    bracketVisualization,
  };
}

/**
 * Generate bracket visualization with tree structure and visual representation
 */
function generateBracketVisualization(bracePairs, parenPairs, bracketPairs, lines) {
  const visualization = {
    braceTree: buildBracketTree(bracePairs, '{', '}'),
    parenTree: buildBracketTree(parenPairs, '(', ')'),
    bracketTree: buildBracketTree(bracketPairs, '[', ']'),
    visualRepresentation: '',
    deepNestingPoints: [],
  };

  // Build visual representation
  let visual = 'Bracket Structure Visualization:\n';
  visual += '═══════════════════════════════════════\n\n';
  
  visual += 'Braces {}:\n';
  visual += visualization.braceTree.visual || 'No braces found\n';
  visual += '\n';
  
  visual += 'Parentheses ():\n';
  visual += visualization.parenTree.visual || 'No parentheses found\n';
  visual += '\n';
  
  visual += 'Brackets []:\n';
  visual += visualization.bracketTree.visual || 'No brackets found\n';
  visual += '\n';
  
  visual += '═══════════════════════════════════════\n';
  visual += `Max Depths: Braces: ${visualization.braceTree.maxDepth || 0}, `;
  visual += `Parentheses: ${visualization.parenTree.maxDepth || 0}, `;
  visual += `Brackets: ${visualization.bracketTree.maxDepth || 0}\n`;

  visualization.visualRepresentation = visual;

  // Identify deep nesting points (depth > 5)
  visualization.deepNestingPoints = [
    ...findDeepNestingPoints(visualization.braceTree, '{', 5),
    ...findDeepNestingPoints(visualization.parenTree, '(', 5),
    ...findDeepNestingPoints(visualization.bracketTree, '[', 5),
  ];

  return visualization;
}

/**
 * Build bracket tree structure for visualization
 */
function buildBracketTree(pairs, openChar, closeChar) {
  if (pairs.length === 0) {
    return { pairs: [], maxDepth: 0, visual: '' };
  }

  // Sort pairs by opening line
  const sortedPairs = [...pairs].sort((a, b) => a.opening.line - b.opening.line);

  // Build hierarchy
  const tree = [];
  let maxDepth = 0;

  sortedPairs.forEach(pair => {
    maxDepth = Math.max(maxDepth, pair.opening.depth + 1);
    tree.push({
      openLine: pair.opening.line,
      openColumn: pair.opening.column,
      closeLine: pair.closing.line,
      closeColumn: pair.closing.column,
      depth: pair.opening.depth,
    });
  });

  // Generate visual representation
  let visual = '';
  tree.forEach(pair => {
    const indent = '  '.repeat(pair.depth);
    visual += `${indent}${openChar} line ${pair.openLine}:${pair.openColumn} → ${closeChar} line ${pair.closeLine}:${pair.closeColumn}\n`;
  });

  return {
    pairs: tree,
    maxDepth,
    visual: visual || 'No brackets found',
  };
}

/**
 * Find deep nesting points in bracket tree
 */
function findDeepNestingPoints(tree, bracketType, depthThreshold) {
  const deepPoints = [];
  
  if (tree.pairs) {
    tree.pairs.forEach(pair => {
      if (pair.depth >= depthThreshold) {
        deepPoints.push({
          bracketType,
          depth: pair.depth,
          openLine: pair.openLine,
          closeLine: pair.closeLine,
        });
      }
    });
  }
  
  return deepPoints;
}

/**
 * Validate imports in code
 */
export async function validateImports(code, filePath) {
  const errors = [];
  const warnings = [];

  // Extract import statements
  const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
  const imports = [];
  let match;

  while ((match = importRegex.exec(code)) !== null) {
    imports.push(match[1]);
  }

  // Check for relative imports
  for (const imp of imports) {
    if (imp.startsWith('./') || imp.startsWith('../')) {
      // Check if the file exists
      const importPath = path.resolve(path.dirname(filePath), imp);

      // Try common extensions
      const extensions = ['.js', '.ts', '.json'];
      let exists = false;

      for (const ext of extensions) {
        try {
          await fs.access(importPath + ext, fs.constants.F_OK);
          exists = true;
          break;
        } catch (e) {
          // File doesn't exist, try next
        }
      }

      // Check for index files
      if (!exists) {
        for (const ext of extensions) {
          try {
            await fs.access(path.join(importPath, 'index' + ext), fs.constants.F_OK);
            exists = true;
            break;
          } catch (e) {
            // File doesn't exist, try next
          }
        }
      }

      if (!exists) {
        errors.push(`Import not found: ${imp}`);
      }
    }
  }

  // Check for circular dependencies (simple check)
  const circularDeps = [];
  for (let i = 0; i < imports.length; i++) {
    for (let j = i + 1; j < imports.length; j++) {
      if (imports[i].includes(imports[j]) && imports[j].includes(imports[i])) {
        circularDeps.push(`${imports[i]} <-> ${imports[j]}`);
      }
    }
  }

  if (circularDeps.length > 0) {
    warnings.push(`Potential circular dependencies: ${circularDeps.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check for anti-patterns in code
 */
export function checkAntiPatterns(code) {
  const issues = [];

  // Check for god functions (functions > 100 lines)
  const functionBlocks = code.match(/function\s+\w+[^{]*\{[\s\S]*?\}/g) || [];
  functionBlocks.forEach(fn => {
    const lines = fn.split('\n').length;
    if (lines > 100) {
      issues.push(`God function detected: ${lines} lines`);
    }
  });

  // Check for deep nesting
  const lines = code.split('\n');
  lines.forEach((line, idx) => {
    const indent = line.search(/\S|$/);
    if (indent > 24) {
      // More than 6 levels of indentation
      issues.push(`Deep nesting detected at line ${idx + 1}: ${indent} spaces`);
    }
  });

  // Check for magic numbers
  const magicNumbers = code.match(/\b\d{4,}\b/g) || [];
  if (magicNumbers.length > 5) {
    issues.push(`Multiple magic numbers detected: ${magicNumbers.slice(0, 5).join(', ')}...`);
  }

  // Check for TODO/FIXME comments
  const todos = code.match(/\/\/\s*(TODO|FIXME|HACK|XXX)/gi) || [];
  if (todos.length > 0) {
    issues.push(`${todos.length} TODO/FIXME comments found`);
  }

  // Check for console.log statements
  const consoleLogs = code.match(/console\.log/g) || [];
  if (consoleLogs.length > 0) {
    issues.push(`${consoleLogs.length} console.log statements found`);
  }

  // Check for empty catch blocks
  const emptyCatch = code.match(/catch\s*\([^)]*\)\s*\{\s*\}/g) || [];
  if (emptyCatch.length > 0) {
    issues.push(`${emptyCatch.length} empty catch blocks`);
  }

  // Check for var usage
  const varUsage = code.match(/\bvar\s+/g) || [];
  if (varUsage.length > 0) {
    issues.push(`${varUsage.length} var declarations (prefer const/let)`);
  }

  return {
    issues,
    issueCount: issues.length,
  };
}

/**
 * Validate naming conventions
 */
export function validateNamingConventions(code) {
  const errors = [];
  const warnings = [];

  // Check function names (camelCase)
  const functionNames = code.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
  functionNames.forEach(fn => {
    const name = fn.replace('function ', '');
    if (name[0] !== name[0].toLowerCase()) {
      warnings.push(`Function ${name} should use camelCase`);
    }
  });

  // Check class names (PascalCase)
  const classNames = code.match(/class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
  classNames.forEach(cls => {
    const name = cls.replace('class ', '');
    if (name[0] !== name[0].toUpperCase()) {
      errors.push(`Class ${name} should use PascalCase`);
    }
  });

  // Check constant names (UPPER_SNAKE_CASE)
  const constDeclarations = code.match(/const\s+([A-Z_][A-Z0-9_]*)\s*=/g) || [];
  constDeclarations.forEach(decl => {
    const name = decl.replace(/const\s+|\s*=/g, '');
    if (name !== name.toUpperCase()) {
      warnings.push(`Constant ${name} should use UPPER_SNAKE_CASE`);
    }
  });

  // Check for file name conventions
  // This would need the file path to check

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Comprehensive validation
 */
export async function validateCodeComprehensive(code, filePath) {
  const results = {
    syntax: { valid: true, errors: [] },
    imports: { valid: true, errors: [], warnings: [] },
    antiPatterns: { issues: [], issueCount: 0 },
    naming: { valid: true, errors: [], warnings: [] },
    overall: { valid: true, errors: [], warnings: [] },
  };

  // Syntax validation
  if (ENABLE_SYNTAX_VALIDATION()) {
    results.syntax = validateSyntax(code);
    results.overall.errors.push(...results.syntax.errors);
  }

  // Import validation
  if (ENABLE_IMPORT_VALIDATION()) {
    results.imports = await validateImports(code, filePath);
    results.overall.errors.push(...results.imports.errors);
    results.overall.warnings.push(...results.imports.warnings);
  }

  // Anti-pattern detection
  if (ENABLE_ANTI_PATTERN_DETECTION()) {
    results.antiPatterns = checkAntiPatterns(code);
    results.overall.warnings.push(...results.antiPatterns.issues);
  }

  // Naming convention validation
  if (ENABLE_NAMING_VALIDATION()) {
    results.naming = validateNamingConventions(code);
    results.overall.errors.push(...results.naming.errors);
    results.overall.warnings.push(...results.naming.warnings);
  }

  results.overall.valid = results.overall.errors.length === 0;

  return results;
}
