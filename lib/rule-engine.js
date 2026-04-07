/**
 * Rule Engine - Enforces strict behavior rules for AI agents
 * Prevents hallucinations, ensures tool-first approach, maintains context
 * Enforces separation of concerns and architectural boundaries
 */

import { sessionMemory, recordAction } from './session.js';
import { shouldIgnore } from './project.js';
import { toolHandlers } from './tools/handlers.js';
import { getProjectMemory } from './project-memory.js';

/**
 * Rule definitions with enforcement logic
 */
export const RULES = {
  SEARCH_BEFORE_EDIT: {
    name: 'Search Before Edit',
    description: 'Always search for and verify files exist before editing',
    severity: 'CRITICAL',
    check: (operation, context) => {
      if (operation === 'write_file' || operation === 'edit') {
        return context.fileExists === true || context.searched === true;
      }
      return true;
    },
    violationMessage: 'VIOLATION: Attempting to edit file without verifying it exists. Use search_code_files or read_file first.',
    requiredTools: ['search_code_files', 'read_file', 'find_code_files']
  },
  
  EXPLAIN_BEFORE_ACT: {
    name: 'Explain Before Act',
    description: 'Always state plan, reasoning, and tools before acting',
    severity: 'HIGH',
    check: (operation, context) => {
      return context.planExplained === true || context.operation === 'read';
    },
    violationMessage: 'VIOLATION: Attempting action without explaining plan. State your plan, reasoning, and tools first.',
    requiredTools: []
  },
  
  TOOLS_BEFORE_MANUAL: {
    name: 'Tools Before Manual',
    description: 'Always use MCP tools instead of manual editing',
    severity: 'CRITICAL',
    check: (operation, context) => {
      return operation !== 'manual_edit' && operation !== 'direct_write';
    },
    violationMessage: 'VIOLATION: Attempting manual edit. Use write_file, read_file, or other MCP tools instead.',
    requiredTools: ['write_file', 'read_file', 'edit', 'multi_edit']
  },
  
  NO_HALLUCINATION: {
    name: 'No Hallucination',
    description: 'Never invent file paths, tool names, or content',
    severity: 'CRITICAL',
    check: (operation, context) => {
      if (context.path) {
        return context.pathVerified === true;
      }
      return true;
    },
    violationMessage: 'VIOLATION: Using unverified path. Verify file exists with read_file or list_directory first.',
    requiredTools: ['read_file', 'list_directory', 'search_code_files']
  },
  
  MAINTAIN_PROJECT_MAP: {
    name: 'Maintain Project Map',
    description: 'Always maintain awareness of project structure',
    severity: 'MEDIUM',
    check: (operation, context) => {
      return context.structureKnown === true || context.operation === 'explore';
    },
    violationMessage: 'VIOLATION: Acting without project structure awareness. Use list_directory to explore first.',
    requiredTools: ['list_directory', 'get_code_language_stats']
  },
  
  FOLLOW_CONVENTIONS: {
    name: 'Follow User Conventions',
    description: 'Detect and follow existing naming and structure conventions',
    severity: 'MEDIUM',
    check: (operation, context) => {
      return context.conventionsDetected === true || context.operation === 'analyze';
    },
    violationMessage: 'VIOLATION: Not following project conventions. Analyze existing files first.',
    requiredTools: ['get_file_context', 'analyze_file_health']
  },
  
  DOCUMENTATION_REQUIRED: {
    name: 'Documentation Required',
    description: 'Update documentation for significant changes',
    severity: 'LOW',
    check: (operation, context) => {
      return context.documentationUpdated === true || !context.isSignificantChange;
    },
    violationMessage: 'REMINDER: Significant change detected. Consider updating README or changelog.',
    requiredTools: ['record_decision', 'generate_change_summary']
  },
  
  // Separation of Concerns Rules (NEW)
  
  FILE_LOCATION: {
    name: 'File Location Validation',
    description: 'Ensure files belong in their designated folders (no dumping in root)',
    severity: 'HIGH',
    check: (operation, context) => {
      if (operation === 'write_file' || operation === 'create_file') {
        const pm = getProjectMemory();
        if (pm && context.filePath) {
          const validation = pm.validateFileLocation(context.filePath, context.filePurpose);
          return validation.valid;
        }
      }
      return true;
    },
    violationMessage: 'VIOLATION: File is not in appropriate location. Files in root directory are restricted to config and docs only.',
    requiredTools: ['suggest_file_location', 'index_project_structure']
  },
  
  CODE_RESPONSIBILITY: {
    name: 'Code Responsibility Check',
    description: 'Ensure code belongs in the current file (no mixed concerns)',
    severity: 'MEDIUM',
    check: (operation, context) => {
      if (operation === 'write_file' && context.code) {
        const pm = getProjectMemory();
        if (pm && context.filePath) {
          const evaluation = pm.evaluateFileSplit(context.filePath, context.code);
          return !evaluation.shouldSplit;
        }
      }
      return true;
    },
    violationMessage: 'REMINDER: File contains multiple conceptual units. Consider splitting for better separation of concerns.',
    requiredTools: ['analyze_file_health', 'extract_to_new_file', 'refactor_move_block']
  },
  
  FILE_SCOPE: {
    name: 'File Scope Validation',
    description: 'Ensure file does not exceed its single responsibility',
    severity: 'MEDIUM',
    check: (operation, context) => {
      if (operation === 'write_file' && context.code) {
        const lineCount = context.code.split('\n').length;
        return lineCount <= 700; // Max lines per file
      }
      return true;
    },
    violationMessage: 'VIOLATION: File exceeds 700 lines. Use refactor_move_block or extract_to_new_file to reduce size.',
    requiredTools: ['refactor_move_block', 'extract_to_new_file', 'obey_surgical_plan']
  },
  
  NAMING_CONVENTIONS: {
    name: 'Naming Convention Enforcement',
    description: 'Ensure files follow project naming conventions (kebab-case)',
    severity: 'MEDIUM',
    check: (operation, context) => {
      if (operation === 'write_file' || operation === 'create_file') {
        const pm = getProjectMemory();
        if (pm && context.filePath) {
          const validation = pm.validateFileName(context.filePath);
          return validation.valid;
        }
      }
      return true;
    },
    violationMessage: 'REMINDER: File name should follow kebab-case naming convention.',
    requiredTools: ['validate_naming_conventions']
  },
  
  DOCUMENTATION_UPDATES: {
    name: 'Automatic Documentation Updates',
    description: 'Update documentation on structural changes',
    severity: 'LOW',
    check: (operation, context) => {
      if (operation === 'write_file' || operation === 'delete_file' || operation === 'move_file') {
        return context.documentationUpdated === true;
      }
      return true;
    },
    violationMessage: 'REMINDER: Structural change detected. Update README, architecture.md, changelog.md, and project_map.json.',
    requiredTools: ['generate_change_summary', 'record_decision']
  },
  
  PROJECT_MAP_UPDATES: {
    name: 'Project Map Synchronization',
    description: 'Always update project_map.json on file operations',
    severity: 'CRITICAL',
    check: (operation, context) => {
      if (operation === 'write_file' || operation === 'create_file' || operation === 'delete_file' || operation === 'move_file') {
        return context.projectMapUpdated === true;
      }
      return true;
    },
    violationMessage: 'VIOLATION: File operation requires project_map.json update. This prevents architectural drift.',
    requiredTools: ['update_project_map', 'index_project_structure']
  },

  // Implementation Philosophy Rules (NEW)

  IMPLEMENT_DIRECTLY: {
    name: 'Implement Directly',
    description: 'Implement functionality directly and inform user, rather than stubbing, faking, or asking',
    severity: 'CRITICAL',
    check: (operation, context) => {
      // Reject stub implementations
      if (context.isStub === true) return false;
      // Reject placeholder implementations
      if (context.isPlaceholder === true) return false;
      // Reject TODO/FIXME in production code
      if (context.hasTodoOrFixme === true) return false;
      // Reject "ask user" approach when implementation is possible
      if (context.askedUserInsteadOfImplementing === true) return false;
      return true;
    },
    violationMessage: 'VIOLATION: Stub, placeholder, or "ask user" approach detected. Implement actual working functionality directly. Only ask user when truly blocked (missing credentials, permissions, or ambiguous requirements).',
    requiredTools: []
  },

  INFORM_AFTER_IMPLEMENT: {
    name: 'Inform After Implementation',
    description: 'Implement functionality first, then inform user of completion',
    severity: 'HIGH',
    check: (operation, context) => {
      // Allow informing after implementation
      if (context.implemented === true) return true;
      // Reject asking before implementation
      if (context.askedBeforeImplementing === true) return false;
      return true;
    },
    violationMessage: 'VIOLATION: Asked user before implementing. Implement the functionality first, then inform the user of what was done. Only ask when truly blocked.',
    requiredTools: []
  },

  NO_FAKE_IMPLEMENTATIONS: {
    name: 'No Fake Implementations',
    description: 'Never create fake or non-functional implementations',
    severity: 'CRITICAL',
    check: (operation, context) => {
      // Reject fake implementations
      if (context.isFake === true) return false;
      // Reject non-functional code
      if (context.isNonFunctional === true) return false;
      // Reject mock implementations without clear purpose
      if (context.isMockWithoutPurpose === true) return false;
      return true;
    },
    violationMessage: 'VIOLATION: Fake or non-functional implementation detected. Create real, working code. Mocks only allowed with explicit testing purpose.',
    requiredTools: []
  }
};

