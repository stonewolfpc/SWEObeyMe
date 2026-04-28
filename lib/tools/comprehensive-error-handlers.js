/**
 * Comprehensive Error Detection Handlers
 *
 * MCP tool handlers for comprehensive error detection system
 * Detects errors from frontend UI to tiny lint issues
 *
 * @module lib/tools/comprehensive-error-handlers
 */

import {
  runComprehensiveErrorDetection,
  ComprehensiveErrorDetector,
} from '../comprehensive-error-detection.js';

/**
 * Run comprehensive error detection on entire project
 */
export async function comprehensiveErrorDetection(args) {
  try {
    const options = {
      projectRoot: args.projectRoot,
      enableTypeScript: args.enableTypeScript,
      enableESLint: args.enableESLint,
      enablePrettier: args.enablePrettier,
      enableSecurity: args.enableSecurity,
      enableAccessibility: args.enableAccessibility,
      enablePerformance: args.enablePerformance,
      enableDeadCode: args.enableDeadCode,
      enableCircularDeps: args.enableCircularDeps,
    };

    const results = await runComprehensiveErrorDetection(options);

    const detector = new ComprehensiveErrorDetector(options);
    const report = detector.getReport();

    return {
      content: [
        {
          type: 'text',
          text: report,
        },
      ],
    };
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error running comprehensive error detection: ${error.message}`,
        },
      ],
    };
  }
}

/**
 * Run comprehensive error detection on specific file
 */
export async function comprehensiveErrorDetectionFile(args) {
  try {
    if (!args.filePath) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'filePath parameter is required',
          },
        ],
      };
    }

    const options = {
      filePath: args.filePath,
      enableTypeScript: args.enableTypeScript,
      enableESLint: args.enableESLint,
      enablePrettier: args.enablePrettier,
    };

    const detector = new ComprehensiveErrorDetector(options);
    await detector.runAllChecks(args.filePath);

    const report = detector.getReport();

    return {
      content: [
        {
          type: 'text',
          text: report,
        },
      ],
    };
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error running error detection on file: ${error.message}`,
        },
      ],
    };
  }
}

/**
 * Get error detection status
 */
export async function getErrorDetectionStatus(args) {
  try {
    const detector = new ComprehensiveErrorDetector({
      projectRoot: args.projectRoot,
    });

    const results = detector.getResults();

    const totalIssues =
      results.syntax.length +
      results.lint.length +
      results.type.length +
      results.security.length +
      results.accessibility.length +
      results.performance.length +
      results.deadCode.length +
      results.circularDeps.length;

    return {
      content: [
        {
          type: 'text',
          text:
            'Error Detection Status:\n' +
            `Syntax Errors: ${results.syntax.length}\n` +
            `Lint Issues: ${results.lint.length}\n` +
            `Type Errors: ${results.type.length}\n` +
            `Security Vulnerabilities: ${results.security.length}\n` +
            `Accessibility Issues: ${results.accessibility.length}\n` +
            `Performance Issues: ${results.performance.length}\n` +
            `Dead Code: ${results.deadCode.length}\n` +
            `Circular Dependencies: ${results.circularDeps.length}\n` +
            `Total Issues: ${totalIssues}\n` +
            `\nStatus: ${totalIssues === 0 ? '✅ Clean' : '⚠️ Issues Found'}`,
        },
      ],
    };
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error getting error detection status: ${error.message}`,
        },
      ],
    };
  }
}
