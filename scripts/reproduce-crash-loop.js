/**
 * Standalone Crash-Loop Reproduction
 *
 * Mimics the dependency-checker.js behavior that causes
 * PowerShell terminal output to disappear.
 *
 * This script forks a child every second that immediately
 * crashes (ENOENT). Run it in a PowerShell terminal and
 * observe whether subsequent commands lose output.
 *
 * Usage:
 *   node scripts/reproduce-crash-loop.js
 *   # Then try running: echo "hello"
 *   # If output disappears, crash loop confirmed.
 */

import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CRASH_CHILD_PATH = path.join(__dirname, 'crash-child.js');

console.log('='.repeat(60));
console.log('CRASH LOOP REPRODUCTION');
console.log('This mimics the dependency-checker.js crash loop.');
console.log('Watch your PowerShell terminal after this starts.');
console.log('If echo/ls/commands stop producing output, BUG CONFIRMED.');
console.log('='.repeat(60));

let iteration = 0;

function spawnCrashChild() {
  iteration++;
  process.stdout.write(`[${iteration}] Forking crash child... `);
  const child = fork(CRASH_CHILD_PATH, [], {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  });

  child.on('exit', (code) => {
    process.stdout.write(`crashed (code ${code})\n`);
    setTimeout(spawnCrashChild, 1000);
  });

  child.on('error', (err) => {
    process.stdout.write(`error: ${err.message}\n`);
    setTimeout(spawnCrashChild, 1000);
  });
}

// Also spawn a "canary" command every 3 seconds to test terminal health
setInterval(() => {
  console.log(`[CANARY] Terminal still alive? Iteration=${iteration}`);
}, 3000);

spawnCrashChild();
