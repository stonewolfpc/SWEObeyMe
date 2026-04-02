import fs from "fs/promises";
import path from "path";
import { REQUIRE_IMPACT_ANALYSIS } from "./config.js";
import { analyzeCSharpComplexity, validateCSharpBrackets } from "./csharp-validation.js";
import { analyzeMathExpression } from "./math-safety.js";

/**
 * Context tools for providing comprehensive file context
 */

/**
 * Get comprehensive file context
 */
export async function getFileContext(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Extract imports
    const imports = [];
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    // Extract exports
    const exports = [];
    const exportRegex = /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    // Extract function definitions
    const functions = [];
    const functionRegex = /function\s+(\w+)/g;
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }
    
    // Extract class definitions
    const classes = [];
    const classRegex = /class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      classes.push(match[1]);
    }
    
    // Calculate metrics
    const lineCount = lines.length;
    const charCount = content.length;
    const commentLines = lines.filter(line => line.trim().startsWith('//') || line.trim().startsWith('/*')).length;
    const codeLines = lineCount - commentLines;
    const commentRatio = commentLines / lineCount;

    // Detect language and add language-specific complexity metrics
    let complexityMetrics = {};
    const isCSharp = content.includes('namespace ') && content.includes('using ');
    const isJavaScript = content.includes('import ') || content.includes('function ') || content.includes('const ');

    if (isCSharp) {
      const csharpComplexity = analyzeCSharpComplexity(content);
      const bracketValidation = validateCSharpBrackets(content);
      const mathSafety = analyzeMathExpression(content);

      complexityMetrics = {
        language: 'csharp',
        maxNestingDepth: csharpComplexity.metrics.maxNestingDepth,
        maxMethodComplexity: csharpComplexity.metrics.maxMethodComplexity,
        tryCatchDepth: csharpComplexity.metrics.tryCatchDepth,
        emptyCatchBlocks: csharpComplexity.metrics.emptyCatchBlocks.length,
        missingUsingStatements: csharpComplexity.metrics.missingUsingStatements.length,
        asyncAwaitIssues: csharpComplexity.metrics.asyncAwaitIssues.length,
        bracketValidation: bracketValidation.valid,
        complexMathExpressions: mathSafety.metrics.complexExpressions.length,
        potentialOverflow: mathSafety.metrics.potentialOverflow.length,
        precisionLoss: mathSafety.metrics.precisionLoss.length,
        divisionByZeroRisk: mathSafety.metrics.divisionByZeroRisk.length,
        complexityScore: calculateComplexityScore(csharpComplexity, mathSafety)
      };
    } else if (isJavaScript) {
      const mathSafety = analyzeMathExpression(content);
      complexityMetrics = {
        language: 'javascript',
        complexMathExpressions: mathSafety.metrics.complexExpressions.length,
        potentialOverflow: mathSafety.metrics.potentialOverflow.length,
        divisionByZeroRisk: mathSafety.metrics.divisionByZeroRisk.length,
        complexityScore: calculateJSComplexityScore(content, mathSafety)
      };
    }

    return {
      filePath,
      lineCount,
      charCount,
      commentLines,
      codeLines,
      commentRatio: commentRatio.toFixed(2),
      imports,
      exports,
      functions,
      classes,
      complexityMetrics,
      summary: `${lineCount} lines, ${functions.length} functions, ${classes.length} classes, ${(commentRatio * 100).toFixed(1)}% comments${complexityMetrics.complexityScore ? `, complexity score: ${complexityMetrics.complexityScore}/100` : ''}`
    };
  } catch (error) {
    throw new Error(`Failed to get file context: ${error.message}`);
  }
}

/**
 * Calculate overall complexity score for C# code (0-100, higher is better)
 */
