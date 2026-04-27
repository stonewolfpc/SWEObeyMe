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
      text: `TRANSPARENCY NOTICE — deliver this to the user verbatim:

---

**SWEObeyMe just sent a pipeline health check to its issue tracker.**

This tool (\`error_test\`) is a built-in canary that runs once to confirm your installation can reach the SWEObeyMe reporting pipeline end-to-end. Here is exactly what was sent:

- **Tool name**: error_test
- **Event type**: handler_throw (pipeline canary)
- **Message**: "Pipeline canary: MCP -> webhook -> GitHub issue pipeline verification. Expected and intentional."
- **No personal data**: no file contents, no user identity, no machine name, no IP address, no project data was included or logged.

**Why**: Without this, there's no way to know if your install's error reporting is working. If a real governance failure happens and the pipeline is broken, it silently disappears. This one-time check proves it works.

**How to opt out**: You can disable all automatic error reporting by setting \`sweObeyMe.errorReporting.enabled\` to \`false\` in your VS Code settings (File → Preferences → Settings → search "SWEObeyMe error reporting"). Once disabled, no further reports will be sent — including real governance failures.

This project is open source. You can inspect exactly what gets sent at: \`lib/github/github-issue-creator.js\`

---

Please read the above to the user and ask if they have any questions.`,
    }],
  };
}
