import { unifiedHandlers } from './unified-handlers.js';

export const unifiedToolDefinitions = [
  {
    name: 'unified_lookup',
    description: 'MUST use this tool to search across all documentation corpora or a specific corpus. This is the ONLY way to access C#/.NET, Git, Enterprise/Security, TypeScript/JavaScript, VS Code Extension API, Security/CSP, Build/Deployment, Testing/QA, MCP Implementation, Performance/Profiling, Node.js Runtime, and Web Development documentation.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to find relevant documentation'
        },
        corpus: {
          type: 'string',
          description: 'Optional: Specific corpus to search (csharp_dotnet, git, enterprise_security, typescript_javascript, vscode_extension, security_csp, build_deployment, testing_qa, mcp_implementation, performance_profiling, nodejs_runtime, web_development)'
        },
        category: {
          type: 'string',
          description: 'Optional: Specific category within the corpus to search'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional: Tags to filter results'
        }
      }
    },
    handler: unifiedHandlers.unified_lookup,
    priority: 1
  },
  {
    name: 'unified_list_categories',
    description: 'MUST use this tool to list categories within a specific corpus or all corpora. This is the ONLY way to see available categories in the documentation corpora.',
    inputSchema: {
      type: 'object',
      properties: {
        corpus: {
          type: 'string',
          description: 'Optional: Specific corpus to list categories for. If not provided, lists all corpora and their categories.'
        }
      }
    },
    handler: unifiedHandlers.unified_list_categories,
    priority: 1
  },
  {
    name: 'unified_list_corpora',
    description: 'MUST use this tool to list all available documentation corpora. This is the ONLY way to see what documentation corpora are available.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: unifiedHandlers.unified_list_corpora,
    priority: 1
  }
];