function calculateComplexityScore(csharpComplexity, mathSafety) {
  let score = 100;

  // Deduct for high nesting depth
  score -= Math.min(20, csharpComplexity.metrics.maxNestingDepth * 2);

  // Deduct for high method complexity
  score -= Math.min(15, csharpComplexity.metrics.maxMethodComplexity);

  // Deduct for deep try-catch nesting
  score -= Math.min(15, csharpComplexity.metrics.tryCatchDepth * 3);

  // Deduct for empty catch blocks
  score -= csharpComplexity.metrics.emptyCatchBlocks.length * 10;

  // Deduct for missing using statements
  score -= csharpComplexity.metrics.missingUsingStatements.length * 15;

  // Deduct for async/await issues
  score -= csharpComplexity.metrics.asyncAwaitIssues.length * 5;

  // Deduct for complex math expressions
  score -= mathSafety.metrics.complexExpressions.length * 3;

  // Deduct for potential overflow risks
  score -= mathSafety.metrics.potentialOverflow.length * 8;

  // Deduct for precision loss issues
  score -= mathSafety.metrics.precisionLoss.length * 5;

  // Deduct for division by zero risks
  score -= mathSafety.metrics.divisionByZeroRisk.length * 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate complexity score for JavaScript code
 */
function calculateJSComplexityScore(content, mathSafety) {
  let score = 100;

  // Deduct for complex math expressions
  score -= mathSafety.metrics.complexExpressions.length * 3;

  // Deduct for potential overflow risks
  score -= mathSafety.metrics.potentialOverflow.length * 8;

  // Deduct for division by zero risks
  score -= mathSafety.metrics.divisionByZeroRisk.length * 10;

  // Check for deep nesting
  const lines = content.split('\n');
  let maxDepth = 0;
  lines.forEach(line => {
    const depth = (line.match(/[{}]/g) || []).length;
    maxDepth = Math.max(maxDepth, depth);
  });
  score -= Math.min(20, maxDepth * 2);

  return Math.max(0, Math.min(100, score));
}

/**
 * Analyze change impact
 */
export async function analyzeChangeImpact(filePath, changes) {
  try {
    const impact = {
      affectedFiles: [],
      affectedFunctions: [],
      affectedClasses: [],
      breakingChanges: [],
      warnings: []
    };
    
    // Get current file context
    const context = await getFileContext(filePath);
    
    // Check if changes affect exports
    if (changes.includes('export')) {
      impact.affectedFunctions.push(...context.exports);
      impact.warnings.push('Changes to exports may affect dependent files');
    }
    
    // Check if changes affect functions
    context.functions.forEach(fn => {
      if (changes.includes(fn)) {
        impact.affectedFunctions.push(fn);
        impact.warnings.push(`Function ${fn} changed, check for callers`);
      }
    });
    
    // Check if changes affect classes
    context.classes.forEach(cls => {
      if (changes.includes(cls)) {
        impact.affectedClasses.push(cls);
        impact.warnings.push(`Class ${cls} changed, check for instances`);
      }
    });
    
    // Check for breaking changes
    if (changes.includes('delete') || changes.includes('remove')) {
      impact.breakingChanges.push('Code deletion detected');
    }
    
    if (changes.includes('function') || changes.includes('class')) {
      impact.breakingChanges.push('Function/class structure changed');
    }
    
    // Try to find files that import this file
    const dir = path.dirname(filePath);
    const files = await fs.readdir(dir);
    const dependentFiles = [];
    
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.ts')) {
        const filePath2 = path.join(dir, file);
        try {
          const content = await fs.readFile(filePath2, 'utf-8');
          const relativePath = path.relative(dir, filePath).replace(/\\/g, '/');
          if (content.includes(relativePath) || content.includes(`from './${relativePath.replace('.js', '')}`)) {
            dependentFiles.push(file);
          }
        } catch (e) {
          // Ignore
        }
      }
    }
    
    impact.affectedFiles = dependentFiles;
    
    return impact;
  } catch (error) {
    throw new Error(`Failed to analyze change impact: ${error.message}`);
  }
}

/**
 * Get symbol references
 */
export async function getSymbolReferences(filePath, symbol) {
  try {
    const references = {
      symbol,
      filePath,
      references: [],
      definition: null,
      count: 0
    };
    
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Find definition
    const definitionRegex = new RegExp(`(?:function|class|const|let|var)\\s+${symbol}\\b`, 'g');
    lines.forEach((line, idx) => {
      if (definitionRegex.test(line)) {
        references.definition = {
          line: idx + 1,
          content: line.trim()
        };
      }
    });
    
    // Find references
    const referenceRegex = new RegExp(`\\b${symbol}\\b`, 'g');
    lines.forEach((line, idx) => {
      const matches = line.match(referenceRegex);
      if (matches && matches.length > 0) {
        // Skip the definition line
        if (references.definition && references.definition.line === idx + 1) {
          return;
        }
        
        references.references.push({
          line: idx + 1,
          content: line.trim(),
          count: matches.length
        });
      }
    });
    
    references.count = references.references.length;
    
    return references;
  } catch (error) {
    throw new Error(`Failed to get symbol references: ${error.message}`);
  }
}
