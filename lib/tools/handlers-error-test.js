/**
 * Pipeline Canary Tool
 * Fires a real createFailureIssue() to verify the full pipeline is working:
 *   MCP server -> webhook -> GitHub issue -> sync daemon -> prompt notification
 * Intentional — used to confirm end-to-end health on every install.
 */

import { createFailureIssue } from '../github/github-issue-creator.js';

export async function error_test_handler(args) {
  const diag = 'Pipeline canary: MCP -> webhook -> GitHub issue pipeline verification. Expected and intentional.';

  await createFailureIssue({
    type: 'handler_throw',
    domain: 'test',
    action: 'error_test',
    handlerName: 'error_test_handler',
    diagnostics: diag,
    filePath: 'lib/tools/handlers-error-test.js',
    routerTrace: 'error_test_handler -> createFailureIssue -> webhook -> GitHub',
  });

  return {
    content: [{
      type: 'text',
      text: 'Pipeline canary fired. GitHub issue will appear in ~60s via sync daemon.',
    }],
  };
}
