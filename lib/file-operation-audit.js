/**
 * File Operation Audit System
 * Tracks all file operations to prevent duplication and ensure proper auditing
 * Critical for massive projects where SWE might create duplicate files
 */

/**
 * Operation types
 */
const OperationType = {
  READ: 'READ',
  WRITE: 'WRITE',
  CREATE: 'CREATE',
  DELETE: 'DELETE',
  RENAME: 'RENAME',
  COPY: 'COPY',
  MOVE: 'MOVE',
};

/**
 * Operation status
 */
const OperationStatus = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  BLOCKED: 'BLOCKED',
  DUPLICATE: 'DUPLICATE',
};

/**
 * File Operation Audit Log
 */
class FileOperationAudit {
  constructor() {
    this.operations = []; // Array of operation records
    this.operationHistory = new Map(); // filePath -> Array of operations
    this.operationSignatures = new Map(); // signature -> timestamp
    this.maxHistorySize = 10000;
    this.sessionStartTime = Date.now();
  }

  /**
   * Generate unique operation signature for deduplication
   */
  async generateSignature(operation, filePath, content = null) {
    const base = `${operation}:${filePath}`;
    if (content) {
      // Include content hash for write operations
      const crypto = await import('crypto');
      const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
      return `${base}:${hash}`;
    }
    return base;
  }

  /**
   * Check if operation was recently performed (prevents duplicates)
   */
  isRecentOperation(signature, timeWindow = 5000) {
    const timestamp = this.operationSignatures.get(signature);
    if (!timestamp) return false;

    const age = Date.now() - timestamp;
    return age < timeWindow;
  }

  /**
   * Record an operation
   */
  async recordOperation(operation, filePath, details = {}) {
    const signature = await this.generateSignature(operation, filePath, details.content);

    // Check for recent duplicate operations
    if (this.isRecentOperation(signature)) {
      const record = {
        type: operation,
        filePath,
        status: OperationStatus.DUPLICATE,
        timestamp: Date.now(),
        signature,
        details,
        note: 'Operation blocked: Recent duplicate detected',
      };
      this.addRecord(record);
      return record;
    }

    const record = {
      type: operation,
      filePath,
      status: OperationStatus.PENDING,
      timestamp: Date.now(),
      signature,
      details,
      sessionId: this.sessionStartTime,
    };

    this.addRecord(record);
    this.operationSignatures.set(signature, Date.now());

    return record;
  }

  /**
   * Add record to audit log
   */
  addRecord(record) {
    this.operations.push(record);

    // Add to file history
    if (!this.operationHistory.has(record.filePath)) {
      this.operationHistory.set(record.filePath, []);
    }
    this.operationHistory.get(record.filePath).push(record);

    // Prune old operations if history is too large
    if (this.operations.length > this.maxHistorySize) {
      const removed = this.operations.shift();
      // Clean up from file history if needed
      const fileHistory = this.operationHistory.get(removed.filePath);
      if (fileHistory && fileHistory.length > 0 && fileHistory[0] === removed) {
        fileHistory.shift();
      }
    }
  }

  /**
   * Update operation status
   */
  updateOperationStatus(signature, status, details = {}) {
    const operation = this.operations.find(op => op.signature === signature);
    if (operation) {
      operation.status = status;
      operation.completedAt = Date.now();
      operation.details = { ...operation.details, ...details };
    }
    return operation;
  }

  /**
   * Check if file was recently written
   */
  wasRecentlyWritten(filePath, timeWindow = 30000) {
    const history = this.operationHistory.get(filePath);
    if (!history) return false;

    const recentWrites = history.filter(
      op =>
        op.type === OperationType.WRITE &&
        op.status === OperationStatus.SUCCESS &&
        Date.now() - op.timestamp < timeWindow,
    );

    return recentWrites.length > 0;
  }

