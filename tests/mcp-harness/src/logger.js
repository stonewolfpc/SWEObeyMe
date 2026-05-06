/**
 * Structured JSON Line Logger
 *
 * Every log line is valid JSON for machine-readable output.
 * Timestamps in ISO 8601 format.
 * Log levels: INFO, WARN, ERROR, DEBUG.
 * Component tracking: spawner, client, monitor, runner.
 * Event types: spawn, frame, error, metric.
 */

import fs from 'fs';
import path from 'path';

class Logger {
  constructor(logDir, scenarioName) {
    this.logDir = logDir;
    this.scenarioName = scenarioName;
    this.logFile = null;
    this.startTime = Date.now();
    this.metrics = {
      logCount: 0,
      errorCount: 0,
      warnCount: 0,
      debugCount: 0,
    };
    this.closed = false;
  }

  /**
   * Initialize log file
   */
  init() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFileName = this.scenarioName + '-' + timestamp + '.jsonl';
    this.logFilePath = path.join(this.logDir, logFileName);
    this.logFile = fs.createWriteStream(this.logFilePath, { flags: 'a' });

    this.log('INFO', 'logger', 'init', {
      message: 'Logger initialized',
      scenario: this.scenarioName,
    });
  }

  /**
   * Write a structured JSON log line
   */
  log(level, component, event, data = {}, context = {}) {
    if (this.closed) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      event,
      scenario: this.scenarioName,
      elapsedMs: Date.now() - this.startTime,
      ...context,
      data,
    };

    const jsonLine = JSON.stringify(logEntry) + '\n';

    if (this.logFile && !this.closed) {
      try {
        this.logFile.write(jsonLine);
      } catch (error) {
        // Stream closed, ignore
      }
    } else {
      process.stderr.write(jsonLine);
    }

    this.metrics.logCount++;
    if (level === 'ERROR') this.metrics.errorCount++;
    if (level === 'WARN') this.metrics.warnCount++;
    if (level === 'DEBUG') this.metrics.debugCount++;
  }

  /**
   * Convenience methods
   */
  info(component, event, data, context) {
    this.log('INFO', component, event, data, context);
  }

  warn(component, event, data, context) {
    this.log('WARN', component, event, data, context);
  }

  error(component, event, data, context) {
    this.log('ERROR', component, event, data, context);
  }

  debug(component, event, data, context) {
    this.log('DEBUG', component, event, data, context);
  }

  /**
   * Close log file and return metrics
   */
  close() {
    this.closed = true;
    if (this.logFile) {
      this.logFile.end();
    }
    return {
      ...this.metrics,
      durationMs: Date.now() - this.startTime,
      logFilePath: this.logFilePath,
    };
  }
}

export default Logger;