/**
 * Rule engine state tracking
 */
let ruleEngineState = {
  violations: [],
  warnings: [],
  lastCheck: null,
  consecutiveViolations: 0
};

/**
 * Check if an operation complies with all rules
 */
export function checkRuleCompliance(operation, context = {}) {
  const results = {
    compliant: true,
    violations: [],
    warnings: [],
    requiredTools: new Set(),
    suggestions: []
  };
  
  for (const [ruleKey, rule] of Object.entries(RULES)) {
    const passes = rule.check(operation, context);
    
    if (!passes) {
      if (rule.severity === 'CRITICAL' || rule.severity === 'HIGH') {
        results.compliant = false;
        results.violations.push({
          rule: rule.name,
          message: rule.violationMessage,
          severity: rule.severity
        });
        
        ruleEngineState.violations.push({
          rule: rule.name,
          timestamp: Date.now(),
          operation
        });
        ruleEngineState.consecutiveViolations++;
      } else {
        results.warnings.push({
          rule: rule.name,
          message: rule.violationMessage,
          severity: rule.severity
        });
      }
      
      // Add required tools to suggestions
      rule.requiredTools.forEach(tool => results.requiredTools.add(tool));
    }
  }
  
  // Generate suggestions based on context
  results.suggestions = generateSuggestions(operation, context, results);
  
  ruleEngineState.lastCheck = Date.now();
  
  return results;
}

