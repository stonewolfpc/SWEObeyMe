/**
 * Core Project Memory class structure
 *
 * This module provides the core ProjectMemory class for maintaining awareness of
 * project structure, conventions, and decisions. It integrates with project_map.json
 * as the source of truth for architectural rules and project organization.
 *
 * @module project-memory-core
 */

import fs from 'fs/promises';
import path from 'path';
import { sessionMemory, recordAction } from './session.js';

/**
 * ProjectMemory class manages persistent project structure, conventions, and decisions
 *
 * This class provides methods to:
 * - Load and save project memory from/to disk
 * - Index project structure (directories and files)
 * - Analyze naming conventions
 * - Record architectural decisions
 * - Track file purposes
 * - Maintain project map as source of truth
 *
 * @class
 */
export class ProjectMemory {
  /**
   * Creates a new ProjectMemory instance
   *
   * @param {string} workspacePath - Absolute path to the workspace directory
   */
  constructor(workspacePath) {
    this.workspacePath = workspacePath;
    this.memory = {
      structure: {
        directories: new Map(),
        files: new Map(),
        lastIndexed: null,
      },
      conventions: {
        naming: new Map(),
        structure: new Map(),
        imports: new Map(),
        lastAnalyzed: null,
      },
      decisions: [],
      filePurposes: new Map(),
      lastUpdated: Date.now(),
    };
    this.memoryPath = path.join(workspacePath, '.sweobeyme-memory.json');
    this.projectMapPath = path.join(workspacePath, 'project_map.json');
    this.projectMap = null;
  }

  /**
   * Load project memory from disk
   *
   * Reads the .sweobeyme-memory.json file and deserializes Maps from JSON.
   * Also loads the project_map.json as the source of truth.
   *
   * @returns {Promise<boolean>} True if loaded successfully, false if file doesn't exist or is corrupted
   */
  async load() {
    try {
      const data = await fs.readFile(this.memoryPath, 'utf-8');
      const loaded = JSON.parse(data);

      // Convert Maps back from objects
      this.memory.structure.directories = new Map(loaded.structure.directories);
      this.memory.structure.files = new Map(loaded.structure.files);
      this.memory.conventions.naming = new Map(loaded.conventions.naming);
      this.memory.conventions.structure = new Map(loaded.conventions.structure);
      this.memory.conventions.imports = new Map(loaded.conventions.imports);
      this.memory.filePurposes = new Map(loaded.filePurposes);
      this.memory.decisions = loaded.decisions || [];

      // Load project map if exists
      await this.loadProjectMap();

      return true;
    } catch (error) {
      // Memory file doesn't exist or is corrupted - start fresh
      return false;
    }
  }

  /**
   * Load project_map.json as source of truth
   *
   * Reads the project_map.json file and syncs memory structure with it.
   * If the file doesn't exist, creates a default project map.
   *
   * @returns {Promise<boolean>} True if loaded successfully, false if file doesn't exist
   */
  async loadProjectMap() {
    try {
      const data = await fs.readFile(this.projectMapPath, 'utf-8');
      this.projectMap = JSON.parse(data);

      // Sync memory structure with project map
      if (this.projectMap.structure) {
        if (this.projectMap.structure.folders) {
          this.memory.structure.directories = new Map(
            Object.entries(this.projectMap.structure.folders).map(([key, value]) => [key, value]),
          );
        }
        if (this.projectMap.structure.files) {
          this.memory.structure.files = new Map(
            Object.entries(this.projectMap.structure.files).map(([key, value]) => [key, value]),
          );
        }
      }

      return true;
    } catch (error) {
      // Project map doesn't exist - create default
      this.projectMap = this.createDefaultProjectMap();
      return false;
    }
  }

