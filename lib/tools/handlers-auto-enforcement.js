/**
 * Automated Rule Enforcement Tool Handlers
 * Provides MCP tools for automated rule enforcement and validation
 * Added timeout protection to file reads to prevent hangs
 */

import { getAutoEnforcement } from '../auto-enforcement.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Validate a file against automated rules
 */
export async function validate_file_handler(args) {
  const { filePath } = args;

  if (!filePath) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'File path is required' }],
    };
  }

  try {
    const content = await Promise.race([
      fs.readFile(filePath, 'utf8'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('File read timeout after 5000ms')), 5000)
      )
    ]);
    const { autoEnforcement } = getAutoEnforcement();
    const validation = autoEnforcement.validateFile(filePath, content);

    let response = `File validation for: ${filePath}\n`;
    response += `Status: ${validation.valid ? 'PASSED' : 'FAILED'}\n\n`;

    if (validation.violations.length > 0) {
      response += 'Violations:\n';
      for (const violation of validation.violations) {
        response += `\n[${violation.severity.toUpperCase()}] ${violation.description}\n`;
        response += `  Type: ${violation.type}\n`;
        if (violation.details) {
          response += `  Details: ${JSON.stringify(violation.details)}\n`;
        }
        if (violation.fix) {
          const suggestion = violation.fix(filePath, content);
          response += `  Suggestion: ${JSON.stringify(suggestion, null, 2)}\n`;
        }
      }
    } else {
      response += 'No violations found.\n';
    }

    return {
      content: [{ type: 'text', text: response }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error validating file: ${error.message}` }],
    };
  }
}

/**
 * Get current rule enforcement status
 */
export async function get_enforcement_status_handler(args) {
  try {
    const { autoEnforcement } = getAutoEnforcement();
    const violations = autoEnforcement.getViolations();

    let response = 'Automated Rule Enforcement Status\n';
    response += '===================================\n\n';
    response += `Enabled: ${autoEnforcement.enabled ? 'YES' : 'NO'}\n`;
    response += `Thresholds:\n`;
    response += `  - Max File Size: ${autoEnforcement.thresholds.maxFileSize} lines\n`;
    response += `  - Max Function Length: ${autoEnforcement.thresholds.maxFunctionLength} lines\n`;
    response += `  - Max Nesting Depth: ${autoEnforcement.thresholds.maxNestingDepth}\n`;
    response += `  - Max Functions: ${autoEnforcement.thresholds.maxFunctionCount}\n`;
    response += `  - Max Classes: ${autoEnforcement.thresholds.maxClassCount}\n\n`;
    response += `Active Violations: ${violations.length}\n`;

    if (violations.length > 0) {
      response += '\nRecent Violations:\n';
      for (const violation of violations.slice(0, 10)) {
        response += `  - ${violation.type}: ${violation.description}\n`;
      }
    }

    return {
      content: [{ type: 'text', text: response }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error getting enforcement status: ${error.message}` }],
    };
  }
}

/**
 * Update enforcement thresholds
 */
export async function update_enforcement_thresholds_handler(args) {
  const { thresholds } = args;

  if (!thresholds) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Thresholds object is required' }],
    };
  }

  try {
    const { autoEnforcement } = getAutoEnforcement();
    autoEnforcement.updateThresholds(thresholds);

    return {
      content: [{ type: 'text', text: 'Enforcement thresholds updated successfully.' }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error updating thresholds: ${error.message}` }],
    };
  }
}

/**
 * Enable or disable automated enforcement
 */
export async function toggle_enforcement_handler(args) {
  const { enabled } = args;

  if (typeof enabled !== 'boolean') {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Enabled boolean is required' }],
    };
  }

  try {
    const { autoEnforcement } = getAutoEnforcement();
    autoEnforcement.setEnabled(enabled);

    return {
      content: [{ type: 'text', text: `Automated enforcement ${enabled ? 'enabled' : 'disabled'}.` }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error toggling enforcement: ${error.message}` }],
    };
  }
}

/**
 * Get rule enforcement statistics
 */
