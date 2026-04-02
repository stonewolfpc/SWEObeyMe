import fs from "fs/promises";
import path from "path";
import { ENABLE_SYNTAX_VALIDATION } from "./config.js";
import { validateSyntax } from "./validation.js";

/**
 * Verification tools for validating code before applying changes
 */

/**
 * Dry run a write operation
 */
export async function dryRunWriteFile(filePath, content) {
  const result = {
    success: true,
    errors: [],
    warnings: [],
    wouldChange: false,
    lineCount: 0,
    fileSize: content.length
  };
  
  try {
    // Check if file exists
    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    
    if (exists) {
      result.wouldChange = true;
      const currentContent = await fs.readFile(filePath, 'utf-8');
      
      // Check if content is the same
      if (currentContent === content) {
        result.warnings.push('Content is identical to current file');
        result.wouldChange = false;
      }
    } else {
      result.wouldChange = true;
      result.warnings.push('New file will be created');
    }
    
    // Validate syntax
    if (ENABLE_SYNTAX_VALIDATION()) {
      const syntaxResult = validateSyntax(content);
      if (!syntaxResult.valid) {
        result.success = false;
        result.errors.push(...syntaxResult.errors);
      }
    }
    
    // Check line count
    const lineCount = content.split('\n').length;
    result.lineCount = lineCount;
    
    // Check for forbidden patterns
    const forbiddenPatterns = [
      'console.log',
      'TODO',
      'FIXME',
      'HACK',
      'debugger',
      'eval('
    ];
    
    forbiddenPatterns.forEach(pattern => {
      if (content.includes(pattern)) {
        result.errors.push(`Forbidden pattern detected: ${pattern}`);
      }
    });
    
    result.success = result.errors.length === 0;
    
  } catch (error) {
    result.success = false;
    result.errors.push(`Dry run failed: ${error.message}`);
  }
  
  return result;
}

/**
 * Verify syntax
 */
export async function verifySyntax(code, language = 'javascript') {
  const { validateSyntax } = await import('./validation.js');
  return validateSyntax(code, language);
}

/**
 * Verify imports
 */
export async function verifyImports(code, filePath) {
  const { validateImports } = await import('./validation.js');
  return validateImports(code, filePath);
}

/**
 * Verify type safety (basic check)
 */
export function verifyTypeSafety(code) {
  const errors = [];
  
  // Check for TypeScript type annotations
  const hasTypeAnnotations = /:\s*(string|number|boolean|any|object|void|null)/.test(code);
  
  // Check for potential null/undefined issues
  const potentialNullIssues = code.match(/\w+\.\w+/g) || [];
  potentialNullIssues.forEach(ref => {
    if (!ref.includes('!') && !ref.includes('?')) {
      // This is a simplified check - real type checking would require TypeScript compiler
    }
  });
  
  // Check for any types (anti-pattern)
  const anyTypes = code.match(/:\s*any\b/g) || [];
  if (anyTypes.length > 0) {
    errors.push(`${anyTypes.length} uses of 'any' type detected`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    hasTypeAnnotations
  };
}

/**
 * Verify change after applying
 */
export async function verifyChangeAfterApply(filePath, expectedContent) {
  const result = {
    success: true,
    errors: [],
    warnings: []
  };
  
  try {
    const actualContent = await fs.readFile(filePath, 'utf-8');
    
    if (actualContent !== expectedContent) {
      result.success = false;
      result.errors.push('Content does not match expected content');
      
      // Find differences
      const expectedLines = expectedContent.split('\n');
      const actualLines = actualContent.split('\n');
      const maxLines = Math.max(expectedLines.length, actualLines.length);
      
      for (let i = 0; i < maxLines; i++) {
        if (expectedLines[i] !== actualLines[i]) {
          result.errors.push(`Line ${i + 1} differs`);
        }
      }
    }
    
    // Verify syntax
    if (ENABLE_SYNTAX_VALIDATION()) {
      const syntaxResult = validateSyntax(actualContent);
      if (!syntaxResult.valid) {
        result.success = false;
        result.errors.push(...syntaxResult.errors);
      }
    }
    
  } catch (error) {
    result.success = false;
    result.errors.push(`Verification failed: ${error.message}`);
  }
  
  return result;
}
