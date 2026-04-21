/**
 * Project Awareness & Context Switching Layer
 *
 * This module provides automatic project detection, context switching,
 * and project-specific rule enforcement for the SWEObeyMe MCP server.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const PROJECT_REGISTRY_DIR = path.join(os.homedir(), '.sweobeyme', 'project_registry');
const PROJECTS_FILE = path.join(PROJECT_REGISTRY_DIR, 'projects.json');
const CURRENT_PROJECT_FILE = path.join(PROJECT_REGISTRY_DIR, 'current_project.json');

/**
 * Project type definitions and detection rules
 */
export const PROJECT_TYPES = {
  GODOT: 'godot',
  NODE: 'node',
  PYTHON: 'python',
  CSHARP: 'csharp',
  CPP: 'cpp',
  RUST: 'rust',
  GO: 'go',
  UNITY: 'unity',
  UNREAL: 'unreal',
  UNKNOWN: 'unknown',
};

/**
 * Project-specific rule sets
 */
export const PROJECT_RULE_SETS = {
  [PROJECT_TYPES.GODOT]: {
    name: 'Godot Project Rules',
    constraints: [
      'Do NOT reorganize folders',
      'Do NOT rename nodes',
      'Do NOT move scripts',
      'Do NOT break scene trees',
      'Follow Godot best practices tool',
      'Maintain autoload integrity',
      'Preserve resource linking',
    ],
    workflows: ['godot-detection', 'godot-practices', 'godot-workflow'],
    tools: ['detect_godot_project', 'check_godot_practices', 'godot_lookup'],
    socBoundaries: {
      allowed: ['scenes/', 'scripts/', 'resources/', 'autoloads/'],
      protected: ['project.godot', '.godot/'],
    },
  },
  [PROJECT_TYPES.NODE]: {
    name: 'Node/JavaScript Project Rules',
    constraints: [
      'Enforce dependency checks',
      'Enforce SoC (Separation of Concerns)',
      'Enforce module boundaries',
      'Follow npm/package.json conventions',
    ],
    workflows: ['node-dependency-check', 'module-boundaries'],
    tools: ['npm-audit', 'dependency-check'],
    socBoundaries: {
      allowed: ['src/', 'lib/', 'test/', 'node_modules/'],
      protected: ['package.json', 'package-lock.json'],
    },
  },
  [PROJECT_TYPES.PYTHON]: {
    name: 'Python Project Rules',
    constraints: [
      'Enforce PEP8',
      'Enforce module structure',
      'Enforce dependency checks',
      'Follow pyproject.toml conventions',
    ],
    workflows: ['python-pep8', 'python-module-structure'],
    tools: ['pylint', 'flake8', 'mypy'],
    socBoundaries: {
      allowed: ['src/', 'tests/', 'venv/', '.venv/'],
      protected: ['pyproject.toml', 'requirements.txt', 'setup.py'],
    },
  },
  [PROJECT_TYPES.CSHARP]: {
    name: 'C#/.NET Project Rules',
    constraints: [
      'Enforce namespace structure',
      'Enforce file-per-class',
      'Enforce SoC',
      'Follow .csproj conventions',
    ],
    workflows: ['csharp-namespace', 'csharp-structure'],
    tools: ['csharp-bridge', 'roslyn-analyzer'],
    socBoundaries: {
      allowed: ['src/', 'Models/', 'Views/', 'Controllers/', 'Services/'],
      protected: ['*.csproj', 'Solution.sln'],
    },
  },
  [PROJECT_TYPES.CPP]: {
    name: 'C++ Project Rules',
    constraints: [
      'Enforce header/source separation',
      'Enforce CMake conventions',
      'Follow C++ best practices',
    ],
    workflows: ['cpp-structure', 'cmake-build'],
    tools: ['clang-tidy', 'cppcheck'],
    socBoundaries: {
      allowed: ['include/', 'src/', 'tests/', 'build/'],
      protected: ['CMakeLists.txt', 'Makefile'],
    },
  },
  [PROJECT_TYPES.RUST]: {
    name: 'Rust Project Rules',
    constraints: [
      'Enforce Cargo conventions',
      'Follow Rust ownership rules',
      'Enforce module structure',
    ],
    workflows: ['rust-cargo', 'rust-ownership'],
    tools: ['cargo-clippy', 'cargo-fmt'],
    socBoundaries: {
      allowed: ['src/', 'tests/', 'benches/', 'examples/'],
      protected: ['Cargo.toml', 'Cargo.lock'],
    },
  },
  [PROJECT_TYPES.GO]: {
    name: 'Go Project Rules',
    constraints: [
      'Enforce go.mod conventions',
      'Follow Go module structure',
      'Enforce package boundaries',
    ],
    workflows: ['go-modules', 'go-structure'],
    tools: ['go vet', 'golint'],
    socBoundaries: {
      allowed: ['cmd/', 'pkg/', 'internal/', 'api/'],
      protected: ['go.mod', 'go.sum'],
    },
  },
  [PROJECT_TYPES.UNITY]: {
    name: 'Unity Project Rules',
    constraints: [
      'Do NOT reorganize Assets folder',
      'Follow Unity naming conventions',
      'Maintain prefab references',
      'Preserve scene hierarchy',
    ],
    workflows: ['unity-assets', 'unity-prefabs'],
    tools: ['unity-analyzer'],
    socBoundaries: {
      allowed: ['Assets/Scripts/', 'Assets/Models/', 'Assets/Materials/'],
      protected: ['Assets/', 'ProjectSettings/', 'Library/'],
    },
  },
  [PROJECT_TYPES.UNREAL]: {
    name: 'Unreal Project Rules',
    constraints: [
      'Do NOT reorganize Content folder',
      'Follow Unreal naming conventions',
      'Maintain blueprint references',
      'Preserve asset registry',
    ],
    workflows: ['unreal-content', 'unreal-blueprints'],
    tools: ['unreal-analyzer'],
    socBoundaries: {
      allowed: ['Content/Blueprints/', 'Content/Materials/', 'Source/'],
      protected: ['Content/', 'Config/', 'Intermediate/'],
    },
  },
};

