/**
 * Codebase Orientation handlers
 * These handlers analyze codebase structure for AI orientation
 */

import fs from 'fs/promises';
import path from 'path';
import { getProjectMemoryManager } from '../project-memory-system.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Detect project type from directory structure and files
 */
function detectProjectType(rootPath) {
  const indicators = {
    javascript: ['package.json', 'node_modules', '.nvmrc'],
    typescript: ['tsconfig.json', 'package.json'],
    python: ['requirements.txt', 'setup.py', 'pyproject.toml', 'Pipfile'],
    java: ['pom.xml', 'build.gradle', 'src/main/java'],
    csharp: ['.csproj', 'sln', 'src'],
    cpp: ['CMakeLists.txt', 'Makefile', 'src'],
    go: ['go.mod', 'go.sum'],
    rust: ['Cargo.toml', 'Cargo.lock'],
    ruby: ['Gemfile', 'Rakefile'],
    php: ['composer.json', 'composer.lock'],
  };

  const files = fs.readdirSync(rootPath);
  let detected = [];

  for (const [lang, indicatorsList] of Object.entries(indicators)) {
    if (indicatorsList.some(ind => files.includes(ind) || fs.existsSync(path.join(rootPath, ind)))) {
      detected.push(lang);
    }
  }

  return detected.length > 0 ? detected : ['unknown'];
}

/**
 * Identify entry points based on project type
 */
function identifyEntryPoints(rootPath, projectType) {
  const entryPoints = [];

  if (projectType.includes('javascript') || projectType.includes('typescript')) {
    const commonEntries = ['index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts', 'server.js', 'server.ts'];
    commonEntries.forEach(entry => {
      const entryPath = path.join(rootPath, entry);
      if (fs.existsSync(entryPath)) {
        entryPoints.push({ file: entry, type: 'main' });
      }
    });

    // Check src directory
    const srcPath = path.join(rootPath, 'src');
    if (fs.existsSync(srcPath)) {
      const srcEntries = ['index.js', 'index.ts', 'main.js', 'main.ts'];
      srcEntries.forEach(entry => {
        const entryPath = path.join(srcPath, entry);
        if (fs.existsSync(entryPath)) {
          entryPoints.push({ file: `src/${entry}`, type: 'main' });
        }
      });
    }
  }

  if (projectType.includes('python')) {
    const commonEntries = ['main.py', 'app.py', 'run.py', '__main__.py'];
    commonEntries.forEach(entry => {
      const entryPath = path.join(rootPath, entry);
      if (fs.existsSync(entryPath)) {
        entryPoints.push({ file: entry, type: 'main' });
      }
    });

    // Check src directory
    const srcPath = path.join(rootPath, 'src');
    if (fs.existsSync(srcPath)) {
      const srcEntries = ['main.py', '__main__.py'];
      srcEntries.forEach(entry => {
        const entryPath = path.join(srcPath, entry);
        if (fs.existsSync(entryPath)) {
          entryPoints.push({ file: `src/${entry}`, type: 'main' });
        }
      });
    }
  }

  return entryPoints;
}

/**
 * Infer module structure from directory layout
 */
function inferModuleStructure(rootPath) {
  const modules = [];
  const dirs = [];

  // Get all directories
  function getDirectories(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    items.forEach(item => {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        dirs.push(fullPath);
        getDirectories(fullPath);
      }
    });
  }

  getDirectories(rootPath);

  // Infer module responsibilities from directory names
  const modulePatterns = {
    api: ['api', 'routes', 'controllers', 'handlers', 'endpoints'],
    domain: ['domain', 'models', 'entities', 'business', 'logic'],
    infrastructure: ['infrastructure', 'config', 'database', 'db', 'storage'],
    ui: ['ui', 'components', 'views', 'templates', 'frontend', 'client'],
    utils: ['utils', 'helpers', 'common', 'shared', 'lib'],
    tests: ['tests', 'test', '__tests__', 'spec', 'specs'],
    docs: ['docs', 'documentation', 'doc'],
  };

  dirs.forEach(dir => {
    const relativePath = path.relative(rootPath, dir);
    const dirName = path.basename(dir);

    for (const [type, patterns] of Object.entries(modulePatterns)) {
      if (patterns.some(pattern => dirName.toLowerCase().includes(pattern))) {
        modules.push({
          path: relativePath,
          type: type,
          inferredResponsibility: `${type} layer - contains ${type} related code`,
        });
        break;
      }
    }
  });

  return modules;
}

/**
 * Handler: codebase_orientation
 */
