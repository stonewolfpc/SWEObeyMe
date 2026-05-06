/**
 * Transport Monitor
 *
 * Real-time stdio health monitoring.
 * Detects stdout/stderr starvation, dead pipes, partial frames, timing anomalies.
 * Also detects MCP frame starvation - when stderr has data but no JSON-RPC frames on stdout.
 */

import fs from 'fs';
import path from 'path';

class TransportMonitor {
  constructor(stdout, stderr, logger, config = {}) {
    this.stdout = stdout;
    this.stderr = stderr;
    this.logger = logger;

    this.config = {
      stdoutStarvationThresholdMs: config.stdoutStarvationThresholdMs || 10000,
      stderrStarvationThresholdMs: config.stderrStarvationThresholdMs || 15000,
      timingAnomalyThresholdMs: config.timingAnomalyThresholdMs || 5000,
      mcpFrameStarvationThresholdMs: config.mcpFrameStarvationThresholdMs || 5000,
      dumpDir: config.dumpDir || null,
      ...config,
    };

    this.metrics = {
      stdoutBytes: 0,
      stderrBytes: 0,
      frameCount: 0,
      mcpFrameCount: 0,
      lastFrameTime: null,
      lastStdoutTime: null,
      lastStderrTime: null,
      lastMcpFrameTime: null,
      starvationEvents: [],
      deadPipeEvents: [],
      timingAnomalies: [],
      mcpFrameStarvationEvents: [],
    };

    this.active = false;
    this.starvationTimers = { stdout: null, stderr: null };
    this.mcpFrameTimer = null;
    this.stdoutBuffer = '';
    this.stderrBuffer = '';
  }

  /**
   * Start monitoring
   */
  start() {
    this.active = true;
    this.metrics.lastFrameTime = Date.now();
    this.metrics.lastStdoutTime = Date.now();
    this.metrics.lastStderrTime = Date.now();
    this.metrics.lastMcpFrameTime = null;

    // Monitor stdout
    this.stdout.on('data', (chunk) => {
      this.metrics.stdoutBytes += chunk.length;
      this.metrics.lastStdoutTime = Date.now();
      this.metrics.lastFrameTime = Date.now();
      this.metrics.frameCount++;

      this.stdoutBuffer += chunk.toString();

      // Check for MCP JSON-RPC frames
      this._checkForMcpFrames();

      this._resetStarvationTimer('stdout');
    });

    // Monitor stderr
    this.stderr.on('data', (chunk) => {
      this.metrics.stderrBytes += chunk.length;
      this.metrics.lastStderrTime = Date.now();
      this.stderrBuffer += chunk.toString();

      this._resetStarvationTimer('stderr');
    });

    // Monitor stdin for dead pipe
    this.stdout.on('error', (error) => {
      this.metrics.deadPipeEvents.push({
        time: Date.now(),
        error: error.message,
      });

      this.logger.error('monitor', 'dead_pipe', {
        error: error.message,
      });
    });

    // Start starvation timers
    this._startStarvationTimer('stdout');
    this._startStarvationTimer('stderr');

    // Start MCP frame starvation timer
    this._startMcpFrameStarvationTimer();

    this.logger.info('monitor', 'start', {
      config: this.config,
    });
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.active = false;

    if (this.starvationTimers.stdout) {
      clearTimeout(this.starvationTimers.stdout);
    }
    if (this.starvationTimers.stderr) {
      clearTimeout(this.starvationTimers.stderr);
    }
    if (this.mcpFrameTimer) {
      clearTimeout(this.mcpFrameTimer);
    }

    this.logger.info('monitor', 'stop', {
      metrics: this.metrics,
    });
  }

  /**
   * Check for MCP JSON-RPC frames in stdout buffer
   */
  _checkForMcpFrames() {
    const lines = this.stdoutBuffer.split('\n');
    this.stdoutBuffer = lines.pop() || ''; // Keep incomplete line

    for (const line of lines) {
      if (line.trim()) {
        try {
          const json = JSON.parse(line);
          if (json.jsonrpc === '2.0' || json.result || json.error || json.method) {
            this.metrics.mcpFrameCount++;
            this.metrics.lastMcpFrameTime = Date.now();
            this._resetMcpFrameTimer();
          }
        } catch (e) {
          // Not valid JSON, ignore
        }
      }
    }
  }

