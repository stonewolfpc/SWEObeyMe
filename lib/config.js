import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Configuration management for SWEObeyMe MCP server
 * Follows Windsurf Next best practices for configuration
 */

// Default configuration values
const DEFAULT_CONFIG = {
  // Surgical rules
  maxLines: 700,
  warningThreshold: 600,

  // Backup settings
  maxBackupsPerFile: 10,
  backupLockTimeout: 30000, // 30 seconds

  // Enforcement settings
  enableAutoCorrection: true,
  enableLoopDetection: true,
  maxLoopAttempts: 3,

  // Documentation requirements
  minDocumentationRatio: 0.1, // 10%

  // Debug settings
  debugLogs: false,

  // Feature toggles
  enableWorkflowOrchestration: true,
  enableSessionMemory: true,
  enableOracle: true,

  // Forbidden patterns
  forbiddenPatterns: ['console\\.log', 'TODO', 'FIXME', 'HACK', 'debugger', 'eval\\('],

  // Safety settings for lower-tier models
  strictMode: false,
  requireDryRun: false,
  requireConfirmation: false,
  maxOperationsPerMinute: 60,
  enableSyntaxValidation: false,
  enableImportValidation: false,
  minDocumentationRatioStrict: 0.1,
  enableAntiPatternDetection: false,
  enableChangeVerification: false,
  requireImpactAnalysis: false,
  enableNamingConventionValidation: false,

  // C# specific settings
  csharpMaxMethodComplexity: 15,
  csharpMaxNestingDepth: 5,
  csharpRequireAsyncAwaitPattern: true,
  csharpForbidEmptyCatchBlocks: true,
  csharpRequireUsingStatements: true,
  csharpEnableMathSafety: true,
  csharpMaxTryCatchDepth: 3,
  csharpEnableBracketValidation: true,
  csharpWarnOnComplexMath: true,
  csharpMathComplexityThreshold: 5,
};

// Configuration file path
const CONFIG_FILE_PATH = path.join(os.homedir(), '.sweobeyme-config.json');

// In-memory configuration (loaded from file or defaults)
let config = { ...DEFAULT_CONFIG };

/**
 * Load configuration from file
 */
export async function loadConfig() {
  try {
    if (
      await fs
        .access(CONFIG_FILE_PATH)
        .then(() => true)
        .catch(() => false)
    ) {
      const configData = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
      const userConfig = JSON.parse(configData);
      config = { ...DEFAULT_CONFIG, ...userConfig };
    } else {
      config = { ...DEFAULT_CONFIG };
    }
  } catch (error) {
    console.error(`[CONFIG] Error loading configuration: ${error.message}`);
    config = { ...DEFAULT_CONFIG };
  }
  return config;
}

/**
 * Save configuration to file
 */
export async function saveConfig() {
  try {
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`[CONFIG] Error saving configuration: ${error.message}`);
    return false;
  }
}

/**
 * Get configuration value
 */
export function getConfig(key) {
  return config[key];
}

/**
 * Get entire configuration
 */
export function getAllConfig() {
  return { ...config };
}

/**
 * Set configuration value
 */
export function setConfig(key, value) {
  // Validate key exists in default config
  if (!(key in DEFAULT_CONFIG)) {
    throw new Error(`Unknown configuration key: ${key}`);
  }

  // Type validation
  const defaultValue = DEFAULT_CONFIG[key];
  if (typeof value !== typeof defaultValue) {
    throw new Error(
      `Invalid type for ${key}: expected ${typeof defaultValue}, got ${typeof value}`,
    );
  }

  // Range validation for numeric values
  if (typeof value === 'number') {
    if (key === 'maxLines' || key === 'warningThreshold') {
      if (value < 1 || value > 10000) {
        throw new Error(`${key} must be between 1 and 10000`);
      }
      if (key === 'warningThreshold' && value >= config.maxLines) {
        throw new Error('warningThreshold must be less than maxLines');
      }
    }
    if (key === 'maxBackupsPerFile' && (value < 1 || value > 100)) {
      throw new Error('maxBackupsPerFile must be between 1 and 100');
    }
    if (key === 'minDocumentationRatio' && (value < 0 || value > 1)) {
      throw new Error('minDocumentationRatio must be between 0 and 1');
    }
  }

  // Array validation
  if (key === 'forbiddenPatterns' && !Array.isArray(value)) {
    throw new Error('forbiddenPatterns must be an array');
  }

  config[key] = value;
}

/**
 * Set multiple configuration values
 */
