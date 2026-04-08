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

  // v1.1.0 C# Bridge handlers
  get_csharp_errors: async args => {
    try {
      const { severityThreshold = 0 } = args;
      const workspace = process.cwd();
      const errors = [];

      // Get VS Code settings
      const config = {
        severityThreshold,
        confidenceThreshold: global.csharpConfig?.confidenceThreshold || 70,
        deduplicateAlerts: global.csharpConfig?.deduplicateAlerts !== false,
        alertCooldown: global.csharpConfig?.alertCooldown || 30,
        detectors: global.csharpConfig?.detectors || {},
      };

      // Scan for .cs files in workspace
      const csFiles = await findCsFiles(workspace);

      for (const filePath of csFiles) {
        const analysis = await analyzeCSharpFile(filePath, config);
        if (analysis.errorCount > 0) {
          errors.push(...analysis.errors.map(e => ({ ...e, filePath })));
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `C# Errors in Workspace (${csFiles.length} files scanned, ${errors.length} errors found):\n\n${
              errors.length > 0
                ? errors.map(e => `  [${e.color.toUpperCase()}] ${e.filePath} (Line ${e.lineRanges?.[0]?.startLine || '?'}): ${e.name} (Confidence: ${e.confidence}%)`).join('\n')
                : '  No C# errors found in workspace.'
            }\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100]`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to get C# errors: ${error.message}` }],
      };
    }
  },

  get_csharp_errors_for_file: async args => {
    if (!args.path) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'ERROR: \'path\' parameter is REQUIRED' }],
      };
    }

    try {
      const { severityThreshold = 0 } = args;

      // Get VS Code settings
      const config = {
        severityThreshold,
        confidenceThreshold: global.csharpConfig?.confidenceThreshold || 70,
        deduplicateAlerts: global.csharpConfig?.deduplicateAlerts !== false,
        alertCooldown: global.csharpConfig?.alertCooldown || 30,
        detectors: global.csharpConfig?.detectors || {},
      };

      const analysis = await analyzeCSharpFile(args.path, config);

      return {
        content: [
          {
            type: 'text',
            text: `C# Errors for ${args.path}:\n\n${
              analysis.errorCount > 0
                ? analysis.errors.map(e => `  [${e.color.toUpperCase()}] ${e.name} (Severity: ${e.severity}, Confidence: ${e.confidence}%)\n    Lines: ${e.lineRanges?.map(r => `${r.startLine}-${r.endLine}`).join(', ') || 'N/A'}\n    Details: ${JSON.stringify(e.details).substring(0, 100)}`).join('\n\n')
                : '  No C# errors found in this file.'
            }\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100]`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to get C# errors for file: ${error.message}` }],
      };
    }
  },

  get_integrity_report: async args => {
    if (!args.path) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'ERROR: \'path\' parameter is REQUIRED' }],
      };
    }

    try {
      const report = await getIntegrityReport(args.path);

      return {
        content: [
          {
            type: 'text',
            text: `C# Integrity Report for ${args.path}:\n\n` +
              '╔════════════════════════════════════════╗\n' +
              `║    INTEGRITY SCORE: ${report.integrityScore}/100    ║\n` +
              '╚════════════════════════════════════════╝\n\n' +
              `Total Errors: ${report.totalErrors}\n` +
              `Critical: ${report.criticalCount} (Red)\n` +
              `Warnings: ${report.warningCount} (Orange)\n` +
              `Environmental Drift: ${report.driftCount} (Magenta)\n\n` +
              'Errors by Rule:\n' +
              Object.entries(report.errorsByRule).map(([rule, count]) => `  ${rule}: ${count}`).join('\n') + '\n\n' +
              'High-Value Rules Violated:\n' +
              (report.context.highValueRulesViolated.length > 0 ? report.context.highValueRulesViolated.map(r => `  - ${r}`).join('\n') : '  None') + '\n\n' +
              'Architectural Drift:\n' +
              (report.context.architecturalDrift.length > 0 ? report.context.architecturalDrift.map(r => `  - ${r}`).join('\n') : '  None') + '\n\n' +
              'Recommendations:\n' +
              report.context.recommendations.map(r => `  • ${r}`).join('\n') + '\n\n' +
              `[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100]`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to get integrity report: ${error.message}` }],
      };
    }
  },

  toggle_csharp_error_type: async args => {
    if (!args.error_id || typeof args.enabled !== 'boolean') {
      return {
        isError: true,
        content: [{ type: 'text', text: 'ERROR: \'error_id\' and \'enabled\' parameters are REQUIRED' }],
      };
    }

    try {
      const rule = errorRules.find(r => r.id === args.error_id);
      if (!rule) {
        return {
          isError: true,
          content: [{ type: 'text', text: `ERROR: Error rule '${args.error_id}' not found` }],
        };
      }

      // Store enabled state in a simple in-memory map (could be persisted to config later)
      const enabledRules = global.csharpEnabledRules || errorRules.map(r => r.id);
      if (args.enabled) {
        if (!enabledRules.includes(args.error_id)) {
          enabledRules.push(args.error_id);
        }
      } else {
        const index = enabledRules.indexOf(args.error_id);
        if (index > -1) {
          enabledRules.splice(index, 1);
        }
      }
      global.csharpEnabledRules = enabledRules;

      return {
        content: [
          {
            type: 'text',
            text: `Error rule '${args.error_id}' is now ${args.enabled ? 'ENABLED' : 'DISABLED'}.\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100]`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to toggle error type: ${error.message}` }],
      };
    }
  },

  set_csharp_ai_informed: async args => {
    if (typeof args.enabled !== 'boolean') {
      return {
        isError: true,
        content: [{ type: 'text', text: 'ERROR: \'enabled\' parameter is REQUIRED and must be a boolean' }],
      };
    }

    try {
      global.csharpAiInformed = args.enabled;
      clearAnalysisCache(); // Clear cache when settings change

      return {
        content: [
          {
            type: 'text',
            text: `Keep AI Informed is now ${args.enabled ? 'ENABLED' : 'DISABLED'}.\n\n` +
              `${args.enabled ? 'C# errors will be automatically injected into file reads based on Surgical Integrity Score throttling.' : 'C# errors will only be returned when explicitly requested via tool calls.'}\n\n` +
              `[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100]`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to set AI informed: ${error.message}` }],
      };
    }
  },

  update_csharp_config: async args => {
    try {
      // Update global config with new settings
      global.csharpConfig = {
        ...global.csharpConfig,
        ...args,
      };

      // Clear caches when config changes
      clearAnalysisCache();
      clearCaches();

      return {
        content: [
          {
            type: 'text',
            text: 'C# Bridge configuration updated:\n\n' +
              `  Confidence Threshold: ${global.csharpConfig.confidenceThreshold || 70}%\n` +
              `  Deduplicate Alerts: ${global.csharpConfig.deduplicateAlerts !== false ? 'Enabled' : 'Disabled'}\n` +
              `  Alert Cooldown: ${global.csharpConfig.alertCooldown || 30}s\n` +
              `  Detectors: ${Object.keys(global.csharpConfig.detectors || {}).length} configured\n\n` +
              `[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100]`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to update config: ${error.message}` }],
      };
    }
  },

  undo_last_surgical_edit: async args => {
    if (!args.path) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'ERROR: \'path\' parameter is REQUIRED' }],
      };
    }

    try {
      const result = await restoreBackup(args.path);

      if (result.success) {
        internalAudit.consecutiveFailures = 0;
        internalAudit.surgicalIntegrityScore = Math.min(100, internalAudit.surgicalIntegrityScore + 5);

        return {
          content: [
            {
              type: 'text',
              text: `Successfully reverted ${args.path} to last backup state.\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100]`,
            },
          ],
        };
      } else {
        internalAudit.consecutiveFailures++;
        internalAudit.surgicalIntegrityScore -= 5;

        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Failed to revert ${args.path}: ${result.error}\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]`,
            },
          ],
        };
      }
    } catch (error) {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 5;

      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Failed to undo last edit: ${error.message}\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]`,
          },
        ],
      };
    }
  },
};

// Helper function to find .cs files in workspace
async function findCsFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules and .git
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.windsurf') {
        files.push(...await findCsFiles(fullPath));
      }
    } else if (entry.name.endsWith('.cs')) {
      files.push(fullPath);
    }
  }

  return files;
}
