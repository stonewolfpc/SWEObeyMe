import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { readFileSafe, writeFileSafe, existsSafe, readdirSafe } from './shared/async-utils.js';

class AuditLogger {
  constructor() {
    // Configuration disabled in public build
    this.enabled = true;
    this.logLevel = 'info';
    this.retentionDays = 90;

    let logDir = '';
    if (!logDir) {
      logDir = path.join(os.homedir(), '.sweobeyme', 'audit-logs');
    }

    this.logDirectory = logDir;
    this.currentLogFile = null;
    this.buffer = [];
    this.flushInterval = null;

    this.initialize();
  }

  async initialize() {
    try {
      if (!(await existsSafe(this.logDirectory, 1000, 'initialize exists logDirectory'))) {
        await fs.mkdir(this.logDirectory, { recursive: true });
      }

      this.rotateLogFile();
      this.startFlushInterval();
      await this.cleanupOldLogs();
    } catch (error) {
      console.error('[AuditLogger] Failed to initialize:', error);
    }
  }

  rotateLogFile() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    this.currentLogFile = path.join(this.logDirectory, `audit-${dateStr}-${timeStr}.jsonl`);
  }

  startFlushInterval() {
    this.flushInterval = setInterval(() => {
      this.flushBuffer();
    }, 5000); // Flush every 5 seconds
  }

  async flushBuffer() {
    if (this.buffer.length === 0) {
      return;
    }

    try {
      const data = this.buffer.map((entry) => JSON.stringify(entry)).join('\n') + '\n';
      await fs.appendFile(this.currentLogFile, data);
      this.buffer = [];
    } catch (error) {
      console.error('[AuditLogger] Failed to flush buffer:', error);
    }
  }

  async cleanupOldLogs() {
    try {
      const files = await readdirSafe(this.logDirectory, {}, 5000, 'cleanupOldLogs readdir');
      const now = Date.now();
      const retentionMs = this.retentionDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        if (!file.startsWith('audit-') || !file.endsWith('.jsonl')) {
          continue;
        }

        const filePath = path.join(this.logDirectory, file);
        const stats = await fs.stat(filePath);
        const age = now - stats.mtimeMs;

        if (age > retentionMs) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('[AuditLogger] Failed to cleanup old logs:', error);
    }
  }

  shouldLog(level) {
    if (!this.enabled) {
      return false;
    }

    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
  }

  log(level, action, details) {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      action,
      ...details,
    };

    this.buffer.push(entry);

    if (this.buffer.length >= 100) {
      this.flushBuffer();
    }
  }

  debug(action, details) {
    this.log('debug', action, details);
  }

  info(action, details) {
    this.log('info', action, details);
  }

  warn(action, details) {
    this.log('warn', action, details);
  }

  error(action, details) {
    this.log('error', action, details);
  }

  // Specific audit events
  logCheckpointCreate(userId, checkpointId, name) {
    this.info('checkpoint.create', {
      userId,
      checkpointId,
      name,
      operation: 'create',
    });
  }

  logCheckpointRevert(userId, checkpointId, name) {
    this.info('checkpoint.revert', {
      userId,
      checkpointId,
      name,
      operation: 'revert',
    });
  }

  logCheckpointDelete(userId, checkpointId, name) {
    this.info('checkpoint.delete', {
      userId,
      checkpointId,
      name,
      operation: 'delete',
    });
  }

  logFileWrite(userId, filePath, linesAdded, linesRemoved) {
    this.info('file.write', {
      userId,
      filePath,
      linesAdded,
      linesRemoved,
      operation: 'write',
    });
  }

  logToolUse(userId, toolName, parameters, success) {
    this.info('tool.use', {
      userId,
      toolName,
      parameters,
      success,
      operation: 'tool_use',
    });
  }

  logPermissionCheck(userId, permission, allowed, resourceId) {
    this.info('permission.check', {
      userId,
      permission,
      allowed,
      resourceId,
      operation: 'permission_check',
    });
  }

  logConfigChange(userId, key, oldValue, newValue) {
    this.info('config.change', {
      userId,
      key,
      oldValue,
      newValue,
      operation: 'config_change',
    });
  }

  logRoleChange(adminUserId, targetUserId, oldRole, newRole) {
    this.info('role.change', {
      adminUserId,
      targetUserId,
      oldRole,
      newRole,
      operation: 'role_change',
    });
  }

  logSSOLogin(userId, provider, email) {
    this.info('sso.login', {
      userId,
      provider,
      email,
      operation: 'sso_login',
    });
  }

  logError(error, context) {
    this.error('error', {
      error: error.message,
      stack: error.stack,
      context,
      operation: 'error',
    });
  }

  async exportLogs(startDate, endDate) {
    const logs = [];
    const files = await readdirSafe(this.logDirectory, {}, 5000, 'exportLogs readdir');

    for (const file of files) {
      if (!file.startsWith('audit-') || !file.endsWith('.jsonl')) {
        continue;
      }

      const filePath = path.join(this.logDirectory, file);
      const content = await readFileSafe(filePath, 10000, `exportLogs read ${file}`);
      const lines = content.split('\n').filter((line) => line.trim());

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const entryDate = new Date(entry.timestamp);

          if (entryDate >= startDate && entryDate <= endDate) {
            logs.push(entry);
          }
        } catch (error) {
          console.error('[AuditLogger] Failed to parse log entry:', error);
        }
      }
    }

    return logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  async searchLogs(query) {
    const logs = [];
    const files = await readdirSafe(this.logDirectory, {}, 5000, 'searchLogs readdir');

    for (const file of files) {
      if (!file.startsWith('audit-') || !file.endsWith('.jsonl')) {
        continue;
      }

      const filePath = path.join(this.logDirectory, file);
      const content = await readFileSafe(filePath, 10000, `searchLogs read ${file}`);
      const lines = content.split('\n').filter((line) => line.trim());

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const entryStr = JSON.stringify(entry).toLowerCase();

          if (entryStr.includes(query.toLowerCase())) {
            logs.push(entry);
          }
        } catch (error) {
          console.error('[AuditLogger] Failed to parse log entry:', error);
        }
      }
    }

    return logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  async dispose() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flushBuffer();
  }
}

export { AuditLogger };
