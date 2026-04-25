/**
 * Codebase Orientation Analysis Functions
 * Core analysis functions for codebase orientation
 */

import fs from 'fs/promises';
import path from 'path';
import { withTimeout } from './codebase-orientation-utils.js';

/**
 * Detect project type from directory structure and files (async with timeout)
 */
export async function detectProjectType(rootPath, timeout = 5000) {
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

  const files = await withTimeout(fs.readdir(rootPath), timeout, 'detectProjectType readdir');
  let detected = [];

  for (const [lang, indicatorsList] of Object.entries(indicators)) {
    const hasIndicator = await Promise.any([
      Promise.all(indicatorsList.map(async ind => {
        if (files.includes(ind)) return true;
        try {
          await fs.access(path.join(rootPath, ind));
          return true;
        } catch {
          return false;
        }
      })),
      Promise.resolve(false)
    ]);
    
    if (hasIndicator) {
      detected.push(lang);
    }
  }

  return detected.length > 0 ? detected : ['unknown'];
}

/**
 * Identify entry points based on project type (async with timeout)
 */
export async function identifyEntryPoints(rootPath, projectType, timeout = 5000) {
  const entryPoints = [];

  if (projectType.includes('javascript') || projectType.includes('typescript')) {
    const commonEntries = ['index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts', 'server.js', 'server.ts'];
    for (const entry of commonEntries) {
      const entryPath = path.join(rootPath, entry);
      try {
        await withTimeout(fs.access(entryPath), timeout, `identifyEntryPoints access ${entry}`);
        entryPoints.push({ file: entry, type: 'main' });
      } catch {
        // File doesn't exist, skip
      }
    }

    // Check src directory
    const srcPath = path.join(rootPath, 'src');
    try {
      await withTimeout(fs.access(srcPath), timeout, 'identifyEntryPoints access src');
      const srcEntries = ['index.js', 'index.ts', 'main.js', 'main.ts'];
      for (const entry of srcEntries) {
        const entryPath = path.join(srcPath, entry);
        try {
          await withTimeout(fs.access(entryPath), timeout, `identifyEntryPoints access src/${entry}`);
          entryPoints.push({ file: `src/${entry}`, type: 'main' });
        } catch {
          // File doesn't exist, skip
        }
      }
    } catch {
      // src directory doesn't exist, skip
    }
  }

  if (projectType.includes('python')) {
    const commonEntries = ['main.py', 'app.py', 'run.py', '__main__.py'];
    for (const entry of commonEntries) {
      const entryPath = path.join(rootPath, entry);
      try {
        await withTimeout(fs.access(entryPath), timeout, `identifyEntryPoints access ${entry}`);
        entryPoints.push({ file: entry, type: 'main' });
      } catch {
        // File doesn't exist, skip
      }
    }

    // Check src directory
    const srcPath = path.join(rootPath, 'src');
    try {
      await withTimeout(fs.access(srcPath), timeout, 'identifyEntryPoints access src');
      const srcEntries = ['main.py', '__main__.py'];
      for (const entry of srcEntries) {
        const entryPath = path.join(srcPath, entry);
        try {
          await withTimeout(fs.access(entryPath), timeout, `identifyEntryPoints access src/${entry}`);
          entryPoints.push({ file: `src/${entry}`, type: 'main' });
        } catch {
          // File doesn't exist, skip
        }
      }
    } catch {
      // src directory doesn't exist, skip
    }
  }

  return entryPoints;
}

/**
 * Infer module structure from directory layout (async with timeout)
 */
export async function inferModuleStructure(rootPath, timeout = 5000) {
  const modules = [];
  const dirs = [];
  const visited = new Set();

  // Get all directories with depth limit
  async function getDirectories(dir, depth = 0) {
    if (depth > 50 || visited.has(dir)) return; // Depth limit and loop detection
    visited.add(dir);

    try {
      const items = await withTimeout(fs.readdir(dir, { withFileTypes: true }), timeout, `inferModuleStructure readdir ${dir}`);
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
          dirs.push(fullPath);
          await getDirectories(fullPath, depth + 1);
        }
      }
    } catch {
      // Skip directories that can't be read
    }
  }

  await getDirectories(rootPath);

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
