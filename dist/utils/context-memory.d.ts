import { ContextEntry, LastContext, MemoryConfig, MemoryStats } from '../types/context-memory.js';
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
export declare class ContextMemory {
    private config;
    private storage;
    private lastContext;
    private cleanupTimer?;
    private sessionId;
    constructor(config?: Partial<MemoryConfig>);
    /**
     * Store context entry with automatic metadata
     */
    storeContext(type: ContextEntry['type'], data: any, options?: {
        priority?: ContextEntry['priority'];
        related?: string[];
        tags?: string[];
        expiresAt?: Date;
    }): Promise<string>;
    /**
     * Retrieve context entry by ID
     */
    getContext(id: string): Promise<ContextEntry | null>;
    /**
     * Get last context snapshot
     */
    getLastContext(): Promise<LastContext>;
    /**
     * Set last context snapshot
     */
    setLastContext(context: Partial<LastContext>): Promise<void>;
    /**
     * Query context entries by filters
     */
    queryContext(filters?: {
        type?: ContextEntry['type'];
        priority?: ContextEntry['priority'];
        sessionId?: string;
        tags?: string[];
        related?: string;
        limit?: number;
        orderBy?: 'timestamp' | 'priority' | 'size';
        order?: 'asc' | 'desc';
    }): Promise<ContextEntry[]>;
    /**
     * Delete context entry
     */
    deleteContext(id: string): Promise<boolean>;
    /**
     * Clear all context entries
     */
    clearContext(): Promise<void>;
    /**
     * Get memory statistics
     */
    getMemoryStats(): Promise<MemoryStats>;
    /**
     * Initialize storage from disk
     */
    private initializeStorage;
    /**
     * Persist storage to disk
     */
    private persistStorage;
    /**
     * Ensure memory limits are respected
     */
    private ensureMemoryLimits;
    /**
     * Evict entries based on LRU and priority
     */
    private evictEntries;
    /**
     * Update last context based on entry type
     */
    private updateLastContext;
    /**
     * Start automatic cleanup timer
     */
    private startCleanupTimer;
    /**
     * Perform cleanup of expired entries
     */
    private performCleanup;
    /**
     * Generate unique ID
     */
    private generateId;
    /**
     * Generate session ID
     */
    private generateSessionId;
    /**
     * Calculate size of data
     */
    private calculateSize;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=context-memory.d.ts.map