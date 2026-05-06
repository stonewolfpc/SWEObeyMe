/**
 * Diagnostics Tool Registry
 * Tools for exposing server diagnostics and status to Windsurf UI
 */

export function getDiagnosticsToolDefinitions() {
  return [
    {
      name: 'get_server_diagnostics',
      priority: 98,
      description:
        "Get comprehensive server diagnostics including startup status, health checks, and component availability. This tool provides visibility into SWEObeyMe's internal state for debugging and monitoring. Returns: startup time, component status (backup directory, project contract, prompt registry, tool registry, C# Bridge), overall health status, and any warnings or errors. Use this when: troubleshooting server issues, verifying component availability, or checking server health.",
      inputSchema: {
        type: 'object',
        properties: {
          runChecks: {
            type: 'boolean',
            description:
              'Whether to run fresh diagnostic checks (default: false, returns cached results)',
          },
        },
        required: [],
      },
    },
    {
      name: 'get_validation_status',
      priority: 97,
      description:
        'Get current validation status and recent validation failures. This tool surfaces surgical compliance violations and pre-flight check results to the UI. Returns: surgical integrity score, consecutive failures, recent validation errors, and recommended actions. Use this when: checking compliance status, reviewing recent validation failures, or understanding why a change was rejected.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'validate_clean_install',
      priority: 96,
      description:
        'Validate clean installation by checking for stale MCP entries, duplicate extension folders, stale PATH/env variables, and stale config files. Returns detailed report of any installation issues found. Use this when: troubleshooting installation problems, verifying clean state after uninstall, or diagnosing duplicate installation conflicts.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  ];
}