  /**
   * Start MCP frame starvation timer
   */
  _startMcpFrameStarvationTimer() {
    if (!this.active) return;

    this.mcpFrameTimer = setTimeout(() => {
      // Check if stderr has data but no MCP frames
      const hasStderrData = this.metrics.stderrBytes > 0;
      const hasMcpFrames = this.metrics.mcpFrameCount > 0;

      if (hasStderrData && !hasMcpFrames) {
        const starvationDuration = Date.now() - this.metrics.lastStderrTime;

        this.metrics.mcpFrameStarvationEvents.push({
          duration: starvationDuration,
          threshold: this.config.mcpFrameStarvationThresholdMs,
          stderrBytes: this.metrics.stderrBytes,
          stdoutBytes: this.metrics.stdoutBytes,
          time: Date.now(),
        });

        this.logger.error('monitor', 'mcp_frame_starvation', {
          duration: starvationDuration,
          threshold: this.config.mcpFrameStarvationThresholdMs,
          stderrBytes: this.metrics.stderrBytes,
          stdoutBytes: this.metrics.stdoutBytes,
        });

        // Dump raw stdout/stderr to files if dumpDir is configured
        if (this.config.dumpDir) {
          this._dumpRawStreams();
        }
      }
    }, this.config.mcpFrameStarvationThresholdMs);
  }

  /**
   * Reset MCP frame starvation timer
   */
  _resetMcpFrameTimer() {
    if (this.mcpFrameTimer) {
      clearTimeout(this.mcpFrameTimer);
    }
    this._startMcpFrameStarvationTimer();
  }

  /**
   * Dump raw stdout/stderr to files for debugging
   */
  _dumpRawStreams() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const stdoutPath = path.join(this.config.dumpDir, `stdout-${timestamp}.txt`);
      const stderrPath = path.join(this.config.dumpDir, `stderr-${timestamp}.txt`);

      fs.writeFileSync(stdoutPath, this.stdoutBuffer);
      fs.writeFileSync(stderrPath, this.stderrBuffer);

      this.logger.info('monitor', 'streams_dumped', {
        stdoutPath,
        stderrPath,
      });
    } catch (error) {
      this.logger.error('monitor', 'dump_failed', {
        error: error.message,
      });
    }
  }

  /**
   * Reset starvation timer for a stream
   */
  _resetStarvationTimer(stream) {
    if (this.starvationTimers[stream]) {
      clearTimeout(this.starvationTimers[stream]);
    }
    this._startStarvationTimer(stream);
  }

  /**
   * Start starvation timer for a stream
   */
  _startStarvationTimer(stream) {
    if (!this.active) return;

    const threshold =
      stream === 'stdout'
        ? this.config.stdoutStarvationThresholdMs
        : this.config.stderrStarvationThresholdMs;

    this.starvationTimers[stream] = setTimeout(() => {
      const lastTime =
        stream === 'stdout' ? this.metrics.lastStdoutTime : this.metrics.lastStderrTime;

      const starvationDuration = Date.now() - lastTime;

      this.metrics.starvationEvents.push({
        stream,
        duration: starvationDuration,
        threshold,
        time: Date.now(),
      });

      this.logger.warn('monitor', 'starvation', {
        stream,
        duration: starvationDuration,
        threshold,
      });
    }, threshold);
  }

  /**
   * Check for timing anomalies
   */
  checkTimingAnomaly() {
    if (!this.metrics.lastFrameTime) return false;

    const elapsed = Date.now() - this.metrics.lastFrameTime;

    if (elapsed > this.config.timingAnomalyThresholdMs) {
      this.metrics.timingAnomalies.push({
        elapsed,
        threshold: this.config.timingAnomalyThresholdMs,
        time: Date.now(),
      });

      this.logger.warn('monitor', 'timing_anomaly', {
        elapsed,
        threshold: this.config.timingAnomalyThresholdMs,
      });

      return true;
    }

    return false;
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      active: this.active,
    };
  }

  /**
   * Get error codes for any detected issues
   */
  getErrorCodes() {
    const codes = [];

    if (this.metrics.starvationEvents.length > 0) {
      codes.push('TRANSPORT_STDOUT_STARVATION');
    }

    if (this.metrics.deadPipeEvents.length > 0) {
      codes.push('TRANSPORT_DEAD_PIPE');
    }

    if (this.metrics.timingAnomalies.length > 0) {
      codes.push('TRANSPORT_TIMING_ANOMALY');
    }

    if (this.metrics.mcpFrameStarvationEvents.length > 0) {
      codes.push('TRANSPORT_MCP_FRAME_STARVATION');
    }

    return codes;
  }
}

export default TransportMonitor;
