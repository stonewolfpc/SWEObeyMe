/**
 * Refactoring Inline Handler
 *
 * Responsibility: Inline functions by replacing calls with implementations
 * Separated from: handlers-refactoring.js (SoC compliance)
 *
 * @module lib/tools/refactoring/refactoring-inline
 */

import fs from 'fs/promises';
import { toWindsurfUri } from '../../utils.js';
import { recordAction } from '../../session.js';
import { validateBracketBalance } from './bracket-validator.js';

/**
 * Inline a function by replacing its calls with its implementation
 * @param {Object} args - Inline arguments
 * @returns {Object} Result
 */
export async function refactorInline(args) {
  const { file_path, function_name, replacement_code } = args;

  const content = await fs.readFile(file_path, 'utf-8');

  const replacementValidation = validateBracketBalance(replacement_code, file_path);
  if (!replacementValidation.valid) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: 'BRACKET VALIDATION FAILED - Replacement code has unbalanced brackets:',
        },
        ...replacementValidation.errors.map((err) => ({ type: 'text', text: `  ${err}` })),
        { type: 'text', text: 'Inline aborted to prevent structure corruption.' },
      ],
    };
  }

  const callPattern = new RegExp(`${function_name}\\s*\\([^)]*\\)`, 'g');
  const newContent = content.replace(callPattern, replacement_code);

  if (newContent === content) {
    return {
      isError: true,
      content: [{ type: 'text', text: `ERROR: No calls to function "${function_name}" found.` }],
    };
  }

  const validation = validateBracketBalance(newContent, file_path);
  if (!validation.valid) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: 'BRACKET VALIDATION FAILED - Inline would create unbalanced brackets:',
        },
        ...validation.errors.map((err) => ({ type: 'text', text: `  ${err}` })),
        { type: 'text', text: 'Inline aborted to prevent structure corruption.' },
      ],
    };
  }

  await fs.writeFile(file_path, newContent, 'utf-8');
  recordAction('REFACTOR_INLINE', { file_path, function_name });

  return {
    content: [
      {
        type: 'text',
        text: `Successfully inlined calls to "${function_name}" in ${file_path}. Bracket validation passed.`,
      },
    ],
    uri: toWindsurfUri(file_path),
  };
}
