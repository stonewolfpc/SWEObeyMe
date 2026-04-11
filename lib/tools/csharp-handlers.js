/**
 * C# specific tool handlers
 * Provides specialized tools for C# .NET 8/10 development
 */

import fs from 'fs/promises';
import {
  validateCSharpCode,
  validateCSharpBrackets,
  analyzeCSharpComplexity,
  detectNestedTryCatch,
  visualizeScopeDepth,
} from '../csharp-validation.js';
import {
  validateMathSafety,
  analyzeMathExpression,
  validateCSharpMath,
  suggestMathImprovements,
} from '../math-safety.js';
import {
  analyzeCSharpFile,
  getIntegrityReport,
  clearAnalysisCache,
  clearCaches,
  errorRules,
} from '../csharp-bridge.js';
import { internalAudit } from '../enforcement.js';
import { restoreBackup } from '../backup.js';
import path from 'path';

/**
 * C# tool handlers
 */
export const csharpHandlers = {
  /**
   * Validate C# code comprehensively
   */
  validate_csharp_code: async args => {
    try {
      const content = await fs.readFile(args.path, 'utf-8');
      const result = validateCSharpCode(content);

      return {
        content: [
          {
            type: 'text',
            text: `C# Code Validation for ${args.path}:

VALID: ${result.valid ? 'YES' : 'NO'}

CRITICAL ISSUES (${result.criticalIssues.length}):
${result.criticalIssues.length > 0 ? result.criticalIssues.map(i => `  Line ${i.line}: ${i.message}`).join('\n') : '  None'}

WARNINGS (${result.warnings.length}):
${result.warnings.length > 0 ? result.warnings.map(i => `  Line ${i.line}: ${i.message}`).join('\n') : '  None'}

METRICS:
  Max Nesting Depth: ${result.metrics.maxNestingDepth}
  Max Method Complexity: ${result.metrics.maxMethodComplexity}
  Try-Catch Depth: ${result.metrics.tryCatchDepth}
  Empty Catch Blocks: ${result.metrics.emptyCatchBlocks.length}
  Missing Using Statements: ${result.metrics.missingUsingStatements.length}
  Async/Await Issues: ${result.metrics.asyncAwaitIssues.length}

SUMMARY:
  Complexity: ${result.summary.complexity.join('\n  ')}
  Brackets: ${result.summary.brackets}
  Try-Catch: ${result.summary.tryCatch}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Validation failed: ${error.message}` }],
      };
    }
  },

  /**
   * Validate bracket matching in C# code
   */
  validate_csharp_brackets: async args => {
    try {
      const content = await fs.readFile(args.path, 'utf-8');
      const result = validateCSharpBrackets(content);

      return {
        content: [
          {
            type: 'text',
            text: `Bracket Validation for ${args.path}:

VALID: ${result.valid ? 'YES' : 'NO'}

${
  result.valid
    ? 'All brackets properly matched!'
    : `ISSUES (${result.issues.length}):
${result.issues.map(i => `  Line ${i.line}, Column ${i.column}: ${i.message}`).join('\n')}`
}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Bracket validation failed: ${error.message}` }],
      };
    }
  },

  /**
   * Analyze C# code complexity
   */
  analyze_csharp_complexity: async args => {
    try {
      const content = await fs.readFile(args.path, 'utf-8');
      const result = analyzeCSharpComplexity(content);

      return {
        content: [
          {
            type: 'text',
            text: `C# Complexity Analysis for ${args.path}:

METRICS:
  Max Nesting Depth: ${result.metrics.maxNestingDepth}
  Max Method Complexity: ${result.metrics.maxMethodComplexity}
  Try-Catch Depth: ${result.metrics.tryCatchDepth}
  Empty Catch Blocks: ${result.metrics.emptyCatchBlocks.length}
  Missing Using Statements: ${result.metrics.missingUsingStatements.length}
  Async/Await Issues: ${result.metrics.asyncAwaitIssues.length}

DETAILED ISSUES (${result.issues.length}):
${result.issues.map(i => `  [${i.type}] Line ${i.line}: ${i.message}`).join('\n') || '  No issues found'}

SUMMARY:
${result.summary.join('\n  ')}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Complexity analysis failed: ${error.message}` }],
      };
    }
  },

  /**
   * Detect nested try-catch blocks
   */
  detect_nested_try_catch: async args => {
    try {
      const content = await fs.readFile(args.path, 'utf-8');
      const result = detectNestedTryCatch(content);

      return {
        content: [
          {
            type: 'text',
            text: `Nested Try-Catch Analysis for ${args.path}:

MAX DEPTH: ${result.maxDepth}
${result.maxDepth > 3 ? '⚠️ WARNING: Deep nesting detected!' : '✓ Try-catch nesting is acceptable'}

ISSUES (${result.issues.length}):
${result.issues.length > 0 ? result.issues.map(i => `  Line ${i.line} (Depth ${i.depth}): ${i.message}`).join('\n') : '  No deeply nested try-catch blocks found'}

SUMMARY:
  ${result.summary}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Try-catch detection failed: ${error.message}` }],
      };
    }
  },

  /**
   * Visualize scope depth
   */
  visualize_scope_depth: async args => {
    try {
      const content = await fs.readFile(args.path, 'utf-8');
      const visualization = visualizeScopeDepth(content);

      return {
        content: [
          {
            type: 'text',
            text: `Scope Depth Visualization for ${args.path}:
(│ represents nesting level, [n] shows depth)

${visualization}

Legend:
  │  - Nesting level
  [n] - Depth level
  ⚠️  - Warning: depth > 5`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Scope visualization failed: ${error.message}` }],
      };
    }
  },

  /**
   * Validate math safety in C# code
   */
  validate_math_safety: async args => {
    try {
      const content = await fs.readFile(args.path, 'utf-8');
      const result = validateMathSafety(content);

      return {
        content: [
          {
            type: 'text',
            text: `Math Safety Validation for ${args.path}:

VALID: ${result.valid ? 'YES' : 'NO'}

CRITICAL ISSUES (${result.criticalIssues.length}):
${result.criticalIssues.length > 0 ? result.criticalIssues.map(i => `  Line ${i.line}: ${i.message}`).join('\n') : '  None'}

INFO ISSUES (${result.infoIssues.length}):
${result.infoIssues.length > 0 ? result.infoIssues.map(i => `  Line ${i.line}: ${i.message}`).join('\n') : '  None'}

METRICS:
  Complex Expressions: ${result.metrics.complexExpressions.length}
  Potential Overflow: ${result.metrics.potentialOverflow.length}
  Precision Loss: ${result.metrics.precisionLoss.length}
  Division by Zero Risk: ${result.metrics.divisionByZeroRisk.length}
  Operator Precedence Issues: ${result.metrics.operatorPrecedenceIssues.length}

SUMMARY:
  General: ${result.summary.general.join('\n  ')}
  C# Specific: ${result.summary.csharp}
  Suggestions: ${result.summary.suggestions}

IMPROVEMENT SUGGESTIONS (${result.suggestions.length}):
${result.suggestions.length > 0 ? result.suggestions.map(s => `  Line ${s.line}: ${s.suggestion}`).join('\n') : '  No suggestions'}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Math safety validation failed: ${error.message}` }],
      };
    }
  },

  /**
   * Analyze math expressions
   */
  analyze_math_expressions: async args => {
    try {
      const content = await fs.readFile(args.path, 'utf-8');
      const result = analyzeMathExpression(content);

      return {
        content: [
          {
            type: 'text',
            text: `Math Expression Analysis for ${args.path}:

ISSUES (${result.issues.length}):
${result.issues.length > 0 ? result.issues.map(i => `  [${i.type}] Line ${i.line}: ${i.message}`).join('\n') : '  No issues found'}

DETAILED METRICS:
  Complex Expressions: ${result.metrics.complexExpressions.length}
  Potential Overflow: ${result.metrics.potentialOverflow.length}
  Precision Loss: ${result.metrics.precisionLoss.length}
  Division by Zero Risk: ${result.metrics.divisionByZeroRisk.length}
  Operator Precedence Issues: ${result.metrics.operatorPrecedenceIssues.length}

SUMMARY:
${result.summary.join('\n  ')}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Math expression analysis failed: ${error.message}` }],
      };
    }
  },

  /**
   * Validate C# specific math patterns
   */
  validate_csharp_math: async args => {
    try {
      const content = await fs.readFile(args.path, 'utf-8');
      const result = validateCSharpMath(content);

      return {
        content: [
          {
            type: 'text',
            text: `C# Math Pattern Validation for ${args.path}:

ISSUES (${result.issues.length}):
${result.issues.length > 0 ? result.issues.map(i => `  [${i.type}] Line ${i.line}: ${i.message}`).join('\n') : '  No issues found'}

SUMMARY:
  ${result.summary}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `C# math validation failed: ${error.message}` }],
      };
    }
  },

  /**
   * Get math improvement suggestions
   */
  suggest_math_improvements: async args => {
    try {
      const content = await fs.readFile(args.path, 'utf-8');
      const suggestions = suggestMathImprovements(content);

      return {
        content: [
          {
            type: 'text',
            text: `Math Improvement Suggestions for ${args.path}:

SUGGESTIONS (${suggestions.length}):
${suggestions.length > 0 ? suggestions.map(s => `  Line ${s.line} [${s.type}]: ${s.suggestion}`).join('\n') : '  No improvement suggestions'}

Note: These are suggestions for improving code quality and maintainability.`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Math suggestions failed: ${error.message}` }],
      };
    }
  },

  /**
   * Comprehensive C# health check
   */
  csharp_health_check: async args => {
    try {
      const content = await fs.readFile(args.path, 'utf-8');

      // Run all validations
      const codeValidation = validateCSharpCode(content);
      const bracketValidation = validateCSharpBrackets(content);
      const mathValidation = validateMathSafety(content);
      const complexity = analyzeCSharpComplexity(content);
      const tryCatch = detectNestedTryCatch(content);

      // Calculate overall health score
      let healthScore = 100;
      healthScore -= codeValidation.criticalIssues.length * 15;
      healthScore -= codeValidation.warnings.length * 5;
      healthScore -= !bracketValidation.valid ? 20 : 0;
      healthScore -= mathValidation.criticalIssues.length * 10;
      healthScore -= complexity.metrics.emptyCatchBlocks.length * 10;
      healthScore -= complexity.metrics.missingUsingStatements.length * 15;
      healthScore -= tryCatch.maxDepth > 3 ? (tryCatch.maxDepth - 3) * 10 : 0;

      healthScore = Math.max(0, Math.min(100, healthScore));

      const healthStatus =
        healthScore >= 80
          ? 'EXCELLENT'
          : healthScore >= 60
            ? 'GOOD'
            : healthScore >= 40
              ? 'FAIR'
              : 'POOR';

      return {
        content: [
          {
            type: 'text',
            text: `C# Health Check for ${args.path}:

╔════════════════════════════════════════╗
║         HEALTH SCORE: ${healthScore}/100         ║
║           STATUS: ${healthStatus.padEnd(15)}║
╚════════════════════════════════════════╝

📊 METRICS:
  Max Nesting Depth: ${complexity.metrics.maxNestingDepth}
  Max Method Complexity: ${complexity.metrics.maxMethodComplexity}
  Try-Catch Depth: ${tryCatch.maxDepth}
  Empty Catch Blocks: ${complexity.metrics.emptyCatchBlocks.length}
  Missing Using Statements: ${complexity.metrics.missingUsingStatements.length}
  Bracket Validation: ${bracketValidation.valid ? '✓ PASS' : '✗ FAIL'}
  Complex Math Expressions: ${mathValidation.metrics.complexExpressions.length}
  Potential Overflow: ${mathValidation.metrics.potentialOverflow.length}

⚠️  CRITICAL ISSUES (${codeValidation.criticalIssues.length + mathValidation.criticalIssues.length}):
${
  codeValidation.criticalIssues.length + mathValidation.criticalIssues.length > 0
    ? [...codeValidation.criticalIssues, ...mathValidation.criticalIssues]
      .map(i => `  Line ${i.line}: ${i.message}`)
      .join('\n')
    : '  None'
}

⚡ WARNINGS (${codeValidation.warnings.length + mathValidation.infoIssues.length}):
${
  codeValidation.warnings.length + mathValidation.infoIssues.length > 0
    ? [...codeValidation.warnings, ...mathValidation.infoIssues]
      .map(i => `  Line ${i.line}: ${i.message}`)
      .join('\n')
    : '  None'
}

💡 RECOMMENDATIONS:
${healthScore < 80 ? '  Consider refactoring to improve code quality and maintainability.' : '  Code is in good shape! Keep up the good work.'}
${complexity.metrics.missingUsingStatements.length > 0 ? '  • Add using statements for IDisposable objects to prevent resource leaks' : ''}
${complexity.metrics.emptyCatchBlocks.length > 0 ? '  • Remove or add proper error handling to empty catch blocks' : ''}
${tryCatch.maxDepth > 3 ? `  • Reduce try-catch nesting depth (currently ${tryCatch.maxDepth})` : ''}
${!bracketValidation.valid ? '  • Fix bracket matching issues' : ''}
${mathValidation.metrics.potentialOverflow.length > 0 ? '  • Add overflow protection for large number calculations' : ''}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Health check failed: ${error.message}` }],
      };
    }
  },
};

// Bridge handlers extracted to: lib/tools/csharp/bridge-handlers.js
