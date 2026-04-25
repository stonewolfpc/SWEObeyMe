import * as vscode from 'vscode';

class RateLimitManager {
  constructor() {
    // Configuration disabled in public build
    this.enabled = false;
    this.requestsPerMinute = 60;

    this.requests = new Map();
    this.cleanupInterval = null;

    this.initialize();
  }

  initialize() {
    if (!this.enabled) {
      return;
    }

    this.startCleanupInterval();
  }

  startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldRequests();
    }, 60000); // Cleanup every minute
  }

  cleanupOldRequests() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    for (const [key, timestamps] of this.requests.entries()) {
      const recentRequests = timestamps.filter((t) => t > oneMinuteAgo);

      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }

  checkRateLimit(identifier) {
    if (!this.enabled) {
      return { allowed: true, remaining: Infinity, resetAt: null };
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }

    const timestamps = this.requests.get(identifier);
    const recentRequests = timestamps.filter((t) => t > oneMinuteAgo);

    if (recentRequests.length >= this.requestsPerMinute) {
      const oldestRequest = Math.min(...recentRequests);
      const resetAt = new Date(oldestRequest + 60000);

      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    const remaining = this.requestsPerMinute - recentRequests.length;

    return {
      allowed: true,
      remaining,
      resetAt: null,
    };
  }

  recordRequest(identifier) {
    if (!this.enabled) {
      return;
    }

    const now = Date.now();

    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }

    this.requests.get(identifier).push(now);
  }

  getRequestCount(identifier) {
    if (!this.requests.has(identifier)) {
      return 0;
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    return this.requests.get(identifier).filter((t) => t > oneMinuteAgo).length;
  }

  reset(identifier) {
    this.requests.delete(identifier);
  }

  resetAll() {
    this.requests.clear();
  }

  getStats() {
    const stats = {
      totalIdentifiers: this.requests.size,
      totalRequests: 0,
      topConsumers: [],
    };

    for (const [identifier, timestamps] of this.requests.entries()) {
      stats.totalRequests += timestamps.length;
    }

    // Get top consumers
    const consumers = Array.from(this.requests.entries())
      .map(([id, timestamps]) => ({ id, count: timestamps.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    stats.topConsumers = consumers;

    return stats;
  }

  dispose() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

class QuotaManager {
  constructor() {
    // Configuration disabled in public build
    this.enabled = false;
    this.maxOperationsPerDay = 1000;
    this.maxOperationsPerHour = 100;
    this.maxCheckpoints = 50;

    this.dailyUsage = new Map();
    this.hourlyUsage = new Map();
    this.checkpointCounts = new Map();

    this.resetInterval = null;

    this.initialize();
  }

  initialize() {
    if (!this.enabled) {
      return;
    }

    this.startResetInterval();
  }

  startResetInterval() {
    // Reset hourly usage every hour
    setInterval(() => {
      this.resetHourlyUsage();
    }, 3600000); // 1 hour

    // Reset daily usage every day at midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight - now;

    setTimeout(() => {
      this.resetDailyUsage();
      setInterval(() => {
        this.resetDailyUsage();
      }, 86400000); // 24 hours
    }, msUntilMidnight);
  }

  resetHourlyUsage() {
    this.hourlyUsage.clear();
  }

  resetDailyUsage() {
    this.dailyUsage.clear();
  }

  checkDailyQuota(identifier) {
    if (!this.enabled) {
      return { allowed: true, remaining: Infinity, resetAt: null };
    }

    const usage = this.dailyUsage.get(identifier) || 0;
    const remaining = this.maxOperationsPerDay - usage;

    if (remaining <= 0) {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);

      return {
        allowed: false,
        remaining: 0,
        resetAt: midnight,
      };
    }

    return {
      allowed: true,
      remaining,
      resetAt: null,
    };
  }

  checkHourlyQuota(identifier) {
    if (!this.enabled) {
      return { allowed: true, remaining: Infinity, resetAt: null };
    }

    const usage = this.hourlyUsage.get(identifier) || 0;
    const remaining = this.maxOperationsPerHour - usage;

    if (remaining <= 0) {
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(now.getHours() + 1, 0, 0, 0);

      return {
        allowed: false,
        remaining: 0,
        resetAt: nextHour,
      };
    }

    return {
      allowed: true,
      remaining,
      resetAt: null,
    };
  }

  checkCheckpointQuota(workspaceId) {
    if (!this.enabled) {
      return { allowed: true, remaining: Infinity };
    }

    const count = this.checkpointCounts.get(workspaceId) || 0;
    const remaining = this.maxCheckpoints - count;

    if (remaining <= 0) {
      return {
        allowed: false,
        remaining: 0,
      };
    }

    return {
      allowed: true,
      remaining,
    };
  }

  recordOperation(identifier) {
    if (!this.enabled) {
      return;
    }

    const daily = this.dailyUsage.get(identifier) || 0;
    this.dailyUsage.set(identifier, daily + 1);

    const hourly = this.hourlyUsage.get(identifier) || 0;
    this.hourlyUsage.set(identifier, hourly + 1);
  }

  recordCheckpoint(workspaceId) {
    if (!this.enabled) {
      return;
    }

    const count = this.checkpointCounts.get(workspaceId) || 0;
    this.checkpointCounts.set(workspaceId, count + 1);
  }

  removeCheckpoint(workspaceId) {
    if (!this.enabled) {
      return;
    }

    const count = this.checkpointCounts.get(workspaceId) || 0;
    if (count > 0) {
      this.checkpointCounts.set(workspaceId, count - 1);
    }
  }

  getDailyUsage(identifier) {
    return this.dailyUsage.get(identifier) || 0;
  }

  getHourlyUsage(identifier) {
    return this.hourlyUsage.get(identifier) || 0;
  }

  getCheckpointCount(workspaceId) {
    return this.checkpointCounts.get(workspaceId) || 0;
  }

  getQuotaSummary(identifier, workspaceId) {
    return {
      daily: {
        used: this.getDailyUsage(identifier),
        limit: this.maxOperationsPerDay,
        remaining: this.maxOperationsPerDay - this.getDailyUsage(identifier),
      },
      hourly: {
        used: this.getHourlyUsage(identifier),
        limit: this.maxOperationsPerHour,
        remaining: this.maxOperationsPerHour - this.getHourlyUsage(identifier),
      },
      checkpoints: {
        used: this.getCheckpointCount(workspaceId),
        limit: this.maxCheckpoints,
        remaining: this.maxCheckpoints - this.getCheckpointCount(workspaceId),
      },
    };
  }

  reset(identifier) {
    this.dailyUsage.delete(identifier);
    this.hourlyUsage.delete(identifier);
  }

  resetAll() {
    this.dailyUsage.clear();
    this.hourlyUsage.clear();
    this.checkpointCounts.clear();
  }

  dispose() {
    if (this.resetInterval) {
      clearInterval(this.resetInterval);
    }
  }
}

export { RateLimitManager, QuotaManager };
