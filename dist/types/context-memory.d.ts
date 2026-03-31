/**
 * Context Memory Types
 *
 * Type definitions for persistent memory layer that provides
 * SWE with mandatory working memory and state tracking.
 */
/**
 * Stored context entry for persistent memory
 */
export interface ContextEntry {
    /** Unique identifier for this context entry */
    id: string;
    /** Timestamp when context was created */
    timestamp: Date;
    /** Context type classification */
    type: 'patch' | 'validation' | 'command' | 'file_state' | 'rule' | 'project';
    /** Context data/content */
    data: any;
    /** Context priority for eviction */
    priority: 'low' | 'medium' | 'high' | 'critical';
    /** Related context entries */
    related: string[];
    /** Session identifier */
    sessionId: string;
    /** Expiration time (optional) */
    expiresAt?: Date;
    /** Metadata tags */
    tags: string[];
    /** Size in bytes */
    size: number;
}
/**
 * Last context snapshot for quick retrieval
 */
export interface LastContext {
    /** Most recent patch applied */
    lastPatch?: PatchContext;
    /** Most recent validation result */
    lastValidation?: ValidationContext;
    /** Most recent command executed */
    lastCommand?: CommandContext;
    /** Most recent file state */
    lastFileState?: FileStateContext;
    /** Current working session */
    currentSession?: SessionContext;
    /** Active rules and constraints */
    activeRules?: RuleContext[];
    /** Project context snapshot */
    projectContext?: any;
    /** Timestamp of last update */
    updatedAt: Date;
}
/**
 * Patch context information
 */
export interface PatchContext {
    /** Patch identifier */
    id: string;
    /** File that was patched */
    file: string;
    /** Patch content/diff */
    content: string;
    /** Patch type */
    type: 'create' | 'update' | 'delete' | 'move';
    /** Validation result */
    validation?: ValidationResult;
    /** Timestamp */
    timestamp: Date;
    /** Success status */
    success: boolean;
    /** Error message if failed */
    error?: string;
}
/**
 * Validation context information
 */
export interface ValidationContext {
    /** Validation identifier */
    id: string;
    /** File that was validated */
    file: string;
    /** Validation result */
    result: ValidationResult;
    /** Validation rules applied */
    rules: string[];
    /** Timestamp */
    timestamp: Date;
    /** Validation duration */
    duration: number;
}
/**
 * Command context information
 */
export interface CommandContext {
    /** Command identifier */
    id: string;
    /** Tool/command name */
    tool: string;
    /** Command arguments */
    arguments: any;
    /** Command result */
    result: any;
    /** Execution duration */
    duration: number;
    /** Success status */
    success: boolean;
    /** Error message if failed */
    error?: string;
    /** Timestamp */
    timestamp: Date;
}
/**
 * File state context information
 */
export interface FileStateContext {
    /** File path */
    file: string;
    /** File content hash */
    hash: string;
    /** File size */
    size: number;
    /** Last modified timestamp */
    lastModified: Date;
    /** File metadata */
    metadata: {
        lines: number;
        classes: number;
        functions: number;
        imports: number;
        exports: number;
    };
    /** Snapshot timestamp */
    timestamp: Date;
}
/**
 * Session context information
 */
export interface SessionContext {
    /** Session identifier */
    id: string;
    /** Session start time */
    startTime: Date;
    /** Session duration */
    duration: number;
    /** Commands executed in session */
    commandCount: number;
    /** Files modified in session */
    modifiedFiles: string[];
    /** Session type */
    type: 'development' | 'debugging' | 'refactoring' | 'testing';
    /** Session goals */
    goals: string[];
    /** Session status */
    status: 'active' | 'completed' | 'abandoned';
}
/**
 * Rule context information
 */
export interface RuleContext {
    /** Rule identifier */
    id: string;
    /** Rule name */
    name: string;
    /** Rule type */
    type: 'naming' | 'structure' | 'validation' | 'architecture' | 'dependency';
    /** Rule definition */
    definition: string;
    /** Rule priority */
    priority: 'low' | 'medium' | 'high' | 'critical';
    /** Rule status */
    status: 'active' | 'inactive' | 'deprecated';
    /** Rule enforcement level */
    enforcement: 'warning' | 'error' | 'critical';
    /** Rule creation timestamp */
    createdAt: Date;
    /** Rule last updated */
    updatedAt: Date;
    /** Rule usage statistics */
    usage: {
        timesApplied: number;
        timesViolated: number;
        lastViolation?: Date;
    };
}
/**
 * Validation result structure
 */
export interface ValidationResult {
    /** Overall validation status */
    valid: boolean;
    /** Validation score (0-100) */
    score: number;
    /** Individual validation checks */
    checks: ValidationCheck[];
    /** Summary message */
    summary: string;
    /** Recommendations for fixes */
    recommendations: string[];
    /** Validation duration */
    duration: number;
}
/**
 * Individual validation check
 */
export interface ValidationCheck {
    /** Check name */
    name: string;
    /** Check status */
    status: 'pass' | 'fail' | 'warning';
    /** Check message */
    message: string;
    /** Check severity */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** Check location (file/line) */
    location?: {
        file: string;
        line: number;
        column: number;
    };
    /** Suggested fix */
    suggestion?: string;
}
/**
 * Memory storage configuration
 */
export interface MemoryConfig {
    /** Maximum memory size in bytes */
    maxMemorySize: number;
    /** Maximum number of entries */
    maxEntries: number;
    /** Entry expiration time in milliseconds */
    entryExpiration: number;
    /** Cleanup interval in milliseconds */
    cleanupInterval: number;
    /** Storage directory */
    storageDir: string;
    /** Compression enabled */
    compressionEnabled: boolean;
    /** Encryption enabled */
    encryptionEnabled: boolean;
}
/**
 * Memory statistics
 */
export interface MemoryStats {
    /** Total entries stored */
    totalEntries: number;
    /** Total memory used in bytes */
    totalMemoryUsed: number;
    /** Memory usage percentage */
    memoryUsagePercent: number;
    /** Oldest entry timestamp */
    oldestEntry: Date;
    /** Newest entry timestamp */
    newestEntry: Date;
    /** Entries by type */
    entriesByType: Record<string, number>;
    /** Entries by priority */
    entriesByPriority: Record<string, number>;
    /** Cleanup statistics */
    cleanup: {
        lastCleanup: Date;
        entriesCleaned: number;
        memoryReclaimed: number;
    };
}
//# sourceMappingURL=context-memory.d.ts.map