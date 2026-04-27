/**
 * Audit System Tool Handlers
 * Provides MCP tools for pre-work auditing
 */

import { getAuditSystem } from '../audit-system.js';
import { getDuplicateScanner } from '../duplicate-scanner.js';
import path from 'path';

function resolveWorkspaceRoot(args) {
  if (args.workspace_path) return path.resolve(args.workspace_path);
  if (process.env.SWEOBEYME_WORKSPACE) return path.resolve(process.env.SWEOBEYME_WORKSPACE);
  return null;
}

/**
 * Run pre-work audit before starting new work
 */
export async function pre_work_audit_handler(args) {
  const { taskDescription } = args;

  if (!taskDescription) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Task description is required for pre-work audit' }],
    };
  }

  try {
    const { preWorkAuditor } = getAuditSystem();
    const root = resolveWorkspaceRoot(args);
    if (root) preWorkAuditor.projectRoot = root;
    const audit = await preWorkAuditor.auditBeforeWork(taskDescription);

    let response = `Pre-Work Audit Results\n`;
    response += `======================\n\n`;
    response += `Should Proceed: ${audit.shouldProceed ? 'YES' : 'NO'}\n`;
    response += `Critical Issues: ${audit.criticalCount}\n`;
    response += `High Priority Issues: ${audit.highCount}\n`;
    response += `Total Issues: ${audit.issues.length}\n\n`;

    if (audit.issues.length > 0) {
      response += 'Issues Found:\n';
      for (const issue of audit.issues) {
        response += `\n[${issue.severity.toUpperCase()}] ${issue.description}\n`;
        response += `  Type: ${issue.type}\n`;
        if (issue.details) {
          response += `  Details: ${JSON.stringify(issue.details)}\n`;
        }
        if (issue.suggestion) {
          response += `  Suggestion: ${issue.suggestion}\n`;
        }
      }
    } else {
      response += 'No issues found. Safe to proceed.\n';
    }

    if (!audit.shouldProceed) {
      response += '\n⚠️  CRITICAL ISSUES FOUND - Do not proceed until these are resolved.\n';
    }

    return {
      content: [{ type: 'text', text: response }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error running pre-work audit: ${error.message}` }],
    };
  }
}

/**
 * Get audit issues
 */
export async function get_audit_issues_handler(args) {
  try {
    const { preWorkAuditor } = getAuditSystem();
    const issues = preWorkAuditor.getIssues();

    let response = `Audit Issues (${issues.length})\n`;
    response += `=========================\n\n`;

    if (issues.length === 0) {
      response += 'No audit issues.\n';
    } else {
      for (const issue of issues) {
        response += `[${issue.severity.toUpperCase()}] ${issue.description}\n`;
        response += `  Type: ${issue.type}\n`;
        if (issue.suggestion) {
          response += `  Suggestion: ${issue.suggestion}\n`;
        }
        response += '\n';
      }
    }

    return {
      content: [{ type: 'text', text: response }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error getting audit issues: ${error.message}` }],
    };
  }
}

/**
 * Clear audit issues
 */
export async function clear_audit_issues_handler(args) {
  try {
    const { preWorkAuditor } = getAuditSystem();
    preWorkAuditor.clearIssues();

    return {
      content: [{ type: 'text', text: 'All audit issues cleared.' }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error clearing audit issues: ${error.message}` }],
    };
  }
}

/**
 * Scan for duplicates in codebase
 */
export async function scan_duplicates_handler(args) {
  const { targetDescription } = args;

  try {
    const scanner = getDuplicateScanner();
    const root = resolveWorkspaceRoot(args);
    if (root) scanner.projectRoot = root;
    const result = await scanner.scanForDuplicates(targetDescription || '');

    let response = `Duplicate Scan Results\n`;
    response += `======================\n\n`;
    response += `Total Duplicates: ${result.totalDuplicates}\n\n`;

    if (result.duplicates.length > 0) {
      response += 'Duplicates Found:\n';
      for (const dup of result.duplicates) {
        response += `\n[${dup.type.toUpperCase()}] ${dup.file || dup.id || dup.location}\n`;
        if (dup.similarity) {
          response += `  Similarity: ${dup.similarity}\n`;
        }
        if (dup.matchedKeywords) {
          response += `  Matched Keywords: ${dup.matchedKeywords.join(', ')}\n`;
        }
        if (dup.suggestion) {
          response += `  Suggestion: ${dup.suggestion}\n`;
        }
      }
    } else {
      response += 'No duplicates found.\n';
    }

    if (result.summary) {
      response += '\nSummary:\n';
      response += `  Code Implementations: ${result.summary.codeImplementations || 0}\n`;
      response += `  Package.json Views: ${result.summary.packageJsonViews || 0}\n`;
      response += `  Package.json Commands: ${result.summary.packageJsonCommands || 0}\n`;
      response += `  Extension.js Providers: ${result.summary.extensionJsProviders || 0}\n`;
      response += `  Extension.js Commands: ${result.summary.extensionJsCommands || 0}\n`;
    }

    return {
      content: [{ type: 'text', text: response }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error scanning for duplicates: ${error.message}` }],
    };
  }
}

/**
 * Dispatcher: audit swiss-army-knife handler
 * Routes to appropriate handler based on operation parameter
 */
export async function audit_handler(params) {
  const { operation, taskDescription } = params;

  if (!operation) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'operation parameter is required' }],
    };
  }

  switch (operation) {
    case 'pre_work':
      return await pre_work_audit_handler({ taskDescription, workspace_path: params.workspace_path });
    case 'status':
      return await get_audit_issues_handler(params);
    case 'issues':
      return await get_audit_issues_handler(params);
    default:
      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown operation: ${operation}` }],
      };
  }
}

export const auditHandlers = {
  audit: audit_handler,
  scan_duplicates: scan_duplicates_handler,
  pre_work_audit: pre_work_audit_handler,
  get_audit_issues: get_audit_issues_handler,
  clear_audit_issues: clear_audit_issues_handler,
};
