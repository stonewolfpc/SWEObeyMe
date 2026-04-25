import fs from 'fs/promises';
import { join } from 'path';
import { readFileSafe, existsSafe, readdirSafe } from '../shared/async-utils.js';

/**
 * Check if a project is a Godot project by looking for Godot-specific files
 * Added timeout protection to prevent hangs on large project scans
 * @param {string} projectPath - Path to the project directory
 * @returns {boolean} - True if project is a Godot project
 */
async function isGodotProject(projectPath, timeout = 5000) {
  const startTime = Date.now();
  const godotFiles = [
    'project.godot',
    'project.godot.backup',
    '.godot',
    'export_presets.cfg',
  ];

  for (const file of godotFiles) {
    if (Date.now() - startTime > timeout) {
      console.warn(`[Godot Detection] Timeout after ${timeout}ms checking indicators`);
      return false;
    }
    try {
      if (await existsSafe(join(projectPath, file), 1000, `isGodotProject exists ${file}`)) {
        return true;
      }
    } catch (error) {
      continue;
    }
  }

  // Check for Godot-specific directory structure
  const godotDirs = [
    'res://.godot',
    'res://addons',
    'res://scenes',
    'res://scripts',
  ];

  for (const dir of godotDirs) {
    if (Date.now() - startTime > timeout) {
      console.warn(`[Godot Detection] Timeout after ${timeout}ms checking directories`);
      return false;
    }
    try {
      if (await existsSafe(join(projectPath, dir), 1000, `isGodotProject exists ${dir}`)) {
        return true;
      }
    } catch (error) {
      continue;
    }
  }

  return false;
}

/**
 * Get Godot project version from project.godot file
 * @param {string} projectPath - Path to the project directory
 * @returns {string|null} - Godot version or null if not found
 */
