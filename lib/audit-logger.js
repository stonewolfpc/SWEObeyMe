import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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
      if (!fs.existsSync(this.logDirectory)) {
        fs.mkdirSync(this.logDirectory, { recursive: true });
      }
      
      this.rotateLogFile();
      this.startFlushInterval();
      this.cleanupOldLogs();
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
      const data = this.buffer.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      fs.appendFileSync(this.currentLogFile, data);
      this.buffer = [];
    } catch (error) {
      console.error('[AuditLogger] Failed to flush buffer:', error);
    }
  }

  cleanupOldLogs() {
    try {
      const files = fs.readdirSync(this.logDirectory);
      const now = Date.now();
      const retentionMs = this.retentionDays * 24 * 60 * 60 * 1000;
      
      for (const file of files) {
        if (!file.startsWith('audit-') || !file.endsWith('.jsonl')) {
          continue;
        }
        
        const filePath = path.join(this.logDirectory, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;
        
        if (age > retentionMs) {
          fs.unlinkSync(filePath);
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
      operation: 'create'
    });
  }

  logCheckpointRevert(userId, checkpointId, name) {
    this.info('checkpoint.revert', {
      userId,
      checkpointId,
      name,
      operation: 'revert'
    });
  }

  logCheckpointDelete(userId, checkpointId, name) {
    this.info('checkpoint.delete', {
      userId,
      checkpointId,
      name,
      operation: 'delete'
    });
  }

  logFileWrite(userId, filePath, linesAdded, linesRemoved) {
    this.info('file.write', {
      userId,
      filePath,
      linesAdded,
      linesRemoved,
      operation: 'write'
    });
  }

  logToolUse(userId, toolName, parameters, success) {
    this.info('tool.use', {
      userId,
      toolName,
      parameters,
      success,
      operation: 'tool_use'
    });
  }

  logPermissionCheck(userId, permission, allowed, resourceId) {
    this.info('permission.check', {
      userId,
      permission,
      allowed,
      resourceId,
      operation: 'permission_check'
    });
  }

  logConfigChange(userId, key, oldValue, newValue) {
    this.info('config.change', {
      userId,
      key,
      oldValue,
      newValue,
      operation: 'config_change'
    });
  }

  logRoleChange(adminUserId, targetUserId, oldRole, newRole) {
    this.info('role.change', {
      adminUserId,
      targetUserId,
      oldRole,
      newRole,
      operation: 'role_change'
    });
  }

  logSSOLogin(userId, provider, email) {
    this.info('sso.login', {
      userId,
      provider,
      email,
      operation: 'sso_login'
    });
  }

  logError(error, context) {
    this.error('error', {
      error: error.message,
      stack: error.stack,
      context,
      operation: 'error'
    });
  }

  async exportLogs(startDate, endDate) {
    const logs = [];
    const files = fs.readdirSync(this.logDirectory);
    
    for (const file of files) {
      if (!file.startsWith('audit-') || !file.endsWith('.jsonl')) {
        continue;
      }
      
      const filePath = path.join(this.logDirectory, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
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
    const files = fs.readdirSync(this.logDirectory);
    
    for (const file of files) {
      if (!file.startsWith('audit-') || !file.endsWith('.jsonl')) {
        continue;
      }
      
      const filePath = path.join(this.logDirectory, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
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

  dispose() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushBuffer();
  }
}

export { AuditLogger };
