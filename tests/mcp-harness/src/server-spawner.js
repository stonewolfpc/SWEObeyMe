/**
 * Server Spawner
 *
 * Spawns MCP servers exactly like Windsurf does.
 * Replicates extension.js:226-234 behavior.
 *
 * Command: Node.js executable (process.execPath)
 * Args: ['--no-warnings', serverJsPath]
 * Env: NODE_ENV='production', SWEOBEYME_BACKUP_DIR, SWEOBEYME_DEBUG='1'
 * Cwd: Configurable per scenario
 * Stdio: 'pipe' for all streams
 *
 * Supports spawn profiles for exact reproduction of Windsurf launch conditions.
 */

import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';

class ServerSpawner {
  constructor(logger) {
    this.logger = logger;
    this.process = null;
    this.spawnMetrics = {
      spawnTime: null,
      exitTime: null,
      exitCode: null,
      signal: null,
      stdoutBytes: 0,
      stderrBytes: 0,
    };
  }

  /**
   * Load a spawn profile from JSON file
   */
  loadSpawnProfile(profilePath) {
    try {
      const raw = fs.readFileSync(profilePath, 'utf8');
      return JSON.parse(raw);
    } catch (error) {
      this.logger.error('spawner', 'profile_load_failed', {
        path: profilePath,
        error: error.message,
      });
      throw new Error('Failed to load spawn profile: ' + profilePath);
    }
  }

  /**
   * Spawn the MCP server
   */
  spawn(serverPath, cwd, env = {}, spawnProfile = null) {
    let nodePath, args, spawnEnv;

    if (spawnProfile) {
      // Use exact spawn profile
      nodePath = spawnProfile.command;
      args = spawnProfile.args;
      spawnEnv = { ...spawnProfile.env };
      cwd = spawnProfile.cwd || cwd;

      this.logger.info('spawner', 'spawn_profile_loaded', {
        profile: spawnProfile,
      });
    } else {
      // Use default harness configuration
      nodePath = process.execPath;
      args = ['--no-warnings', serverPath];

      // Build environment - merge with process.env
      spawnEnv = {
        ...process.env,
        NODE_ENV: 'production',
        SWEOBEYME_DEBUG: '1',
        SWEOBEYME_BACKUP_DIR: path.join(os.homedir(), '.sweobeyme-backups'),
        ...env,
      };
    }

    this.logger.info('spawner', 'spawn_start', {
      command: nodePath,
      args,
      cwd,
      envKeys: Object.keys(spawnEnv),
      usingProfile: !!spawnProfile,
    });

    this.spawnMetrics.spawnTime = Date.now();

    try {
      this.process = spawn(nodePath, args, {
        cwd,
        env: spawnEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      });

      this.logger.info('spawner', 'spawn_success', {
        pid: this.process.pid,
      });

      // Track exit
      this.process.on('exit', (code, signal) => {
        this.spawnMetrics.exitTime = Date.now();
        this.spawnMetrics.exitCode = code;
        this.spawnMetrics.signal = signal;

        this.logger.info('spawner', 'process_exit', {
          code,
          signal,
          durationMs: this.spawnMetrics.exitTime - this.spawnMetrics.spawnTime,
        });
      });

      // Track errors
      this.process.on('error', (error) => {
        this.logger.error('spawner', 'spawn_error', {
          code: error.code,
          message: error.message,
        });
      });

      // Track stdout/stderr bytes
      this.process.stdout.on('data', (chunk) => {
        this.spawnMetrics.stdoutBytes += chunk.length;
      });

      this.process.stderr.on('data', (chunk) => {
        this.spawnMetrics.stderrBytes += chunk.length;
      });

      return {
        process: this.process,
        stdin: this.process.stdin,
        stdout: this.process.stdout,
        stderr: this.process.stderr,
      };
    } catch (error) {
      this.logger.error('spawner', 'spawn_exception', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Kill the server process
   */
  kill(signal = 'SIGTERM') {
    if (this.process && !this.process.killed) {
      this.logger.info('spawner', 'kill_start', { signal });
      this.process.kill(signal);
      return true;
    }
    return false;
  }

  /**
   * Get spawn metrics
   */
  getMetrics() {
    return {
      ...this.spawnMetrics,
      durationMs: this.spawnMetrics.exitTime
        ? this.spawnMetrics.exitTime - this.spawnMetrics.spawnTime
        : Date.now() - this.spawnMetrics.spawnTime,
    };
  }
}

export default ServerSpawner;
