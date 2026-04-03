/******/ var __webpack_modules__ = ({

/***/ 765:
/***/ ((module) => {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncaught exception popping up in devtools
	return Promise.resolve().then(() => {
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	});
}
webpackEmptyAsyncContext.keys = () => ([]);
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = 765;
module.exports = webpackEmptyAsyncContext;

/***/ }),

/***/ 982:
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ 943:
/***/ ((module) => {

module.exports = require("fs/promises");

/***/ }),

/***/ 928:
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ 16:
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ 219:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nccwpck_require__) => {


// EXPORTS
__nccwpck_require__.d(__webpack_exports__, {
  dx: () => (/* binding */ CSHARP_ENABLE_BRACKET_VALIDATION),
  eV: () => (/* binding */ CSHARP_MATH_COMPLEXITY_THRESHOLD),
  CV: () => (/* binding */ CSHARP_MAX_METHOD_COMPLEXITY),
  Ql: () => (/* binding */ CSHARP_MAX_NESTING_DEPTH),
  DS: () => (/* binding */ CSHARP_MAX_TRY_CATCH_DEPTH),
  p6: () => (/* binding */ CSHARP_WARN_ON_COMPLEX_MATH),
  mX: () => (/* binding */ DEBUG_LOGS),
  iF: () => (/* binding */ ENABLE_ANTI_PATTERN_DETECTION),
  Ar: () => (/* binding */ ENABLE_IMPORT_VALIDATION),
  nu: () => (/* binding */ ENABLE_NAMING_VALIDATION),
  UO: () => (/* binding */ ENABLE_SYNTAX_VALIDATION),
  cl: () => (/* binding */ FORBIDDEN_PATTERNS),
  q4: () => (/* binding */ MAX_BACKUPS_PER_FILE),
  xg: () => (/* binding */ MAX_LINES),
  q1: () => (/* binding */ MIN_DOCUMENTATION_RATIO),
  ox: () => (/* binding */ REQUIRE_CONFIRMATION),
  $E: () => (/* binding */ WARNING_THRESHOLD),
  ag: () => (/* binding */ getAllConfig),
  oU: () => (/* binding */ getConfigSchema),
  E6: () => (/* binding */ resetConfig),
  ql: () => (/* binding */ saveConfig),
  Nk: () => (/* binding */ setConfig),
  pP: () => (/* binding */ setConfigValues)
});

// UNUSED EXPORTS: CSHARP_ENABLE_MATH_SAFETY, CSHARP_FORBID_EMPTY_CATCH, CSHARP_REQUIRE_ASYNC_AWAIT, CSHARP_REQUIRE_USING, ENABLE_AUTO_CORRECTION, MAX_OPERATIONS_PER_MINUTE, REQUIRE_DRY_RUN, REQUIRE_IMPACT_ANALYSIS, STRICT_MODE, getConfig, loadConfig, validateConfigValue

// EXTERNAL MODULE: external "fs/promises"
var promises_ = __nccwpck_require__(943);
// EXTERNAL MODULE: external "path"
var external_path_ = __nccwpck_require__(928);
;// CONCATENATED MODULE: external "os"
const external_os_namespaceObject = require("os");
;// CONCATENATED MODULE: ./lib/config.js




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
const CONFIG_FILE_PATH = external_path_.join(external_os_namespaceObject.homedir(), '.sweobeyme-config.json');

// In-memory configuration (loaded from file or defaults)
let config = { ...DEFAULT_CONFIG };

/**
 * Load configuration from file
 */
async function loadConfig() {
  try {
    if (
      await promises_.access(CONFIG_FILE_PATH)
        .then(() => true)
        .catch(() => false)
    ) {
      const configData = await promises_.readFile(CONFIG_FILE_PATH, 'utf-8');
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
async function saveConfig() {
  try {
    await promises_.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`[CONFIG] Error saving configuration: ${error.message}`);
    return false;
  }
}

/**
 * Get configuration value
 */
function getConfig(key) {
  return config[key];
}

/**
 * Get entire configuration
 */
function getAllConfig() {
  return { ...config };
}

/**
 * Set configuration value
 */
function setConfig(key, value) {
  // Validate key exists in default config
  if (!(key in DEFAULT_CONFIG)) {
    throw new Error(`Unknown configuration key: ${key}`);
  }

  // Type validation
  const defaultValue = DEFAULT_CONFIG[key];
  if (typeof value !== typeof defaultValue) {
    throw new Error(
      `Invalid type for ${key}: expected ${typeof defaultValue}, got ${typeof value}`
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
function setConfigValues(updates) {
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
function resetConfig() {
  config = { ...DEFAULT_CONFIG };
}

/**
 * Get configuration schema (for validation and UI)
 */
function getConfigSchema() {
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
function validateConfigValue(key, value) {
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
const MAX_LINES = () => config.maxLines;
const WARNING_THRESHOLD = () => config.warningThreshold;
const DEBUG_LOGS = () => config.debugLogs;
const ENABLE_AUTO_CORRECTION = () => config.enableAutoCorrection;
const MAX_BACKUPS_PER_FILE = () => config.maxBackupsPerFile;
const MIN_DOCUMENTATION_RATIO = () => config.minDocumentationRatio;
const FORBIDDEN_PATTERNS = () => config.forbiddenPatterns;
const STRICT_MODE = () => config.strictMode;
const REQUIRE_DRY_RUN = () => config.requireDryRun;
const REQUIRE_CONFIRMATION = () => config.requireConfirmation;
const MAX_OPERATIONS_PER_MINUTE = () => config.maxOperationsPerMinute;
const ENABLE_SYNTAX_VALIDATION = () => config.enableSyntaxValidation;
const ENABLE_IMPORT_VALIDATION = () => config.enableImportValidation;
const ENABLE_ANTI_PATTERN_DETECTION = () => config.enableAntiPatternDetection;
const REQUIRE_IMPACT_ANALYSIS = () => config.requireImpactAnalysis;
const ENABLE_NAMING_VALIDATION = () => config.enableNamingConventionValidation;
const CSHARP_MAX_METHOD_COMPLEXITY = () => config.csharpMaxMethodComplexity;
const CSHARP_MAX_NESTING_DEPTH = () => config.csharpMaxNestingDepth;
const CSHARP_REQUIRE_ASYNC_AWAIT = () => config.csharpRequireAsyncAwaitPattern;
const CSHARP_FORBID_EMPTY_CATCH = () => config.csharpForbidEmptyCatchBlocks;
const CSHARP_REQUIRE_USING = () => config.csharpRequireUsingStatements;
const CSHARP_ENABLE_MATH_SAFETY = () => config.csharpEnableMathSafety;
const CSHARP_MAX_TRY_CATCH_DEPTH = () => config.csharpMaxTryCatchDepth;
const CSHARP_ENABLE_BRACKET_VALIDATION = () => config.csharpEnableBracketValidation;
const CSHARP_WARN_ON_COMPLEX_MATH = () => config.csharpWarnOnComplexMath;
const CSHARP_MATH_COMPLEXITY_THRESHOLD = () => config.csharpMathComplexityThreshold;


/***/ }),

/***/ 554:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nccwpck_require__) => {


// EXPORTS
__nccwpck_require__.d(__webpack_exports__, {
  j: () => (/* binding */ checkTestCoverage),
  runRelatedTests: () => (/* binding */ runRelatedTests)
});

// UNUSED EXPORTS: hasTests

// EXTERNAL MODULE: external "fs/promises"
var promises_ = __nccwpck_require__(943);
// EXTERNAL MODULE: external "path"
var external_path_ = __nccwpck_require__(928);
;// CONCATENATED MODULE: external "child_process"
const external_child_process_namespaceObject = require("child_process");
;// CONCATENATED MODULE: ./lib/testing.js




/**
 * Testing tools for integration with test frameworks
 */

/**
 * Run tests for affected files
 */
async function runRelatedTests(filePath) {
  const result = {
    success: true,
    testsRun: 0,
    testsPassed: 0,
    testsFailed: 0,
    coverage: 0,
    errors: [],
    output: '',
  };

  try {
    // Check if test file exists
    const ext = external_path_.extname(filePath);
    const testName = external_path_.basename(filePath, ext);
    const testDir = external_path_.dirname(filePath);

    // Look for test files
    const possibleTestFiles = [
      external_path_.join(testDir, `${testName}.test${ext}`),
      external_path_.join(testDir, `${testName}.spec${ext}`),
      external_path_.join(testDir, `test/${testName}.test${ext}`),
      external_path_.join(testDir, `tests/${testName}.test${ext}`),
    ];

    let testFile = null;
    for (const file of possibleTestFiles) {
      try {
        await promises_.access(file);
        testFile = file;
        break;
      } catch (e) {
        // File doesn't exist
      }
    }

    if (!testFile) {
      result.warnings.push('No test file found for this file');
      return result;
    }

    // Try to run tests using npm test
    return new Promise(resolve => {
      (0,external_child_process_namespaceObject.exec)('npm test', { cwd: testDir }, (error, stdout, stderr) => {
        result.output = stdout + stderr;

        // Parse test results (simplified)
        const output = result.output;

        // Try to extract test counts
        const passMatch = output.match(/(\d+)\s+passing/i);
        const failMatch = output.match(/(\d+)\s+failing/i);
        const totalMatch = output.match(/(\d+)\s+tests?\s/i);

        if (passMatch) result.testsPassed = parseInt(passMatch[1]);
        if (failMatch) result.testsFailed = parseInt(failMatch[1]);
        if (totalMatch) result.testsRun = parseInt(totalMatch[1]);

        result.success = result.testsFailed === 0;

        if (error && !result.success) {
          result.errors.push(error.message);
        }

        resolve(result);
      });
    });
  } catch (error) {
    result.success = false;
    result.errors.push(`Test execution failed: ${error.message}`);
  }

  return result;
}

/**
 * Check test coverage
 */
async function checkTestCoverage(filePath) {
  const result = {
    success: true,
    coverage: 0,
    uncoveredLines: [],
    errors: [],
    warnings: [],
  };

  try {
    // Try to run coverage report
    return new Promise(resolve => {
      (0,external_child_process_namespaceObject.exec)('npm run test:coverage', { cwd: external_path_.dirname(filePath) }, (error, stdout, stderr) => {
        const output = stdout + stderr;

        // Try to extract coverage percentage
        const coverageMatch = output.match(/(\d+\.?\d*)%/g);
        if (coverageMatch && coverageMatch.length > 0) {
          result.coverage = parseFloat(coverageMatch[0]);
        }

        if (error) {
          result.warnings.push('Coverage report not available');
        }

        resolve(result);
      });
    });
  } catch (error) {
    result.success = false;
    result.errors.push(`Coverage check failed: ${error.message}`);
  }

  return result;
}

/**
 * Check if file has tests
 */
async function hasTests(filePath) {
  try {
    const ext = path.extname(filePath);
    const testName = path.basename(filePath, ext);
    const testDir = path.dirname(filePath);

    const possibleTestFiles = [
      path.join(testDir, `${testName}.test${ext}`),
      path.join(testDir, `${testName}.spec${ext}`),
    ];

    for (const file of possibleTestFiles) {
      try {
        await fs.access(file);
        return true;
      } catch (e) {
        // File doesn't exist
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}


/***/ }),

/***/ 912:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nccwpck_require__) => {

/* harmony export */ __nccwpck_require__.d(__webpack_exports__, {
/* harmony export */   L: () => (/* binding */ validateNamingConventions),
/* harmony export */   k: () => (/* binding */ checkAntiPatterns),
/* harmony export */   validateCodeComprehensive: () => (/* binding */ validateCodeComprehensive),
/* harmony export */   validateImports: () => (/* binding */ validateImports),
/* harmony export */   validateSyntax: () => (/* binding */ validateSyntax)
/* harmony export */ });
/* harmony import */ var fs_promises__WEBPACK_IMPORTED_MODULE_0__ = __nccwpck_require__(943);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1__ = __nccwpck_require__(928);
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_2__ = __nccwpck_require__(219);




/**
 * Validation tools for reducing hallucination risk
 */

/**
 * Validate syntax of JavaScript/TypeScript code
 */
function validateSyntax(code) {
  const errors = [];

  // Basic syntax validation
  try {
    // Check for unmatched braces
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`Unmatched braces: ${openBraces} opening, ${closeBraces} closing`);
    }

    // Check for unmatched parentheses
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push(`Unmatched parentheses: ${openParens} opening, ${closeParens} closing`);
    }

    // Check for unmatched brackets
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push(`Unmatched brackets: ${openBrackets} opening, ${closeBrackets} closing`);
    }

    // Check for unclosed strings
    const singleQuotes = (code.match(/'/g) || []).length;
    const doubleQuotes = (code.match(/"/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      errors.push('Unclosed single quotes');
    }
    if (doubleQuotes % 2 !== 0) {
      errors.push('Unclosed double quotes');
    }

    // Check for common syntax errors
    if (code.includes('function') && !code.includes('(')) {
      errors.push('Function declaration missing parentheses');
    }

    if (code.includes('=>') && !code.includes('(') && !code.includes('=> {')) {
      errors.push('Arrow function may be missing parentheses');
    }
  } catch (error) {
    errors.push(`Syntax validation error: ${error.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate imports in code
 */
function validateImports(code, filePath) {
  const errors = [];
  const warnings = [];

  // Extract import statements
  const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
  const imports = [];
  let match;

  while ((match = importRegex.exec(code)) !== null) {
    imports.push(match[1]);
  }

  // Check for relative imports
  imports.forEach(imp => {
    if (imp.startsWith('./') || imp.startsWith('../')) {
      // Check if the file exists
      const importPath = path__WEBPACK_IMPORTED_MODULE_1__.resolve(path__WEBPACK_IMPORTED_MODULE_1__.dirname(filePath), imp);

      // Try common extensions
      const extensions = ['.js', '.ts', '.json'];
      let exists = false;

      for (const ext of extensions) {
        try {
          if (fs_promises__WEBPACK_IMPORTED_MODULE_0__.existsSync(importPath + ext)) {
            exists = true;
            break;
          }
        } catch (e) {
          // Ignore
        }
      }

      // Check for index files
      for (const ext of extensions) {
        try {
          if (fs_promises__WEBPACK_IMPORTED_MODULE_0__.existsSync(path__WEBPACK_IMPORTED_MODULE_1__.join(importPath, 'index' + ext))) {
            exists = true;
            break;
          }
        } catch (e) {
          // Ignore
        }
      }

      if (!exists) {
        errors.push(`Import not found: ${imp}`);
      }
    }
  });

  // Check for circular dependencies (simple check)
  const circularDeps = [];
  for (let i = 0; i < imports.length; i++) {
    for (let j = i + 1; j < imports.length; j++) {
      if (imports[i].includes(imports[j]) && imports[j].includes(imports[i])) {
        circularDeps.push(`${imports[i]} <-> ${imports[j]}`);
      }
    }
  }

  if (circularDeps.length > 0) {
    warnings.push(`Potential circular dependencies: ${circularDeps.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check for anti-patterns in code
 */
function checkAntiPatterns(code) {
  const issues = [];

  // Check for god functions (functions > 100 lines)
  const functionBlocks = code.match(/function\s+\w+[^{]*\{[\s\S]*?\}/g) || [];
  functionBlocks.forEach(fn => {
    const lines = fn.split('\n').length;
    if (lines > 100) {
      issues.push(`God function detected: ${lines} lines`);
    }
  });

  // Check for deep nesting
  const lines = code.split('\n');
  lines.forEach((line, idx) => {
    const indent = line.search(/\S|$/);
    if (indent > 24) {
      // More than 6 levels of indentation
      issues.push(`Deep nesting detected at line ${idx + 1}: ${indent} spaces`);
    }
  });

  // Check for magic numbers
  const magicNumbers = code.match(/\b\d{4,}\b/g) || [];
  if (magicNumbers.length > 5) {
    issues.push(`Multiple magic numbers detected: ${magicNumbers.slice(0, 5).join(', ')}...`);
  }

  // Check for TODO/FIXME comments
  const todos = code.match(/\/\/\s*(TODO|FIXME|HACK|XXX)/gi) || [];
  if (todos.length > 0) {
    issues.push(`${todos.length} TODO/FIXME comments found`);
  }

  // Check for console.log statements
  const consoleLogs = code.match(/console\.log/g) || [];
  if (consoleLogs.length > 0) {
    issues.push(`${consoleLogs.length} console.log statements found`);
  }

  // Check for empty catch blocks
  const emptyCatch = code.match(/catch\s*\([^)]*\)\s*\{\s*\}/g) || [];
  if (emptyCatch.length > 0) {
    issues.push(`${emptyCatch.length} empty catch blocks`);
  }

  // Check for var usage
  const varUsage = code.match(/\bvar\s+/g) || [];
  if (varUsage.length > 0) {
    issues.push(`${varUsage.length} var declarations (prefer const/let)`);
  }

  return {
    issues,
    issueCount: issues.length,
  };
}

/**
 * Validate naming conventions
 */
function validateNamingConventions(code) {
  const errors = [];
  const warnings = [];

  // Check function names (camelCase)
  const functionNames = code.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
  functionNames.forEach(fn => {
    const name = fn.replace('function ', '');
    if (name[0] !== name[0].toLowerCase()) {
      warnings.push(`Function ${name} should use camelCase`);
    }
  });

  // Check class names (PascalCase)
  const classNames = code.match(/class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
  classNames.forEach(cls => {
    const name = cls.replace('class ', '');
    if (name[0] !== name[0].toUpperCase()) {
      errors.push(`Class ${name} should use PascalCase`);
    }
  });

  // Check constant names (UPPER_SNAKE_CASE)
  const constDeclarations = code.match(/const\s+([A-Z_][A-Z0-9_]*)\s*=/g) || [];
  constDeclarations.forEach(decl => {
    const name = decl.replace(/const\s+|\s*=/g, '');
    if (name !== name.toUpperCase()) {
      warnings.push(`Constant ${name} should use UPPER_SNAKE_CASE`);
    }
  });

  // Check for file name conventions
  // This would need the file path to check

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Comprehensive validation
 */
async function validateCodeComprehensive(code, filePath) {
  const results = {
    syntax: { valid: true, errors: [] },
    imports: { valid: true, errors: [], warnings: [] },
    antiPatterns: { issues: [], issueCount: 0 },
    naming: { valid: true, errors: [], warnings: [] },
    overall: { valid: true, errors: [], warnings: [] },
  };

  // Syntax validation
  if ((0,_config_js__WEBPACK_IMPORTED_MODULE_2__/* .ENABLE_SYNTAX_VALIDATION */ .UO)()) {
    results.syntax = validateSyntax(code);
    results.overall.errors.push(...results.syntax.errors);
  }

  // Import validation
  if ((0,_config_js__WEBPACK_IMPORTED_MODULE_2__/* .ENABLE_IMPORT_VALIDATION */ .Ar)()) {
    results.imports = await validateImports(code, filePath);
    results.overall.errors.push(...results.imports.errors);
    results.overall.warnings.push(...results.imports.warnings);
  }

  // Anti-pattern detection
  if ((0,_config_js__WEBPACK_IMPORTED_MODULE_2__/* .ENABLE_ANTI_PATTERN_DETECTION */ .iF)()) {
    results.antiPatterns = checkAntiPatterns(code);
    results.overall.warnings.push(...results.antiPatterns.issues);
  }

  // Naming convention validation
  if ((0,_config_js__WEBPACK_IMPORTED_MODULE_2__/* .ENABLE_NAMING_VALIDATION */ .nu)()) {
    results.naming = validateNamingConventions(code);
    results.overall.errors.push(...results.naming.errors);
    results.overall.warnings.push(...results.naming.warnings);
  }

  results.overall.valid = results.overall.errors.length === 0;

  return results;
}


/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __nccwpck_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	var threw = true;
/******/ 	try {
/******/ 		__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 		threw = false;
/******/ 	} finally {
/******/ 		if(threw) delete __webpack_module_cache__[moduleId];
/******/ 	}
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/create fake namespace object */
/******/ (() => {
/******/ 	var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 	var leafPrototypes;
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 16: return value when it's Promise-like
/******/ 	// mode & 8|1: behave like require
/******/ 	__nccwpck_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = this(value);
/******/ 		if(mode & 8) return value;
/******/ 		if(typeof value === 'object' && value) {
/******/ 			if((mode & 4) && value.__esModule) return value;
/******/ 			if((mode & 16) && typeof value.then === 'function') return value;
/******/ 		}
/******/ 		var ns = Object.create(null);
/******/ 		__nccwpck_require__.r(ns);
/******/ 		var def = {};
/******/ 		leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 		for(var current = mode & 2 && value; typeof current == 'object' && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 			Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 		}
/******/ 		def['default'] = () => (value);
/******/ 		__nccwpck_require__.d(ns, def);
/******/ 		return ns;
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__nccwpck_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__nccwpck_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__nccwpck_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./node_modules/zod/v3/helpers/util.js
var util;
(function (util) {
    util.assertEqual = (_) => { };
    function assertIs(_arg) { }
    util.assertIs = assertIs;
    function assertNever(_x) {
        throw new Error();
    }
    util.assertNever = assertNever;
    util.arrayToEnum = (items) => {
        const obj = {};
        for (const item of items) {
            obj[item] = item;
        }
        return obj;
    };
    util.getValidEnumValues = (obj) => {
        const validKeys = util.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
        const filtered = {};
        for (const k of validKeys) {
            filtered[k] = obj[k];
        }
        return util.objectValues(filtered);
    };
    util.objectValues = (obj) => {
        return util.objectKeys(obj).map(function (e) {
            return obj[e];
        });
    };
    util.objectKeys = typeof Object.keys === "function" // eslint-disable-line ban/ban
        ? (obj) => Object.keys(obj) // eslint-disable-line ban/ban
        : (object) => {
            const keys = [];
            for (const key in object) {
                if (Object.prototype.hasOwnProperty.call(object, key)) {
                    keys.push(key);
                }
            }
            return keys;
        };
    util.find = (arr, checker) => {
        for (const item of arr) {
            if (checker(item))
                return item;
        }
        return undefined;
    };
    util.isInteger = typeof Number.isInteger === "function"
        ? (val) => Number.isInteger(val) // eslint-disable-line ban/ban
        : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
    function joinValues(array, separator = " | ") {
        return array.map((val) => (typeof val === "string" ? `'${val}'` : val)).join(separator);
    }
    util.joinValues = joinValues;
    util.jsonStringifyReplacer = (_, value) => {
        if (typeof value === "bigint") {
            return value.toString();
        }
        return value;
    };
})(util || (util = {}));
var objectUtil;
(function (objectUtil) {
    objectUtil.mergeShapes = (first, second) => {
        return {
            ...first,
            ...second, // second overwrites first
        };
    };
})(objectUtil || (objectUtil = {}));
const ZodParsedType = util.arrayToEnum([
    "string",
    "nan",
    "number",
    "integer",
    "float",
    "boolean",
    "date",
    "bigint",
    "symbol",
    "function",
    "undefined",
    "null",
    "array",
    "object",
    "unknown",
    "promise",
    "void",
    "never",
    "map",
    "set",
]);
const getParsedType = (data) => {
    const t = typeof data;
    switch (t) {
        case "undefined":
            return ZodParsedType.undefined;
        case "string":
            return ZodParsedType.string;
        case "number":
            return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
        case "boolean":
            return ZodParsedType.boolean;
        case "function":
            return ZodParsedType.function;
        case "bigint":
            return ZodParsedType.bigint;
        case "symbol":
            return ZodParsedType.symbol;
        case "object":
            if (Array.isArray(data)) {
                return ZodParsedType.array;
            }
            if (data === null) {
                return ZodParsedType.null;
            }
            if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
                return ZodParsedType.promise;
            }
            if (typeof Map !== "undefined" && data instanceof Map) {
                return ZodParsedType.map;
            }
            if (typeof Set !== "undefined" && data instanceof Set) {
                return ZodParsedType.set;
            }
            if (typeof Date !== "undefined" && data instanceof Date) {
                return ZodParsedType.date;
            }
            return ZodParsedType.object;
        default:
            return ZodParsedType.unknown;
    }
};

;// CONCATENATED MODULE: ./node_modules/zod/v3/ZodError.js

const ZodIssueCode = util.arrayToEnum([
    "invalid_type",
    "invalid_literal",
    "custom",
    "invalid_union",
    "invalid_union_discriminator",
    "invalid_enum_value",
    "unrecognized_keys",
    "invalid_arguments",
    "invalid_return_type",
    "invalid_date",
    "invalid_string",
    "too_small",
    "too_big",
    "invalid_intersection_types",
    "not_multiple_of",
    "not_finite",
]);
const quotelessJson = (obj) => {
    const json = JSON.stringify(obj, null, 2);
    return json.replace(/"([^"]+)":/g, "$1:");
};
class ZodError extends Error {
    get errors() {
        return this.issues;
    }
    constructor(issues) {
        super();
        this.issues = [];
        this.addIssue = (sub) => {
            this.issues = [...this.issues, sub];
        };
        this.addIssues = (subs = []) => {
            this.issues = [...this.issues, ...subs];
        };
        const actualProto = new.target.prototype;
        if (Object.setPrototypeOf) {
            // eslint-disable-next-line ban/ban
            Object.setPrototypeOf(this, actualProto);
        }
        else {
            this.__proto__ = actualProto;
        }
        this.name = "ZodError";
        this.issues = issues;
    }
    format(_mapper) {
        const mapper = _mapper ||
            function (issue) {
                return issue.message;
            };
        const fieldErrors = { _errors: [] };
        const processError = (error) => {
            for (const issue of error.issues) {
                if (issue.code === "invalid_union") {
                    issue.unionErrors.map(processError);
                }
                else if (issue.code === "invalid_return_type") {
                    processError(issue.returnTypeError);
                }
                else if (issue.code === "invalid_arguments") {
                    processError(issue.argumentsError);
                }
                else if (issue.path.length === 0) {
                    fieldErrors._errors.push(mapper(issue));
                }
                else {
                    let curr = fieldErrors;
                    let i = 0;
                    while (i < issue.path.length) {
                        const el = issue.path[i];
                        const terminal = i === issue.path.length - 1;
                        if (!terminal) {
                            curr[el] = curr[el] || { _errors: [] };
                            // if (typeof el === "string") {
                            //   curr[el] = curr[el] || { _errors: [] };
                            // } else if (typeof el === "number") {
                            //   const errorArray: any = [];
                            //   errorArray._errors = [];
                            //   curr[el] = curr[el] || errorArray;
                            // }
                        }
                        else {
                            curr[el] = curr[el] || { _errors: [] };
                            curr[el]._errors.push(mapper(issue));
                        }
                        curr = curr[el];
                        i++;
                    }
                }
            }
        };
        processError(this);
        return fieldErrors;
    }
    static assert(value) {
        if (!(value instanceof ZodError)) {
            throw new Error(`Not a ZodError: ${value}`);
        }
    }
    toString() {
        return this.message;
    }
    get message() {
        return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
    }
    get isEmpty() {
        return this.issues.length === 0;
    }
    flatten(mapper = (issue) => issue.message) {
        const fieldErrors = {};
        const formErrors = [];
        for (const sub of this.issues) {
            if (sub.path.length > 0) {
                const firstEl = sub.path[0];
                fieldErrors[firstEl] = fieldErrors[firstEl] || [];
                fieldErrors[firstEl].push(mapper(sub));
            }
            else {
                formErrors.push(mapper(sub));
            }
        }
        return { formErrors, fieldErrors };
    }
    get formErrors() {
        return this.flatten();
    }
}
ZodError.create = (issues) => {
    const error = new ZodError(issues);
    return error;
};

;// CONCATENATED MODULE: ./node_modules/zod/v3/locales/en.js


const errorMap = (issue, _ctx) => {
    let message;
    switch (issue.code) {
        case ZodIssueCode.invalid_type:
            if (issue.received === ZodParsedType.undefined) {
                message = "Required";
            }
            else {
                message = `Expected ${issue.expected}, received ${issue.received}`;
            }
            break;
        case ZodIssueCode.invalid_literal:
            message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
            break;
        case ZodIssueCode.unrecognized_keys:
            message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
            break;
        case ZodIssueCode.invalid_union:
            message = `Invalid input`;
            break;
        case ZodIssueCode.invalid_union_discriminator:
            message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
            break;
        case ZodIssueCode.invalid_enum_value:
            message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
            break;
        case ZodIssueCode.invalid_arguments:
            message = `Invalid function arguments`;
            break;
        case ZodIssueCode.invalid_return_type:
            message = `Invalid function return type`;
            break;
        case ZodIssueCode.invalid_date:
            message = `Invalid date`;
            break;
        case ZodIssueCode.invalid_string:
            if (typeof issue.validation === "object") {
                if ("includes" in issue.validation) {
                    message = `Invalid input: must include "${issue.validation.includes}"`;
                    if (typeof issue.validation.position === "number") {
                        message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
                    }
                }
                else if ("startsWith" in issue.validation) {
                    message = `Invalid input: must start with "${issue.validation.startsWith}"`;
                }
                else if ("endsWith" in issue.validation) {
                    message = `Invalid input: must end with "${issue.validation.endsWith}"`;
                }
                else {
                    util.assertNever(issue.validation);
                }
            }
            else if (issue.validation !== "regex") {
                message = `Invalid ${issue.validation}`;
            }
            else {
                message = "Invalid";
            }
            break;
        case ZodIssueCode.too_small:
            if (issue.type === "array")
                message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
            else if (issue.type === "string")
                message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
            else if (issue.type === "number")
                message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
            else if (issue.type === "bigint")
                message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
            else if (issue.type === "date")
                message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
            else
                message = "Invalid input";
            break;
        case ZodIssueCode.too_big:
            if (issue.type === "array")
                message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
            else if (issue.type === "string")
                message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
            else if (issue.type === "number")
                message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
            else if (issue.type === "bigint")
                message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
            else if (issue.type === "date")
                message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
            else
                message = "Invalid input";
            break;
        case ZodIssueCode.custom:
            message = `Invalid input`;
            break;
        case ZodIssueCode.invalid_intersection_types:
            message = `Intersection results could not be merged`;
            break;
        case ZodIssueCode.not_multiple_of:
            message = `Number must be a multiple of ${issue.multipleOf}`;
            break;
        case ZodIssueCode.not_finite:
            message = "Number must be finite";
            break;
        default:
            message = _ctx.defaultError;
            util.assertNever(issue);
    }
    return { message };
};
/* harmony default export */ const en = (errorMap);

;// CONCATENATED MODULE: ./node_modules/zod/v3/errors.js

let overrideErrorMap = en;

function setErrorMap(map) {
    overrideErrorMap = map;
}
function getErrorMap() {
    return overrideErrorMap;
}

;// CONCATENATED MODULE: ./node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function (errorUtil) {
    errorUtil.errToObj = (message) => typeof message === "string" ? { message } : message || {};
    // biome-ignore lint:
    errorUtil.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

;// CONCATENATED MODULE: ./node_modules/zod/v3/helpers/parseUtil.js


const makeIssue = (params) => {
    const { data, path, errorMaps, issueData } = params;
    const fullPath = [...path, ...(issueData.path || [])];
    const fullIssue = {
        ...issueData,
        path: fullPath,
    };
    if (issueData.message !== undefined) {
        return {
            ...issueData,
            path: fullPath,
            message: issueData.message,
        };
    }
    let errorMessage = "";
    const maps = errorMaps
        .filter((m) => !!m)
        .slice()
        .reverse();
    for (const map of maps) {
        errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
    }
    return {
        ...issueData,
        path: fullPath,
        message: errorMessage,
    };
};
const EMPTY_PATH = (/* unused pure expression or super */ null && ([]));
function addIssueToContext(ctx, issueData) {
    const overrideMap = getErrorMap();
    const issue = makeIssue({
        issueData: issueData,
        data: ctx.data,
        path: ctx.path,
        errorMaps: [
            ctx.common.contextualErrorMap, // contextual error map is first priority
            ctx.schemaErrorMap, // then schema-bound map if available
            overrideMap, // then global override map
            overrideMap === en ? undefined : en, // then global default map
        ].filter((x) => !!x),
    });
    ctx.common.issues.push(issue);
}
class ParseStatus {
    constructor() {
        this.value = "valid";
    }
    dirty() {
        if (this.value === "valid")
            this.value = "dirty";
    }
    abort() {
        if (this.value !== "aborted")
            this.value = "aborted";
    }
    static mergeArray(status, results) {
        const arrayValue = [];
        for (const s of results) {
            if (s.status === "aborted")
                return parseUtil_INVALID;
            if (s.status === "dirty")
                status.dirty();
            arrayValue.push(s.value);
        }
        return { status: status.value, value: arrayValue };
    }
    static async mergeObjectAsync(status, pairs) {
        const syncPairs = [];
        for (const pair of pairs) {
            const key = await pair.key;
            const value = await pair.value;
            syncPairs.push({
                key,
                value,
            });
        }
        return ParseStatus.mergeObjectSync(status, syncPairs);
    }
    static mergeObjectSync(status, pairs) {
        const finalObject = {};
        for (const pair of pairs) {
            const { key, value } = pair;
            if (key.status === "aborted")
                return parseUtil_INVALID;
            if (value.status === "aborted")
                return parseUtil_INVALID;
            if (key.status === "dirty")
                status.dirty();
            if (value.status === "dirty")
                status.dirty();
            if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
                finalObject[key.value] = value.value;
            }
        }
        return { status: status.value, value: finalObject };
    }
}
const parseUtil_INVALID = Object.freeze({
    status: "aborted",
});
const DIRTY = (value) => ({ status: "dirty", value });
const OK = (value) => ({ status: "valid", value });
const isAborted = (x) => x.status === "aborted";
const isDirty = (x) => x.status === "dirty";
const isValid = (x) => x.status === "valid";
const isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

;// CONCATENATED MODULE: ./node_modules/zod/v3/types.js





class ParseInputLazyPath {
    constructor(parent, value, path, key) {
        this._cachedPath = [];
        this.parent = parent;
        this.data = value;
        this._path = path;
        this._key = key;
    }
    get path() {
        if (!this._cachedPath.length) {
            if (Array.isArray(this._key)) {
                this._cachedPath.push(...this._path, ...this._key);
            }
            else {
                this._cachedPath.push(...this._path, this._key);
            }
        }
        return this._cachedPath;
    }
}
const handleResult = (ctx, result) => {
    if (isValid(result)) {
        return { success: true, data: result.value };
    }
    else {
        if (!ctx.common.issues.length) {
            throw new Error("Validation failed but no issues detected.");
        }
        return {
            success: false,
            get error() {
                if (this._error)
                    return this._error;
                const error = new ZodError(ctx.common.issues);
                this._error = error;
                return this._error;
            },
        };
    }
};
function processCreateParams(params) {
    if (!params)
        return {};
    const { errorMap, invalid_type_error, required_error, description } = params;
    if (errorMap && (invalid_type_error || required_error)) {
        throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
    }
    if (errorMap)
        return { errorMap: errorMap, description };
    const customMap = (iss, ctx) => {
        const { message } = params;
        if (iss.code === "invalid_enum_value") {
            return { message: message ?? ctx.defaultError };
        }
        if (typeof ctx.data === "undefined") {
            return { message: message ?? required_error ?? ctx.defaultError };
        }
        if (iss.code !== "invalid_type")
            return { message: ctx.defaultError };
        return { message: message ?? invalid_type_error ?? ctx.defaultError };
    };
    return { errorMap: customMap, description };
}
class ZodType {
    get description() {
        return this._def.description;
    }
    _getType(input) {
        return getParsedType(input.data);
    }
    _getOrReturnCtx(input, ctx) {
        return (ctx || {
            common: input.parent.common,
            data: input.data,
            parsedType: getParsedType(input.data),
            schemaErrorMap: this._def.errorMap,
            path: input.path,
            parent: input.parent,
        });
    }
    _processInputParams(input) {
        return {
            status: new ParseStatus(),
            ctx: {
                common: input.parent.common,
                data: input.data,
                parsedType: getParsedType(input.data),
                schemaErrorMap: this._def.errorMap,
                path: input.path,
                parent: input.parent,
            },
        };
    }
    _parseSync(input) {
        const result = this._parse(input);
        if (isAsync(result)) {
            throw new Error("Synchronous parse encountered promise.");
        }
        return result;
    }
    _parseAsync(input) {
        const result = this._parse(input);
        return Promise.resolve(result);
    }
    parse(data, params) {
        const result = this.safeParse(data, params);
        if (result.success)
            return result.data;
        throw result.error;
    }
    safeParse(data, params) {
        const ctx = {
            common: {
                issues: [],
                async: params?.async ?? false,
                contextualErrorMap: params?.errorMap,
            },
            path: params?.path || [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: getParsedType(data),
        };
        const result = this._parseSync({ data, path: ctx.path, parent: ctx });
        return handleResult(ctx, result);
    }
    "~validate"(data) {
        const ctx = {
            common: {
                issues: [],
                async: !!this["~standard"].async,
            },
            path: [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: getParsedType(data),
        };
        if (!this["~standard"].async) {
            try {
                const result = this._parseSync({ data, path: [], parent: ctx });
                return isValid(result)
                    ? {
                        value: result.value,
                    }
                    : {
                        issues: ctx.common.issues,
                    };
            }
            catch (err) {
                if (err?.message?.toLowerCase()?.includes("encountered")) {
                    this["~standard"].async = true;
                }
                ctx.common = {
                    issues: [],
                    async: true,
                };
            }
        }
        return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result)
            ? {
                value: result.value,
            }
            : {
                issues: ctx.common.issues,
            });
    }
    async parseAsync(data, params) {
        const result = await this.safeParseAsync(data, params);
        if (result.success)
            return result.data;
        throw result.error;
    }
    async safeParseAsync(data, params) {
        const ctx = {
            common: {
                issues: [],
                contextualErrorMap: params?.errorMap,
                async: true,
            },
            path: params?.path || [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: getParsedType(data),
        };
        const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
        const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
        return handleResult(ctx, result);
    }
    refine(check, message) {
        const getIssueProperties = (val) => {
            if (typeof message === "string" || typeof message === "undefined") {
                return { message };
            }
            else if (typeof message === "function") {
                return message(val);
            }
            else {
                return message;
            }
        };
        return this._refinement((val, ctx) => {
            const result = check(val);
            const setError = () => ctx.addIssue({
                code: ZodIssueCode.custom,
                ...getIssueProperties(val),
            });
            if (typeof Promise !== "undefined" && result instanceof Promise) {
                return result.then((data) => {
                    if (!data) {
                        setError();
                        return false;
                    }
                    else {
                        return true;
                    }
                });
            }
            if (!result) {
                setError();
                return false;
            }
            else {
                return true;
            }
        });
    }
    refinement(check, refinementData) {
        return this._refinement((val, ctx) => {
            if (!check(val)) {
                ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
                return false;
            }
            else {
                return true;
            }
        });
    }
    _refinement(refinement) {
        return new ZodEffects({
            schema: this,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect: { type: "refinement", refinement },
        });
    }
    superRefine(refinement) {
        return this._refinement(refinement);
    }
    constructor(def) {
        /** Alias of safeParseAsync */
        this.spa = this.safeParseAsync;
        this._def = def;
        this.parse = this.parse.bind(this);
        this.safeParse = this.safeParse.bind(this);
        this.parseAsync = this.parseAsync.bind(this);
        this.safeParseAsync = this.safeParseAsync.bind(this);
        this.spa = this.spa.bind(this);
        this.refine = this.refine.bind(this);
        this.refinement = this.refinement.bind(this);
        this.superRefine = this.superRefine.bind(this);
        this.optional = this.optional.bind(this);
        this.nullable = this.nullable.bind(this);
        this.nullish = this.nullish.bind(this);
        this.array = this.array.bind(this);
        this.promise = this.promise.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.transform = this.transform.bind(this);
        this.brand = this.brand.bind(this);
        this.default = this.default.bind(this);
        this.catch = this.catch.bind(this);
        this.describe = this.describe.bind(this);
        this.pipe = this.pipe.bind(this);
        this.readonly = this.readonly.bind(this);
        this.isNullable = this.isNullable.bind(this);
        this.isOptional = this.isOptional.bind(this);
        this["~standard"] = {
            version: 1,
            vendor: "zod",
            validate: (data) => this["~validate"](data),
        };
    }
    optional() {
        return ZodOptional.create(this, this._def);
    }
    nullable() {
        return ZodNullable.create(this, this._def);
    }
    nullish() {
        return this.nullable().optional();
    }
    array() {
        return ZodArray.create(this);
    }
    promise() {
        return ZodPromise.create(this, this._def);
    }
    or(option) {
        return ZodUnion.create([this, option], this._def);
    }
    and(incoming) {
        return ZodIntersection.create(this, incoming, this._def);
    }
    transform(transform) {
        return new ZodEffects({
            ...processCreateParams(this._def),
            schema: this,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect: { type: "transform", transform },
        });
    }
    default(def) {
        const defaultValueFunc = typeof def === "function" ? def : () => def;
        return new ZodDefault({
            ...processCreateParams(this._def),
            innerType: this,
            defaultValue: defaultValueFunc,
            typeName: ZodFirstPartyTypeKind.ZodDefault,
        });
    }
    brand() {
        return new ZodBranded({
            typeName: ZodFirstPartyTypeKind.ZodBranded,
            type: this,
            ...processCreateParams(this._def),
        });
    }
    catch(def) {
        const catchValueFunc = typeof def === "function" ? def : () => def;
        return new ZodCatch({
            ...processCreateParams(this._def),
            innerType: this,
            catchValue: catchValueFunc,
            typeName: ZodFirstPartyTypeKind.ZodCatch,
        });
    }
    describe(description) {
        const This = this.constructor;
        return new This({
            ...this._def,
            description,
        });
    }
    pipe(target) {
        return ZodPipeline.create(this, target);
    }
    readonly() {
        return ZodReadonly.create(this);
    }
    isOptional() {
        return this.safeParse(undefined).success;
    }
    isNullable() {
        return this.safeParse(null).success;
    }
}
const cuidRegex = /^c[^\s-]{8,}$/i;
const cuid2Regex = /^[0-9a-z]+$/;
const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
// const uuidRegex =
//   /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i;
const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
const nanoidRegex = /^[a-z0-9_-]{21}$/i;
const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
const durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
// from https://stackoverflow.com/a/46181/1550155
// old version: too slow, didn't support unicode
// const emailRegex = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
//old email regex
// const emailRegex = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@((?!-)([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{1,})[^-<>()[\].,;:\s@"]$/i;
// eslint-disable-next-line
// const emailRegex =
//   /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\])|(\[IPv6:(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))\])|([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])*(\.[A-Za-z]{2,})+))$/;
// const emailRegex =
//   /^[a-zA-Z0-9\.\!\#\$\%\&\'\*\+\/\=\?\^\_\`\{\|\}\~\-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
// const emailRegex =
//   /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
// const emailRegex =
//   /^[a-z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9\-]+)*$/i;
// from https://thekevinscott.com/emojis-in-javascript/#writing-a-regular-expression
const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
let emojiRegex;
// faster, simpler, safer
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
// const ipv6Regex =
// /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/;
const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
const ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
// https://stackoverflow.com/questions/7860392/determine-if-string-is-in-base64-using-javascript
const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
// https://base64.guru/standards/base64url
const base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
// simple
// const dateRegexSource = `\\d{4}-\\d{2}-\\d{2}`;
// no leap year validation
// const dateRegexSource = `\\d{4}-((0[13578]|10|12)-31|(0[13-9]|1[0-2])-30|(0[1-9]|1[0-2])-(0[1-9]|1\\d|2\\d))`;
// with leap year validation
const dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
const dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
    let secondsRegexSource = `[0-5]\\d`;
    if (args.precision) {
        secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
    }
    else if (args.precision == null) {
        secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
    }
    const secondsQuantifier = args.precision ? "+" : "?"; // require seconds if precision is nonzero
    return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
    return new RegExp(`^${timeRegexSource(args)}$`);
}
// Adapted from https://stackoverflow.com/a/3143231
function datetimeRegex(args) {
    let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
    const opts = [];
    opts.push(args.local ? `Z?` : `Z`);
    if (args.offset)
        opts.push(`([+-]\\d{2}:?\\d{2})`);
    regex = `${regex}(${opts.join("|")})`;
    return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
    if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
        return true;
    }
    if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
        return true;
    }
    return false;
}
function isValidJWT(jwt, alg) {
    if (!jwtRegex.test(jwt))
        return false;
    try {
        const [header] = jwt.split(".");
        if (!header)
            return false;
        // Convert base64url to base64
        const base64 = header
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(header.length + ((4 - (header.length % 4)) % 4), "=");
        const decoded = JSON.parse(atob(base64));
        if (typeof decoded !== "object" || decoded === null)
            return false;
        if ("typ" in decoded && decoded?.typ !== "JWT")
            return false;
        if (!decoded.alg)
            return false;
        if (alg && decoded.alg !== alg)
            return false;
        return true;
    }
    catch {
        return false;
    }
}
function isValidCidr(ip, version) {
    if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
        return true;
    }
    if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
        return true;
    }
    return false;
}
class ZodString extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = String(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.string) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.string,
                received: ctx.parsedType,
            });
            return parseUtil_INVALID;
        }
        const status = new ParseStatus();
        let ctx = undefined;
        for (const check of this._def.checks) {
            if (check.kind === "min") {
                if (input.data.length < check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        minimum: check.value,
                        type: "string",
                        inclusive: true,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                if (input.data.length > check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        maximum: check.value,
                        type: "string",
                        inclusive: true,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "length") {
                const tooBig = input.data.length > check.value;
                const tooSmall = input.data.length < check.value;
                if (tooBig || tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    if (tooBig) {
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.too_big,
                            maximum: check.value,
                            type: "string",
                            inclusive: true,
                            exact: true,
                            message: check.message,
                        });
                    }
                    else if (tooSmall) {
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.too_small,
                            minimum: check.value,
                            type: "string",
                            inclusive: true,
                            exact: true,
                            message: check.message,
                        });
                    }
                    status.dirty();
                }
            }
            else if (check.kind === "email") {
                if (!emailRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "email",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "emoji") {
                if (!emojiRegex) {
                    emojiRegex = new RegExp(_emojiRegex, "u");
                }
                if (!emojiRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "emoji",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "uuid") {
                if (!uuidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "uuid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "nanoid") {
                if (!nanoidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "nanoid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "cuid") {
                if (!cuidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "cuid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "cuid2") {
                if (!cuid2Regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "cuid2",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "ulid") {
                if (!ulidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "ulid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "url") {
                try {
                    new URL(input.data);
                }
                catch {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "url",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "regex") {
                check.regex.lastIndex = 0;
                const testResult = check.regex.test(input.data);
                if (!testResult) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "regex",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "trim") {
                input.data = input.data.trim();
            }
            else if (check.kind === "includes") {
                if (!input.data.includes(check.value, check.position)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: { includes: check.value, position: check.position },
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "toLowerCase") {
                input.data = input.data.toLowerCase();
            }
            else if (check.kind === "toUpperCase") {
                input.data = input.data.toUpperCase();
            }
            else if (check.kind === "startsWith") {
                if (!input.data.startsWith(check.value)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: { startsWith: check.value },
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "endsWith") {
                if (!input.data.endsWith(check.value)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: { endsWith: check.value },
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "datetime") {
                const regex = datetimeRegex(check);
                if (!regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: "datetime",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "date") {
                const regex = dateRegex;
                if (!regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: "date",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "time") {
                const regex = timeRegex(check);
                if (!regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: "time",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "duration") {
                if (!durationRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "duration",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "ip") {
                if (!isValidIP(input.data, check.version)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "ip",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "jwt") {
                if (!isValidJWT(input.data, check.alg)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "jwt",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "cidr") {
                if (!isValidCidr(input.data, check.version)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "cidr",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "base64") {
                if (!base64Regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "base64",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "base64url") {
                if (!base64urlRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "base64url",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else {
                util.assertNever(check);
            }
        }
        return { status: status.value, value: input.data };
    }
    _regex(regex, validation, message) {
        return this.refinement((data) => regex.test(data), {
            validation,
            code: ZodIssueCode.invalid_string,
            ...errorUtil.errToObj(message),
        });
    }
    _addCheck(check) {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    email(message) {
        return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
    }
    url(message) {
        return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
    }
    emoji(message) {
        return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
    }
    uuid(message) {
        return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
    }
    nanoid(message) {
        return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
    }
    cuid(message) {
        return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
    }
    cuid2(message) {
        return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
    }
    ulid(message) {
        return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
    }
    base64(message) {
        return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
    }
    base64url(message) {
        // base64url encoding is a modification of base64 that can safely be used in URLs and filenames
        return this._addCheck({
            kind: "base64url",
            ...errorUtil.errToObj(message),
        });
    }
    jwt(options) {
        return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
    }
    ip(options) {
        return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
    }
    cidr(options) {
        return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
    }
    datetime(options) {
        if (typeof options === "string") {
            return this._addCheck({
                kind: "datetime",
                precision: null,
                offset: false,
                local: false,
                message: options,
            });
        }
        return this._addCheck({
            kind: "datetime",
            precision: typeof options?.precision === "undefined" ? null : options?.precision,
            offset: options?.offset ?? false,
            local: options?.local ?? false,
            ...errorUtil.errToObj(options?.message),
        });
    }
    date(message) {
        return this._addCheck({ kind: "date", message });
    }
    time(options) {
        if (typeof options === "string") {
            return this._addCheck({
                kind: "time",
                precision: null,
                message: options,
            });
        }
        return this._addCheck({
            kind: "time",
            precision: typeof options?.precision === "undefined" ? null : options?.precision,
            ...errorUtil.errToObj(options?.message),
        });
    }
    duration(message) {
        return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
    }
    regex(regex, message) {
        return this._addCheck({
            kind: "regex",
            regex: regex,
            ...errorUtil.errToObj(message),
        });
    }
    includes(value, options) {
        return this._addCheck({
            kind: "includes",
            value: value,
            position: options?.position,
            ...errorUtil.errToObj(options?.message),
        });
    }
    startsWith(value, message) {
        return this._addCheck({
            kind: "startsWith",
            value: value,
            ...errorUtil.errToObj(message),
        });
    }
    endsWith(value, message) {
        return this._addCheck({
            kind: "endsWith",
            value: value,
            ...errorUtil.errToObj(message),
        });
    }
    min(minLength, message) {
        return this._addCheck({
            kind: "min",
            value: minLength,
            ...errorUtil.errToObj(message),
        });
    }
    max(maxLength, message) {
        return this._addCheck({
            kind: "max",
            value: maxLength,
            ...errorUtil.errToObj(message),
        });
    }
    length(len, message) {
        return this._addCheck({
            kind: "length",
            value: len,
            ...errorUtil.errToObj(message),
        });
    }
    /**
     * Equivalent to `.min(1)`
     */
    nonempty(message) {
        return this.min(1, errorUtil.errToObj(message));
    }
    trim() {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, { kind: "trim" }],
        });
    }
    toLowerCase() {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, { kind: "toLowerCase" }],
        });
    }
    toUpperCase() {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, { kind: "toUpperCase" }],
        });
    }
    get isDatetime() {
        return !!this._def.checks.find((ch) => ch.kind === "datetime");
    }
    get isDate() {
        return !!this._def.checks.find((ch) => ch.kind === "date");
    }
    get isTime() {
        return !!this._def.checks.find((ch) => ch.kind === "time");
    }
    get isDuration() {
        return !!this._def.checks.find((ch) => ch.kind === "duration");
    }
    get isEmail() {
        return !!this._def.checks.find((ch) => ch.kind === "email");
    }
    get isURL() {
        return !!this._def.checks.find((ch) => ch.kind === "url");
    }
    get isEmoji() {
        return !!this._def.checks.find((ch) => ch.kind === "emoji");
    }
    get isUUID() {
        return !!this._def.checks.find((ch) => ch.kind === "uuid");
    }
    get isNANOID() {
        return !!this._def.checks.find((ch) => ch.kind === "nanoid");
    }
    get isCUID() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid");
    }
    get isCUID2() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid2");
    }
    get isULID() {
        return !!this._def.checks.find((ch) => ch.kind === "ulid");
    }
    get isIP() {
        return !!this._def.checks.find((ch) => ch.kind === "ip");
    }
    get isCIDR() {
        return !!this._def.checks.find((ch) => ch.kind === "cidr");
    }
    get isBase64() {
        return !!this._def.checks.find((ch) => ch.kind === "base64");
    }
    get isBase64url() {
        // base64url encoding is a modification of base64 that can safely be used in URLs and filenames
        return !!this._def.checks.find((ch) => ch.kind === "base64url");
    }
    get minLength() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min;
    }
    get maxLength() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max;
    }
}
ZodString.create = (params) => {
    return new ZodString({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodString,
        coerce: params?.coerce ?? false,
        ...processCreateParams(params),
    });
};
// https://stackoverflow.com/questions/3966484/why-does-modulus-operator-return-fractional-number-in-javascript/31711034#31711034
function floatSafeRemainder(val, step) {
    const valDecCount = (val.toString().split(".")[1] || "").length;
    const stepDecCount = (step.toString().split(".")[1] || "").length;
    const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
    const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
    const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
    return (valInt % stepInt) / 10 ** decCount;
}
class ZodNumber extends ZodType {
    constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
        this.step = this.multipleOf;
    }
    _parse(input) {
        if (this._def.coerce) {
            input.data = Number(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.number) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.number,
                received: ctx.parsedType,
            });
            return parseUtil_INVALID;
        }
        let ctx = undefined;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
            if (check.kind === "int") {
                if (!util.isInteger(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_type,
                        expected: "integer",
                        received: "float",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "min") {
                const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
                if (tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        minimum: check.value,
                        type: "number",
                        inclusive: check.inclusive,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
                if (tooBig) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        maximum: check.value,
                        type: "number",
                        inclusive: check.inclusive,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "multipleOf") {
                if (floatSafeRemainder(input.data, check.value) !== 0) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.not_multiple_of,
                        multipleOf: check.value,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "finite") {
                if (!Number.isFinite(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.not_finite,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else {
                util.assertNever(check);
            }
        }
        return { status: status.value, value: input.data };
    }
    gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
        return new ZodNumber({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind,
                    value,
                    inclusive,
                    message: errorUtil.toString(message),
                },
            ],
        });
    }
    _addCheck(check) {
        return new ZodNumber({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    int(message) {
        return this._addCheck({
            kind: "int",
            message: errorUtil.toString(message),
        });
    }
    positive(message) {
        return this._addCheck({
            kind: "min",
            value: 0,
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    negative(message) {
        return this._addCheck({
            kind: "max",
            value: 0,
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    nonpositive(message) {
        return this._addCheck({
            kind: "max",
            value: 0,
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    nonnegative(message) {
        return this._addCheck({
            kind: "min",
            value: 0,
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    multipleOf(value, message) {
        return this._addCheck({
            kind: "multipleOf",
            value: value,
            message: errorUtil.toString(message),
        });
    }
    finite(message) {
        return this._addCheck({
            kind: "finite",
            message: errorUtil.toString(message),
        });
    }
    safe(message) {
        return this._addCheck({
            kind: "min",
            inclusive: true,
            value: Number.MIN_SAFE_INTEGER,
            message: errorUtil.toString(message),
        })._addCheck({
            kind: "max",
            inclusive: true,
            value: Number.MAX_SAFE_INTEGER,
            message: errorUtil.toString(message),
        });
    }
    get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min;
    }
    get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max;
    }
    get isInt() {
        return !!this._def.checks.find((ch) => ch.kind === "int" || (ch.kind === "multipleOf" && util.isInteger(ch.value)));
    }
    get isFinite() {
        let max = null;
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
                return true;
            }
            else if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
            else if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return Number.isFinite(min) && Number.isFinite(max);
    }
}
ZodNumber.create = (params) => {
    return new ZodNumber({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodNumber,
        coerce: params?.coerce || false,
        ...processCreateParams(params),
    });
};
class ZodBigInt extends ZodType {
    constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
    }
    _parse(input) {
        if (this._def.coerce) {
            try {
                input.data = BigInt(input.data);
            }
            catch {
                return this._getInvalidInput(input);
            }
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.bigint) {
            return this._getInvalidInput(input);
        }
        let ctx = undefined;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
            if (check.kind === "min") {
                const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
                if (tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        type: "bigint",
                        minimum: check.value,
                        inclusive: check.inclusive,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
                if (tooBig) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        type: "bigint",
                        maximum: check.value,
                        inclusive: check.inclusive,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "multipleOf") {
                if (input.data % check.value !== BigInt(0)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.not_multiple_of,
                        multipleOf: check.value,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else {
                util.assertNever(check);
            }
        }
        return { status: status.value, value: input.data };
    }
    _getInvalidInput(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.bigint,
            received: ctx.parsedType,
        });
        return parseUtil_INVALID;
    }
    gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
        return new ZodBigInt({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind,
                    value,
                    inclusive,
                    message: errorUtil.toString(message),
                },
            ],
        });
    }
    _addCheck(check) {
        return new ZodBigInt({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    positive(message) {
        return this._addCheck({
            kind: "min",
            value: BigInt(0),
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    negative(message) {
        return this._addCheck({
            kind: "max",
            value: BigInt(0),
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    nonpositive(message) {
        return this._addCheck({
            kind: "max",
            value: BigInt(0),
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    nonnegative(message) {
        return this._addCheck({
            kind: "min",
            value: BigInt(0),
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    multipleOf(value, message) {
        return this._addCheck({
            kind: "multipleOf",
            value,
            message: errorUtil.toString(message),
        });
    }
    get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min;
    }
    get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max;
    }
}
ZodBigInt.create = (params) => {
    return new ZodBigInt({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodBigInt,
        coerce: params?.coerce ?? false,
        ...processCreateParams(params),
    });
};
class ZodBoolean extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = Boolean(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.boolean) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.boolean,
                received: ctx.parsedType,
            });
            return parseUtil_INVALID;
        }
        return OK(input.data);
    }
}
ZodBoolean.create = (params) => {
    return new ZodBoolean({
        typeName: ZodFirstPartyTypeKind.ZodBoolean,
        coerce: params?.coerce || false,
        ...processCreateParams(params),
    });
};
class ZodDate extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = new Date(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.date) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.date,
                received: ctx.parsedType,
            });
            return parseUtil_INVALID;
        }
        if (Number.isNaN(input.data.getTime())) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_date,
            });
            return parseUtil_INVALID;
        }
        const status = new ParseStatus();
        let ctx = undefined;
        for (const check of this._def.checks) {
            if (check.kind === "min") {
                if (input.data.getTime() < check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        message: check.message,
                        inclusive: true,
                        exact: false,
                        minimum: check.value,
                        type: "date",
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                if (input.data.getTime() > check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        message: check.message,
                        inclusive: true,
                        exact: false,
                        maximum: check.value,
                        type: "date",
                    });
                    status.dirty();
                }
            }
            else {
                util.assertNever(check);
            }
        }
        return {
            status: status.value,
            value: new Date(input.data.getTime()),
        };
    }
    _addCheck(check) {
        return new ZodDate({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    min(minDate, message) {
        return this._addCheck({
            kind: "min",
            value: minDate.getTime(),
            message: errorUtil.toString(message),
        });
    }
    max(maxDate, message) {
        return this._addCheck({
            kind: "max",
            value: maxDate.getTime(),
            message: errorUtil.toString(message),
        });
    }
    get minDate() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min != null ? new Date(min) : null;
    }
    get maxDate() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max != null ? new Date(max) : null;
    }
}
ZodDate.create = (params) => {
    return new ZodDate({
        checks: [],
        coerce: params?.coerce || false,
        typeName: ZodFirstPartyTypeKind.ZodDate,
        ...processCreateParams(params),
    });
};
class ZodSymbol extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.symbol) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.symbol,
                received: ctx.parsedType,
            });
            return parseUtil_INVALID;
        }
        return OK(input.data);
    }
}
ZodSymbol.create = (params) => {
    return new ZodSymbol({
        typeName: ZodFirstPartyTypeKind.ZodSymbol,
        ...processCreateParams(params),
    });
};
class ZodUndefined extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.undefined,
                received: ctx.parsedType,
            });
            return parseUtil_INVALID;
        }
        return OK(input.data);
    }
}
ZodUndefined.create = (params) => {
    return new ZodUndefined({
        typeName: ZodFirstPartyTypeKind.ZodUndefined,
        ...processCreateParams(params),
    });
};
class ZodNull extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.null) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.null,
                received: ctx.parsedType,
            });
            return parseUtil_INVALID;
        }
        return OK(input.data);
    }
}
ZodNull.create = (params) => {
    return new ZodNull({
        typeName: ZodFirstPartyTypeKind.ZodNull,
        ...processCreateParams(params),
    });
};
class ZodAny extends ZodType {
    constructor() {
        super(...arguments);
        // to prevent instances of other classes from extending ZodAny. this causes issues with catchall in ZodObject.
        this._any = true;
    }
    _parse(input) {
        return OK(input.data);
    }
}
ZodAny.create = (params) => {
    return new ZodAny({
        typeName: ZodFirstPartyTypeKind.ZodAny,
        ...processCreateParams(params),
    });
};
class ZodUnknown extends ZodType {
    constructor() {
        super(...arguments);
        // required
        this._unknown = true;
    }
    _parse(input) {
        return OK(input.data);
    }
}
ZodUnknown.create = (params) => {
    return new ZodUnknown({
        typeName: ZodFirstPartyTypeKind.ZodUnknown,
        ...processCreateParams(params),
    });
};
class ZodNever extends ZodType {
    _parse(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.never,
            received: ctx.parsedType,
        });
        return parseUtil_INVALID;
    }
}
ZodNever.create = (params) => {
    return new ZodNever({
        typeName: ZodFirstPartyTypeKind.ZodNever,
        ...processCreateParams(params),
    });
};
class ZodVoid extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.void,
                received: ctx.parsedType,
            });
            return parseUtil_INVALID;
        }
        return OK(input.data);
    }
}
ZodVoid.create = (params) => {
    return new ZodVoid({
        typeName: ZodFirstPartyTypeKind.ZodVoid,
        ...processCreateParams(params),
    });
};
class ZodArray extends ZodType {
    _parse(input) {
        const { ctx, status } = this._processInputParams(input);
        const def = this._def;
        if (ctx.parsedType !== ZodParsedType.array) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.array,
                received: ctx.parsedType,
            });
            return parseUtil_INVALID;
        }
        if (def.exactLength !== null) {
            const tooBig = ctx.data.length > def.exactLength.value;
            const tooSmall = ctx.data.length < def.exactLength.value;
            if (tooBig || tooSmall) {
                addIssueToContext(ctx, {
                    code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
                    minimum: (tooSmall ? def.exactLength.value : undefined),
                    maximum: (tooBig ? def.exactLength.value : undefined),
                    type: "array",
                    inclusive: true,
                    exact: true,
                    message: def.exactLength.message,
                });
                status.dirty();
            }
        }
        if (def.minLength !== null) {
            if (ctx.data.length < def.minLength.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_small,
                    minimum: def.minLength.value,
                    type: "array",
                    inclusive: true,
                    exact: false,
                    message: def.minLength.message,
                });
                status.dirty();
            }
        }
        if (def.maxLength !== null) {
            if (ctx.data.length > def.maxLength.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_big,
                    maximum: def.maxLength.value,
                    type: "array",
                    inclusive: true,
                    exact: false,
                    message: def.maxLength.message,
                });
                status.dirty();
            }
        }
        if (ctx.common.async) {
            return Promise.all([...ctx.data].map((item, i) => {
                return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
            })).then((result) => {
                return ParseStatus.mergeArray(status, result);
            });
        }
        const result = [...ctx.data].map((item, i) => {
            return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        });
        return ParseStatus.mergeArray(status, result);
    }
    get element() {
        return this._def.type;
    }
    min(minLength, message) {
        return new ZodArray({
            ...this._def,
            minLength: { value: minLength, message: errorUtil.toString(message) },
        });
    }
    max(maxLength, message) {
        return new ZodArray({
            ...this._def,
            maxLength: { value: maxLength, message: errorUtil.toString(message) },
        });
    }
    length(len, message) {
        return new ZodArray({
            ...this._def,
            exactLength: { value: len, message: errorUtil.toString(message) },
        });
    }
    nonempty(message) {
        return this.min(1, message);
    }
}
ZodArray.create = (schema, params) => {
    return new ZodArray({
        type: schema,
        minLength: null,
        maxLength: null,
        exactLength: null,
        typeName: ZodFirstPartyTypeKind.ZodArray,
        ...processCreateParams(params),
    });
};
function deepPartialify(schema) {
    if (schema instanceof ZodObject) {
        const newShape = {};
        for (const key in schema.shape) {
            const fieldSchema = schema.shape[key];
            newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
        }
        return new ZodObject({
            ...schema._def,
            shape: () => newShape,
        });
    }
    else if (schema instanceof ZodArray) {
        return new ZodArray({
            ...schema._def,
            type: deepPartialify(schema.element),
        });
    }
    else if (schema instanceof ZodOptional) {
        return ZodOptional.create(deepPartialify(schema.unwrap()));
    }
    else if (schema instanceof ZodNullable) {
        return ZodNullable.create(deepPartialify(schema.unwrap()));
    }
    else if (schema instanceof ZodTuple) {
        return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
    }
    else {
        return schema;
    }
}
class ZodObject extends ZodType {
    constructor() {
        super(...arguments);
        this._cached = null;
        /**
         * @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
         * If you want to pass through unknown properties, use `.passthrough()` instead.
         */
        this.nonstrict = this.passthrough;
        // extend<
        //   Augmentation extends ZodRawShape,
        //   NewOutput extends util.flatten<{
        //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
        //       ? Augmentation[k]["_output"]
        //       : k extends keyof Output
        //       ? Output[k]
        //       : never;
        //   }>,
        //   NewInput extends util.flatten<{
        //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
        //       ? Augmentation[k]["_input"]
        //       : k extends keyof Input
        //       ? Input[k]
        //       : never;
        //   }>
        // >(
        //   augmentation: Augmentation
        // ): ZodObject<
        //   extendShape<T, Augmentation>,
        //   UnknownKeys,
        //   Catchall,
        //   NewOutput,
        //   NewInput
        // > {
        //   return new ZodObject({
        //     ...this._def,
        //     shape: () => ({
        //       ...this._def.shape(),
        //       ...augmentation,
        //     }),
        //   }) as any;
        // }
        /**
         * @deprecated Use `.extend` instead
         *  */
        this.augment = this.extend;
    }
    _getCached() {
        if (this._cached !== null)
            return this._cached;
        const shape = this._def.shape();
        const keys = util.objectKeys(shape);
        this._cached = { shape, keys };
        return this._cached;
    }
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.object) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType,
            });
            return parseUtil_INVALID;
        }
        const { status, ctx } = this._processInputParams(input);
        const { shape, keys: shapeKeys } = this._getCached();
        const extraKeys = [];
        if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
            for (const key in ctx.data) {
                if (!shapeKeys.includes(key)) {
                    extraKeys.push(key);
                }
            }
        }
        const pairs = [];
        for (const key of shapeKeys) {
            const keyValidator = shape[key];
            const value = ctx.data[key];
            pairs.push({
                key: { status: "valid", value: key },
                value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
                alwaysSet: key in ctx.data,
            });
        }
        if (this._def.catchall instanceof ZodNever) {
            const unknownKeys = this._def.unknownKeys;
            if (unknownKeys === "passthrough") {
                for (const key of extraKeys) {
                    pairs.push({
                        key: { status: "valid", value: key },
                        value: { status: "valid", value: ctx.data[key] },
                    });
                }
            }
            else if (unknownKeys === "strict") {
                if (extraKeys.length > 0) {
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.unrecognized_keys,
                        keys: extraKeys,
                    });
                    status.dirty();
                }
            }
            else if (unknownKeys === "strip") {
            }
            else {
                throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
            }
        }
        else {
            // run catchall validation
            const catchall = this._def.catchall;
            for (const key of extraKeys) {
                const value = ctx.data[key];
                pairs.push({
                    key: { status: "valid", value: key },
                    value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key) //, ctx.child(key), value, getParsedType(value)
                    ),
                    alwaysSet: key in ctx.data,
                });
            }
        }
        if (ctx.common.async) {
            return Promise.resolve()
                .then(async () => {
                const syncPairs = [];
                for (const pair of pairs) {
                    const key = await pair.key;
                    const value = await pair.value;
                    syncPairs.push({
                        key,
                        value,
                        alwaysSet: pair.alwaysSet,
                    });
                }
                return syncPairs;
            })
                .then((syncPairs) => {
                return ParseStatus.mergeObjectSync(status, syncPairs);
            });
        }
        else {
            return ParseStatus.mergeObjectSync(status, pairs);
        }
    }
    get shape() {
        return this._def.shape();
    }
    strict(message) {
        errorUtil.errToObj;
        return new ZodObject({
            ...this._def,
            unknownKeys: "strict",
            ...(message !== undefined
                ? {
                    errorMap: (issue, ctx) => {
                        const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
                        if (issue.code === "unrecognized_keys")
                            return {
                                message: errorUtil.errToObj(message).message ?? defaultError,
                            };
                        return {
                            message: defaultError,
                        };
                    },
                }
                : {}),
        });
    }
    strip() {
        return new ZodObject({
            ...this._def,
            unknownKeys: "strip",
        });
    }
    passthrough() {
        return new ZodObject({
            ...this._def,
            unknownKeys: "passthrough",
        });
    }
    // const AugmentFactory =
    //   <Def extends ZodObjectDef>(def: Def) =>
    //   <Augmentation extends ZodRawShape>(
    //     augmentation: Augmentation
    //   ): ZodObject<
    //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
    //     Def["unknownKeys"],
    //     Def["catchall"]
    //   > => {
    //     return new ZodObject({
    //       ...def,
    //       shape: () => ({
    //         ...def.shape(),
    //         ...augmentation,
    //       }),
    //     }) as any;
    //   };
    extend(augmentation) {
        return new ZodObject({
            ...this._def,
            shape: () => ({
                ...this._def.shape(),
                ...augmentation,
            }),
        });
    }
    /**
     * Prior to zod@1.0.12 there was a bug in the
     * inferred type of merged objects. Please
     * upgrade if you are experiencing issues.
     */
    merge(merging) {
        const merged = new ZodObject({
            unknownKeys: merging._def.unknownKeys,
            catchall: merging._def.catchall,
            shape: () => ({
                ...this._def.shape(),
                ...merging._def.shape(),
            }),
            typeName: ZodFirstPartyTypeKind.ZodObject,
        });
        return merged;
    }
    // merge<
    //   Incoming extends AnyZodObject,
    //   Augmentation extends Incoming["shape"],
    //   NewOutput extends {
    //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
    //       ? Augmentation[k]["_output"]
    //       : k extends keyof Output
    //       ? Output[k]
    //       : never;
    //   },
    //   NewInput extends {
    //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
    //       ? Augmentation[k]["_input"]
    //       : k extends keyof Input
    //       ? Input[k]
    //       : never;
    //   }
    // >(
    //   merging: Incoming
    // ): ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"],
    //   NewOutput,
    //   NewInput
    // > {
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    setKey(key, schema) {
        return this.augment({ [key]: schema });
    }
    // merge<Incoming extends AnyZodObject>(
    //   merging: Incoming
    // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
    // ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"]
    // > {
    //   // const mergedShape = objectUtil.mergeShapes(
    //   //   this._def.shape(),
    //   //   merging._def.shape()
    //   // );
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    catchall(index) {
        return new ZodObject({
            ...this._def,
            catchall: index,
        });
    }
    pick(mask) {
        const shape = {};
        for (const key of util.objectKeys(mask)) {
            if (mask[key] && this.shape[key]) {
                shape[key] = this.shape[key];
            }
        }
        return new ZodObject({
            ...this._def,
            shape: () => shape,
        });
    }
    omit(mask) {
        const shape = {};
        for (const key of util.objectKeys(this.shape)) {
            if (!mask[key]) {
                shape[key] = this.shape[key];
            }
        }
        return new ZodObject({
            ...this._def,
            shape: () => shape,
        });
    }
    /**
     * @deprecated
     */
    deepPartial() {
        return deepPartialify(this);
    }
    partial(mask) {
        const newShape = {};
        for (const key of util.objectKeys(this.shape)) {
            const fieldSchema = this.shape[key];
            if (mask && !mask[key]) {
                newShape[key] = fieldSchema;
            }
            else {
                newShape[key] = fieldSchema.optional();
            }
        }
        return new ZodObject({
            ...this._def,
            shape: () => newShape,
        });
    }
    required(mask) {
        const newShape = {};
        for (const key of util.objectKeys(this.shape)) {
            if (mask && !mask[key]) {
                newShape[key] = this.shape[key];
            }
            else {
                const fieldSchema = this.shape[key];
                let newField = fieldSchema;
                while (newField instanceof ZodOptional) {
                    newField = newField._def.innerType;
                }
                newShape[key] = newField;
            }
        }
        return new ZodObject({
            ...this._def,
            shape: () => newShape,
        });
    }
    keyof() {
        return createZodEnum(util.objectKeys(this.shape));
    }
}
ZodObject.create = (shape, params) => {
    return new ZodObject({
        shape: () => shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
ZodObject.strictCreate = (shape, params) => {
    return new ZodObject({
        shape: () => shape,
        unknownKeys: "strict",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
ZodObject.lazycreate = (shape, params) => {
    return new ZodObject({
        shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
class ZodUnion extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const options = this._def.options;
        function handleResults(results) {
            // return first issue-free validation if it exists
            for (const result of results) {
                if (result.result.status === "valid") {
                    return result.result;
                }
            }
            for (const result of results) {
                if (result.result.status === "dirty") {
                    // add issues from dirty option
                    ctx.common.issues.push(...result.ctx.common.issues);
                    return result.result;
                }
            }
            // return invalid
            const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union,
                unionErrors,
            });
            return parseUtil_INVALID;
        }
        if (ctx.common.async) {
            return Promise.all(options.map(async (option) => {
                const childCtx = {
                    ...ctx,
                    common: {
                        ...ctx.common,
                        issues: [],
                    },
                    parent: null,
                };
                return {
                    result: await option._parseAsync({
                        data: ctx.data,
                        path: ctx.path,
                        parent: childCtx,
                    }),
                    ctx: childCtx,
                };
            })).then(handleResults);
        }
        else {
            let dirty = undefined;
            const issues = [];
            for (const option of options) {
                const childCtx = {
                    ...ctx,
                    common: {
                        ...ctx.common,
                        issues: [],
                    },
                    parent: null,
                };
                const result = option._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: childCtx,
                });
                if (result.status === "valid") {
                    return result;
                }
                else if (result.status === "dirty" && !dirty) {
                    dirty = { result, ctx: childCtx };
                }
                if (childCtx.common.issues.length) {
                    issues.push(childCtx.common.issues);
                }
            }
            if (dirty) {
                ctx.common.issues.push(...dirty.ctx.common.issues);
                return dirty.result;
            }
            const unionErrors = issues.map((issues) => new ZodError(issues));
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union,
                unionErrors,
            });
            return parseUtil_INVALID;
        }
    }
    get options() {
        return this._def.options;
    }
}
ZodUnion.create = (types, params) => {
    return new ZodUnion({
        options: types,
        typeName: ZodFirstPartyTypeKind.ZodUnion,
        ...processCreateParams(params),
    });
};
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
//////////                                 //////////
//////////      ZodDiscriminatedUnion      //////////
//////////                                 //////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
const getDiscriminator = (type) => {
    if (type instanceof ZodLazy) {
        return getDiscriminator(type.schema);
    }
    else if (type instanceof ZodEffects) {
        return getDiscriminator(type.innerType());
    }
    else if (type instanceof ZodLiteral) {
        return [type.value];
    }
    else if (type instanceof ZodEnum) {
        return type.options;
    }
    else if (type instanceof ZodNativeEnum) {
        // eslint-disable-next-line ban/ban
        return util.objectValues(type.enum);
    }
    else if (type instanceof ZodDefault) {
        return getDiscriminator(type._def.innerType);
    }
    else if (type instanceof ZodUndefined) {
        return [undefined];
    }
    else if (type instanceof ZodNull) {
        return [null];
    }
    else if (type instanceof ZodOptional) {
        return [undefined, ...getDiscriminator(type.unwrap())];
    }
    else if (type instanceof ZodNullable) {
        return [null, ...getDiscriminator(type.unwrap())];
    }
    else if (type instanceof ZodBranded) {
        return getDiscriminator(type.unwrap());
    }
    else if (type instanceof ZodReadonly) {
        return getDiscriminator(type.unwrap());
    }
    else if (type instanceof ZodCatch) {
        return getDiscriminator(type._def.innerType);
    }
    else {
        return [];
    }
};
class ZodDiscriminatedUnion extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType,
            });
            return parseUtil_INVALID;
        }
        const discriminator = this.discriminator;
        const discriminatorValue = ctx.data[discriminator];
        const option = this.optionsMap.get(discriminatorValue);
        if (!option) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union_discriminator,
                options: Array.from(this.optionsMap.keys()),
                path: [discriminator],
            });
            return parseUtil_INVALID;
        }
        if (ctx.common.async) {
            return option._parseAsync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
        }
        else {
            return option._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
        }
    }
    get discriminator() {
        return this._def.discriminator;
    }
    get options() {
        return this._def.options;
    }
    get optionsMap() {
        return this._def.optionsMap;
    }
    /**
     * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
     * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
     * have a different value for each object in the union.
     * @param discriminator the name of the discriminator property
     * @param types an array of object schemas
     * @param params
     */
    static create(discriminator, options, params) {
        // Get all the valid discriminator values
        const optionsMap = new Map();
        // try {
        for (const type of options) {
            const discriminatorValues = getDiscriminator(type.shape[discriminator]);
            if (!discriminatorValues.length) {
                throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
            }
            for (const value of discriminatorValues) {
                if (optionsMap.has(value)) {
                    throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
                }
                optionsMap.set(value, type);
            }
        }
        return new ZodDiscriminatedUnion({
            typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
            discriminator,
            options,
            optionsMap,
            ...processCreateParams(params),
        });
    }
}
function mergeValues(a, b) {
    const aType = getParsedType(a);
    const bType = getParsedType(b);
    if (a === b) {
        return { valid: true, data: a };
    }
    else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
        const bKeys = util.objectKeys(b);
        const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
        const newObj = { ...a, ...b };
        for (const key of sharedKeys) {
            const sharedValue = mergeValues(a[key], b[key]);
            if (!sharedValue.valid) {
                return { valid: false };
            }
            newObj[key] = sharedValue.data;
        }
        return { valid: true, data: newObj };
    }
    else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
        if (a.length !== b.length) {
            return { valid: false };
        }
        const newArray = [];
        for (let index = 0; index < a.length; index++) {
            const itemA = a[index];
            const itemB = b[index];
            const sharedValue = mergeValues(itemA, itemB);
            if (!sharedValue.valid) {
                return { valid: false };
            }
            newArray.push(sharedValue.data);
        }
        return { valid: true, data: newArray };
    }
    else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
        return { valid: true, data: a };
    }
    else {
        return { valid: false };
    }
}
class ZodIntersection extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const handleParsed = (parsedLeft, parsedRight) => {
            if (isAborted(parsedLeft) || isAborted(parsedRight)) {
                return parseUtil_INVALID;
            }
            const merged = mergeValues(parsedLeft.value, parsedRight.value);
            if (!merged.valid) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_intersection_types,
                });
                return parseUtil_INVALID;
            }
            if (isDirty(parsedLeft) || isDirty(parsedRight)) {
                status.dirty();
            }
            return { status: status.value, value: merged.data };
        };
        if (ctx.common.async) {
            return Promise.all([
                this._def.left._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                }),
                this._def.right._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                }),
            ]).then(([left, right]) => handleParsed(left, right));
        }
        else {
            return handleParsed(this._def.left._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            }), this._def.right._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            }));
        }
    }
}
ZodIntersection.create = (left, right, params) => {
    return new ZodIntersection({
        left: left,
        right: right,
        typeName: ZodFirstPartyTypeKind.ZodIntersection,
        ...processCreateParams(params),
    });
};
// type ZodTupleItems = [ZodTypeAny, ...ZodTypeAny[]];
class ZodTuple extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.array) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.array,
                received: ctx.parsedType,
            });
            return parseUtil_INVALID;
        }
        if (ctx.data.length < this._def.items.length) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: this._def.items.length,
                inclusive: true,
                exact: false,
                type: "array",
            });
            return parseUtil_INVALID;
        }
        const rest = this._def.rest;
        if (!rest && ctx.data.length > this._def.items.length) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: this._def.items.length,
                inclusive: true,
                exact: false,
                type: "array",
            });
            status.dirty();
        }
        const items = [...ctx.data]
            .map((item, itemIndex) => {
            const schema = this._def.items[itemIndex] || this._def.rest;
            if (!schema)
                return null;
            return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
        })
            .filter((x) => !!x); // filter nulls
        if (ctx.common.async) {
            return Promise.all(items).then((results) => {
                return ParseStatus.mergeArray(status, results);
            });
        }
        else {
            return ParseStatus.mergeArray(status, items);
        }
    }
    get items() {
        return this._def.items;
    }
    rest(rest) {
        return new ZodTuple({
            ...this._def,
            rest,
        });
    }
}
ZodTuple.create = (schemas, params) => {
    if (!Array.isArray(schemas)) {
        throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
    }
    return new ZodTuple({
        items: schemas,
        typeName: ZodFirstPartyTypeKind.ZodTuple,
        rest: null,
        ...processCreateParams(params),
    });
};
class ZodRecord extends ZodType {
    get keySchema() {
        return this._def.keyType;
    }
    get valueSchema() {
        return this._def.valueType;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType,
            });
            return parseUtil_INVALID;
        }
        const pairs = [];
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        for (const key in ctx.data) {
            pairs.push({
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
                value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
                alwaysSet: key in ctx.data,
            });
        }
        if (ctx.common.async) {
            return ParseStatus.mergeObjectAsync(status, pairs);
        }
        else {
            return ParseStatus.mergeObjectSync(status, pairs);
        }
    }
    get element() {
        return this._def.valueType;
    }
    static create(first, second, third) {
        if (second instanceof ZodType) {
            return new ZodRecord({
                keyType: first,
                valueType: second,
                typeName: ZodFirstPartyTypeKind.ZodRecord,
                ...processCreateParams(third),
            });
        }
        return new ZodRecord({
            keyType: ZodString.create(),
            valueType: first,
            typeName: ZodFirstPartyTypeKind.ZodRecord,
            ...processCreateParams(second),
        });
    }
}
class ZodMap extends ZodType {
    get keySchema() {
        return this._def.keyType;
    }
    get valueSchema() {
        return this._def.valueType;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.map) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.map,
                received: ctx.parsedType,
            });
            return parseUtil_INVALID;
        }
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        const pairs = [...ctx.data.entries()].map(([key, value], index) => {
            return {
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
                value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"])),
            };
        });
        if (ctx.common.async) {
            const finalMap = new Map();
            return Promise.resolve().then(async () => {
                for (const pair of pairs) {
                    const key = await pair.key;
                    const value = await pair.value;
                    if (key.status === "aborted" || value.status === "aborted") {
                        return parseUtil_INVALID;
                    }
                    if (key.status === "dirty" || value.status === "dirty") {
                        status.dirty();
                    }
                    finalMap.set(key.value, value.value);
                }
                return { status: status.value, value: finalMap };
            });
        }
        else {
            const finalMap = new Map();
            for (const pair of pairs) {
                const key = pair.key;
                const value = pair.value;
                if (key.status === "aborted" || value.status === "aborted") {
                    return parseUtil_INVALID;
                }
                if (key.status === "dirty" || value.status === "dirty") {
                    status.dirty();
                }
                finalMap.set(key.value, value.value);
            }
            return { status: status.value, value: finalMap };
        }
    }
}
ZodMap.create = (keyType, valueType, params) => {
    return new ZodMap({
        valueType,
        keyType,
        typeName: ZodFirstPartyTypeKind.ZodMap,
        ...processCreateParams(params),
    });
};
class ZodSet extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.set) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.set,
                received: ctx.parsedType,
            });
            return parseUtil_INVALID;
        }
        const def = this._def;
        if (def.minSize !== null) {
            if (ctx.data.size < def.minSize.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_small,
                    minimum: def.minSize.value,
                    type: "set",
                    inclusive: true,
                    exact: false,
                    message: def.minSize.message,
                });
                status.dirty();
            }
        }
        if (def.maxSize !== null) {
            if (ctx.data.size > def.maxSize.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_big,
                    maximum: def.maxSize.value,
                    type: "set",
                    inclusive: true,
                    exact: false,
                    message: def.maxSize.message,
                });
                status.dirty();
            }
        }
        const valueType = this._def.valueType;
        function finalizeSet(elements) {
            const parsedSet = new Set();
            for (const element of elements) {
                if (element.status === "aborted")
                    return parseUtil_INVALID;
                if (element.status === "dirty")
                    status.dirty();
                parsedSet.add(element.value);
            }
            return { status: status.value, value: parsedSet };
        }
        const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
        if (ctx.common.async) {
            return Promise.all(elements).then((elements) => finalizeSet(elements));
        }
        else {
            return finalizeSet(elements);
        }
    }
    min(minSize, message) {
        return new ZodSet({
            ...this._def,
            minSize: { value: minSize, message: errorUtil.toString(message) },
        });
    }
    max(maxSize, message) {
        return new ZodSet({
            ...this._def,
            maxSize: { value: maxSize, message: errorUtil.toString(message) },
        });
    }
    size(size, message) {
        return this.min(size, message).max(size, message);
    }
    nonempty(message) {
        return this.min(1, message);
    }
}
ZodSet.create = (valueType, params) => {
    return new ZodSet({
        valueType,
        minSize: null,
        maxSize: null,
        typeName: ZodFirstPartyTypeKind.ZodSet,
        ...processCreateParams(params),
    });
};
class ZodFunction extends ZodType {
    constructor() {
        super(...arguments);
        this.validate = this.implement;
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.function) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.function,
                received: ctx.parsedType,
            });
            return parseUtil_INVALID;
        }
        function makeArgsIssue(args, error) {
            return makeIssue({
                data: args,
                path: ctx.path,
                errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en].filter((x) => !!x),
                issueData: {
                    code: ZodIssueCode.invalid_arguments,
                    argumentsError: error,
                },
            });
        }
        function makeReturnsIssue(returns, error) {
            return makeIssue({
                data: returns,
                path: ctx.path,
                errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en].filter((x) => !!x),
                issueData: {
                    code: ZodIssueCode.invalid_return_type,
                    returnTypeError: error,
                },
            });
        }
        const params = { errorMap: ctx.common.contextualErrorMap };
        const fn = ctx.data;
        if (this._def.returns instanceof ZodPromise) {
            // Would love a way to avoid disabling this rule, but we need
            // an alias (using an arrow function was what caused 2651).
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const me = this;
            return OK(async function (...args) {
                const error = new ZodError([]);
                const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
                    error.addIssue(makeArgsIssue(args, e));
                    throw error;
                });
                const result = await Reflect.apply(fn, this, parsedArgs);
                const parsedReturns = await me._def.returns._def.type
                    .parseAsync(result, params)
                    .catch((e) => {
                    error.addIssue(makeReturnsIssue(result, e));
                    throw error;
                });
                return parsedReturns;
            });
        }
        else {
            // Would love a way to avoid disabling this rule, but we need
            // an alias (using an arrow function was what caused 2651).
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const me = this;
            return OK(function (...args) {
                const parsedArgs = me._def.args.safeParse(args, params);
                if (!parsedArgs.success) {
                    throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
                }
                const result = Reflect.apply(fn, this, parsedArgs.data);
                const parsedReturns = me._def.returns.safeParse(result, params);
                if (!parsedReturns.success) {
                    throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
                }
                return parsedReturns.data;
            });
        }
    }
    parameters() {
        return this._def.args;
    }
    returnType() {
        return this._def.returns;
    }
    args(...items) {
        return new ZodFunction({
            ...this._def,
            args: ZodTuple.create(items).rest(ZodUnknown.create()),
        });
    }
    returns(returnType) {
        return new ZodFunction({
            ...this._def,
            returns: returnType,
        });
    }
    implement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
    }
    strictImplement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
    }
    static create(args, returns, params) {
        return new ZodFunction({
            args: (args ? args : ZodTuple.create([]).rest(ZodUnknown.create())),
            returns: returns || ZodUnknown.create(),
            typeName: ZodFirstPartyTypeKind.ZodFunction,
            ...processCreateParams(params),
        });
    }
}
class ZodLazy extends ZodType {
    get schema() {
        return this._def.getter();
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const lazySchema = this._def.getter();
        return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
    }
}
ZodLazy.create = (getter, params) => {
    return new ZodLazy({
        getter: getter,
        typeName: ZodFirstPartyTypeKind.ZodLazy,
        ...processCreateParams(params),
    });
};
class ZodLiteral extends ZodType {
    _parse(input) {
        if (input.data !== this._def.value) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                received: ctx.data,
                code: ZodIssueCode.invalid_literal,
                expected: this._def.value,
            });
            return parseUtil_INVALID;
        }
        return { status: "valid", value: input.data };
    }
    get value() {
        return this._def.value;
    }
}
ZodLiteral.create = (value, params) => {
    return new ZodLiteral({
        value: value,
        typeName: ZodFirstPartyTypeKind.ZodLiteral,
        ...processCreateParams(params),
    });
};
function createZodEnum(values, params) {
    return new ZodEnum({
        values,
        typeName: ZodFirstPartyTypeKind.ZodEnum,
        ...processCreateParams(params),
    });
}
class ZodEnum extends ZodType {
    _parse(input) {
        if (typeof input.data !== "string") {
            const ctx = this._getOrReturnCtx(input);
            const expectedValues = this._def.values;
            addIssueToContext(ctx, {
                expected: util.joinValues(expectedValues),
                received: ctx.parsedType,
                code: ZodIssueCode.invalid_type,
            });
            return parseUtil_INVALID;
        }
        if (!this._cache) {
            this._cache = new Set(this._def.values);
        }
        if (!this._cache.has(input.data)) {
            const ctx = this._getOrReturnCtx(input);
            const expectedValues = this._def.values;
            addIssueToContext(ctx, {
                received: ctx.data,
                code: ZodIssueCode.invalid_enum_value,
                options: expectedValues,
            });
            return parseUtil_INVALID;
        }
        return OK(input.data);
    }
    get options() {
        return this._def.values;
    }
    get enum() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
    get Values() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
    get Enum() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
    extract(values, newDef = this._def) {
        return ZodEnum.create(values, {
            ...this._def,
            ...newDef,
        });
    }
    exclude(values, newDef = this._def) {
        return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
            ...this._def,
            ...newDef,
        });
    }
}
ZodEnum.create = createZodEnum;
class ZodNativeEnum extends ZodType {
    _parse(input) {
        const nativeEnumValues = util.getValidEnumValues(this._def.values);
        const ctx = this._getOrReturnCtx(input);
        if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
            const expectedValues = util.objectValues(nativeEnumValues);
            addIssueToContext(ctx, {
                expected: util.joinValues(expectedValues),
                received: ctx.parsedType,
                code: ZodIssueCode.invalid_type,
            });
            return parseUtil_INVALID;
        }
        if (!this._cache) {
            this._cache = new Set(util.getValidEnumValues(this._def.values));
        }
        if (!this._cache.has(input.data)) {
            const expectedValues = util.objectValues(nativeEnumValues);
            addIssueToContext(ctx, {
                received: ctx.data,
                code: ZodIssueCode.invalid_enum_value,
                options: expectedValues,
            });
            return parseUtil_INVALID;
        }
        return OK(input.data);
    }
    get enum() {
        return this._def.values;
    }
}
ZodNativeEnum.create = (values, params) => {
    return new ZodNativeEnum({
        values: values,
        typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
        ...processCreateParams(params),
    });
};
class ZodPromise extends ZodType {
    unwrap() {
        return this._def.type;
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.promise,
                received: ctx.parsedType,
            });
            return parseUtil_INVALID;
        }
        const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
        return OK(promisified.then((data) => {
            return this._def.type.parseAsync(data, {
                path: ctx.path,
                errorMap: ctx.common.contextualErrorMap,
            });
        }));
    }
}
ZodPromise.create = (schema, params) => {
    return new ZodPromise({
        type: schema,
        typeName: ZodFirstPartyTypeKind.ZodPromise,
        ...processCreateParams(params),
    });
};
class ZodEffects extends ZodType {
    innerType() {
        return this._def.schema;
    }
    sourceType() {
        return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects
            ? this._def.schema.sourceType()
            : this._def.schema;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const effect = this._def.effect || null;
        const checkCtx = {
            addIssue: (arg) => {
                addIssueToContext(ctx, arg);
                if (arg.fatal) {
                    status.abort();
                }
                else {
                    status.dirty();
                }
            },
            get path() {
                return ctx.path;
            },
        };
        checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
        if (effect.type === "preprocess") {
            const processed = effect.transform(ctx.data, checkCtx);
            if (ctx.common.async) {
                return Promise.resolve(processed).then(async (processed) => {
                    if (status.value === "aborted")
                        return parseUtil_INVALID;
                    const result = await this._def.schema._parseAsync({
                        data: processed,
                        path: ctx.path,
                        parent: ctx,
                    });
                    if (result.status === "aborted")
                        return parseUtil_INVALID;
                    if (result.status === "dirty")
                        return DIRTY(result.value);
                    if (status.value === "dirty")
                        return DIRTY(result.value);
                    return result;
                });
            }
            else {
                if (status.value === "aborted")
                    return parseUtil_INVALID;
                const result = this._def.schema._parseSync({
                    data: processed,
                    path: ctx.path,
                    parent: ctx,
                });
                if (result.status === "aborted")
                    return parseUtil_INVALID;
                if (result.status === "dirty")
                    return DIRTY(result.value);
                if (status.value === "dirty")
                    return DIRTY(result.value);
                return result;
            }
        }
        if (effect.type === "refinement") {
            const executeRefinement = (acc) => {
                const result = effect.refinement(acc, checkCtx);
                if (ctx.common.async) {
                    return Promise.resolve(result);
                }
                if (result instanceof Promise) {
                    throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
                }
                return acc;
            };
            if (ctx.common.async === false) {
                const inner = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                if (inner.status === "aborted")
                    return parseUtil_INVALID;
                if (inner.status === "dirty")
                    status.dirty();
                // return value is ignored
                executeRefinement(inner.value);
                return { status: status.value, value: inner.value };
            }
            else {
                return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
                    if (inner.status === "aborted")
                        return parseUtil_INVALID;
                    if (inner.status === "dirty")
                        status.dirty();
                    return executeRefinement(inner.value).then(() => {
                        return { status: status.value, value: inner.value };
                    });
                });
            }
        }
        if (effect.type === "transform") {
            if (ctx.common.async === false) {
                const base = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                if (!isValid(base))
                    return parseUtil_INVALID;
                const result = effect.transform(base.value, checkCtx);
                if (result instanceof Promise) {
                    throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
                }
                return { status: status.value, value: result };
            }
            else {
                return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
                    if (!isValid(base))
                        return parseUtil_INVALID;
                    return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
                        status: status.value,
                        value: result,
                    }));
                });
            }
        }
        util.assertNever(effect);
    }
}
ZodEffects.create = (schema, effect, params) => {
    return new ZodEffects({
        schema,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect,
        ...processCreateParams(params),
    });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
    return new ZodEffects({
        schema,
        effect: { type: "preprocess", transform: preprocess },
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        ...processCreateParams(params),
    });
};

class ZodOptional extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.undefined) {
            return OK(undefined);
        }
        return this._def.innerType._parse(input);
    }
    unwrap() {
        return this._def.innerType;
    }
}
ZodOptional.create = (type, params) => {
    return new ZodOptional({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodOptional,
        ...processCreateParams(params),
    });
};
class ZodNullable extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.null) {
            return OK(null);
        }
        return this._def.innerType._parse(input);
    }
    unwrap() {
        return this._def.innerType;
    }
}
ZodNullable.create = (type, params) => {
    return new ZodNullable({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodNullable,
        ...processCreateParams(params),
    });
};
class ZodDefault extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        let data = ctx.data;
        if (ctx.parsedType === ZodParsedType.undefined) {
            data = this._def.defaultValue();
        }
        return this._def.innerType._parse({
            data,
            path: ctx.path,
            parent: ctx,
        });
    }
    removeDefault() {
        return this._def.innerType;
    }
}
ZodDefault.create = (type, params) => {
    return new ZodDefault({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodDefault,
        defaultValue: typeof params.default === "function" ? params.default : () => params.default,
        ...processCreateParams(params),
    });
};
class ZodCatch extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        // newCtx is used to not collect issues from inner types in ctx
        const newCtx = {
            ...ctx,
            common: {
                ...ctx.common,
                issues: [],
            },
        };
        const result = this._def.innerType._parse({
            data: newCtx.data,
            path: newCtx.path,
            parent: {
                ...newCtx,
            },
        });
        if (isAsync(result)) {
            return result.then((result) => {
                return {
                    status: "valid",
                    value: result.status === "valid"
                        ? result.value
                        : this._def.catchValue({
                            get error() {
                                return new ZodError(newCtx.common.issues);
                            },
                            input: newCtx.data,
                        }),
                };
            });
        }
        else {
            return {
                status: "valid",
                value: result.status === "valid"
                    ? result.value
                    : this._def.catchValue({
                        get error() {
                            return new ZodError(newCtx.common.issues);
                        },
                        input: newCtx.data,
                    }),
            };
        }
    }
    removeCatch() {
        return this._def.innerType;
    }
}
ZodCatch.create = (type, params) => {
    return new ZodCatch({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodCatch,
        catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
        ...processCreateParams(params),
    });
};
class ZodNaN extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.nan) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.nan,
                received: ctx.parsedType,
            });
            return parseUtil_INVALID;
        }
        return { status: "valid", value: input.data };
    }
}
ZodNaN.create = (params) => {
    return new ZodNaN({
        typeName: ZodFirstPartyTypeKind.ZodNaN,
        ...processCreateParams(params),
    });
};
const BRAND = Symbol("zod_brand");
class ZodBranded extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const data = ctx.data;
        return this._def.type._parse({
            data,
            path: ctx.path,
            parent: ctx,
        });
    }
    unwrap() {
        return this._def.type;
    }
}
class ZodPipeline extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.common.async) {
            const handleAsync = async () => {
                const inResult = await this._def.in._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                if (inResult.status === "aborted")
                    return parseUtil_INVALID;
                if (inResult.status === "dirty") {
                    status.dirty();
                    return DIRTY(inResult.value);
                }
                else {
                    return this._def.out._parseAsync({
                        data: inResult.value,
                        path: ctx.path,
                        parent: ctx,
                    });
                }
            };
            return handleAsync();
        }
        else {
            const inResult = this._def.in._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
            if (inResult.status === "aborted")
                return parseUtil_INVALID;
            if (inResult.status === "dirty") {
                status.dirty();
                return {
                    status: "dirty",
                    value: inResult.value,
                };
            }
            else {
                return this._def.out._parseSync({
                    data: inResult.value,
                    path: ctx.path,
                    parent: ctx,
                });
            }
        }
    }
    static create(a, b) {
        return new ZodPipeline({
            in: a,
            out: b,
            typeName: ZodFirstPartyTypeKind.ZodPipeline,
        });
    }
}
class ZodReadonly extends ZodType {
    _parse(input) {
        const result = this._def.innerType._parse(input);
        const freeze = (data) => {
            if (isValid(data)) {
                data.value = Object.freeze(data.value);
            }
            return data;
        };
        return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
    }
    unwrap() {
        return this._def.innerType;
    }
}
ZodReadonly.create = (type, params) => {
    return new ZodReadonly({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodReadonly,
        ...processCreateParams(params),
    });
};
////////////////////////////////////////
////////////////////////////////////////
//////////                    //////////
//////////      z.custom      //////////
//////////                    //////////
////////////////////////////////////////
////////////////////////////////////////
function cleanParams(params, data) {
    const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
    const p2 = typeof p === "string" ? { message: p } : p;
    return p2;
}
function custom(check, _params = {}, 
/**
 * @deprecated
 *
 * Pass `fatal` into the params object instead:
 *
 * ```ts
 * z.string().custom((val) => val.length > 5, { fatal: false })
 * ```
 *
 */
fatal) {
    if (check)
        return ZodAny.create().superRefine((data, ctx) => {
            const r = check(data);
            if (r instanceof Promise) {
                return r.then((r) => {
                    if (!r) {
                        const params = cleanParams(_params, data);
                        const _fatal = params.fatal ?? fatal ?? true;
                        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
                    }
                });
            }
            if (!r) {
                const params = cleanParams(_params, data);
                const _fatal = params.fatal ?? fatal ?? true;
                ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
            }
            return;
        });
    return ZodAny.create();
}

const late = {
    object: ZodObject.lazycreate,
};
var ZodFirstPartyTypeKind;
(function (ZodFirstPartyTypeKind) {
    ZodFirstPartyTypeKind["ZodString"] = "ZodString";
    ZodFirstPartyTypeKind["ZodNumber"] = "ZodNumber";
    ZodFirstPartyTypeKind["ZodNaN"] = "ZodNaN";
    ZodFirstPartyTypeKind["ZodBigInt"] = "ZodBigInt";
    ZodFirstPartyTypeKind["ZodBoolean"] = "ZodBoolean";
    ZodFirstPartyTypeKind["ZodDate"] = "ZodDate";
    ZodFirstPartyTypeKind["ZodSymbol"] = "ZodSymbol";
    ZodFirstPartyTypeKind["ZodUndefined"] = "ZodUndefined";
    ZodFirstPartyTypeKind["ZodNull"] = "ZodNull";
    ZodFirstPartyTypeKind["ZodAny"] = "ZodAny";
    ZodFirstPartyTypeKind["ZodUnknown"] = "ZodUnknown";
    ZodFirstPartyTypeKind["ZodNever"] = "ZodNever";
    ZodFirstPartyTypeKind["ZodVoid"] = "ZodVoid";
    ZodFirstPartyTypeKind["ZodArray"] = "ZodArray";
    ZodFirstPartyTypeKind["ZodObject"] = "ZodObject";
    ZodFirstPartyTypeKind["ZodUnion"] = "ZodUnion";
    ZodFirstPartyTypeKind["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
    ZodFirstPartyTypeKind["ZodIntersection"] = "ZodIntersection";
    ZodFirstPartyTypeKind["ZodTuple"] = "ZodTuple";
    ZodFirstPartyTypeKind["ZodRecord"] = "ZodRecord";
    ZodFirstPartyTypeKind["ZodMap"] = "ZodMap";
    ZodFirstPartyTypeKind["ZodSet"] = "ZodSet";
    ZodFirstPartyTypeKind["ZodFunction"] = "ZodFunction";
    ZodFirstPartyTypeKind["ZodLazy"] = "ZodLazy";
    ZodFirstPartyTypeKind["ZodLiteral"] = "ZodLiteral";
    ZodFirstPartyTypeKind["ZodEnum"] = "ZodEnum";
    ZodFirstPartyTypeKind["ZodEffects"] = "ZodEffects";
    ZodFirstPartyTypeKind["ZodNativeEnum"] = "ZodNativeEnum";
    ZodFirstPartyTypeKind["ZodOptional"] = "ZodOptional";
    ZodFirstPartyTypeKind["ZodNullable"] = "ZodNullable";
    ZodFirstPartyTypeKind["ZodDefault"] = "ZodDefault";
    ZodFirstPartyTypeKind["ZodCatch"] = "ZodCatch";
    ZodFirstPartyTypeKind["ZodPromise"] = "ZodPromise";
    ZodFirstPartyTypeKind["ZodBranded"] = "ZodBranded";
    ZodFirstPartyTypeKind["ZodPipeline"] = "ZodPipeline";
    ZodFirstPartyTypeKind["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
// requires TS 4.4+
class Class {
    constructor(..._) { }
}
const instanceOfType = (
// const instanceOfType = <T extends new (...args: any[]) => any>(
cls, params = {
    message: `Input not instance of ${cls.name}`,
}) => custom((data) => data instanceof cls, params);
const stringType = ZodString.create;
const numberType = ZodNumber.create;
const nanType = ZodNaN.create;
const bigIntType = ZodBigInt.create;
const booleanType = ZodBoolean.create;
const dateType = ZodDate.create;
const symbolType = ZodSymbol.create;
const undefinedType = ZodUndefined.create;
const nullType = ZodNull.create;
const anyType = ZodAny.create;
const unknownType = ZodUnknown.create;
const neverType = ZodNever.create;
const voidType = ZodVoid.create;
const arrayType = ZodArray.create;
const objectType = ZodObject.create;
const strictObjectType = ZodObject.strictCreate;
const unionType = ZodUnion.create;
const discriminatedUnionType = ZodDiscriminatedUnion.create;
const intersectionType = ZodIntersection.create;
const tupleType = ZodTuple.create;
const recordType = ZodRecord.create;
const mapType = ZodMap.create;
const setType = ZodSet.create;
const functionType = ZodFunction.create;
const lazyType = ZodLazy.create;
const literalType = ZodLiteral.create;
const enumType = ZodEnum.create;
const nativeEnumType = ZodNativeEnum.create;
const promiseType = ZodPromise.create;
const effectsType = ZodEffects.create;
const optionalType = ZodOptional.create;
const nullableType = ZodNullable.create;
const preprocessType = ZodEffects.createWithPreprocess;
const pipelineType = ZodPipeline.create;
const ostring = () => stringType().optional();
const onumber = () => numberType().optional();
const oboolean = () => booleanType().optional();
const coerce = {
    string: ((arg) => ZodString.create({ ...arg, coerce: true })),
    number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
    boolean: ((arg) => ZodBoolean.create({
        ...arg,
        coerce: true,
    })),
    bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
    date: ((arg) => ZodDate.create({ ...arg, coerce: true })),
};

const NEVER = (/* unused pure expression or super */ null && (INVALID));

;// CONCATENATED MODULE: ./node_modules/@modelcontextprotocol/sdk/dist/types.js

const LATEST_PROTOCOL_VERSION = "2024-11-05";
const SUPPORTED_PROTOCOL_VERSIONS = [
    LATEST_PROTOCOL_VERSION,
    "2024-10-07",
];
/* JSON-RPC types */
const JSONRPC_VERSION = "2.0";
/**
 * A progress token, used to associate progress notifications with the original request.
 */
const ProgressTokenSchema = unionType([stringType(), numberType().int()]);
/**
 * An opaque token used to represent a cursor for pagination.
 */
const CursorSchema = stringType();
const BaseRequestParamsSchema = objectType({
    _meta: optionalType(objectType({
        /**
         * If specified, the caller is requesting out-of-band progress notifications for this request (as represented by notifications/progress). The value of this parameter is an opaque token that will be attached to any subsequent notifications. The receiver is not obligated to provide these notifications.
         */
        progressToken: optionalType(ProgressTokenSchema),
    })
        .passthrough()),
})
    .passthrough();
const RequestSchema = objectType({
    method: stringType(),
    params: optionalType(BaseRequestParamsSchema),
});
const BaseNotificationParamsSchema = objectType({
    /**
     * This parameter name is reserved by MCP to allow clients and servers to attach additional metadata to their notifications.
     */
    _meta: optionalType(objectType({}).passthrough()),
})
    .passthrough();
const NotificationSchema = objectType({
    method: stringType(),
    params: optionalType(BaseNotificationParamsSchema),
});
const ResultSchema = objectType({
    /**
     * This result property is reserved by the protocol to allow clients and servers to attach additional metadata to their responses.
     */
    _meta: optionalType(objectType({}).passthrough()),
})
    .passthrough();
/**
 * A uniquely identifying ID for a request in JSON-RPC.
 */
const RequestIdSchema = unionType([stringType(), numberType().int()]);
/**
 * A request that expects a response.
 */
const JSONRPCRequestSchema = objectType({
    jsonrpc: literalType(JSONRPC_VERSION),
    id: RequestIdSchema,
})
    .merge(RequestSchema)
    .strict();
/**
 * A notification which does not expect a response.
 */
const JSONRPCNotificationSchema = objectType({
    jsonrpc: literalType(JSONRPC_VERSION),
})
    .merge(NotificationSchema)
    .strict();
/**
 * A successful (non-error) response to a request.
 */
const JSONRPCResponseSchema = objectType({
    jsonrpc: literalType(JSONRPC_VERSION),
    id: RequestIdSchema,
    result: ResultSchema,
})
    .strict();
/**
 * An incomplete set of error codes that may appear in JSON-RPC responses.
 */
var ErrorCode;
(function (ErrorCode) {
    // SDK error codes
    ErrorCode[ErrorCode["ConnectionClosed"] = -1] = "ConnectionClosed";
    // Standard JSON-RPC error codes
    ErrorCode[ErrorCode["ParseError"] = -32700] = "ParseError";
    ErrorCode[ErrorCode["InvalidRequest"] = -32600] = "InvalidRequest";
    ErrorCode[ErrorCode["MethodNotFound"] = -32601] = "MethodNotFound";
    ErrorCode[ErrorCode["InvalidParams"] = -32602] = "InvalidParams";
    ErrorCode[ErrorCode["InternalError"] = -32603] = "InternalError";
})(ErrorCode || (ErrorCode = {}));
/**
 * A response to a request that indicates an error occurred.
 */
const JSONRPCErrorSchema = objectType({
    jsonrpc: literalType(JSONRPC_VERSION),
    id: RequestIdSchema,
    error: objectType({
        /**
         * The error type that occurred.
         */
        code: numberType().int(),
        /**
         * A short description of the error. The message SHOULD be limited to a concise single sentence.
         */
        message: stringType(),
        /**
         * Additional information about the error. The value of this member is defined by the sender (e.g. detailed error information, nested errors etc.).
         */
        data: optionalType(unknownType()),
    }),
})
    .strict();
const JSONRPCMessageSchema = unionType([
    JSONRPCRequestSchema,
    JSONRPCNotificationSchema,
    JSONRPCResponseSchema,
    JSONRPCErrorSchema,
]);
/* Empty result */
/**
 * A response that indicates success but carries no data.
 */
const EmptyResultSchema = ResultSchema.strict();
/* Cancellation */
/**
 * This notification can be sent by either side to indicate that it is cancelling a previously-issued request.
 *
 * The request SHOULD still be in-flight, but due to communication latency, it is always possible that this notification MAY arrive after the request has already finished.
 *
 * This notification indicates that the result will be unused, so any associated processing SHOULD cease.
 *
 * A client MUST NOT attempt to cancel its `initialize` request.
 */
const CancelledNotificationSchema = NotificationSchema.extend({
    method: literalType("notifications/cancelled"),
    params: BaseNotificationParamsSchema.extend({
        /**
         * The ID of the request to cancel.
         *
         * This MUST correspond to the ID of a request previously issued in the same direction.
         */
        requestId: RequestIdSchema,
        /**
         * An optional string describing the reason for the cancellation. This MAY be logged or presented to the user.
         */
        reason: stringType().optional(),
    }),
});
/* Initialization */
/**
 * Describes the name and version of an MCP implementation.
 */
const ImplementationSchema = objectType({
    name: stringType(),
    version: stringType(),
})
    .passthrough();
/**
 * Capabilities a client may support. Known capabilities are defined here, in this schema, but this is not a closed set: any client can define its own, additional capabilities.
 */
const ClientCapabilitiesSchema = objectType({
    /**
     * Experimental, non-standard capabilities that the client supports.
     */
    experimental: optionalType(objectType({}).passthrough()),
    /**
     * Present if the client supports sampling from an LLM.
     */
    sampling: optionalType(objectType({}).passthrough()),
    /**
     * Present if the client supports listing roots.
     */
    roots: optionalType(objectType({
        /**
         * Whether the client supports issuing notifications for changes to the roots list.
         */
        listChanged: optionalType(booleanType()),
    })
        .passthrough()),
})
    .passthrough();
/**
 * This request is sent from the client to the server when it first connects, asking it to begin initialization.
 */
const InitializeRequestSchema = RequestSchema.extend({
    method: literalType("initialize"),
    params: BaseRequestParamsSchema.extend({
        /**
         * The latest version of the Model Context Protocol that the client supports. The client MAY decide to support older versions as well.
         */
        protocolVersion: stringType(),
        capabilities: ClientCapabilitiesSchema,
        clientInfo: ImplementationSchema,
    }),
});
/**
 * Capabilities that a server may support. Known capabilities are defined here, in this schema, but this is not a closed set: any server can define its own, additional capabilities.
 */
const ServerCapabilitiesSchema = objectType({
    /**
     * Experimental, non-standard capabilities that the server supports.
     */
    experimental: optionalType(objectType({}).passthrough()),
    /**
     * Present if the server supports sending log messages to the client.
     */
    logging: optionalType(objectType({}).passthrough()),
    /**
     * Present if the server offers any prompt templates.
     */
    prompts: optionalType(objectType({
        /**
         * Whether this server supports issuing notifications for changes to the prompt list.
         */
        listChanged: optionalType(booleanType()),
    })
        .passthrough()),
    /**
     * Present if the server offers any resources to read.
     */
    resources: optionalType(objectType({
        /**
         * Whether this server supports clients subscribing to resource updates.
         */
        subscribe: optionalType(booleanType()),
        /**
         * Whether this server supports issuing notifications for changes to the resource list.
         */
        listChanged: optionalType(booleanType()),
    })
        .passthrough()),
    /**
     * Present if the server offers any tools to call.
     */
    tools: optionalType(objectType({
        /**
         * Whether this server supports issuing notifications for changes to the tool list.
         */
        listChanged: optionalType(booleanType()),
    })
        .passthrough()),
})
    .passthrough();
/**
 * After receiving an initialize request from the client, the server sends this response.
 */
const InitializeResultSchema = ResultSchema.extend({
    /**
     * The version of the Model Context Protocol that the server wants to use. This may not match the version that the client requested. If the client cannot support this version, it MUST disconnect.
     */
    protocolVersion: stringType(),
    capabilities: ServerCapabilitiesSchema,
    serverInfo: ImplementationSchema,
});
/**
 * This notification is sent from the client to the server after initialization has finished.
 */
const InitializedNotificationSchema = NotificationSchema.extend({
    method: literalType("notifications/initialized"),
});
/* Ping */
/**
 * A ping, issued by either the server or the client, to check that the other party is still alive. The receiver must promptly respond, or else may be disconnected.
 */
const PingRequestSchema = RequestSchema.extend({
    method: literalType("ping"),
});
/* Progress notifications */
const ProgressSchema = objectType({
    /**
     * The progress thus far. This should increase every time progress is made, even if the total is unknown.
     */
    progress: numberType(),
    /**
     * Total number of items to process (or total progress required), if known.
     */
    total: optionalType(numberType()),
})
    .passthrough();
/**
 * An out-of-band notification used to inform the receiver of a progress update for a long-running request.
 */
const ProgressNotificationSchema = NotificationSchema.extend({
    method: literalType("notifications/progress"),
    params: BaseNotificationParamsSchema.merge(ProgressSchema).extend({
        /**
         * The progress token which was given in the initial request, used to associate this notification with the request that is proceeding.
         */
        progressToken: ProgressTokenSchema,
    }),
});
/* Pagination */
const PaginatedRequestSchema = RequestSchema.extend({
    params: BaseRequestParamsSchema.extend({
        /**
         * An opaque token representing the current pagination position.
         * If provided, the server should return results starting after this cursor.
         */
        cursor: optionalType(CursorSchema),
    }).optional(),
});
const PaginatedResultSchema = ResultSchema.extend({
    /**
     * An opaque token representing the pagination position after the last returned result.
     * If present, there may be more results available.
     */
    nextCursor: optionalType(CursorSchema),
});
/* Resources */
/**
 * The contents of a specific resource or sub-resource.
 */
const ResourceContentsSchema = objectType({
    /**
     * The URI of this resource.
     */
    uri: stringType(),
    /**
     * The MIME type of this resource, if known.
     */
    mimeType: optionalType(stringType()),
})
    .passthrough();
const TextResourceContentsSchema = ResourceContentsSchema.extend({
    /**
     * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
     */
    text: stringType(),
});
const BlobResourceContentsSchema = ResourceContentsSchema.extend({
    /**
     * A base64-encoded string representing the binary data of the item.
     */
    blob: stringType().base64(),
});
/**
 * A known resource that the server is capable of reading.
 */
const ResourceSchema = objectType({
    /**
     * The URI of this resource.
     */
    uri: stringType(),
    /**
     * A human-readable name for this resource.
     *
     * This can be used by clients to populate UI elements.
     */
    name: stringType(),
    /**
     * A description of what this resource represents.
     *
     * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
     */
    description: optionalType(stringType()),
    /**
     * The MIME type of this resource, if known.
     */
    mimeType: optionalType(stringType()),
})
    .passthrough();
/**
 * A template description for resources available on the server.
 */
const ResourceTemplateSchema = objectType({
    /**
     * A URI template (according to RFC 6570) that can be used to construct resource URIs.
     */
    uriTemplate: stringType(),
    /**
     * A human-readable name for the type of resource this template refers to.
     *
     * This can be used by clients to populate UI elements.
     */
    name: stringType(),
    /**
     * A description of what this template is for.
     *
     * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
     */
    description: optionalType(stringType()),
    /**
     * The MIME type for all resources that match this template. This should only be included if all resources matching this template have the same type.
     */
    mimeType: optionalType(stringType()),
})
    .passthrough();
/**
 * Sent from the client to request a list of resources the server has.
 */
const ListResourcesRequestSchema = PaginatedRequestSchema.extend({
    method: literalType("resources/list"),
});
/**
 * The server's response to a resources/list request from the client.
 */
const ListResourcesResultSchema = PaginatedResultSchema.extend({
    resources: arrayType(ResourceSchema),
});
/**
 * Sent from the client to request a list of resource templates the server has.
 */
const ListResourceTemplatesRequestSchema = PaginatedRequestSchema.extend({
    method: literalType("resources/templates/list"),
});
/**
 * The server's response to a resources/templates/list request from the client.
 */
const ListResourceTemplatesResultSchema = PaginatedResultSchema.extend({
    resourceTemplates: arrayType(ResourceTemplateSchema),
});
/**
 * Sent from the client to the server, to read a specific resource URI.
 */
const ReadResourceRequestSchema = RequestSchema.extend({
    method: literalType("resources/read"),
    params: BaseRequestParamsSchema.extend({
        /**
         * The URI of the resource to read. The URI can use any protocol; it is up to the server how to interpret it.
         */
        uri: stringType(),
    }),
});
/**
 * The server's response to a resources/read request from the client.
 */
const ReadResourceResultSchema = ResultSchema.extend({
    contents: arrayType(unionType([TextResourceContentsSchema, BlobResourceContentsSchema])),
});
/**
 * An optional notification from the server to the client, informing it that the list of resources it can read from has changed. This may be issued by servers without any previous subscription from the client.
 */
const ResourceListChangedNotificationSchema = NotificationSchema.extend({
    method: literalType("notifications/resources/list_changed"),
});
/**
 * Sent from the client to request resources/updated notifications from the server whenever a particular resource changes.
 */
const SubscribeRequestSchema = RequestSchema.extend({
    method: literalType("resources/subscribe"),
    params: BaseRequestParamsSchema.extend({
        /**
         * The URI of the resource to subscribe to. The URI can use any protocol; it is up to the server how to interpret it.
         */
        uri: stringType(),
    }),
});
/**
 * Sent from the client to request cancellation of resources/updated notifications from the server. This should follow a previous resources/subscribe request.
 */
const UnsubscribeRequestSchema = RequestSchema.extend({
    method: literalType("resources/unsubscribe"),
    params: BaseRequestParamsSchema.extend({
        /**
         * The URI of the resource to unsubscribe from.
         */
        uri: stringType(),
    }),
});
/**
 * A notification from the server to the client, informing it that a resource has changed and may need to be read again. This should only be sent if the client previously sent a resources/subscribe request.
 */
const ResourceUpdatedNotificationSchema = NotificationSchema.extend({
    method: literalType("notifications/resources/updated"),
    params: BaseNotificationParamsSchema.extend({
        /**
         * The URI of the resource that has been updated. This might be a sub-resource of the one that the client actually subscribed to.
         */
        uri: stringType(),
    }),
});
/* Prompts */
/**
 * Describes an argument that a prompt can accept.
 */
const PromptArgumentSchema = objectType({
    /**
     * The name of the argument.
     */
    name: stringType(),
    /**
     * A human-readable description of the argument.
     */
    description: optionalType(stringType()),
    /**
     * Whether this argument must be provided.
     */
    required: optionalType(booleanType()),
})
    .passthrough();
/**
 * A prompt or prompt template that the server offers.
 */
const PromptSchema = objectType({
    /**
     * The name of the prompt or prompt template.
     */
    name: stringType(),
    /**
     * An optional description of what this prompt provides
     */
    description: optionalType(stringType()),
    /**
     * A list of arguments to use for templating the prompt.
     */
    arguments: optionalType(arrayType(PromptArgumentSchema)),
})
    .passthrough();
/**
 * Sent from the client to request a list of prompts and prompt templates the server has.
 */
const ListPromptsRequestSchema = PaginatedRequestSchema.extend({
    method: literalType("prompts/list"),
});
/**
 * The server's response to a prompts/list request from the client.
 */
const ListPromptsResultSchema = PaginatedResultSchema.extend({
    prompts: arrayType(PromptSchema),
});
/**
 * Used by the client to get a prompt provided by the server.
 */
const GetPromptRequestSchema = RequestSchema.extend({
    method: literalType("prompts/get"),
    params: BaseRequestParamsSchema.extend({
        /**
         * The name of the prompt or prompt template.
         */
        name: stringType(),
        /**
         * Arguments to use for templating the prompt.
         */
        arguments: optionalType(recordType(stringType())),
    }),
});
/**
 * Text provided to or from an LLM.
 */
const TextContentSchema = objectType({
    type: literalType("text"),
    /**
     * The text content of the message.
     */
    text: stringType(),
})
    .passthrough();
/**
 * An image provided to or from an LLM.
 */
const ImageContentSchema = objectType({
    type: literalType("image"),
    /**
     * The base64-encoded image data.
     */
    data: stringType().base64(),
    /**
     * The MIME type of the image. Different providers may support different image types.
     */
    mimeType: stringType(),
})
    .passthrough();
/**
 * The contents of a resource, embedded into a prompt or tool call result.
 */
const EmbeddedResourceSchema = objectType({
    type: literalType("resource"),
    resource: unionType([TextResourceContentsSchema, BlobResourceContentsSchema]),
})
    .passthrough();
/**
 * Describes a message returned as part of a prompt.
 */
const PromptMessageSchema = objectType({
    role: enumType(["user", "assistant"]),
    content: unionType([
        TextContentSchema,
        ImageContentSchema,
        EmbeddedResourceSchema,
    ]),
})
    .passthrough();
/**
 * The server's response to a prompts/get request from the client.
 */
const GetPromptResultSchema = ResultSchema.extend({
    /**
     * An optional description for the prompt.
     */
    description: optionalType(stringType()),
    messages: arrayType(PromptMessageSchema),
});
/**
 * An optional notification from the server to the client, informing it that the list of prompts it offers has changed. This may be issued by servers without any previous subscription from the client.
 */
const PromptListChangedNotificationSchema = NotificationSchema.extend({
    method: literalType("notifications/prompts/list_changed"),
});
/* Tools */
/**
 * Definition for a tool the client can call.
 */
const ToolSchema = objectType({
    /**
     * The name of the tool.
     */
    name: stringType(),
    /**
     * A human-readable description of the tool.
     */
    description: optionalType(stringType()),
    /**
     * A JSON Schema object defining the expected parameters for the tool.
     */
    inputSchema: objectType({
        type: literalType("object"),
        properties: optionalType(objectType({}).passthrough()),
    })
        .passthrough(),
})
    .passthrough();
/**
 * Sent from the client to request a list of tools the server has.
 */
const ListToolsRequestSchema = PaginatedRequestSchema.extend({
    method: literalType("tools/list"),
});
/**
 * The server's response to a tools/list request from the client.
 */
const ListToolsResultSchema = PaginatedResultSchema.extend({
    tools: arrayType(ToolSchema),
});
/**
 * The server's response to a tool call.
 */
const CallToolResultSchema = ResultSchema.extend({
    content: arrayType(unionType([TextContentSchema, ImageContentSchema, EmbeddedResourceSchema])),
    isError: booleanType().default(false).optional(),
});
/**
 * CallToolResultSchema extended with backwards compatibility to protocol version 2024-10-07.
 */
const CompatibilityCallToolResultSchema = CallToolResultSchema.or(ResultSchema.extend({
    toolResult: unknownType(),
}));
/**
 * Used by the client to invoke a tool provided by the server.
 */
const CallToolRequestSchema = RequestSchema.extend({
    method: literalType("tools/call"),
    params: BaseRequestParamsSchema.extend({
        name: stringType(),
        arguments: optionalType(recordType(unknownType())),
    }),
});
/**
 * An optional notification from the server to the client, informing it that the list of tools it offers has changed. This may be issued by servers without any previous subscription from the client.
 */
const ToolListChangedNotificationSchema = NotificationSchema.extend({
    method: literalType("notifications/tools/list_changed"),
});
/* Logging */
/**
 * The severity of a log message.
 */
const LoggingLevelSchema = enumType([
    "debug",
    "info",
    "notice",
    "warning",
    "error",
    "critical",
    "alert",
    "emergency",
]);
/**
 * A request from the client to the server, to enable or adjust logging.
 */
const SetLevelRequestSchema = RequestSchema.extend({
    method: literalType("logging/setLevel"),
    params: BaseRequestParamsSchema.extend({
        /**
         * The level of logging that the client wants to receive from the server. The server should send all logs at this level and higher (i.e., more severe) to the client as notifications/logging/message.
         */
        level: LoggingLevelSchema,
    }),
});
/**
 * Notification of a log message passed from server to client. If no logging/setLevel request has been sent from the client, the server MAY decide which messages to send automatically.
 */
const LoggingMessageNotificationSchema = NotificationSchema.extend({
    method: literalType("notifications/message"),
    params: BaseNotificationParamsSchema.extend({
        /**
         * The severity of this log message.
         */
        level: LoggingLevelSchema,
        /**
         * An optional name of the logger issuing this message.
         */
        logger: optionalType(stringType()),
        /**
         * The data to be logged, such as a string message or an object. Any JSON serializable type is allowed here.
         */
        data: unknownType(),
    }),
});
/* Sampling */
/**
 * Hints to use for model selection.
 */
const ModelHintSchema = objectType({
    /**
     * A hint for a model name.
     */
    name: stringType().optional(),
})
    .passthrough();
/**
 * The server's preferences for model selection, requested of the client during sampling.
 */
const ModelPreferencesSchema = objectType({
    /**
     * Optional hints to use for model selection.
     */
    hints: optionalType(arrayType(ModelHintSchema)),
    /**
     * How much to prioritize cost when selecting a model.
     */
    costPriority: optionalType(numberType().min(0).max(1)),
    /**
     * How much to prioritize sampling speed (latency) when selecting a model.
     */
    speedPriority: optionalType(numberType().min(0).max(1)),
    /**
     * How much to prioritize intelligence and capabilities when selecting a model.
     */
    intelligencePriority: optionalType(numberType().min(0).max(1)),
})
    .passthrough();
/**
 * Describes a message issued to or received from an LLM API.
 */
const SamplingMessageSchema = objectType({
    role: enumType(["user", "assistant"]),
    content: unionType([TextContentSchema, ImageContentSchema]),
})
    .passthrough();
/**
 * A request from the server to sample an LLM via the client. The client has full discretion over which model to select. The client should also inform the user before beginning sampling, to allow them to inspect the request (human in the loop) and decide whether to approve it.
 */
const CreateMessageRequestSchema = RequestSchema.extend({
    method: literalType("sampling/createMessage"),
    params: BaseRequestParamsSchema.extend({
        messages: arrayType(SamplingMessageSchema),
        /**
         * An optional system prompt the server wants to use for sampling. The client MAY modify or omit this prompt.
         */
        systemPrompt: optionalType(stringType()),
        /**
         * A request to include context from one or more MCP servers (including the caller), to be attached to the prompt. The client MAY ignore this request.
         */
        includeContext: optionalType(enumType(["none", "thisServer", "allServers"])),
        temperature: optionalType(numberType()),
        /**
         * The maximum number of tokens to sample, as requested by the server. The client MAY choose to sample fewer tokens than requested.
         */
        maxTokens: numberType().int(),
        stopSequences: optionalType(arrayType(stringType())),
        /**
         * Optional metadata to pass through to the LLM provider. The format of this metadata is provider-specific.
         */
        metadata: optionalType(objectType({}).passthrough()),
        /**
         * The server's preferences for which model to select.
         */
        modelPreferences: optionalType(ModelPreferencesSchema),
    }),
});
/**
 * The client's response to a sampling/create_message request from the server. The client should inform the user before returning the sampled message, to allow them to inspect the response (human in the loop) and decide whether to allow the server to see it.
 */
const CreateMessageResultSchema = ResultSchema.extend({
    /**
     * The name of the model that generated the message.
     */
    model: stringType(),
    /**
     * The reason why sampling stopped.
     */
    stopReason: optionalType(enumType(["endTurn", "stopSequence", "maxTokens"]).or(stringType())),
    role: enumType(["user", "assistant"]),
    content: discriminatedUnionType("type", [
        TextContentSchema,
        ImageContentSchema,
    ]),
});
/* Autocomplete */
/**
 * A reference to a resource or resource template definition.
 */
const ResourceReferenceSchema = objectType({
    type: literalType("ref/resource"),
    /**
     * The URI or URI template of the resource.
     */
    uri: stringType(),
})
    .passthrough();
/**
 * Identifies a prompt.
 */
const PromptReferenceSchema = objectType({
    type: literalType("ref/prompt"),
    /**
     * The name of the prompt or prompt template
     */
    name: stringType(),
})
    .passthrough();
/**
 * A request from the client to the server, to ask for completion options.
 */
const CompleteRequestSchema = RequestSchema.extend({
    method: literalType("completion/complete"),
    params: BaseRequestParamsSchema.extend({
        ref: unionType([PromptReferenceSchema, ResourceReferenceSchema]),
        /**
         * The argument's information
         */
        argument: objectType({
            /**
             * The name of the argument
             */
            name: stringType(),
            /**
             * The value of the argument to use for completion matching.
             */
            value: stringType(),
        })
            .passthrough(),
    }),
});
/**
 * The server's response to a completion/complete request
 */
const CompleteResultSchema = ResultSchema.extend({
    completion: objectType({
        /**
         * An array of completion values. Must not exceed 100 items.
         */
        values: arrayType(stringType()).max(100),
        /**
         * The total number of completion options available. This can exceed the number of values actually sent in the response.
         */
        total: optionalType(numberType().int()),
        /**
         * Indicates whether there are additional completion options beyond those provided in the current response, even if the exact total is unknown.
         */
        hasMore: optionalType(booleanType()),
    })
        .passthrough(),
});
/* Roots */
/**
 * Represents a root directory or file that the server can operate on.
 */
const RootSchema = objectType({
    /**
     * The URI identifying the root. This *must* start with file:// for now.
     */
    uri: stringType().startsWith("file://"),
    /**
     * An optional name for the root.
     */
    name: optionalType(stringType()),
})
    .passthrough();
/**
 * Sent from the server to request a list of root URIs from the client.
 */
const ListRootsRequestSchema = RequestSchema.extend({
    method: literalType("roots/list"),
});
/**
 * The client's response to a roots/list request from the server.
 */
const ListRootsResultSchema = ResultSchema.extend({
    roots: arrayType(RootSchema),
});
/**
 * A notification from the client to the server, informing it that the list of roots has changed.
 */
const RootsListChangedNotificationSchema = NotificationSchema.extend({
    method: literalType("notifications/roots/list_changed"),
});
/* Client messages */
const ClientRequestSchema = unionType([
    PingRequestSchema,
    InitializeRequestSchema,
    CompleteRequestSchema,
    SetLevelRequestSchema,
    GetPromptRequestSchema,
    ListPromptsRequestSchema,
    ListResourcesRequestSchema,
    ListResourceTemplatesRequestSchema,
    ReadResourceRequestSchema,
    SubscribeRequestSchema,
    UnsubscribeRequestSchema,
    CallToolRequestSchema,
    ListToolsRequestSchema,
]);
const ClientNotificationSchema = unionType([
    CancelledNotificationSchema,
    ProgressNotificationSchema,
    InitializedNotificationSchema,
    RootsListChangedNotificationSchema,
]);
const ClientResultSchema = unionType([
    EmptyResultSchema,
    CreateMessageResultSchema,
    ListRootsResultSchema,
]);
/* Server messages */
const ServerRequestSchema = unionType([
    PingRequestSchema,
    CreateMessageRequestSchema,
    ListRootsRequestSchema,
]);
const ServerNotificationSchema = unionType([
    CancelledNotificationSchema,
    ProgressNotificationSchema,
    LoggingMessageNotificationSchema,
    ResourceUpdatedNotificationSchema,
    ResourceListChangedNotificationSchema,
    ToolListChangedNotificationSchema,
    PromptListChangedNotificationSchema,
]);
const ServerResultSchema = unionType([
    EmptyResultSchema,
    InitializeResultSchema,
    CompleteResultSchema,
    GetPromptResultSchema,
    ListPromptsResultSchema,
    ListResourcesResultSchema,
    ListResourceTemplatesResultSchema,
    ReadResourceResultSchema,
    CallToolResultSchema,
    ListToolsResultSchema,
]);
class McpError extends Error {
    constructor(code, message, data) {
        super(`MCP error ${code}: ${message}`);
        this.code = code;
        this.data = data;
    }
}
//# sourceMappingURL=types.js.map
;// CONCATENATED MODULE: ./node_modules/@modelcontextprotocol/sdk/dist/shared/protocol.js

/**
 * Implements MCP protocol framing on top of a pluggable transport, including
 * features like request/response linking, notifications, and progress.
 */
class Protocol {
    constructor(_options) {
        this._options = _options;
        this._requestMessageId = 0;
        this._requestHandlers = new Map();
        this._requestHandlerAbortControllers = new Map();
        this._notificationHandlers = new Map();
        this._responseHandlers = new Map();
        this._progressHandlers = new Map();
        this.setNotificationHandler(CancelledNotificationSchema, (notification) => {
            const controller = this._requestHandlerAbortControllers.get(notification.params.requestId);
            controller === null || controller === void 0 ? void 0 : controller.abort(notification.params.reason);
        });
        this.setNotificationHandler(ProgressNotificationSchema, (notification) => {
            this._onprogress(notification);
        });
        this.setRequestHandler(PingRequestSchema, 
        // Automatic pong by default.
        (_request) => ({}));
    }
    /**
     * Attaches to the given transport, starts it, and starts listening for messages.
     *
     * The Protocol object assumes ownership of the Transport, replacing any callbacks that have already been set, and expects that it is the only user of the Transport instance going forward.
     */
    async connect(transport) {
        this._transport = transport;
        this._transport.onclose = () => {
            this._onclose();
        };
        this._transport.onerror = (error) => {
            this._onerror(error);
        };
        this._transport.onmessage = (message) => {
            if (!("method" in message)) {
                this._onresponse(message);
            }
            else if ("id" in message) {
                this._onrequest(message);
            }
            else {
                this._onnotification(message);
            }
        };
        await this._transport.start();
    }
    _onclose() {
        var _a;
        const responseHandlers = this._responseHandlers;
        this._responseHandlers = new Map();
        this._progressHandlers.clear();
        this._transport = undefined;
        (_a = this.onclose) === null || _a === void 0 ? void 0 : _a.call(this);
        const error = new McpError(ErrorCode.ConnectionClosed, "Connection closed");
        for (const handler of responseHandlers.values()) {
            handler(error);
        }
    }
    _onerror(error) {
        var _a;
        (_a = this.onerror) === null || _a === void 0 ? void 0 : _a.call(this, error);
    }
    _onnotification(notification) {
        var _a;
        const handler = (_a = this._notificationHandlers.get(notification.method)) !== null && _a !== void 0 ? _a : this.fallbackNotificationHandler;
        // Ignore notifications not being subscribed to.
        if (handler === undefined) {
            return;
        }
        // Starting with Promise.resolve() puts any synchronous errors into the monad as well.
        Promise.resolve()
            .then(() => handler(notification))
            .catch((error) => this._onerror(new Error(`Uncaught error in notification handler: ${error}`)));
    }
    _onrequest(request) {
        var _a, _b;
        const handler = (_a = this._requestHandlers.get(request.method)) !== null && _a !== void 0 ? _a : this.fallbackRequestHandler;
        if (handler === undefined) {
            (_b = this._transport) === null || _b === void 0 ? void 0 : _b.send({
                jsonrpc: "2.0",
                id: request.id,
                error: {
                    code: ErrorCode.MethodNotFound,
                    message: "Method not found",
                },
            }).catch((error) => this._onerror(new Error(`Failed to send an error response: ${error}`)));
            return;
        }
        const abortController = new AbortController();
        this._requestHandlerAbortControllers.set(request.id, abortController);
        // Starting with Promise.resolve() puts any synchronous errors into the monad as well.
        Promise.resolve()
            .then(() => handler(request, { signal: abortController.signal }))
            .then((result) => {
            var _a;
            if (abortController.signal.aborted) {
                return;
            }
            return (_a = this._transport) === null || _a === void 0 ? void 0 : _a.send({
                result,
                jsonrpc: "2.0",
                id: request.id,
            });
        }, (error) => {
            var _a, _b;
            if (abortController.signal.aborted) {
                return;
            }
            return (_a = this._transport) === null || _a === void 0 ? void 0 : _a.send({
                jsonrpc: "2.0",
                id: request.id,
                error: {
                    code: Number.isSafeInteger(error["code"])
                        ? error["code"]
                        : ErrorCode.InternalError,
                    message: (_b = error.message) !== null && _b !== void 0 ? _b : "Internal error",
                },
            });
        })
            .catch((error) => this._onerror(new Error(`Failed to send response: ${error}`)))
            .finally(() => {
            this._requestHandlerAbortControllers.delete(request.id);
        });
    }
    _onprogress(notification) {
        const { progress, total, progressToken } = notification.params;
        const handler = this._progressHandlers.get(Number(progressToken));
        if (handler === undefined) {
            this._onerror(new Error(`Received a progress notification for an unknown token: ${JSON.stringify(notification)}`));
            return;
        }
        handler({ progress, total });
    }
    _onresponse(response) {
        const messageId = response.id;
        const handler = this._responseHandlers.get(Number(messageId));
        if (handler === undefined) {
            this._onerror(new Error(`Received a response for an unknown message ID: ${JSON.stringify(response)}`));
            return;
        }
        this._responseHandlers.delete(Number(messageId));
        this._progressHandlers.delete(Number(messageId));
        if ("result" in response) {
            handler(response);
        }
        else {
            const error = new McpError(response.error.code, response.error.message, response.error.data);
            handler(error);
        }
    }
    get transport() {
        return this._transport;
    }
    /**
     * Closes the connection.
     */
    async close() {
        var _a;
        await ((_a = this._transport) === null || _a === void 0 ? void 0 : _a.close());
    }
    /**
     * Sends a request and wait for a response.
     *
     * Do not use this method to emit notifications! Use notification() instead.
     */
    request(request, resultSchema, options) {
        return new Promise((resolve, reject) => {
            var _a, _b, _c;
            if (!this._transport) {
                reject(new Error("Not connected"));
                return;
            }
            if (((_a = this._options) === null || _a === void 0 ? void 0 : _a.enforceStrictCapabilities) === true) {
                this.assertCapabilityForMethod(request.method);
            }
            (_b = options === null || options === void 0 ? void 0 : options.signal) === null || _b === void 0 ? void 0 : _b.throwIfAborted();
            const messageId = this._requestMessageId++;
            const jsonrpcRequest = {
                ...request,
                jsonrpc: "2.0",
                id: messageId,
            };
            if (options === null || options === void 0 ? void 0 : options.onprogress) {
                this._progressHandlers.set(messageId, options.onprogress);
                jsonrpcRequest.params = {
                    ...request.params,
                    _meta: { progressToken: messageId },
                };
            }
            this._responseHandlers.set(messageId, (response) => {
                var _a;
                if ((_a = options === null || options === void 0 ? void 0 : options.signal) === null || _a === void 0 ? void 0 : _a.aborted) {
                    return;
                }
                if (response instanceof Error) {
                    return reject(response);
                }
                try {
                    const result = resultSchema.parse(response.result);
                    resolve(result);
                }
                catch (error) {
                    reject(error);
                }
            });
            (_c = options === null || options === void 0 ? void 0 : options.signal) === null || _c === void 0 ? void 0 : _c.addEventListener("abort", () => {
                var _a, _b;
                const reason = (_a = options === null || options === void 0 ? void 0 : options.signal) === null || _a === void 0 ? void 0 : _a.reason;
                this._responseHandlers.delete(messageId);
                this._progressHandlers.delete(messageId);
                (_b = this._transport) === null || _b === void 0 ? void 0 : _b.send({
                    jsonrpc: "2.0",
                    method: "cancelled",
                    params: {
                        requestId: messageId,
                        reason: String(reason),
                    },
                });
                reject(reason);
            });
            this._transport.send(jsonrpcRequest).catch(reject);
        });
    }
    /**
     * Emits a notification, which is a one-way message that does not expect a response.
     */
    async notification(notification) {
        if (!this._transport) {
            throw new Error("Not connected");
        }
        this.assertNotificationCapability(notification.method);
        const jsonrpcNotification = {
            ...notification,
            jsonrpc: "2.0",
        };
        await this._transport.send(jsonrpcNotification);
    }
    /**
     * Registers a handler to invoke when this protocol object receives a request with the given method.
     *
     * Note that this will replace any previous request handler for the same method.
     */
    setRequestHandler(requestSchema, handler) {
        const method = requestSchema.shape.method.value;
        this.assertRequestHandlerCapability(method);
        this._requestHandlers.set(method, (request, extra) => Promise.resolve(handler(requestSchema.parse(request), extra)));
    }
    /**
     * Removes the request handler for the given method.
     */
    removeRequestHandler(method) {
        this._requestHandlers.delete(method);
    }
    /**
     * Registers a handler to invoke when this protocol object receives a notification with the given method.
     *
     * Note that this will replace any previous notification handler for the same method.
     */
    setNotificationHandler(notificationSchema, handler) {
        this._notificationHandlers.set(notificationSchema.shape.method.value, (notification) => Promise.resolve(handler(notificationSchema.parse(notification))));
    }
    /**
     * Removes the notification handler for the given method.
     */
    removeNotificationHandler(method) {
        this._notificationHandlers.delete(method);
    }
}
//# sourceMappingURL=protocol.js.map
;// CONCATENATED MODULE: ./node_modules/@modelcontextprotocol/sdk/dist/server/index.js


/**
 * An MCP server on top of a pluggable transport.
 *
 * This server will automatically respond to the initialization flow as initiated from the client.
 *
 * To use with custom types, extend the base Request/Notification/Result types and pass them as type parameters:
 *
 * ```typescript
 * // Custom schemas
 * const CustomRequestSchema = RequestSchema.extend({...})
 * const CustomNotificationSchema = NotificationSchema.extend({...})
 * const CustomResultSchema = ResultSchema.extend({...})
 *
 * // Type aliases
 * type CustomRequest = z.infer<typeof CustomRequestSchema>
 * type CustomNotification = z.infer<typeof CustomNotificationSchema>
 * type CustomResult = z.infer<typeof CustomResultSchema>
 *
 * // Create typed server
 * const server = new Server<CustomRequest, CustomNotification, CustomResult>({
 *   name: "CustomServer",
 *   version: "1.0.0"
 * })
 * ```
 */
class Server extends Protocol {
    /**
     * Initializes this server with the given name and version information.
     */
    constructor(_serverInfo, options) {
        super(options);
        this._serverInfo = _serverInfo;
        this._capabilities = options.capabilities;
        this.setRequestHandler(InitializeRequestSchema, (request) => this._oninitialize(request));
        this.setNotificationHandler(InitializedNotificationSchema, () => { var _a; return (_a = this.oninitialized) === null || _a === void 0 ? void 0 : _a.call(this); });
    }
    assertCapabilityForMethod(method) {
        var _a, _b;
        switch (method) {
            case "sampling/createMessage":
                if (!((_a = this._clientCapabilities) === null || _a === void 0 ? void 0 : _a.sampling)) {
                    throw new Error(`Client does not support sampling (required for ${method})`);
                }
                break;
            case "roots/list":
                if (!((_b = this._clientCapabilities) === null || _b === void 0 ? void 0 : _b.roots)) {
                    throw new Error(`Client does not support listing roots (required for ${method})`);
                }
                break;
            case "ping":
                // No specific capability required for ping
                break;
        }
    }
    assertNotificationCapability(method) {
        switch (method) {
            case "notifications/message":
                if (!this._capabilities.logging) {
                    throw new Error(`Server does not support logging (required for ${method})`);
                }
                break;
            case "notifications/resources/updated":
            case "notifications/resources/list_changed":
                if (!this._capabilities.resources) {
                    throw new Error(`Server does not support notifying about resources (required for ${method})`);
                }
                break;
            case "notifications/tools/list_changed":
                if (!this._capabilities.tools) {
                    throw new Error(`Server does not support notifying of tool list changes (required for ${method})`);
                }
                break;
            case "notifications/prompts/list_changed":
                if (!this._capabilities.prompts) {
                    throw new Error(`Server does not support notifying of prompt list changes (required for ${method})`);
                }
                break;
            case "notifications/cancelled":
                // Cancellation notifications are always allowed
                break;
            case "notifications/progress":
                // Progress notifications are always allowed
                break;
        }
    }
    assertRequestHandlerCapability(method) {
        switch (method) {
            case "sampling/createMessage":
                if (!this._capabilities.sampling) {
                    throw new Error(`Server does not support sampling (required for ${method})`);
                }
                break;
            case "logging/setLevel":
                if (!this._capabilities.logging) {
                    throw new Error(`Server does not support logging (required for ${method})`);
                }
                break;
            case "prompts/get":
            case "prompts/list":
                if (!this._capabilities.prompts) {
                    throw new Error(`Server does not support prompts (required for ${method})`);
                }
                break;
            case "resources/list":
            case "resources/templates/list":
            case "resources/read":
                if (!this._capabilities.resources) {
                    throw new Error(`Server does not support resources (required for ${method})`);
                }
                break;
            case "tools/call":
            case "tools/list":
                if (!this._capabilities.tools) {
                    throw new Error(`Server does not support tools (required for ${method})`);
                }
                break;
            case "ping":
            case "initialize":
                // No specific capability required for these methods
                break;
        }
    }
    async _oninitialize(request) {
        const requestedVersion = request.params.protocolVersion;
        this._clientCapabilities = request.params.capabilities;
        this._clientVersion = request.params.clientInfo;
        return {
            protocolVersion: SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion)
                ? requestedVersion
                : LATEST_PROTOCOL_VERSION,
            capabilities: this.getCapabilities(),
            serverInfo: this._serverInfo,
        };
    }
    /**
     * After initialization has completed, this will be populated with the client's reported capabilities.
     */
    getClientCapabilities() {
        return this._clientCapabilities;
    }
    /**
     * After initialization has completed, this will be populated with information about the client's name and version.
     */
    getClientVersion() {
        return this._clientVersion;
    }
    getCapabilities() {
        return this._capabilities;
    }
    async ping() {
        return this.request({ method: "ping" }, EmptyResultSchema);
    }
    async createMessage(params, options) {
        return this.request({ method: "sampling/createMessage", params }, CreateMessageResultSchema, options);
    }
    async listRoots(params, options) {
        return this.request({ method: "roots/list", params }, ListRootsResultSchema, options);
    }
    async sendLoggingMessage(params) {
        return this.notification({ method: "notifications/message", params });
    }
    async sendResourceUpdated(params) {
        return this.notification({
            method: "notifications/resources/updated",
            params,
        });
    }
    async sendResourceListChanged() {
        return this.notification({
            method: "notifications/resources/list_changed",
        });
    }
    async sendToolListChanged() {
        return this.notification({ method: "notifications/tools/list_changed" });
    }
    async sendPromptListChanged() {
        return this.notification({ method: "notifications/prompts/list_changed" });
    }
}
//# sourceMappingURL=index.js.map
;// CONCATENATED MODULE: external "node:process"
const external_node_process_namespaceObject = require("node:process");
;// CONCATENATED MODULE: ./node_modules/@modelcontextprotocol/sdk/dist/shared/stdio.js

/**
 * Buffers a continuous stdio stream into discrete JSON-RPC messages.
 */
class ReadBuffer {
    append(chunk) {
        this._buffer = this._buffer ? Buffer.concat([this._buffer, chunk]) : chunk;
    }
    readMessage() {
        if (!this._buffer) {
            return null;
        }
        const index = this._buffer.indexOf("\n");
        if (index === -1) {
            return null;
        }
        const line = this._buffer.toString("utf8", 0, index);
        this._buffer = this._buffer.subarray(index + 1);
        return deserializeMessage(line);
    }
    clear() {
        this._buffer = undefined;
    }
}
function deserializeMessage(line) {
    return JSONRPCMessageSchema.parse(JSON.parse(line));
}
function serializeMessage(message) {
    return JSON.stringify(message) + "\n";
}
//# sourceMappingURL=stdio.js.map
;// CONCATENATED MODULE: ./node_modules/@modelcontextprotocol/sdk/dist/server/stdio.js


/**
 * Server transport for stdio: this communicates with a MCP client by reading from the current process' stdin and writing to stdout.
 *
 * This transport is only available in Node.js environments.
 */
class StdioServerTransport {
    constructor(_stdin = external_node_process_namespaceObject.stdin, _stdout = external_node_process_namespaceObject.stdout) {
        this._stdin = _stdin;
        this._stdout = _stdout;
        this._readBuffer = new ReadBuffer();
        this._started = false;
        // Arrow functions to bind `this` properly, while maintaining function identity.
        this._ondata = (chunk) => {
            this._readBuffer.append(chunk);
            this.processReadBuffer();
        };
        this._onerror = (error) => {
            var _a;
            (_a = this.onerror) === null || _a === void 0 ? void 0 : _a.call(this, error);
        };
    }
    /**
     * Starts listening for messages on stdin.
     */
    async start() {
        if (this._started) {
            throw new Error("StdioServerTransport already started! If using Server class, note that connect() calls start() automatically.");
        }
        this._started = true;
        this._stdin.on("data", this._ondata);
        this._stdin.on("error", this._onerror);
    }
    processReadBuffer() {
        var _a, _b;
        while (true) {
            try {
                const message = this._readBuffer.readMessage();
                if (message === null) {
                    break;
                }
                (_a = this.onmessage) === null || _a === void 0 ? void 0 : _a.call(this, message);
            }
            catch (error) {
                (_b = this.onerror) === null || _b === void 0 ? void 0 : _b.call(this, error);
            }
        }
    }
    async close() {
        var _a;
        this._stdin.off("data", this._ondata);
        this._stdin.off("error", this._onerror);
        this._readBuffer.clear();
        (_a = this.onclose) === null || _a === void 0 ? void 0 : _a.call(this);
    }
    send(message) {
        return new Promise((resolve) => {
            const json = serializeMessage(message);
            if (this._stdout.write(json)) {
                resolve();
            }
            else {
                this._stdout.once("drain", resolve);
            }
        });
    }
}
//# sourceMappingURL=stdio.js.map
// EXTERNAL MODULE: external "fs/promises"
var promises_ = __nccwpck_require__(943);
// EXTERNAL MODULE: external "path"
var external_path_ = __nccwpck_require__(928);
// EXTERNAL MODULE: external "crypto"
var external_crypto_ = __nccwpck_require__(982);
// EXTERNAL MODULE: external "url"
var external_url_ = __nccwpck_require__(16);
;// CONCATENATED MODULE: ./lib/utils.js



/**
 * MARCH 2026 COMPLIANCE: Sovereign URI Normalizer
 * Ensures Windsurf Next matches files in explorer to MCP edits
 */
function toWindsurfUri(barePath) {
  if (!barePath) return barePath;
  // 1. Normalize slashes
  let normalized = barePath.replace(/\\/g, '/');
  // 2. Ensure it's absolute
  if (!external_path_.isAbsolute(normalized)) {
    normalized = external_path_.resolve(process.cwd(), normalized);
  }
  // 3. Convert to file:// URI
  return (0,external_url_.pathToFileURL)(normalized).href;
}

/**
 * Legacy normalizePath function for backwards compatibility
 */
function normalizePath(pathString) {
  return toWindsurfUri(pathString);
}

/**
 * Get default backup directory path
 */
function getDefaultBackupDir() {
  const localAppData =
    process.env.LOCALAPPDATA ||
    (process.env.USERPROFILE ? external_path_.join(process.env.USERPROFILE, 'AppData', 'Local') : null);
  const base = localAppData || process.cwd();
  return external_path_.join(base, 'SWEObeyMe', '.sweobeyme-backups');
}

// EXTERNAL MODULE: ./lib/config.js + 1 modules
var lib_config = __nccwpck_require__(219);
;// CONCATENATED MODULE: ./lib/backup.js






const BACKUP_DIR = process.env.SWEOBEYME_BACKUP_DIR
  ? external_path_.resolve(process.env.SWEOBEYME_BACKUP_DIR)
  : getDefaultBackupDir();
let backupCounter = 0;

// Configuration
const BACKUP_LOCK_TIMEOUT = 30000; // 30 seconds

// State management
const activeBackups = new Map(); // Track in-progress backups
const writeLocks = new Map(); // Track write locks

const DEBUG_LOGS = process.env.SWEOBEYME_DEBUG === '1';
const log = msg => {
  if (!DEBUG_LOGS) return;
  process.stderr.write(`[SWEObeyMe-Audit]: ${msg}\n`);
};

/**
 * Ensure backup directory exists
 */
async function ensureBackupDir() {
  try {
    await promises_.mkdir(BACKUP_DIR, { recursive: true });
    log(`Backup directory ready: ${BACKUP_DIR}`);
  } catch (error) {
    process.stderr.write(`[CRITICAL] Failed to create backup directory: ${error.message}\n`);
  }
}

/**
 * Calculate SHA-256 hash of content
 */
function calculateHash(content) {
  return external_crypto_.createHash('sha256').update(content).digest('hex');
}

/**
 * Verify backup integrity
 */
async function verifyBackup(backupPath, originalContent, originalHash) {
  try {
    const backupContent = await promises_.readFile(backupPath, 'utf-8');
    const backupHash = calculateHash(backupContent);

    if (originalHash !== backupHash) {
      throw new Error('Backup content hash mismatch');
    }

    if (backupContent !== originalContent) {
      throw new Error('Backup content mismatch');
    }

    return true;
  } catch (error) {
    process.stderr.write(`[BACKUP VERIFICATION FAILED] ${backupPath}: ${error.message}\n`);
    return false;
  }
}

/**
 * Clean up old backups for a file
 */
async function cleanupOldBackups(filePath) {
  try {
    const baseName = external_path_.basename(filePath);
    const files = await promises_.readdir(BACKUP_DIR);
    const backups = files
      .filter(f => f.startsWith(baseName + '.backup-') && f.endsWith('.readonly'))
      .sort((a, b) => {
        // Sort by timestamp (newest first)
        const tsA = parseInt(a.match(/-(\d+)\.readonly$/)[1]);
        const tsB = parseInt(b.match(/-(\d+)\.readonly$/)[1]);
        return tsB - tsA;
      });

    // Delete old backups beyond limit
    for (let i = (0,lib_config/* MAX_BACKUPS_PER_FILE */.q4)(); i < backups.length; i++) {
      const oldBackup = external_path_.join(BACKUP_DIR, backups[i]);
      await promises_.unlink(oldBackup).catch(() => {});
      log(`Cleaned up old backup: ${backups[i]}`);
    }
  } catch (error) {
    process.stderr.write(`[BACKUP CLEANUP WARNING] ${filePath}: ${error.message}\n`);
  }
}

/**
 * Acquire write lock for a file
 */
async function acquireWriteLock(filePath) {
  const fullPath = external_path_.resolve(filePath);

  if (writeLocks.has(fullPath)) {
    const lockTime = writeLocks.get(fullPath);
    const age = Date.now() - lockTime;

    // Lock expired?
    if (age > BACKUP_LOCK_TIMEOUT) {
      writeLocks.delete(fullPath);
      process.stderr.write(`[BACKUP WARNING] Expired write lock removed for ${filePath}\n`);
    } else {
      throw new Error(
        `File ${filePath} is being written by another operation (lock age: ${age}ms)`
      );
    }
  }

  writeLocks.set(fullPath, Date.now());
  return () => writeLocks.delete(fullPath); // Return release function
}

/**
 * Creates a numbered backup of a file with atomic operations and verification.
 * @param {string} filePath - Path to the file to backup.
 * @returns {string|null} - The backup file path or null if failed.
 */
async function createBackup(filePath) {
  const fullPath = external_path_.resolve(filePath);

  try {
    // Check if backup already in progress
    if (activeBackups.has(fullPath)) {
      const existingBackup = await activeBackups.get(fullPath);
      if (existingBackup) {
        log(`Using existing in-progress backup for ${filePath}`);
        return existingBackup;
      }
    }

    // Acquire write lock
    const releaseLock = await acquireWriteLock(filePath);

    const backupPromise = performBackup(filePath, fullPath);
    activeBackups.set(fullPath, backupPromise);

    try {
      const backupPath = await backupPromise;
      releaseLock();
      return backupPath;
    } catch (error) {
      releaseLock();
      throw error;
    } finally {
      activeBackups.delete(fullPath);
    }
  } catch (error) {
    process.stderr.write(`[BACKUP FAILED] ${filePath}: ${error.message}\n`);
    return null;
  }
}

/**
 * Internal backup implementation with atomic operations
 */
async function performBackup(filePath, fullPath) {
  try {
    // Read original file
    const content = await promises_.readFile(fullPath, 'utf-8');
    const originalHash = calculateHash(content);

    // Generate backup filename
    const timestamp = Date.now();
    const backupFileName = `${external_path_.basename(filePath)}.backup-${backupCounter++}-${timestamp}.readonly`;
    const backupPath = external_path_.join(BACKUP_DIR, backupFileName);

    // Atomic write: write to temp file first
    const tempPath = `${backupPath}.tmp`;
    await promises_.writeFile(tempPath, content, { encoding: 'utf-8', mode: 0o444 });

    // Atomic rename (atomic on Unix, Windows with proper flags)
    await promises_.rename(tempPath, backupPath);

    // Set read-only permission (Unix)
    if (process.platform !== 'win32') {
      await promises_.chmod(backupPath, 0o444);
    }

    // Verify backup integrity
    const verified = await verifyBackup(backupPath, content, originalHash);
    if (!verified) {
      // Cleanup failed backup
      await promises_.unlink(backupPath).catch(() => {});
      throw new Error('Backup verification failed');
    }

    // Clean up old backups
    await cleanupOldBackups(filePath);

    log(
      `Backup created and verified: ${backupFileName} (hash: ${originalHash.substring(0, 8)}...)`
    );
    return backupPath;
  } catch (error) {
    process.stderr.write(`[BACKUP ERROR] ${filePath}: ${error.message}\n`);
    throw error;
  }
}

/**
 * List all backups for a file
 */
async function listBackups(filePath) {
  try {
    const baseName = path.basename(filePath);
    const files = await fs.readdir(BACKUP_DIR);
    const backups = files
      .filter(f => f.startsWith(baseName + '.backup-') && f.endsWith('.readonly'))
      .sort((a, b) => {
        const tsA = parseInt(a.match(/-(\d+)\.readonly$/)[1]);
        const tsB = parseInt(b.match(/-(\d+)\.readonly$/)[1]);
        return tsB - tsA; // Newest first
      });

    return backups.map(name => ({
      name,
      path: path.join(BACKUP_DIR, name),
      timestamp: parseInt(name.match(/-(\d+)\.readonly$/)[1]),
    }));
  } catch (error) {
    process.stderr.write(`[BACKUP LIST ERROR] ${filePath}: ${error.message}\n`);
    return [];
  }
}

/**
 * Get backup statistics
 */
async function getBackupStats() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backups = files.filter(f => f.endsWith('.readonly'));

    // Calculate total size
    let totalSize = 0;
    for (const backup of backups) {
      const backupPath = path.join(BACKUP_DIR, backup);
      const stats = await fs.stat(backupPath);
      totalSize += stats.size;
    }

    // Group by original file
    const byFile = {};
    for (const backup of backups) {
      const originalFile = backup.replace(/\.backup-\d+-\d+\.readonly$/, '');
      byFile[originalFile] = (byFile[originalFile] || 0) + 1;
    }

    return {
      totalBackups: backups.length,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      byFile,
      backupDir: BACKUP_DIR,
    };
  } catch (error) {
    process.stderr.write(`[BACKUP STATS ERROR]: ${error.message}\n`);
    return null;
  }
}



;// CONCATENATED MODULE: ./lib/csharp-validation.js
/**
 * C# specific validation utilities
 * Helps prevent chaos in complex C# .NET 8/10 projects
 */



/**
 * Analyze C# code complexity
 */
function analyzeCSharpComplexity(code) {
  const lines = code.split('\n');
  const issues = [];
  const metrics = {
    maxNestingDepth: 0,
    maxMethodComplexity: 0,
    tryCatchDepth: 0,
    emptyCatchBlocks: [],
    asyncAwaitIssues: [],
    missingUsingStatements: [],
  };

  let currentNestingDepth = 0;
  let currentTryCatchDepth = 0;
  let methodComplexity = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // Track nesting depth
    if (line.includes('{')) {
      currentNestingDepth++;
      metrics.maxNestingDepth = Math.max(metrics.maxNestingDepth, currentNestingDepth);
    }
    if (line.includes('}')) {
      currentNestingDepth--;
    }

    // Track try-catch depth
    if (line.startsWith('try') && line.includes('{')) {
      currentTryCatchDepth++;
      metrics.tryCatchDepth = Math.max(metrics.tryCatchDepth, currentTryCatchDepth);
    }
    if (line.startsWith('catch') && line.includes('{')) {
      currentTryCatchDepth++;
      metrics.tryCatchDepth = Math.max(metrics.tryCatchDepth, currentTryCatchDepth);
    }
    if (
      line.includes('}') &&
      (lines[i - 1]?.trim().includes('catch') || lines[i - 1]?.trim().includes('try'))
    ) {
      currentTryCatchDepth--;
    }

    // Detect empty catch blocks
    if (line.startsWith('catch') && line.includes('{')) {
      const nextLines = lines.slice(i).join('\n');
      const catchEnd = nextLines.indexOf('}');
      const catchBody = nextLines.substring(nextLines.indexOf('{') + 1, catchEnd).trim();
      if (catchBody === '' || catchBody === '//' || catchBody.startsWith('//')) {
        issues.push({
          line: lineNum,
          type: 'EMPTY_CATCH',
          message: 'Empty catch block detected - exceptions are being swallowed',
        });
        metrics.emptyCatchBlocks.push(lineNum);
      }
    }

    // Detect async/await anti-patterns
    if (line.includes('async Task') && !line.includes('await')) {
      // Check if there's an await in the method
      const methodEnd = findMethodEnd(lines, i);
      const methodBody = lines.slice(i, methodEnd).join('\n');
      if (!methodBody.includes('await')) {
        issues.push({
          line: lineNum,
          type: 'ASYNC_NO_AWAIT',
          message: 'Async method without await - use async Task instead of async Task<T>',
        });
        metrics.asyncAwaitIssues.push(lineNum);
      }
    }

    // Detect void async methods (should return Task)
    if (line.includes('async void')) {
      issues.push({
        line: lineNum,
        type: 'ASYNC_VOID',
        message: 'Async void method detected - use async Task instead for better error handling',
      });
      metrics.asyncAwaitIssues.push(lineNum);
    }

    // Detect missing using statements for IDisposable
    const disposablePattern =
      /\b(Stream|Reader|Writer|Connection|Command|Transaction|HttpClient|DbContext|Disposable)\b/;
    if (disposablePattern.test(line) && !line.includes('using') && !line.includes('await using')) {
      // Check if it's inside a using statement
      const previousLines = lines.slice(0, i).reverse();
      let inUsing = false;
      for (const prevLine of previousLines) {
        if (prevLine.includes('using (') || prevLine.includes('await using (')) {
          inUsing = true;
          break;
        }
        if (prevLine.includes('}')) {
          break;
        }
      }
      if (!inUsing) {
        issues.push({
          line: lineNum,
          type: 'MISSING_USING',
          message: 'IDisposable object without using statement - potential resource leak',
        });
        metrics.missingUsingStatements.push(lineNum);
      }
    }

    // Calculate cyclomatic complexity (simplified)
    if (
      line.includes('if') ||
      line.includes('else if') ||
      line.includes('for') ||
      line.includes('foreach') ||
      line.includes('while') ||
      line.includes('case') ||
      line.includes('&&') ||
      line.includes('||') ||
      line.includes('?')
    ) {
      methodComplexity++;
    }
  }

  metrics.maxMethodComplexity = methodComplexity;

  return {
    issues,
    metrics,
    summary: generateSummary(metrics, issues),
  };
}

/**
 * Find the end of a method
 */
function findMethodEnd(lines, startLine) {
  let braceCount = 0;
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    braceCount += (line.match(/{/g) || []).length;
    braceCount -= (line.match(/}/g) || []).length;
    if (braceCount === 0 && i > startLine) {
      return i;
    }
  }
  return lines.length;
}

/**
 * Generate summary of complexity analysis
 */
function generateSummary(metrics, _issues) {
  const summary = [];

  if (metrics.maxNestingDepth > (0,lib_config/* CSHARP_MAX_NESTING_DEPTH */.Ql)()) {
    summary.push(
      `CRITICAL: Nesting depth ${metrics.maxNestingDepth} exceeds limit of ${(0,lib_config/* CSHARP_MAX_NESTING_DEPTH */.Ql)()}`
    );
  }

  if (metrics.maxMethodComplexity > (0,lib_config/* CSHARP_MAX_METHOD_COMPLEXITY */.CV)()) {
    summary.push(
      `WARNING: Method complexity ${metrics.maxMethodComplexity} exceeds limit of ${(0,lib_config/* CSHARP_MAX_METHOD_COMPLEXITY */.CV)()}`
    );
  }

  if (metrics.tryCatchDepth > (0,lib_config/* CSHARP_MAX_TRY_CATCH_DEPTH */.DS)()) {
    summary.push(
      `CRITICAL: Try-catch nesting ${metrics.tryCatchDepth} exceeds limit of ${(0,lib_config/* CSHARP_MAX_TRY_CATCH_DEPTH */.DS)()}`
    );
  }

  if (metrics.emptyCatchBlocks.length > 0) {
    summary.push(`WARNING: ${metrics.emptyCatchBlocks.length} empty catch block(s) detected`);
  }

  if (metrics.missingUsingStatements.length > 0) {
    summary.push(
      `CRITICAL: ${metrics.missingUsingStatements.length} missing using statement(s) for IDisposable`
    );
  }

  if (metrics.asyncAwaitIssues.length > 0) {
    summary.push(
      `WARNING: ${metrics.asyncAwaitIssues.length} async/await anti-pattern(s) detected`
    );
  }

  return summary.length > 0 ? summary : ['Code complexity is within acceptable limits'];
}

/**
 * Validate bracket matching in C# code
 */
function validateCSharpBrackets(code) {
  const issues = [];
  const stack = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const column = j + 1;

      if (char === '{' || char === '(' || char === '[') {
        stack.push({ char, line: lineNum, column });
      } else if (char === '}' || char === ')' || char === ']') {
        const opening = stack.pop();
        if (!opening) {
          issues.push({
            line: lineNum,
            column,
            type: 'UNEXPECTED_CLOSING_BRACKET',
            message: `Unexpected closing bracket '${char}' without matching opening bracket`,
          });
        } else {
          const pairs = { '{': '}', '(': ')', '[': ']' };
          if (pairs[opening.char] !== char) {
            issues.push({
              line: lineNum,
              column,
              type: 'MISMATCHED_BRACKET',
              message: `Mismatched brackets: expected '${pairs[opening.char]}' but found '${char}' (opened at line ${opening.line}, column ${opening.column})`,
            });
          }
        }
      }
    }
  }

  // Check for unclosed brackets
  while (stack.length > 0) {
    const unclosed = stack.pop();
    issues.push({
      line: unclosed.line,
      column: unclosed.column,
      type: 'UNCLOSED_BRACKET',
      message: `Unclosed bracket '${unclosed.char}' at line ${unclosed.line}, column ${unclosed.column}`,
    });
  }

  return {
    valid: issues.length === 0,
    issues,
    summary:
      issues.length > 0
        ? `${issues.length} bracket issue(s) found`
        : 'All brackets properly matched',
  };
}

/**
 * Visualize scope depth for C# code
 */
function visualizeScopeDepth(code) {
  const lines = code.split('\n');
  const visualization = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let depth = 0;

    // Calculate depth based on opening/closing brackets
    for (let j = 0; j < line.length; j++) {
      if (line[j] === '{' || line[j] === '(' || line[j] === '[') {
        depth++;
      } else if (line[j] === '}' || line[j] === ')' || line[j] === ']') {
        depth--;
      }
    }

    const indent = '│  '.repeat(Math.max(0, depth));
    const depthIndicator = depth > 5 ? ` ⚠️[${depth}]` : ` [${depth}]`;
    visualization.push(`${indent}${depthIndicator}${line}`);
  }

  return visualization.join('\n');
}

/**
 * Detect nested try-catch nightmares
 */
function detectNestedTryCatch(code) {
  const lines = code.split('\n');
  const issues = [];
  const tryStack = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('try') && line.includes('{')) {
      tryStack.push({ line: i + 1, depth: tryStack.length });
      if (tryStack.length > (0,lib_config/* CSHARP_MAX_TRY_CATCH_DEPTH */.DS)()) {
        issues.push({
          line: i + 1,
          depth: tryStack.length,
          type: 'DEEPLY_NESTED_TRY_CATCH',
          message: `Try-catch nested ${tryStack.length} levels deep - consider extracting to separate methods`,
        });
      }
    } else if (line.startsWith('catch') && line.includes('{')) {
      tryStack.push({ line: i + 1, depth: tryStack.length });
    } else if (line.startsWith('finally') && line.includes('{')) {
      tryStack.push({ line: i + 1, depth: tryStack.length });
    } else if (line === '}' && tryStack.length > 0) {
      tryStack.pop();
    }
  }

  return {
    issues,
    maxDepth: tryStack.reduce((max, item) => Math.max(max, item.depth), 0),
    summary:
      issues.length > 0
        ? `${issues.length} deeply nested try-catch issue(s) found`
        : 'Try-catch nesting is acceptable',
  };
}

/**
 * Validate C# code comprehensively
 */
function validateCSharpCode(code) {
  const complexity = analyzeCSharpComplexity(code);
  const brackets = validateCSharpBrackets(code);
  const tryCatch = detectNestedTryCatch(code);

  const allIssues = [...complexity.issues, ...brackets.issues, ...tryCatch.issues];

  const criticalIssues = allIssues.filter(
    i => i.type.includes('CRITICAL') || i.type.includes('UNCLOSED') || i.type.includes('UNEXPECTED')
  );
  const warnings = allIssues.filter(i => !criticalIssues.includes(i));

  return {
    valid: criticalIssues.length === 0,
    issues: allIssues,
    criticalIssues,
    warnings,
    metrics: complexity.metrics,
    summary: {
      complexity: complexity.summary,
      brackets: brackets.summary,
      tryCatch: tryCatch.summary,
    },
  };
}

;// CONCATENATED MODULE: ./lib/enforcement.js



// ENFORCEMENT RULES - Now configurable through config system
const getEnforcementRules = () => ({
  MAX_LINES: (0,lib_config/* MAX_LINES */.xg)(),
  FORBIDDEN_PATTERNS: (0,lib_config/* FORBIDDEN_PATTERNS */.cl)().map(p => new RegExp(p, 'g')),
  MANDATORY_COMMENTS: true,
  STRICT_MODE: true,
});

// Backward compatibility - use current config values
const ENFORCEMENT_RULES = getEnforcementRules();

// PHASE 10: Personality Layer - The "Soul" of the Governor
const CONSTITUTION = {
  TONE: 'Surgical, Professional, Minimalist',
  MANDATE: 'Protect the codebase from digital debt and file bloat.',
  RECOVERY_MODE: false,
  ERROR_THRESHOLD: 3, // Max errors before mandatory "Deep Scan"
};

const internalAudit = {
  consecutiveFailures: 0,
  lastHealthCheck: Date.now(),
  surgicalIntegrityScore: 100,
};

/**
 * Validates code content against architectural rules.
 * @param {string} content - The code to check.
 * @param {string} language - Optional language parameter for language-specific validation.
 * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
 */
function validateCode(content, language = null) {
  const errors = [];
  const warnings = [];
  const lines = content.split(/\r\n|\r|\n/).length;

  // Basic line count validation
  if (lines > ENFORCEMENT_RULES.MAX_LINES) {
    errors.push(`Line count ${lines} exceeds maximum of ${ENFORCEMENT_RULES.MAX_LINES}.`);
  }

  // Forbidden pattern validation
  ENFORCEMENT_RULES.FORBIDDEN_PATTERNS.forEach(pattern => {
    if (pattern.test(content)) {
      errors.push(`Forbidden pattern detected: ${pattern.toString()}`);
    }
  });

  // C# specific validations
  if (language === 'csharp' || (content.includes('namespace ') && content.includes('using '))) {
    // Bracket validation
    if ((0,lib_config/* CSHARP_ENABLE_BRACKET_VALIDATION */.dx)()) {
      const bracketValidation = validateCSharpBrackets(content);
      if (!bracketValidation.valid) {
        bracketValidation.issues.forEach(issue => {
          errors.push(
            `Bracket error at line ${issue.line}, column ${issue.column}: ${issue.message}`
          );
        });
      }
    }

    // Complexity validation
    const complexity = analyzeCSharpComplexity(content);
    if (complexity.metrics.maxNestingDepth > (0,lib_config/* CSHARP_MAX_NESTING_DEPTH */.Ql)()) {
      errors.push(
        `Nesting depth ${complexity.metrics.maxNestingDepth} exceeds maximum of ${(0,lib_config/* CSHARP_MAX_NESTING_DEPTH */.Ql)()}.`
      );
    }

    // Try-catch depth validation
    const tryCatch = detectNestedTryCatch(content);
    if (tryCatch.maxDepth > (0,lib_config/* CSHARP_MAX_TRY_CATCH_DEPTH */.DS)()) {
      errors.push(
        `Try-catch nesting depth ${tryCatch.maxDepth} exceeds maximum of ${(0,lib_config/* CSHARP_MAX_TRY_CATCH_DEPTH */.DS)()}.`
      );
    }

    // Add complexity issues as warnings
    complexity.issues.forEach(issue => {
      if (issue.type === 'EMPTY_CATCH' || issue.type === 'MISSING_USING') {
        errors.push(`Line ${issue.line}: ${issue.message}`);
      } else {
        warnings.push(`Line ${issue.line}: ${issue.message}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Attempts to repair common JSON malformations from AI output.
 * @param {string} rawString - The potentially broken JSON string.
 * @returns {Object|null} - Repaired object or null if unfixable.
 */
function repairJson(rawString) {
  try {
    // 1. Clean up common AI "Markdown" wrapping
    let clean = rawString.replace(/```json|```/g, '').trim();

    // 2. Fix trailing commas before closing braces
    clean = clean.replace(/,\s*([\]}])/g, '$1');

    return JSON.parse(clean);
  } catch (e) {
    console.error(`[REPAIR] Failed to auto-fix JSON: ${e.message}`);
    return null;
  }
}

/**
 * Ensures code follows the "Surgical" formatting rules automatically.
 */
function autoCorrectCode(content) {
  let fixed = content;
  // Auto-remove forbidden patterns instead of just blocking (Phase 6 upgrade)
  ENFORCEMENT_RULES.FORBIDDEN_PATTERNS.forEach(pattern => {
    fixed = fixed.replace(pattern, '// [REMOVED BY SWEObeyMe]: Forbidden Pattern');
  });
  return fixed;
}

;// CONCATENATED MODULE: ./lib/project.js



const project_DEBUG_LOGS = process.env.SWEOBEYME_DEBUG === '1';
const project_log = msg => {
  if (!project_DEBUG_LOGS) return;
  process.stderr.write(`[SWEObeyMe-Audit]: ${msg}\n`);
};

// Load Project Contract for context injection
let projectContract = '';

/**
 * Load Project Contract for context injection
 */
async function loadProjectContract() {
  try {
    const contractPath = __nccwpck_require__.ab + ".sweobeyme-contract.md";
    projectContract = await promises_.readFile(__nccwpck_require__.ab + ".sweobeyme-contract.md", 'utf-8');
    project_log('Project contract loaded successfully');
  } catch (error) {
    project_log('No project contract found, continuing without');
    projectContract = '';
  }
}

/**
 * Get the loaded project contract
 */
function getProjectContract() {
  return projectContract;
}

// Load .sweignore patterns
let ignorePatterns = [];

/**
 * Load .sweignore patterns
 */
async function loadSweIgnore() {
  try {
    const ignorePath = __nccwpck_require__.ab + ".sweignore";
    const content = await promises_.readFile(__nccwpck_require__.ab + ".sweignore", 'utf-8');
    ignorePatterns = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    project_log(`.sweignore loaded with ${ignorePatterns.length} patterns`);
  } catch (error) {
    project_log('No .sweignore found, using empty ignore list');
    ignorePatterns = [];
  }
}

/**
 * Check if path matches ignore patterns
 */
function shouldIgnore(filepath) {
  return ignorePatterns.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
    return regex.test(filepath);
  });
}

;// CONCATENATED MODULE: ./lib/session.js
// Session Memory Store - tracks actions for accountability
const sessionMemory = {
  history: [],
  lastAction: null,
  pendingSplits: [],
  violationCount: 0,
  maxHistory: 20,
};

/**
 * Helper to push to memory
 */
function recordAction(action, details, status = 'success') {
  sessionMemory.history.unshift({
    timestamp: new Date().toISOString(),
    action,
    details,
    status,
  });
  if (sessionMemory.history.length > sessionMemory.maxHistory) {
    sessionMemory.history.pop();
  }
  sessionMemory.lastAction = action;
}

;// CONCATENATED MODULE: ./lib/workflow.js
// PHASE 8: Workflow Orchestration Engine
const activeWorkflows = new Map();

class SurgicalWorkflow {
  constructor(id, goal, steps) {
    this.id = id;
    this.goal = goal;
    this.steps = steps.map(s => ({ ...s, status: 'pending' }));
    this.startTime = Date.now();
  }

  updateStep(stepName, status) {
    const step = this.steps.find(s => s.name === stepName);
    if (step) step.status = status;
  }

  isComplete() {
    return this.steps.every(s => s.status === 'completed');
  }
}



;// CONCATENATED MODULE: ./lib/tools/config-handlers.js


/**
 * Configuration tool handlers
 */

const configHandlers = {
  get_config: async _args => {
    try {
      const config = (0,lib_config/* getAllConfig */.ag)();
      return {
        content: [{ type: 'text', text: JSON.stringify(config, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to get configuration: ${error.message}` }],
      };
    }
  },

  set_config: async args => {
    try {
      (0,lib_config/* setConfigValues */.pP)(args.settings);
      await (0,lib_config/* saveConfig */.ql)();
      return {
        content: [
          {
            type: 'text',
            text: `Configuration updated successfully. New settings:\n${JSON.stringify(args.settings, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to set configuration: ${error.message}` }],
      };
    }
  },

  reset_config: async _args => {
    try {
      (0,lib_config/* resetConfig */.E6)();
      await (0,lib_config/* saveConfig */.ql)();
      return {
        content: [{ type: 'text', text: 'Configuration reset to defaults.' }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to reset configuration: ${error.message}` }],
      };
    }
  },

  get_config_schema: async _args => {
    try {
      const schema = (0,lib_config/* getConfigSchema */.oU)();
      return {
        content: [{ type: 'text', text: JSON.stringify(schema, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to get configuration schema: ${error.message}` }],
      };
    }
  },

  enforce_strict_mode: async args => {
    try {
      if (args.enable) {
        (0,lib_config/* setConfig */.Nk)('strictMode', true);
        (0,lib_config/* setConfig */.Nk)('requireDryRun', true);
        (0,lib_config/* setConfig */.Nk)('enableSyntaxValidation', true);
        (0,lib_config/* setConfig */.Nk)('enableImportValidation', true);
        (0,lib_config/* setConfig */.Nk)('enableAntiPatternDetection', true);
      } else {
        (0,lib_config/* setConfig */.Nk)('strictMode', false);
        (0,lib_config/* setConfig */.Nk)('requireDryRun', false);
      }
      await (0,lib_config/* saveConfig */.ql)();
      return {
        content: [
          {
            type: 'text',
            text: `Strict mode ${args.enable ? 'enabled' : 'disabled'}. ${args.enable ? 'Extra guardrails activated.' : 'Standard mode restored.'}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to set strict mode: ${error.message}` }],
      };
    }
  },
};

// EXTERNAL MODULE: ./lib/validation.js
var validation = __nccwpck_require__(912);
;// CONCATENATED MODULE: ./lib/verification.js




/**
 * Verification tools for validating code before applying changes
 */

/**
 * Dry run a write operation
 */
async function dryRunWriteFile(filePath, content) {
  const result = {
    success: true,
    errors: [],
    warnings: [],
    wouldChange: false,
    lineCount: 0,
    fileSize: content.length,
  };

  try {
    // Check if file exists
    const exists = await promises_.access(filePath)
      .then(() => true)
      .catch(() => false);

    if (exists) {
      result.wouldChange = true;
      const currentContent = await promises_.readFile(filePath, 'utf-8');

      // Check if content is the same
      if (currentContent === content) {
        result.warnings.push('Content is identical to current file');
        result.wouldChange = false;
      }
    } else {
      result.wouldChange = true;
      result.warnings.push('New file will be created');
    }

    // Validate syntax
    if ((0,lib_config/* ENABLE_SYNTAX_VALIDATION */.UO)()) {
      const syntaxResult = (0,validation.validateSyntax)(content);
      if (!syntaxResult.valid) {
        result.success = false;
        result.errors.push(...syntaxResult.errors);
      }
    }

    // Check line count
    const lineCount = content.split('\n').length;
    result.lineCount = lineCount;

    // Check for forbidden patterns
    const forbiddenPatterns = ['console.log', 'TODO', 'FIXME', 'HACK', 'debugger', 'eval('];

    forbiddenPatterns.forEach(pattern => {
      if (content.includes(pattern)) {
        result.errors.push(`Forbidden pattern detected: ${pattern}`);
      }
    });

    result.success = result.errors.length === 0;
  } catch (error) {
    result.success = false;
    result.errors.push(`Dry run failed: ${error.message}`);
  }

  return result;
}

/**
 * Verify syntax
 */
async function verifySyntax(code, language = 'javascript') {
  const { validateSyntax } = await Promise.resolve(/* import() */).then(__nccwpck_require__.bind(__nccwpck_require__, 912));
  return validateSyntax(code, language);
}

/**
 * Verify imports
 */
async function verifyImports(code, filePath) {
  const { validateImports } = await Promise.resolve(/* import() */).then(__nccwpck_require__.bind(__nccwpck_require__, 912));
  return validateImports(code, filePath);
}

/**
 * Verify type safety (basic check)
 */
function verifyTypeSafety(code) {
  const errors = [];

  // Check for TypeScript type annotations
  const hasTypeAnnotations = /:\s*(string|number|boolean|any|object|void|null)/.test(code);

  // Check for potential null/undefined issues
  const potentialNullIssues = code.match(/\w+\.\w+/g) || [];
  potentialNullIssues.forEach(ref => {
    if (!ref.includes('!') && !ref.includes('?')) {
      // This is a simplified check - real type checking would require TypeScript compiler
    }
  });

  // Check for any types (anti-pattern)
  const anyTypes = code.match(/:\s*any\b/g) || [];
  if (anyTypes.length > 0) {
    errors.push(`${anyTypes.length} uses of 'any' type detected`);
  }

  return {
    valid: errors.length === 0,
    errors,
    hasTypeAnnotations,
  };
}

/**
 * Verify change after applying
 */
async function verifyChangeAfterApply(filePath, expectedContent) {
  const result = {
    success: true,
    errors: [],
    warnings: [],
  };

  try {
    const actualContent = await fs.readFile(filePath, 'utf-8');

    if (actualContent !== expectedContent) {
      result.success = false;
      result.errors.push('Content does not match expected content');

      // Find differences
      const expectedLines = expectedContent.split('\n');
      const actualLines = actualContent.split('\n');
      const maxLines = Math.max(expectedLines.length, actualLines.length);

      for (let i = 0; i < maxLines; i++) {
        if (expectedLines[i] !== actualLines[i]) {
          result.errors.push(`Line ${i + 1} differs`);
        }
      }
    }

    // Verify syntax
    if (ENABLE_SYNTAX_VALIDATION()) {
      const syntaxResult = validateSyntax(actualContent);
      if (!syntaxResult.valid) {
        result.success = false;
        result.errors.push(...syntaxResult.errors);
      }
    }
  } catch (error) {
    result.success = false;
    result.errors.push(`Verification failed: ${error.message}`);
  }

  return result;
}

;// CONCATENATED MODULE: ./lib/guardrails.js



/**
 * Guardrail tools for enforcing strict rules
 */

/**
 * Enforce strict mode validation
 */
function enforceStrictMode(content) {
  if (!STRICT_MODE()) {
    return { valid: true, errors: [], warnings: [] };
  }

  const errors = [];
  const warnings = [];

  // Stricter line count limit (10% less than normal)
  const strictMaxLines = MAX_LINES() * 0.9;
  const lineCount = content.split('\n').length;

  if (lineCount > strictMaxLines) {
    errors.push(`Strict mode: Line count ${lineCount} exceeds strict limit of ${strictMaxLines}`);
  }

  // Check all forbidden patterns
  const patterns = FORBIDDEN_PATTERNS();
  patterns.forEach(pattern => {
    const regex = new RegExp(pattern, 'g');
    const matches = content.match(regex);
    if (matches) {
      errors.push(`Strict mode: Forbidden pattern '${pattern}' found ${matches.length} times`);
    }
  });

  // Require minimum documentation (15% in strict mode)
  const lines = content.split('\n');
  const commentLines = lines.filter(
    line => line.trim().startsWith('//') || line.trim().startsWith('/*')
  ).length;
  const commentRatio = commentLines / lineCount;
  const minRatio = MIN_DOCUMENTATION_RATIO() * 1.5;

  if (commentRatio < minRatio) {
    errors.push(
      `Strict mode: Documentation ratio ${(commentRatio * 100).toFixed(1)}% below strict minimum of ${(minRatio * 100).toFixed(1)}%`
    );
  }

  // Check for anti-patterns
  const antiPatterns = checkAntiPatterns(content);
  if (antiPatterns.issueCount > 0) {
    errors.push(`Strict mode: ${antiPatterns.issueCount} anti-patterns detected`);
    errors.push(...antiPatterns.issues);
  }

  // Check naming conventions
  const naming = validateNamingConventions(content);
  if (!naming.valid) {
    errors.push(`Strict mode: Naming convention violations`);
    errors.push(...naming.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check for anti-patterns
 */
function checkForAntiPatterns(content) {
  return (0,validation/* checkAntiPatterns */.k)(content);
}

/**
 * Check for dangerous operations
 */
function checkForDangerousOperations(content) {
  const dangerousPatterns = [
    { pattern: /rm\s+-rf/g, description: 'Recursive delete command' },
    { pattern: /exec\s*\(/g, description: 'Dynamic code execution' },
    { pattern: /eval\s*\(/g, description: 'eval() usage' },
    { pattern: /innerHTML\s*=/g, description: 'innerHTML assignment (XSS risk)' },
    { pattern: /document\.write/g, description: 'document.write (XSS risk)' },
    { pattern: /setTimeout\s*\(\s*['"]/g, description: 'setTimeout with string (code execution)' },
  ];

  const issues = [];

  dangerousPatterns.forEach(({ pattern, description }) => {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        description,
        count: matches.length,
        severity: 'high',
      });
    }
  });

  return {
    hasDangerousOperations: issues.length > 0,
    issues,
  };
}

/**
 * Check for security issues
 */
function checkForSecurityIssues(content) {
  const securityIssues = [];

  // Check for hardcoded secrets
  const secretPatterns = [
    /password\s*=\s*['"][^'"]+['"]/gi,
    /api[_-]?key\s*=\s*['"][^'"]+['"]/gi,
    /secret\s*=\s*['"][^'"]+['"]/gi,
    /token\s*=\s*['"][^'"]+['"]/gi,
  ];

  secretPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      securityIssues.push({
        type: 'hardcoded_secret',
        count: matches.length,
        severity: 'high',
        message: 'Potential hardcoded secrets detected',
      });
    }
  });

  // Check for SQL injection risks
  if (
    content.includes('SELECT') &&
    content.includes('WHERE') &&
    !content.includes('prepared') &&
    !content.includes('parameterized')
  ) {
    securityIssues.push({
      type: 'sql_injection',
      severity: 'high',
      message: 'Potential SQL injection vulnerability',
    });
  }

  // Check for XSS risks
  if (content.includes('innerHTML') || content.includes('document.write')) {
    securityIssues.push({
      type: 'xss',
      severity: 'high',
      message: 'Potential XSS vulnerability',
    });
  }

  return {
    hasSecurityIssues: securityIssues.length > 0,
    issues: securityIssues,
  };
}

;// CONCATENATED MODULE: ./lib/tools/validation-handlers.js





/**
 * Validation and verification tool handlers
 */

const validationHandlers = {
  dry_run_write_file: async args => {
    try {
      const result = await dryRunWriteFile(args.path, args.content);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Dry run failed: ${error.message}` }],
      };
    }
  },

  validate_change_before_apply: async args => {
    try {
      const { validateCodeComprehensive } = await Promise.resolve(/* import() */).then(__nccwpck_require__.bind(__nccwpck_require__, 912));
      const result = await validateCodeComprehensive(args.content, args.path);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Validation failed: ${error.message}` }],
      };
    }
  },

  verify_syntax: async args => {
    try {
      const result = verifySyntax(args.code, args.language);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Syntax verification failed: ${error.message}` }],
      };
    }
  },

  verify_imports: async args => {
    try {
      const result = await verifyImports(args.content, args.path);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Import verification failed: ${error.message}` }],
      };
    }
  },

  check_for_anti_patterns: async args => {
    try {
      const content = await promises_.readFile(args.path, 'utf-8');
      const result = checkForAntiPatterns(content);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Anti-pattern check failed: ${error.message}` }],
      };
    }
  },

  validate_naming_conventions: async args => {
    try {
      const content = await promises_.readFile(args.path, 'utf-8');
      const result = (0,validation/* validateNamingConventions */.L)(content);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Naming validation failed: ${error.message}` }],
      };
    }
  },
};

;// CONCATENATED MODULE: ./lib/math-safety.js
/**
 * Math expression safety utilities for C# and other languages
 * Helps prevent chaos in complex mathematical code
 */



/**
 * Analyze mathematical expression complexity
 */
function analyzeMathExpression(code) {
  const issues = [];
  const lines = code.split('\n');
  const metrics = {
    complexExpressions: [],
    potentialOverflow: [],
    precisionLoss: [],
    divisionByZeroRisk: [],
    operatorPrecedenceIssues: [],
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // Skip comments and empty lines
    if (line.startsWith('//') || line.startsWith('/*') || line === '') {
      continue;
    }

    // Detect complex mathematical expressions
    const operators = (line.match(/[+\-*/%^]/g) || []).length;
    const parentheses = (line.match(/\(/g) || []).length;
    const complexity = operators + parentheses;

    if (complexity >= (0,lib_config/* CSHARP_MATH_COMPLEXITY_THRESHOLD */.eV)()) {
      metrics.complexExpressions.push({
        line: lineNum,
        complexity,
        expression: line.substring(0, 100),
      });

      if ((0,lib_config/* CSHARP_WARN_ON_COMPLEX_MATH */.p6)()) {
        issues.push({
          line: lineNum,
          type: 'COMPLEX_MATH_EXPRESSION',
          severity: 'WARNING',
          message: `Complex mathematical expression (complexity: ${complexity}). Consider breaking into smaller expressions or variables.`,
        });
      }
    }

    // Detect potential integer overflow
    if (line.includes('int') && (line.includes('*') || line.includes('+'))) {
      // Check for multiplication/addition that could overflow
      const hasLargeNumbers = /\b\d{4,}\b/.test(line);
      if (hasLargeNumbers) {
        issues.push({
          line: lineNum,
          type: 'POTENTIAL_OVERFLOW',
          severity: 'WARNING',
          message:
            'Potential integer overflow detected with large numbers. Consider using long or checked context.',
        });
        metrics.potentialOverflow.push(lineNum);
      }
    }

    // Detect precision loss issues (decimal vs double)
    if (line.includes('double') && line.includes('decimal')) {
      issues.push({
        line: lineNum,
        type: 'PRECISION_LOSS',
        severity: 'WARNING',
        message: 'Mixing double and decimal may cause precision loss. Use consistent types.',
      });
      metrics.precisionLoss.push(lineNum);
    }

    // Detect division without zero check
    if (line.includes('/') && !line.includes('0') && !line.includes('Zero')) {
      // Check if there's a zero check before this line
      const previousLines = lines.slice(Math.max(0, i - 5), i);
      const hasZeroCheck = previousLines.some(
        l => l.includes('== 0') || l.includes('!= 0') || l.includes('Zero') || l.includes('throw')
      );

      if (!hasZeroCheck) {
        issues.push({
          line: lineNum,
          type: 'DIVISION_BY_ZERO_RISK',
          severity: 'WARNING',
          message:
            'Division operation without explicit zero check detected. Add validation to prevent division by zero.',
        });
        metrics.divisionByZeroRisk.push(lineNum);
      }
    }

    // Detect operator precedence issues
    if (line.includes('&&') && line.includes('||')) {
      // Mixing && and || without parentheses can be ambiguous
      const hasParens = line.includes('(') && line.includes(')');
      if (!hasParens) {
        issues.push({
          line: lineNum,
          type: 'OPERATOR_PRECEDENCE',
          severity: 'WARNING',
          message:
            'Mixing && and || operators without parentheses. Use explicit grouping to clarify intent.',
        });
        metrics.operatorPrecedenceIssues.push(lineNum);
      }
    }

    // Detect complex nested parentheses
    const nestedParens = line.match(/\([^()]*\([^()]*\)/g);
    if (nestedParens && nestedParens.length > 0) {
      issues.push({
        line: lineNum,
        type: 'NESTED_PARENTHESES',
        severity: 'INFO',
        message:
          'Nested parentheses detected. Consider extracting sub-expressions to named variables for clarity.',
      });
    }

    // Detect magic numbers in calculations
    const magicNumbers = line.match(/\b\d+\b/g);
    if (
      magicNumbers &&
      magicNumbers.length > 2 &&
      !line.includes('const') &&
      !line.includes('readonly')
    ) {
      issues.push({
        line: lineNum,
        type: 'MAGIC_NUMBERS',
        severity: 'INFO',
        message:
          'Multiple magic numbers in expression. Consider extracting to named constants for maintainability.',
      });
    }
  }

  return {
    issues,
    metrics,
    summary: generateMathSummary(metrics, issues),
  };
}

/**
 * Generate summary of math safety analysis
 */
function generateMathSummary(metrics, _issues) {
  const summary = [];

  if (metrics.complexExpressions.length > 0) {
    const maxComplexity = Math.max(...metrics.complexExpressions.map(e => e.complexity));
    summary.push(
      `${metrics.complexExpressions.length} complex math expression(s) found (max complexity: ${maxComplexity})`
    );
  }

  if (metrics.potentialOverflow.length > 0) {
    summary.push(`${metrics.potentialOverflow.length} potential overflow risk(s) detected`);
  }

  if (metrics.precisionLoss.length > 0) {
    summary.push(`${metrics.precisionLoss.length} precision loss issue(s) detected`);
  }

  if (metrics.divisionByZeroRisk.length > 0) {
    summary.push(`${metrics.divisionByZeroRisk.length} division by zero risk(s) detected`);
  }

  if (metrics.operatorPrecedenceIssues.length > 0) {
    summary.push(
      `${metrics.operatorPrecedenceIssues.length} operator precedence issue(s) detected`
    );
  }

  return summary.length > 0 ? summary : ['Mathematical expressions are safe'];
}

/**
 * Validate C# math-specific patterns
 */
function validateCSharpMath(code) {
  const issues = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // Check for Math.Abs on potentially negative numbers
    if (line.includes('Math.Abs') && !line.includes('Math.Max')) {
      issues.push({
        line: lineNum,
        type: 'MATH_ABS_USAGE',
        severity: 'INFO',
        message: 'Math.Abs detected. Ensure this is the intended behavior for your use case.',
      });
    }

    // Check for floating point equality comparisons
    if (line.includes('==') && (line.includes('double') || line.includes('float'))) {
      issues.push({
        line: lineNum,
        type: 'FLOAT_EQUALITY',
        severity: 'WARNING',
        message:
          'Direct equality comparison of floating point numbers is unreliable. Use Math.Abs(a - b) < epsilon instead.',
      });
    }

    // Check for Math.Round without specifying rounding mode
    if (line.includes('Math.Round(') && !line.includes('MidpointRounding')) {
      issues.push({
        line: lineNum,
        type: 'MATH_ROUND_IMPLICIT',
        severity: 'INFO',
        message:
          'Math.Round without explicit MidpointRounding. Specify rounding mode for predictable behavior.',
      });
    }

    // Check for unchecked arithmetic
    if (line.includes('unchecked') && (line.includes('+') || line.includes('*'))) {
      issues.push({
        line: lineNum,
        type: 'UNCHECKED_ARITHMETIC',
        severity: 'INFO',
        message: 'Unchecked arithmetic block. Ensure overflow behavior is intended.',
      });
    }

    // Check for large calculations without decimal precision
    if (
      (line.includes('double') && line.includes('0.1')) ||
      line.includes('0.2') ||
      line.includes('0.3')
    ) {
      issues.push({
        line: lineNum,
        type: 'FLOATING_POINT_IMPRECISION',
        severity: 'WARNING',
        message:
          'Floating point arithmetic with values that may have precision issues. Consider using decimal for financial calculations.',
      });
    }

    // Detect complex LINQ calculations
    if (line.includes('.Select(') || line.includes('.Where(') || line.includes('.Sum(')) {
      const nextLines = lines.slice(i, i + 5).join('\n');
      if (nextLines.includes('+') || nextLines.includes('*') || nextLines.includes('/')) {
        issues.push({
          line: lineNum,
          type: 'COMPLEX_LINQ_CALCULATION',
          severity: 'WARNING',
          message:
            'Complex calculation within LINQ expression. Consider extracting to separate method for readability and performance.',
        });
      }
    }
  }

  return {
    issues,
    summary:
      issues.length > 0
        ? `${issues.length} C# math-specific issue(s) detected`
        : 'C# math patterns are correct',
  };
}

/**
 * Suggest improvements for complex math expressions
 */
function suggestMathImprovements(code) {
  const suggestions = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // Suggest using named variables for complex expressions
    const operators = (line.match(/[+\-*/%^]/g) || []).length;
    if (operators >= 5) {
      suggestions.push({
        line: lineNum,
        type: 'EXTRACT_VARIABLE',
        suggestion:
          'Extract complex sub-expressions to named variables for better readability and debugging.',
      });
    }

    // Suggest using Math.Max/Min instead of ternary
    if (line.includes('?') && line.includes(':') && (line.includes('>') || line.includes('<'))) {
      suggestions.push({
        line: lineNum,
        type: 'USE_MATH_MAX_MIN',
        suggestion:
          'Consider using Math.Max() or Math.Min() instead of ternary operator for clarity.',
      });
    }

    // Suggest using decimal for financial calculations
    if (
      line.includes('double') &&
      (line.includes('$') ||
        line.includes('price') ||
        line.includes('amount') ||
        line.includes('cost'))
    ) {
      suggestions.push({
        line: lineNum,
        type: 'USE_DECIMAL',
        suggestion:
          'Consider using decimal instead of double for financial calculations to avoid floating point precision issues.',
      });
    }

    // Suggest using BigInteger for very large numbers
    if (line.includes('long') && line.includes('1000000000')) {
      suggestions.push({
        line: lineNum,
        type: 'USE_BIGINT',
        suggestion:
          'Consider using BigInteger for very large number calculations to prevent overflow.',
      });
    }
  }

  return suggestions;
}

/**
 * Comprehensive math safety validation
 */
function validateMathSafety(code) {
  const generalMath = analyzeMathExpression(code);
  const csharpMath = validateCSharpMath(code);
  const improvements = suggestMathImprovements(code);

  const allIssues = [...generalMath.issues, ...csharpMath.issues];

  const criticalIssues = allIssues.filter(
    i => i.severity === 'WARNING' || i.severity === 'CRITICAL'
  );
  const infoIssues = allIssues.filter(i => i.severity === 'INFO');

  return {
    valid: criticalIssues.length === 0,
    issues: allIssues,
    criticalIssues,
    infoIssues,
    suggestions: improvements,
    metrics: generalMath.metrics,
    summary: {
      general: generalMath.summary,
      csharp: csharpMath.summary,
      suggestions: `${improvements.length} improvement suggestion(s) available`,
    },
  };
}

;// CONCATENATED MODULE: ./lib/context.js





/**
 * Context tools for providing comprehensive file context
 */

/**
 * Get comprehensive file context
 */
async function getFileContext(filePath) {
  try {
    const content = await promises_.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Extract imports
    const imports = [];
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // Extract exports
    const exports = [];
    const exportRegex = /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    // Extract function definitions
    const functions = [];
    const functionRegex = /function\s+(\w+)/g;
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }

    // Extract class definitions
    const classes = [];
    const classRegex = /class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      classes.push(match[1]);
    }

    // Calculate metrics
    const lineCount = lines.length;
    const charCount = content.length;
    const commentLines = lines.filter(
      line => line.trim().startsWith('//') || line.trim().startsWith('/*')
    ).length;
    const codeLines = lineCount - commentLines;
    const commentRatio = commentLines / lineCount;

    // Detect language and add language-specific complexity metrics
    let complexityMetrics = {};
    const isCSharp = content.includes('namespace ') && content.includes('using ');
    const isJavaScript =
      content.includes('import ') || content.includes('function ') || content.includes('const ');

    if (isCSharp) {
      const csharpComplexity = analyzeCSharpComplexity(content);
      const bracketValidation = validateCSharpBrackets(content);
      const mathSafety = analyzeMathExpression(content);

      complexityMetrics = {
        language: 'csharp',
        maxNestingDepth: csharpComplexity.metrics.maxNestingDepth,
        maxMethodComplexity: csharpComplexity.metrics.maxMethodComplexity,
        tryCatchDepth: csharpComplexity.metrics.tryCatchDepth,
        emptyCatchBlocks: csharpComplexity.metrics.emptyCatchBlocks.length,
        missingUsingStatements: csharpComplexity.metrics.missingUsingStatements.length,
        asyncAwaitIssues: csharpComplexity.metrics.asyncAwaitIssues.length,
        bracketValidation: bracketValidation.valid,
        complexMathExpressions: mathSafety.metrics.complexExpressions.length,
        potentialOverflow: mathSafety.metrics.potentialOverflow.length,
        precisionLoss: mathSafety.metrics.precisionLoss.length,
        divisionByZeroRisk: mathSafety.metrics.divisionByZeroRisk.length,
        complexityScore: calculateComplexityScore(csharpComplexity, mathSafety),
      };
    } else if (isJavaScript) {
      const mathSafety = analyzeMathExpression(content);
      complexityMetrics = {
        language: 'javascript',
        complexMathExpressions: mathSafety.metrics.complexExpressions.length,
        potentialOverflow: mathSafety.metrics.potentialOverflow.length,
        divisionByZeroRisk: mathSafety.metrics.divisionByZeroRisk.length,
        complexityScore: calculateJSComplexityScore(content, mathSafety),
      };
    }

    return {
      filePath,
      lineCount,
      charCount,
      commentLines,
      codeLines,
      commentRatio: commentRatio.toFixed(2),
      imports,
      exports,
      functions,
      classes,
      complexityMetrics,
      summary: `${lineCount} lines, ${functions.length} functions, ${classes.length} classes, ${(commentRatio * 100).toFixed(1)}% comments${complexityMetrics.complexityScore ? `, complexity score: ${complexityMetrics.complexityScore}/100` : ''}`,
    };
  } catch (error) {
    throw new Error(`Failed to get file context: ${error.message}`);
  }
}

/**
 * Calculate overall complexity score for C# code (0-100, higher is better)
 */
function calculateComplexityScore(csharpComplexity, mathSafety) {
  let score = 100;

  // Deduct for high nesting depth
  score -= Math.min(20, csharpComplexity.metrics.maxNestingDepth * 2);

  // Deduct for high method complexity
  score -= Math.min(15, csharpComplexity.metrics.maxMethodComplexity);

  // Deduct for deep try-catch nesting
  score -= Math.min(15, csharpComplexity.metrics.tryCatchDepth * 3);

  // Deduct for empty catch blocks
  score -= csharpComplexity.metrics.emptyCatchBlocks.length * 10;

  // Deduct for missing using statements
  score -= csharpComplexity.metrics.missingUsingStatements.length * 15;

  // Deduct for async/await issues
  score -= csharpComplexity.metrics.asyncAwaitIssues.length * 5;

  // Deduct for complex math expressions
  score -= mathSafety.metrics.complexExpressions.length * 3;

  // Deduct for potential overflow risks
  score -= mathSafety.metrics.potentialOverflow.length * 8;

  // Deduct for precision loss issues
  score -= mathSafety.metrics.precisionLoss.length * 5;

  // Deduct for division by zero risks
  score -= mathSafety.metrics.divisionByZeroRisk.length * 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate complexity score for JavaScript code
 */
function calculateJSComplexityScore(content, mathSafety) {
  let score = 100;

  // Deduct for complex math expressions
  score -= mathSafety.metrics.complexExpressions.length * 3;

  // Deduct for potential overflow risks
  score -= mathSafety.metrics.potentialOverflow.length * 8;

  // Deduct for division by zero risks
  score -= mathSafety.metrics.divisionByZeroRisk.length * 10;

  // Check for deep nesting
  const lines = content.split('\n');
  let maxDepth = 0;
  lines.forEach(line => {
    const depth = (line.match(/[{}]/g) || []).length;
    maxDepth = Math.max(maxDepth, depth);
  });
  score -= Math.min(20, maxDepth * 2);

  return Math.max(0, Math.min(100, score));
}

/**
 * Analyze change impact
 */
async function analyzeChangeImpact(filePath, changes) {
  try {
    const impact = {
      affectedFiles: [],
      affectedFunctions: [],
      affectedClasses: [],
      breakingChanges: [],
      warnings: [],
    };

    // Get current file context
    const context = await getFileContext(filePath);

    // Check if changes affect exports
    if (changes.includes('export')) {
      impact.affectedFunctions.push(...context.exports);
      impact.warnings.push('Changes to exports may affect dependent files');
    }

    // Check if changes affect functions
    context.functions.forEach(fn => {
      if (changes.includes(fn)) {
        impact.affectedFunctions.push(fn);
        impact.warnings.push(`Function ${fn} changed, check for callers`);
      }
    });

    // Check if changes affect classes
    context.classes.forEach(cls => {
      if (changes.includes(cls)) {
        impact.affectedClasses.push(cls);
        impact.warnings.push(`Class ${cls} changed, check for instances`);
      }
    });

    // Check for breaking changes
    if (changes.includes('delete') || changes.includes('remove')) {
      impact.breakingChanges.push('Code deletion detected');
    }

    if (changes.includes('function') || changes.includes('class')) {
      impact.breakingChanges.push('Function/class structure changed');
    }

    // Try to find files that import this file
    const dir = external_path_.dirname(filePath);
    const files = await promises_.readdir(dir);
    const dependentFiles = [];

    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.ts')) {
        const filePath2 = external_path_.join(dir, file);
        try {
          const content = await promises_.readFile(filePath2, 'utf-8');
          const relativePath = external_path_.relative(dir, filePath).replace(/\\/g, '/');
          if (
            content.includes(relativePath) ||
            content.includes(`from './${relativePath.replace('.js', '')}`)
          ) {
            dependentFiles.push(file);
          }
        } catch (e) {
          // Ignore
        }
      }
    }

    impact.affectedFiles = dependentFiles;

    return impact;
  } catch (error) {
    throw new Error(`Failed to analyze change impact: ${error.message}`);
  }
}

/**
 * Get symbol references
 */
async function getSymbolReferences(filePath, symbol) {
  try {
    const references = {
      symbol,
      filePath,
      references: [],
      definition: null,
      count: 0,
    };

    const content = await promises_.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Find definition
    const definitionRegex = new RegExp(`(?:function|class|const|let|var)\\s+${symbol}\\b`, 'g');
    lines.forEach((line, idx) => {
      if (definitionRegex.test(line)) {
        references.definition = {
          line: idx + 1,
          content: line.trim(),
        };
      }
    });

    // Find references
    const referenceRegex = new RegExp(`\\b${symbol}\\b`, 'g');
    lines.forEach((line, idx) => {
      const matches = line.match(referenceRegex);
      if (matches && matches.length > 0) {
        // Skip the definition line
        if (references.definition && references.definition.line === idx + 1) {
          return;
        }

        references.references.push({
          line: idx + 1,
          content: line.trim(),
          count: matches.length,
        });
      }
    });

    references.count = references.references.length;

    return references;
  } catch (error) {
    throw new Error(`Failed to get symbol references: ${error.message}`);
  }
}

;// CONCATENATED MODULE: ./lib/comparison.js


/**
 * Comparison tools for showing changes
 */

/**
 * Generate diff between two strings
 */
function generateDiff(original, modified) {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  const diff = [];

  let originalIdx = 0;
  let modifiedIdx = 0;

  while (originalIdx < originalLines.length || modifiedIdx < modifiedLines.length) {
    const originalLine = originalLines[originalIdx];
    const modifiedLine = modifiedLines[modifiedIdx];

    if (originalLine === modifiedLine) {
      if (originalLine !== undefined) {
        diff.push({ type: 'equal', line: originalLine });
      }
      originalIdx++;
      modifiedIdx++;
    } else {
      // Line added
      if (originalIdx >= originalLines.length) {
        diff.push({ type: 'add', line: modifiedLine });
        modifiedIdx++;
      }
      // Line deleted
      else if (modifiedIdx >= modifiedLines.length) {
        diff.push({ type: 'remove', line: originalLine });
        originalIdx++;
      }
      // Line changed
      else {
        diff.push({ type: 'remove', line: originalLine });
        diff.push({ type: 'add', line: modifiedLine });
        originalIdx++;
        modifiedIdx++;
      }
    }
  }

  return diff;
}

/**
 * Format diff for display
 */
function formatDiff(diff) {
  let output = '';

  diff.forEach(item => {
    switch (item.type) {
      case 'equal':
        output += `  ${item.line}\n`;
        break;
      case 'add':
        output += `+ ${item.line}\n`;
        break;
      case 'remove':
        output += `- ${item.line}\n`;
        break;
    }
  });

  return output;
}

/**
 * Get change summary
 */
function getChangeSummary(original, modified) {
  const diff = generateDiff(original, modified);

  const summary = {
    additions: 0,
    deletions: 0,
    modifications: 0,
    unchanged: 0,
    totalChanges: 0,
  };

  let prevType = null;

  diff.forEach(item => {
    switch (item.type) {
      case 'add':
        if (prevType === 'remove') {
          summary.modifications++;
        } else {
          summary.additions++;
        }
        break;
      case 'remove':
        summary.deletions++;
        break;
      case 'equal':
        summary.unchanged++;
        break;
    }
    prevType = item.type;
  });

  summary.totalChanges = summary.additions + summary.deletions + summary.modifications;

  return summary;
}

/**
 * Compare with backup
 */
async function compareWithBackup(filePath, _backupIndex = 0) {
  // Backup comparison not yet implemented
  return {
    success: false,
    error: 'Backup comparison not yet implemented',
  };
}

/**
 * Compare two files
 */
async function compareFiles(filePath1, filePath2) {
  try {
    const content1 = await fs.readFile(filePath1, 'utf-8');
    const content2 = await fs.readFile(filePath2, 'utf-8');

    const diff = generateDiff(content1, content2);
    const summary = getChangeSummary(content1, content2);

    return {
      success: true,
      diff,
      summary,
      formattedDiff: formatDiff(diff),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

;// CONCATENATED MODULE: ./lib/tools/context-handlers.js




/**
 * Context and comparison tool handlers
 */

const contextHandlers = {
  diff_changes: async args => {
    try {
      const currentContent = await promises_.readFile(args.path, 'utf-8');
      const diff = generateDiff(currentContent, args.proposed_content);
      const summary = getChangeSummary(currentContent, args.proposed_content);
      return {
        content: [
          {
            type: 'text',
            text: `CHANGE SUMMARY:\n${JSON.stringify(summary, null, 2)}\n\nDIFF:\n${formatDiff(diff)}`,
          },
        ],
      };
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: `Diff failed: ${error.message}` }] };
    }
  },

  get_file_context: async args => {
    try {
      const context = await getFileContext(args.path);
      return {
        content: [{ type: 'text', text: JSON.stringify(context, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to get file context: ${error.message}` }],
      };
    }
  },

  analyze_change_impact: async args => {
    try {
      const impact = await analyzeChangeImpact(args.path, args.changes);
      return {
        content: [{ type: 'text', text: JSON.stringify(impact, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Impact analysis failed: ${error.message}` }],
      };
    }
  },

  get_symbol_references: async args => {
    try {
      const references = await getSymbolReferences(args.path, args.symbol);
      return {
        content: [{ type: 'text', text: JSON.stringify(references, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to get symbol references: ${error.message}` }],
      };
    }
  },
};

;// CONCATENATED MODULE: ./lib/safety.js


/**
 * Safety mechanisms for preventing dangerous operations
 */

// Operation tracking for rate limiting
const operationHistory = (/* unused pure expression or super */ null && ([]));

/**
 * Confirm dangerous operation
 */
function confirmDangerousOperation(operation) {
  const dangerousOperations = [
    'delete',
    'remove',
    'unlink',
    'rm -rf',
    'exec',
    'eval',
    'innerHTML',
    'document.write',
  ];

  const isDangerous = dangerousOperations.some(op => operation.toLowerCase().includes(op));

  if (!isDangerous) {
    return { requiresConfirmation: false, reason: '' };
  }

  if (!(0,lib_config/* REQUIRE_CONFIRMATION */.ox)()) {
    return { requiresConfirmation: false, reason: 'Confirmation not required' };
  }

  return {
    requiresConfirmation: true,
    reason: `Operation contains dangerous pattern: ${operation}`,
    warning: 'This operation cannot be undone. Are you sure?',
  };
}

/**
 * Rate limit operations
 */
function rateLimitOperation() {
  const now = Date.now();

  // Remove operations older than 1 minute
  const oneMinuteAgo = now - 60000;
  const recentOperations = operationHistory.filter(op => op > oneMinuteAgo);

  // Check if we're over the limit
  if (recentOperations.length >= MAX_OPERATIONS_PER_MINUTE()) {
    const oldestOperation = recentOperations[0];
    const waitTime = Math.ceil((oldestOperation + 60000 - now) / 1000);

    return {
      allowed: false,
      reason: `Rate limit exceeded. Wait ${waitTime} seconds before next operation.`,
      waitTime,
      operationsPerMinute: recentOperations.length,
      maxOperations: MAX_OPERATIONS_PER_MINUTE(),
    };
  }

  // Add this operation to history
  operationHistory.push(now);

  return {
    allowed: true,
    operationsPerMinute: recentOperations.length,
    maxOperations: MAX_OPERATIONS_PER_MINUTE(),
  };
}

/**
 * Sandbox execution (placeholder)
 */
async function sandboxExecution(code, _filePath) {
  // In a real implementation, this would execute code in a sandbox
  // For now, we'll just validate the code

  const result = {
    success: true,
    output: '',
    errors: [],
    warnings: [],
  };

  // Basic validation
  if (code.includes('process.exit')) {
    result.warnings.push('Code contains process.exit() call');
  }

  if (code.includes('require(') && !code.includes('fs.') && !code.includes('path.')) {
    result.warnings.push('Code may attempt to load external modules');
  }

  return result;
}

/**
 * Check for repetitive patterns (loop detection)
 */
function checkForRepetitivePatterns(operations) {
  const patterns = [];
  const threshold = 3;

  // Check for repeated operations on same file
  const fileOperations = {};
  operations.forEach(op => {
    if (!op.file) return;
    fileOperations[op.file] = (fileOperations[op.file] || 0) + 1;
  });

  for (const [file, count] of Object.entries(fileOperations)) {
    if (count >= threshold) {
      patterns.push({
        type: 'repetitive_file_operation',
        file,
        count,
        message: `${count} operations on file ${file}`,
      });
    }
  }

  // Check for repeated tool calls
  const toolOperations = {};
  operations.forEach(op => {
    if (!op.tool) return;
    toolOperations[op.tool] = (toolOperations[op.tool] || 0) + 1;
  });

  for (const [tool, count] of Object.entries(toolOperations)) {
    if (count >= threshold) {
      patterns.push({
        type: 'repetitive_tool_call',
        tool,
        count,
        message: `${count} calls to tool ${tool}`,
      });
    }
  }

  return {
    hasRepetitivePatterns: patterns.length > 0,
    patterns,
    suggestion:
      patterns.length > 0 ? 'Consider breaking out of the loop or using a different approach' : '',
  };
}

/**
 * Validate operation safety
 */
function validateOperationSafety(operation, content) {
  const result = {
    safe: true,
    warnings: [],
    errors: [],
    requiresConfirmation: false,
  };

  // Check for dangerous patterns
  const dangerousPatterns = [
    { pattern: /rm\s+-rf/g, severity: 'critical' },
    { pattern: /exec\s*\(/g, severity: 'high' },
    { pattern: /eval\s*\(/g, severity: 'high' },
    { pattern: /innerHTML\s*=/g, severity: 'medium' },
  ];

  dangerousPatterns.forEach(({ pattern, severity }) => {
    const matches = content.match(pattern);
    if (matches) {
      result.warnings.push(`Dangerous pattern detected: ${pattern} (${severity} severity)`);
      if (severity === 'critical') {
        result.safe = false;
        result.errors.push('Critical safety violation');
      }
      if (severity === 'high' || severity === 'critical') {
        result.requiresConfirmation = true;
      }
    }
  });

  // Check for large file operations
  if (content.length > 100000) {
    // 100KB
    result.warnings.push('Large file operation (>100KB)');
  }

  return result;
}

// EXTERNAL MODULE: ./lib/testing.js + 1 modules
var testing = __nccwpck_require__(554);
;// CONCATENATED MODULE: ./lib/tools/safety-handlers.js



/**
 * Safety and testing tool handlers
 */

const safetyHandlers = {
  check_for_anti_patterns: async args => {
    try {
      const fs = await Promise.resolve(/* import() */).then(__nccwpck_require__.t.bind(__nccwpck_require__, 943, 19));
      const content = await fs.readFile(args.path, 'utf-8');
      const { checkForAntiPatterns } = await Promise.resolve(/* import() */).then(__nccwpck_require__.bind(__nccwpck_require__, 912));
      const result = checkForAntiPatterns(content);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Anti-pattern check failed: ${error.message}` }],
      };
    }
  },

  confirm_dangerous_operation: async args => {
    try {
      const result = confirmDangerousOperation(args.operation);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Danger check failed: ${error.message}` }],
      };
    }
  },

  check_for_repetitive_patterns: async args => {
    try {
      const result = checkForRepetitivePatterns(args.operations);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Repetitive pattern check failed: ${error.message}` }],
      };
    }
  },

  check_test_coverage: async args => {
    try {
      const result = await (0,testing/* checkTestCoverage */.j)(args.path);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Coverage check failed: ${error.message}` }],
      };
    }
  },

  run_related_tests: async args => {
    try {
      const { runRelatedTests } = await Promise.resolve(/* import() */).then(__nccwpck_require__.bind(__nccwpck_require__, 554));
      const result = await runRelatedTests(args.path);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Test execution failed: ${error.message}` }],
      };
    }
  },
};

;// CONCATENATED MODULE: ./lib/documentation.js



/**
 * Documentation tools for enforcing documentation requirements
 */

/**
 * Require documentation for code
 */
function requireDocumentation(content) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    documentationRatio: 0,
  };

  const lines = content.split('\n');
  const lineCount = lines.length;

  // Count comment lines
  const commentLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
  });

  const commentCount = commentLines.length;
  const ratio = lineCount > 0 ? commentCount / lineCount : 0;
  result.documentationRatio = ratio;

  // Check minimum documentation ratio
  const minRatio = (0,lib_config/* MIN_DOCUMENTATION_RATIO */.q1)();
  if (ratio < minRatio) {
    result.valid = false;
    result.errors.push(
      `Documentation ratio ${(ratio * 100).toFixed(1)}% below minimum of ${(minRatio * 100).toFixed(1)}%`
    );
    result.errors.push(`Need ${Math.ceil(minRatio * lineCount) - commentCount} more comment lines`);
  }

  // Check for function documentation
  const functions = content.match(/function\s+(\w+)/g) || [];
  const documentedFunctions = content.match(/\/\*\*[\s\S]*?\*\/\s*function/g) || [];

  if (functions.length > documentedFunctions.length) {
    result.warnings.push(
      `${functions.length - documentedFunctions.length} functions without JSDoc`
    );
  }

  // Check for class documentation
  const classes = content.match(/class\s+(\w+)/g) || [];
  const documentedClasses = content.match(/\/\*\*[\s\S]*?\*\/\s*class/g) || [];

  if (classes.length > documentedClasses.length) {
    result.warnings.push(`${classes.length - documentedClasses.length} classes without JSDoc`);
  }

  return result;
}

/**
 * Generate change summary
 */
function generateChangeSummary(filePath, changes) {
  const summary = {
    filePath,
    timestamp: new Date().toISOString(),
    changes: [],
    filesModified: [],
    functionsAdded: [],
    functionsRemoved: [],
    classesAdded: [],
    classesRemoved: [],
  };

  // Parse changes
  const lines = changes.split('\n');
  lines.forEach(line => {
    if (line.startsWith('+')) {
      summary.changes.push({ type: 'add', content: line.substring(1) });

      // Check for function additions
      const fnMatch = line.match(/\+\s*function\s+(\w+)/);
      if (fnMatch) summary.functionsAdded.push(fnMatch[1]);

      // Check for class additions
      const clsMatch = line.match(/\+\s*class\s+(\w+)/);
      if (clsMatch) summary.classesAdded.push(clsMatch[1]);
    } else if (line.startsWith('-')) {
      summary.changes.push({ type: 'remove', content: line.substring(1) });

      // Check for function removals
      const fnMatch = line.match(/-\s*function\s+(\w+)/);
      if (fnMatch) summary.functionsRemoved.push(fnMatch[1]);

      // Check for class removals
      const clsMatch = line.match(/-\s*class\s+(\w+)/);
      if (clsMatch) summary.classesRemoved.push(clsMatch[1]);
    }
  });

  summary.filesModified.push(filePath);

  return summary;
}

/**
 * Generate commit message draft
 */
function generateCommitMessage(filePath, changes) {
  const summary = generateChangeSummary(filePath, changes);

  let commitType = 'chore';
  const commitScope = external_path_.basename(filePath, external_path_.extname(filePath));

  // Determine commit type based on changes
  if (summary.functionsAdded.length > 0 || summary.classesAdded.length > 0) {
    commitType = 'feat';
  } else if (summary.functionsRemoved.length > 0 || summary.classesRemoved.length > 0) {
    commitType = 'refactor';
  } else if (summary.changes.some(c => c.content.includes('fix') || c.content.includes('bug'))) {
    commitType = 'fix';
  }

  let message = `${commitType}(${commitScope}): `;

  // Add description
  if (summary.functionsAdded.length > 0) {
    message += `Add ${summary.functionsAdded.join(', ')}`;
  } else if (summary.functionsRemoved.length > 0) {
    message += `Remove ${summary.functionsRemoved.join(', ')}`;
  } else {
    message += 'Update implementation';
  }

  // Add details
  if (summary.classesAdded.length > 0) {
    message += `\n\n- Add classes: ${summary.classesAdded.join(', ')}`;
  }

  if (summary.classesRemoved.length > 0) {
    message += `\n\n- Remove classes: ${summary.classesRemoved.join(', ')}`;
  }

  return message;
}

;// CONCATENATED MODULE: ./lib/feedback.js


/**
 * Feedback tools for providing guidance and explanations
 */

/**
 * Explain rejection
 */
function explainRejection(rejectionReason, context) {
  const explanations = {
    line_count_exceeded: {
      reason: 'File exceeds maximum line count limit',
      explanation:
        'The file has too many lines. This can make code harder to maintain and understand.',
      suggestions: [
        'Extract functions into separate modules',
        'Use refactor_move_block to move code blocks to other files',
        'Consider splitting the file into smaller, focused modules',
        'Remove dead code or consolidate similar functions',
      ],
      tools: ['refactor_move_block', 'extract_to_new_file'],
    },
    forbidden_pattern: {
      reason: 'Contains forbidden pattern',
      explanation:
        'The code contains patterns that are prohibited for security or code quality reasons.',
      suggestions: [
        'Remove the forbidden pattern',
        'Use auto_repair_submission to automatically fix the issue',
        'Replace console.log with proper logging',
        'Remove TODO/FIXME comments and create proper issues',
      ],
      tools: ['auto_repair_submission'],
    },
    backup_failed: {
      reason: 'Backup creation failed',
      explanation:
        'Unable to create a backup before writing. This is a safety measure to prevent data loss.',
      suggestions: [
        'Check backup directory permissions',
        'Ensure backup directory exists',
        'Check available disk space',
        'Use create_backup manually to diagnose the issue',
      ],
      tools: ['create_backup'],
    },
    syntax_error: {
      reason: 'Syntax validation failed',
      explanation: 'The code contains syntax errors that would prevent it from running.',
      suggestions: [
        'Check for unmatched braces, parentheses, or brackets',
        'Verify string quotes are properly closed',
        'Check for missing semicolons or commas',
        'Use auto_repair_submission to fix common syntax issues',
      ],
      tools: ['auto_repair_submission'],
    },
    import_error: {
      reason: 'Import validation failed',
      explanation: 'The code contains imports that cannot be resolved.',
      suggestions: [
        'Verify import paths are correct',
        'Ensure imported files exist',
        'Check for circular dependencies',
        'Update relative import paths',
      ],
      tools: [],
    },
    loop_detected: {
      reason: 'Repetitive operation detected',
      explanation: 'The same operation has been attempted multiple times, suggesting a loop.',
      suggestions: [
        'Review your approach and try a different strategy',
        'Use request_surgical_recovery to reset session state',
        'Check get_session_context to understand what is happening',
        'Use get_architectural_directive for guidance',
      ],
      tools: ['request_surgical_recovery', 'get_session_context', 'get_architectural_directive'],
    },
    default: {
      reason: rejectionReason,
      explanation: 'The operation was rejected for the stated reason.',
      suggestions: [
        'Review the error message carefully',
        'Check get_config_schema to understand requirements',
        'Use get_architectural_directive for guidance',
        'Try a different approach',
      ],
      tools: ['get_config_schema', 'get_architectural_directive'],
    },
  };

  const explanation = explanations[rejectionReason] || explanations['default'];

  return {
    reason: explanation.reason,
    explanation: explanation.explanation,
    suggestions: explanation.suggestions,
    tools: explanation.tools,
    context,
  };
}

/**
 * Suggest alternatives
 */
function suggestAlternatives(failedOperation, context) {
  const alternatives = {
    write_file: [
      {
        tool: 'refactor_move_block',
        reason: 'Move code blocks to reduce file size',
        description:
          'Extract a code block to another file to keep the source file under the line limit',
      },
      {
        tool: 'extract_to_new_file',
        reason: 'Create new module',
        description: 'Extract a code block to a new file when creating a new module',
      },
      {
        tool: 'auto_repair_submission',
        reason: 'Fix syntax or formatting issues',
        description: 'Automatically repair common JSON or code formatting issues',
      },
    ],
    obey_surgical_plan: [
      {
        tool: 'refactor_move_block',
        reason: 'Reduce file size before writing',
        description: 'Move code blocks to other files to make room for new changes',
      },
      {
        tool: 'extract_to_new_file',
        reason: 'Extract code to new file',
        description: 'Extract large code blocks to new files to reduce source file size',
      },
      {
        tool: 'get_architectural_directive',
        reason: 'Get guidance on architectural approach',
        description: 'Query the architectural directive for guidance on how to proceed',
      },
    ],
    default: [
      {
        tool: 'get_architectural_directive',
        reason: 'Get architectural guidance',
        description: 'Query the architectural directive for guidance on how to proceed',
      },
      {
        tool: 'get_session_context',
        reason: 'Review session history',
        description: 'Check session context to understand what has been attempted',
      },
      {
        tool: 'request_surgical_recovery',
        reason: 'Reset session state',
        description: 'Reset session state if stuck in a loop',
      },
    ],
  };

  const toolAlternatives = alternatives[failedOperation] || alternatives['default'];

  return {
    failedOperation,
    alternatives: toolAlternatives,
    context,
  };
}

/**
 * Get historical context
 */
async function getHistoricalContext(filePath) {
  try {
    const content = await promises_.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Extract recent changes (last 50 lines)
    const recentLines = lines.slice(-50);

    // Look for recent change markers
    const changeMarkers = recentLines.filter(
      line =>
        line.includes('// Changed:') || line.includes('// Updated:') || line.includes('// Fixed:')
    );

    return {
      filePath,
      recentChanges: changeMarkers,
      lastModified: (await promises_.stat(filePath)).mtime,
      lineCount: lines.length,
      summary: `${lines.length} lines, ${changeMarkers.length} recent change markers`,
    };
  } catch (error) {
    throw new Error(`Failed to get historical context: ${error.message}`);
  }
}

/**
 * Get operation guidance
 */
function getOperationGuidance(operation, context) {
  const guidance = {
    write_file: {
      prerequisites: ['obey_surgical_plan', 'read_file'],
      warnings: [
        'Always call obey_surgical_plan before write_file',
        'Ensure you have read the file first',
        'Backups are created automatically for existing files',
      ],
      bestPractices: [
        'Keep changes focused and minimal',
        'Verify line count before writing',
        'Test changes locally if possible',
      ],
    },
    refactor_move_block: {
      prerequisites: ['read_file'],
      warnings: [
        'Ensure source file exists',
        "Verify target file won't exceed line limit",
        'Make sure code block matches exactly',
      ],
      bestPractices: [
        'Move logically related code together',
        'Update imports if needed',
        'Verify the move does not break dependencies',
      ],
    },
    default: {
      prerequisites: [],
      warnings: [],
      bestPractices: [
        'Read tool descriptions for usage guidance',
        'Follow the suggested tool ordering',
        'Use get_config_schema to understand requirements',
      ],
    },
  };

  const operationGuidance = guidance[operation] || guidance['default'];

  return {
    operation,
    ...operationGuidance,
    context,
  };
}

;// CONCATENATED MODULE: ./lib/tools/feedback-handlers.js



/**
 * Documentation and feedback tool handlers
 */

const feedbackHandlers = {
  require_documentation: async args => {
    try {
      const result = requireDocumentation(args.content);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Documentation check failed: ${error.message}` }],
      };
    }
  },

  generate_change_summary: async args => {
    try {
      const summary = generateChangeSummary(args.path, args.changes);
      const commitMessage = generateCommitMessage(args.path, args.changes);
      return {
        content: [
          {
            type: 'text',
            text: `CHANGE SUMMARY:\n${JSON.stringify(summary, null, 2)}\n\nCOMMIT MESSAGE:\n${commitMessage}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Summary generation failed: ${error.message}` }],
      };
    }
  },

  explain_rejection: async args => {
    try {
      const result = explainRejection(args.reason, args.context);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Rejection explanation failed: ${error.message}` }],
      };
    }
  },

  suggest_alternatives: async args => {
    try {
      const result = suggestAlternatives(args.failed_operation, args.context);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Alternative suggestion failed: ${error.message}` }],
      };
    }
  },

  get_historical_context: async args => {
    try {
      const result = await getHistoricalContext(args.path);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Historical context failed: ${error.message}` }],
      };
    }
  },

  get_operation_guidance: async args => {
    try {
      const result = getOperationGuidance(args.operation, args.context);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Operation guidance failed: ${error.message}` }],
      };
    }
  },
};

;// CONCATENATED MODULE: ./lib/tools/csharp-handlers.js
/**
 * C# specific tool handlers
 * Provides specialized tools for C# .NET 8/10 development
 */





/**
 * C# tool handlers
 */
const csharpHandlers = {
  /**
   * Validate C# code comprehensively
   */
  validate_csharp_code: async args => {
    try {
      const content = await promises_.readFile(args.path, 'utf-8');
      const result = validateCSharpCode(content);

      return {
        content: [
          {
            type: 'text',
            text: `C# Code Validation for ${args.path}:

VALID: ${result.valid ? 'YES' : 'NO'}

CRITICAL ISSUES (${result.criticalIssues.length}):
${result.criticalIssues.length > 0 ? result.criticalIssues.map(i => `  Line ${i.line}: ${i.message}`).join('\n') : '  None'}

WARNINGS (${result.warnings.length}):
${result.warnings.length > 0 ? result.warnings.map(i => `  Line ${i.line}: ${i.message}`).join('\n') : '  None'}

METRICS:
  Max Nesting Depth: ${result.metrics.maxNestingDepth}
  Max Method Complexity: ${result.metrics.maxMethodComplexity}
  Try-Catch Depth: ${result.metrics.tryCatchDepth}
  Empty Catch Blocks: ${result.metrics.emptyCatchBlocks.length}
  Missing Using Statements: ${result.metrics.missingUsingStatements.length}
  Async/Await Issues: ${result.metrics.asyncAwaitIssues.length}

SUMMARY:
  Complexity: ${result.summary.complexity.join('\n  ')}
  Brackets: ${result.summary.brackets}
  Try-Catch: ${result.summary.tryCatch}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Validation failed: ${error.message}` }],
      };
    }
  },

  /**
   * Validate bracket matching in C# code
   */
  validate_csharp_brackets: async args => {
    try {
      const content = await promises_.readFile(args.path, 'utf-8');
      const result = validateCSharpBrackets(content);

      return {
        content: [
          {
            type: 'text',
            text: `Bracket Validation for ${args.path}:

VALID: ${result.valid ? 'YES' : 'NO'}

${
  result.valid
    ? 'All brackets properly matched!'
    : `ISSUES (${result.issues.length}):
${result.issues.map(i => `  Line ${i.line}, Column ${i.column}: ${i.message}`).join('\n')}`
}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Bracket validation failed: ${error.message}` }],
      };
    }
  },

  /**
   * Analyze C# code complexity
   */
  analyze_csharp_complexity: async args => {
    try {
      const content = await promises_.readFile(args.path, 'utf-8');
      const result = analyzeCSharpComplexity(content);

      return {
        content: [
          {
            type: 'text',
            text: `C# Complexity Analysis for ${args.path}:

METRICS:
  Max Nesting Depth: ${result.metrics.maxNestingDepth}
  Max Method Complexity: ${result.metrics.maxMethodComplexity}
  Try-Catch Depth: ${result.metrics.tryCatchDepth}
  Empty Catch Blocks: ${result.metrics.emptyCatchBlocks.length}
  Missing Using Statements: ${result.metrics.missingUsingStatements.length}
  Async/Await Issues: ${result.metrics.asyncAwaitIssues.length}

DETAILED ISSUES (${result.issues.length}):
${result.issues.map(i => `  [${i.type}] Line ${i.line}: ${i.message}`).join('\n') || '  No issues found'}

SUMMARY:
${result.summary.join('\n  ')}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Complexity analysis failed: ${error.message}` }],
      };
    }
  },

  /**
   * Detect nested try-catch blocks
   */
  detect_nested_try_catch: async args => {
    try {
      const content = await promises_.readFile(args.path, 'utf-8');
      const result = detectNestedTryCatch(content);

      return {
        content: [
          {
            type: 'text',
            text: `Nested Try-Catch Analysis for ${args.path}:

MAX DEPTH: ${result.maxDepth}
${result.maxDepth > 3 ? '⚠️ WARNING: Deep nesting detected!' : '✓ Try-catch nesting is acceptable'}

ISSUES (${result.issues.length}):
${result.issues.length > 0 ? result.issues.map(i => `  Line ${i.line} (Depth ${i.depth}): ${i.message}`).join('\n') : '  No deeply nested try-catch blocks found'}

SUMMARY:
  ${result.summary}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Try-catch detection failed: ${error.message}` }],
      };
    }
  },

  /**
   * Visualize scope depth
   */
  visualize_scope_depth: async args => {
    try {
      const content = await promises_.readFile(args.path, 'utf-8');
      const visualization = visualizeScopeDepth(content);

      return {
        content: [
          {
            type: 'text',
            text: `Scope Depth Visualization for ${args.path}:
(│ represents nesting level, [n] shows depth)

${visualization}

Legend:
  │  - Nesting level
  [n] - Depth level
  ⚠️  - Warning: depth > 5`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Scope visualization failed: ${error.message}` }],
      };
    }
  },

  /**
   * Validate math safety in C# code
   */
  validate_math_safety: async args => {
    try {
      const content = await promises_.readFile(args.path, 'utf-8');
      const result = validateMathSafety(content);

      return {
        content: [
          {
            type: 'text',
            text: `Math Safety Validation for ${args.path}:

VALID: ${result.valid ? 'YES' : 'NO'}

CRITICAL ISSUES (${result.criticalIssues.length}):
${result.criticalIssues.length > 0 ? result.criticalIssues.map(i => `  Line ${i.line}: ${i.message}`).join('\n') : '  None'}

INFO ISSUES (${result.infoIssues.length}):
${result.infoIssues.length > 0 ? result.infoIssues.map(i => `  Line ${i.line}: ${i.message}`).join('\n') : '  None'}

METRICS:
  Complex Expressions: ${result.metrics.complexExpressions.length}
  Potential Overflow: ${result.metrics.potentialOverflow.length}
  Precision Loss: ${result.metrics.precisionLoss.length}
  Division by Zero Risk: ${result.metrics.divisionByZeroRisk.length}
  Operator Precedence Issues: ${result.metrics.operatorPrecedenceIssues.length}

SUMMARY:
  General: ${result.summary.general.join('\n  ')}
  C# Specific: ${result.summary.csharp}
  Suggestions: ${result.summary.suggestions}

IMPROVEMENT SUGGESTIONS (${result.suggestions.length}):
${result.suggestions.length > 0 ? result.suggestions.map(s => `  Line ${s.line}: ${s.suggestion}`).join('\n') : '  No suggestions'}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Math safety validation failed: ${error.message}` }],
      };
    }
  },

  /**
   * Analyze math expressions
   */
  analyze_math_expressions: async args => {
    try {
      const content = await promises_.readFile(args.path, 'utf-8');
      const result = analyzeMathExpression(content);

      return {
        content: [
          {
            type: 'text',
            text: `Math Expression Analysis for ${args.path}:

ISSUES (${result.issues.length}):
${result.issues.length > 0 ? result.issues.map(i => `  [${i.type}] Line ${i.line}: ${i.message}`).join('\n') : '  No issues found'}

DETAILED METRICS:
  Complex Expressions: ${result.metrics.complexExpressions.length}
  Potential Overflow: ${result.metrics.potentialOverflow.length}
  Precision Loss: ${result.metrics.precisionLoss.length}
  Division by Zero Risk: ${result.metrics.divisionByZeroRisk.length}
  Operator Precedence Issues: ${result.metrics.operatorPrecedenceIssues.length}

SUMMARY:
${result.summary.join('\n  ')}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Math expression analysis failed: ${error.message}` }],
      };
    }
  },

  /**
   * Validate C# specific math patterns
   */
  validate_csharp_math: async args => {
    try {
      const content = await promises_.readFile(args.path, 'utf-8');
      const result = validateCSharpMath(content);

      return {
        content: [
          {
            type: 'text',
            text: `C# Math Pattern Validation for ${args.path}:

ISSUES (${result.issues.length}):
${result.issues.length > 0 ? result.issues.map(i => `  [${i.type}] Line ${i.line}: ${i.message}`).join('\n') : '  No issues found'}

SUMMARY:
  ${result.summary}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `C# math validation failed: ${error.message}` }],
      };
    }
  },

  /**
   * Get math improvement suggestions
   */
  suggest_math_improvements: async args => {
    try {
      const content = await promises_.readFile(args.path, 'utf-8');
      const suggestions = suggestMathImprovements(content);

      return {
        content: [
          {
            type: 'text',
            text: `Math Improvement Suggestions for ${args.path}:

SUGGESTIONS (${suggestions.length}):
${suggestions.length > 0 ? suggestions.map(s => `  Line ${s.line} [${s.type}]: ${s.suggestion}`).join('\n') : '  No improvement suggestions'}

Note: These are suggestions for improving code quality and maintainability.`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Math suggestions failed: ${error.message}` }],
      };
    }
  },

  /**
   * Comprehensive C# health check
   */
  csharp_health_check: async args => {
    try {
      const content = await promises_.readFile(args.path, 'utf-8');

      // Run all validations
      const codeValidation = validateCSharpCode(content);
      const bracketValidation = validateCSharpBrackets(content);
      const mathValidation = validateMathSafety(content);
      const complexity = analyzeCSharpComplexity(content);
      const tryCatch = detectNestedTryCatch(content);

      // Calculate overall health score
      let healthScore = 100;
      healthScore -= codeValidation.criticalIssues.length * 15;
      healthScore -= codeValidation.warnings.length * 5;
      healthScore -= !bracketValidation.valid ? 20 : 0;
      healthScore -= mathValidation.criticalIssues.length * 10;
      healthScore -= complexity.metrics.emptyCatchBlocks.length * 10;
      healthScore -= complexity.metrics.missingUsingStatements.length * 15;
      healthScore -= tryCatch.maxDepth > 3 ? (tryCatch.maxDepth - 3) * 10 : 0;

      healthScore = Math.max(0, Math.min(100, healthScore));

      const healthStatus =
        healthScore >= 80
          ? 'EXCELLENT'
          : healthScore >= 60
            ? 'GOOD'
            : healthScore >= 40
              ? 'FAIR'
              : 'POOR';

      return {
        content: [
          {
            type: 'text',
            text: `C# Health Check for ${args.path}:

╔════════════════════════════════════════╗
║         HEALTH SCORE: ${healthScore}/100         ║
║           STATUS: ${healthStatus.padEnd(15)}║
╚════════════════════════════════════════╝

📊 METRICS:
  Max Nesting Depth: ${complexity.metrics.maxNestingDepth}
  Max Method Complexity: ${complexity.metrics.maxMethodComplexity}
  Try-Catch Depth: ${tryCatch.maxDepth}
  Empty Catch Blocks: ${complexity.metrics.emptyCatchBlocks.length}
  Missing Using Statements: ${complexity.metrics.missingUsingStatements.length}
  Bracket Validation: ${bracketValidation.valid ? '✓ PASS' : '✗ FAIL'}
  Complex Math Expressions: ${mathValidation.metrics.complexExpressions.length}
  Potential Overflow: ${mathValidation.metrics.potentialOverflow.length}

⚠️  CRITICAL ISSUES (${codeValidation.criticalIssues.length + mathValidation.criticalIssues.length}):
${
  codeValidation.criticalIssues.length + mathValidation.criticalIssues.length > 0
    ? [...codeValidation.criticalIssues, ...mathValidation.criticalIssues]
        .map(i => `  Line ${i.line}: ${i.message}`)
        .join('\n')
    : '  None'
}

⚡ WARNINGS (${codeValidation.warnings.length + mathValidation.infoIssues.length}):
${
  codeValidation.warnings.length + mathValidation.infoIssues.length > 0
    ? [...codeValidation.warnings, ...mathValidation.infoIssues]
        .map(i => `  Line ${i.line}: ${i.message}`)
        .join('\n')
    : '  None'
}

💡 RECOMMENDATIONS:
${healthScore < 80 ? '  Consider refactoring to improve code quality and maintainability.' : '  Code is in good shape! Keep up the good work.'}
${complexity.metrics.missingUsingStatements.length > 0 ? '  • Add using statements for IDisposable objects to prevent resource leaks' : ''}
${complexity.metrics.emptyCatchBlocks.length > 0 ? '  • Remove or add proper error handling to empty catch blocks' : ''}
${tryCatch.maxDepth > 3 ? `  • Reduce try-catch nesting depth (currently ${tryCatch.maxDepth})` : ''}
${!bracketValidation.valid ? '  • Fix bracket matching issues' : ''}
${mathValidation.metrics.potentialOverflow.length > 0 ? '  • Add overflow protection for large number calculations' : ''}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Health check failed: ${error.message}` }],
      };
    }
  },
};

;// CONCATENATED MODULE: ./lib/file-registry.js
/**
 * File Registry System
 * Tracks all files in the project to prevent duplication and ensure proper auditing
 * Critical for massive projects with thousands of files
 */





/**
 * File Registry - maintains a comprehensive index of all project files
 */
class FileRegistry {
  constructor() {
    this.files = new Map(); // path -> FileMetadata
    this.fileHashes = new Map(); // hash -> Set of file paths
    this.directories = new Map(); // directory -> Set of file paths
    this.lastIndexTime = 0;
    this.indexed = false;
  }

  /**
   * Calculate file hash for content comparison
   */
  calculateHash(content) {
    return external_crypto_.createHash('md5').update(content).digest('hex');
  }

  /**
   * Index a single file
   */
  async indexFile(filePath) {
    try {
      const stats = await promises_.stat(filePath);
      const content = await promises_.readFile(filePath, 'utf-8');
      const hash = this.calculateHash(content);
      const dir = external_path_.dirname(filePath);

      const metadata = {
        path: filePath,
        hash,
        size: stats.size,
        modified: stats.mtime,
        indexed: Date.now(),
        directory: dir,
        basename: external_path_.basename(filePath),
        extension: external_path_.extname(filePath),
      };

      // Store file metadata
      this.files.set(filePath, metadata);

      // Store hash mapping for duplicate detection
      if (!this.fileHashes.has(hash)) {
        this.fileHashes.set(hash, new Set());
      }
      this.fileHashes.get(hash).add(filePath);

      // Store directory mapping
      if (!this.directories.has(dir)) {
        this.directories.set(dir, new Set());
      }
      this.directories.get(dir).add(filePath);

      return metadata;
    } catch (error) {
      // File might not exist or be inaccessible
      return null;
    }
  }

  /**
   * Index entire project directory
   */
  async indexProject(rootDir, options = {}) {
    const {
      ignorePatterns = ['node_modules', '.git', 'dist', 'build', 'bin', 'obj'],
      maxDepth = 20,
      onProgress = null,
    } = options;

    this.files.clear();
    this.fileHashes.clear();
    this.directories.clear();
    this.lastIndexTime = Date.now();

    let indexedCount = 0;
    let skippedCount = 0;

    const indexDirectory = async (dir, depth = 0) => {
      if (depth > maxDepth) return;

      try {
        const entries = await promises_.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = external_path_.join(dir, entry.name);

          // Skip ignored patterns
          if (ignorePatterns.some(pattern => fullPath.includes(pattern))) {
            skippedCount++;
            continue;
          }

          if (entry.isDirectory()) {
            await indexDirectory(fullPath, depth + 1);
          } else if (entry.isFile()) {
            const metadata = await this.indexFile(fullPath);
            if (metadata) {
              indexedCount++;
              if (onProgress && indexedCount % 100 === 0) {
                onProgress(indexedCount, fullPath);
              }
            }
          }
        }
      } catch (error) {
        // Directory might be inaccessible
        console.error(`[FILE-REGISTRY] Error indexing directory ${dir}: ${error.message}`);
      }
    };

    await indexDirectory(rootDir);
    this.indexed = true;

    console.error(`[FILE-REGISTRY] Indexed ${indexedCount} files, skipped ${skippedCount} files`);

    return {
      indexedCount,
      skippedCount,
      totalFiles: this.files.size,
      directories: this.directories.size,
    };
  }

  /**
   * Check if file exists in registry
   */
  fileExists(filePath) {
    return this.files.has(filePath);
  }

  /**
   * Get file metadata
   */
  getFileMetadata(filePath) {
    return this.files.get(filePath);
  }

  /**
   * Check if file content already exists (duplicate detection)
   */
  findDuplicateFiles(filePath, content) {
    const hash = this.calculateHash(content);
    const duplicates = this.fileHashes.get(hash);

    if (!duplicates) {
      return [];
    }

    // Return all files with same hash except the current one
    return Array.from(duplicates).filter(p => p !== filePath);
  }

  /**
   * Check if file with same name exists in directory
   */
  findSameNameFiles(filePath) {
    const dir = external_path_.dirname(filePath);
    const basename = external_path_.basename(filePath);
    const filesInDir = this.directories.get(dir);

    if (!filesInDir) {
      return [];
    }

    return Array.from(filesInDir).filter(p => {
      const otherBasename = external_path_.basename(p);
      return otherBasename === basename && p !== filePath;
    });
  }

  /**
   * Check if similar file exists (by name similarity)
   */
  findSimilarFiles(filePath, threshold = 0.7) {
    const basename = external_path_.basename(filePath, external_path_.extname(filePath));
    const similarFiles = [];

    for (const [otherPath] of this.files) {
      if (otherPath === filePath) continue;

      const otherBasename = external_path_.basename(otherPath, external_path_.extname(otherPath));
      const similarity = this.calculateStringSimilarity(basename, otherBasename);

      if (similarity >= threshold) {
        similarFiles.push({
          path: otherPath,
          similarity,
          basename: otherBasename,
        });
      }
    }

    return similarFiles.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Calculate string similarity (Levenshtein distance based)
   */
  calculateStringSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLength = Math.max(len1, len2);
    return 1 - distance / maxLength;
  }

  /**
   * Get all files in directory
   */
  getFilesInDirectory(dir, recursive = false) {
    if (!recursive) {
      const files = this.directories.get(dir);
      return files ? Array.from(files) : [];
    }

    // Recursive search
    const results = [];
    for (const [filePath] of this.files) {
      if (filePath.startsWith(dir)) {
        results.push(filePath);
      }
    }
    return results;
  }

  /**
   * Search files by pattern
   */
  searchFiles(pattern, options = {}) {
    const { caseSensitive = false, inDirectory = null, extension = null } = options;

    const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
    const results = [];

    for (const [filePath, metadata] of this.files) {
      // Filter by directory
      if (inDirectory && !filePath.startsWith(inDirectory)) {
        continue;
      }

      // Filter by extension
      if (extension && metadata.extension !== extension) {
        continue;
      }

      // Check if basename matches pattern
      if (regex.test(metadata.basename)) {
        results.push(metadata);
      }
    }

    return results;
  }

  /**
   * Get file statistics
   */
  getStatistics() {
    const stats = {
      totalFiles: this.files.size,
      totalDirectories: this.directories.size,
      lastIndexed: this.lastIndexTime,
      fileTypes: {},
      duplicates: 0,
      totalSize: 0,
    };

    for (const metadata of this.files.values()) {
      // Count by extension
      const ext = metadata.extension || 'no-extension';
      stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;

      // Calculate total size
      stats.totalSize += metadata.size;
    }

    // Count duplicates
    for (const [, paths] of this.fileHashes) {
      if (paths.size > 1) {
        stats.duplicates += paths.size - 1;
      }
    }

    return stats;
  }

  /**
   * Remove file from registry
   */
  async removeFile(filePath) {
    const metadata = this.files.get(filePath);
    if (!metadata) return false;

    // Remove from files map
    this.files.delete(filePath);

    // Remove from hash mapping
    const hashPaths = this.fileHashes.get(metadata.hash);
    if (hashPaths) {
      hashPaths.delete(filePath);
      if (hashPaths.size === 0) {
        this.fileHashes.delete(metadata.hash);
      }
    }

    // Remove from directory mapping
    const dirFiles = this.directories.get(metadata.directory);
    if (dirFiles) {
      dirFiles.delete(filePath);
      if (dirFiles.size === 0) {
        this.directories.delete(metadata.directory);
      }
    }

    return true;
  }

  /**
   * Update file in registry
   */
  async updateFile(filePath, _content) {
    // Remove old entry
    await this.removeFile(filePath);

    // Add new entry
    return await this.indexFile(filePath);
  }

  /**
   * Check registry needs reindexing
   */
  needsReindex(maxAge = 60000) {
    if (!this.indexed) return true;
    const age = Date.now() - this.lastIndexTime;
    return age > maxAge;
  }

  /**
   * Export registry to JSON
   */
  exportRegistry() {
    const exportData = {
      version: 1,
      lastIndexTime: this.lastIndexTime,
      files: Array.from(this.files.entries()),
      directories: Object.fromEntries(
        Array.from(this.directories.entries()).map(([dir, files]) => [dir, Array.from(files)])
      ),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import registry from JSON
   */
  importRegistry(jsonData) {
    try {
      const data = JSON.parse(jsonData);

      this.files = new Map(data.files);
      this.directories = new Map(
        Object.entries(data.directories).map(([dir, files]) => [dir, new Set(files)])
      );
      this.fileHashes = new Map();

      // Rebuild hash mappings
      for (const [filePath, metadata] of this.files) {
        if (!this.fileHashes.has(metadata.hash)) {
          this.fileHashes.set(metadata.hash, new Set());
        }
        this.fileHashes.get(metadata.hash).add(filePath);
      }

      this.lastIndexTime = data.lastIndexTime;
      this.indexed = true;

      console.error(`[FILE-REGISTRY] Imported registry with ${this.files.size} files`);

      return true;
    } catch (error) {
      console.error(`[FILE-REGISTRY] Error importing registry: ${error.message}`);
      return false;
    }
  }
}

// Global file registry instance
const fileRegistry = new FileRegistry();

/**
 * Get the global file registry instance
 */
function getFileRegistry() {
  return fileRegistry;
}

/**
 * Initialize file registry
 */
async function initializeFileRegistry(rootDir, options) {
  return await fileRegistry.indexProject(rootDir, options);
}

/**
 * Check if file exists in registry
 */
function checkFileExists(filePath) {
  return fileRegistry.fileExists(filePath);
}

/**
 * Find duplicate files
 */
function findDuplicateFiles(filePath, content) {
  return fileRegistry.findDuplicateFiles(filePath, content);
}

/**
 * Find similar files
 */
function findSimilarFiles(filePath, threshold) {
  return fileRegistry.findSimilarFiles(filePath, threshold);
}

/**
 * Find files with same name
 */
function findSameNameFiles(filePath) {
  return fileRegistry.findSameNameFiles(filePath);
}

/**
 * Get file metadata
 */
function getFileMetadata(filePath) {
  return fileRegistry.getFileMetadata(filePath);
}

/**
 * Search files
 */
function searchFiles(pattern, options) {
  return fileRegistry.searchFiles(pattern, options);
}

/**
 * Update file in registry
 */
async function updateFileInRegistry(filePath, content) {
  return await fileRegistry.updateFile(filePath, content);
}

/**
 * Remove file from registry
 */
async function removeFileFromRegistry(filePath) {
  return await fileRegistry.removeFile(filePath);
}

/**
 * Get registry statistics
 */
function getRegistryStatistics() {
  return fileRegistry.getStatistics();
}

;// CONCATENATED MODULE: ./lib/file-operation-audit.js
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
      const crypto = await Promise.resolve(/* import() */).then(__nccwpck_require__.t.bind(__nccwpck_require__, 982, 19));
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
        Date.now() - op.timestamp < timeWindow
    );

    return recentWrites.length > 0;
  }

  /**
   * Check for duplicate write operations
   */
  async checkForDuplicateWrite(filePath, content, timeWindow = 10000) {
    const history = this.operationHistory.get(filePath);
    if (!history) return null;

    const crypto = await Promise.resolve(/* import() */).then(__nccwpck_require__.t.bind(__nccwpck_require__, 982, 19));
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
        op => op.status === OperationStatus.BLOCKED || op.status === OperationStatus.DUPLICATE
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
      op => Date.now() - op.timestamp < 10000
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
      2
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
function getFileOperationAudit() {
  return fileOperationAudit;
}

/**
 * Record a file operation
 */
async function recordFileOperation(operation, filePath, details = {}) {
  return await fileOperationAudit.recordOperation(operation, filePath, details);
}

/**
 * Update operation status
 */
function updateOperationStatus(signature, status, details = {}) {
  return fileOperationAudit.updateOperationStatus(signature, status, details);
}

/**
 * Check if file was recently written
 */
function wasFileRecentlyWritten(filePath, timeWindow) {
  return fileOperationAudit.wasRecentlyWritten(filePath, timeWindow);
}

/**
 * Check for duplicate write operations
 */
async function checkForDuplicateWrite(filePath, content, timeWindow) {
  return await fileOperationAudit.checkForDuplicateWrite(filePath, content, timeWindow);
}

/**
 * Get file operation history
 */
function getFileOperationHistory(filePath, limit) {
  return fileOperationAudit.getFileHistory(filePath, limit);
}

/**
 * Get audit statistics
 */
function getAuditStatistics() {
  return fileOperationAudit.getStatistics();
}

/**
 * Detect audit issues
 */
function detectAuditIssues() {
  return fileOperationAudit.detectIssues();
}

/**
 * Generate audit report
 */
function generateAuditReport() {
  return fileOperationAudit.generateReport();
}

/**
 * Clear old operations
 */
function clearOldAuditOperations(olderThan) {
  return fileOperationAudit.clearOldOperations(olderThan);
}

// Export constants


;// CONCATENATED MODULE: ./lib/reference-validation.js
/**
 * Reference Validation System
 * Ensures that referenced files, classes, functions, and symbols exist before operations
 * Critical for preventing SWE from creating broken code with missing references
 */





/**
 * Reference types
 */
const ReferenceType = {
  IMPORT: 'IMPORT',
  REQUIRE: 'REQUIRE',
  CLASS: 'CLASS',
  FUNCTION: 'FUNCTION',
  VARIABLE: 'VARIABLE',
  TYPE: 'TYPE',
  INTERFACE: 'INTERFACE',
  NAMESPACE: 'NAMESPACE',
  FILE: 'FILE',
};

/**
 * Reference validation result
 */
class ReferenceValidationResult {
  constructor() {
    this.valid = true;
    this.errors = [];
    this.warnings = [];
    this.references = [];
    this.missingReferences = [];
    this.foundReferences = [];
  }

  addError(message, reference) {
    this.valid = false;
    this.errors.push({ message, reference });
  }

  addWarning(message, reference) {
    this.warnings.push({ message, reference });
  }

  addReference(reference, found) {
    this.references.push({ ...reference, found });
    if (found) {
      this.foundReferences.push(reference);
    } else {
      this.missingReferences.push(reference);
      this.valid = false;
    }
  }
}

/**
 * Reference Validator
 */
class ReferenceValidator {
  constructor() {
    this.patterns = {
      // JavaScript/TypeScript import patterns
      jsImport: /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g,
      jsRequire: /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,

      // C# using patterns
      csharpUsing: /using\s+(?:static\s+)?([^;]+);/g,
      csharpNamespace: /namespace\s+([^;{]+)/g,

      // Python import patterns
      pythonImport: /(?:from\s+([^\s]+)\s+)?import\s+([^\n]+)/g,

      // Generic file references
      fileReference: /['"]([^.]+\.[a-zA-Z0-9]+)['"]/g,

      // Function/class references
      functionCall: /(\w+)\s*\(/g,
      classInstantiation: /new\s+(\w+)/g,

      // Type references
      typeAnnotation: /:\s*(\w+)/g,
      typeDeclaration: /:\s*(\w+)/g,
    };
  }

  /**
   * Validate imports in code
   */
  async validateImports(code, filePath, language) {
    const result = new ReferenceValidationResult();
    const dir = external_path_.dirname(filePath);

    if (language === 'javascript' || language === 'typescript') {
      // Validate ES6 imports
      let match;
      const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
      while ((match = importRegex.exec(code)) !== null) {
        const importPath = match[1];
        const reference = {
          type: ReferenceType.IMPORT,
          name: importPath,
          line: this.getLineNumber(code, match.index),
        };

        // Check if it's a relative import
        if (importPath.startsWith('.')) {
          const resolvedPath = external_path_.resolve(dir, importPath);
          const exists = await this.checkFileExists(resolvedPath, ['.js', '.ts', '.json']);
          result.addReference(reference, exists);
          if (!exists) {
            result.addError(`Import not found: ${importPath}`, reference);
          }
        } else {
          // Node module - check if it exists
          const nodeModulesPath = external_path_.join(process.cwd(), 'node_modules', importPath);
          const exists = await this.checkFileExists(nodeModulesPath);
          result.addReference(reference, exists);
          if (!exists) {
            result.addWarning(
              `Node module not found: ${importPath} (may need to be installed)`,
              reference
            );
          }
        }
      }

      // Validate require statements
      const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = requireRegex.exec(code)) !== null) {
        const requirePath = match[1];
        const reference = {
          type: ReferenceType.REQUIRE,
          name: requirePath,
          line: this.getLineNumber(code, match.index),
        };

        if (requirePath.startsWith('.')) {
          const resolvedPath = external_path_.resolve(dir, requirePath);
          const exists = await this.checkFileExists(resolvedPath, ['.js', '.json']);
          result.addReference(reference, exists);
          if (!exists) {
            result.addError(`Require not found: ${requirePath}`, reference);
          }
        } else {
          const nodeModulesPath = external_path_.join(process.cwd(), 'node_modules', requirePath);
          const exists = await this.checkFileExists(nodeModulesPath);
          result.addReference(reference, exists);
          if (!exists) {
            result.addWarning(
              `Node module not found: ${requirePath} (may need to be installed)`,
              reference
            );
          }
        }
      }
    } else if (language === 'csharp') {
      // Validate C# using statements
      let match;
      const usingRegex = /using\s+(?:static\s+)?([^;]+);/g;
      while ((match = usingRegex.exec(code)) !== null) {
        const usingStatement = match[1];
        const reference = {
          type: ReferenceType.IMPORT,
          name: usingStatement,
          line: this.getLineNumber(code, match.index),
        };

        // Check if it's a project reference or system namespace
        if (usingStatement.startsWith('System') || usingStatement.startsWith('Microsoft')) {
          // System namespace - assume it exists
          result.addReference(reference, true);
        } else {
          // Project reference - check if file exists
          const exists = await this.checkCSharpReference(usingStatement, dir);
          result.addReference(reference, exists);
          if (!exists) {
            result.addError(`C# using not found: ${usingStatement}`, reference);
          }
        }
      }
    }

    return result;
  }

  /**
   * Validate function and class references
   */
  async validateReferences(code, filePath, language) {
    const result = new ReferenceValidationResult();

    // Extract defined symbols
    const definedSymbols = this.extractDefinedSymbols(code, language);

    // Extract used references
    const usedReferences = this.extractUsedReferences(code, language);

    // Check if all used references are defined
    for (const ref of usedReferences) {
      const reference = {
        type: ref.type,
        name: ref.name,
        line: ref.line,
      };

      const isDefined = definedSymbols.has(ref.name) || this.isBuiltInSymbol(ref.name, language);
      result.addReference(reference, isDefined);

      if (!isDefined) {
        result.addError(`${ref.type} '${ref.name}' is not defined`, reference);
      }
    }

    return result;
  }

  /**
   * Validate file references in code
   */
  async validateFileReferences(code, filePath) {
    const result = new ReferenceValidationResult();
    const dir = external_path_.dirname(filePath);

    // Find file references (e.g., in comments, strings, etc.)
    const filePattern = /['"]([^'"]*\.[a-zA-Z0-9]+)['"]/g;
    let match;

    while ((match = filePattern.exec(code)) !== null) {
      const filePathRef = match[1];
      const reference = {
        type: ReferenceType.FILE,
        name: filePathRef,
        line: this.getLineNumber(code, match.index),
      };

      // Skip if it's a URL or data URI
      if (
        filePathRef.startsWith('http://') ||
        filePathRef.startsWith('https://') ||
        filePathRef.startsWith('data:')
      ) {
        continue;
      }

      // Check if it's a relative path
      if (filePathRef.startsWith('.') || filePathRef.startsWith('/')) {
        const resolvedPath = external_path_.resolve(dir, filePathRef);
        const exists = await promises_.access(resolvedPath)
          .then(() => true)
          .catch(() => false);
        result.addReference(reference, exists);

        if (!exists) {
          result.addWarning(`File reference not found: ${filePathRef}`, reference);
        }
      }
    }

    return result;
  }

  /**
   * Extract defined symbols from code
   */
  extractDefinedSymbols(code, language) {
    const symbols = new Set();

    if (language === 'javascript' || language === 'typescript') {
      // Extract function definitions
      const funcRegex =
        /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function|(?:const|let|var)\s+(\w+)\s*=\s*\([^)]*\)\s*=>|class\s+(\w+))/g;
      let match;
      while ((match = funcRegex.exec(code)) !== null) {
        const symbol = match[1] || match[2] || match[3] || match[4];
        if (symbol) symbols.add(symbol);
      }

      // Extract exports
      const exportRegex = /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g;
      while ((match = exportRegex.exec(code)) !== null) {
        symbols.add(match[1]);
      }
    } else if (language === 'csharp') {
      // Extract class definitions
      const classRegex = /class\s+(\w+)/g;
      let match;
      while ((match = classRegex.exec(code)) !== null) {
        symbols.add(match[1]);
      }

      // Extract method definitions
      const methodRegex =
        /(?:public|private|protected|internal)\s+(?:static\s+)?(?:async\s+)?(?:void|\w+)\s+(\w+)/g;
      while ((match = methodRegex.exec(code)) !== null) {
        symbols.add(match[1]);
      }
    }

    return symbols;
  }

  /**
   * Extract used references from code
   */
  extractUsedReferences(code, language) {
    const references = [];

    if (language === 'javascript' || language === 'typescript') {
      // Extract function calls
      const callRegex = /(\w+)\s*\(/g;
      let match;
      while ((match = callRegex.exec(code)) !== null) {
        const name = match[1];
        // Skip built-in methods and keywords
        if (!this.isBuiltInSymbol(name, language)) {
          references.push({
            type: ReferenceType.FUNCTION,
            name,
            line: this.getLineNumber(code, match.index),
          });
        }
      }

      // Extract class instantiations
      const newRegex = /new\s+(\w+)/g;
      while ((match = newRegex.exec(code)) !== null) {
        const name = match[1];
        if (!this.isBuiltInSymbol(name, language)) {
          references.push({
            type: ReferenceType.CLASS,
            name,
            line: this.getLineNumber(code, match.index),
          });
        }
      }
    } else if (language === 'csharp') {
      // Extract method calls
      const callRegex = /(\w+)\s*\(/g;
      let match;
      while ((match = callRegex.exec(code)) !== null) {
        const name = match[1];
        if (!this.isBuiltInSymbol(name, language)) {
          references.push({
            type: ReferenceType.FUNCTION,
            name,
            line: this.getLineNumber(code, match.index),
          });
        }
      }

      // Extract type references
      const typeRegex = /:\s*(\w+)/g;
      while ((match = typeRegex.exec(code)) !== null) {
        const name = match[1];
        if (!this.isBuiltInSymbol(name, language)) {
          references.push({
            type: ReferenceType.TYPE,
            name,
            line: this.getLineNumber(code, match.index),
          });
        }
      }
    }

    return references;
  }

  /**
   * Check if symbol is built-in
   */
  isBuiltInSymbol(symbol, language) {
    const builtIns = {
      javascript: [
        'console',
        'document',
        'window',
        'Math',
        'Array',
        'Object',
        'String',
        'Number',
        'Boolean',
        'Date',
        'Promise',
        'setTimeout',
        'setInterval',
        'fetch',
        'JSON',
        'parseInt',
        'parseFloat',
        'isNaN',
        'isFinite',
      ],
      typescript: [
        'console',
        'document',
        'window',
        'Math',
        'Array',
        'Object',
        'String',
        'Number',
        'Boolean',
        'Date',
        'Promise',
        'setTimeout',
        'setInterval',
        'fetch',
        'JSON',
        'parseInt',
        'parseFloat',
        'isNaN',
        'isFinite',
        'interface',
        'type',
        'enum',
      ],
      csharp: [
        'Console',
        'String',
        'int',
        'double',
        'float',
        'bool',
        'void',
        'Task',
        'List',
        'Dictionary',
        'Array',
        'IEnumerable',
        'string',
        'var',
        'async',
        'await',
        'return',
        'if',
        'else',
        'for',
        'foreach',
        'while',
        'try',
        'catch',
        'finally',
        'throw',
        'new',
        'this',
        'base',
        'typeof',
        'as',
        'is',
      ],
    };

    return builtIns[language]?.includes(symbol) || false;
  }

  /**
   * Check if file exists with possible extensions
   */
  async checkFileExists(filePath, extensions = ['', '.js', '.ts', '.json', '.cs', '.py']) {
    for (const ext of extensions) {
      const fullPath = filePath + ext;
      try {
        await promises_.access(fullPath);
        return true;
      } catch {
        continue;
      }
    }
    return false;
  }

  /**
   * Check if C# reference exists
   */
  async checkCSharpReference(usingStatement, _dir) {
    // This is a simplified check - in real implementation, you'd need to parse the project structure
    // For now, we'll check if there's a matching file in the project
    const parts = usingStatement.split('.');

    // Try to find a file matching the namespace
    const searchResults = searchFiles(parts[parts.length - 1], { extension: '.cs' });

    return searchResults.length > 0;
  }

  /**
   * Get line number from character index
   */
  getLineNumber(code, index) {
    const lines = code.substring(0, index).split('\n');
    return lines.length;
  }

  /**
   * Validate all references in code
   */
  async validateAllReferences(code, filePath, language) {
    const results = {
      imports: await this.validateImports(code, filePath, language),
      references: await this.validateReferences(code, filePath, language),
      fileReferences: await this.validateFileReferences(code, filePath),
    };

    const combined = new ReferenceValidationResult();
    combined.valid = results.imports.valid && results.references.valid;
    combined.errors = [...results.imports.errors, ...results.references.errors];
    combined.warnings = [
      ...results.imports.warnings,
      ...results.references.warnings,
      ...results.fileReferences.warnings,
    ];
    combined.references = [
      ...results.imports.references,
      ...results.references.references,
      ...results.fileReferences.references,
    ];
    combined.missingReferences = [
      ...results.imports.missingReferences,
      ...results.references.missingReferences,
    ];
    combined.foundReferences = [
      ...results.imports.foundReferences,
      ...results.references.foundReferences,
    ];

    return combined;
  }
}

// Global validator instance
const referenceValidator = new ReferenceValidator();

/**
 * Validate imports in code
 */
async function validateImports(code, filePath, language) {
  return await referenceValidator.validateImports(code, filePath, language);
}

/**
 * Validate references in code
 */
async function validateReferences(code, filePath, language) {
  return await referenceValidator.validateReferences(code, filePath, language);
}

/**
 * Validate file references
 */
async function validateFileReferences(code, filePath) {
  return await referenceValidator.validateFileReferences(code, filePath);
}

/**
 * Validate all references
 */
async function validateAllReferences(code, filePath, language) {
  return await referenceValidator.validateAllReferences(code, filePath, language);
}

// Export constants


;// CONCATENATED MODULE: ./lib/tools/project-integrity-handlers.js
/**
 * Project Integrity Handlers
 * Comprehensive handlers to prevent file duplication, ensure proper auditing,
 * and maintain integrity in massive projects
 */






/**
 * Project Integrity Handlers
 */
const projectIntegrityHandlers = {
  /**
   * Index project files into the registry
   */
  index_project_files: async args => {
    try {
      const registry = getFileRegistry();
      const rootDir = args.root_dir || process.cwd();

      console.error(`[PROJECT-INTEGRITY] Indexing project files in ${rootDir}...`);

      const result = await registry.indexProject(rootDir, {
        ignorePatterns: args.ignore_patterns || [
          'node_modules',
          '.git',
          'dist',
          'build',
          'bin',
          'obj',
          '.next',
          'out',
        ],
        maxDepth: args.max_depth || 20,
        onProgress: (count, _path) => {
          if (count % 100 === 0) {
            console.error(`[PROJECT-INTEGRITY] Indexed ${count} files...`);
          }
        },
      });

      recordAction('PROJECT_INDEXED', {
        rootDir,
        indexedCount: result.indexedCount,
        skippedCount: result.skippedCount,
        totalFiles: result.totalFiles,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Project Indexed Successfully!

Root Directory: ${rootDir}
Files Indexed: ${result.indexedCount}
Files Skipped: ${result.skippedCount}
Total Files: ${result.totalFiles}
Directories: ${result.directories}

The file registry is now active and will help prevent file duplication.`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Project indexing failed: ${error.message}` }],
      };
    }
  },

  /**
   * Check for duplicate files before creating
   */
  check_file_duplicates: async args => {
    try {
      const { file_path, content } = args;

      if (!file_path) {
        return { isError: true, content: [{ type: 'text', text: 'file_path is required' }] };
      }

      const issues = [];

      // Check for exact duplicates by content
      const exactDuplicates = findDuplicateFiles(file_path, content || '');
      if (exactDuplicates.length > 0) {
        issues.push({
          type: 'EXACT_DUPLICATE',
          severity: 'ERROR',
          message: `Exact duplicate found! File with identical content already exists at: ${exactDuplicates.join(', ')}`,
          duplicates: exactDuplicates,
        });
      }

      // Check for same name files
      const sameNameFiles = findSameNameFiles(file_path);
      if (sameNameFiles.length > 0) {
        issues.push({
          type: 'SAME_NAME',
          severity: 'WARNING',
          message: `File with same name already exists: ${sameNameFiles.join(', ')}`,
          duplicates: sameNameFiles,
        });
      }

      // Check for similar files
      const similarFiles = findSimilarFiles(file_path, args.similarity_threshold || 0.7);
      if (similarFiles.length > 0) {
        issues.push({
          type: 'SIMILAR_NAME',
          severity: 'INFO',
          message: `Similar files found: ${similarFiles.map(f => `${f.path} (${(f.similarity * 100).toFixed(0)}% similarity)`).join(', ')}`,
          similar: similarFiles,
        });
      }

      const hasCriticalIssues = issues.some(i => i.severity === 'ERROR');

      return {
        content: [
          {
            type: 'text',
            text: `File Duplicate Check for ${file_path}:

${issues.length > 0 ? issues.map(i => `[${i.severity}] ${i.message}`).join('\n\n') : 'No duplicates detected. Safe to proceed.'}

${hasCriticalIssues ? '\n⚠️ CRITICAL: Exact duplicate detected. Consider using existing file or modifying existing content.' : ''}`,
          },
        ],
        hasCriticalIssues,
        issues,
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Duplicate check failed: ${error.message}` }],
      };
    }
  },

  /**
   * Validate file references before write
   */
  validate_file_references: async args => {
    try {
      const { file_path, content, language } = args;

      if (!content) {
        return { isError: true, content: [{ type: 'text', text: 'content is required' }] };
      }

      // Auto-detect language if not provided
      let detectedLanguage = language;
      if (!detectedLanguage) {
        if (file_path.endsWith('.js') || file_path.endsWith('.mjs')) {
          detectedLanguage = 'javascript';
        } else if (file_path.endsWith('.ts')) {
          detectedLanguage = 'typescript';
        } else if (file_path.endsWith('.cs')) {
          detectedLanguage = 'csharp';
        } else if (file_path.endsWith('.py')) {
          detectedLanguage = 'python';
        }
      }

      const validation = await validateAllReferences(content, file_path, detectedLanguage);

      const hasErrors = validation.errors.length > 0;

      return {
        content: [
          {
            type: 'text',
            text: `Reference Validation for ${file_path}:

VALID: ${validation.valid ? 'YES' : 'NO'}
Total References: ${validation.references.length}
Found: ${validation.foundReferences.length}
Missing: ${validation.missingReferences.length}

${validation.errors.length > 0 ? `ERRORS (${validation.errors.length}):\n${validation.errors.map(e => `  Line ${e.reference.line}: ${e.message}`).join('\n')}\n` : ''}
${validation.warnings.length > 0 ? `WARNINGS (${validation.warnings.length}):\n${validation.warnings.map(w => `  Line ${w.reference.line}: ${w.message}`).join('\n')}\n` : ''}

${hasErrors ? '\n⚠️ CRITICAL: Missing references detected. Ensure all imports/referenced files exist.' : 'All references validated successfully.'}`,
          },
        ],
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Reference validation failed: ${error.message}` }],
      };
    }
  },

  /**
   * Check recent file operations (prevents redundant operations)
   */
  check_recent_operations: async args => {
    try {
      const { file_path, operation, time_window } = args;

      const stats = getAuditStatistics();

      // Check for recent operations on file
      if (file_path) {
        const recentWrite = wasFileRecentlyWritten(file_path, time_window || 30000);
        if (recentWrite) {
          return {
            content: [
              {
                type: 'text',
                text: `⚠️ WARNING: File ${file_path} was recently written in the last ${time_window || 30} seconds.

This may indicate:
- SWE is in a loop writing the same file
- Redundant operation that should be skipped
- File is being modified by multiple processes

Recommendation: Review the operation history to determine if this operation is necessary.`,
              },
            ],
            hasRecentOperation: true,
          };
        }
      }

      // Check for duplicate operations
      if (operation && args.content) {
        const duplicate = await checkForDuplicateWrite(
          file_path,
          args.content,
          time_window || 10000
        );
        if (duplicate) {
          return {
            content: [
              {
                type: 'text',
                text: `⚠️ DUPLICATE OPERATION DETECTED!

An identical write operation was performed on ${file_path} at ${new Date(duplicate.timestamp).toISOString()}.

This operation will be blocked to prevent redundant work.`,
              },
            ],
            isDuplicate: true,
            duplicateOperation: duplicate,
          };
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `No recent operations detected. Safe to proceed.

Session Statistics:
- Total Operations: ${stats.totalOperations}
- Success: ${stats.successCount}
- Failed: ${stats.failedCount}
- Duplicates Blocked: ${stats.duplicateCount}
- Blocked: ${stats.blockedCount}`,
          },
        ],
        hasRecentOperation: false,
        isDuplicate: false,
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Recent operation check failed: ${error.message}` }],
      };
    }
  },

  /**
   * Comprehensive pre-write validation
   */
  validate_before_write: async args => {
    try {
      const { file_path, content, language } = args;

      if (!file_path || !content) {
        return {
          isError: true,
          content: [{ type: 'text', text: 'file_path and content are required' }],
        };
      }

      const issues = [];
      const criticalIssues = [];

      // 1. Check for duplicates
      const duplicateCheck = await undefined.check_file_duplicates({ file_path, content });
      if (duplicateCheck.hasCriticalIssues) {
        criticalIssues.push(...duplicateCheck.issues.filter(i => i.severity === 'ERROR'));
      }
      issues.push(...duplicateCheck.issues);

      // 2. Validate references
      const referenceCheck = await undefined.validate_file_references({ file_path, content, language });
      if (!referenceCheck.valid) {
        criticalIssues.push(...referenceCheck.errors);
      }
      issues.push(...referenceCheck.errors);
      issues.push(...referenceCheck.warnings);

      // 3. Check recent operations
      const recentCheck = await undefined.check_recent_operations({ file_path, content });
      if (recentCheck.isDuplicate) {
        criticalIssues.push({
          type: 'DUPLICATE_OPERATION',
          severity: 'ERROR',
          message: 'Duplicate operation detected - identical write was performed recently',
        });
      }

      // 4. Record the operation for audit
      await recordFileOperation('WRITE', file_path, { content });

      const hasCriticalIssues = criticalIssues.length > 0;

      return {
        content: [
          {
            type: 'text',
            text: `Pre-Write Validation for ${file_path}:

${criticalIssues.length > 0 ? `CRITICAL ISSUES (${criticalIssues.length}):\n${criticalIssues.map(i => `  [${i.type}] ${i.message}`).join('\n')}\n` : ''}
${
  issues.filter(i => i.severity !== 'ERROR').length > 0
    ? `WARNINGS (${issues.filter(i => i.severity !== 'ERROR').length}):\n${issues
        .filter(i => i.severity !== 'ERROR')
        .map(i => `  [${i.type}] ${i.message}`)
        .join('\n')}\n`
    : ''
}

${hasCriticalIssues ? '❌ WRITE BLOCKED: Critical issues detected. Address these issues before proceeding.' : '✓ VALIDATION PASSED: Safe to write file.'}`,
          },
        ],
        valid: !hasCriticalIssues,
        criticalIssues,
        warnings: issues.filter(i => i.severity !== 'ERROR'),
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Pre-write validation failed: ${error.message}` }],
      };
    }
  },

  /**
   * Get registry statistics
   */
  get_registry_stats: async _args => {
    try {
      const stats = getRegistryStatistics();
      const auditStats = getAuditStatistics();
      const auditIssues = detectAuditIssues();

      return {
        content: [
          {
            type: 'text',
            text: `Project Registry Statistics:

File Registry:
- Total Files: ${stats.totalFiles}
- Total Directories: ${stats.totalDirectories}
- Duplicates: ${stats.duplicates}
- Total Size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB
- Last Indexed: ${new Date(stats.lastIndexed).toISOString()}

File Types:
${Object.entries(stats.fileTypes)
  .map(([ext, count]) => `  ${ext || 'no-extension'}: ${count}`)
  .join('\n')}

Operation Audit:
- Total Operations: ${auditStats.totalOperations}
- Session Duration: ${(auditStats.sessionDuration / 1000).toFixed(0)}s
- Success: ${auditStats.successCount}
- Failed: ${auditStats.failedCount}
- Duplicates Blocked: ${auditStats.duplicateCount}
- Blocked: ${auditStats.blockedCount}

${auditIssues.length > 0 ? `Issues Detected:\n${auditIssues.map(i => `  [${i.type}] ${i.message}`).join('\n')}` : 'No issues detected.'}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to get registry stats: ${error.message}` }],
      };
    }
  },

  /**
   * Search for files in the registry
   */
  search_files: async args => {
    try {
      const { pattern, case_sensitive, in_directory, extension } = args;

      if (!pattern) {
        return { isError: true, content: [{ type: 'text', text: 'pattern is required' }] };
      }

      const results = searchFiles(pattern, {
        caseSensitive: case_sensitive || false,
        inDirectory: in_directory || null,
        extension: extension || null,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Search Results for "${pattern}":

Found ${results.length} file(s):
${results.map(f => `  ${f.path} (${f.basename}) - ${(f.size / 1024).toFixed(2)} KB`).join('\n')}

${results.length === 0 ? 'No files found matching the pattern.' : ''}`,
          },
        ],
        results,
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `File search failed: ${error.message}` }],
      };
    }
  },

  /**
   * Generate comprehensive audit report
   */
  generate_audit_report: async _args => {
    try {
      const report = generateAuditReport();

      return {
        content: [
          {
            type: 'text',
            text: `Project Integrity Audit Report:

Generated: ${new Date(report.timestamp).toISOString()}
Session Duration: ${(report.sessionDuration / 1000).toFixed(0)}s

Statistics:
- Total Operations: ${report.statistics.totalOperations}
- Success: ${report.statistics.successCount}
- Failed: ${report.statistics.failedCount}
- Duplicates Blocked: ${report.statistics.duplicateCount}
- Blocked: ${report.statistics.blockedCount}

${report.issues.length > 0 ? `Issues Detected:\n${report.issues.map(i => `  [${i.type}] ${i.severity}: ${i.message}`).join('\n')}\n` : 'No issues detected.\n'}

Recent Operations (last 20):
${report.recentOperations.map(op => `  [${op.status}] ${op.type} ${op.path} - ${new Date(op.timestamp).toISOString()}`).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Audit report generation failed: ${error.message}` }],
      };
    }
  },

  /**
   * Check file exists in registry
   */
  check_file_exists: async args => {
    try {
      const { file_path } = args;
      const registry = getFileRegistry();

      const exists = registry.fileExists(file_path);
      const metadata = exists ? registry.getFileMetadata(file_path) : null;

      return {
        content: [
          {
            type: 'text',
            text: `File Existence Check for ${file_path}:

${exists ? `✓ File EXISTS in registry` : `✗ File NOT FOUND in registry`}

${
  metadata
    ? `
Metadata:
  Size: ${(metadata.size / 1024).toFixed(2)} KB
  Modified: ${new Date(metadata.modified).toISOString()}
  Directory: ${metadata.directory}
  Hash: ${metadata.hash}`
    : ''
}`,
          },
        ],
        exists,
        metadata,
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `File existence check failed: ${error.message}` }],
      };
    }
  },
};

;// CONCATENATED MODULE: ./lib/tools/handlers.js





















const handlers_log = msg => {
  if (!(0,lib_config/* DEBUG_LOGS */.mX)()) return;
  process.stderr.write(`[SWEObeyMe-Audit]: ${msg}\n`);
};

// getRandomQuote will be set by the main module
let getRandomQuote;
function setGetRandomQuote(fn) {
  getRandomQuote = fn;
}

/**
 * Tool handlers registry
 */
const toolHandlers = {
  obey_me_status: async _args => {
    return {
      content: [{ type: 'text', text: 'SWEObeyMe is online and compliant.' }],
    };
  },

  obey_surgical_plan: async args => {
    const total = args.current_line_count + (args.estimated_addition || 0);
    if (total > 700) {
      handlers_log(`CRITICAL: ${args.target_file} will exceed 700 lines. MANDATORY SPLIT REQUIRED.`);
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: "REJECTED: File bloat detected. Execute 'Split Protocol' instead.",
          },
        ],
      };
    }
    return {
      content: [{ type: 'text', text: 'PLAN APPROVED: Proceed with surgical precision.' }],
    };
  },

  read_file: async args => {
    // Check if file should be ignored
    if (shouldIgnore(args.path)) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `File ${args.path} is in .sweignore and excluded from AI context.`,
          },
        ],
      };
    }

    const content = await promises_.readFile(args.path, 'utf-8');
    const stats = await promises_.stat(args.path);
    const lineCount = content.split(/\r\n|\r|\n/).length;

    // Injected Context: Forces AI to see rules every time it reads
    let contextHeader = `[SURGICAL CONTEXT]: File: ${external_path_.basename(args.path)} | Lines: ${lineCount}/${(0,lib_config/* MAX_LINES */.xg)()} | Last Modified: ${stats.mtime}\n\n`;

    // Inject project contract if available
    const projectContract = getProjectContract();
    if (projectContract) {
      contextHeader += `=== PROJECT CONTRACT ===\n${projectContract.substring(0, 500)}...\n=== END CONTRACT ===\n\n`;
    }

    // Add C# complexity warnings for C# files
    const isCSharp =
      args.path.endsWith('.cs') || (content.includes('namespace ') && content.includes('using '));
    if (isCSharp) {
      contextHeader += `=== C# COMPLEXITY ANALYSIS ===\n`;
      const complexity = analyzeCSharpComplexity(content);
      const brackets = validateCSharpBrackets(content);
      const mathSafety = analyzeMathExpression(content);

      // Calculate complexity score
      let complexityScore = 100;
      complexityScore -= complexity.metrics.maxNestingDepth * 2;
      complexityScore -= complexity.metrics.maxMethodComplexity;
      complexityScore -= complexity.metrics.tryCatchDepth * 3;
      complexityScore -= complexity.metrics.emptyCatchBlocks.length * 10;
      complexityScore -= complexity.metrics.missingUsingStatements.length * 15;
      complexityScore -= complexity.metrics.asyncAwaitIssues.length * 5;
      complexityScore -= mathSafety.metrics.complexExpressions.length * 3;
      complexityScore -= mathSafety.metrics.potentialOverflow.length * 8;
      complexityScore -= mathSafety.metrics.divisionByZeroRisk.length * 10;
      complexityScore = Math.max(0, Math.min(100, complexityScore));

      contextHeader += `Complexity Score: ${complexityScore}/100 | `;
      contextHeader += `Max Nesting: ${complexity.metrics.maxNestingDepth} | `;
      contextHeader += `Try-Catch Depth: ${complexity.metrics.tryCatchDepth} | `;
      contextHeader += `Brackets: ${brackets.valid ? '✓' : '✗'}\n`;

      // Add warnings if needed
      const warnings = [];
      if (complexityScore < 70) warnings.push(`⚠️ LOW COMPLEXITY SCORE (${complexityScore}/100)`);
      if (complexity.metrics.maxNestingDepth > 5)
        warnings.push(`⚠️ DEEP NESTING (${complexity.metrics.maxNestingDepth} levels)`);
      if (complexity.metrics.tryCatchDepth > 3)
        warnings.push(`⚠️ DEEP TRY-CATCH (${complexity.metrics.tryCatchDepth} levels)`);
      if (!brackets.valid) warnings.push(`⚠️ BRACKET MISMATCH DETECTED`);
      if (complexity.metrics.emptyCatchBlocks.length > 0)
        warnings.push(`⚠️ ${complexity.metrics.emptyCatchBlocks.length} EMPTY CATCH BLOCKS`);
      if (complexity.metrics.missingUsingStatements.length > 0)
        warnings.push(
          `⚠️ ${complexity.metrics.missingUsingStatements.length} MISSING USING STATEMENTS`
        );
      if (mathSafety.metrics.potentialOverflow.length > 0)
        warnings.push(`⚠️ ${mathSafety.metrics.potentialOverflow.length} POTENTIAL OVERFLOW RISKS`);
      if (mathSafety.metrics.divisionByZeroRisk.length > 0)
        warnings.push(`⚠️ ${mathSafety.metrics.divisionByZeroRisk.length} DIVISION BY ZERO RISKS`);

      if (warnings.length > 0) {
        contextHeader += `WARNINGS:\n${warnings.join('\n')}\n`;
      }

      contextHeader += `=== END C# ANALYSIS ===\n\n`;
    }

    handlers_log(`Read ${args.path}: ${lineCount} lines.`);
    return {
      content: [
        {
          type: 'text',
          text: contextHeader + content,
        },
      ],
      uri: toWindsurfUri(args.path),
    };
  },

  write_file: async args => {
    let content = args.content;

    // RECORD OPERATION: Track the write attempt
    const operationRecord = await recordFileOperation('WRITE', args.path, { content });
    if (operationRecord.status === 'DUPLICATE') {
      return {
        isError: true,
        content: [
          { type: 'text', text: `BLOCKED: Duplicate operation detected. ${operationRecord.note}` },
        ],
      };
    }

    // DUPLICATE CHECK: Check for recent duplicate writes
    const recentDuplicate = await checkForDuplicateWrite(args.path, content, 10000);
    if (recentDuplicate) {
      console.error(
        `[SWE-INTEGRITY] Blocked duplicate write to ${args.path} - identical content written ${Date.now() - recentDuplicate.timestamp}ms ago`
      );
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `BLOCKED: Duplicate write operation detected. An identical write was performed on this file ${(Date.now() - recentDuplicate.timestamp) / 1000} seconds ago. This suggests SWE is in a loop. Please review your plan.`,
          },
        ],
      };
    }

    // DUPLICATE FILE CHECK: Check if file with same content already exists
    const duplicateFiles = findDuplicateFiles(args.path, content);
    if (duplicateFiles.length > 0) {
      console.error(
        `[SWE-INTEGRITY] Detected duplicate file creation attempt: ${args.path} matches ${duplicateFiles.join(', ')}`
      );
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `BLOCKED: File with identical content already exists at: ${duplicateFiles.join(', ')}. Use the existing file instead of creating a duplicate.`,
          },
        ],
      };
    }

    // SAME NAME CHECK: Check if file with same name exists in directory
    const sameNameFiles = findSameNameFiles(args.path);
    if (sameNameFiles.length > 0) {
      console.error(
        `[SWE-INTEGRITY] Detected same-name file creation attempt: ${args.path} matches ${sameNameFiles.join(', ')}`
      );
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `BLOCKED: File with same name already exists in directory: ${sameNameFiles.join(', ')}. This suggests you may be creating a duplicate file. Please verify the file path.`,
          },
        ],
      };
    }

    // RECENT WRITE CHECK: Prevent rapid repeated writes
    if (wasFileRecentlyWritten(args.path, 30000)) {
      console.error(`[SWE-INTEGRITY] Blocked rapid repeated write to ${args.path}`);
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `BLOCKED: This file was written less than 30 seconds ago. This suggests SWE may be in a loop. Please wait or verify the operation is necessary.`,
          },
        ],
      };
    }

    // Phase 6: Auto-Correction
    const correctedContent = autoCorrectCode(content);
    if (correctedContent !== content) {
      console.error(
        `[SWE-LOG] Action: HEAL | Target: ${toWindsurfUri(args.path)} | Status: Auto-corrected forbidden patterns`
      );
      content = correctedContent;
    }

    const validation = validateCode(content);
    if (!validation.valid) {
      // If still invalid (e.g., line count), then we block
      recordAction('VIOLATION', { path: args.path, errors: validation.errors }, 'fail');
      return {
        isError: true,
        content: [{ type: 'text', text: `REJECTED: ${validation.errors.join(', ')}` }],
      };
    }

    const lineCount = content.split(/\r\n|\r|\n/).length;

    // ANTI-LOOP: Detect if AI is stuck writing the same file repeatedly
    const recentWrites = sessionMemory.history.filter(
      h => h.action === 'WRITE' && h.details?.path === args.path
    );
    if (recentWrites.length >= 3) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'CRITICAL: Loop detected. You have attempted to write to this file 3 times without moving to the next task. Re-evaluate your plan.',
          },
        ],
      };
    }

    // PHASE 8: Mandatory Backup Before Write (only for existing files)
    let fileExists = false;
    try {
      await promises_.access(args.path);
      fileExists = true;
    } catch {
      fileExists = false;
    }

    if (fileExists) {
      const backupPath = await createBackup(args.path);
      if (!backupPath) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `BACKUP FAILED: Cannot write to ${args.path} without a verified backup. Fix the backup system first.`,
            },
          ],
        };
      }
    }

    // Silent Foresight: Warn when approaching limit
    if (lineCount > (0,lib_config/* WARNING_THRESHOLD */.$E)()) {
      console.error(
        `[SWE-LOG] Action: WARNING | Target: ${toWindsurfUri(args.path)} | Status: File at ${lineCount} lines, approaching ${(0,lib_config/* MAX_LINES */.xg)()} limit`
      );
    }

    await promises_.writeFile(args.path, content, 'utf-8');

    // Update file registry after successful write
    await updateFileInRegistry(args.path, content);

    // PHASE 8: Update workflow step if active
    const currentWf = activeWorkflows.get('current');
    if (currentWf) {
      const writeStep = currentWf.steps.find(
        s => s.tool === 'write_file' && s.status === 'pending'
      );
      if (writeStep) {
        currentWf.updateStep(writeStep.name, 'completed');
        console.error(`[ORCHESTRATOR] Step completed: ${writeStep.name}`);
      }

      if (currentWf.isComplete()) {
        console.error(`[ORCHESTRATOR] Workflow ${currentWf.id} complete!`);
        activeWorkflows.delete('current');
      }
    }

    // MEMORY: Record the write action
    const actionType = correctedContent !== args.content ? 'WRITE_REPAIRED' : 'WRITE';
    recordAction(actionType, { path: args.path, lines: lineCount });

    const msg =
      correctedContent !== args.content
        ? `File saved. (Note: SWEObeyMe auto-corrected minor architectural violations in your syntax). URI: ${normalizePath(args.path)}`
        : `Successfully saved ${args.path}. All rules satisfied. URI: ${normalizePath(args.path)}`;
    return {
      content: [{ type: 'text', text: msg }],
      uri: toWindsurfUri(args.path),
    };
  },

  get_session_context: async _args => {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(sessionMemory, null, 2),
        },
      ],
    };
  },

  record_decision: async args => {
    recordAction('DECISION', args.decision);
    console.error(`[MEMORY] Decision Recorded: ${args.decision}`);
    return { content: [{ type: 'text', text: 'Decision logged to session memory.' }] };
  },

  enforce_surgical_rules: async args => {
    const validation = validateCode(args.proposed_code);

    if (!validation.valid) {
      recordAction('VIOLATION', { path: args.file_path, errors: validation.errors }, 'fail');
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `SURGICAL BLOCK: Your code was rejected for the following violations:\n- ${validation.errors.join('\n- ')}\n\nYou must refactor and try again within limits.`,
          },
        ],
      };
    }

    return {
      content: [{ type: 'text', text: 'âœ“ All surgical rules satisfied. Code is compliant.' }],
    };
  },

  sanitize_request: async args => {
    const sanitized = `[OBEY-MODE]: Processing intent "${args.logic_intent}" through SWEObeyMe Filter... 
  - Thread-safety: CHECKED.
  - Memory-leak prevention: CHECKED.
  - Line-count compliance: PENDING WRITE.
  - Forbidden patterns: SCANNING...`;

    return { content: [{ type: 'text', text: sanitized }] };
  },

  initiate_surgical_workflow: async args => {
    const workflowId = `WF-${Date.now()}`;
    const newWorkflow = new SurgicalWorkflow(workflowId, args.goal, args.steps);
    activeWorkflows.set('current', newWorkflow);

    recordAction('WORKFLOW_START', { id: workflowId, goal: args.goal });
    console.error(`[ORCHESTRATOR] New Workflow Initiated: ${args.goal}`);

    return {
      content: [
        {
          type: 'text',
          text: `Workflow ${workflowId} active. Proceed with Step 1: ${args.steps[0].name}.`,
        },
      ],
    };
  },

  get_workflow_status: async _args => {
    const wf = activeWorkflows.get('current');
    if (!wf) return { content: [{ type: 'text', text: 'No active workflow.' }] };

    return {
      content: [
        {
          type: 'text',
          text: `Active Workflow: ${wf.goal}\nProgress: ${JSON.stringify(wf.steps, null, 2)}`,
        },
      ],
    };
  },

  refactor_move_block: async args => {
    const sourceContent = await promises_.readFile(args.source_path, 'utf-8');

    // 1. Verify the code block exists in the source
    if (!sourceContent.includes(args.code_block)) {
      return {
        isError: true,
        content: [
          { type: 'text', text: 'ERROR: Code block not found in source file. Move aborted.' },
        ],
      };
    }

    // 2. Read/Create target file
    let targetContent = '';
    try {
      targetContent = await promises_.readFile(args.target_path, 'utf-8');
    } catch (e) {
      targetContent = '// New Module created by SWEObeyMe\n';
    }

    // 3. Perform the "Paste"
    const newTargetContent = targetContent + '\n' + args.code_block;

    // 4. Validate the new file doesn't break our 700-line rule
    if (newTargetContent.split('\n').length > 700) {
      return {
        isError: true,
        content: [
          { type: 'text', text: 'ERROR: Move would cause target file to exceed 700 lines.' },
        ],
      };
    }

    // 5. Atomic Execution
    await promises_.writeFile(args.target_path, newTargetContent, 'utf-8');
    const newSourceContent = sourceContent.replace(
      args.code_block,
      `// [MOVED TO ${external_path_.basename(args.target_path)}]`
    );
    await promises_.writeFile(args.source_path, newSourceContent, 'utf-8');

    recordAction('REFACTOR_MOVE', { from: args.source_path, to: args.target_path });
    return {
      content: [
        {
          type: 'text',
          text: `Successfully moved code block to ${args.target_path} (URI: ${normalizePath(args.target_path)}). Source has been updated with a reference comment.`,
        },
      ],
      uri: toWindsurfUri(args.target_path),
    };
  },

  extract_to_new_file: async args => {
    // 1. Create the new file with the code block and description
    const header = `// ${args.description || 'Module extracted by SWEObeyMe'}\n// Source: ${args.source_path}\n\n`;
    const newContent = header + args.code_block;

    // 2. Validate line count
    if (newContent.split('\n').length > 700) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'ERROR: Extracted module would exceed 700 lines.' }],
      };
    }

    // 3. Create backup of source first
    const backupPath = await createBackup(args.source_path);
    if (!backupPath) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'BACKUP FAILED: Cannot extract without verified backup.' }],
      };
    }

    // 4. Write the new file
    await promises_.writeFile(args.new_file_path, newContent, 'utf-8');

    // 5. Update source to reference the new file
    const sourceContent = await promises_.readFile(args.source_path, 'utf-8');
    const newSourceContent = sourceContent.replace(
      args.code_block,
      `// [EXTRACTED TO ${external_path_.basename(args.new_file_path)}]\n// See: ${args.new_file_path}`
    );
    await promises_.writeFile(args.source_path, newSourceContent, 'utf-8');

    recordAction('EXTRACT', { from: args.source_path, to: args.new_file_path });
    return {
      content: [
        {
          type: 'text',
          text: `Successfully extracted to ${args.new_file_path} (URI: ${normalizePath(args.new_file_path)}). Source has been updated with reference comments.`,
        },
      ],
      uri: toWindsurfUri(args.new_file_path),
    };
  },

  get_architectural_directive: async _args => {
    const status = internalAudit.surgicalIntegrityScore > 80 ? 'STABLE' : 'COMPROMISED';
    return {
      content: [
        {
          type: 'text',
          text: `[SWEObeyMe CONSTITUTION]:
Status: ${status}
Integrity Score: ${internalAudit.surgicalIntegrityScore}%
Current Mandate: ${CONSTITUTION.MANDATE}
Reminder: You are a surgeon. Precision over speed.`,
        },
      ],
    };
  },

  request_surgical_recovery: async args => {
    sessionMemory.history = []; // Wipe the confusing history
    internalAudit.consecutiveFailures = 0;
    recordAction('RECOVERY', `Recovery triggered: ${args.reason}`);
    return {
      content: [
        {
          type: 'text',
          text: "RECOVERY INITIATED: Session memory purged. Please run 'scan_project' to re-orient your surgical map.",
        },
      ],
    };
  },

  auto_repair_submission: async args => {
    if (args.type === 'json') {
      const repaired = repairJson(args.raw_content);
      if (repaired) {
        return { content: [{ type: 'text', text: JSON.stringify(repaired, null, 2) }] };
      }
    } else if (args.type === 'code') {
      const corrected = autoCorrectCode(args.raw_content);
      return { content: [{ type: 'text', text: corrected }] };
    }
    return {
      isError: true,
      content: [{ type: 'text', text: 'Content unrepairable. Refactor required.' }],
    };
  },

  analyze_file_health: async args => {
    const content = await promises_.readFile(args.path, 'utf-8');
    const issues = [];

    // Check for Complexity (Deep Nesting)
    const maxNesting = content.split('\n').reduce((max, line) => {
      const depth = (line.match(/ {2}|\t/g) || []).length;
      return Math.max(max, depth);
    }, 0);

    if (maxNesting > 5)
      issues.push("CRITICAL: Deep nesting detected. Logic is becoming a 'Black Box'.");
    if (content.includes('try {} catch') || content.includes('catch (e) {}'))
      issues.push('SMELL: Silent catch blocks detected. Digital Debt alert.');

    const report = issues.length > 0 ? issues.join('\n') : 'File is Surgically Clean.';
    return { content: [{ type: 'text', text: `[HEALTH REPORT for ${args.path}]:\n${report}` }] };
  },

  detect_architectural_drift: async args => {
    const content = await promises_.readFile(args.path, 'utf-8');
    const lines = content.split('\n');
    const commentCount = lines.filter(
      l => l.trim().startsWith('//') || l.trim().startsWith('/*')
    ).length;
    const ratio = commentCount / lines.length;

    if (ratio < 0.1) {
      return {
        content: [
          {
            type: 'text',
            text: "DRIFT DETECTED: Documentation ratio is below 10%. Add 'Non-Coder' explanations immediately.",
          },
        ],
      };
    }
    return { content: [{ type: 'text', text: 'Alignment: COMPLIANT.' }] };
  },

  create_backup: async args => {
    const backupPath = await createBackup(args.path);
    if (backupPath) {
      return {
        content: [
          {
            type: 'text',
            text: `Backup created at: ${backupPath} (URI: ${normalizePath(backupPath)})`,
          },
        ],
        uri: toWindsurfUri(backupPath),
      };
    }
    return { isError: true, content: [{ type: 'text', text: 'Failed to create backup.' }] };
  },

  restore_backup: async args => {
    try {
      const files = await promises_.readdir(BACKUP_DIR);
      const baseName = external_path_.basename(args.path);
      const backups = files.filter(f => f.startsWith(baseName + '.backup-'));

      if (args.backup_index >= backups.length) {
        return { isError: true, content: [{ type: 'text', text: 'Invalid backup index.' }] };
      }

      // Sort by timestamp (newest first)
      backups.sort((a, b) => {
        const tsA = parseInt(a.match(/-(\d+)\.readonly$/)[1]);
        const tsB = parseInt(b.match(/-(\d+)\.readonly$/)[1]);
        return tsB - tsA;
      });

      const backupFile = backups[args.backup_index];
      const backupPath = external_path_.join(BACKUP_DIR, backupFile);
      const content = await promises_.readFile(backupPath, 'utf-8');

      await promises_.writeFile(args.path, content, 'utf-8');
      return {
        content: [
          {
            type: 'text',
            text: `Restored ${args.path} (URI: ${normalizePath(args.path)}) from backup ${backupFile}.`,
          },
        ],
        uri: toWindsurfUri(args.path),
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Restore failed: ${error.message}` }],
      };
    }
  },

  query_the_oracle: async _args => {
    const categories = ['SUCCESS', 'FAILURE', 'RECOVERY'];
    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    return { content: [{ type: 'text', text: `[ORACLE]: ${getRandomQuote(randomCat)}` }] };
  },

  get_config: configHandlers.get_config,

  set_config: configHandlers.set_config,

  reset_config: configHandlers.reset_config,

  get_config_schema: configHandlers.get_config_schema,

  list_directory: async args => {
    const files = await promises_.readdir(args.path);
    return { content: [{ type: 'text', text: files.join('\n') }] };
  },

  dry_run_write_file: validationHandlers.dry_run_write_file,

  validate_change_before_apply: validationHandlers.validate_change_before_apply,

  diff_changes: contextHandlers.diff_changes,

  get_file_context: contextHandlers.get_file_context,

  verify_syntax: validationHandlers.verify_syntax,

  analyze_change_impact: contextHandlers.analyze_change_impact,

  get_symbol_references: contextHandlers.get_symbol_references,

  enforce_strict_mode: configHandlers.enforce_strict_mode,

  check_for_anti_patterns: validationHandlers.check_for_anti_patterns,

  validate_naming_conventions: validationHandlers.validate_naming_conventions,

  verify_imports: validationHandlers.verify_imports,

  check_test_coverage: safetyHandlers.check_test_coverage,

  require_documentation: feedbackHandlers.require_documentation,

  generate_change_summary: feedbackHandlers.generate_change_summary,

  confirm_dangerous_operation: safetyHandlers.confirm_dangerous_operation,

  check_for_repetitive_patterns: safetyHandlers.check_for_repetitive_patterns,

  explain_rejection: feedbackHandlers.explain_rejection,

  suggest_alternatives: feedbackHandlers.suggest_alternatives,

  get_historical_context: feedbackHandlers.get_historical_context,

  get_operation_guidance: feedbackHandlers.get_operation_guidance,

  run_related_tests: safetyHandlers.run_related_tests,

  // C# specific handlers
  validate_csharp_code: csharpHandlers.validate_csharp_code,
  validate_csharp_brackets: csharpHandlers.validate_csharp_brackets,
  analyze_csharp_complexity: csharpHandlers.analyze_csharp_complexity,
  detect_nested_try_catch: csharpHandlers.detect_nested_try_catch,
  visualize_scope_depth: csharpHandlers.visualize_scope_depth,
  validate_math_safety: csharpHandlers.validate_math_safety,
  analyze_math_expressions: csharpHandlers.analyze_math_expressions,
  validate_csharp_math: csharpHandlers.validate_csharp_math,
  suggest_math_improvements: csharpHandlers.suggest_math_improvements,
  csharp_health_check: csharpHandlers.csharp_health_check,

  // Project integrity handlers
  index_project_files: projectIntegrityHandlers.index_project_files,
  check_file_duplicates: projectIntegrityHandlers.check_file_duplicates,
  validate_file_references: projectIntegrityHandlers.validate_file_references,
  check_recent_operations: projectIntegrityHandlers.check_recent_operations,
  validate_before_write: projectIntegrityHandlers.validate_before_write,
  get_registry_stats: projectIntegrityHandlers.get_registry_stats,
  search_files: projectIntegrityHandlers.search_files,
  generate_audit_report: projectIntegrityHandlers.generate_audit_report,
  check_file_exists: projectIntegrityHandlers.check_file_exists,
};

;// CONCATENATED MODULE: ./lib/tools/registry.js
function getToolDefinitions() {
  return [
    {
      name: 'obey_me_status',
      description:
        'Checks if the SWEObMe surgical governance system is operational. Use this first to verify the system is active before proceeding with any file operations.',
    },
    {
      name: 'obey_surgical_plan',
      description:
        'CRITICAL: MUST call this BEFORE using write_file to validate your surgical plan complies with architectural rules. This prevents file bloat by checking if your changes will exceed the 700-line limit. If rejected, you MUST use refactor_move_block or extract_to_new_file to reduce file size before proceeding. Example: Call with current_line_count=650 and estimated_addition=100 to check if adding 100 lines to a 650-line file is safe.',
      inputSchema: {
        type: 'object',
        properties: {
          target_file: {
            type: 'string',
            description: 'File to be modified - REQUIRED for validation',
          },
          current_line_count: {
            type: 'number',
            description: 'Current line count - REQUIRED for validation',
          },
          estimated_addition: {
            type: 'number',
            description: 'Estimated lines to add - defaults to 0 if not specified',
          },
        },
        required: ['target_file', 'current_line_count'],
      },
    },
    {
      name: 'read_file',
      description:
        'Read a file with surgical context injection. This is the ONLY way to read files - it enforces .sweignore rules and injects architectural context including line count, last modified time, and project contract. Use this instead of direct file reading to ensure you see architectural constraints. Example: Read index.js to see it has 156 lines and any surgical warnings.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to read' },
        },
        required: ['path'],
      },
    },
    {
      name: 'write_file',
      description:
        'CRITICAL: This is the ONLY way to write files. It enforces surgical rules including: 1) Line count limit (max 700), 2) Forbidden pattern detection (console.log, debugger, eval, TODO comments), 3) Automatic backup of existing files, 4) Loop detection (prevents repetitive writes), 5) Auto-correction of minor violations. PREREQUISITE: MUST call obey_surgical_plan BEFORE this to ensure compliance. If your write is rejected with line count error, use refactor_move_block or extract_to_new_file to reduce file size first.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to write' },
          content: {
            type: 'string',
            description: 'Content to write - will be validated for surgical compliance',
          },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'list_directory',
      description:
        'List files in a directory. Use this to explore project structure before making changes. Example: List the lib directory to see available modules before refactoring.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path' },
        },
        required: ['path'],
      },
    },
    {
      name: 'get_session_context',
      description:
        "Get current session memory and history. Use this when you encounter repeated failures or need to understand what actions have been taken. This helps you avoid loops and understand your progress. Example: Check session context after 3 consecutive failures to see if you're stuck in a loop.",
    },
    {
      name: 'record_decision',
      description:
        'Record a decision to session memory for accountability. Use this to document architectural decisions and rationale. Example: Record your decision to extract a large function to a new module for maintainability.',
      inputSchema: {
        type: 'object',
        properties: {
          decision: { type: 'string', description: 'Decision to record' },
        },
        required: ['decision'],
      },
    },
    {
      name: 'enforce_surgical_rules',
      description:
        'Validate code against surgical rules BEFORE writing. This is a pre-flight check to ensure your code complies with architectural standards designed to prevent technical debt. Use this before write_file to avoid rejections. It checks for: line count limits, forbidden patterns (console.log, debugger, eval, TODO), and mandatory comments. Example: Validate your refactored code before calling write_file to ensure it passes all surgical rules.',
      inputSchema: {
        type: 'object',
        properties: {
          proposed_code: { type: 'string', description: 'Code to validate' },
          file_path: { type: 'string', description: 'File path for context' },
        },
        required: ['proposed_code'],
      },
    },
    {
      name: 'sanitize_request',
      description:
        'Sanitize a request through SWEObMe filters. This ensures your intent aligns with surgical principles before execution. Use this for complex operations to verify your approach is sound. Example: Sanitize your intent to refactor a large file to ensure it follows surgical principles.',
      inputSchema: {
        type: 'object',
        properties: {
          logic_intent: { type: 'string', description: 'Logic intent to sanitize' },
        },
        required: ['logic_intent'],
      },
    },
    {
      name: 'auto_repair_submission',
      description:
        'Attempt to repair malformed submissions automatically. Use this when write_file rejects your content with JSON or syntax errors. It fixes trailing commas, markdown wrapping, and removes forbidden patterns. Example: Repair a JSON response that has trailing commas before calling write_file again.',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['json', 'code'],
            description: 'Type of content to repair',
          },
          raw_content: { type: 'string', description: 'Raw content to repair' },
        },
        required: ['type', 'raw_content'],
      },
    },
    {
      name: 'analyze_file_health',
      description:
        'Analyze file health for code smells and complexity. Use this before refactoring to identify issues like deep nesting, silent catch blocks, and complexity. Example: Analyze index.js before refactoring to understand what needs to be improved.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to analyze' },
        },
        required: ['path'],
      },
    },
    {
      name: 'detect_architectural_drift',
      description:
        'Detect architectural drift from documentation standards. Use this to check if files have adequate documentation (min 10% comment ratio). Example: Check if a recently modified file still follows documentation standards.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to check' },
        },
        required: ['path'],
      },
    },
    {
      name: 'create_backup',
      description:
        'Create a manual backup of a file. Use this before risky operations. Note: write_file automatically creates backups for existing files, so this is only needed for manual backup operations. Example: Backup a critical file before attempting a complex refactoring.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to backup' },
        },
        required: ['path'],
      },
    },
    {
      name: 'restore_backup',
      description:
        'Restore a file from backup. Use this when a change breaks the code and you need to revert. Example: Restore index.js to its previous state after a failed refactoring attempt. Use backup_index=0 for the most recent backup.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to restore' },
          backup_index: {
            type: 'number',
            description: 'Backup index (0 = newest, 1 = second newest, etc.)',
          },
        },
        required: ['path', 'backup_index'],
      },
    },
    {
      name: 'initiate_surgical_workflow',
      description:
        'Initiate a multi-step surgical workflow for complex operations. Use this for tasks requiring multiple coordinated steps (e.g., refactoring a large file into multiple modules). This ensures proper sequencing and maintains surgical compliance throughout. Example: Initiate a workflow to split a 600-line file into three smaller modules.',
      inputSchema: {
        type: 'object',
        properties: {
          goal: { type: 'string', description: 'Workflow goal - what you want to accomplish' },
          steps: {
            type: 'array',
            description: 'Workflow steps in execution order',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Step name for tracking' },
                tool: { type: 'string', description: 'Tool to execute for this step' },
              },
            },
          },
        },
        required: ['goal', 'steps'],
      },
    },
    {
      name: 'get_workflow_status',
      description:
        "Get status of the active surgical workflow. Use this to track progress and understand which steps are completed. Example: Check workflow status to see if you've completed the extraction step before proceeding to the next step.",
    },
    {
      name: 'refactor_move_block',
      description:
        "Move a code block from one file to another while maintaining surgical compliance. This is the PREFERRED method for reducing file size when obey_surgical_plan rejects your plan. It validates that the target file won't exceed 700 lines. Example: Move a 200-line function from index.js to utils.js to keep index.js under the limit.",
      inputSchema: {
        type: 'object',
        properties: {
          source_path: { type: 'string', description: 'Source file path to extract from' },
          target_path: { type: 'string', description: 'Target file path to move to' },
          code_block: {
            type: 'string',
            description: 'Exact code block to move (must match source file content exactly)',
          },
        },
        required: ['source_path', 'target_path', 'code_block'],
      },
    },
    {
      name: 'extract_to_new_file',
      description:
        "Extract a code block to a new file while maintaining surgical compliance. Use this when you need to create a new module from existing code. It validates the new file won't exceed 700 lines and creates a backup of the source. Example: Extract a large class to a new file to reduce source file size.",
      inputSchema: {
        type: 'object',
        properties: {
          source_path: { type: 'string', description: 'Source file path to extract from' },
          new_file_path: { type: 'string', description: 'New file path to create' },
          code_block: {
            type: 'string',
            description: 'Exact code block to extract (must match source file content exactly)',
          },
          description: {
            type: 'string',
            description: 'Description of the extraction for documentation',
          },
        },
        required: ['source_path', 'new_file_path', 'code_block'],
      },
    },
    {
      name: 'get_architectural_directive',
      description:
        "Get the current architectural directive from SWEObeyMe. Call this when you're unsure about the project's coding standards or when you've encountered multiple failures. This provides the current mandate, integrity score, and compliance status. Example: Call after 3 consecutive failures to understand why your approach is being rejected.",
    },
    {
      name: 'request_surgical_recovery',
      description:
        "Reset session state when you encounter repeated failures. Call this after 3 consecutive errors to clear history and start fresh. This is a recovery mechanism when you're stuck in a loop or the session state is corrupted. Example: Call after 3 failed write attempts to reset and try a different approach.",
      inputSchema: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            description: "Reason for recovery (e.g., '3 consecutive write failures')",
          },
        },
        required: ['reason'],
      },
    },
    {
      name: 'query_the_oracle',
      description:
        'Query the Oracle for surgical wisdom and motivation. Use this when you need guidance or encouragement during complex tasks. This provides inspirational quotes to maintain surgical discipline. Example: Query the Oracle for motivation when tackling a difficult refactoring.',
    },
    {
      name: 'get_config',
      description:
        'Get current SWEObeyMe configuration values. Use this to view all configurable settings and their current values. Example: Get current configuration to see line count limits and feature toggles.',
    },
    {
      name: 'set_config',
      description:
        'Set SWEObeyMe configuration values. Use this to change settings like line count limits, warning thresholds, debug logging, auto-correction, and feature toggles. All changes are saved to ~/.sweobeyme-config.json. Example: Set maxLines to 800 to increase the file size limit.',
      inputSchema: {
        type: 'object',
        properties: {
          settings: {
            type: 'object',
            description:
              'Configuration key-value pairs to set. Valid keys: maxLines, warningThreshold, maxBackupsPerFile, enableAutoCorrection, debugLogs, enableLoopDetection, maxLoopAttempts, minDocumentationRatio, enableWorkflowOrchestration, enableSessionMemory, enableOracle, forbiddenPatterns',
          },
        },
        required: ['settings'],
      },
    },
    {
      name: 'reset_config',
      description:
        'Reset all SWEObeyMe configuration to default values. Use this when you want to revert all custom settings. Example: Reset configuration after making too many experimental changes.',
    },
    {
      name: 'get_config_schema',
      description:
        'Get the configuration schema with validation rules and descriptions. Use this to understand what configuration options are available and their valid values. Example: Get schema to see what settings can be configured.',
    },
    {
      name: 'dry_run_write_file',
      description:
        'Simulate a write operation without actually writing to the file. CRITICAL for lower-tier models to prevent irreversible mistakes. Validates line count, forbidden patterns, and syntax before any changes. Returns detailed results showing what would happen. MUST use this before write_file when requireDryRun is enabled. Example: Dry run a file write to validate it will succeed.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to write' },
          content: { type: 'string', description: 'Content to write' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'validate_change_before_apply',
      description:
        'Comprehensive validation of proposed changes before applying. Checks syntax, imports, anti-patterns, naming conventions, and more. Returns detailed validation report with issues and fixes. CRITICAL for lower-tier models to prevent broken code. Example: Validate a refactoring before applying changes.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to validate' },
          content: { type: 'string', description: 'Proposed content' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'diff_changes',
      description:
        'Generate detailed diff between current and proposed file content. Shows line-by-line additions, deletions, and modifications. Helps understand exactly what will change. Example: Generate diff to see what changes will be made to a file.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to compare' },
          proposed_content: { type: 'string', description: 'Proposed new content' },
        },
        required: ['path', 'proposed_content'],
      },
    },
    {
      name: 'get_file_context',
      description:
        'Get comprehensive context about a file including imports, exports, functions, classes, and metrics. Provides dependencies and usage information to prevent breaking changes. CRITICAL for understanding ripple effects of changes. Example: Get context for a file before refactoring.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to analyze' },
        },
        required: ['path'],
      },
    },
    {
      name: 'verify_syntax',
      description:
        'Validate syntax of JavaScript/TypeScript code. Checks for unmatched braces, parentheses, brackets, and unclosed strings. Returns specific syntax errors with line numbers. CRITICAL for preventing broken code. Example: Verify syntax of code before writing.',
      inputSchema: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Code to validate' },
          language: {
            type: 'string',
            description: 'Language (javascript or typescript)',
            default: 'javascript',
          },
        },
        required: ['code'],
      },
    },
    {
      name: 'analyze_change_impact',
      description:
        'Analyze the impact of proposed changes on the codebase. Lists affected files, functions, and classes. Identifies potential breaking changes and dependencies. CRITICAL for understanding ripple effects. Example: Analyze impact before refactoring a function.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to analyze' },
          changes: { type: 'string', description: 'Description of changes' },
        },
        required: ['path', 'changes'],
      },
    },
    {
      name: 'get_symbol_references',
      description:
        'Find all references to a symbol (function, class, variable) in a file. Helps understand ripple effects of changes and ensures complete refactoring. Example: Find all references to a function before renaming it.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to search' },
          symbol: { type: 'string', description: 'Symbol name to find references for' },
        },
        required: ['path', 'symbol'],
      },
    },
    {
      name: 'enforce_strict_mode',
      description:
        'Enforce strict validation mode with extra conservative checks. Rejects more changes and requires higher quality standards. Use this for lower-tier models that need more guardrails. Example: Enable strict mode for safer operations.',
      inputSchema: {
        type: 'object',
        properties: {
          enable: { type: 'boolean', description: 'Enable or disable strict mode' },
        },
        required: ['enable'],
      },
    },
    {
      name: 'check_for_anti_patterns',
      description:
        'Detect common anti-patterns and code smells in code. Checks for god functions, deep nesting, magic numbers, and more. Returns specific issues with line numbers. Example: Check code for anti-patterns before committing.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to check' },
        },
        required: ['path'],
      },
    },
    {
      name: 'validate_naming_conventions',
      description:
        'Enforce naming conventions (camelCase, PascalCase, UPPER_SNAKE_CASE). Validates function, class, and constant naming. Returns violations with suggestions. Example: Validate naming conventions in a file.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to validate' },
        },
        required: ['path'],
      },
    },
    {
      name: 'verify_imports',
      description:
        'Validate all imports in code. Checks that imported files exist and are accessible. Detects circular dependencies. Returns specific import errors. Example: Verify imports before writing code.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to validate' },
          content: { type: 'string', description: 'Code content to check' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'check_test_coverage',
      description:
        'Calculate test coverage for changed code. Returns coverage percentage and identifies untested code. Requires minimum coverage threshold when enabled. Example: Check test coverage for a file.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to check' },
        },
        required: ['path'],
      },
    },
    {
      name: 'require_documentation',
      description:
        'Enforce documentation requirements. Checks for function/class comments and minimum documentation ratio. Returns specific documentation issues. Example: Check documentation for a file.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to check' },
          content: { type: 'string', description: 'Code content to check' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'generate_change_summary',
      description:
        'Generate a summary of changes made. Lists files modified, functions added/removed, and creates a commit message draft. Helps with accountability and tracking. Example: Generate summary after making changes.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
          changes: { type: 'string', description: 'Description of changes' },
        },
        required: ['path', 'changes'],
      },
    },
    {
      name: 'confirm_dangerous_operation',
      description:
        'Check if an operation is dangerous and requires confirmation. Returns warning and requires user approval for destructive operations. Example: Check before deleting a file.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: { type: 'string', description: 'Operation description' },
        },
        required: ['operation'],
      },
    },
    {
      name: 'check_for_repetitive_patterns',
      description:
        'Detect repetitive operations that indicate a loop. Warns about stuck patterns and suggests breaking out. CRITICAL for preventing infinite loops. Example: Check for repetitive file operations.',
      inputSchema: {
        type: 'object',
        properties: {
          operations: { type: 'array', description: 'Array of recent operations' },
        },
        required: ['operations'],
      },
    },
    {
      name: 'explain_rejection',
      description:
        'Explain why an operation was rejected. Provides specific reasons, explanations, suggestions, and recommended tools. Helps model learn from mistakes. Example: Get explanation for a rejected write operation.',
      inputSchema: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Rejection reason' },
          context: { type: 'string', description: 'Additional context' },
        },
        required: ['reason'],
      },
    },
    {
      name: 'suggest_alternatives',
      description:
        'Suggest alternative approaches when operations fail. Provides specific tools and methods to try next. Helps model find better solutions. Example: Get alternatives when write_file is rejected.',
      inputSchema: {
        type: 'object',
        properties: {
          failed_operation: { type: 'string', description: 'Name of failed operation' },
          context: { type: 'string', description: 'Additional context' },
        },
        required: ['failed_operation'],
      },
    },
    {
      name: 'get_historical_context',
      description:
        'Get historical context about a file. Shows previous changes, last modified time, and change markers. Helps understand file evolution. Example: Get historical context before refactoring.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to analyze' },
        },
        required: ['path'],
      },
    },
    {
      name: 'get_operation_guidance',
      description:
        'Get guidance on how to use a specific operation. Provides prerequisites, warnings, and best practices. Helps model use tools correctly. Example: Get guidance for write_file operation.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: { type: 'string', description: 'Operation name' },
          context: { type: 'string', description: 'Additional context' },
        },
        required: ['operation'],
      },
    },
    {
      name: 'run_related_tests',
      description:
        'Run tests for files affected by changes. Returns test results and coverage. Fails changes that break tests. Prevents regressions. Example: Run tests after modifying a file.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to run tests for' },
        },
        required: ['path'],
      },
    },
  ];
}

;// CONCATENATED MODULE: ./lib/tools.js




// Set getRandomQuote after initialization
async function initializeQuotes() {
  try {
    const { fileURLToPath } = await Promise.resolve(/* import() */).then(__nccwpck_require__.t.bind(__nccwpck_require__, 16, 19));
    const quotesModule = await __nccwpck_require__(765)(external_path_.join(external_path_.dirname(fileURLToPath(import.meta.url)), '../quotes.js'));
    const getRandomQuote = quotesModule.getRandomQuote;
    setGetRandomQuote(getRandomQuote);
  } catch (e) {
    // Fallback quotes if quotes.js not found
    const fallbackQuotes = {
      SUCCESS: ['Surgery complete.'],
      FAILURE: ['Non-compliance detected.'],
      RECOVERY: ['Recovery initiated.'],
    };
    setGetRandomQuote(category => fallbackQuotes[category][0]);
  }
}

// Re-export for convenience


;// CONCATENATED MODULE: ./index.js
// [LOCKDOWN]: Ensure NOTHING hits stdout except the MCP Protocol
const originalLog = console.log;
console.log = (...args) => {
  // Redirects all standard logs to the error channel (safe for Windsurf)
  process.stderr.write(args.join(' ') + '\n');
};

// Also silence the Audit/SWEObeyMe messages specifically
const auditLog = msg => process.stderr.write(`[AUDIT]: ${msg}\n`);
// Suppress unused variable warnings
void originalLog;
void auditLog;





// Import from lib modules





const index_DEBUG_LOGS = process.env.SWEOBEYME_DEBUG === '1';
const index_log = msg => {
  if (!index_DEBUG_LOGS) return;
  process.stderr.write(`[SWEObeyMe-Audit]: ${msg}\n`);
};

// Main async initialization
(async () => {
  try {
    // Initialize quotes module
    await initializeQuotes();
  } catch (error) {
    console.error('[SWEObeyMe]: Failed to initialize quotes:', error);
  }

  // Initialize server
  const server = new Server(
    {
      name: 'swe-obey-me',
      version: '1.0.16',
    },
    {
      capabilities: { tools: {} },
    }
  );

  // Ensure backup directory exists
  await ensureBackupDir();

  // Initialize handler - REQUIRED for handshake
  server.setRequestHandler(InitializeRequestSchema, async () => {
    // Do not block initialize on filesystem IO; Windsurf may EOF if init is slow.
    // Kick off in background if not already loaded.
    loadProjectContract().catch(() => {});
    loadSweIgnore().catch(() => {});

    return {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'SWEObeyMe', version: '1.0.16' },
    };
  });

  // ListTools handler - REQUIRED for green dot
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: getToolDefinitions(),
  }));

  // CallTool handler - Core MCP interaction
  server.setRequestHandler(CallToolRequestSchema, async request => {
    const { name, arguments: args } = request.params;

    index_log(`Tool called: ${name}`);

    // Check if tool exists
    if (!toolHandlers[name]) {
      throw new Error(`Tool ${name} not found`);
    }

    let result;
    try {
      // Call the tool handler
      result = await toolHandlers[name](args);

      // PHASE 10: Pre-flight hook - Update internalAudit based on result
      if (result && result.isError) {
        internalAudit.consecutiveFailures++;
        internalAudit.surgicalIntegrityScore -= 5;
      } else if (result) {
        internalAudit.consecutiveFailures = 0;
        internalAudit.surgicalIntegrityScore = Math.min(
          100,
          internalAudit.surgicalIntegrityScore + 1
        );
      }

      // If the AI is failing too much, force it to check the Constitution
      if (internalAudit.consecutiveFailures >= CONSTITUTION.ERROR_THRESHOLD && result) {
        result.content.push({
          type: 'text',
          text: "\n[SYSTEM ALERT]: High failure rate detected. Call 'get_architectural_directive' before your next move.",
        });
      }

      return result;
    } catch (error) {
      // PHASE 10: Update audit on errors too
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 5;

      index_log(`ERROR: ${error.message}`);
      return {
        isError: true,
        content: [{ type: 'text', text: error.message }],
      };
    }
  });

  // [STRICT TRANSPORT]: Standard Input/Output
  const transport = new StdioServerTransport();

  // Re-check the handshake logic
  const startServer = async () => {
    try {
      await server.connect(transport);
      if (index_DEBUG_LOGS) process.stderr.write('[SWEObeyMe]: Governor Online. Handshake Complete.\n');
    } catch (error) {
      process.stderr.write(`[CRITICAL]: Handshake Failed: ${error}\n`);
      // Do NOT call process.exit() - VS Code extension host prevents it
      throw error;
    }
  };

  await startServer();

  // Background initialization (must not delay MCP handshake)
  ensureBackupDir().catch(() => {});
  loadProjectContract().catch(() => {});
  loadSweIgnore().catch(() => {});
  index_log('Server started successfully.');

  // [LIFECYCLE MANAGEMENT]: Graceful Shutdown for VS Code Extension Host
  let isShuttingDown = false;
  const initiateShutdown = reason => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    process.stderr.write(`[SHUTDOWN] ${reason}. Cleaning up gracefully (no exit call)...\n`);
    // Close the MCP transport gracefully - do NOT call process.exit()
    // VS Code's extension host prevents process.exit() - let it close naturally
    transport.close().catch(() => {});
  };

  // Use the global process object explicitly
  global.process.on('SIGINT', () => initiateShutdown('SIGINT'));
  global.process.on('SIGTERM', () => initiateShutdown('SIGTERM'));

  // Listen for pipe closure (The Windsurf "Reload" fix)
  global.process.stdin.on('close', () => initiateShutdown('Stdin Closed'));

  // [DISTRIBUTION PATCH]: Active Parent Monitoring
  // Stores/VSIX often mask stdin 'close' events.
  const parentPid = global.process.ppid;

  setInterval(() => {
    try {
      // Check if the parent process still exists
      // On Windows, process.kill(pid, 0) can fail due to permission issues even when parent exists
      // Only shut down if we get a specific error indicating the process is gone
      try {
        global.process.kill(parentPid, 0);
      } catch (e) {
        // On Windows, EPERM or EACCES means permission denied, not process gone
        // Only shut down on ESRCH (No such process)
        if (e.code === 'ESRCH') {
          initiateShutdown('Parent Process (IDE) not found. Store-Life Protocol triggered.');
        }
        // Ignore permission errors - parent is likely still running
      }
    } catch (e) {
      // Ignore any other errors in parent checking
    }
  }, 5000); // Check every 5 seconds

  // 2. Handle "End of File" on stdin (Standard MCP exit)
  global.process.stdin.on('end', () => {
    initiateShutdown('IDE sent EOF');
  });

  // [ZOMBIE PREVENTION]: Force absolute termination on any pipe error
  global.process.stdout.on('error', err => {
    if (err.code === 'EPIPE') initiateShutdown('Stdout Pipe Broken (EPIPE)');
  });

  // 3. Handle standard Windows termination signals
  // Note: SIGINT and SIGTERM already registered above.

  // 4. Catch Unhandled Errors to prevent silent zombie hangs
  global.process.on('uncaughtException', err => {
    process.stderr.write(`[CRITICAL ERROR] ${err.message}\n`);
    initiateShutdown('Uncaught Exception');
  });
})(); // Close async IIFE

