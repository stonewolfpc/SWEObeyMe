/**
 * Refactoring Replace Handler
 *
 * Responsibility: Replace code blocks with new implementations
 * Separated from: handlers-refactoring.js (SoC compliance)
 *
 * @module lib/tools/refactoring/refactoring-replace
 */

import fs from 'fs/promises';
import { readFileWithSizeLimit } from '../../shared/async-utils.js';
import { toWindsurfUri } from '../../utils.js';
import { recordAction } from '../../session.js';
import { validateBracketBalance } from './bracket-validator.js';

/**
 * Replace code block with new implementation
 * @param {Object} args - Replace arguments
 * @returns {Object} Result
 */
export async function refactorReplace(args) {
  const { file_path, old_code, new_code } = args;

  const content = await readFileWithSizeLimit(file_path);

  if (!content.includes(old_code)) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'ERROR: Old code block not found in file.' }],
    };
  }

  const newCodeValidation = validateBracketBalance(new_code, file_path);
  if (!newCodeValidation.valid) {
    return {
      isError: true,
      content: [
        { type: 'text', text: 'BRACKET VALIDATION FAILED - New code has unbalanced brackets:' },
        ...newCodeValidation.errors.map((err) => ({ type: 'text', text: `  ${err}` })),
        { type: 'text', text: 'Replace aborted to prevent structure corruption.' },
      ],
    };
  }

  const newContent = content.replace(old_code, new_code);

  const validation = validateBracketBalance(newContent, file_path);
  if (!validation.valid) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: 'BRACKET VALIDATION FAILED - Replace would create unbalanced brackets:',
        },
        ...validation.errors.map((err) => ({ type: 'text', text: `  ${err}` })),
        { type: 'text', text: 'Replace aborted to prevent structure corruption.' },
      ],
    };
  }

  await fs.writeFile(file_path, newContent, 'utf-8');
  recordAction('REFACTOR_REPLACE', { file_path });

  return {
    content: [
      {
        type: 'text',
        text: `Successfully replaced code block in ${file_path}. Bracket validation passed.`,
      },
    ],
    uri: toWindsurfUri(file_path),
  };
}
