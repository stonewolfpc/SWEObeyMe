/**
 * Automated Rule Enforcement System
 * Automatically enforces architectural rules without requiring explicit AI intervention
 * Provides proactive guidance, automatic refactoring, and violation blocking
 */

import fs from 'fs';
import path from 'path';

/**
 * Rule Violation Types
 */
export const ViolationType = {
  FILE_SIZE: 'file_size',
  SEPARATION_OF_CONCERNS: 'separation_of_concerns',
  MONOLITHIC_FILE: 'monolithic_file',
  FORBIDDEN_PATTERN: 'forbidden_pattern',
  MISSING_IMPORTS: 'missing_imports',
  DUPLICATE_CODE: 'duplicate_code',
  DEEP_NESTING: 'deep_nesting',
  LONG_FUNCTION: 'long_function',
  FAKE_IMPLEMENTATION: 'fake_implementation',
};

/**
 * Severity Levels
 */
export const Severity = {
  BLOCKING: 'blocking', // Prevents the operation
  ERROR: 'error', // Requires correction
  WARNING: 'warning', // Suggests improvement
  INFO: 'info', // Informational
};

/**
 * Automated Rule Enforcement Engine
 */
export class AutoEnforcementEngine {
  constructor(options = {}) {
    this.rules = new Map();
    this.violations = new Map();
    this.enabled = options.enabled !== false;

    // Default rule thresholds
    this.thresholds = {
      maxFileSize: options.maxFileSize || 500,
      maxFunctionLength: options.maxFunctionLength || 50,
      maxNestingDepth: options.maxNestingDepth || 4,
      maxFunctionCount: options.maxFunctionCount || 10,
      maxClassCount: options.maxClassCount || 5,
      ...options.thresholds,
    };

    // Forbidden patterns
    this.forbiddenPatterns = options.forbiddenPatterns || [
      /console\.log\(/,
      /debugger/,
      /TODO/,
      /FIXME/,
      /XXX/,
      // Fake implementation patterns
      /in real implementation/i,
      /in production/i,
      /placeholder/i,
      /mock implementation/i,
      /stub implementation/i,
      /not implemented/i,
      /implement later/i,
      /add implementation/i,
      /coming soon/i,
      /work in progress/i,
      /wip/i,
      /\/\/\s*TODO/i,
      /\/\/\s*FIXME/i,
      /\/\/\s*HACK/i,
      /throw new Error\(['"]not implemented/i,
    ];

    // Initialize default rules
    this.initializeDefaultRules();
  }

  /**
   * Initialize default enforcement rules
   */
  initializeDefaultRules() {
    // File size rule
    this.registerRule({
      id: 'file_size_limit',
      type: ViolationType.FILE_SIZE,
      severity: Severity.BLOCKING,
      description: 'File exceeds maximum size limit',
      check: (file, content) => {
        const lineCount = content.split('\n').length;
        return {
          violated: lineCount > this.thresholds.maxFileSize,
          details: { lineCount, limit: this.thresholds.maxFileSize },
        };
      },
      fix: (file, content) => this.suggestFileSplit(file, content),
    });

    // Monolithic file detection
    this.registerRule({
      id: 'monolithic_file',
      type: ViolationType.MONOLITHIC_FILE,
      severity: Severity.ERROR,
      description: 'File handles multiple concerns (monolithic)',
      check: (file, content) => {
        const functionCount = (content.match(/function\s+\w+/g) || []).length;
        const classCount = (content.match(/class\s+\w+/g) || []).length;
        const violated =
          functionCount > this.thresholds.maxFunctionCount ||
          classCount > this.thresholds.maxClassCount;
        return {
          violated,
          details: { functionCount, classCount, thresholds: this.thresholds },
        };
      },
      fix: (file, content) => this.suggestSeparationOfConcerns(file, content),
    });

    // Forbidden pattern detection
    this.registerRule({
      id: 'forbidden_patterns',
      type: ViolationType.FORBIDDEN_PATTERN,
      severity: Severity.ERROR,
      description: 'File contains forbidden patterns',
      check: (file, content) => {
        const foundPatterns = [];
        for (const pattern of this.forbiddenPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            foundPatterns.push({ pattern: pattern.toString(), count: matches.length });
          }
        }
        return {
          violated: foundPatterns.length > 0,
          details: { patterns: foundPatterns },
        };
      },
      fix: (file, content) => this.suggestPatternRemoval(file, content),
    });

    // Deep nesting detection
    this.registerRule({
      id: 'deep_nesting',
      type: ViolationType.DEEP_NESTING,
      severity: Severity.WARNING,
      description: 'File contains deeply nested code',
      check: (file, content) => {
        const maxDepth = this.calculateMaxNestingDepth(content);
        return {
          violated: maxDepth > this.thresholds.maxNestingDepth,
          details: { maxDepth, limit: this.thresholds.maxNestingDepth },
        };
      },
      fix: (file, content) => this.suggestNestingReduction(file, content),
    });

    // Fake implementation detection - BLOCKING
    this.registerRule({
      id: 'fake_implementation',
      type: ViolationType.FAKE_IMPLEMENTATION,
      severity: Severity.BLOCKING,
      description: 'File contains fake/placeholder implementation that must be completed',
      check: (file, content) => {
        const fakePatterns = [
          /in real implementation/i,
          /in production/i,
          /placeholder/i,
          /mock implementation/i,
          /stub implementation/i,
          /not implemented/i,
          /implement later/i,
          /add implementation/i,
          /coming soon/i,
          /work in progress/i,
          /wip/i,
          /throw new Error\(['"]not implemented/i,
          /\/\/\s*TODO/i,
          /\/\/\s*FIXME/i,
          /\/\/\s*HACK/i,
        ];

        const foundPatterns = [];
        for (const pattern of fakePatterns) {
          const matches = content.match(pattern);
          if (matches) {
            foundPatterns.push({ pattern: pattern.toString(), count: matches.length });
          }
        }

        return {
          violated: foundPatterns.length > 0,
          details: { patterns: foundPatterns },
        };
      },
      fix: (file, content) => this.suggestFakeImplementationRemoval(file, content),
    });
  }

  /**
   * Register a custom rule
   */
  registerRule(rule) {
    this.rules.set(rule.id, rule);
  }

  /**
   * Validate a file against all rules
   */
  validateFile(filePath, content) {
    if (!this.enabled) {
      return { valid: true, violations: [] };
    }

    const violations = [];
    let hasBlockingViolation = false;

    for (const [id, rule] of this.rules) {
      try {
        const result = rule.check(filePath, content);
        if (result.violated) {
          violations.push({
            id: rule.id,
            type: rule.type,
            severity: rule.severity,
            description: rule.description,
            details: result.details,
            fix: rule.fix,
          });

          if (rule.severity === Severity.BLOCKING) {
            hasBlockingViolation = true;
          }
        }
      } catch (error) {
        console.error(`[Auto Enforcement] Rule ${id} check failed:`, error);
      }
    }

    return {
      valid: !hasBlockingViolation,
      violations,
      hasBlockingViolation,
    };
  }

  /**
   * Pre-edit validation - checks if an edit would violate rules
   */
  validateEdit(filePath, oldContent, newContent) {
    // Check if the edit would exceed file size
    const newLineCount = newContent.split('\n').length;
    if (newLineCount > this.thresholds.maxFileSize) {
      return {
        allowed: false,
        reason: 'Edit would exceed file size limit',
        details: { current: newLineCount, limit: this.thresholds.maxFileSize },
        suggestion: this.suggestFileSplit(filePath, newContent),
      };
    }

    // Check for forbidden patterns in new content
    for (const pattern of this.forbiddenPatterns) {
      if (pattern.test(newContent)) {
        return {
          allowed: false,
          reason: 'Edit would introduce forbidden pattern',
          details: { pattern: pattern.toString() },
          suggestion: this.suggestPatternRemoval(filePath, newContent),
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Calculate maximum nesting depth in code
   */
  calculateMaxNestingDepth(content) {
    const lines = content.split('\n');
    let maxDepth = 0;
    let currentDepth = 0;

    for (const line of lines) {
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;

      currentDepth += openBraces;
      maxDepth = Math.max(maxDepth, currentDepth);
      currentDepth -= closeBraces;
    }

    return maxDepth;
  }

  /**
   * Suggest file split for oversized files
   */
  suggestFileSplit(filePath, content) {
    const lines = content.split('\n');
    const functions = this.extractFunctions(content);

    return {
      action: 'split_file',
      message: `File is too large (${lines.length} lines). Split into multiple files.`,
      suggestions: functions.map((fn, i) => ({
        newFile: `${path.basename(filePath, '.js')}-${fn.name}.js`,
        content: fn.content,
        lineRange: fn.lineRange,
      })),
    };
  }

  /**
   * Extract functions from content
   */
  extractFunctions(content) {
    const functions = [];
    const lines = content.split('\n');
    let currentFunction = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const functionMatch = line.match(
        /(?:function\s+(\w+)|(\w+)\s*=\s*(?:async\s+)?function|(\w+)\s*\([^)]*\)\s*=>)/
      );

      if (functionMatch) {
        if (currentFunction) {
          functions.push(currentFunction);
        }
        currentFunction = {
          name: functionMatch[1] || functionMatch[2] || functionMatch[3],
          content: line,
          lineRange: [i + 1, i + 1],
        };
      } else if (currentFunction) {
        currentFunction.content += '\n' + line;
        currentFunction.lineRange[1] = i + 1;
      }
    }

    if (currentFunction) {
      functions.push(currentFunction);
    }

    return functions;
  }

  /**
   * Suggest separation of concerns
   */
  suggestSeparationOfConcerns(filePath, content) {
    const functions = this.extractFunctions(content);
    const groups = this.groupByConcern(functions);

    return {
      action: 'separate_concerns',
      message: 'File handles multiple concerns. Separate into focused modules.',
      suggestions: Object.entries(groups).map(([concern, fns]) => ({
        newFile: `${path.basename(filePath, '.js')}-${concern}.js`,
        functions: fns.map((f) => f.name),
      })),
    };
  }

  /**
   * Group functions by concern (heuristic)
   */
  groupByConcern(functions) {
    const groups = {};

    for (const fn of functions) {
      const concern = this.inferConcern(fn.name, fn.content);
      if (!groups[concern]) {
        groups[concern] = [];
      }
      groups[concern].push(fn);
    }

    return groups;
  }

  /**
   * Infer concern from function name and content
   */
  inferConcern(name, content) {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('auth') || lowerName.includes('login') || lowerName.includes('token')) {
      return 'auth';
    }
    if (lowerName.includes('db') || lowerName.includes('database') || lowerName.includes('query')) {
      return 'database';
    }
    if (lowerName.includes('api') || lowerName.includes('http') || lowerName.includes('request')) {
      return 'api';
    }
    if (lowerName.includes('util') || lowerName.includes('helper')) {
      return 'utils';
    }
    if (lowerName.includes('valid') || lowerName.includes('check')) {
      return 'validation';
    }

    return 'core';
  }

  /**
   * Suggest pattern removal
   */
  suggestPatternRemoval(filePath, content) {
    const patterns = [];

    for (const pattern of this.forbiddenPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        patterns.push({
          pattern: pattern.toString(),
          count: matches.length,
          lines: this.findPatternLines(content, pattern),
        });
      }
    }

    return {
      action: 'remove_patterns',
      message: 'File contains forbidden patterns that must be removed.',
      patterns,
    };
  }

  /**
   * Find lines containing a pattern
   */
  findPatternLines(content, pattern) {
    const lines = content.split('\n');
    const matchingLines = [];

    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        matchingLines.push(i + 1);
      }
    }

    return matchingLines;
  }

  /**
   * Suggest nesting reduction
   */
  suggestNestingReduction(filePath, content) {
    const maxDepth = this.calculateMaxNestingDepth(content);
    const deepLines = this.findDeeplyNestedLines(content, this.thresholds.maxNestingDepth);

    return {
      action: 'reduce_nesting',
      message: `File contains code nested ${maxDepth} levels deep. Extract nested logic into functions.`,
      suggestions: deepLines.map((line) => ({
        line,
        suggestion: 'Extract this block into a separate function',
      })),
    };
  }

  /**
   * Suggest fake implementation removal
   */
  suggestFakeImplementationRemoval(filePath, content) {
    const fakePatterns = [
      /in real implementation/i,
      /in production/i,
      /placeholder/i,
      /mock implementation/i,
      /stub implementation/i,
      /not implemented/i,
      /implement later/i,
      /add implementation/i,
      /coming soon/i,
      /work in progress/i,
      /wip/i,
      /throw new Error\(['"]not implemented/i,
      /\/\/\s*TODO/i,
      /\/\/\s*FIXME/i,
      /\/\/\s*HACK/i,
    ];

    const patterns = [];

    for (const pattern of fakePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        patterns.push({
          pattern: pattern.toString(),
          count: matches.length,
          lines: this.findPatternLines(content, pattern),
        });
      }
    }

    return {
      action: 'remove_fake_implementation',
      message:
        'CRITICAL: File contains fake/placeholder implementations. Complete the implementation before proceeding.',
      severity: 'BLOCKING',
      patterns,
      instructions:
        'Replace all placeholder code with fully functional implementations. Do not leave TODO/FIXME comments as placeholders.',
    };
  }

  /**
   * Find deeply nested lines
   */
  findDeeplyNestedLines(content, threshold) {
    const lines = content.split('\n');
    const deepLines = [];
    let currentDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;

      currentDepth += openBraces - closeBraces;

      if (currentDepth > threshold) {
        deepLines.push(i + 1);
      }
    }

    return deepLines;
  }

  /**
   * Get all violations
   */
  getViolations() {
    return Array.from(this.violations.values());
  }

  /**
   * Clear violations
   */
  clearViolations() {
    this.violations.clear();
  }

  /**
   * Enable/disable enforcement
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Update thresholds
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }
}

/**
 * File Operation Interceptor
 * Intercepts file operations to enforce rules automatically
 */
export class FileOperationInterceptor {
  constructor(autoEnforcement) {
    this.enforcement = autoEnforcement;
    this.intercepted = false;
  }

  /**
   * Start intercepting file operations
   */
  start() {
    if (this.intercepted) return;
    this.intercepted = true;
    // Would hook into the edit/write tools
    // Debug log removed
  }

  /**
   * Stop intercepting file operations
   */
  stop() {
    this.intercepted = false;
    // Debug log removed
  }

  /**
   * Intercept a write operation
   */
  interceptWrite(filePath, content) {
    const validation = this.enforcement.validateFile(filePath, content);

    if (!validation.valid) {
      console.error(`[Auto Enforcement] Write blocked for ${filePath}:`);
      for (const violation of validation.violations) {
        console.error(`  - ${violation.description} (${violation.severity})`);
      }

      // Return blocking violation with suggestions
      return {
        allowed: false,
        validation,
        suggestions: validation.violations.map((v) => v.fix?.(filePath, content)),
      };
    }

    return { allowed: true };
  }

  /**
   * Intercept an edit operation
   */
  interceptEdit(filePath, oldContent, newContent) {
    const validation = this.enforcement.validateEdit(filePath, oldContent, newContent);

    if (!validation.allowed) {
      console.error(`[Auto Enforcement] Edit blocked for ${filePath}: ${validation.reason}`);
      return {
        allowed: false,
        validation,
        suggestion: validation.suggestion,
      };
    }

    return { allowed: true };
  }
}

// Global instance
let autoEnforcement = null;
let fileInterceptor = null;

/**
 * Initialize automated rule enforcement
 */
export function initializeAutoEnforcement(options = {}) {
  autoEnforcement = new AutoEnforcementEngine(options);
  fileInterceptor = new FileOperationInterceptor(autoEnforcement);

  if (options.autoIntercept !== false) {
    fileInterceptor.start();
  }

  // Debug log removed
  return {
    autoEnforcement,
    fileInterceptor,
  };
}

/**
 * Get automated rule enforcement
 */
export function getAutoEnforcement() {
  if (!autoEnforcement || !fileInterceptor) {
    throw new Error('Auto enforcement not initialized. Call initializeAutoEnforcement first.');
  }

  return {
    autoEnforcement,
    fileInterceptor,
  };
}