async function getGodotVersion(projectPath) {
  const projectFile = join(projectPath, 'project.godot');
  if (!(await existsSafe(projectFile, 1000, 'getGodotVersion exists projectFile'))) {
    return null;
  }

  try {
    const content = await readFileSafe(projectFile, 10000, 'getGodotVersion read');
    const versionMatch = content.match(/config\/features=PackedStringArray\(\s*"4\.(\d+)"/);
    if (versionMatch) {
      return `4.${versionMatch[1]}`;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Check for GDScript files in the project
 * Added timeout protection to prevent hangs on large directories
 * @param {string} projectPath - Path to the project directory
 * @returns {boolean} - True if GDScript files found
 */
async function hasGDSFiles(projectPath, timeout = 5000) {
  const startTime = Date.now();
  try {
    const files = await readdirSafe(projectPath, {}, 5000, 'hasGDSFiles readdir');
    if (Date.now() - startTime > timeout) {
      console.warn(`[Godot Detection] Timeout after ${timeout}ms checking for GDScript files`);
      return false;
    }
    return files.some(file => file.endsWith('.gd'));
  } catch (error) {
    return false;
  }
}

/**
 * Detect Godot project type (2D, 3D, or mixed)
 * @param {string} projectPath - Path to the project directory
 * @returns {string} - Project type
 */
async function detectProjectType(projectPath) {
  const scenesDir = join(projectPath, 'scenes');
  if (!(await existsSafe(scenesDir, 1000, 'detectProjectType exists scenesDir'))) {
    return 'unknown';
  }

  try {
    const files = await readdirSafe(scenesDir, {}, 5000, 'detectProjectType readdir');
    const has2D = files.some(f => f.toLowerCase().includes('2d') || f.toLowerCase().includes('ui'));
    const has3D = files.some(f => f.toLowerCase().includes('3d') || f.toLowerCase().includes('world'));

    if (has2D && has3D) return 'mixed';
    if (has2D) return '2d';
    if (has3D) return '3d';
    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Check autoload configuration
 * @param {string} projectPath - Path to the project directory
 * @returns {Object} - Autoload configuration info
 */
async function checkAutoloadConfig(projectPath) {
  const projectFile = join(projectPath, 'project.godot');
  if (!(await existsSafe(projectFile, 1000, 'checkAutoloadConfig exists projectFile'))) {
    return { hasAutoloads: false, autoloads: [] };
  }

  try {
    const content = await readFileSafe(projectFile, 10000, 'checkAutoloadConfig read');
    const autoloadMatch = content.match(/\[autoload\]([\s\S]*?)\[/);
    if (!autoloadMatch) {
      return { hasAutoloads: false, autoloads: [] };
    }

    const autoloadSection = autoloadMatch[1];
    const autoloads = [];
    const lines = autoloadSection.split('\n');

    for (const line of lines) {
      if (line.includes('=')) {
        const [name, path] = line.split('=').map(s => s.trim());
        if (name && path && path !== '"*res://*"') {
          autoloads.push({ name, path });
        }
      }
    }

    return { hasAutoloads: autoloads.length > 0, autoloads };
  } catch (error) {
    return { hasAutoloads: false, autoloads: [], error: error.message };
  }
}

/**
 * Validate scene file structure
 * @param {string} projectPath - Path to the project directory
 * @returns {Object} - Scene file validation results
 */
async function validateSceneFiles(projectPath) {
  const scenesDir = join(projectPath, 'scenes');
  if (!(await existsSafe(scenesDir, 1000, 'validateSceneFiles exists scenesDir'))) {
    return { valid: true, message: 'No scenes directory found' };
  }

  const issues = [];
  try {
    const files = await readdirSafe(scenesDir, { recursive: true }, 5000, 'validateSceneFiles readdir');

    for (const file of files) {
      if (file.endsWith('.tscn')) {
        const filePath = join(scenesDir, file);
        const content = await readFileSafe(filePath, 10000, `validateSceneFiles read ${file}`);

        // Check for basic scene structure
        if (!content.includes('[gd_scene')) {
          issues.push({ file, issue: 'Invalid scene file format - missing [gd_scene header' });
        }

        // Check for node definitions
        if (!content.includes('[node')) {
          issues.push({ file, issue: 'Scene has no node definitions' });
        }
      }
    }
  } catch (error) {
    return { valid: false, error: error.message };
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Check script-to-node name matching
 * @param {string} projectPath - Path to the project directory
 * @returns {Object} - Script-node matching results
 */
async function checkScriptNodeMatching(projectPath) {
  const mismatches = [];

  // Check scenes directory for .tscn files
  const scenesDir = join(projectPath, 'scenes');
  if (await existsSafe(scenesDir, 1000, 'checkScriptNodeMatching exists scenesDir')) {
    try {
      const sceneFiles = await readdirSafe(scenesDir, { recursive: true }, 5000, 'checkScriptNodeMatching readdir');

      for (const sceneFile of sceneFiles) {
        if (sceneFile.endsWith('.tscn')) {
          const filePath = join(scenesDir, sceneFile);
          const content = await readFileSafe(filePath, 10000, `checkScriptNodeMatching read ${sceneFile}`);

          // Extract script references
          const scriptMatches = content.matchAll(/script\s*=\s*ExtResource\s*\(\s*"?(\d+)"?\s*\)/g);

          for (const match of scriptMatches) {
            const resourceId = match[1];
            // Find the ExtResource definition
            const extResourceMatch = content.match(new RegExp('\\[ext_resource\\s+type\\s*=\\s*Script.*?path\\s*=\\s*"?res://(.*?\\.gd)"?', 's'));
            if (extResourceMatch) {
              const scriptPath = extResourceMatch[1];
              const scriptName = scriptPath.split('/').pop().replace('.gd', '');

              // Check if script name matches a node in the scene
              const nodeMatches = content.matchAll(/\[node name="([^"]+)"\]/g);
              let nodeFound = false;
              for (const nodeMatch of nodeMatches) {
                if (nodeMatch[1].toLowerCase() === scriptName.toLowerCase()) {
                  nodeFound = true;
                  break;
                }
              }

              if (!nodeFound) {
                mismatches.push({ scene: sceneFile, script: scriptName, issue: 'Script name does not match any node in scene' });
              }
            }
          }
        }
      }
    } catch (error) {
      // Ignore errors for now
    }
  }

  return { valid: mismatches.length === 0, mismatches };
}

/**
 * Check folder structure integrity
 * @param {string} projectPath - Path to the project directory
 * @returns {Object} - Folder structure validation results
 */
async function checkFolderStructure(projectPath) {
  const expectedFolders = ['res://', 'res://scenes', 'res://scripts', 'res://resources'];
  const warnings = [];

  // Check for standard Godot folders
  const standardFolders = ['scenes', 'scripts', 'resources', 'assets', 'addons'];

  for (const folder of standardFolders) {
    const folderPath = join(projectPath, folder);
    if (!(await existsSafe(folderPath, 1000, `checkFolderStructure exists ${folder}`))) {
      warnings.push({ folder, issue: 'Standard Godot folder not found (optional but recommended)' });
    }
  }

  // Check for problematic folder reorganization
  const files = await readdirSafe(projectPath, {}, 5000, 'checkFolderStructure readdir');
  const hasProjectGodot = files.includes('project.godot');
  const hasExportPresets = files.includes('export_presets.cfg');

  if (!hasProjectGodot) {
    return { valid: false, critical: 'project.godot file not found - this may not be a Godot project' };
  }

  return { valid: true, warnings };
}

/**
 * Handler for detecting Godot projects
 */
export const detect_godot_project_handler = async (args) => {
  const { projectPath } = args;

  if (!projectPath) {
    return {
      content: [{
        type: 'text',
        text: 'Error: projectPath parameter is required. Usage: detect_godot_project(projectPath)',
      }],
    };
  }

  const projectFile = join(projectPath, 'project.godot');
  const godotFolder = join(projectPath, '.godot');

  // Check for Godot indicators with timeout protection
  const hasProjectFile = await existsSafe(projectFile, 1000, 'detect_godot_project_handler exists projectFile');
  const hasGodotFolder = await existsSafe(godotFolder, 1000, 'detect_godot_project_handler exists godotFolder');
  const hasGDSFilesFound = await hasGDSFiles(projectPath);
  const projectType = await detectProjectType(projectPath);

  // Perform comprehensive structure validation
  const autoloadConfig = await checkAutoloadConfig(projectPath);
  const sceneValidation = await validateSceneFiles(projectPath);
  const scriptNodeMatching = await checkScriptNodeMatching(projectPath);
  const folderStructure = await checkFolderStructure(projectPath);

  const isGodotProject = hasProjectFile || hasGodotFolder || hasGDSFilesFound;

  const result = {
    isGodotProject,
    indicators: {
      hasProjectFile,
      hasGodotFolder,
      hasGDSFiles: hasGDSFilesFound,
      projectType,
    },
    structureValidation: {
      autoloadConfig,
      sceneValidation,
      scriptNodeMatching,
      folderStructure,
    },
    godotMode: isGodotProject ? 'ACTIVE' : 'INACTIVE',
    warnings: [],
  };

  // Add warnings for structure issues
  if (isGodotProject) {
    if (!sceneValidation.valid) {
      result.warnings.push(...sceneValidation.issues.map(i => `Scene file issue: ${i.file} - ${i.issue}`));
    }
    if (!scriptNodeMatching.valid) {
      result.warnings.push(...scriptNodeMatching.mismatches.map(m => `Script-node mismatch: ${m.scene} - ${m.script}`));
    }
    if (folderStructure.warnings.length > 0) {
      result.warnings.push(...folderStructure.warnings.map(w => `Folder structure: ${w.folder} - ${w.issue}`));
    }
  }

  const message = isGodotProject
    ? `GODOT MODE ACTIVATED: This is a Godot project (${projectType}). Strict project structure enforcement is now active. The AI will protect scene trees, script paths, autoloads, and folder structure to prevent project breakage.`
    : 'NOT A GODOT PROJECT: No Godot indicators found. Standard project handling will be used.';

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2) + '\n\n' + message,
    }],
  };
};

/**
 * Handler for checking Godot best practices compliance
 */
export const check_godot_practices_handler = async (args) => {
  const { projectPath, filePath } = args;

  if (!projectPath) {
    return {
      content: [{
        type: 'text',
        text: 'Error: projectPath parameter is required. Usage: check_godot_practices(projectPath, filePath?)',
      }],
      isError: true,
    };
  }

  const isGodot = await isGodotProject(projectPath);
  if (!isGodot) {
    return {
      content: [{
        type: 'text',
        text: 'This is not a detected Godot project. Cannot check Godot best practices.',
      }],
    };
  }

  const violations = [];
  const suggestions = [];
  const criticalIssues = [];

  // Perform comprehensive structure validation
  const autoloadConfig = await checkAutoloadConfig(projectPath);
  const sceneValidation = await validateSceneFiles(projectPath);
  const scriptNodeMatching = await checkScriptNodeMatching(projectPath);
  const folderStructure = await checkFolderStructure(projectPath);

  // Check critical structure issues
  if (!sceneValidation.valid) {
    sceneValidation.issues.forEach(issue => {
      criticalIssues.push({
        type: 'critical',
        category: 'scene_structure',
        message: `Scene file corruption detected: ${issue.file} - ${issue.issue}`,
        impact: 'Scene file corruption will prevent scenes from loading',
      });
    });
  }

  if (!scriptNodeMatching.valid) {
    scriptNodeMatching.mismatches.forEach(mismatch => {
      criticalIssues.push({
        type: 'critical',
        category: 'script_node_matching',
        message: `Script-node name mismatch: ${mismatch.scene} - ${mismatch.script} - ${mismatch.issue}`,
        impact: 'Script will not attach correctly to node, breaking functionality',
      });
    });
  }

  if (autoloadConfig.hasAutoloads) {
    autoloadConfig.autoloads.forEach(autoload => {
      criticalIssues.push({
        type: 'critical',
        category: 'autoload_integrity',
        message: `Autoload detected: ${autoload.name} at ${autoload.path}`,
        impact: 'Autoloads are global singletons - never modify or remove them',
      });
    });
  }

  // Check file-specific practices if filePath provided
  if (filePath) {
    if (await existsSafe(filePath, 1000, 'check_godot_practices_handler exists filePath')) {
      const content = await readFileSafe(filePath, 10000, 'check_godot_practices_handler read filePath');

      // CRITICAL: Check if file is a .tscn scene file
      if (filePath.endsWith('.tscn')) {
        criticalIssues.push({
          type: 'critical',
          category: 'scene_file_editing',
          message: 'Direct editing of .tscn scene files detected',
          impact: 'Direct .tscn editing corrupts scenes. Use Godot editor for scene modifications.',
        });
      }

      // Check line length (Godot recommends keeping lines reasonable)
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.length > 120) {
          violations.push({
            file: filePath,
            line: index + 1,
            rule: 'line_length',
            message: `Line exceeds 120 characters (${line.length} chars)`,
            severity: 'warning',
          });
        }
      });

      // Check for snake_case file naming for GDScript
      const fileName = filePath.split('\\').pop().split('/').pop();
      if (fileName.endsWith('.gd')) {
        if (fileName !== fileName.toLowerCase() && fileName.includes('_')) {
          violations.push({
            file: filePath,
            rule: 'naming_convention',
            message: 'GDScript file name should use snake_case',
            severity: 'strict',
          });
        }
      }

      // Check for class naming (PascalCase)
      const classMatches = content.match(/class_name\s+(\w+)/g);
      if (classMatches) {
        classMatches.forEach(match => {
          const className = match.split(' ')[1];
          if (className !== className.charAt(0).toUpperCase() + className.slice(1)) {
            violations.push({
              file: filePath,
              rule: 'class_naming',
              message: `Class name "${className}" should use PascalCase`,
              severity: 'strict',
            });
          }
        });
      }

      // Check for @export validation
      const exportMatches = content.match(/@export\s+(\w+)/g);
      if (exportMatches) {
        exportMatches.forEach(match => {
          const type = match.split(' ')[1];
          if (!['int', 'float', 'bool', 'String', 'Vector2', 'Vector3', 'Color', 'NodePath'].includes(type)) {
            violations.push({
              file: filePath,
              rule: 'export_validation',
              message: `@export type "${type}" should be validated for proper Godot editor support`,
              severity: 'strict',
            });
          }
        });
      }

      // Check for _init() vs _ready() usage
      if (content.includes('_init()') && content.includes('get_node') || content.includes('$')) {
        violations.push({
          file: filePath,
          rule: 'initialization',
          message: 'Using _init() with node access. Use _ready() for node initialization when node has access to scene tree.',
          severity: 'warning',
        });
      }
    }
  }

  // General project structure checks
  // Check for scene organization
  const scenesDir = join(projectPath, 'scenes');
  if (!(await existsSafe(scenesDir, 1000, 'check_godot_practices_handler exists scenesDir'))) {
    suggestions.push({
      type: 'organization',
      message: 'Consider organizing scenes into a dedicated "scenes" folder',
    });
  }

  const scriptsDir = join(projectPath, 'scripts');
  if (!(await existsSafe(scriptsDir, 1000, 'check_godot_practices_handler exists scriptsDir'))) {
    suggestions.push({
      type: 'organization',
      message: 'Consider organizing scripts into a dedicated "scripts" folder',
    });
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        projectPath: projectPath,
        isGodotProject: true,
        criticalIssues: criticalIssues,
        violations: violations,
        suggestions: suggestions,
        criticalIssueCount: criticalIssues.length,
        violationCount: violations.length,
        suggestionCount: suggestions.length,
      }, null, 2),
    }],
  };
};

