/**
 * Refactoring Move Handler
 *
 * Responsibility: Move code blocks between files with import management
 * Separated from: handlers-refactoring.js (SoC compliance)
 *
 * @module lib/tools/refactoring/refactoring-move
 */

import fs from 'fs/promises';
import path from 'path';
import { readFileWithSizeLimit } from '../../shared/async-utils.js';
import { toWindsurfUri, normalizePath } from '../../utils.js';
import { recordAction } from '../../session.js';
import { validateBracketBalance } from './bracket-validator.js';
import {
  parseImports,
  extractSymbols,
  generateImportStatement,
  insertImportStatement,
  removeUnusedImports,
} from './refactoring-utils.js';

/**
 * Move a code block from one file to another
 * @param {Object} args - Move arguments
 * @returns {Object} Result
 */
export async function refactorMoveBlock(args) {
  const {
    source_path,
    target_path,
    code_block,
    auto_delete = true,
    leave_reference = false,
    manage_imports = true,
  } = args;

  const sourceContent = await readFileWithSizeLimit(source_path);

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
        ...blockValidation.errors.map((err) => ({ type: 'text', text: `  ${err}` })),
        { type: 'text', text: 'Move aborted to prevent structure corruption.' },
      ],
    };
  }

  let targetContent = '';
  try {
    targetContent = await readFileWithSizeLimit(target_path);
  } catch (e) {
    targetContent = '// New Module created by SWEObeyMe\n';
  }

  // Analyze dependencies if managing imports
  let targetContentWithBlock = targetContent + '\n' + code_block;
  if (manage_imports) {
    const sourceImports = parseImports(sourceContent);
    const movedSymbols = extractSymbols(code_block);

    // Add necessary imports to target file
    for (const imp of sourceImports) {
      const importedSymbols = imp.specifier
        .split(',')
        .map((s) => s.trim().replace(/[{}]/g, '').trim());
      const usedSymbols = importedSymbols.filter(
        (s) =>
          movedSymbols.functions.includes(s) ||
          movedSymbols.classes.includes(s) ||
          movedSymbols.variables.includes(s) ||
          code_block.includes(s)
      );

      if (usedSymbols.length > 0) {
        targetContentWithBlock = insertImportStatement(targetContentWithBlock, imp.statement);
      }
    }
  }

  if (targetContentWithBlock.split('\n').length > 700) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'ERROR: Move would cause target file to exceed 700 lines.' }],
    };
  }

  const targetValidation = validateBracketBalance(targetContentWithBlock, target_path);
  if (!targetValidation.valid) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: 'BRACKET VALIDATION FAILED - Target file would have unbalanced brackets:',
        },
        ...targetValidation.errors.map((err) => ({ type: 'text', text: `  ${err}` })),
        { type: 'text', text: 'Move aborted to prevent structure corruption.' },
      ],
    };
  }

  await fs.writeFile(target_path, targetContentWithBlock, 'utf-8');

  let newSourceContent;
  if (leave_reference) {
    newSourceContent = sourceContent.replace(
      code_block,
      `// [MOVED TO ${path.basename(target_path)}]`
    );
  } else if (auto_delete) {
    newSourceContent = sourceContent.replace(code_block, '');
  } else {
    newSourceContent = sourceContent;
  }

  // Add import statement to source file if managing imports and auto_delete
  if (manage_imports && auto_delete) {
    const movedSymbols = extractSymbols(code_block);
    const exportedSymbols =
      movedSymbols.exports.length > 0
        ? movedSymbols.exports
        : [...movedSymbols.functions, ...movedSymbols.classes];

    if (exportedSymbols.length > 0) {
      const relativePath = path
        .relative(path.dirname(source_path), target_path)
        .replace(/\\/g, '/');
      const importStatement = generateImportStatement(
        relativePath.startsWith('.') ? relativePath : `./${relativePath}`,
        exportedSymbols
      );
      newSourceContent = insertImportStatement(newSourceContent, importStatement);
    }

    // Remove unused imports from source
    newSourceContent = removeUnusedImports(newSourceContent);
  }

  const sourceValidation = validateBracketBalance(newSourceContent, source_path);
  if (!sourceValidation.valid) {
    await fs.writeFile(target_path, targetContent, 'utf-8');
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: 'BRACKET VALIDATION FAILED - Source file would have unbalanced brackets after removal:',
        },
        ...sourceValidation.errors.map((err) => ({ type: 'text', text: `  ${err}` })),
        {
          type: 'text',
          text: 'Move aborted and target file rolled back to prevent structure corruption.',
        },
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
          ? `Successfully moved code block to ${target_path} (URI: ${normalizePath(target_path)}). Source has reference comment preserved. Bracket validation passed. ${manage_imports ? 'Imports managed automatically.' : ''}`
          : `Successfully moved code block to ${target_path} (URI: ${normalizePath(target_path)}). Source code removed automatically. Bracket validation passed. ${manage_imports ? 'Imports managed automatically.' : ''}`,
      },
    ],
    uri: toWindsurfUri(target_path),
  };
}
