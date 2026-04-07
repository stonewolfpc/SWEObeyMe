/**
 * Error Detection, Handling & Intelligent Escalation System
 * Implements the 7-step error resolution pipeline
 * Integrates with existing fallback-system.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectFailureType, executeFallback, getFallbackSuggestions } from './fallback-system.js';
import { getProjectMemory } from './project-memory.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ERROR_LOG_PATH = path.join(__dirname, '..', 'error_log.json');

/**
 * Error Classification Types
 */
export const ERROR_TYPES = {
  SYNTAX_ERROR: 'Syntax error',
  TYPE_ERROR: 'Type error',
  MISSING_IMPORT: 'Missing import/module',
  MISSING_DEPENDENCY: 'Missing dependency',
  MISSING_FILE: 'Missing file',
  BUILD_ERROR: 'Build system error',
  RUNTIME_EXCEPTION: 'Runtime exception',
  UI_LAYOUT_ERROR: 'UI layout/geometry error',
  TOOL_FAILURE: 'Tool failure',
  UNKNOWN: 'Unknown/ambiguous'
};

/**
 * Error Detection & Escalation System
 */
export class ErrorDetectionSystem {
  constructor() {
    this.errorLog = [];
    this.errorPatterns = new Map();
    this.projectMemory = null;
  }

  /**
   * Initialize the error detection system
   */
  async initialize() {
    try {
      this.projectMemory = await getProjectMemory();
      await this.loadErrorLog();
      await this.loadErrorPatterns();
    } catch (error) {
      console.warn('Error detection system initialization incomplete: ' + error.message);
    }
  }

  /**
   * Step 1: Error Capture & Classification
   */
  async captureAndClassify(error, context) {
    const errorEntry = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      message: error.message || error.toString(),
      stack: error.stack,
      type: this.classifyError(error),
      context: context || {},
      status: 'captured',
      resolution: null,
      attempts: []
    };

    this.errorLog.push(errorEntry);
    await this.saveErrorLog();

