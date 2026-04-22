/**
 * C++ tool definitions
 */

export function getCppToolDefinitions() {
  return [
    {
      name: 'get_cpp_errors',
      priority: 75,
      description: 'C++ ERROR ANALYSIS - Get all C++ errors in the workspace. Returns errors with severity levels (Info/Warning/Error), line ranges, and file paths. Detects memory leaks, missing virtual destructors, buffer overflow risks, and more. Use this when: checking overall C++ code quality across the workspace before making changes. CRITICAL for understanding C++ code quality.',
      inputSchema: {
        type: 'object',
        properties: {
          severityThreshold: {
            type: 'number',
            default: 0,
            description: 'Minimum severity level (0=Info, 1=Warning, 2=Error)',
          },
        },
      },
    },
    {
      name: 'get_cpp_errors_for_file',
      priority: 75,
      description: 'C++ FILE ERROR ANALYSIS - Get C++ errors for a specific file. Returns errors with severity levels and line ranges. Detects memory leaks, missing null checks, unsafe string operations, and more. Use this when: analyzing a specific C++ file before editing or after changes to verify no new errors introduced.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to analyze' },
          severityThreshold: {
            type: 'number',
            default: 0,
            description: 'Minimum severity level (0=Info, 1=Warning, 2=Error)',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'get_cpp_integrity_report',
      priority: 75,
      description: 'C++ INTEGRITY REPORT - Generate surgical integrity report for a C++ file. Returns score (0-100), status, critical/warning/info counts, tools used, and recommendations. Use this when: evaluating C++ file quality before committing or after refactoring.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to analyze' },
        },
        required: ['path'],
      },
    },
    {
      name: 'toggle_cpp_error_type',
      priority: 70,
      description: 'C++ ERROR TYPE TOGGLE - Enable or disable specific C++ error detection rules. Rules include: memory_leak_raw_new, missing_virtual_destructor, raw_array_new, missing_null_check, buffer_overflow_risk, and more. Use this when: reducing false positives by disabling noisy rules, or enabling additional checks for stricter analysis.',
      inputSchema: {
        type: 'object',
        properties: {
          error_id: { type: 'string', description: 'Error rule ID to toggle (e.g., memory_leak_raw_new)' },
          enabled: { type: 'boolean', description: 'Enable or disable' },
        },
        required: ['error_id', 'enabled'],
      },
    },
    {
      name: 'set_cpp_ai_informed',
      priority: 70,
      description: 'C++ AI-INFORMED MODE - Toggle automatic error injection into tool outputs. When enabled, C++ errors will be automatically injected into tool responses. Use this when: wanting AI to be aware of C++ errors without explicit requests.',
      inputSchema: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean', description: 'Enable or disable AI-informed mode' },
        },
        required: ['enabled'],
      },
    },
    {
      name: 'update_cpp_config',
      priority: 70,
      description: 'C++ CONFIG UPDATE - Update C++ Bridge configuration settings. Can configure severity thresholds, confidence thresholds, clang-tidy/cppcheck integration, deduplication, and detector settings. Use this when: customizing C++ error detection behavior for your project.',
      inputSchema: {
        type: 'object',
        properties: {
          severityThreshold: { type: 'number', description: 'Minimum severity level' },
          confidenceThreshold: { type: 'number', description: 'Minimum confidence score (0-100)' },
          useClangTidy: { type: 'boolean', description: 'Enable clang-tidy integration' },
          useCppcheck: { type: 'boolean', description: 'Enable cppcheck integration' },
          deduplicateAlerts: { type: 'boolean', description: 'Enable alert deduplication' },
          alertCooldown: { type: 'number', description: 'Alert cooldown in seconds' },
        },
      },
    },
    {
      name: 'undo_last_cpp_edit',
      priority: 80,
      description: 'UNDO C++ SURGICAL EDIT - Restore a C++ file from its most recent backup. Use this when: a surgical edit introduced errors or you need to revert to the previous state. CRITICAL for error recovery in C++ projects.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to restore' },
        },
        required: ['path'],
      },
    },
  ];
}
