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
  const godotFiles = ['project.godot', 'project.godot.backup', '.godot', 'export_presets.cfg'];

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
  const godotDirs = ['res://.godot', 'res://addons', 'res://scenes', 'res://scripts'];

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
    return files.some((file) => file.endsWith('.gd'));
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
    const has2D = files.some(
      (f) => f.toLowerCase().includes('2d') || f.toLowerCase().includes('ui')
    );
    const has3D = files.some(
      (f) => f.toLowerCase().includes('3d') || f.toLowerCase().includes('world')
    );

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
        const [name, path] = line.split('=').map((s) => s.trim());
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
    const files = await readdirSafe(
      scenesDir,
      { recursive: true },
      5000,
      'validateSceneFiles readdir'
    );

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
      const sceneFiles = await readdirSafe(
        scenesDir,
        { recursive: true },
        5000,
        'checkScriptNodeMatching readdir'
      );

      for (const sceneFile of sceneFiles) {
        if (sceneFile.endsWith('.tscn')) {
          const filePath = join(scenesDir, sceneFile);
          const content = await readFileSafe(
            filePath,
            10000,
            `checkScriptNodeMatching read ${sceneFile}`
          );

          // Extract script references
          const scriptMatches = content.matchAll(/script\s*=\s*ExtResource\s*\(\s*"?(\d+)"?\s*\)/g);

          for (const match of scriptMatches) {
            const resourceId = match[1];
            // Find the ExtResource definition
            const extResourceMatch = content.match(
              new RegExp(
                '\\[ext_resource\\s+type\\s*=\\s*Script.*?path\\s*=\\s*"?res://(.*?\\.gd)"?',
                's'
              )
            );
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
                mismatches.push({
                  scene: sceneFile,
                  script: scriptName,
                  issue: 'Script name does not match any node in scene',
                });
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
      warnings.push({
        folder,
        issue: 'Standard Godot folder not found (optional but recommended)',
      });
    }
  }

  // Check for problematic folder reorganization
  const files = await readdirSafe(projectPath, {}, 5000, 'checkFolderStructure readdir');
  const hasProjectGodot = files.includes('project.godot');
  const hasExportPresets = files.includes('export_presets.cfg');

  if (!hasProjectGodot) {
    return {
      valid: false,
      critical: 'project.godot file not found - this may not be a Godot project',
    };
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
      content: [
        {
          type: 'text',
          text: 'Error: projectPath parameter is required. Usage: detect_godot_project(projectPath)',
        },
      ],
    };
  }

  const projectFile = join(projectPath, 'project.godot');
  const godotFolder = join(projectPath, '.godot');

  // Check for Godot indicators with timeout protection
  const hasProjectFile = await existsSafe(
    projectFile,
    1000,
    'detect_godot_project_handler exists projectFile'
  );
  const hasGodotFolder = await existsSafe(
    godotFolder,
    1000,
    'detect_godot_project_handler exists godotFolder'
  );
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
      result.warnings.push(
        ...sceneValidation.issues.map((i) => `Scene file issue: ${i.file} - ${i.issue}`)
      );
    }
    if (!scriptNodeMatching.valid) {
      result.warnings.push(
        ...scriptNodeMatching.mismatches.map(
          (m) => `Script-node mismatch: ${m.scene} - ${m.script}`
        )
      );
    }
    if (folderStructure.warnings.length > 0) {
      result.warnings.push(
        ...folderStructure.warnings.map((w) => `Folder structure: ${w.folder} - ${w.issue}`)
      );
    }
  }

  const message = isGodotProject
    ? `GODOT MODE ACTIVATED: This is a Godot project (${projectType}). Strict project structure enforcement is now active. The AI will protect scene trees, script paths, autoloads, and folder structure to prevent project breakage.`
    : 'NOT A GODOT PROJECT: No Godot indicators found. Standard project handling will be used.';

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2) + '\n\n' + message,
      },
    ],
  };
};

export { isGodotProject, checkAutoloadConfig, validateSceneFiles, checkScriptNodeMatching, checkFolderStructure };

export { check_godot_practices_handler, godot_lookup_handler } from './godot-practices-handler.js';
