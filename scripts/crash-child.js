/**
 * Crash Child — intentionally crashes by spawning a non-existent binary.
 * This reproduces the dependency-checker.js ENOENT crash.
 */

import { spawn } from 'child_process';

const child = spawn('clangd-which-does-not-exist', ['--version'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

// Intentionally NO error handler — same bug as dependency-checker.js
child.on('exit', () => {
  process.exit(1);
});