  /**
   * Create default project map structure
   *
   * Creates a default project map with common architectural rules,
   * domain definitions, and heuristics for code organization.
   *
   * @returns {Object} Default project map object
   */
  createDefaultProjectMap() {
    return {
      version: '1.0.0',
      project: {
        name: path.basename(this.workspacePath),
        description: '',
        rootDomain: '',
      },
      structure: {
        folders: {},
        files: {},
      },
      conventions: {
        naming: {
          files: {},
          folders: {},
          modules: {},
        },
        domains: {
          auth: {
            folder: 'auth/',
            purpose: 'Authentication and authorization logic',
            allowedFileTypes: ['service', 'controller', 'model', 'middleware'],
            testLocation: 'tests/auth/',
          },
          database: {
            folder: 'database/',
            purpose: 'Database connections, migrations, and queries',
            allowedFileTypes: ['migration', 'seed', 'connection', 'repository'],
            testLocation: 'tests/database/',
          },
          models: {
            folder: 'models/',
            purpose: 'Data models and schemas',
            allowedFileTypes: ['model', 'schema', 'interface'],
            testLocation: 'tests/models/',
          },
          services: {
            folder: 'services/',
            purpose: 'Business logic and service layer',
            allowedFileTypes: ['service', 'manager', 'handler'],
            testLocation: 'tests/services/',
          },
          controllers: {
            folder: 'controllers/',
            purpose: 'HTTP request handlers and routing',
            allowedFileTypes: ['controller', 'router', 'endpoint'],
            testLocation: 'tests/controllers/',
          },
          utils: {
            folder: 'utils/',
            purpose: 'Utility functions and helpers',
            allowedFileTypes: ['util', 'helper', 'constant'],
            testLocation: 'tests/utils/',
          },
          interfaces: {
            folder: 'interfaces/',
            purpose: 'API contracts and type definitions',
            allowedFileTypes: ['interface', 'type', 'contract'],
            testLocation: 'tests/interfaces/',
          },
        },
        architecturalBoundaries: {
          root: {
            allowedItems: ['README', 'LICENSE', 'project_map.json', 'package.json', '.gitignore', '.env'],
            description: 'Root directory may only contain configuration and documentation',
          },
          src: {
            allowedItems: ['lib/', 'src/', 'dist/', 'build/', 'tests/', 'docs/'],
            description: 'Source code organization',
          },
        },
      },
      rules: {
        separationOfConcerns: {
          maxConceptualUnitsPerFile: 1,
          maxLinesPerFile: 700,
          minLinesForSplit: 200,
          requireDistinctDomains: true,
        },
        naming: {
          enforceCamelCase: true,
          enforcePascalCaseForClasses: true,
          enforceSnakeCaseForConstants: true,
          enforceKebabCaseForFiles: true,
        },
        documentation: {
          requireFilePurpose: true,
          requireModuleDomain: true,
          updateOnStructuralChange: true,
        },
      },
      heuristics: {
        conceptualUnitDetection: {
          indicators: [
            'class definitions',
            'interface definitions',
            'function groups with distinct purposes',
            'data structures',
            'configuration blocks',
          ],
        },
        domainDetection: {
          indicators: [
            'auth-related keywords (login, user, session, token)',
            'database-related keywords (query, migration, schema, connection)',
            'http-related keywords (request, response, controller, router)',
            'business-logic keywords (service, manager, handler)',
          ],
        },
        submoduleCreation: {
          triggers: [
            'file exceeds 500 lines',
            'module has more than 10 related files',
            'domain complexity increases',
            'circular dependencies detected',
          ],
        },
      },
      audit: {
        lastUpdated: new Date().toISOString(),
        lastValidation: new Date().toISOString(),
        driftDetected: false,
        driftDetails: [],
      },
    };
  }