/**
 * Handler for looking up Godot best practices
 */
export const godot_lookup_handler = async (args) => {
  const { query, category } = args;

  if (!query && !category) {
    return {
      content: [{
        type: 'text',
        text: 'Error: query or category parameter is required. Usage: godot_lookup(query?, category?)',
      }],
      isError: true,
    };
  }

  const godotCorpusPath = join(process.cwd(), 'godot_corpus', 'index.json');

  if (!(await existsSafe(godotCorpusPath, 1000, 'godot_lookup_handler exists godotCorpusPath'))) {
    return {
      content: [{
        type: 'text',
        text: 'Godot corpus not found. Please ensure godot_corpus/index.json exists.',
      }],
      isError: true,
    };
  }

  try {
    const corpus = JSON.parse(await readFileSafe(godotCorpusPath, 10000, 'godot_lookup_handler read'));
    const results = [];

    if (category) {
      const categoryData = corpus.categories.find(c => c.name === category);
      if (categoryData) {
        results.push({
          category: categoryData.name,
          description: categoryData.description,
          documents: categoryData.documents,
        });
      }
    }

    if (query) {
      const queryLower = query.toLowerCase();
      corpus.categories.forEach(cat => {
        cat.documents.forEach(doc => {
          if (
            doc.name.toLowerCase().includes(queryLower) ||
            doc.description.toLowerCase().includes(queryLower)
          ) {
            results.push({
              category: cat.name,
              document: doc,
            });
          }
        });
      });
    }

    if (results.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `No results found for query: "${query || category}".\n\nAvailable categories:\n${corpus.categories.map(c => `- ${c.name}: ${c.description}`).join('\n')}`,
        }],
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query: query || category,
          results: results,
          source: corpus.source,
          license: corpus.license,
        }, null, 2),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error reading Godot corpus: ${error.message}`,
      }],
      isError: true,
    };
  }
};
