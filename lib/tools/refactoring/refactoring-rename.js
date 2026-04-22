/**
 * Refactoring Rename Handler
 * 
 * Responsibility: Rename symbols across files
 * Separated from: handlers-refactoring.js (SoC compliance)
 * 
 * @module lib/tools/refactoring/refactoring-rename
 */

import fs from 'fs/promises';
import { toWindsurfUri } from '../../utils.js';
import { recordAction } from '../../session.js';
import { validateBracketBalance } from './bracket-validator.js';

/**
 * Rename a symbol (function, class, variable) across a file
 * @param {Object} args - Rename arguments
 * @returns {Object} Result
 */
export async function refactorRenameSymbol(args) {
  const { file_path, old_name, new_name, symbol_type = 'all' } = args;

  const content = await fs.readFile(file_path, 'utf-8');

  let patterns;
  switch (symbol_type) {
    case 'function':
      patterns = [
        new RegExp(`function\\s+${old_name}\\s*\\(`, 'g'),
        new RegExp(`const\\s+${old_name}\\s*=\\s*\\(`, 'g'),
        new RegExp(`${old_name}\\s*\\(`, 'g'),
      ];
      break;
    case 'class':
      patterns = [
        new RegExp(`class\\s+${old_name}\\s*\\{`, 'g'),
        new RegExp(`new\\s+${old_name}\\s*\\(`, 'g'),
      ];
      break;
    case 'variable':
      patterns = [
        new RegExp(`let\\s+${old_name}\\s*=`, 'g'),
        new RegExp(`const\\s+${old_name}\\s*=`, 'g'),
        new RegExp(`var\\s+${old_name}\\s*=`, 'g'),
      ];
      break;
    default: // all
      patterns = [new RegExp(`\\b${old_name}\\b`, 'g')];
  }

  let newContent = content;
  patterns.forEach(pattern => {
    newContent = newContent.replace(pattern, new_name);
  });

  if (newContent === content) {
    return {
      isError: true,
      content: [{ type: 'text', text: `ERROR: Symbol "${old_name}" not found in file.` }],
    };
  }

  const validation = validateBracketBalance(newContent, file_path);
  if (!validation.valid) {
    return {
      isError: true,
      content: [
        { type: 'text', text: 'BRACKET VALIDATION FAILED - Rename would create unbalanced brackets:' },
        ...validation.errors.map(err => ({ type: 'text', text: `  ${err}` })),
        { type: 'text', text: 'Rename aborted to prevent structure corruption.' },
      ],
    };
  }

  await fs.writeFile(file_path, newContent, 'utf-8');
  recordAction('REFACTOR_RENAME', { file_path, old_name, new_name });

  return {
    content: [
      {
        type: 'text',
        text: `Successfully renamed ${symbol_type} "${old_name}" to "${new_name}" in ${file_path}. Bracket validation passed.`,
      },
    ],
    uri: toWindsurfUri(file_path),
  };
}