  /**
   * Save project map to disk
   *
   * Syncs the project map structure with current memory and writes to disk.
   *
   * @returns {Promise<boolean>} True if saved successfully, false otherwise
   */
  async saveProjectMap() {
    try {
      // Sync project map structure with memory
      if (!this.projectMap) {
        this.projectMap = this.createDefaultProjectMap();
      }

      this.projectMap.structure.folders = Object.fromEntries(this.memory.structure.directories);
      this.projectMap.structure.files = Object.fromEntries(this.memory.structure.files);
      this.projectMap.audit.lastUpdated = new Date().toISOString();

      await fs.writeFile(this.projectMapPath, JSON.stringify(this.projectMap, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error(`Failed to save project map: ${error.message}`);
      return false;
    }
  }

  /**
   * Save project memory to disk
   *
   * Serializes Maps to arrays and writes memory to .sweobeyme-memory.json.
   * Also saves the project map as the source of truth.
   *
   * @returns {Promise<boolean>} True if saved successfully, false otherwise
   */
  async save() {
    try {
      const toSave = {
        structure: {
          directories: Array.from(this.memory.structure.directories.entries()),
          files: Array.from(this.memory.structure.files.entries()),
          lastIndexed: this.memory.structure.lastIndexed,
        },
        conventions: {
          naming: Array.from(this.memory.conventions.naming.entries()),
          structure: Array.from(this.memory.conventions.structure.entries()),
          imports: Array.from(this.memory.conventions.imports.entries()),
          lastAnalyzed: this.memory.conventions.lastAnalyzed,
        },
        decisions: this.memory.decisions,
        filePurposes: Array.from(this.memory.filePurposes.entries()),
        lastUpdated: Date.now(),
      };

      await fs.writeFile(this.memoryPath, JSON.stringify(toSave, null, 2), 'utf-8');

      // Also save project map as source of truth
      await this.saveProjectMap();

      return true;
    } catch (error) {
      console.error(`Failed to save project memory: ${error.message}`);
      return false;
    }
  }

  /**
   * Record a decision
   *
   * Records an architectural decision with timestamp and session context.
   * Keeps only the last 100 decisions to prevent memory bloat.
   *
   * @param {string} decision - The decision description
   */
  recordDecision(decision) {
    this.memory.decisions.push({
      decision,
      timestamp: Date.now(),
      sessionContext: {
        integrityScore: sessionMemory.integrityScore,
        consecutiveFailures: sessionMemory.consecutiveFailures,
      },
    });

    // Keep only last 100 decisions
    if (this.memory.decisions.length > 100) {
      this.memory.decisions = this.memory.decisions.slice(-100);
    }

    this.memory.lastUpdated = Date.now();
  }

  /**
   * Set file purpose
   *
   * Records the purpose of a file with a timestamp.
   *
   * @param {string} filePath - Absolute path to the file
   * @param {string} purpose - The purpose description
   */
  setFilePurpose(filePath, purpose) {
    this.memory.filePurposes.set(filePath, {
      purpose,
      timestamp: Date.now(),
    });
    this.memory.lastUpdated = Date.now();
  }

  /**
   * Get file purpose
   *
   * Retrieves the purpose of a file.
   *
   * @param {string} filePath - Absolute path to the file
   * @returns {Object|undefined} File purpose object with purpose and timestamp
   */
  getFilePurpose(filePath) {
    return this.memory.filePurposes.get(filePath);
  }

  /**
   * Get project summary
   *
   * Returns a summary of the project memory including structure stats,
   * conventions, decisions, and last updated timestamp.
   *
   * @returns {Object} Project summary object
   */
  getSummary() {
    return {
      structure: {
        totalDirectories: this.memory.structure.directories.size,
        totalFiles: this.memory.structure.files.size,
        lastIndexed: this.memory.structure.lastIndexed,
      },
      conventions: {
        namingPatterns: Object.fromEntries(this.memory.conventions.naming),
        lastAnalyzed: this.memory.conventions.lastAnalyzed,
      },
      decisions: {
        total: this.memory.decisions.length,
        recent: this.memory.decisions.slice(-5),
      },
      lastUpdated: this.memory.lastUpdated,
    };
  }
}
