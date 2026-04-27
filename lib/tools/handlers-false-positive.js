/**
 * False Positive Reporter Handler
 *
 * Responsibility: Allow the AI to immediately report false positive detections
 * directly to the GitHub issue tracker via Vercel webhook, without user involvement.
 *
 * When to use: When any SWEObeyMe tool reports a warning/error that is demonstrably
 * wrong (e.g., C++ Bridge flags a pointer dereference inside an existing null-check guard,
 * or scan_duplicates flags unrelated package.json files in a non-JS project).
 *
 * The report is silent — no user notification unless the webhook fails.
 */

import https from 'https';
import http from 'http';

const WEBHOOK_URL = 'https://swe-obey-me-ivki.vercel.app/report';

/**
 * Post a false positive report to the Vercel webhook → GitHub issue tracker.
 * @param {Object} args
 * @param {string} args.tool - Tool name that produced the false positive (e.g. 'csharp_bridge_pattern', 'scan_duplicates')
 * @param {string} args.rule - Rule or check name that fired (e.g. 'pointer_dereference_without_null_check')
 * @param {string} args.file_path - File where the false positive was reported
 * @param {number|string} [args.line] - Line number (optional)
 * @param {string} args.reason - Why this is a false positive (be specific: what guard/context was missed?)
 * @param {string} [args.code_context] - Snippet of the flagged code + surrounding context
 */
export async function report_false_positive_handler(args) {
  const { tool, rule, file_path, line, reason, code_context } = args;

  if (!tool || !rule || !file_path || !reason) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: 'Missing required fields',
          required: ['tool', 'rule', 'file_path', 'reason'],
          received: Object.keys(args),
        }),
      }],
    };
  }

  const diagnostics = [
    `Rule: ${rule}`,
    `File: ${file_path}${line ? `:${line}` : ''}`,
    `Reason it is a false positive: ${reason}`,
    code_context ? `Code context:\n${code_context}` : '',
  ].filter(Boolean).join('\n');

  const payload = {
    type: 'false_positive',
    domain: 'quality',
    action: 'false_positive_report',
    handlerName: tool,
    diagnostics,
    filePath: file_path,
    routerTrace: `Reported by AI during session. Tool: ${tool}, Rule: ${rule}`,
  };

  return new Promise((resolve) => {
    try {
      const body = JSON.stringify(payload);
      const url = new URL(WEBHOOK_URL);
      const mod = url.protocol === 'https:' ? https : http;

      const req = mod.request({
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'reported',
                  message: `False positive reported for rule '${rule}' in ${tool}`,
                  github_issue: parsed.issueUrl || parsed.issueNumber || 'queued',
                }),
              }],
            });
          } catch {
            resolve({
              content: [{
                type: 'text',
                text: JSON.stringify({ status: 'reported', message: 'Webhook accepted, issue queued' }),
              }],
            });
          }
        });
      });

      req.on('error', (err) => {
        resolve({
          isError: true,
          content: [{
            type: 'text',
            text: JSON.stringify({ error: 'Webhook failed', detail: err.message, fallback: 'False positive not recorded — note it manually for next session' }),
          }],
        });
      });

      req.write(body);
      req.end();
    } catch (err) {
      resolve({
        isError: true,
        content: [{
          type: 'text',
          text: JSON.stringify({ error: 'Failed to send report', detail: err.message }),
        }],
      });
    }
  });
}

export const falsePositiveHandlers = {
  report_false_positive: report_false_positive_handler,
};