/**
 * Project Awareness Manager class
 */
export class ProjectAwarenessManager {
  constructor() {
    this.currentProject = null;
    this.projects = new Map();
    this.ensureRegistryExists();
    this.loadProjects();
  }

  /**
   * Ensure the project registry directory exists
   */
  ensureRegistryExists() {
    if (!fs.existsSync(PROJECT_REGISTRY_DIR)) {
      fs.mkdirSync(PROJECT_REGISTRY_DIR, { recursive: true });
    }
    if (!fs.existsSync(PROJECTS_FILE)) {
      fs.writeFileSync(PROJECTS_FILE, JSON.stringify({ projects: [], lastUpdated: null, version: '1.0.0' }, null, 2));
    }
    if (!fs.existsSync(CURRENT_PROJECT_FILE)) {
      fs.writeFileSync(CURRENT_PROJECT_FILE, JSON.stringify({
        projectName: null,
        projectPath: null,
        projectType: null,
        activatedAt: null,
        lastFileTouched: null,
        activeRuleSet: null,
        activeWorkflows: [],
        activeTools: [],
        pendingTasks: [],
        warnings: [],
        errors: [],
      }, null, 2));
    }
  }

  /**
   * Load all projects from registry
   */
  loadProjects() {
    try {
      const data = fs.readFileSync(PROJECTS_FILE, 'utf8');
      const registry = JSON.parse(data);
      registry.projects.forEach(project => {
        this.projects.set(project.projectPath, project);
      });
    } catch (error) {
      console.error('[Project Awareness] Failed to load projects:', error);
    }
  }

  /**
   * Save projects to registry
   */
  saveProjects() {
    try {
      const registry = {
        projects: Array.from(this.projects.values()),
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
      };
      fs.writeFileSync(PROJECTS_FILE, JSON.stringify(registry, null, 2));
    } catch (error) {
      console.error('[Project Awareness] Failed to save projects:', error);
    }
  }

  /**
   * Save current project state
   */
  async saveCurrentProject() {
    try {
      await fs.writeFile(CURRENT_PROJECT_FILE, JSON.stringify(this.currentProject, null, 2));
    } catch (error) {
      console.error('[Project Awareness] Failed to save current project:', error);
    }
  }

  /**
   * Detect project type from directory
   */
  detectProjectType(projectPath) {
    const indicators = [
      { file: 'project.godot', type: PROJECT_TYPES.GODOT },
      { file: 'package.json', type: PROJECT_TYPES.NODE },
      { file: 'pyproject.toml', type: PROJECT_TYPES.PYTHON },
      { file: 'requirements.txt', type: PROJECT_TYPES.PYTHON },
      { file: 'CMakeLists.txt', type: PROJECT_TYPES.CPP },
      { file: 'Cargo.toml', type: PROJECT_TYPES.RUST },
      { file: 'go.mod', type: PROJECT_TYPES.GO },
      { dir: 'Assets', type: PROJECT_TYPES.UNITY },
      { dir: 'Content', type: PROJECT_TYPES.UNREAL },
    ];

    for (const indicator of indicators) {
      const checkPath = indicator.file
        ? path.join(projectPath, indicator.file)
        : path.join(projectPath, indicator.dir);

      if (fs.existsSync(checkPath)) {
        return indicator.type;
      }
    }

    // Check for .csproj files
    const files = fs.readdirSync(projectPath);
    if (files.some(f => f.endsWith('.csproj'))) {
      return PROJECT_TYPES.CSHARP;
    }

    return PROJECT_TYPES.UNKNOWN;
  }

  /**
   * Get or create a project entry
   */
  getOrCreateProject(projectPath) {
    let project = this.projects.get(projectPath);

    if (!project) {
      const projectType = this.detectProjectType(projectPath);
      const ruleSet = PROJECT_RULE_SETS[projectType] || null;

      project = {
        projectName: path.basename(projectPath),
        projectPath,
        projectType,
        activeWorkflows: ruleSet?.workflows || [],
        activeTools: ruleSet?.tools || [],
        socBoundaries: ruleSet?.socBoundaries || {},
        dependencyMap: {},
        uiMap: {},
        mathCorpusUsage: false,
        lastKnownState: 'active',
        pendingTasks: [],
        warnings: [],
        errors: [],
        lastModified: new Date().toISOString(),
      };

      this.projects.set(projectPath, project);
      this.saveProjects();
    }

    return project;
  }

