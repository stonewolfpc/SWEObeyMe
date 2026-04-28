/**
 * Refactoring Delete Handler
 *
 * Responsibility: Delete code blocks from files
 * Separated from: handlers-refactoring.js (SoC compliance)
 *
 * @module lib/tools/refactoring/refactoring-delete
 */

import fs from 'fs/promises';
import { readFileWithSizeLimit } from '../../shared/async-utils.js';
import { toWindsurfUri } from '../../utils.js';
import { recordAction } from '../../session.js';
import { validateBracketBalance } from './bracket-validator.js';

/**
 * Delete a code block
 * @param {Object} args - Delete arguments
 * @returns {Object} Result
 */
export async function refactorDelete(args) {
  const { file_path, code_block } = args;

  const content = await readFileWithSizeLimit(file_path);

  if (!content.includes(code_block)) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'ERROR: Code block not found in file.' }],
    };
  }

  const newContent = content.replace(code_block, '');

  const validation = validateBracketBalance(newContent, file_path);
  if (!validation.valid) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: 'BRACKET VALIDATION FAILED - Delete would create unbalanced brackets:',
        },
        ...validation.errors.map((err) => ({ type: 'text', text: `  ${err}` })),
        { type: 'text', text: 'Delete aborted to prevent structure corruption.' },
      ],
    };
  }

  await fs.writeFile(file_path, newContent, 'utf-8');
  recordAction('REFACTOR_DELETE', { file_path });

  return {
    content: [
      {
        type: 'text',
        text: `Successfully deleted code block from ${file_path}. Bracket validation passed.`,
      },
    ],
    uri: toWindsurfUri(file_path),
  };
}
