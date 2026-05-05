/**
 * External Dependency Checker Process
 *
 * Runs dependency checks asynchronously in a separate process.
 * Communicates results back to MCP server via IPC.
 * Never blocks the MCP server's event loop.
 *
 * Dependencies are "soft" - if not found, features gracefully degrade.
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Find executable in PATH or common installation locations
 */
function findExecutable(name, customPath) {
  // 1. Check custom path from env var
  if (customPath && existsSync(customPath)) {
    return customPath;
  }

  // 2. Check PATH environment variable
  const pathEnv = process.env.PATH || process.env.Path || '';
  const pathDirs = pathEnv.split(path.delimiter);
  for (const dir of pathDirs) {
    const exePath = path.join(dir, name + (process.platform === 'win32' ? '.exe' : ''));
    if (existsSync(exePath)) {
      return exePath;
    }
  }

  // 3. Check common installation locations
  const commonPaths = {
    clangd: [
      'C:\\Program Files\\LLVM\\bin\\clangd.exe',
      'C:\\Program Files (x86)\\LLVM\\bin\\clangd.exe',
      '/usr/bin/clangd',
      '/usr/local/bin/clangd',
    ],
    'clang-tidy': [
      'C:\\Program Files\\LLVM\\bin\\clang-tidy.exe',
      'C:\\Program Files (x86)\\LLVM\\bin\\clang-tidy.exe',
      '/usr/bin/clang-tidy',
      '/usr/local/bin/clang-tidy',
    ],
    cppcheck: [
      'C:\\Program Files\\Cppcheck\\cppcheck.exe',
      'C:\\Program Files (x86)\\Cppcheck\\cppcheck.exe',
      '/usr/bin/cppcheck',
      '/usr/local/bin/cppcheck',
    ],
  };

  if (commonPaths[name]) {
    for (const commonPath of commonPaths[name]) {
      if (existsSync(commonPath)) {
        return commonPath;
      }
    }
  }

  return null;
}

function runCommand(cmd, args = [], timeout = 5000) {
  return new Promise((resolve) => {
    // Find executable with auto-detection
    const customPath = process.env[cmd.toUpperCase() + '_PATH'];
    const exePath = findExecutable(cmd, customPath);

    if (!exePath) {
      resolve({ ok: false, error: 'not installed', executable: null });
      return;
    }

    const child = spawn(exePath, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    let finished = false;

    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        child.kill('SIGKILL');
        resolve({ ok: false, error: 'timeout', executable: exePath });
      }
    }, timeout);

    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));

    child.on('error', (err) => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        resolve({
          ok: false,
          error: err.code === 'ENOENT' ? 'not installed' : err.message,
          executable: exePath,
        });
      }
    });

    child.on('exit', (code) => {
      if (finished) return;
      clearTimeout(timer);
      finished = true;

      resolve({
        ok: code === 0,
        code,
        stdout,
        stderr,
        executable: exePath,
      });
    });
  });
}

async function checkAll() {
  const results = {};

  results.git = await runCommand('git', ['--version']);
  results.dotnet = await runCommand('dotnet', ['--version']);
  results.clangd = await runCommand('clangd', ['--version']);
  results['clang-tidy'] = await runCommand('clang-tidy', ['--version']);
  results.cppcheck = await runCommand('cppcheck', ['--version']);
  results.npm = await runCommand('npm', ['--version']);
  results.node = await runCommand('node', ['--version']);

  if (process.send) {
    process.send({ type: 'dependency-health', results });
  }
}

async function loop() {
  await checkAll();
  setTimeout(loop, 5 * 60 * 1000); // every 5 minutes
}

process.on('message', (msg) => {
  if (msg === 'run-once') checkAll();
});

loop();
