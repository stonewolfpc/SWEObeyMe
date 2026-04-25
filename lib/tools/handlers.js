import { configHandlers } from './config-handlers.js';
import { validationHandlers } from './validation-handlers.js';
import { contextHandlers } from './context-handlers.js';
import { safetyHandlers } from './safety-handlers.js';
import { feedbackHandlers } from './feedback-handlers.js';
import { csharpHandlers } from './csharp-handlers.js';
import { csharpBridgeHandlers } from './csharp/bridge-handlers.js';
import { cppBridgeHandlers } from './cpp/bridge-handlers.js';
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
// Documentation handlers - consolidated into unified interface (saves 10 tools)
import { docsToolHandlers } from './registry-docs.js';
import {
  detect_godot_project_handler,
  check_godot_practices_handler,
  godot_lookup_handler,
} from './godot-handlers.js';
import PatreonHandlers from './patreon-handlers.js';
import { corpusManagementHandlers } from './handlers-corpus.js';
import { safeFileOperationsHandlers } from './handlers-file-safe.js';
import { governanceHandlers } from './handlers-governance.js';
import { diagnosticsHandlers } from './handlers-diagnostics.js';
import { autoEnforcementHandlers } from './handlers-auto-enforcement.js';
import { auditHandlers } from './handlers-audit.js';
import { autonomousHandlers } from './handlers-autonomous.js';
import { multiAgentHandlers } from './handlers-multi-agent.js';
import { specDrivenHandlers } from './handlers-spec-driven.js';
import {
  queryProjectMemory as query_project_memory,
  queryProjectArchives as query_project_archives,
  listProjects as list_projects,
} from './handlers-memory.js';
// Codebase orientation handlers for AI navigation
import {
  codebase_orientation_handler,
  dependency_analysis_handler,
  entry_point_mapper_handler,
  codebase_explore_handler,
} from './codebase-orientation-handlers.js';
// Comprehensive error detection handlers for catching all potential errors
import {
  comprehensiveErrorDetection,
  comprehensiveErrorDetectionFile,
  getErrorDetectionStatus,
} from './comprehensive-error-handlers.js';
// Tool guidance handler for tool awareness
import { getToolGuidanceHandler } from './tool-guidance-handler.js';

/**
 * Main tool handlers registry
 * This file imports and exports all handler modules to maintain the 700-line surgical limit
 */
