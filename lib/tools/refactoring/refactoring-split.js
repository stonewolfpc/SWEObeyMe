/**
 * Refactoring Split Handler
 * 
 * Responsibility: Split files into multiple files based on delimiters
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

/**
 * Split a file into multiple files based on delimiters
 * @param {Object} args - Split arguments
 * @returns {Object} Result
 */
export async function refactorSplitFile(args) {
  const { source_path, splits } = args; // splits: [{ delimiter, target_path, description }]

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

  for (const split of splits) {
    const { delimiter, target_path, description } = split;

    if (!currentContent.includes(delimiter)) {
      continue;
    }

    const [before, after] = currentContent.split(delimiter);
    const header = `// ${description || 'Module split by SWEObeyMe'}\n// Source: ${source_path}\n\n`;
    const newFileContent = header + delimiter + after;

    if (newFileContent.split('\n').length > 700) {
      return {
        isError: true,
        content: [{ type: 'text', text: `ERROR: Split would cause ${target_path} to exceed 700 lines.` }],
      };
    }

    const validation = validateBracketBalance(newFileContent, target_path);
    if (!validation.valid) {
      return {
        isError: true,
        content: [
          { type: 'text', text: `BRACKET VALIDATION FAILED - ${target_path} would have unbalanced brackets:` },
          ...validation.errors.map(err => ({ type: 'text', text: `  ${err}` })),
          { type: 'text', text: 'Split aborted to prevent structure corruption.' },
        ],
      };
    }

    await fs.writeFile(target_path, newFileContent, 'utf-8');
    createdFiles.push(target_path);

    currentContent = before;
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
        { type: 'text', text: 'BRACKET VALIDATION FAILED - Source file would have unbalanced brackets after split:' },
        ...sourceValidation.errors.map(err => ({ type: 'text', text: `  ${err}` })),
        { type: 'text', text: 'Split aborted and created files deleted to prevent structure corruption.' },
      ],
    };
  }

  await fs.writeFile(source_path, currentContent, 'utf-8');
  recordAction('REFACTOR_SPLIT', { source_path, createdFiles });

  return {
    content: [
      {
        type: 'text',
        text: `Successfully split ${source_path} into ${createdFiles.length} files. Bracket validation passed. Created files: ${createdFiles.join(', ')}`,
      },
    ],
    uri: toWindsurfUri(source_path),
  };
}
