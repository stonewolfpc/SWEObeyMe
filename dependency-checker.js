/**
 * External Dependency Checker Process
 *
 * Runs dependency checks asynchronously in a separate process.
 * Communicates results back to MCP server via IPC.
 * Never blocks the MCP server's event loop.
 */

import { spawn } from 'child_process';

function runCommand(cmd, args = [], timeout = 5000) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    let finished = false;

    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        child.kill('SIGKILL');
        resolve({ ok: false, error: 'timeout' });
      }
    }, timeout);

    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));

    child.on('exit', (code) => {
      if (finished) return;
      clearTimeout(timer);
      finished = true;

      resolve({
        ok: code === 0,
        code,
        stdout,
        stderr,
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

  process.send({ type: 'dependency-health', results });
}

async function loop() {
  await checkAll();
  setTimeout(loop, 5 * 60 * 1000); // every 5 minutes
}

process.on('message', (msg) => {
  if (msg === 'run-once') checkAll();
});

loop();
