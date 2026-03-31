import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
/**
 * Context Memory Utility
 *
 * Provides persistent memory layer for SWE with automatic storage,
 * retrieval, and management of context entries.
 *
 * Features:
 * - Persistent JSON storage with compression
 * - LRU eviction and automatic cleanup
 * - Session management and tracking
 * - Context relationships and tagging
 * - Memory statistics and monitoring
 */
export class ContextMemory {
    config;
    storage = new Map();
    lastContext;
    cleanupTimer;
    sessionId;
    constructor(config) {
        this.config = {
            maxMemorySize: 50 * 1024 * 1024, // 50MB
            maxEntries: 10000,
            entryExpiration: 24 * 60 * 60 * 1000, // 24 hours
            cleanupInterval: 60 * 60 * 1000, // 1 hour
            storageDir: '.swe-memory',
            compressionEnabled: true,
            encryptionEnabled: false,
            ...config,
        };
        this.sessionId = this.generateSessionId();
        this.lastContext = {
            updatedAt: new Date(),
        };
        this.initializeStorage();
        this.startCleanupTimer();
    }
    /**
     * Store context entry with automatic metadata
     */
    async storeContext(type, data, options = {}) {
        const id = this.generateId();
        const size = this.calculateSize(data);
        const entry = {
            id,
            timestamp: new Date(),
            type,
            data,
            priority: options.priority || 'medium',
            related: options.related || [],
            sessionId: this.sessionId,
            expiresAt: options.expiresAt,
            tags: options.tags || [],
            size,
        };
        // Check memory limits
        await this.ensureMemoryLimits(size);
        // Store entry
        this.storage.set(id, entry);
        // Update last context
        await this.updateLastContext(type, data);
        // Persist to disk
        await this.persistStorage();
        return id;
    }
    /**
     * Retrieve context entry by ID
     */
    async getContext(id) {
        const entry = this.storage.get(id);
        if (!entry) {
            return null;
        }
        // Check expiration
        if (entry.expiresAt && entry.expiresAt < new Date()) {
            this.storage.delete(id);
            await this.persistStorage();
            return null;
        }
        return entry;
    }
    /**
     * Get last context snapshot
     */
    async getLastContext() {
        return { ...this.lastContext };
    }
    /**
     * Set last context snapshot
     */
    async setLastContext(context) {
        this.lastContext = {
            ...this.lastContext,
            ...context,
            updatedAt: new Date(),
        };
        await this.persistStorage();
    }
    /**
     * Query context entries by filters
     */
    async queryContext(filters = {}) {
        let entries = Array.from(this.storage.values());
        // Apply filters
        if (filters.type) {
            entries = entries.filter(e => e.type === filters.type);
        }
        if (filters.priority) {
            entries = entries.filter(e => e.priority === filters.priority);
        }
        if (filters.sessionId) {
            entries = entries.filter(e => e.sessionId === filters.sessionId);
        }
        if (filters.tags && filters.tags.length > 0) {
            entries = entries.filter(e => filters.tags.some(tag => e.tags.includes(tag)));
        }
        if (filters.related) {
            entries = entries.filter(e => e.related.includes(filters.related) || e.id === filters.related);
        }
        // Sort entries
        const orderBy = filters.orderBy || 'timestamp';
        const order = filters.order || 'desc';
        entries.sort((a, b) => {
            let comparison = 0;
            switch (orderBy) {
                case 'timestamp':
                    comparison = a.timestamp.getTime() - b.timestamp.getTime();
                    break;
                case 'priority':
                    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                    comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
                    break;
                case 'size':
                    comparison = a.size - b.size;
                    break;
            }
            return order === 'desc' ? -comparison : comparison;
        });
        // Apply limit
        if (filters.limit) {
            entries = entries.slice(0, filters.limit);
        }
        return entries;
    }
    /**
     * Delete context entry
     */
    async deleteContext(id) {
        const deleted = this.storage.delete(id);
        if (deleted) {
            await this.persistStorage();
        }
        return deleted;
    }
    /**
     * Clear all context entries
     */
    async clearContext() {
        this.storage.clear();
        this.lastContext = {
            updatedAt: new Date(),
        };
        await this.persistStorage();
    }
    /**
     * Get memory statistics
     */
    async getMemoryStats() {
        const entries = Array.from(this.storage.values());
        const totalMemoryUsed = entries.reduce((sum, entry) => sum + entry.size, 0);
        const entriesByType = {};
        const entriesByPriority = {};
        for (const entry of entries) {
            entriesByType[entry.type] = (entriesByType[entry.type] || 0) + 1;
            entriesByPriority[entry.priority] = (entriesByPriority[entry.priority] || 0) + 1;
        }
        return {
            totalEntries: entries.length,
            totalMemoryUsed,
            memoryUsagePercent: (totalMemoryUsed / this.config.maxMemorySize) * 100,
            oldestEntry: entries.length > 0 ?
                new Date(Math.min(...entries.map(e => e.timestamp.getTime()))) :
                new Date(),
            newestEntry: entries.length > 0 ?
                new Date(Math.max(...entries.map(e => e.timestamp.getTime()))) :
                new Date(),
            entriesByType,
            entriesByPriority,
            cleanup: {
                lastCleanup: new Date(), // Would track actual cleanup time
                entriesCleaned: 0,
                memoryReclaimed: 0,
            },
        };
    }
    /**
     * Initialize storage from disk
     */
    async initializeStorage() {
        try {
            await fs.ensureDir(this.config.storageDir);
            const storageFile = path.join(this.config.storageDir, 'context-storage.json');
            const lastContextFile = path.join(this.config.storageDir, 'last-context.json');
            if (await fs.pathExists(storageFile)) {
                const storageData = await fs.readFile(storageFile, 'utf8');
                const storageEntries = JSON.parse(storageData);
                for (const entry of storageEntries) {
                    // Check expiration
                    if (!entry.expiresAt || entry.expiresAt > new Date()) {
                        this.storage.set(entry.id, entry);
                    }
                }
            }
            if (await fs.pathExists(lastContextFile)) {
                const lastContextData = await fs.readFile(lastContextFile, 'utf8');
                this.lastContext = JSON.parse(lastContextData);
            }
        }
        catch (error) {
            console.warn('Failed to initialize context memory storage:', error);
        }
    }
    /**
     * Persist storage to disk
     */
    async persistStorage() {
        try {
            await fs.ensureDir(this.config.storageDir);
            const storageFile = path.join(this.config.storageDir, 'context-storage.json');
            const lastContextFile = path.join(this.config.storageDir, 'last-context.json');
            const entries = Array.from(this.storage.values());
            const storageData = JSON.stringify(entries, null, 2);
            const lastContextData = JSON.stringify(this.lastContext, null, 2);
            await Promise.all([
                fs.writeFile(storageFile, storageData, 'utf8'),
                fs.writeFile(lastContextFile, lastContextData, 'utf8'),
            ]);
        }
        catch (error) {
            console.error('Failed to persist context memory:', error);
        }
    }
    /**
     * Ensure memory limits are respected
     */
    async ensureMemoryLimits(newEntrySize) {
        const currentSize = Array.from(this.storage.values())
            .reduce((sum, entry) => sum + entry.size, 0);
        const projectedSize = currentSize + newEntrySize;
        if (projectedSize > this.config.maxMemorySize) {
            await this.evictEntries(projectedSize - this.config.maxMemorySize);
        }
        if (this.storage.size >= this.config.maxEntries) {
            await this.evictEntries(this.storage.size - this.config.maxEntries + 1, 'count');
        }
    }
    /**
     * Evict entries based on LRU and priority
     */
    async evictEntries(amount, mode = 'memory') {
        const entries = Array.from(this.storage.entries());
        // Sort by priority (low first) and timestamp (oldest first)
        entries.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[a[1].priority] - priorityOrder[b[1].priority];
            if (priorityDiff !== 0) {
                return priorityDiff;
            }
            return a[1].timestamp.getTime() - b[1].timestamp.getTime();
        });
        let evicted = 0;
        let targetAmount = amount;
        if (mode === 'count') {
            targetAmount = entries.length - this.config.maxEntries + 1;
        }
        for (const [id, entry] of entries) {
            if (evicted >= targetAmount)
                break;
            // Don't evict critical priority entries
            if (entry.priority === 'critical')
                continue;
            this.storage.delete(id);
            evicted += mode === 'memory' ? entry.size : 1;
        }
    }
    /**
     * Update last context based on entry type
     */
    async updateLastContext(type, data) {
        switch (type) {
            case 'patch':
                this.lastContext.lastPatch = data;
                break;
            case 'validation':
                this.lastContext.lastValidation = data;
                break;
            case 'command':
                this.lastContext.lastCommand = data;
                break;
            case 'file_state':
                this.lastContext.lastFileState = data;
                break;
            case 'project':
                this.lastContext.projectContext = data;
                break;
            case 'rule':
                if (!this.lastContext.activeRules) {
                    this.lastContext.activeRules = [];
                }
                // Update or add rule
                const ruleIndex = this.lastContext.activeRules.findIndex(r => r.id === data.id);
                if (ruleIndex >= 0) {
                    this.lastContext.activeRules[ruleIndex] = data;
                }
                else {
                    this.lastContext.activeRules.push(data);
                }
                break;
        }
        this.lastContext.updatedAt = new Date();
    }
    /**
     * Start automatic cleanup timer
     */
    startCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        this.cleanupTimer = setInterval(async () => {
            await this.performCleanup();
        }, this.config.cleanupInterval);
    }
    /**
     * Perform cleanup of expired entries
     */
    async performCleanup() {
        const now = new Date();
        const expiredEntries = [];
        for (const [id, entry] of this.storage) {
            if (entry.expiresAt && entry.expiresAt < now) {
                expiredEntries.push(id);
            }
        }
        for (const id of expiredEntries) {
            this.storage.delete(id);
        }
        if (expiredEntries.length > 0) {
            await this.persistStorage();
        }
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return crypto.randomBytes(16).toString('hex');
    }
    /**
     * Generate session ID
     */
    generateSessionId() {
        return crypto.randomBytes(8).toString('hex');
    }
    /**
     * Calculate size of data
     */
    calculateSize(data) {
        return JSON.stringify(data).length * 2; // Rough estimate
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        await this.persistStorage();
    }
}
//# sourceMappingURL=context-memory.js.map