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
import { readFileHandler, checkFileStatsHandler, isSafeToReadHandler, readFileChunkedHandler, fileInfoHandler } from './handlers-file-read.js';
import { backupManageHandler } from './handlers-file-backup.js';
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
// False positive reporter
import { falsePositiveHandlers } from './handlers-false-positive.js';
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
// Surface Layer - AI-facing semantic entry points (7 tools only)
import { fileOpsHandler } from './surface/file-ops-surface.js';
import { backupRestoreHandler } from './surface/backup-restore-surface.js';
import { projectContextHandler } from './surface/project-context-surface.js';
import { sweobeymeExecuteHandler } from './surface/sweobeyme-execute-surface.js';

/**
 * Main tool handlers registry
 * Surface Layer: 7 semantic entry point tools for AI
 * Core Layer: Governance router handles all internal routing
 * Governance Tools: Direct access to governance functions
 */
export const toolHandlers = {
  // 1. file_ops - File read, write, analyze, extract operations
  file_ops: fileOpsHandler,

  // 2. search_code - Search the codebase
  search_code: codeSearchHandlers.search_code,

  // 3. backup_restore - Backup and restore operations
  backup_restore: backupRestoreHandler,

  // 4. project_context - Get project context and information
  project_context: projectContextHandler,

  // 5. docs_manage - Documentation lookup and management
  docs_manage: async (params) => {
    const { operation, query, corpus, category, topics, tags, maxResults, formula, algorithm, constraints, properties } = params;

    if (!operation) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'operation parameter is required (lookup, list_corpora, list_categories, verify)' }],
      };
    }

    switch (operation) {
      case 'lookup':
        return await docsToolHandlers.docs_lookup({ query, corpus, category, topics, tags, maxResults });
      case 'list_corpora':
        return await docsToolHandlers.docs_list_corpora({});
      case 'list_categories':
        return await docsToolHandlers.docs_list_categories({ corpus });
      case 'verify':
        return await docsToolHandlers.docs_verify({ formula, algorithm, constraints, properties });
      default:
        return {
          isError: true,
          content: [{ type: 'text', text: `Unknown operation: ${operation}. Valid: lookup, list_corpora, list_categories, verify` }],
        };
    }
  },

  // 6. workflow_manage - Workflow orchestration
  workflow_manage: workflowHandlers.workflow_manage,

  // 7. sweobeyme_execute - Catch-all governance router for advanced operations
  sweobeyme_execute: sweobeymeExecuteHandler,

  // Governance tools - direct access
  ...governanceHandlers,
  ...diagnosticsHandlers,
  ...autoEnforcementHandlers,
  ...auditHandlers,
  ...autonomousHandlers,
  ...statusHandlers,

  // File operations
  read_file: readFileHandler,
  check_file_stats: checkFileStatsHandler,
  is_safe_to_read: isSafeToReadHandler,
  read_file_chunked: readFileChunkedHandler,
  file_info: fileInfoHandler,

  // Validation - wired directly so validate_code tool resolves
  validate_code: validationHandlers.validate_code,

  // False positive reporting - AI calls this directly, no user involvement
  ...falsePositiveHandlers,

  // Internal handlers for governance router
  backup_manage: backupManageHandler,
  governance_manage: governanceHandlers.get_governance_constitution,
  project_manage: projectContextHandler,

  // --- Governance router target wiring ---
  // All names below must exactly match governance-router-handler.js internalToolRegistry values

  // files domain (write/analyze/extract were missing from surface)
  ...fileOperationHandlers,

  // refactor domain
  ...refactoringHandlers,

  // context domain — router uses 'context_manage', handler is analyze_file_handler
  context_manage: contextHandlers.analyze_file_handler,

  // safety domain — router uses 'safety_manage', handler is safety_check_handler
  safety_manage: safetyHandlers.safety_check_handler || safetyHandlers.safety_check,

  // config domain
  config_manage: configHandlers.config_manage,

  // memory domain — simple dispatcher over query_project_memory
  memory_manage: async (args) => {
    const { operation, projectName, queryType, filePath, filters, relatedTo } = args;
    if (operation === 'query' || queryType) {
      return await query_project_memory({ projectName, queryType: queryType || 'snapshot', filePath, filters, relatedTo });
    }
    if (operation === 'archives') {
      return await query_project_archives({ projectName });
    }
    if (operation === 'list') {
      return await list_projects({});
    }
    return await query_project_memory({ projectName, queryType: 'snapshot' });
  },

  // agent domain — router uses 'agent_orchestrate', handlers use 'agent_spawn'
  agent_orchestrate: multiAgentHandlers.agent_spawn || multiAgentHandlers.orchestrate,

  // csharp domain — router uses 'csharp_manage', bridge has specific named handlers
  csharp_manage: csharpBridgeHandlers.get_csharp_errors,
  ...csharpBridgeHandlers,
  ...csharpHandlers,

  // cpp domain
  cpp_manage: cppBridgeHandlers.get_cpp_errors,
  ...cppBridgeHandlers,

  // error domain — router uses 'error_detect'
  error_detect: comprehensiveErrorDetection,
  comprehensive_error_detection: comprehensiveErrorDetection,
  comprehensive_error_detection_file: comprehensiveErrorDetectionFile,
  get_error_detection_status: getErrorDetectionStatus,

  // spec domain — router uses 'spec_manage', handler has 'spec_load'
  spec_manage: specDrivenHandlers.spec_load || specDrivenHandlers.spec_manage,
  ...specDrivenHandlers,

  // codebase domain — router uses 'codebase_manage'
  codebase_manage: codebase_orientation_handler,
  codebase_orientation: codebase_orientation_handler,
  dependency_analysis: dependency_analysis_handler,
  entry_point_mapper: entry_point_mapper_handler,
  codebase_explore: codebase_explore_handler,

  // godot domain — router uses 'godot_manage'
  godot_manage: godot_lookup_handler,
  detect_godot_project: detect_godot_project_handler,
  check_godot_practices: check_godot_practices_handler,
  godot_lookup: godot_lookup_handler,

  // patreon domain — router uses 'patreon_manage'
  patreon_manage: async (args) => {
    const handler = new PatreonHandlers();
    const { operation } = args;
    if (operation === 'fetch_content') return await handler.patreonFetchContent(args);
    if (operation === 'apply_changes') return await handler.patreonApplyChanges(args);
    if (operation === 'generate_plan') return await handler.patreonGenerateRewritePlan(args);
    if (operation === 'write_drafts') return await handler.patreonWriteDrafts(args);
    return { isError: true, content: [{ type: 'text', text: 'patreon_manage: operation required (fetch_content, apply_changes, generate_plan, write_drafts)' }] };
  },

  // misc already-imported handlers not yet exposed
  ...projectIntegrityHandlers,
  ...projectMemoryHandlers,
  ...projectMapHandlers,
  ...versionTrackerHandlers,
  ...projectInitializationHandlers,
  ...publishValidationHandlers,
  ...feedbackHandlers,
  ...preflightHandlers,
  ...oracleHandlers,
  ...corpusManagementHandlers,
  ...safeFileOperationsHandlers,
  query_project_memory,
  query_project_archives,
  list_projects,
  get_tool_guidance: getToolGuidanceHandler,
};

export function setGetRandomQuote(fn) {
  setOracleQuote(fn);
}