  /**
   * Check for duplicate write operations
   */
  async checkForDuplicateWrite(filePath, content, timeWindow = 10000) {
    const history = this.operationHistory.get(filePath);
    if (!history) return null;

    const crypto = await import('crypto');
    const contentHash = crypto.createHash('md5').update(content).digest('hex');

    for (let i = history.length - 1; i >= 0; i--) {
      const op = history[i];
      if (
        op.type === OperationType.WRITE &&
        op.status === OperationStatus.SUCCESS &&
        Date.now() - op.timestamp < timeWindow
      ) {
        // Check if content is the same
        if (op.details.contentHash === contentHash) {
          return op;
        }
      }
    }

    return null;
  }

  /**
   * Get operation history for a file
   */
  getFileHistory(filePath, limit = 50) {
    const history = this.operationHistory.get(filePath);
    if (!history) return [];

    return history.slice(-limit);
  }

  /**
   * Get all operations of a specific type
   */
  getOperationsByType(type, limit = 100) {
    return this.operations.filter(op => op.type === type).slice(-limit);
  }

  /**
   * Get operations within time range
   */
  getOperationsInTimeRange(startTime, endTime) {
    return this.operations.filter(op => op.timestamp >= startTime && op.timestamp <= endTime);
  }

  /**
   * Get failed operations
   */
  getFailedOperations(limit = 50) {
    return this.operations.filter(op => op.status === OperationStatus.FAILED).slice(-limit);
  }

  /**
   * Get blocked operations
   */
  getBlockedOperations(limit = 50) {
    return this.operations
      .filter(
        op => op.status === OperationStatus.BLOCKED || op.status === OperationStatus.DUPLICATE,
      )
      .slice(-limit);
  }

  /**
   * Get duplicate operations
   */
  getDuplicateOperations(limit = 50) {
    return this.operations.filter(op => op.status === OperationStatus.DUPLICATE).slice(-limit);
  }

  /**
   * Get operation statistics
   */
  getStatistics() {
    const stats = {
      totalOperations: this.operations.length,
      sessionDuration: Date.now() - this.sessionStartTime,
      operationsByType: {},
      operationsByStatus: {},
      uniqueFiles: this.operationHistory.size,
      duplicateCount: 0,
      blockedCount: 0,
      failedCount: 0,
      successCount: 0,
    };

    this.operations.forEach(op => {
      // Count by type
      stats.operationsByType[op.type] = (stats.operationsByType[op.type] || 0) + 1;

      // Count by status
      stats.operationsByStatus[op.status] = (stats.operationsByStatus[op.status] || 0) + 1;

      // Count specific statuses
      if (op.status === OperationStatus.DUPLICATE) stats.duplicateCount++;
      if (op.status === OperationStatus.BLOCKED) stats.blockedCount++;
      if (op.status === OperationStatus.FAILED) stats.failedCount++;
      if (op.status === OperationStatus.SUCCESS) stats.successCount++;
    });

    return stats;
  }

  /**
   * Detect potential issues
   */
  detectIssues() {
    const issues = [];

    // Check for excessive duplicate operations
    const duplicates = this.getDuplicateOperations();
    if (duplicates.length > 10) {
      issues.push({
        type: 'EXCESSIVE_DUPLICATES',
        severity: 'WARNING',
        count: duplicates.length,
        message: `${duplicates.length} duplicate operations detected - SWE may be in a loop`,
      });
    }

    // Check for excessive failed operations
    const failed = this.getFailedOperations();
    if (failed.length > 5) {
      issues.push({
        type: 'EXCESSIVE_FAILURES',
        severity: 'ERROR',
        count: failed.length,
        message: `${failed.length} failed operations detected - check for systemic issues`,
      });
    }

    // Check for rapid file creation (potential spam)
    const recentCreates = this.getOperationsByType(OperationType.CREATE).filter(
      op => Date.now() - op.timestamp < 10000,
    );
    if (recentCreates.length > 5) {
      issues.push({
        type: 'RAPID_FILE_CREATION',
        severity: 'WARNING',
        count: recentCreates.length,
        message: `${recentCreates.length} files created in 10 seconds - potential file spam`,
      });
    }

    // Check for repeated operations on same file
    for (const [filePath, history] of this.operationHistory) {
      const recentOps = history.filter(op => Date.now() - op.timestamp < 30000);
      if (recentOps.length > 10) {
        issues.push({
          type: 'EXCESSIVE_FILE_OPERATIONS',
          severity: 'WARNING',
          filePath,
          count: recentOps.length,
          message: `${recentOps.length} operations on ${filePath} in 30 seconds`,
        });
      }
    }

    return issues;
  }

