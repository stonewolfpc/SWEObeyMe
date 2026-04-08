/**
 * Generate tool-memory.json from registry
 * Automatically extracts tool metadata from registry.js
 */

import { getToolDefinitions } from '../lib/tools/registry.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generateToolMemory() {
  const tools = getToolDefinitions();
  const toolMemory = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    tools: {},
    categories: {},
    domains: {},
    heuristics: {
      primary: 'If a tool exists for the task, use it',
      secondary: 'If multiple tools exist, choose the highest-priority one',
      tertiary: 'If the tool fails, retry with context',
      fallback: 'If it fails again, use fallback tool',
      never: 'Never hallucinate a tool or manually edit when a tool exists',
    },
    conflicts: [],
  };

  // Process each tool
  for (const tool of tools) {
    const category = categorizeTool(tool.name);
    const domain = categorizeDomain(tool.name);
    const triggers = extractTriggers(tool.description);

    toolMemory.tools[tool.name] = {
      name: tool.name,
      category,
      domain,
      priority: tool.priority,
      description: tool.description.substring(0, 200) + '...',
      arguments: extractArguments(tool.inputSchema),
      usage_example: extractExample(tool.description),
      fallback: determineFallback(tool.name),
      conflicts: determineConflicts(tool.name),
      required_for: determineRequiredFor(tool.name),
      best_next_tool: determineBestNext(tool.description),
      triggers,
    };

    // Build category map
    if (!toolMemory.categories[category]) {
      toolMemory.categories[category] = {
        description: getCategoryDescription(category),
        priority_weight: getCategoryWeight(category),
      };
    }

    // Build domain map
    if (!toolMemory.domains[domain]) {
      toolMemory.domains[domain] = {
        description: getDomainDescription(domain),
        tools: [],
      };
    }
    if (!toolMemory.domains[domain].tools.includes(tool.name)) {
      toolMemory.domains[domain].tools.push(tool.name);
    }
  }

  // Add known conflicts
  toolMemory.conflicts = [
    {
      tool: 'write_file',
      conflicts_with: ['manual_edit', 'direct_write'],
      reason: 'Write_file enforces surgical rules and creates backups',
    },
    {
      tool: 'read_file',
      conflicts_with: ['direct_file_access'],
      reason: 'Read_file enforces .sweignore rules and injects architectural context',
    },
  ];

  // Write to file
  const outputPath = path.join(__dirname, 'tool-memory.json');
  await fs.writeFile(outputPath, JSON.stringify(toolMemory, null, 2), 'utf-8');
  console.log(`Generated tool-memory.json with ${tools.length} tools`);
}

function categorizeTool(toolName) {
  const categories = {
    file_operations: ['read_file', 'write_file', 'list_directory', 'create_backup', 'restore_backup'],
    governance: ['obey_surgical_plan', 'preflight_change', 'enforce_surgical_rules', 'obey_me_status', 'enforce_strict_mode'],
    analysis: ['get_file_context', 'analyze_change_impact', 'analyze_file_health', 'detect_architectural_drift', 'get_symbol_references'],
    project: ['index_project_structure', 'analyze_project_conventions', 'get_project_memory_summary', 'suggest_file_location', 'record_project_decision'],
    exploration: ['list_directory', 'get_session_context'],
    refactoring: ['refactor_move_block', 'extract_to_new_file'],
    validation: ['verify_syntax', 'verify_imports', 'validate_naming_conventions', 'check_test_coverage', 'require_documentation'],
    search: ['search_code_files', 'search_code_pattern', 'find_code_files'],
    config: ['get_config', 'set_config', 'reset_config', 'get_config_schema'],
    workflow: ['initiate_surgical_workflow', 'get_workflow_status'],
    csharp: ['get_csharp_errors', 'get_csharp_errors_for_file', 'get_integrity_report', 'toggle_csharp_error_type', 'set_csharp_ai_informed', 'update_csharp_config', 'undo_last_surgical_edit'],
    docs: ['search_llama_docs', 'list_llama_docs', 'search_math_docs', 'list_math_docs'],
    safety: ['confirm_dangerous_operation', 'sanitize_request'],
    recovery: ['auto_repair_submission', 'request_surgical_recovery'],
    feedback: ['check_for_anti_patterns', 'check_for_repetitive_patterns', 'explain_rejection', 'suggest_alternatives'],
    memory: ['record_decision', 'get_historical_context', 'get_operation_guidance'],
    testing: ['run_related_tests'],
  };

  for (const [category, tools] of Object.entries(categories)) {
    if (tools.includes(toolName)) {
      return category;
    }
  }

  return 'general';
}