export const toolHandlers = {
  // Project Awareness & Context Switching (highest priority)
  project_context: projectAwarenessHandlers.project_context_handler,
  project_rules: projectAwarenessHandlers.project_rules_handler,
  project_track: projectAwarenessHandlers.project_track_handler,
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
  backup_manage: fileOperationHandlers.backup_manage,
  code_analyze: fileOperationHandlers.code_analyze,
  ...fileOperationHandlers,

  // Status and metrics
  ...statusHandlers,

  // Workflow orchestration
  session_manage: workflowHandlers.session_manage_handler,
  workflow_manage: workflowHandlers.workflow_manage_handler,
  ...workflowHandlers,

  // Refactoring
  refactor_manage: refactoringHandlers.refactor_manage,
  refactor_move_block: refactoringHandlers.refactor_move_block,
  extract_to_new_file: refactoringHandlers.extract_to_new_file,

  // Preflight validation
  ...preflightHandlers,

  // Configuration
  config_manage: configHandlers.config_manage,
  get_config: configHandlers.get_config,
  set_config: configHandlers.set_config,
  reset_config: configHandlers.reset_config,
  get_config_schema: configHandlers.get_config_schema,
  enforce_strict_mode: configHandlers.enforce_strict_mode,

  // Validation
  validate_code: validationHandlers.validate_code,
  dry_run_write_file: validationHandlers.dry_run_write_file,
  validate_change_before_apply: validationHandlers.validate_change_before_apply,
  verify_syntax: validationHandlers.verify_syntax,
  check_for_anti_patterns: validationHandlers.check_for_anti_patterns,
  validate_naming_conventions: validationHandlers.validate_naming_conventions,
  verify_imports: validationHandlers.verify_imports,

  // Context
  analyze_file: contextHandlers.analyze_file_handler,
  diff_changes: contextHandlers.diff_changes,
  get_file_context: contextHandlers.get_file_context,
  analyze_change_impact: contextHandlers.analyze_change_impact,
  get_symbol_references: contextHandlers.get_symbol_references,
  get_historical_context: contextHandlers.get_historical_context,

  // Safety
  safety_check: safetyHandlers.safety_check,
  check_test_coverage: safetyHandlers.check_test_coverage,
  confirm_dangerous_operation: safetyHandlers.confirm_dangerous_operation,
  check_for_repetitive_patterns: safetyHandlers.check_for_repetitive_patterns,
  run_related_tests: safetyHandlers.run_related_tests,

  // Feedback
  guidance: feedbackHandlers.guidance,
  require_documentation: feedbackHandlers.require_documentation,
  generate_change_summary: feedbackHandlers.generate_change_summary,
  explain_rejection: feedbackHandlers.explain_rejection,
  suggest_alternatives: feedbackHandlers.suggest_alternatives,
  get_operation_guidance: feedbackHandlers.get_operation_guidance,

  // C# handlers (core + bridge)
  ...csharpHandlers,
  ...csharpBridgeHandlers,

  // C++ handlers (bridge)
  ...cppBridgeHandlers,

  // Project integrity
  ...projectIntegrityHandlers,

  // Code search
  search_code: codeSearchHandlers.search_code_handler,
  ...codeSearchHandlers,

  // Project memory
  project_memory: projectMemoryHandlers.project_memory_handler,
  ...projectMemoryHandlers,

  // Hidden memory tools (AI-query only)
  query_project_memory,
  query_project_archives,
  list_projects,

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

  // Documentation handlers - consolidated (replaces 14 individual corpus tools with 4)
  ...docsToolHandlers,

  // Godot project handlers (detection/practices separate from docs)
  detect_godot_project: detect_godot_project_handler,
  check_godot_practices: check_godot_practices_handler,
  godot_lookup: godot_lookup_handler,

  // Patreon handlers (instantiated as singleton)
  patreon_fetch_content: async (args) => {
    const handlers = new PatreonHandlers({ workspaceRoot: process.cwd() });
    const result = await handlers.patreonFetchContent(args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  },
  patreon_generate_rewrite_plan: async (args) => {
    const handlers = new PatreonHandlers({ workspaceRoot: process.cwd() });
    const result = await handlers.patreonGenerateRewritePlan(args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  },
  patreon_write_drafts: async (args) => {
    const handlers = new PatreonHandlers({ workspaceRoot: process.cwd() });
    const result = await handlers.patreonWriteDrafts(args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  },
  patreon_apply_changes: async (args) => {
    const handlers = new PatreonHandlers({ workspaceRoot: process.cwd() });
    const result = await handlers.patreonApplyChanges(args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  },

  // Corpus management handlers for dynamic tool surface slimming
  corpus_manage: corpusManagementHandlers.corpus_manage,
  ...corpusManagementHandlers,

  // Safe file operations handlers to prevent hangs on large files
  file_info: safeFileOperationsHandlers.file_info,
  ...safeFileOperationsHandlers,

  // Governance handlers to establish SWEObeyMe's authority
  ...governanceHandlers,

  // Diagnostics handlers for Windsurf UI integration
  ...diagnosticsHandlers,

  // Auto-enforcement and audit system tools
  auto_enforce: autoEnforcementHandlers.auto_enforce_handler,
  audit: auditHandlers.audit_handler,
  ...autoEnforcementHandlers,
  ...auditHandlers,

  // Autonomous execution handlers - "Anti-Vibe-Coder / 3AM Finish This While I'm Gone" Upgrade
  ...autonomousHandlers,

  // Multi-agent orchestration handlers - Parallel agent execution with conflict resolution
  ...multiAgentHandlers,

  // Spec-driven development handlers - requirements.md, design.md, tasks.md as source of truth
  ...specDrivenHandlers,

  // Codebase orientation handlers for AI navigation
  codebase_orientation: codebase_orientation_handler,
  dependency_analysis: dependency_analysis_handler,
  entry_point_mapper: entry_point_mapper_handler,
  codebase_explore: codebase_explore_handler,

  // Comprehensive error detection handlers for catching all potential errors
  comprehensive_error_detection: comprehensiveErrorDetection,
  comprehensive_error_detection_file: comprehensiveErrorDetectionFile,
  get_error_detection_status: getErrorDetectionStatus,

  // Tool guidance handler for tool awareness (highest priority)
  get_tool_guidance: getToolGuidanceHandler,

  // Implementation knowledge handler for experimental tracking
  query_implementation_knowledge: projectMemoryHandlers.query_implementation_knowledge,
};

export function setGetRandomQuote(fn) {
  setOracleQuote(fn);
}