export async function get_enforcement_stats_handler(args) {
  try {
    const { autoEnforcement } = getAutoEnforcement();
    const violations = autoEnforcement.getViolations();

    const stats = {
      totalViolations: violations.length,
      byType: {},
      bySeverity: {},
      byRule: {},
    };

    for (const violation of violations) {
      stats.byType[violation.type] = (stats.byType[violation.type] || 0) + 1;
      stats.bySeverity[violation.severity] = (stats.bySeverity[violation.severity] || 0) + 1;
      stats.byRule[violation.id] = (stats.byRule[violation.id] || 0) + 1;
    }

    let response = 'Rule Enforcement Statistics\n';
    response += '===========================\n\n';
    response += `Total Violations: ${stats.totalViolations}\n\n`;
    response += 'By Type:\n';
    for (const [type, count] of Object.entries(stats.byType)) {
      response += `  - ${type}: ${count}\n`;
    }
    response += '\nBy Severity:\n';
    for (const [severity, count] of Object.entries(stats.bySeverity)) {
      response += `  - ${severity}: ${count}\n`;
    }
    response += '\nBy Rule:\n';
    for (const [rule, count] of Object.entries(stats.byRule)) {
      response += `  - ${rule}: ${count}\n`;
    }

    return {
      content: [{ type: 'text', text: response }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error getting stats: ${error.message}` }],
    };
  }
}

/**
 * Clear all violations
 */
export async function clear_violations_handler(args) {
  try {
    const { autoEnforcement } = getAutoEnforcement();
    autoEnforcement.clearViolations();

    return {
      content: [{ type: 'text', text: 'All violations cleared.' }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error clearing violations: ${error.message}` }],
    };
  }
}

/**
 * Suggest refactoring for a file
 */
export async function suggest_refactoring_handler(args) {
  const { filePath } = args;

  if (!filePath) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'File path is required' }],
    };
  }

  try {
    const content = await Promise.race([
      fs.readFile(filePath, 'utf8'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('File read timeout after 5000ms')), 5000)
      )
    ]);
    const { autoEnforcement } = getAutoEnforcement();
    const validation = autoEnforcement.validateFile(filePath, content);

    if (validation.valid) {
      return {
        content: [{ type: 'text', text: `File ${filePath} passes all rules. No refactoring needed.` }],
      };
    }

    let response = `Refactoring Suggestions for: ${filePath}\n`;
    response += '========================================\n\n';

    for (const violation of validation.violations) {
      response += `[${violation.severity.toUpperCase()}] ${violation.description}\n`;
      if (violation.fix) {
        const suggestion = violation.fix(filePath, content);
        response += `\n${JSON.stringify(suggestion, null, 2)}\n\n`;
      }
    }

    return {
      content: [{ type: 'text', text: response }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error suggesting refactoring: ${error.message}` }],
    };
  }
}

/**
 * Dispatcher: auto_enforce swiss-army-knife handler
 * Routes to appropriate handler based on operation parameter
 */
export async function auto_enforce_handler(params) {
  const { operation, path, content, thresholds, enabled } = params;

  if (!operation) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'operation parameter is required' }],
    };
  }

  switch (operation) {
    case 'validate':
      return await validate_file_handler({ filePath: path, content });
    case 'status':
      return await get_enforcement_status_handler(params);
    case 'update_thresholds':
      return await update_enforcement_thresholds_handler({ thresholds });
    case 'toggle':
      return await toggle_enforcement_handler({ enabled });
    case 'stats':
      return await get_enforcement_stats_handler(params);
    case 'clear':
      return await clear_violations_handler(params);
    case 'suggest':
      return await suggest_refactoring_handler({ filePath: path });
    default:
      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown operation: ${operation}` }],
      };
  }
}

export const autoEnforcementHandlers = {
  auto_enforce: auto_enforce_handler,
  validate_file: validate_file_handler,
  get_enforcement_status: get_enforcement_status_handler,
  update_enforcement_thresholds: update_enforcement_thresholds_handler,
  toggle_enforcement: toggle_enforcement_handler,
  get_enforcement_stats: get_enforcement_stats_handler,
  clear_violations: clear_violations_handler,
  suggest_refactoring: suggest_refactoring_handler,
};
