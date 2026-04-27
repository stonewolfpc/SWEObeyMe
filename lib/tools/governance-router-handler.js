/**
 * Governance Router Handler
 * 
 * Single entry point for all SWEObeyMe operations.
 * Routes domain+action to internal tool handlers with philosophy enforcement.
 * 
 * Schema:
 * {
 *   domain: "files" | "search" | "docs" | "backup" | "memory" | "project" | "validation" | "context" | "safety" | "config" | "workflow" | "refactor" | "autonomous" | "agent" | "csharp" | "cpp" | "governance" | "error" | "spec" | "codebase" | "godot" | "patreon",
 *   action: string,
 *   payload: object
 * }
 * 
 * Response:
 * {
 *   status: "ok" | "error" | "partial",
 *   result: object,
 *   diagnostics: string,
 *   next_steps: string
 * }
 */

import { toolHandlers } from './handlers.js';
import { autoBackupBeforeEdit, autoSnapshotAfterEdit, quickRestore } from '../backup-auto.js';
import { MAX_LINES, FORBIDDEN_PATTERNS } from '../config.js';
import { createFailureIssue } from '../github/github-issue-creator.js';
import { pushRouterEvent } from '../ui/router-event-bus.js';
import fs from 'fs/promises';
import path from 'path';

// Internal tool registry - maps domain+action to handlers
const internalToolRegistry = {
  files: {
    read: 'read_file',
    write: 'write_file',
    info: 'file_info',
    analyze: 'code_analyze',
    extract: 'extract_to_new_file',
  },
  backup: {
    manage: 'backup_manage',
  },
  search: {
    code: 'search_code',
  },
  docs: {
    manage: 'docs_manage',
  },
  memory: {
    manage: 'memory_manage',
  },
  project: {
    manage: 'project_manage',
  },
  validation: {
    code: 'validate_code',
  },
  context: {
    manage: 'context_manage',
  },
  safety: {
    manage: 'safety_manage',
  },
  config: {
    manage: 'config_manage',
  },
  workflow: {
    manage: 'workflow_manage',
  },
  refactor: {
    manage: 'refactor_manage',
    move_block: 'refactor_move_block',
    extract: 'extract_to_new_file',
  },
  autonomous: {
    execute: 'autonomous_execute',
  },
  agent: {
    orchestrate: 'agent_orchestrate',
  },
  csharp: {
    manage: 'csharp_manage',
  },
  cpp: {
    manage: 'cpp_manage',
  },
  governance: {
    manage: 'governance_manage',
  },
  error: {
    detect: 'error_detect',
  },
  spec: {
    manage: 'spec_manage',
  },
  codebase: {
    manage: 'codebase_manage',
  },
  godot: {
    manage: 'godot_manage',
  },
  patreon: {
    manage: 'patreon_manage',
  },
};

/**
 * Check surgical compliance before routing
 */
async function checkSurgicalCompliance(domain, action, payload) {
  const violations = [];

  // Check for file operations that need surgical compliance
  if (domain === 'files' && (action === 'write' || action === 'extract')) {
    const { path: filePath, content } = payload;
    
    if (content) {
      // Check line count
      const lineCount = content.split('\n').length;
      const maxLines = MAX_LINES();
      if (lineCount > maxLines) {
        violations.push(`File exceeds maximum line count (${lineCount}/${maxLines})`);
      }

      // Check forbidden patterns
      const forbiddenPatterns = FORBIDDEN_PATTERNS();
      for (const pattern of forbiddenPatterns) {
        if (content.includes(pattern)) {
          violations.push(`Forbidden pattern detected: ${pattern}`);
        }
      }
    }

    // Check for hallucinated paths
    if (filePath) {
      const normalizedPath = path.normalize(filePath);
      const cwd = process.cwd();
      
      // Prevent paths outside project
      if (!normalizedPath.startsWith(cwd) && !path.isAbsolute(normalizedPath)) {
        // This might be a relative path, check if it resolves within project
        const resolvedPath = path.resolve(cwd, normalizedPath);
        if (!resolvedPath.startsWith(cwd)) {
          violations.push(`Path outside project directory: ${filePath}`);
        }
      }
    }
  }

  return violations;
}

/**
 * Check if operation requires backup
 */
function requiresBackup(domain, action) {
  return domain === 'files' && (action === 'write' || action === 'extract');
}

/**
 * Validate code/content before operation
 */
