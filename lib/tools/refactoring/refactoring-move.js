/**
 * Refactoring Move Handler
 * 
 * Responsibility: Move code blocks between files
 * Separated from: handlers-refactoring.js (SoC compliance)
 * 
 * @module lib/tools/refactoring/refactoring-move
 */

import fs from 'fs/promises';
import path from 'path';
import { toWindsurfUri, normalizePath } from '../../utils.js';
import { recordAction } from '../../session.js';
import { validateBracketBalance } from './bracket-validator.js';

/**
 * Move a code block from one file to another
 * @param {Object} args - Move arguments
 * @returns {Object} Result
 */
export async function refactorMoveBlock(args) {
  const { source_path, target_path, code_block, auto_delete = true, leave_reference = false } = args;

  const sourceContent = await fs.readFile(source_path, 'utf-8');

  if (!sourceContent.includes(code_block)) {
    return {
      isError: true,
      content: [
        { type: 'text', text: 'ERROR: Code block not found in source file. Move aborted.' },
      ],
    };
  }

  const blockValidation = validateBracketBalance(code_block, source_path);
  if (!blockValidation.valid) {
    return {
      isError: true,
      content: [
        { type: 'text', text: 'BRACKET VALIDATION FAILED - Code block has unbalanced brackets:' },
        ...blockValidation.errors.map(err => ({ type: 'text', text: `  ${err}` })),
        { type: 'text', text: 'Move aborted to prevent structure corruption.' },
      ],
    };
  }

  let targetContent = '';
  try {
    targetContent = await fs.readFile(target_path, 'utf-8');
  } catch (e) {
    targetContent = '// New Module created by SWEObeyMe\n';
  }

  const newTargetContent = targetContent + '\n' + code_block;

  if (newTargetContent.split('\n').length > 700) {
    return {
      isError: true,
      content: [
        { type: 'text', text: 'ERROR: Move would cause target file to exceed 700 lines.' },
      ],
    };
  }

  const targetValidation = validateBracketBalance(newTargetContent, target_path);
  if (!targetValidation.valid) {
    return {
      isError: true,
      content: [
        { type: 'text', text: 'BRACKET VALIDATION FAILED - Target file would have unbalanced brackets:' },
        ...targetValidation.errors.map(err => ({ type: 'text', text: `  ${err}` })),
        { type: 'text', text: 'Move aborted to prevent structure corruption.' },
      ],
    };
  }

  await fs.writeFile(target_path, newTargetContent, 'utf-8');

  let newSourceContent;
  if (leave_reference) {
    newSourceContent = sourceContent.replace(
      code_block,
      `// [MOVED TO ${path.basename(target_path)}]`,
    );
  } else if (auto_delete) {
    newSourceContent = sourceContent.replace(code_block, '');
  } else {
    newSourceContent = sourceContent;
  }

  const sourceValidation = validateBracketBalance(newSourceContent, source_path);
  if (!sourceValidation.valid) {
    await fs.writeFile(target_path, targetContent, 'utf-8');
    return {
      isError: true,
      content: [
        { type: 'text', text: 'BRACKET VALIDATION FAILED - Source file would have unbalanced brackets after removal:' },
        ...sourceValidation.errors.map(err => ({ type: 'text', text: `  ${err}` })),
        { type: 'text', text: 'Move aborted and target file rolled back to prevent structure corruption.' },
      ],
    };
  }

  await fs.writeFile(source_path, newSourceContent, 'utf-8');

  recordAction('REFACTOR_MOVE', { from: source_path, to: target_path });
  return {
    content: [
      {
        type: 'text',
        text: leave_reference
          ? `Successfully moved code block to ${target_path} (URI: ${normalizePath(target_path)}). Source has reference comment preserved. Bracket validation passed.`
          : `Successfully moved code block to ${target_path} (URI: ${normalizePath(target_path)}). Source code removed automatically. Bracket validation passed.`,
      },
    ],
    uri: toWindsurfUri(target_path),
  };
}
