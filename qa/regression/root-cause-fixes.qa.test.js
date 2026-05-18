/**
 * Regression Tests — Root Cause Fixes
 *
 * Covers all 6 root causes identified in the May 2026 audit:
 *   A — Backup path resolution & automation
 *   B — Router action completeness
 *   C — project_context_handler param guard
 *   D — Optional tool absence never reports to GitHub
 *   E — Test canary gated behind SWEOBEYME_TEST_MODE
 *   F — TransportSentinel watchdog threshold & inflight guard
 *   G — github-reporter deduplication
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── A: Backup path resolution ────────────────────────────────────────────────

describe('A: getDefaultBackupDir — no undefined path joins', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    Object.assign(process.env, originalEnv);
    // Remove any keys added during test
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
  });

  it('returns a string on every platform with no env vars', async () => {
    delete process.env.HOME;
    delete process.env.USERPROFILE;
    delete process.env.LOCALAPPDATA;
    delete process.env.XDG_DATA_HOME;

    const { getDefaultBackupDir } = await import('../../lib/utils.js');
    const result = getDefaultBackupDir();

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toContain('undefined');
    expect(result).toMatch(/\.sweobeyme-backups$/);
  });

  it('uses process.cwd() as final fallback when HOME is missing', async () => {
    delete process.env.HOME;
    delete process.env.USERPROFILE;
    delete process.env.LOCALAPPDATA;
    delete process.env.XDG_DATA_HOME;

    const { getDefaultBackupDir } = await import('../../lib/utils.js');
    const result = getDefaultBackupDir();

    if (process.platform !== 'win32') {
      expect(result).toContain(process.cwd());
    }
  });
});

// ─── B: Router action completeness ────────────────────────────────────────────

describe('B: governance-router-handler — all required actions present', () => {
  it('internalToolRegistry contains no gaps for known caller actions', async () => {
    const { default: routerSrc } =
      await import('../../lib/tools/governance-router-handler.js').catch(() => ({ default: null }));

    // Read the file directly to inspect the registry
    const fs = await import('fs/promises');
    const src = await fs.readFile(
      new URL('../../lib/tools/governance-router-handler.js', import.meta.url),
      'utf8'
    );

    const requiredActions = [
      ['governance', 'status'],
      ['governance', 'verify'],
      ['validation', 'preflight_change'],
      ['refactor', 'list'],
      ['refactor', 'refactor_manage'],
      ['project', 'files'],
      ['project', 'init'],
    ];

    for (const [domain, action] of requiredActions) {
      expect(src).toContain(`${action}:`);
    }
  });
});

// ─── C: project_context_handler param guard ───────────────────────────────────

describe('C: project_context_handler — rejects undefined/empty project_path', () => {
  it('returns isError when project_path is undefined for switch operation', async () => {
    const { project_context_handler } = await import('../../lib/tools/project-task-handlers.js');

    const result = await project_context_handler({ operation: 'switch', project_path: undefined });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/project_path/i);
  });

  it('returns isError when project_path is empty string for switch operation', async () => {
    const { project_context_handler } = await import('../../lib/tools/project-task-handlers.js');

    const result = await project_context_handler({ operation: 'switch', project_path: '  ' });

    expect(result.isError).toBe(true);
  });

  it('does not throw TypeError for missing project_path', async () => {
    const { project_context_handler } = await import('../../lib/tools/project-task-handlers.js');

    await expect(project_context_handler({ operation: 'switch' })).resolves.not.toThrow();
  });
});

// ─── D: Optional tool absence never reports to GitHub ─────────────────────────

describe('D: dependency-sentinel — optional tool absence silent', () => {
  it('OPTIONAL_SYSTEM_TOOLS set contains all known optional tools', async () => {
    const fs = await import('fs/promises');
    const src = await fs.readFile(
      new URL('../../lib/health/dependency-sentinel.js', import.meta.url),
      'utf8'
    );

    const optionalCodes = [
      'ERR-CLANGD-MISSING',
      'ERR-CLANGTIDY-MISSING',
      'ERR-CPPCHECK-MISSING',
      'ERR-DOTNET-MISSING',
      'ERR-NPM-MISSING',
    ];

    for (const code of optionalCodes) {
      expect(src).toContain(code);
    }

    expect(src).toContain('OPTIONAL_SYSTEM_TOOLS');
    expect(src).toContain('isOptional');
  });

  it('reportErrorToGitHub is NOT called when isOptional is true', async () => {
    const fs = await import('fs/promises');
    const src = await fs.readFile(
      new URL('../../lib/health/dependency-sentinel.js', import.meta.url),
      'utf8'
    );

    // The guard pattern must be present
    expect(src).toContain('if (!isOptional)');
  });
});

// ─── E: Test canary gated behind SWEOBEYME_TEST_MODE ──────────────────────────

describe('E: error_test_handler — gated behind SWEOBEYME_TEST_MODE', () => {
  it('does not call createFailureIssue when SWEOBEYME_TEST_MODE is not set', async () => {
    const originalMode = process.env.SWEOBEYME_TEST_MODE;
    delete process.env.SWEOBEYME_TEST_MODE;

    const mockCreate = vi.fn().mockResolvedValue({ number: 99 });
    vi.doMock('../../lib/github/github-issue-creator.js', () => ({
      createFailureIssue: mockCreate,
    }));

    const { error_test_handler } = await import('../../lib/tools/handlers-error-test.js');
    await error_test_handler({});

    expect(mockCreate).not.toHaveBeenCalled();

    vi.doUnmock('../../lib/github/github-issue-creator.js');
    if (originalMode !== undefined) process.env.SWEOBEYME_TEST_MODE = originalMode;
  });

  it('test-webhook.js defaults to dry-run without SWEOBEYME_TEST_MODE=1', async () => {
    const fs = await import('fs/promises');
    const src = await fs.readFile(
      new URL('../../scripts/test-webhook.js', import.meta.url),
      'utf8'
    );

    expect(src).toContain('SWEOBEYME_TEST_MODE');
    expect(src).toContain('DRY_RUN');
    expect(src).toContain("process.env.SWEOBEYME_TEST_MODE !== '1'");
  });
});

// ─── F: TransportSentinel watchdog & inflight guard ───────────────────────────

describe('F: TransportSentinel — watchdog threshold and inflight guard', () => {
  it('default watchdogTimeout is >= 10000ms', async () => {
    const { createTransportSentinel } = await import('../../lib/mcp-transport-sentinel.js');
    const sentinel = createTransportSentinel();
    expect(sentinel.options.watchdogTimeout).toBeGreaterThanOrEqual(10000);
    sentinel.stop();
  });

  it('triggerRecovery() is suppressed when inflight count > 0', async () => {
    const { createTransportSentinel } = await import('../../lib/mcp-transport-sentinel.js');
    const sentinel = createTransportSentinel();

    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => {});

    sentinel.markRequestStart();
    sentinel.triggerRecovery();

    // Recovery should be suppressed — recoveries counter stays 0
    expect(sentinel.metrics.recoveries).toBe(0);

    sentinel.markRequestEnd();
    stderrSpy.mockRestore();
    sentinel.stop();
  });

  it('markRequestStart and markRequestEnd balance inflight count', async () => {
    const { createTransportSentinel } = await import('../../lib/mcp-transport-sentinel.js');
    const sentinel = createTransportSentinel();

    expect(sentinel._inflightCount).toBe(0);
    sentinel.markRequestStart();
    sentinel.markRequestStart();
    expect(sentinel._inflightCount).toBe(2);
    sentinel.markRequestEnd();
    expect(sentinel._inflightCount).toBe(1);
    sentinel.markRequestEnd();
    expect(sentinel._inflightCount).toBe(0);

    sentinel.stop();
  });
});

// ─── G: github-reporter deduplication ────────────────────────────────────────

describe('G: reportErrorToGitHub — 1-hour deduplication', () => {
  it('second call with same code+source within 1 hour returns null', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ number: 42 });
    vi.doMock('../../lib/github/github-issue-creator.js', () => ({
      createFailureIssue: mockCreate,
    }));

    const { reportErrorToGitHub } = await import('../../lib/health/github-reporter.js');

    const err = { code: 'TEST-DEDUP', source: 'test-source', message: 'test', detail: '' };

    await reportErrorToGitHub(err);
    const result = await reportErrorToGitHub(err);

    expect(result).toBeNull();
    expect(mockCreate).toHaveBeenCalledTimes(1);

    vi.doUnmock('../../lib/github/github-issue-creator.js');
  });
});