  /**
   * Generate audit report
   */
  generateReport() {
    const stats = this.getStatistics();
    const issues = this.detectIssues();

    return {
      timestamp: Date.now(),
      sessionDuration: stats.sessionDuration,
      statistics: stats,
      issues: issues,
      recentOperations: this.operations.slice(-20),
    };
  }

  /**
   * Clear old operations
   */
  clearOldOperations(olderThan = 3600000) {
    const cutoff = Date.now() - olderThan;
    const removed = 0;

    this.operations = this.operations.filter(op => {
      if (op.timestamp < cutoff) {
        // Remove from file history
        const fileHistory = this.operationHistory.get(op.filePath);
        if (fileHistory) {
          const index = fileHistory.indexOf(op);
          if (index > -1) {
            fileHistory.splice(index, 1);
          }
        }
        return false;
      }
      return true;
    });

    // Clean up empty file histories
    for (const [filePath, history] of this.operationHistory) {
      if (history.length === 0) {
        this.operationHistory.delete(filePath);
      }
    }

    return removed;
  }

  /**
   * Export audit log
   */
  exportAuditLog() {
    return JSON.stringify(
      {
        sessionStartTime: this.sessionStartTime,
        operations: this.operations,
        statistics: this.getStatistics(),
      },
      null,
      2,
    );
  }

  /**
   * Import audit log
   */
  importAuditLog(jsonData) {
    try {
      const data = JSON.parse(jsonData);

      this.sessionStartTime = data.sessionStartTime;
      this.operations = data.operations;

      // Rebuild operation history
      this.operationHistory.clear();
      this.operations.forEach(op => {
        if (!this.operationHistory.has(op.filePath)) {
          this.operationHistory.set(op.filePath, []);
        }
        this.operationHistory.get(op.filePath).push(op);
      });

      console.error(`[FILE-AUDIT] Imported audit log with ${this.operations.length} operations`);

      return true;
    } catch (error) {
      console.error(`[FILE-AUDIT] Error importing audit log: ${error.message}`);
      return false;
    }
  }
}

// Global audit instance
const fileOperationAudit = new FileOperationAudit();

/**
 * Get the global file operation audit instance
 */
export function getFileOperationAudit() {
  return fileOperationAudit;
}

/**
 * Record a file operation
 */
export async function recordFileOperation(operation, filePath, details = {}) {
  return await fileOperationAudit.recordOperation(operation, filePath, details);
}

/**
 * Update operation status
 */
export function updateOperationStatus(signature, status, details = {}) {
  return fileOperationAudit.updateOperationStatus(signature, status, details);
}

/**
 * Check if file was recently written
 */
export function wasFileRecentlyWritten(filePath, timeWindow) {
  return fileOperationAudit.wasRecentlyWritten(filePath, timeWindow);
}

/**
 * Check for duplicate write operations
 */
export async function checkForDuplicateWrite(filePath, content, timeWindow) {
  return await fileOperationAudit.checkForDuplicateWrite(filePath, content, timeWindow);
}

/**
 * Get file operation history
 */
export function getFileOperationHistory(filePath, limit) {
  return fileOperationAudit.getFileHistory(filePath, limit);
}

/**
 * Get audit statistics
 */
export function getAuditStatistics() {
  return fileOperationAudit.getStatistics();
}

/**
 * Detect audit issues
 */
export function detectAuditIssues() {
  return fileOperationAudit.detectIssues();
}

/**
 * Generate audit report
 */
export function generateAuditReport() {
  return fileOperationAudit.generateReport();
}

/**
 * Clear old operations
 */
export function clearOldAuditOperations(olderThan) {
  return fileOperationAudit.clearOldOperations(olderThan);
}

// Export constants
export { OperationType, OperationStatus };
