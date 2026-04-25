/**
 * Project Map Handlers
 * Handlers for project map operations - the source of truth for project structure
 */

import { getProjectMemory } from '../project-memory.js';
import { initializeDocumentationUpdater } from '../documentation-updater.js';

/**
 * Read project map
 */
export async function readProjectMap(args) {
  try {
    const pm = getProjectMemory();
    if (!pm || !pm.projectMap) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Project memory not initialized. Call index_project_structure first.',
          },
        ],
      };
    }

    const projectMap = pm.projectMap;

    let output = 'Project Map (Source of Truth):\n\n';
    output += `Project: ${projectMap.project.name}\n`;
    output += `Version: ${projectMap.version}\n\n`;

    output += 'Structure:\n';
    output += `  Folders: ${Object.keys(projectMap.structure.folders || {}).length}\n`;
    output += `  Files: ${Object.keys(projectMap.structure.files || {}).length}\n\n`;

    output += 'Domains:\n';
    for (const [domain, config] of Object.entries(projectMap.conventions.domains || {})) {
      output += `  ${domain}: ${config.folder}\n`;
    }

    output += '\nArchitectural Boundaries:\n';
    for (const [boundary, config] of Object.entries(
      projectMap.conventions.architecturalBoundaries || {}
    )) {
      output += `  ${boundary}: ${config.description}\n`;
    }

    output += `\nLast Updated: ${projectMap.audit.lastUpdated}\n`;

    return {
      content: [{ type: 'text', text: output }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to read project map: ${error.message}` }],
    };
  }
}

/**
 * Write/update project map entry
 */
export async function writeProjectMap(args) {
  try {
    const pm = getProjectMemory();
    if (!pm) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Project memory not initialized. Call index_project_structure first.',
          },
        ],
      };
    }

    const { filePath, operation, metadata } = args;

    if (!filePath || !operation) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Missing required parameters: filePath and operation' }],
      };
    }

    await pm.updateProjectMapForFile(filePath, operation, metadata || {});

    return {
      content: [
        { type: 'text', text: `Project map updated for ${operation} operation on ${filePath}` },
      ],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to write project map: ${error.message}` }],
    };
  }
}

/**
 * Validate file against project map rules
 */
export async function validateAgainstProjectMap(args) {
  try {
    const pm = getProjectMemory();
    if (!pm) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Project memory not initialized. Call index_project_structure first.',
          },
        ],
      };
    }

    const { filePath, code, filePurpose } = args;

    if (!filePath) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Missing required parameter: filePath' }],
      };
    }

    const violations = [];

    // Validate file location
    const locationValidation = pm.validateFileLocation(filePath, filePurpose);
    if (!locationValidation.valid) {
      violations.push(...locationValidation.violations);
    }

    // Validate file naming
    const namingValidation = pm.validateFileName(filePath);
    if (!namingValidation.valid) {
      violations.push(...namingValidation.violations);
    }

    // Validate file split (if code provided)
    if (code) {
      const splitEvaluation = pm.evaluateFileSplit(filePath, code);
      if (splitEvaluation.shouldSplit) {
        violations.push(...splitEvaluation.violations);
      }
    }

    if (violations.length === 0) {
      return {
        content: [
          { type: 'text', text: `✓ File ${filePath} passes all project map validation rules.` },
        ],
      };
    } else {
      let output = `✗ File ${filePath} has ${violations.length} validation violations:\n\n`;
      violations.forEach((v, i) => {
        output += `${i + 1}. [${v.type.toUpperCase()}] ${v.message}\n`;
      });

      return {
        content: [{ type: 'text', text: output }],
      };
    }
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to validate against project map: ${error.message}` }],
    };
  }
}

/**
 * Detect domain for code
 */
export async function detectCodeDomain(args) {
  try {
    const pm = getProjectMemory();
    if (!pm) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Project memory not initialized. Call index_project_structure first.',
          },
        ],
      };
    }

    const { code } = args;

    if (!code) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Missing required parameter: code' }],
      };
    }

    const domain = pm.detectDomain(code);
    const conceptualUnits = pm.detectConceptualUnits(code);

    let output = 'Code Analysis:\n\n';
    output += `Detected Domain: ${domain}\n\n`;
    output += `Conceptual Units: ${conceptualUnits.length}\n`;
    conceptualUnits.forEach((unit, i) => {
      output += `  ${i + 1}. ${unit.type}: ${unit.name}\n`;
    });

    return {
      content: [{ type: 'text', text: output }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to detect code domain: ${error.message}` }],
    };
  }
}

/**
 * Update documentation after structural change
 */
export async function updateDocumentation(args) {
  try {
    const { changeType, filePath, metadata } = args;

    if (!changeType || !filePath) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Missing required parameters: changeType and filePath' }],
      };
    }

    const docUpdater = initializeDocumentationUpdater(process.cwd());
    const result = await docUpdater.updateAfterStructuralChange(
      changeType,
      filePath,
      metadata || {}
    );

    if (result.success) {
      return {
        content: [{ type: 'text', text: result.message }],
      };
    } else {
      return {
        isError: true,
        content: [{ type: 'text', text: result.message }],
      };
    }
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to update documentation: ${error.message}` }],
    };
  }
}

/**
 * Evaluate file for splitting
 */
export async function evaluateFileForSplit(args) {
  try {
    const pm = getProjectMemory();
    if (!pm) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Project memory not initialized. Call index_project_structure first.',
          },
        ],
      };
    }

    const { filePath, code } = args;

    if (!filePath || !code) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Missing required parameters: filePath and code' }],
      };
    }

    const evaluation = pm.evaluateFileSplit(filePath, code);

    let output = `File Split Evaluation for ${filePath}:\n\n`;
    output += `Line Count: ${evaluation.lineCount}\n`;
    output += `Conceptual Units: ${evaluation.conceptualUnits.length}\n\n`;

    if (evaluation.shouldSplit) {
      output += '⚠ RECOMMENDATION: File should be split\n\n';
      output += 'Violations:\n';
      evaluation.violations.forEach((v, i) => {
        output += `  ${i + 1}. ${v.message}\n`;
      });

      output += '\nConceptual Units Found:\n';
      evaluation.conceptualUnits.forEach((unit, i) => {
        output += `  ${i + 1}. ${unit.type}: ${unit.name} (line ${unit.line})\n`;
      });
    } else {
      output += '✓ File does not require splitting';
    }

    return {
      content: [{ type: 'text', text: output }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to evaluate file for split: ${error.message}` }],
    };
  }
}

export const projectMapHandlers = {
  read_project_map: readProjectMap,
  write_project_map: writeProjectMap,
  validate_against_project_map: validateAgainstProjectMap,
  detect_code_domain: detectCodeDomain,
  update_documentation: updateDocumentation,
  evaluate_file_for_split: evaluateFileForSplit,
};