function categorizeDomain(toolName) {
  const domains = {
    io: ['read_file', 'write_file', 'list_directory'],
    validation: ['obey_surgical_plan', 'preflight_change', 'enforce_surgical_rules', 'verify_syntax', 'verify_imports'],
    context: ['get_file_context', 'analyze_project_conventions', 'get_session_context'],
    impact: ['analyze_change_impact', 'get_symbol_references'],
    code: ['search_code_files', 'search_code_pattern', 'find_code_files', 'refactor_move_block', 'extract_to_new_file'],
    project: ['index_project_structure', 'get_project_memory_summary', 'suggest_file_location'],
    config: ['get_config', 'set_config', 'reset_config'],
    workflow: ['initiate_surgical_workflow', 'get_workflow_status'],
    csharp: ['get_csharp_errors', 'get_csharp_errors_for_file', 'get_integrity_report'],
    docs: ['search_llama_docs', 'list_llama_docs', 'search_math_docs', 'list_math_docs'],
    safety: ['confirm_dangerous_operation', 'sanitize_request'],
  };

  for (const [domain, tools] of Object.entries(domains)) {
    if (tools.includes(toolName)) {
      return domain;
    }
  }

  return 'general';
}

function extractTriggers(description) {
  const triggerPatterns = [
    /use this when: (.*?)\.?/i,
    /when: (.*?)\.?/i,
  ];

  const triggers = [];
  for (const pattern of triggerPatterns) {
    const match = description.match(pattern);
    if (match) {
      triggers.push(match[1].trim());
    }
  }

  return triggers.length > 0 ? triggers : ['general use'];
}

function extractArguments(inputSchema) {
  if (!inputSchema || !inputSchema.properties) {
    return [];
  }
  return Object.keys(inputSchema.properties);
}

function extractExample(description) {
  const match = description.match(/example: (.*?)\.?$/i);
  return match ? match[1].trim() : 'See tool description';
}

function determineFallback(toolName) {
  const fallbacks = {
    write_file: 'edit',
    read_file: 'list_directory',
    search_code_files: 'search_code_pattern',
    obey_surgical_plan: 'preflight_change',
    refactor_move_block: 'extract_to_new_file',
  };
  return fallbacks[toolName] || null;
}

function determineConflicts(toolName) {
  const conflicts = {
    write_file: ['manual_edit', 'direct_write'],
    read_file: ['direct_file_access'],
  };
  return conflicts[toolName] || [];
}

function determineRequiredFor(toolName) {
  const requiredFor = {
    obey_surgical_plan: ['write_file'],
    preflight_change: ['write_file'],
    get_file_context: ['refactor_move_block', 'extract_to_new_file'],
    analyze_change_impact: ['refactor_move_block', 'extract_to_new_file'],
  };
  return requiredFor[toolName] || [];
}

function determineBestNext(description) {
  const match = description.match(/best next tool after this: (.*?)\.?/i);
  if (match) {
    const tools = match[1].split(',').map(t => t.trim());
    return tools.slice(0, 2);
  }
  return [];
}

function getCategoryDescription(category) {
  const descriptions = {
    file_operations: 'Tools for reading and writing files',
    governance: 'Tools for enforcing architectural rules and validation',
    analysis: 'Tools for analyzing code structure and dependencies',
    project: 'Tools for project structure and memory management',
    exploration: 'Tools for exploring project structure',
    refactoring: 'Tools for refactoring and code organization',
    validation: 'Tools for validating code quality and compliance',
    search: 'Tools for searching code and patterns',
    config: 'Tools for configuration management',
    workflow: 'Tools for workflow orchestration',
    csharp: 'Tools for C# error detection and diagnostics',
    docs: 'Tools for accessing documentation',
    safety: 'Tools for safety and permission checks',
    recovery: 'Tools for error recovery',
    feedback: 'Tools for providing feedback and guidance',
    memory: 'Tools for session and historical memory',
    testing: 'Tools for running tests',
    general: 'General purpose tools',
  };
  return descriptions[category] || 'General tools';
}

function getCategoryWeight(category) {
  const weights = {
    file_operations: 1.5,
    governance: 2.0,
    analysis: 1.2,
    project: 1.1,
    exploration: 0.8,
    refactoring: 1.3,
    validation: 1.2,
    search: 1.0,
    config: 0.9,
    workflow: 1.4,
    csharp: 1.0,
    docs: 0.7,
    safety: 1.5,
    recovery: 1.1,
    feedback: 0.8,
    memory: 0.9,
    testing: 1.1,
    general: 1.0,
  };
  return weights[category] || 1.0;
}

function getDomainDescription(domain) {
  const descriptions = {
    io: 'Input/output operations',
    validation: 'Validation and rule enforcement',
    context: 'Context and dependency analysis',
    impact: 'Change impact analysis',
    code: 'Code manipulation and refactoring',
    project: 'Project structure and memory',
    config: 'Configuration management',
    workflow: 'Workflow orchestration',
    csharp: 'C# diagnostics and error detection',
    docs: 'Documentation access',
    safety: 'Safety and permission checks',
    general: 'General operations',
  };
  return descriptions[domain] || 'General operations';
}

generateToolMemory().catch(console.error);
