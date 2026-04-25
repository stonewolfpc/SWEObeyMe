/**
 * Project Scanner Module
 * Performs comprehensive project scanning including file enumeration, code smells, digital debt, architecture drift detection
 */

import fs from 'fs/promises';
import path from 'path';
import { getProjectMemory, initializeProjectMemory } from './project-memory.js';

/**
 * Project scanner class
 */
export class ProjectScanner {
  constructor(workspacePath) {
    this.workspacePath = workspacePath;
    this.scanResults = {
      files: [],
      folders: [],
      fileSizes: new Map(),
      fileTypes: new Map(),
      codeSmells: [],
      digitalDebt: [],
      architectureDrift: [],
      missingDocumentation: [],
      unusedFiles: [],
      inconsistentNaming: [],
      missingTests: [],
      missingModuleBoundaries: [],
    };
  }

  /**
   * Perform full project scan
   */
  async scan() {
    try {
      console.log('Starting full project scan...');

      // Enumerate all files and folders
      await this.enumerateFiles();

      // Detect file sizes and types
      await this.analyzeFileMetadata();

      // Detect code smells
      await this.detectCodeSmells();

      // Detect digital debt
      await this.detectDigitalDebt();

      // Detect architecture drift
      await this.detectArchitectureDrift();

      // Detect missing documentation
      await this.detectMissingDocumentation();

      // Detect unused files
      await this.detectUnusedFiles();

      // Detect inconsistent naming
      await this.detectInconsistentNaming();

      // Detect missing tests
      await this.detectMissingTests();

      // Detect missing module boundaries
      await this.detectMissingModuleBoundaries();

      console.log('Project scan complete.');
      return this.scanResults;
    } catch (error) {
      console.error(`Project scan failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enumerate all files and folders
   */
  async enumerateFiles() {
    const files = [];
    const folders = [];

    async function traverse(dir, relativePath = '') {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relPath = path.join(relativePath, entry.name);

          if (entry.isDirectory()) {
            // Skip node_modules, .git, etc.
            if (['node_modules', '.git', '.vscode', 'dist', 'build'].includes(entry.name)) {
              continue;
            }

            folders.push(relPath);
            await traverse(fullPath, relPath);
          } else if (entry.isFile()) {
            files.push(relPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }

    await traverse(this.workspacePath);

    this.scanResults.files = files;
    this.scanResults.folders = folders;
  }

  /**
   * Analyze file metadata (sizes, types)
   */
  async analyzeFileMetadata() {
    for (const file of this.scanResults.files) {
      try {
        const fullPath = path.join(this.workspacePath, file);
        const stats = await fs.stat(fullPath);
        const ext = path.extname(file).substring(1);

        this.scanResults.fileSizes.set(file, stats.size);
        this.scanResults.fileTypes.set(ext, (this.scanResults.fileTypes.get(ext) || 0) + 1);
      } catch (error) {
        // Skip files we can't read
      }
    }
  }

  /**
   * Detect code smells
   */
  async detectCodeSmells() {
    const codeSmells = [];

    for (const file of this.scanResults.files) {
      const ext = path.extname(file);

      if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c'].includes(ext)) {
        try {
          const fullPath = path.join(this.workspacePath, file);
          const content = await fs.readFile(fullPath, 'utf-8');
          const lines = content.split('\n');

          // Deep nesting
          const maxNesting = lines.reduce((max, line) => {
            const depth = (line.match(/ {2}|\t/g) || []).length;
            return Math.max(max, depth);
          }, 0);

          if (maxNesting > 5) {
            codeSmells.push({
              file,
              type: 'deep_nesting',
              severity: 'high',
              message: `Deep nesting detected (max depth: ${maxNesting})`,
            });
          }

          // Long functions (simplified detection)
          const lineCount = lines.length;
          if (lineCount > 500) {
            codeSmells.push({
              file,
              type: 'long_file',
              severity: 'medium',
              message: `File exceeds 500 lines (${lineCount} lines)`,
            });
          }

          // Silent catch blocks
          if (content.includes('catch') && content.includes('{}')) {
            codeSmells.push({
              file,
              type: 'silent_catch',
              severity: 'high',
              message: 'Silent catch block detected',
            });
          }
        } catch (error) {
          // Skip files we can't read
        }
      }
    }

    this.scanResults.codeSmells = codeSmells;
  }

  /**
   * Detect digital debt
   */
  async detectDigitalDebt() {
    const digitalDebt = [];

    // Files without comments (simplified)
    for (const file of this.scanResults.files) {
      const ext = path.extname(file);

      if (['.js', '.ts', '.jsx', '.tsx', '.py'].includes(ext)) {
        try {
          const fullPath = path.join(this.workspacePath, file);
          const content = await fs.readFile(fullPath, 'utf-8');
          const lines = content.split('\n');
          const commentLines = lines.filter(
            (line) =>
              line.trim().startsWith('//') ||
              line.trim().startsWith('/*') ||
              line.trim().startsWith('*')
          );

          const ratio = commentLines.length / lines.length;
          if (ratio < 0.1 && lines.length > 20) {
            digitalDebt.push({
              file,
              type: 'low_documentation',
              severity: 'medium',
              message: `Low documentation ratio (${(ratio * 100).toFixed(1)}%)`,
            });
          }
        } catch (error) {
          // Skip files we can't read
        }
      }
    }

    this.scanResults.digitalDebt = digitalDebt;
  }

  /**
   * Detect architecture drift
   */
  async detectArchitectureDrift() {
    const architectureDrift = [];

    // Check for files in root that shouldn't be there
    const rootFiles = this.scanResults.files.filter((f) => !f.includes(path.sep));
    const allowedRootFiles = [
      'README',
      'LICENSE',
      'package.json',
      '.gitignore',
      '.env',
      'project_map.json',
    ];

    for (const file of rootFiles) {
      const basename = path.basename(file);
      if (!allowedRootFiles.some((allowed) => basename.includes(allowed))) {
        architectureDrift.push({
          file,
          type: 'file_in_root',
          severity: 'high',
          message: `File "${basename}" in root directory should be in a subfolder`,
        });
      }
    }

    this.scanResults.architectureDrift = architectureDrift;
  }

  /**
   * Detect missing documentation
   */
  async detectMissingDocumentation() {
    const missingDocs = [];

    // Check for missing README
    const hasReadme = this.scanResults.files.some((f) => f.toLowerCase().includes('readme'));

    if (!hasReadme) {
      missingDocs.push({
        type: 'missing_readme',
        severity: 'high',
        message: 'No README.md file found',
      });
    }

    // Check for missing docs folder
    const hasDocsFolder = this.scanResults.folders.some((f) => f.toLowerCase() === 'docs');

    if (!hasDocsFolder) {
      missingDocs.push({
        type: 'missing_docs_folder',
        severity: 'medium',
        message: 'No docs/ folder found',
      });
    }

    this.scanResults.missingDocumentation = missingDocs;
  }

  /**
   * Detect unused files
   */
  async detectUnusedFiles() {
    const unusedFiles = [];

    // Simplified: check for .bak, .tmp files
    for (const file of this.scanResults.files) {
      const ext = path.extname(file);
      if (['.bak', '.tmp', '.old', '.swp'].includes(ext)) {
        unusedFiles.push({
          file,
          type: 'temporary_file',
          severity: 'low',
          message: 'Temporary/backup file detected',
        });
      }
    }

    this.scanResults.unusedFiles = unusedFiles;
  }

  /**
   * Detect inconsistent naming
   */
  async detectInconsistentNaming() {
    const inconsistentNaming = [];

    // Check for mixed naming conventions in same folder
    const folderGroups = new Map();

    for (const file of this.scanResults.files) {
      const folder = path.dirname(file);
      if (!folderGroups.has(folder)) {
        folderGroups.set(folder, []);
      }
      folderGroups.get(folder).push(file);
    }

    for (const [folder, files] of folderGroups) {
      const hasCamelCase = files.some((f) => /[A-Z]/.test(path.basename(f, path.extname(f))));
      const hasKebabCase = files.some((f) => /-/.test(f));
      const hasSnakeCase = files.some((f) => /_/.test(f));

      const conventions = [];
      if (hasCamelCase) conventions.push('camelCase');
      if (hasKebabCase) conventions.push('kebab-case');
      if (hasSnakeCase) conventions.push('snake_case');

      if (conventions.length > 1) {
        inconsistentNaming.push({
          folder,
          type: 'mixed_naming',
          severity: 'medium',
          message: `Mixed naming conventions detected: ${conventions.join(', ')}`,
        });
      }
    }

    this.scanResults.inconsistentNaming = inconsistentNaming;
  }

  /**
   * Detect missing tests
   */
  async detectMissingTests() {
    const missingTests = [];

    // Check for test folder
    const hasTestFolder = this.scanResults.folders.some((f) => f.toLowerCase().includes('test'));

    if (!hasTestFolder) {
      missingTests.push({
        type: 'missing_test_folder',
        severity: 'medium',
        message: 'No test folder found',
      });
    }

    // Check for source files without corresponding tests
    const sourceFiles = this.scanResults.files.filter(
      (f) =>
        ['.js', '.ts', '.py', '.java'].includes(path.extname(f)) &&
        !f.includes('test') &&
        !f.includes('spec')
    );

    const testFiles = this.scanResults.files.filter(
      (f) => f.includes('test') || f.includes('spec')
    );

    if (sourceFiles.length > 5 && testFiles.length === 0) {
      missingTests.push({
        type: 'no_tests',
        severity: 'high',
        message: `Found ${sourceFiles.length} source files but no tests`,
      });
    }

    this.scanResults.missingTests = missingTests;
  }

  /**
   * Detect missing module boundaries
   */
  async detectMissingModuleBoundaries() {
    const missingBoundaries = [];

    // Check for flat structure (many files in root or single folder)
    const rootFileCount = this.scanResults.files.filter((f) => !f.includes(path.sep)).length;
    const libFileCount = this.scanResults.files.filter(
      (f) => f.startsWith('lib') || f.startsWith('src')
    ).length;

    if (rootFileCount > 10) {
      missingBoundaries.push({
        type: 'flat_structure',
        severity: 'high',
        message: `Flat structure detected (${rootFileCount} files in root or immediate subfolders)`,
      });
    }

    this.scanResults.missingModuleBoundaries = missingBoundaries;
  }

  /**
   * Get scan summary
   */
  getSummary() {
    return {
      totalFiles: this.scanResults.files.length,
      totalFolders: this.scanResults.folders.length,
      codeSmells: this.scanResults.codeSmells.length,
      digitalDebt: this.scanResults.digitalDebt.length,
      architectureDrift: this.scanResults.architectureDrift.length,
      missingDocumentation: this.scanResults.missingDocumentation.length,
      unusedFiles: this.scanResults.unusedFiles.length,
      inconsistentNaming: this.scanResults.inconsistentNaming.length,
      missingTests: this.scanResults.missingTests.length,
      missingModuleBoundaries: this.scanResults.missingModuleBoundaries.length,
    };
  }
}

/**
 * Global project scanner instance
 */
let globalProjectScanner = null;

/**
 * Initialize project scanner for workspace
 */
export function initializeProjectScanner(workspacePath) {
  if (!globalProjectScanner) {
    globalProjectScanner = new ProjectScanner(workspacePath);
  }

  return globalProjectScanner;
}

/**
 * Get global project scanner instance
 */
export function getProjectScanner() {
  return globalProjectScanner;
}