    return errorEntry;
  }

  /**
   * Classify error type
   */
  classifyError(error) {
    const message = error.message || error.toString() || '';

    const fallbackType = detectFailureType(error);
    if (fallbackType !== 'UNKNOWN_ERROR') {
      return this.mapFallbackType(fallbackType);
    }

    if (message.includes('SyntaxError') || message.includes('Unexpected token')) {
      return ERROR_TYPES.SYNTAX_ERROR;
    }

    if (message.includes('TypeError')) {
      return ERROR_TYPES.TYPE_ERROR;
    }

    if (message.includes('Cannot find module') || message.includes('import')) {
      return ERROR_TYPES.MISSING_IMPORT;
    }

    if (message.includes('ENOENT') || message.includes('no such file')) {
      return ERROR_TYPES.MISSING_FILE;
    }

    if (message.includes('build') || message.includes('compile')) {
      return ERROR_TYPES.BUILD_ERROR;
    }

    if (message.includes('Runtime') || message.includes('Exception')) {
      return ERROR_TYPES.RUNTIME_EXCEPTION;
    }

    return ERROR_TYPES.UNKNOWN;
  }

  /**
   * Map fallback type to error type
   */
  mapFallbackType(fallbackType) {
    const mapping = {
      FILE_NOT_FOUND: ERROR_TYPES.MISSING_FILE,
      TOOL_FAILURE: ERROR_TYPES.TOOL_FAILURE,
      PERMISSION_DENIED: ERROR_TYPES.RUNTIME_EXCEPTION,
      SYNTAX_ERROR: ERROR_TYPES.SYNTAX_ERROR,
      IMPORT_ERROR: ERROR_TYPES.MISSING_IMPORT,
      LOOP_DETECTED: ERROR_TYPES.RUNTIME_EXCEPTION
    };
    return mapping[fallbackType] || ERROR_TYPES.UNKNOWN;
  }

  /**
   * Step 2: Local Documentation Check
   */
  async checkLocalDocumentation(errorEntry) {
    const documentationChecks = {
      readme: false,
      architecture: false,
      projectMap: false,
      docs: false,
      designSystem: false
    };

    try {
      const workspace = errorEntry.context.workspace || process.cwd();
      
      // Check for README
      const readmePath = path.join(workspace, 'README.md');
      try {
        await fs.access(readmePath);
        documentationChecks.readme = true;
      } catch {}

      // Check for ARCHITECTURE.md
      const archPath = path.join(workspace, 'ARCHITECTURE.md');
      try {
        await fs.access(archPath);
        documentationChecks.architecture = true;
      } catch {}

      // Check for project_map.json
      const projectMapPath = path.join(workspace, 'project_map.json');
      try {
        await fs.access(projectMapPath);
        documentationChecks.projectMap = true;
      } catch {}

      // Check for docs folder
      const docsPath = path.join(workspace, 'docs');
      try {
        await fs.access(docsPath);
        documentationChecks.docs = true;
      } catch {}

      // Search documentation for error explanation
      const explanation = await this.searchDocumentationForError(errorEntry, documentationChecks, workspace);
      
      if (explanation) {
        errorEntry.documentationSource = explanation.source;
        errorEntry.status = 'documentation_found';
        await this.saveErrorLog();
        return { found: true, explanation };
      }
    } catch (error) {
      console.warn('Local documentation check failed: ' + error.message);
    }

    return { found: false, documentationChecks };
  }

  /**
   * Search documentation for error explanation
   */
  async searchDocumentationForError(errorEntry, checks, workspace) {
    const searchTerm = errorEntry.message.substring(0, 50);

    if (checks.readme) {
      try {
        const readmeContent = await fs.readFile(path.join(workspace, 'README.md'), 'utf-8');
        if (readmeContent.toLowerCase().includes(searchTerm.toLowerCase())) {
          return { source: 'README.md', content: 'Error mentioned in README' };
        }
      } catch {}
    }

    if (checks.architecture) {
      try {
        const archContent = await fs.readFile(path.join(workspace, 'ARCHITECTURE.md'), 'utf-8');
        if (archContent.toLowerCase().includes(searchTerm.toLowerCase())) {
          return { source: 'ARCHITECTURE.md', content: 'Error mentioned in architecture docs' };
        }
      } catch {}
    }

    return null;
  }

  /**
   * Step 3: Internal Reasoning Pass
   */
  async internalReasoning(errorEntry) {
    const hypothesis = {
      cause: null,
      confidence: 0,
      validation: null
    };

    try {
      // Analyze against known patterns
      const knownPattern = this.findKnownPattern(errorEntry);
      if (knownPattern) {
        hypothesis.cause = 'Known pattern match';
        hypothesis.confidence = 0.9;
        hypothesis.validation = 'Pattern found in error_log.json';
        errorEntry.status = 'pattern_matched';
        await this.saveErrorLog();
        return { hypothesis, action: knownPattern.fix };
      }

      // Analyze against project architecture
      if (this.projectMemory) {
        const architectureAnalysis = this.analyzeAgainstArchitecture(errorEntry);
        if (architectureAnalysis) {
          hypothesis.cause = architectureAnalysis;
          hypothesis.confidence = 0.7;
        }
      }

      // Analyze against tool usage rules
      const toolAnalysis = this.analyzeAgainstToolRules(errorEntry);
      if (toolAnalysis) {
        hypothesis.cause = toolAnalysis;
        hypothesis.confidence = 0.6;
      }

      errorEntry.hypothesis = hypothesis;
      await this.saveErrorLog();
    } catch (error) {
      console.warn('Internal reasoning failed: ' + error.message);
    }

    return hypothesis;
  }

  /**
   * Find known error pattern
   */
  findKnownPattern(errorEntry) {
    for (const [pattern, data] of this.errorPatterns.entries()) {
      if (errorEntry.message.includes(pattern)) {
        return data;
      }
    }
    return null;
  }

  /**
   * Analyze against project architecture
   */
  analyzeAgainstArchitecture(errorEntry) {
    if (!this.projectMemory || !this.projectMemory.projectMap) {
      return null;
    }

    const map = this.projectMemory.projectMap;
    
    if (errorEntry.type === ERROR_TYPES.MISSING_FILE && map.structure) {
      return 'File may not exist in current project structure';
    }

    if (errorEntry.type === ERROR_TYPES.MISSING_IMPORT && map.conventions) {
      return 'Import may violate project conventions';
    }

    return null;
  }

  /**
   * Analyze against tool usage rules
   */
  analyzeAgainstToolRules(errorEntry) {
    if (errorEntry.type === ERROR_TYPES.TOOL_FAILURE) {
      return 'Tool may have been used incorrectly';
    }

    return null;
  }

  /**
   * Step 4: External Documentation Lookup
   */
  async lookupExternalDocumentation(errorEntry) {
    // This would search online documentation
    // For now, return a placeholder
    return {
      searched: false,
      message: 'External documentation lookup not yet implemented',
      suggestion: 'Consider searching official docs for: ' + errorEntry.type
    };
  }

  /**
   * Step 5: Intelligent Escalation
   */
  async intelligentEscalation(errorEntry) {
    const escalationSteps = [];

    try {
      // 1. Re-run project scan
      escalationSteps.push({ step: 'project_scan', status: 'skipped', reason: 'Not yet implemented' });

      // 2. Re-run dependency scan
      escalationSteps.push({ step: 'dependency_scan', status: 'skipped', reason: 'Not yet implemented' });

      // 3. Re-run UI geometry (if UI-related)
      if (errorEntry.type === ERROR_TYPES.UI_LAYOUT_ERROR) {
        escalationSteps.push({ step: 'ui_geometry_scan', status: 'skipped', reason: 'Not yet implemented' });
      }

      // 4. Re-run tool usage validation
      if (errorEntry.type === ERROR_TYPES.TOOL_FAILURE) {
        escalationSteps.push({ step: 'tool_validation', status: 'skipped', reason: 'Not yet implemented' });
      }

      // 5. Re-run SoC validation
      escalationSteps.push({ step: 'soc_validation', status: 'skipped', reason: 'Not yet implemented' });

      errorEntry.escalationSteps = escalationSteps;
      await this.saveErrorLog();
    } catch (error) {
      console.warn('Escalation failed: ' + error.message);
    }

    return escalationSteps;
  }

  /**
   * Step 6: Safe Fix Application & Verification
   */
  async applyFix(errorEntry, fix) {
    errorEntry.resolution = {
      applied: true,
      fix: fix,
      timestamp: new Date().toISOString(),
      verified: false
    };

    await this.saveErrorLog();

    // Verification would be implemented here
    return { applied: true, verified: false };
  }

  /**
   * Step 7: Error Prevention & Learning
   */
  async learnFromError(errorEntry, fix) {
    const patternKey = this.extractPatternKey(errorEntry);
    
    if (patternKey) {
      this.errorPatterns.set(patternKey, {
        pattern: patternKey,
        type: errorEntry.type,
        fix: fix,
        occurrences: (this.errorPatterns.get(patternKey)?.occurrences || 0) + 1,
        lastSeen: new Date().toISOString()
      });

      await this.saveErrorPatterns();
    }

    // Update project_map.json with error metadata
    if (this.projectMemory && this.projectMemory.projectMap) {
      if (!this.projectMemory.projectMap.errors) {
        this.projectMemory.projectMap.errors = [];
      }

      this.projectMemory.projectMap.errors.push({
        type: errorEntry.type,
        pattern: patternKey,
        fix: fix,
        timestamp: new Date().toISOString()
      });

      await this.projectMemory.saveProjectMap();
    }
  }

  /**
   * Extract pattern key from error
   */
  extractPatternKey(errorEntry) {
    const message = errorEntry.message;
    const words = message.split(' ').slice(0, 3).join(' ');
    return words.length > 5 ? words.substring(0, 50) : words;
  }

  /**
   * Main pipeline: Process error through all steps
   */
  async processError(error, context) {
    try {
      await this.initialize();

      // Step 1: Capture & Classify
      const errorEntry = await this.captureAndClassify(error, context);
      console.log('Error captured and classified: ' + errorEntry.type);

      // Step 2: Local Documentation Check
      const docCheck = await this.checkLocalDocumentation(errorEntry);
      if (docCheck.found) {
        console.log('Documentation found: ' + docCheck.explanation.source);
        return { resolved: true, method: 'documentation', explanation: docCheck.explanation };
      }

      // Step 3: Internal Reasoning
      const hypothesis = await this.internalReasoning(errorEntry);
      if (hypothesis.confidence >= 0.8) {
        console.log('High confidence hypothesis: ' + hypothesis.cause);
        return { resolved: true, method: 'internal_reasoning', hypothesis };
      }

      // Step 4: External Documentation Lookup
      const externalLookup = await this.lookupExternalDocumentation(errorEntry);
      
      // Step 5: Intelligent Escalation
      const escalation = await this.intelligentEscalation(errorEntry);

      // Step 6: Apply fix (if provided)
      // This would be done after user approval

      // Step 7: Learn from error
      // This would be done after fix is applied

      return {
        resolved: false,
        errorEntry,
        docCheck,
        hypothesis,
        externalLookup,
        escalation,
        message: 'Error requires manual resolution or user guidance'
      };
    } catch (error) {
      console.error('Error processing failed: ' + error.message);
      throw error;
    }
  }

  /**
   * Load error log from file
   */
  async loadErrorLog() {
    try {
      const data = await fs.readFile(ERROR_LOG_PATH, 'utf-8');
      this.errorLog = JSON.parse(data);
    } catch {
      this.errorLog = [];
    }
  }

  /**
   * Save error log to file
   */
  async saveErrorLog() {
    try {
      await fs.writeFile(ERROR_LOG_PATH, JSON.stringify(this.errorLog, null, 2), 'utf-8');
    } catch (error) {
      console.warn('Failed to save error log: ' + error.message);
    }
  }

  /**
   * Load error patterns from file
   */
  async loadErrorPatterns() {
    try {
      const patternsPath = path.join(__dirname, '..', 'error_patterns.json');
      const data = await fs.readFile(patternsPath, 'utf-8');
      const patterns = JSON.parse(data);
      this.errorPatterns = new Map(Object.entries(patterns));
    } catch {
      this.errorPatterns = new Map();
    }
  }

  /**
   * Save error patterns to file
   */
  async saveErrorPatterns() {
    try {
      const patternsPath = path.join(__dirname, '..', 'error_patterns.json');
      const patterns = Object.fromEntries(this.errorPatterns);
      await fs.writeFile(patternsPath, JSON.stringify(patterns, null, 2), 'utf-8');
    } catch (error) {
      console.warn('Failed to save error patterns: ' + error.message);
    }
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return 'ERR_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get error statistics
   */
  getStatistics() {
    const byType = {};
    const byStatus = {};

    for (const error of this.errorLog) {
      byType[error.type] = (byType[error.type] || 0) + 1;
      byStatus[error.status] = (byStatus[error.status] || 0) + 1;
    }

    return {
      totalErrors: this.errorLog.length,
      byType,
      byStatus,
      knownPatterns: this.errorPatterns.size
    };
  }
}

/**
 * Global error detection system instance
 */
let globalErrorDetectionSystem = null;

/**
 * Initialize global error detection system
 */
export async function initializeErrorDetectionSystem() {
  if (!globalErrorDetectionSystem) {
    globalErrorDetectionSystem = new ErrorDetectionSystem();
    await globalErrorDetectionSystem.initialize();
  }
  return globalErrorDetectionSystem;
}

/**
 * Get global error detection system
 */
export function getErrorDetectionSystem() {
  return globalErrorDetectionSystem;
}

/**
 * Quick check if error detection system is ready
 */
export function isErrorDetectionReady() {
  return globalErrorDetectionSystem !== null;
}