  /**
   * Detect project switch and handle context switching
   */
  async detectProjectSwitch(filePath) {
    const projectPath = this.findProjectRoot(filePath);

    if (!projectPath) {
      return null;
    }

    const project = this.getOrCreateProject(projectPath);

    // Check if this is a different project
    if (!this.currentProject || this.currentProject.projectPath !== projectPath) {
      await this.switchProject(project);
    }

    // Update last file touched
    this.currentProject.lastFileTouched = filePath;
    await this.saveCurrentProject();

    return this.currentProject;
  }

  /**
   * Find project root from file path
   */
  findProjectRoot(filePath) {
    let currentPath = path.dirname(filePath);

    while (currentPath !== path.dirname(currentPath)) {
      // Check for project indicators
      const indicators = ['project.godot', 'package.json', 'pyproject.toml',
        'requirements.txt', 'CMakeLists.txt', 'Cargo.toml',
        'go.mod', '.git'];

      for (const indicator of indicators) {
        if (fs.existsSync(path.join(currentPath, indicator))) {
          return currentPath;
        }
      }

      currentPath = path.dirname(currentPath);
    }

    return null;
  }

  /**
   * Switch to a different project
   */
  async switchProject(newProject) {
    // Save current project state if exists
    if (this.currentProject) {
      const oldProject = this.projects.get(this.currentProject.projectPath);
      if (oldProject) {
        oldProject.pendingTasks = this.currentProject.pendingTasks;
        oldProject.warnings = this.currentProject.warnings;
        oldProject.errors = this.currentProject.errors;
        oldProject.lastKnownState = 'saved';
        oldProject.lastModified = new Date().toISOString();
        this.saveProjects();
      }
    }

    // Load new project state
    this.currentProject = {
      projectName: newProject.projectName,
      projectPath: newProject.projectPath,
      projectType: newProject.projectType,
      activatedAt: new Date().toISOString(),
      lastFileTouched: null,
      activeRuleSet: PROJECT_RULE_SETS[newProject.projectType]?.name || null,
      activeWorkflows: [...(newProject.activeWorkflows || [])],
      activeTools: [...(newProject.activeTools || [])],
      pendingTasks: [...(newProject.pendingTasks || [])],
      warnings: [...(newProject.warnings || [])],
      errors: [...(newProject.errors || [])],
    };

    await this.saveCurrentProject();

    // Announce project switch
    return `Project switch detected. Loading the correct rule set, tools, and workflows for ${newProject.projectName}.`;
  }

  /**
   * Validate action before execution
   */
  validateAction(action, filePath) {
    if (!this.currentProject) {
      return { valid: true, reason: 'No active project' };
    }

    const projectType = this.currentProject.projectType;
    const ruleSet = PROJECT_RULE_SETS[projectType];

    if (!ruleSet) {
      return { valid: true, reason: 'No rule set for this project type' };
    }

    // Check if action violates project constraints
    const relativePath = path.relative(this.currentProject.projectPath, filePath);

    // Check if trying to modify protected files
    if (ruleSet.socBoundaries.protected) {
      for (const protectedPath of ruleSet.socBoundaries.protected) {
        if (relativePath.startsWith(protectedPath) ||
            (protectedPath.includes('*') && relativePath.endsWith(protectedPath.replace('*', '')))) {
          return {
            valid: false,
            reason: `Cannot modify protected file/directory: ${protectedPath} in ${projectType} project`,
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Get current project info
   */
  getCurrentProject() {
    return this.currentProject;
  }

  /**
   * Get project-specific rules
   */
  getProjectRules(projectType) {
    return PROJECT_RULE_SETS[projectType] || null;
  }

  /**
   * Add pending task to current project
   */
  async addPendingTask(task) {
    if (this.currentProject) {
      this.currentProject.pendingTasks.push(task);
      await this.saveCurrentProject();
    }
  }

  /**
   * Add warning to current project
   */
  async addWarning(warning) {
    if (this.currentProject) {
      this.currentProject.warnings.push({
        message: warning,
        timestamp: new Date().toISOString(),
      });
      await this.saveCurrentProject();
    }
  }

  /**
   * Add error to current project
   */
  async addError(error) {
    if (this.currentProject) {
      this.currentProject.errors.push({
        message: error,
        timestamp: new Date().toISOString(),
      });
      await this.saveCurrentProject();
    }
  }

  /**
   * Clear pending tasks
   */
  async clearPendingTasks() {
    if (this.currentProject) {
      this.currentProject.pendingTasks = [];
      await this.saveCurrentProject();
    }
  }
}

// Singleton instance
let projectAwarenessInstance = null;

export function getProjectAwarenessManager() {
  if (!projectAwarenessInstance) {
    projectAwarenessInstance = new ProjectAwarenessManager();
  }
  return projectAwarenessInstance;
}