export async function codebase_orientation_handler(args) {
  const projectRoot = args.project_root || process.cwd();

  try {
    const projectType = detectProjectType(projectRoot);
    const entryPoints = identifyEntryPoints(projectRoot, projectType);
    const modules = inferModuleStructure(projectRoot);

    // Build directory structure
    const directoryStructure = [];
    function buildTree(dir, prefix = '') {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      items.forEach((item, index) => {
        if (item.name.startsWith('.') || item.name === 'node_modules') return;
        
        const isLast = index === items.length - 1;
        const itemPath = path.join(dir, item.name);
        const connector = isLast ? '└── ' : '├── ';
        
        directoryStructure.push(`${prefix}${connector}${item.name}${item.isDirectory() ? '/' : ''}`);
        
        if (item.isDirectory()) {
          buildTree(itemPath, prefix + (isLast ? '    ' : '│   '));
        }
      });
    }
    buildTree(projectRoot);

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

    // Find all code files
    const codeFiles = [];
    function findCodeFiles(dir) {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      items.forEach(item => {
        if (item.name.startsWith('.') || item.name === 'node_modules') return;
        
        const itemPath = path.join(dir, item.name);
        const ext = path.extname(item.name);
        
        if (item.isDirectory()) {
          findCodeFiles(itemPath);
        } else if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cs', '.cpp', '.c', '.go', '.rs'].includes(ext)) {
          codeFiles.push(itemPath);
        }
      });
    }
    findCodeFiles(projectRoot);

    // Analyze imports
    codeFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
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
        imports.forEach(imp => {
          importCounts.set(imp, (importCounts.get(imp) || 0) + 1);
          
          // Identify external dependencies
          if (imp.startsWith('@') || imp.includes('/') === false || imp.startsWith('node:')) {
            externalDeps.add(imp);
          }
        });
      } catch (error) {
        // Skip files that can't be read
      }
    });

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
    const projectType = detectProjectType(projectRoot);
    const entryPoints = identifyEntryPoints(projectRoot, projectType);
    const contracts = [];

    // Extract API contracts from entry points
    entryPoints.forEach(entry => {
      const entryPath = path.join(projectRoot, entry.file);
      try {
        const content = fs.readFileSync(entryPath, 'utf8');
        
        // Extract function signatures (more precise)
        const functionRegex = /(?:function\s+(\w+)\s*\(|export\s+(?:async\s+)?function\s+(\w+)\s*\(|const\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>)|let\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))/g;
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
            const objExports = match[1].split(',').map(e => e.trim().split(':')[0]);
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
      } catch (error) {
        // Skip files that can't be read
      }
    });

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
 * Helper: Record context annotations for non-standard modules
 */
async function recordModuleAnnotations(orientation, projectRoot) {
  try {
    const manager = await getProjectMemoryManager('default');
    if (!manager) return;

    // Record annotations for non-standard module types
    if (orientation.modules) {
      orientation.modules.forEach(mod => {
        const nonStandardTypes = ['custom', 'legacy', 'experimental', 'internal'];
        if (nonStandardTypes.includes(mod.type)) {
          manager.recordContextAnnotation(
            mod.path,
            'NON-STANDARD',
            `Module type: ${mod.type}. ${mod.inferredResponsibility || ''}`
          );
        }
      });
    }
  } catch (error) {
    // Silently fail - annotation recording is not critical
  }
}

/**
 * Helper: Record dependency impact for hub files
 */
async function recordDependencyImpact(hubFiles, projectRoot) {
  try {
    const manager = await getProjectMemoryManager('default');
    if (!manager) return;

    // Record impact for top hub files
    hubFiles.slice(0, 5).forEach(hub => {
      manager.recordDependencyImpact(
        hub.file,
        [], // Affected files would need deeper analysis
        `Hub file imported by ${hub.importCount} modules`,
        'Check dependent modules before modifying'
      );
    });
  } catch (error) {
    // Silently fail - impact recording is not critical
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
    let guidance = {
      entry_points: [],
      modules_to_consider: [],
      critical_dependencies: [],
      suggested_files: [],
    };

    // Match query to modules
    if (orientation.modules) {
      orientation.modules.forEach(mod => {
        if (queryLower.includes(mod.type) || queryLower.includes(mod.path.split(path.sep).pop())) {
          guidance.modules_to_consider.push(mod);
        }
      });
    }

    // Match query to entry points
    if (orientation.entry_points) {
      orientation.entry_points.forEach(ep => {
        if (queryLower.includes('main') || queryLower.includes('start') || queryLower.includes('init')) {
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
