/**
 * Godot Practices & Lookup Handlers
 * Extracted from godot-handlers.js for SoC compliance.
 */

import { join } from 'path';
import { readFileSafe, existsSafe, readdirSafe } from '../shared/async-utils.js';
import { isGodotProject, checkAutoloadConfig, validateSceneFiles, checkScriptNodeMatching, checkFolderStructure } from './godot-handlers.js';
export const check_godot_practices_handler = async (args) => {
  const { projectPath, filePath } = args;

  if (!projectPath) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: projectPath parameter is required. Usage: check_godot_practices(projectPath, filePath?)',
        },
      ],
      isError: true,
    };
  }

  const isGodot = await isGodotProject(projectPath);
  if (!isGodot) {
    return {
      content: [
        {
          type: 'text',
          text: 'This is not a detected Godot project. Cannot check Godot best practices.',
        },
      ],
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
    sceneValidation.issues.forEach((issue) => {
      criticalIssues.push({
        type: 'critical',
        category: 'scene_structure',
        message: `Scene file corruption detected: ${issue.file} - ${issue.issue}`,
        impact: 'Scene file corruption will prevent scenes from loading',
      });
    });
  }

  if (!scriptNodeMatching.valid) {
    scriptNodeMatching.mismatches.forEach((mismatch) => {
      criticalIssues.push({
        type: 'critical',
        category: 'script_node_matching',
        message: `Script-node name mismatch: ${mismatch.scene} - ${mismatch.script} - ${mismatch.issue}`,
        impact: 'Script will not attach correctly to node, breaking functionality',
      });
    });
  }

  if (autoloadConfig.hasAutoloads) {
    autoloadConfig.autoloads.forEach((autoload) => {
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
      const content = await readFileSafe(
        filePath,
        10000,
        'check_godot_practices_handler read filePath'
      );

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
        classMatches.forEach((match) => {
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
        exportMatches.forEach((match) => {
          const type = match.split(' ')[1];
          if (
            !['int', 'float', 'bool', 'String', 'Vector2', 'Vector3', 'Color', 'NodePath'].includes(
              type
            )
          ) {
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
      if ((content.includes('_init()') && content.includes('get_node')) || content.includes('$')) {
        violations.push({
          file: filePath,
          rule: 'initialization',
          message:
            'Using _init() with node access. Use _ready() for node initialization when node has access to scene tree.',
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
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            projectPath: projectPath,
            isGodotProject: true,
            criticalIssues: criticalIssues,
            violations: violations,
            suggestions: suggestions,
            criticalIssueCount: criticalIssues.length,
            violationCount: violations.length,
            suggestionCount: suggestions.length,
          },
          null,
          2
        ),
      },
    ],
  };
};

/**
 * Handler for looking up Godot best practices
 */
export const godot_lookup_handler = async (args) => {
  const { query, category } = args;

  if (!query && !category) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: query or category parameter is required. Usage: godot_lookup(query?, category?)',
        },
      ],
      isError: true,
    };
  }

  const godotCorpusPath = join(process.cwd(), 'godot_corpus', 'index.json');

  if (!(await existsSafe(godotCorpusPath, 1000, 'godot_lookup_handler exists godotCorpusPath'))) {
    return {
      content: [
        {
          type: 'text',
          text: 'Godot corpus not found. Please ensure godot_corpus/index.json exists.',
        },
      ],
      isError: true,
    };
  }

  try {
    const corpus = JSON.parse(
      await readFileSafe(godotCorpusPath, 10000, 'godot_lookup_handler read')
    );
    const results = [];

    if (category) {
      const categoryData = corpus.categories.find((c) => c.name === category);
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
      corpus.categories.forEach((cat) => {
        cat.documents.forEach((doc) => {
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
        content: [
          {
            type: 'text',
            text: `No results found for query: "${query || category}".\n\nAvailable categories:\n${corpus.categories.map((c) => `- ${c.name}: ${c.description}`).join('\n')}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              query: query || category,
              results: results,
              source: corpus.source,
              license: corpus.license,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error reading Godot corpus: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
};
