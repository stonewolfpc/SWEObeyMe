import {
  MAX_LINES,
  FORBIDDEN_PATTERNS,
  CSHARP_ENABLE_BRACKET_VALIDATION,
  CSHARP_MAX_NESTING_DEPTH,
  CSHARP_MAX_TRY_CATCH_DEPTH,
} from './config.js';
import {
  validateCSharpBrackets,
  analyzeCSharpComplexity,
  detectNestedTryCatch,
} from './csharp-validation.js';

// ENFORCEMENT RULES - Now configurable through config system
export const getEnforcementRules = () => ({
  MAX_LINES: MAX_LINES(),
  FORBIDDEN_PATTERNS: FORBIDDEN_PATTERNS().map(p => new RegExp(p, 'g')),
  MANDATORY_COMMENTS: true,
  STRICT_MODE: true,
});

// Backward compatibility - use current config values
export const ENFORCEMENT_RULES = getEnforcementRules();

// PHASE 10: Personality Layer - The "Soul" of the Governor
export const CONSTITUTION = {
  TONE: 'Surgical, Professional, Minimalist',
  MANDATE: 'Protect the codebase from digital debt and file bloat.',
  RECOVERY_MODE: false,
  ERROR_THRESHOLD: 3, // Max errors before mandatory "Deep Scan"
};

export const internalAudit = {
  consecutiveFailures: 0,
  lastHealthCheck: Date.now(),
  surgicalIntegrityScore: 100,
  // Tool success metrics tracking
  toolMetrics: {
    totalCalls: 0,
    totalSuccesses: 0,
    totalFailures: 0,
    tools: {},
  },
  // Performance metrics
  performanceMetrics: {
    averageResponseTime: 0,
    slowestTool: null,
    slowestTime: 0,
  },
  // Error type tracking
  errorTypes: {
    validation: 0,
    permission: 0,
    notFound: 0,
    syntax: 0,
    loop: 0,
    other: 0,
  },
};

/**
 * Record tool call for metrics tracking
 */
export function recordToolCall(toolName, success, errorType = null, responseTime = 0) {
  internalAudit.toolMetrics.totalCalls++;

  if (!internalAudit.toolMetrics.tools[toolName]) {
    internalAudit.toolMetrics.tools[toolName] = {
      calls: 0,
      successes: 0,
      failures: 0,
      successRate: 0,
      lastCalled: null,
      averageResponseTime: 0,
    };
  }

  const toolMetrics = internalAudit.toolMetrics.tools[toolName];
  toolMetrics.calls++;
  toolMetrics.lastCalled = Date.now();

  if (success) {
    toolMetrics.successes++;
    internalAudit.toolMetrics.totalSuccesses++;
  } else {
    toolMetrics.failures++;
    internalAudit.toolMetrics.totalFailures++;

    // Track error type
    if (errorType && internalAudit.errorTypes[errorType] !== undefined) {
      internalAudit.errorTypes[errorType]++;
    } else if (errorType) {
      internalAudit.errorTypes.other++;
    }
  }

  // Calculate success rate
  toolMetrics.successRate = (toolMetrics.successes / toolMetrics.calls) * 100;

  // Track performance
  if (responseTime > 0) {
    toolMetrics.averageResponseTime =
      (toolMetrics.averageResponseTime * (toolMetrics.calls - 1) + responseTime) / toolMetrics.calls;

    if (responseTime > internalAudit.performanceMetrics.slowestTime) {
      internalAudit.performanceMetrics.slowestTime = responseTime;
      internalAudit.performanceMetrics.slowestTool = toolName;
    }
  }

  // Update overall average response time
  if (internalAudit.toolMetrics.totalCalls > 0) {
    const totalResponseTime = Object.values(internalAudit.toolMetrics.tools).reduce(
      (sum, tool) => sum + tool.averageResponseTime * tool.calls,
      0
    );
    internalAudit.performanceMetrics.averageResponseTime =
      totalResponseTime / internalAudit.toolMetrics.totalCalls;
  }
}

/**
 * Get tool metrics report
 */
