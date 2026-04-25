#!/usr/bin/env node

/**
 * Git Pre-Push Hook (Enforcement Layer)
 * Runs all governor checks and blocks push on failure
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PrePushHook {
  constructor() {
    this.repoRoot = dirname(dirname(__dirname));
    this.governorPath = join(__dirname, 'git-governor.js');
  }

  async run() {
    console.log('[PrePushHook] Running Git Publish Governor checks...');

    try {
      // Run the governor
      const command = `node "${this.governorPath}" --all`;
      execSync(command, {
        cwd: this.repoRoot,
        stdio: 'inherit',
      });

      console.log('[PrePushHook] ✅ All checks passed. Push allowed.');
      process.exit(0);
    } catch (error) {
      console.error('[PrePushHook] ❌ Governor checks failed. Push blocked.');
      console.error('[PrePushHook] Fix the issues or use --override to bypass (emergency only).');
      console.error('[PrePushHook] To bypass: git push --no-verify');
      process.exit(1);
    }
  }
}

const hook = new PrePushHook();
hook.run();
