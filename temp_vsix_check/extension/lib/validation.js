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
 * Validate syntax of JavaScript/TypeScript code
 */
export function validateSyntax(code) {
  const errors = [];

  // Basic syntax validation
  try {
    // Check for unmatched braces
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`Unmatched braces: ${openBraces} opening, ${closeBraces} closing`);
    }

    // Check for unmatched parentheses
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push(`Unmatched parentheses: ${openParens} opening, ${closeParens} closing`);
    }

    // Check for unmatched brackets
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push(`Unmatched brackets: ${openBrackets} opening, ${closeBrackets} closing`);
    }

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
  } catch (error) {
    errors.push(`Syntax validation error: ${error.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate imports in code
 */
export function validateImports(code, filePath) {
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
  imports.forEach(imp => {
    if (imp.startsWith('./') || imp.startsWith('../')) {
      // Check if the file exists
      const importPath = path.resolve(path.dirname(filePath), imp);

      // Try common extensions
      const extensions = ['.js', '.ts', '.json'];
      let exists = false;

      for (const ext of extensions) {
        try {
          if (fs.existsSync(importPath + ext)) {
            exists = true;
            break;
          }
        } catch (e) {
          // Ignore
        }
      }

      // Check for index files
      for (const ext of extensions) {
        try {
          if (fs.existsSync(path.join(importPath, 'index' + ext))) {
            exists = true;
            break;
          }
        } catch (e) {
          // Ignore
        }
      }

      if (!exists) {
        errors.push(`Import not found: ${imp}`);
      }
    }
  });

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
