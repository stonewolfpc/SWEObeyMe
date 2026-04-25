/**
 * Refactoring Split Handler
 *
 * Responsibility: Split files into multiple files based on delimiters with intelligent detection
 * Separated from: handlers-refactoring.js (SoC compliance)
 *
 * @module lib/tools/refactoring/refactoring-split
 */

import fs from 'fs/promises';
import path from 'path';
import { toWindsurfUri, normalizePath } from '../../utils.js';
import { createBackup } from '../../backup.js';
import { recordAction } from '../../session.js';
import { validateBracketBalance } from './bracket-validator.js';
import {
  detectCodeBlocks,
  parseImports,
  extractSymbols,
  generateImportStatement,
  insertImportStatement,
  removeUnusedImports,
} from './refactoring-utils.js';

/**
 * Split a file into multiple files based on delimiters
 * @param {Object} args - Split arguments
 * @returns {Object} Result
 */
export async function refactorSplitFile(args) {
  const { source_path, splits, auto_detect = false, manage_imports = true } = args; // splits: [{ delimiter, target_path, description }]

  const backupPath = await createBackup(source_path);
  if (!backupPath) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'BACKUP FAILED: Cannot split without verified backup.' }],
    };
  }

  const sourceContent = await fs.readFile(source_path, 'utf-8');
  let currentContent = sourceContent;
  const createdFiles = [];
  const sourceImports = parseImports(sourceContent);

  // Auto-detect code blocks if requested
  let splitTargets = splits;
  if (auto_detect) {
    const detectedBlocks = detectCodeBlocks(sourceContent);
    if (detectedBlocks.length > 0) {
      splitTargets = detectedBlocks.map((block) => ({
        delimiter: block.code,
        target_path: `${path.dirname(source_path)}/${block.name}.${path.basename(source_path).split('.').pop()}`,
        description: `Auto-detected ${block.type}: ${block.name}`,
      }));
    }
  }

  for (const split of splitTargets) {
    const { delimiter, target_path, description } = split;

    if (!currentContent.includes(delimiter)) {
      continue;
    }

    const [before, after] = currentContent.split(delimiter);
    const header = `// ${description || 'Module split by SWEObeyMe'}\n// Source: ${source_path}\n\n`;
    let newFileContent = header + delimiter + after;

    // Manage imports for the split file
    if (manage_imports) {
      const blockSymbols = extractSymbols(delimiter);

      // Add necessary imports to the new file
      for (const imp of sourceImports) {
        const importedSymbols = imp.specifier
          .split(',')
          .map((s) => s.trim().replace(/[{}]/g, '').trim());
        const usedSymbols = importedSymbols.filter(
          (s) =>
            blockSymbols.functions.includes(s) ||
            blockSymbols.classes.includes(s) ||
            blockSymbols.variables.includes(s) ||
            delimiter.includes(s)
        );

        if (usedSymbols.length > 0) {
          newFileContent = insertImportStatement(newFileContent, imp.statement);
        }
      }
    }

    if (newFileContent.split('\n').length > 700) {
      return {
        isError: true,
        content: [
          { type: 'text', text: `ERROR: Split would cause ${target_path} to exceed 700 lines.` },
        ],
      };
    }

    const validation = validateBracketBalance(newFileContent, target_path);
    if (!validation.valid) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `BRACKET VALIDATION FAILED - ${target_path} would have unbalanced brackets:`,
          },
          ...validation.errors.map((err) => ({ type: 'text', text: `  ${err}` })),
          { type: 'text', text: 'Split aborted to prevent structure corruption.' },
        ],
      };
    }

    await fs.writeFile(target_path, newFileContent, 'utf-8');
    createdFiles.push(target_path);

    currentContent = before;
  }

  // Add import statements to source for the split files
  if (manage_imports && createdFiles.length > 0) {
    for (const filePath of createdFiles) {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const fileSymbols = extractSymbols(fileContent);
      const exportedSymbols =
        fileSymbols.exports.length > 0
          ? fileSymbols.exports
          : [...fileSymbols.functions, ...fileSymbols.classes];

      if (exportedSymbols.length > 0) {
        const relativePath = path.relative(path.dirname(source_path), filePath).replace(/\\/g, '/');
        const importStatement = generateImportStatement(
          relativePath.startsWith('.') ? relativePath : `./${relativePath}`,
          exportedSymbols
        );
        currentContent = insertImportStatement(currentContent, importStatement);
      }
    }

    // Remove unused imports from source
    currentContent = removeUnusedImports(currentContent);
  }

  const sourceValidation = validateBracketBalance(currentContent, source_path);
  if (!sourceValidation.valid) {
    for (const file of createdFiles) {
      try {
        await fs.unlink(file);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: 'BRACKET VALIDATION FAILED - Source file would have unbalanced brackets after split:',
        },
        ...sourceValidation.errors.map((err) => ({ type: 'text', text: `  ${err}` })),
        {
          type: 'text',
          text: 'Split aborted and created files deleted to prevent structure corruption.',
        },
      ],
    };
  }

  await fs.writeFile(source_path, currentContent, 'utf-8');
  recordAction('REFACTOR_SPLIT', { source_path, createdFiles });

  return {
    content: [
      {
        type: 'text',
        text: `Successfully split ${source_path} into ${createdFiles.length} file(s). Bracket validation passed. ${manage_imports ? 'Imports managed automatically.' : ''} Created files: ${createdFiles.join(', ')}`,
      },
    ],
    uri: toWindsurfUri(source_path),
  };
}