export function getToolMetricsReport() {
  const overallSuccessRate =
    internalAudit.toolMetrics.totalCalls > 0
      ? (internalAudit.toolMetrics.totalSuccesses / internalAudit.toolMetrics.totalCalls) * 100
      : 100;

  return {
    overall: {
      totalCalls: internalAudit.toolMetrics.totalCalls,
      successes: internalAudit.toolMetrics.totalSuccesses,
      failures: internalAudit.toolMetrics.totalFailures,
      successRate: overallSuccessRate.toFixed(2),
      surgicalIntegrityScore: internalAudit.surgicalIntegrityScore,
      consecutiveFailures: internalAudit.consecutiveFailures,
    },
    performance: {
      averageResponseTime: internalAudit.performanceMetrics.averageResponseTime.toFixed(2),
      slowestTool: internalAudit.performanceMetrics.slowestTool,
      slowestTime: internalAudit.performanceMetrics.slowestTime.toFixed(2),
    },
    errorTypes: internalAudit.errorTypes,
    tools: internalAudit.toolMetrics.tools,
  };
}

/**
 * Validates code content against architectural rules.
 * @param {string} content - The code to check.
 * @param {string} language - Optional language parameter for language-specific validation.
 * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
 */
export function validateCode(content, language = null) {
  const errors = [];
  const warnings = [];
  const lines = content.split(/\r\n|\r|\n/).length;

  // Basic line count validation
  if (lines > ENFORCEMENT_RULES.MAX_LINES) {
    errors.push(`Line count ${lines} exceeds maximum of ${ENFORCEMENT_RULES.MAX_LINES}.`);
  }

  // Forbidden pattern validation
  ENFORCEMENT_RULES.FORBIDDEN_PATTERNS.forEach(pattern => {
    if (pattern.test(content)) {
      errors.push(`Forbidden pattern detected: ${pattern.toString()}`);
    }
  });

  // C# specific validations
  if (language === 'csharp' || (content.includes('namespace ') && content.includes('using '))) {
    // Bracket validation
    if (CSHARP_ENABLE_BRACKET_VALIDATION()) {
      const bracketValidation = validateCSharpBrackets(content);
      if (!bracketValidation.valid) {
        bracketValidation.issues.forEach(issue => {
          errors.push(
            `Bracket error at line ${issue.line}, column ${issue.column}: ${issue.message}`
          );
        });
      }
    }

    // Complexity validation
    const complexity = analyzeCSharpComplexity(content);
    if (complexity.metrics.maxNestingDepth > CSHARP_MAX_NESTING_DEPTH()) {
      errors.push(
        `Nesting depth ${complexity.metrics.maxNestingDepth} exceeds maximum of ${CSHARP_MAX_NESTING_DEPTH()}.`
      );
    }

    // Try-catch depth validation
    const tryCatch = detectNestedTryCatch(content);
    if (tryCatch.maxDepth > CSHARP_MAX_TRY_CATCH_DEPTH()) {
      errors.push(
        `Try-catch nesting depth ${tryCatch.maxDepth} exceeds maximum of ${CSHARP_MAX_TRY_CATCH_DEPTH()}.`
      );
    }

    // Add complexity issues as warnings
    complexity.issues.forEach(issue => {
      if (issue.type === 'EMPTY_CATCH' || issue.type === 'MISSING_USING') {
        errors.push(`Line ${issue.line}: ${issue.message}`);
      } else {
        warnings.push(`Line ${issue.line}: ${issue.message}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Attempts to repair common JSON malformations from AI output.
 * @param {string} rawString - The potentially broken JSON string.
 * @returns {Object|null} - Repaired object or null if unfixable.
 */
export function repairJson(rawString) {
  try {
    // 1. Clean up common AI "Markdown" wrapping
    let clean = rawString.replace(/```json|```/g, '').trim();

    // 2. Fix trailing commas before closing braces
    clean = clean.replace(/,\s*([\]}])/g, '$1');

    return JSON.parse(clean);
  } catch (e) {
    console.error(`[REPAIR] Failed to auto-fix JSON: ${e.message}`);
    return null;
  }
}

/**
 * Ensures code follows the "Surgical" formatting rules automatically.
 */
export function autoCorrectCode(content) {
  let fixed = content;
  // Auto-remove forbidden patterns instead of just blocking (Phase 6 upgrade)
  ENFORCEMENT_RULES.FORBIDDEN_PATTERNS.forEach(pattern => {
    fixed = fixed.replace(pattern, '// [REMOVED BY SWEObeyMe]: Forbidden Pattern');
  });
  return fixed;
}
