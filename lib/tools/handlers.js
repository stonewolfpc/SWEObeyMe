import { configHandlers } from './config-handlers.js';
import { validationHandlers } from './validation-handlers.js';
import { contextHandlers } from './context-handlers.js';
import { safetyHandlers } from './safety-handlers.js';
import { feedbackHandlers } from './feedback-handlers.js';
import { csharpHandlers } from './csharp-handlers.js';
import { projectIntegrityHandlers } from './project-integrity-handlers.js';
import { codeSearchHandlers } from './code-search-handlers.js';
import { projectMemoryHandlers } from './project-memory-handlers.js';
import { projectMapHandlers } from './project-map-handlers.js';
import { versionTrackerHandlers } from './version-tracker-handlers.js';
import { projectInitializationHandlers } from './project-initialization-handlers.js';
import { publishValidationHandlers } from './publish-validation-handlers.js';
import { fileOperationHandlers } from './handlers-file-ops.js';
import { statusHandlers } from './handlers-status.js';
import { workflowHandlers } from './handlers-workflow.js';
import { refactoringHandlers } from './handlers-refactoring.js';
import { preflightHandlers } from './handlers-preflight.js';
import { setGetRandomQuote as setOracleQuote, oracleHandlers } from './handlers-oracle.js';
import * as projectAwarenessHandlers from './project-awareness-handlers.js';

/**
 * Main tool handlers registry
 * This file imports and exports all handler modules to maintain the 700-line surgical limit
 */
export const toolHandlers = {
  // Project Awareness & Context Switching (highest priority)
  detect_project_type: projectAwarenessHandlers.detect_project_type_handler,
  detect_project_switch: projectAwarenessHandlers.detect_project_switch_handler,
  get_current_project: projectAwarenessHandlers.get_current_project_handler,
  validate_action: projectAwarenessHandlers.validate_action_handler,
  get_project_rules: projectAwarenessHandlers.get_project_rules_handler,
  switch_project: projectAwarenessHandlers.switch_project_handler,
  add_pending_task: projectAwarenessHandlers.add_pending_task_handler,
  add_project_warning: projectAwarenessHandlers.add_project_warning_handler,
  add_project_error: projectAwarenessHandlers.add_project_error_handler,
  clear_pending_tasks: projectAwarenessHandlers.clear_pending_tasks_handler,
  get_all_projects: projectAwarenessHandlers.get_all_projects_handler,

  // File operations
  ...fileOperationHandlers,

  // Status and metrics
  ...statusHandlers,

  // Workflow orchestration
  ...workflowHandlers,

  // Refactoring
  ...refactoringHandlers,

  // Preflight validation
  ...preflightHandlers,

  // Configuration
  get_config: configHandlers.get_config,
  set_config: configHandlers.set_config,
  reset_config: configHandlers.reset_config,
  get_config_schema: configHandlers.get_config_schema,
  enforce_strict_mode: configHandlers.enforce_strict_mode,

  // Validation
  dry_run_write_file: validationHandlers.dry_run_write_file,
  validate_change_before_apply: validationHandlers.validate_change_before_apply,
  verify_syntax: validationHandlers.verify_syntax,
  check_for_anti_patterns: validationHandlers.check_for_anti_patterns,
  validate_naming_conventions: validationHandlers.validate_naming_conventions,
  verify_imports: validationHandlers.verify_imports,

  // Context
  diff_changes: contextHandlers.diff_changes,
  get_file_context: contextHandlers.get_file_context,
  analyze_change_impact: contextHandlers.analyze_change_impact,
  get_symbol_references: contextHandlers.get_symbol_references,
  get_historical_context: contextHandlers.get_historical_context,

  // Safety
  check_test_coverage: safetyHandlers.check_test_coverage,
  confirm_dangerous_operation: safetyHandlers.confirm_dangerous_operation,
  check_for_repetitive_patterns: safetyHandlers.check_for_repetitive_patterns,
  run_related_tests: safetyHandlers.run_related_tests,

  // Feedback
  require_documentation: feedbackHandlers.require_documentation,
  generate_change_summary: feedbackHandlers.generate_change_summary,
  explain_rejection: feedbackHandlers.explain_rejection,
  suggest_alternatives: feedbackHandlers.suggest_alternatives,
  get_operation_guidance: feedbackHandlers.get_operation_guidance,

  // C# handlers
  ...csharpHandlers,

  // Project integrity
  ...projectIntegrityHandlers,

  // Code search
  ...codeSearchHandlers,

  // Project memory
  ...projectMemoryHandlers,

  // Project map
  ...projectMapHandlers,

  // Version tracker
  ...versionTrackerHandlers,

  // Project initialization
  ...projectInitializationHandlers,

  // Publish validation
  ...publishValidationHandlers,

  // Oracle
  ...oracleHandlers,
};

export function setGetRandomQuote(fn) {
  setOracleQuote(fn);
}