async function validateOperation(domain, action, payload) {
  const validations = [];

  if (domain === 'files' && payload.content) {
    // Basic syntax validation for code files
    const filePath = payload.path || '';
    const content = payload.content;

    // Check for unclosed brackets
    const openBrackets = (content.match(/\{/g) || []).length;
    const closeBrackets = (content.match(/\}/g) || []).length;
    if (openBrackets !== closeBrackets) {
      validations.push('Unbalanced brackets detected');
    }

    // Check for unclosed parentheses
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      validations.push('Unbalanced parentheses detected');
    }

    // Check for JSON validity if .json file
    if (filePath.endsWith('.json')) {
      try {
        JSON.parse(content);
      } catch (e) {
        validations.push(`Invalid JSON: ${e.message}`);
      }
    }
  }

  return validations;
}

/**
 * Governance router handler
 * Routes domain+action to internal tool handlers with philosophy enforcement
 */
export async function governanceRouterHandler(args) {
  const { domain, action, payload = {} } = args;

  // Validate required parameters
  if (!domain) {
    return {
      status: 'error',
      result: null,
      diagnostics: 'Missing required parameter: domain',
      next_steps: 'Provide a domain (files, backup, search, docs, memory, project, validation, context, safety, config, workflow, refactor, autonomous, agent, csharp, cpp, governance, error, spec, codebase, godot, patreon)',
    };
  }

  if (!action) {
    return {
      status: 'error',
      result: null,
      diagnostics: 'Missing required parameter: action',
      next_steps: 'Provide an action for the specified domain',
    };
  }

  // Emit router event to cockpit (non-blocking)
  pushRouterEvent({ type: 'router', message: `${domain}.${action} → routing`, timestamp: Date.now() });

  // Check surgical compliance FIRST
  const complianceViolations = await checkSurgicalCompliance(domain, action, payload);
  if (complianceViolations.length > 0) {
    const diag = `Surgical compliance violations: ${complianceViolations.join('; ')}`;
    pushRouterEvent({ type: 'error', message: diag, timestamp: Date.now() });
    createFailureIssue({ type: 'forbidden_pattern', domain, action, handlerName: 'checkSurgicalCompliance', diagnostics: diag, filePath: payload.path }).catch(() => {});
    return {
      status: 'error',
      result: null,
      diagnostics: diag,
      next_steps: 'Fix violations before proceeding. Review SWEObeyMe constitution for surgical rules.',
    };
  }

  // Validate operation BEFORE backup (fail fast)
  const validationErrors = await validateOperation(domain, action, payload);
  if (validationErrors.length > 0) {
    const diag = `Validation errors: ${validationErrors.join('; ')}`;
    pushRouterEvent({ type: 'validation', message: diag, timestamp: Date.now() });
    createFailureIssue({ type: 'validation_failure', domain, action, handlerName: 'validateOperation', diagnostics: diag, filePath: payload.path }).catch(() => {});
    return {
      status: 'error',
      result: null,
      diagnostics: diag,
      next_steps: 'Fix validation errors before proceeding.',
    };
  }

  // Create backup if needed
  let backupPath = null;
  if (requiresBackup(domain, action) && payload.path) {
    try {
      const fileExists = await fs.access(payload.path).then(() => true).catch(() => false);
      if (fileExists) {
        backupPath = await autoBackupBeforeEdit(payload.path);
      }
    } catch (error) {
      return {
        status: 'error',
        result: null,
        diagnostics: `Backup failed: ${error.message}`,
        next_steps: 'Check backup system configuration and disk space.',
      };
    }
  }

  // Look up the handler
  const domainRegistry = internalToolRegistry[domain];
  if (!domainRegistry) {
    const diag = `Unknown domain: ${domain}`;
    pushRouterEvent({ type: 'error', message: diag, timestamp: Date.now() });
    createFailureIssue({ type: 'invalid_domain_action', domain, action, handlerName: 'router', diagnostics: diag }).catch(() => {});
    return {
      status: 'error',
      result: null,
      diagnostics: diag,
      next_steps: 'Valid domains: files, backup, search, docs, memory, project, validation, context, safety, config, workflow, refactor, autonomous, agent, csharp, cpp, governance, error, spec, codebase, godot, patreon',
    };
  }

  const handlerName = domainRegistry[action];
  if (!handlerName) {
    const diag = `Unknown action '${action}' for domain '${domain}'`;
    pushRouterEvent({ type: 'error', message: diag, timestamp: Date.now() });
    createFailureIssue({ type: 'invalid_domain_action', domain, action, handlerName: 'router', diagnostics: diag }).catch(() => {});
    return {
      status: 'error',
      result: null,
      diagnostics: diag,
      next_steps: `Valid actions for ${domain}: ${Object.keys(domainRegistry).join(', ')}`,
    };
  }

  const handler = toolHandlers[handlerName];
  if (!handler) {
    return {
      status: 'error',
      result: null,
      diagnostics: `Handler not found: ${handlerName}`,
      next_steps: 'This handler may have been removed or not registered',
    };
  }

  // Call the handler with the payload
  let result;
  try {
    result = await handler(payload);
    pushRouterEvent({ type: 'router', message: `${domain}.${action} → ${handlerName} ✓`, timestamp: Date.now() });
  } catch (error) {
    const diag = `Handler execution failed: ${error.message}`;
    pushRouterEvent({ type: 'error', message: diag, timestamp: Date.now() });
    // Self-healing: restore from backup if available
    if (backupPath && payload.path) {
      try {
        await quickRestore(payload.path);
        pushRouterEvent({ type: 'backup', message: `Self-healing: restored ${payload.path}`, timestamp: Date.now() });
        createFailureIssue({ type: 'self_healing', domain, action, handlerName, diagnostics: diag, filePath: payload.path }).catch(() => {});
        return {
          status: 'error',
          result: null,
          diagnostics: `${diag}. File automatically restored from backup.`,
          next_steps: 'Review the error, fix the issue, and try again. The file has been restored to its pre-edit state.',
        };
      } catch (restoreError) {
        createFailureIssue({ type: 'backup_restore', domain, action, handlerName, diagnostics: `${diag}. Restore failed: ${restoreError.message}`, filePath: payload.path }).catch(() => {});
        return {
          status: 'error',
          result: null,
          diagnostics: `${diag}. Restore also failed: ${restoreError.message}`,
          next_steps: 'Manual intervention required. Check backup at: ' + backupPath,
        };
      }
    }
    createFailureIssue({ type: 'handler_throw', domain, action, handlerName, diagnostics: diag, filePath: payload.path }).catch(() => {});
    return {
      status: 'error',
      result: null,
      diagnostics: diag,
      next_steps: 'Check handler implementation and payload parameters',
    };
  }

  // Create snapshot after successful edit
  if (requiresBackup(domain, action) && payload.path && result && !result.isError) {
    try {
      const lineCount = payload.content ? payload.content.split('\n').length : 0;
      await autoSnapshotAfterEdit(payload.path, { lineCount });
    } catch (error) {
      // Snapshot failure is not critical, just log it
      console.error('[Governance] Snapshot creation failed:', error.message);
    }
  }

  // Validate result AFTER handler execution
  if (result && result.isError) {
    // Self-healing: restore from backup if available
    if (backupPath && payload.path) {
      try {
        await quickRestore(payload.path);
        return {
          status: 'error',
          result: null,
          diagnostics: `Handler returned error: ${result.content?.[0]?.text || 'Unknown error'}. File automatically restored from backup.`,
          next_steps: 'Review the error, fix the issue, and try again. The file has been restored to its pre-edit state.',
        };
      } catch (restoreError) {
        return {
          status: 'error',
          result,
          diagnostics: `Handler returned error. Restore also failed: ${restoreError.message}`,
          next_steps: 'Manual intervention required.',
        };
      }
    }

    return {
      status: 'error',
      result,
      diagnostics: `Handler returned error: ${result.content?.[0]?.text || 'Unknown error'}`,
      next_steps: 'Review the error and fix the issue',
    };
  }

  if (backupPath) {
    pushRouterEvent({ type: 'backup', message: `Backup created: ${path.basename(backupPath)}`, timestamp: Date.now() });
  }

  return {
    status: 'ok',
    result,
    diagnostics: backupPath
      ? `Successfully routed to ${handlerName}. Backup created at: ${backupPath}`
      : `Successfully routed to ${handlerName}`,
    next_steps: null,
  };
}

/**
 * List available domains and actions
 */
export function listGovernanceCapabilities() {
  const capabilities = {};
  
  for (const [domain, actions] of Object.entries(internalToolRegistry)) {
    capabilities[domain] = {
      actions: Object.keys(actions),
      handlerCount: Object.keys(actions).length,
    };
  }
  
  return {
    totalDomains: Object.keys(internalToolRegistry).length,
    totalHandlers: Object.values(internalToolRegistry).reduce((sum, actions) => sum + Object.keys(actions).length, 0),
    capabilities,
  };
}
