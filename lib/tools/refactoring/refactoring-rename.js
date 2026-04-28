/**
 * Refactoring Rename Handler
 *
 * Responsibility: Rename symbols across files with cross-file reference tracking
 * Separated from: handlers-refactoring.js (SoC compliance)
 *
 * @module lib/tools/refactoring/refactoring-rename
 */

import fs from 'fs/promises';
import path from 'path';
import { toWindsurfUri } from '../../utils.js';
import { recordAction } from '../../session.js';
import { validateBracketBalance } from './bracket-validator.js';
import { findSymbolReferences } from './refactoring-utils.js';

/**
 * Rename a symbol (function, class, variable) across a file
 * @param {Object} args - Rename arguments
 * @returns {Object} Result
 */
export async function refactorRenameSymbol(args) {
  const {
    file_path,
    old_name,
    new_name,
    symbol_type = 'all',
    project_root = null,
    cross_file = false,
  } = args;

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
  patterns.forEach((pattern) => {
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
        {
          type: 'text',
          text: 'BRACKET VALIDATION FAILED - Rename would create unbalanced brackets:',
        },
        ...validation.errors.map((err) => ({ type: 'text', text: `  ${err}` })),
        { type: 'text', text: 'Rename aborted to prevent structure corruption.' },
      ],
    };
  }

  await fs.writeFile(file_path, newContent, 'utf-8');

  // Cross-file reference tracking
  const crossFileResults = [];
  if (cross_file && project_root) {
    const references = await findSymbolReferences(project_root, old_name);
    const updatedFiles = [];

    for (const refPath of references) {
      if (refPath === file_path) continue; // Skip the file we already updated

      try {
        const refContent = await fs.readFile(refPath, 'utf-8');
        let newRefContent = refContent;

        patterns.forEach((pattern) => {
          newRefContent = newRefContent.replace(pattern, new_name);
        });

        if (newRefContent !== refContent) {
          const refValidation = validateBracketBalance(newRefContent, refPath);
          if (refValidation.valid) {
            await fs.writeFile(refPath, newRefContent, 'utf-8');
            updatedFiles.push(refPath);
            crossFileResults.push({
              file: refPath,
              status: 'updated',
            });
          } else {
            crossFileResults.push({
              file: refPath,
              status: 'skipped',
              reason: 'bracket validation failed',
            });
          }
        }
      } catch (e) {
        crossFileResults.push({
          file: refPath,
          status: 'error',
          reason: e.message,
        });
      }
    }
  }

  recordAction('REFACTOR_RENAME', {
    file_path,
    old_name,
    new_name,
    cross_file_count: crossFileResults.filter((r) => r.status === 'updated').length,
  });

  const responseText = cross_file
    ? `Successfully renamed ${symbol_type} "${old_name}" to "${new_name}" in ${file_path}. Bracket validation passed. Updated ${crossFileResults.filter((r) => r.status === 'updated').length} additional file(s) with references.`
    : `Successfully renamed ${symbol_type} "${old_name}" to "${new_name}" in ${file_path}. Bracket validation passed.`;

  return {
    content: [
      {
        type: 'text',
        text: responseText,
      },
      ...(cross_file && crossFileResults.length > 0
        ? [
          { type: 'text', text: '\nCross-file updates:' },
          ...crossFileResults.map((r) => ({
            type: 'text',
            text: `  ${r.file}: ${r.status}${r.reason ? ` (${r.reason})` : ''}`,
          })),
        ]
        : []),
    ],
    uri: toWindsurfUri(file_path),
  };
}