export function setConfigValues(updates) {
  const errors = [];

  for (const [key, value] of Object.entries(updates)) {
    try {
      setConfig(key, value);
    } catch (error) {
      errors.push(error.message);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors: ${errors.join(', ')}`);
  }
}

/**
 * Reset configuration to defaults
 */
export function resetConfig() {
  config = { ...DEFAULT_CONFIG };
}

/**
 * Get configuration schema (for validation and UI)
 */
export function getConfigSchema() {
  return {
    maxLines: {
      type: 'number',
      default: DEFAULT_CONFIG.maxLines,
      min: 1,
      max: 10000,
      description: 'Maximum lines allowed per file',
    },
    warningThreshold: {
      type: 'number',
      default: DEFAULT_CONFIG.warningThreshold,
      min: 1,
      max: 9999,
      description: 'Warning threshold for line count (must be less than maxLines)',
    },
    maxBackupsPerFile: {
      type: 'number',
      default: DEFAULT_CONFIG.maxBackupsPerFile,
      min: 1,
      max: 100,
      description: 'Maximum number of backups to keep per file',
    },
    backupLockTimeout: {
      type: 'number',
      default: DEFAULT_CONFIG.backupLockTimeout,
      min: 1000,
      max: 300000,
      description: 'Backup lock timeout in milliseconds',
    },
    enableAutoCorrection: {
      type: 'boolean',
      default: DEFAULT_CONFIG.enableAutoCorrection,
      description: 'Enable automatic correction of forbidden patterns',
    },
    enableLoopDetection: {
      type: 'boolean',
      default: DEFAULT_CONFIG.enableLoopDetection,
      description: 'Enable loop detection for repetitive operations',
    },
    maxLoopAttempts: {
      type: 'number',
      default: DEFAULT_CONFIG.maxLoopAttempts,
      min: 1,
      max: 10,
      description: 'Maximum attempts before loop detection triggers',
    },
    minDocumentationRatio: {
      type: 'number',
      default: DEFAULT_CONFIG.minDocumentationRatio,
      min: 0,
      max: 1,
      description: 'Minimum documentation ratio (0-1)',
    },
    debugLogs: {
      type: 'boolean',
      default: DEFAULT_CONFIG.debugLogs,
      description: 'Enable debug logging',
    },
    enableWorkflowOrchestration: {
      type: 'boolean',
      default: DEFAULT_CONFIG.enableWorkflowOrchestration,
      description: 'Enable workflow orchestration',
    },
    enableSessionMemory: {
      type: 'boolean',
      default: DEFAULT_CONFIG.enableSessionMemory,
      description: 'Enable session memory tracking',
    },
    enableOracle: {
      type: 'boolean',
      default: DEFAULT_CONFIG.enableOracle,
      description: 'Enable oracle for surgical wisdom',
    },
    forbiddenPatterns: {
      type: 'array',
      default: DEFAULT_CONFIG.forbiddenPatterns,
      description: 'Array of forbidden patterns (regex strings)',
    },
    strictMode: {
      type: 'boolean',
      default: DEFAULT_CONFIG.strictMode,
      description: 'Enable strict validation mode for lower-tier models',
    },
    requireDryRun: {
      type: 'boolean',
      default: DEFAULT_CONFIG.requireDryRun,
      description: 'Require dry_run before write operations',
    },
    requireConfirmation: {
      type: 'boolean',
      default: DEFAULT_CONFIG.requireConfirmation,
      description: 'Require confirmation for dangerous operations',
    },
    maxOperationsPerMinute: {
      type: 'number',
      default: DEFAULT_CONFIG.maxOperationsPerMinute,
      min: 1,
      max: 600,
      description: 'Maximum operations per minute',
    },
    enableSyntaxValidation: {
      type: 'boolean',
      default: DEFAULT_CONFIG.enableSyntaxValidation,
      description: 'Enable syntax validation',
    },
    enableImportValidation: {
      type: 'boolean',
      default: DEFAULT_CONFIG.enableImportValidation,
      description: 'Enable import validation',
    },
    minDocumentationRatioStrict: {
      type: 'number',
      default: DEFAULT_CONFIG.minDocumentationRatioStrict,
      min: 0,
      max: 1,
      description: 'Minimum documentation ratio in strict mode (0-1)',
    },
    enableAntiPatternDetection: {
      type: 'boolean',
      default: DEFAULT_CONFIG.enableAntiPatternDetection,
      description: 'Enable anti-pattern detection',
    },
    enableChangeVerification: {
      type: 'boolean',
      default: DEFAULT_CONFIG.enableChangeVerification,
      description: 'Enable change verification after applying',
    },
    requireImpactAnalysis: {
      type: 'boolean',
      default: DEFAULT_CONFIG.requireImpactAnalysis,
      description: 'Require impact analysis before changes',
    },
    enableNamingConventionValidation: {
      type: 'boolean',
      default: DEFAULT_CONFIG.enableNamingConventionValidation,
      description: 'Enable naming convention validation',
    },
    csharpMaxMethodComplexity: {
      type: 'number',
      default: DEFAULT_CONFIG.csharpMaxMethodComplexity,
      min: 1,
      max: 100,
      description: 'Maximum cyclomatic complexity for C# methods',
    },
    csharpMaxNestingDepth: {
      type: 'number',
      default: DEFAULT_CONFIG.csharpMaxNestingDepth,
      min: 1,
      max: 20,
      description: 'Maximum nesting depth for C# code',
    },
    csharpRequireAsyncAwaitPattern: {
      type: 'boolean',
      default: DEFAULT_CONFIG.csharpRequireAsyncAwaitPattern,
      description: 'Require proper async/await patterns in C#',
    },
    csharpForbidEmptyCatchBlocks: {
      type: 'boolean',
      default: DEFAULT_CONFIG.csharpForbidEmptyCatchBlocks,
      description: 'Forbid empty catch blocks in C#',
    },
    csharpRequireUsingStatements: {
      type: 'boolean',
      default: DEFAULT_CONFIG.csharpRequireUsingStatements,
      description: 'Require using statements for IDisposable in C#',
    },
    csharpEnableMathSafety: {
      type: 'boolean',
      default: DEFAULT_CONFIG.csharpEnableMathSafety,
      description: 'Enable math expression safety checks in C#',
    },
    csharpMaxTryCatchDepth: {
      type: 'number',
      default: DEFAULT_CONFIG.csharpMaxTryCatchDepth,
      min: 1,
      max: 10,
      description: 'Maximum depth of nested try-catch blocks',
    },
    csharpEnableBracketValidation: {
      type: 'boolean',
      default: DEFAULT_CONFIG.csharpEnableBracketValidation,
      description: 'Enable bracket matching and validation',
    },
    csharpWarnOnComplexMath: {
      type: 'boolean',
      default: DEFAULT_CONFIG.csharpWarnOnComplexMath,
      description: 'Warn on complex mathematical expressions',
    },
    csharpMathComplexityThreshold: {
      type: 'number',
      default: DEFAULT_CONFIG.csharpMathComplexityThreshold,
      min: 1,
      max: 20,
      description: 'Threshold for warning on math expression complexity',
    },
  };
}

/**
 * Validate configuration value
 */
export function validateConfigValue(key, value) {
  try {
    setConfig(key, value);
    // Restore original value since this is just validation
    config[key] = DEFAULT_CONFIG[key];
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Initialize configuration on module load
loadConfig().catch(error => {
  console.error('[CONFIG] Failed to initialize configuration:', error);
});

// Export configuration constants for backward compatibility
export const MAX_LINES = () => config.maxLines;
export const WARNING_THRESHOLD = () => config.warningThreshold;
export const DEBUG_LOGS = () => config.debugLogs;
export const ENABLE_AUTO_CORRECTION = () => config.enableAutoCorrection;
export const MAX_BACKUPS_PER_FILE = () => config.maxBackupsPerFile;
export const MIN_DOCUMENTATION_RATIO = () => config.minDocumentationRatio;
export const FORBIDDEN_PATTERNS = () => config.forbiddenPatterns;
export const STRICT_MODE = () => config.strictMode;
export const REQUIRE_DRY_RUN = () => config.requireDryRun;
export const REQUIRE_CONFIRMATION = () => config.requireConfirmation;
export const MAX_OPERATIONS_PER_MINUTE = () => config.maxOperationsPerMinute;
export const ENABLE_SYNTAX_VALIDATION = () => config.enableSyntaxValidation;
export const ENABLE_IMPORT_VALIDATION = () => config.enableImportValidation;
export const ENABLE_ANTI_PATTERN_DETECTION = () => config.enableAntiPatternDetection;
export const REQUIRE_IMPACT_ANALYSIS = () => config.requireImpactAnalysis;
export const ENABLE_NAMING_VALIDATION = () => config.enableNamingConventionValidation;
export const CSHARP_MAX_METHOD_COMPLEXITY = () => config.csharpMaxMethodComplexity;
export const CSHARP_MAX_NESTING_DEPTH = () => config.csharpMaxNestingDepth;
export const CSHARP_REQUIRE_ASYNC_AWAIT = () => config.csharpRequireAsyncAwaitPattern;
export const CSHARP_FORBID_EMPTY_CATCH = () => config.csharpForbidEmptyCatchBlocks;
export const CSHARP_REQUIRE_USING = () => config.csharpRequireUsingStatements;
export const CSHARP_ENABLE_MATH_SAFETY = () => config.csharpEnableMathSafety;
export const CSHARP_MAX_TRY_CATCH_DEPTH = () => config.csharpMaxTryCatchDepth;
export const CSHARP_ENABLE_BRACKET_VALIDATION = () => config.csharpEnableBracketValidation;
export const CSHARP_WARN_ON_COMPLEX_MATH = () => config.csharpWarnOnComplexMath;
export const CSHARP_MATH_COMPLEXITY_THRESHOLD = () => config.csharpMathComplexityThreshold;
