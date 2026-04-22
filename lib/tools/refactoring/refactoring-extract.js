/**
 * Refactoring Extract Handler
 * 
 * Responsibility: Extract code blocks to new files
 * Separated from: handlers-refactoring.js (SoC compliance)
 * 
 * @module lib/tools/refactoring/refactoring-extract
 */

import fs from 'fs/promises';
import path from 'path';
import { toWindsurfUri, normalizePath } from '../../utils.js';
import { createBackup } from '../../backup.js';
import { recordAction } from '../../session.js';
import { validateBracketBalance } from './bracket-validator.js';

/**
 * Extract a code block to a new file
 * @param {Object} args - Extract arguments
 * @returns {Object} Result
 */
export async function extractToNewFile(args) {
  const { source_path, new_file_path, code_block, description, auto_delete = true, leave_reference = false } = args;

  const header = `// ${description || 'Module extracted by SWEObeyMe'}\n// Source: ${source_path}\n\n`;
  const newContent = header + code_block;

  if (newContent.split('\n').length > 700) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'ERROR: Extracted module would exceed 700 lines.' }],
    };
  }

  const blockValidation = validateBracketBalance(code_block, source_path);
  if (!blockValidation.valid) {
    return {
      isError: true,
      content: [
        { type: 'text', text: 'BRACKET VALIDATION FAILED - Code block has unbalanced brackets:' },
        ...blockValidation.errors.map(err => ({ type: 'text', text: `  ${err}` })),
        { type: 'text', text: 'Extract aborted to prevent structure corruption.' },
      ],
    };
  }

  const backupPath = await createBackup(source_path);
  if (!backupPath) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'BACKUP FAILED: Cannot extract without verified backup.' }],
    };
  }

  await fs.writeFile(new_file_path, newContent, 'utf-8');

  const sourceContent = await fs.readFile(source_path, 'utf-8');

  let newSourceContent;
  if (leave_reference) {
    newSourceContent = sourceContent.replace(
      code_block,
      `// [EXTRACTED TO ${path.basename(new_file_path)}]\n// See: ${new_file_path}`,
    );
  } else if (auto_delete) {
    newSourceContent = sourceContent.replace(code_block, '');
  } else {
    newSourceContent = sourceContent;
  }

  const sourceValidation = validateBracketBalance(newSourceContent, source_path);
  if (!sourceValidation.valid) {
    await fs.unlink(new_file_path);
    return {
      isError: true,
      content: [
        { type: 'text', text: 'BRACKET VALIDATION FAILED - Source file would have unbalanced brackets after extraction:' },
        ...sourceValidation.errors.map(err => ({ type: 'text', text: `  ${err}` })),
        { type: 'text', text: 'Extract aborted and new file deleted to prevent structure corruption.' },
      ],
    };
  }

  await fs.writeFile(source_path, newSourceContent, 'utf-8');

  recordAction('EXTRACT', { from: source_path, to: new_file_path });
  return {
    content: [
      {
        type: 'text',
        text: leave_reference
          ? `Successfully extracted to ${new_file_path} (URI: ${normalizePath(new_file_path)}). Source has reference comment preserved. Bracket validation passed.`
          : `Successfully extracted to ${new_file_path} (URI: ${normalizePath(new_file_path)}). Source code removed automatically. Bracket validation passed.`,
      },
    ],
    uri: toWindsurfUri(new_file_path),
  };
}
