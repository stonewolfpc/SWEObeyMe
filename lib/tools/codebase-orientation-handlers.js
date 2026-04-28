/**
 * Codebase Orientation handlers
 * These handlers analyze codebase structure for AI orientation
 */

import fs from 'fs/promises';
import path from 'path';
import {
  withTimeout,
  recordModuleAnnotations,
  recordDependencyImpact,
} from './codebase-orientation-utils.js';
import {
  detectProjectType,
  identifyEntryPoints,
  inferModuleStructure,
} from './codebase-orientation-analysis.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Handler: codebase_orientation
 */
export async function codebase_orientation_handler(args) {
  const projectRoot = args.project_root || process.cwd();

  try {
    const projectType = await detectProjectType(projectRoot);
    const entryPoints = await identifyEntryPoints(projectRoot, projectType);
    const modules = await inferModuleStructure(projectRoot);

    // Build directory structure (async with timeout)
    const directoryStructure = [];
    const visited = new Set();

    async function buildTree(dir, prefix = '', depth = 0) {
      if (depth > 50 || visited.has(dir)) return;
      visited.add(dir);

      try {
        const items = await withTimeout(
          fs.readdir(dir, { withFileTypes: true }),
          5000,
          `buildTree readdir ${dir}`
        );
        for (let index = 0; index < items.length; index++) {
          const item = items[index];
          if (item.name.startsWith('.') || item.name === 'node_modules') return;

          const isLast = index === items.length - 1;
          const itemPath = path.join(dir, item.name);
          const connector = isLast ? '└── ' : '├── ';

          directoryStructure.push(
            `${prefix}${connector}${item.name}${item.isDirectory() ? '/' : ''}`
          );

          if (item.isDirectory()) {
            await buildTree(itemPath, prefix + (isLast ? '    ' : '│   '), depth + 1);
          }
        }
      } catch {
        // Skip directories that can't be read
      }
    }
    await buildTree(projectRoot);

    return {
      success: true,
      project_root: projectRoot,
      project_type: projectType,
      entry_points: entryPoints,
      modules: modules,
      directory_structure: directoryStructure,
      summary: {
        total_modules: modules.length,
        total_entry_points: entryPoints.length,
        detected_languages: projectType.join(', '),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Handler: dependency_analysis
 */
export async function dependency_analysis_handler(args) {
  const projectRoot = args.project_root || process.cwd();

  try {
    const dependencies = new Map(); // file -> imports
    const importCounts = new Map(); // file -> number of times imported
    const externalDeps = new Set();

    // Find all code files (async with timeout)
    const codeFiles = [];
    const visited = new Set();

    async function findCodeFiles(dir, depth = 0) {
      if (depth > 50 || visited.has(dir)) return;
      visited.add(dir);

      try {
        const items = await withTimeout(
          fs.readdir(dir, { withFileTypes: true }),
          5000,
          `findCodeFiles readdir ${dir}`
        );
        for (const item of items) {
          if (item.name.startsWith('.') || item.name === 'node_modules') continue;

          const itemPath = path.join(dir, item.name);
          const ext = path.extname(item.name);

          if (item.isDirectory()) {
            await findCodeFiles(itemPath, depth + 1);
          } else if (
            [
              '.js',
              '.ts',
              '.jsx',
              '.tsx',
              '.py',
              '.java',
              '.cs',
              '.cpp',
              '.c',
              '.go',
              '.rs',
            ].includes(ext)
          ) {
            codeFiles.push(itemPath);
          }
        }
      } catch {
        // Skip directories that can't be read
      }
    }
    await findCodeFiles(projectRoot);

    // Analyze imports (async with timeout)
    for (const file of codeFiles) {
      try {
        const content = await withTimeout(
          fs.readFile(file, 'utf8'),
          10000,
          `dependency_analysis readFile ${file}`
        );
        const imports = [];

        // JavaScript/TypeScript imports - more precise patterns
        const jsImportRegex = /(?:import\s+(?:[\w\s*,{}*]+\s+from\s+)?)?['"]([^'"]+)['"]/g;
        let match;
        while ((match = jsImportRegex.exec(content)) !== null) {
          const importPath = match[1];
          // Filter out relative paths and built-ins for hub detection
          if (importPath && !importPath.startsWith('.') && !importPath.startsWith('node:')) {
            imports.push(importPath);
          }
        }

        // Python imports - more precise patterns
        const pyImportRegex = /(?:from\s+([^\s]+)\s+import|import\s+([^\s,]+))/g;
        while ((match = pyImportRegex.exec(content)) !== null) {
          const importPath = match[1] || match[2];
          if (importPath && !importPath.startsWith('.')) {
            imports.push(importPath);
          }
        }

        // Store dependencies
        dependencies.set(file, imports);
        imports.forEach((imp) => {
          importCounts.set(imp, (importCounts.get(imp) || 0) + 1);

          // Identify external dependencies
          if (imp.startsWith('@') || imp.includes('/') === false || imp.startsWith('node:')) {
            externalDeps.add(imp);
          }
        });
      } catch {
        // Skip files that can't be read
      }
    }

    // Find hub files (imported by many)
    const hubFiles = [];
    importCounts.forEach((count, file) => {
      if (count >= 3) {
        hubFiles.push({ file, importCount: count });
      }
    });
    hubFiles.sort((a, b) => b.importCount - a.importCount);

    // Record dependency impact for hub files
    await recordDependencyImpact(hubFiles, projectRoot);

    return {
      success: true,
      project_root: projectRoot,
      total_files_analyzed: codeFiles.length,
      hub_files: hubFiles.slice(0, 20), // Top 20 hub files
      external_dependencies: Array.from(externalDeps).slice(0, 50),
      summary: {
        total_dependencies: dependencies.size,
        total_external_deps: externalDeps.size,
        critical_hub_count: hubFiles.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Handler: entry_point_mapper
 */
export async function entry_point_mapper_handler(args) {
  const projectRoot = args.project_root || process.cwd();

  try {
    const projectType = await detectProjectType(projectRoot);
    const entryPoints = await identifyEntryPoints(projectRoot, projectType);
    const contracts = [];

    // Extract API contracts from entry points (async with timeout)
    for (const entry of entryPoints) {
      const entryPath = path.join(projectRoot, entry.file);
      try {
        const content = await withTimeout(
          fs.readFile(entryPath, 'utf8'),
          10000,
          `entry_point_mapper readFile ${entry.file}`
        );

        // Extract function signatures (more precise)
        const functionRegex =
          /(?:function\s+(\w+)\s*\(|export\s+(?:async\s+)?function\s+(\w+)\s*\(|const\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>)|let\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))/g;
        const functions = [];
        let match;
        while ((match = functionRegex.exec(content)) !== null) {
          const funcName = match[1] || match[2] || match[3] || match[4];
          if (funcName) functions.push(funcName);
        }

        // Extract exports
        const exportRegex = /export\s+(?:async\s+)?(?:function|const|class)\s+(\w+)/g;
        const exports = [];
        while ((match = exportRegex.exec(content)) !== null) {
          exports.push(match[1]);
        }

        // Extract module.exports
        const moduleExportRegex = /module\.exports\s*=\s*(?:\{([^}]+)\}|(\w+))/g;
        while ((match = moduleExportRegex.exec(content)) !== null) {
          if (match[1]) {
            // Handle object exports
            const objExports = match[1].split(',').map((e) => e.trim().split(':')[0]);
            exports.push(...objExports);
          } else if (match[2]) {
            exports.push(match[2]);
          }
        }

        contracts.push({
          file: entry.file,
          type: entry.type,
          functions: [...new Set(functions)], // Remove duplicates
          exports: [...new Set(exports)], // Remove duplicates
          line_count: content.split('\n').length,
        });
      } catch {
        // Skip files that can't be read
      }
    }

    return {
      success: true,
      project_root: projectRoot,
      entry_points: contracts,
      summary: {
        total_entry_points: contracts.length,
        total_functions: contracts.reduce((sum, c) => sum + c.functions.length, 0),
        total_exports: contracts.reduce((sum, c) => sum + c.exports.length, 0),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Handler: codebase_explore
 */
export async function codebase_explore_handler(args) {
  const { query, project_root } = args;
  const projectRoot = project_root || process.cwd();

  try {
    // Get architecture context
    const orientation = await codebase_orientation_handler({ project_root });

    // Get dependency context
    const deps = await dependency_analysis_handler({ project_root });

    // Record context annotations for non-standard modules
    await recordModuleAnnotations(orientation, projectRoot);

    // Simple keyword matching to guide exploration
    const queryLower = query.toLowerCase();
    const guidance = {
      entry_points: [],
      modules_to_consider: [],
      critical_dependencies: [],
      suggested_files: [],
    };

    // Match query to modules
    if (orientation.modules) {
      orientation.modules.forEach((mod) => {
        if (queryLower.includes(mod.type) || queryLower.includes(mod.path.split(path.sep).pop())) {
          guidance.modules_to_consider.push(mod);
        }
      });
    }

    // Match query to entry points
    if (orientation.entry_points) {
      orientation.entry_points.forEach((ep) => {
        if (
          queryLower.includes('main') ||
          queryLower.includes('start') ||
          queryLower.includes('init')
        ) {
          guidance.entry_points.push(ep);
        }
      });
    }

    // Include hub files as critical dependencies
    if (deps.hub_files) {
      guidance.critical_dependencies = deps.hub_files.slice(0, 5);
    }

    return {
      success: true,
      query: query,
      guidance: guidance,
      architecture_summary: {
        project_type: orientation.project_type,
        total_modules: orientation.modules?.length || 0,
        hub_files: deps.hub_files?.length || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
