/**
 * GitHub Issue Notification Prompt
 *
 * Dynamic prompt — reads %USERPROFILE%\sweobeyme-issues at get-time.
 * If unread issues exist, returns a message instructing the AI to notify the user.
 * If none, returns a no-op so the AI ignores it silently.
 *
 * Category: governance
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const SYNC_DIR = path.join(os.homedir(), 'sweobeyme-issues');
const READ_MARKER = '.read';

function getUnreadIssues() {
  if (!fs.existsSync(SYNC_DIR)) return [];

  const entries = fs.readdirSync(SYNC_DIR, { withFileTypes: true });
  const unread = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('issue-')) continue;
    const dir = path.join(SYNC_DIR, entry.name);
    const readMarker = path.join(dir, READ_MARKER);
    if (fs.existsSync(readMarker)) continue;

    try {
      const issueJson = path.join(dir, 'issue.json');
      if (!fs.existsSync(issueJson)) continue;
      const issue = JSON.parse(fs.readFileSync(issueJson, 'utf-8'));
      unread.push({
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        dir,
        createdAt: issue.created_at,
      });
    } catch {
      // skip malformed
    }
  }

  return unread.sort((a, b) => a.number - b.number);
}

function markRead(issues) {
  for (const issue of issues) {
    try {
      fs.writeFileSync(path.join(issue.dir, READ_MARKER), new Date().toISOString(), 'utf-8');
    } catch {
      // best-effort
    }
  }
}

export function generate() {
  const issues = getUnreadIssues();

  if (issues.length === 0) {
    return {
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: '_No unread SWEObeyMe issues._' },
        },
      ],
    };
  }

  // Mark read immediately — the AI is receiving them right now
  markRead(issues);

  const list = issues
    .map((i) => `- **Issue #${i.number}**: ${i.title}\n  URL: ${i.url}\n  Folder: \`${i.dir}\``)
    .join('\n');

  const text =
    `⚠️ SWEObeyMe has ${issues.length} unread auto-reported issue(s).\n\n` +
    `${list}\n\n` +
    '**ACTION REQUIRED**:\n' +
    '1. Notify the user immediately with the issue number(s), title(s), and GitHub URL(s).\n' +
    '2. Read `body.md` in the issue folder to understand the failure.\n' +
    '3. Ask the user if they want to investigate or act on it now.\n' +
    '4. When the issue is fully resolved, delete the issue folder to remove it from tracking.';

  return {
    messages: [
      {
        role: 'user',
        content: { type: 'text', text },
      },
    ],
  };
}

export const promptDefinition = {
  name: 'github_issue_notification',
  description:
    'Checks for unread auto-reported SWEObeyMe GitHub issues and instructs the AI to notify the user. Call at session start.',
  category: 'governance',
  governanceLevel: 'strict',
  dynamic: true,
  arguments: [],
  template: '_Dynamic — generated at call time from local issue sync folder._',
};