/**
 * Generate contextual suggestions for the AI
 */
function generateSuggestions(operation, context, complianceResults) {
  const suggestions = [];
  
  // If violations detected, suggest required tools
  if (complianceResults.violations.length > 0) {
    suggestions.push('URGENT: Address violations before proceeding:');
    complianceResults.violations.forEach(v => {
      suggestions.push(`  - ${v.message}`);
    });
  }
  
  // Context-aware suggestions
  if (operation === 'write_file' && !context.fileExists) {
    suggestions.push('RECOMMENDED: Use search_code_files to find the correct file location.');
    suggestions.push('RECOMMENDED: Use list_directory to verify folder structure.');
  }
  
  if (operation === 'write_file' && !context.planExplained) {
    suggestions.push('REQUIRED: Explain your plan before writing.');
    suggestions.push('  - What are you changing?');
    suggestions.push('  - Why are you changing it?');
    suggestions.push('  - What tools will you use?');
  }
  
  if (complianceResults.requiredTools.size > 0) {
    suggestions.push('RECOMMENDED TOOLS:');
    complianceResults.requiredTools.forEach(tool => {
      suggestions.push(`  - ${tool}`);
    });
  }
  
  return suggestions;
}

/**
 * Inject rule compliance into tool responses
 */
export function injectRuleCompliance(response, operation, context = {}) {
  if (!response.content) return response;
  
  const compliance = checkRuleCompliance(operation, context);
  
  let complianceText = '\n\n[ RULE ENGINE CHECK ]\n';
  
  if (compliance.compliant) {
    complianceText += '✓ All rules passed\n';
  } else {
    complianceText += '✗ RULE VIOLATIONS DETECTED:\n';
    compliance.violations.forEach(v => {
      complianceText += `  [${v.severity}] ${v.message}\n`;
    });
  }
  
  if (compliance.warnings.length > 0) {
    complianceText += '\n⚠ WARNINGS:\n';
    compliance.warnings.forEach(w => {
      complianceText += `  [${w.severity}] ${w.message}\n`;
    });
  }
  
  if (compliance.suggestions.length > 0) {
    complianceText += '\n💡 SUGGESTIONS:\n';
    compliance.suggestions.forEach(s => {
      complianceText += `  ${s}\n`;
    });
  }
  
  // Add to last text content
  for (let i = response.content.length - 1; i >= 0; i--) {
    if (response.content[i].type === 'text') {
      response.content[i].text += complianceText;
      break;
    }
  }
  
  return response;
}

/**
 * Get rule engine statistics
 */
export function getRuleEngineStats() {
  return {
    violations: ruleEngineState.violations,
    warnings: ruleEngineState.warnings,
    consecutiveViolations: ruleEngineState.consecutiveViolations,
    lastCheck: ruleEngineState.lastCheck
  };
}

/**
 * Reset rule engine state
 */
export function resetRuleEngineState() {
  ruleEngineState = {
    violations: [],
    warnings: [],
    lastCheck: null,
    consecutiveViolations: 0
  };
}
