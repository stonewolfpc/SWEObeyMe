import fs from 'fs/promises';
import path from 'path';
import { toWindsurfUri, normalizePath } from '../utils.js';
import { createBackup, BACKUP_DIR } from '../backup.js';
import { recordAction } from '../session.js';
import { validateSyntax } from '../validation.js';

/**
 * Refactoring handlers - Swiss-Army-Knife for all refactoring needs
 * With bracket-aware validation to prevent structure corruption
 */
export const refactoringHandlers = {
  /**
   * Unified refactoring operation
   * Supports: move, extract, rename, inline, replace, delete, split
   */
  refactor_manage: async args => {
    const { operation, ...operationArgs } = args;

    switch (operation) {
      case 'move':
        return refactoringHandlers.refactor_move_block(operationArgs);
      case 'extract':
        return refactoringHandlers.extract_to_new_file(operationArgs);
      case 'rename':
        return refactoringHandlers.refactor_rename_symbol(operationArgs);
      case 'inline':
        return refactoringHandlers.refactor_inline(operationArgs);
      case 'replace':
        return refactoringHandlers.refactor_replace(operationArgs);
      case 'delete':
        return refactoringHandlers.refactor_delete(operationArgs);
      case 'split':
        return refactoringHandlers.refactor_split_file(operationArgs);
      default:
        return {
          isError: true,
          content: [{ type: 'text', text: `ERROR: Unknown refactoring operation: ${operation}` }],
        };
    }
  },

  /**
   * Validate bracket balance before and after refactoring
   */
  validateBracketBalance: (content, filePath) => {
    const result = validateSyntax(content);
    if (!result.valid && result.bracketErrors && result.bracketErrors.length > 0) {
      return {
        valid: false,
        errors: result.bracketErrors.map(err => err.message),
      };
    }
    return { valid: true, errors: [] };
  },

  /**
   * Move a code block from one file to another
   * NEW: auto_delete option to remove source code automatically (default: true)
   * leave_reference option to keep comment in source (useful for file splits)
   * NEW: bracket validation to prevent structure corruption
   */
  refactor_move_block: async args => {
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

    // Validate bracket balance in code block before moving
    const blockValidation = refactoringHandlers.validateBracketBalance(code_block, source_path);
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

    // Validate bracket balance in target before writing
    const targetValidation = refactoringHandlers.validateBracketBalance(newTargetContent, target_path);
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

    // Auto-delete source code unless leave_reference is true
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

    // Validate bracket balance in source after removal
    const sourceValidation = refactoringHandlers.validateBracketBalance(newSourceContent, source_path);
    if (!sourceValidation.valid) {
      // Rollback target write
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
  },

  /**
   * Extract a code block to a new file
   * NEW: auto_delete option to remove source code automatically (default: true)
   * leave_reference option to keep comment in source (useful for file splits)
   * NEW: bracket validation to prevent structure corruption
   */
  extract_to_new_file: async args => {
    const { source_path, new_file_path, code_block, description, auto_delete = true, leave_reference = false } = args;

    const header = `// ${description || 'Module extracted by SWEObeyMe'}\n// Source: ${source_path}\n\n`;
    const newContent = header + code_block;

    if (newContent.split('\n').length > 700) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'ERROR: Extracted module would exceed 700 lines.' }],
      };
    }

    // Validate bracket balance in code block before extracting
    const blockValidation = refactoringHandlers.validateBracketBalance(code_block, source_path);
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

    // Auto-delete source code unless leave_reference is true
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

    // Validate bracket balance in source after extraction
    const sourceValidation = refactoringHandlers.validateBracketBalance(newSourceContent, source_path);
    if (!sourceValidation.valid) {
      // Rollback new file creation
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
  },

  /**
   * Rename a symbol (function, class, variable) across a file
   * NEW: bracket validation to prevent structure corruption
   */
  refactor_rename_symbol: async args => {
    const { file_path, old_name, new_name, symbol_type = 'all' } = args;

    const content = await fs.readFile(file_path, 'utf-8');

    // Create different patterns based on symbol type
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

    // Validate bracket balance after rename
    const validation = refactoringHandlers.validateBracketBalance(newContent, file_path);
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
  },

  /**
   * Inline a function by replacing its calls with its implementation
   * NEW: bracket validation to prevent structure corruption
   */
  refactor_inline: async args => {
    const { file_path, function_name, replacement_code } = args;

    const content = await fs.readFile(file_path, 'utf-8');

    // Validate bracket balance in replacement code
    const replacementValidation = refactoringHandlers.validateBracketBalance(replacement_code, file_path);
    if (!replacementValidation.valid) {
      return {
        isError: true,
        content: [
          { type: 'text', text: 'BRACKET VALIDATION FAILED - Replacement code has unbalanced brackets:' },
          ...replacementValidation.errors.map(err => ({ type: 'text', text: `  ${err}` })),
          { type: 'text', text: 'Inline aborted to prevent structure corruption.' },
        ],
      };
    }

    // Find and replace function calls with replacement code
    const callPattern = new RegExp(`${function_name}\\s*\\([^)]*\\)`, 'g');
    const newContent = content.replace(callPattern, replacement_code);

    if (newContent === content) {
      return {
        isError: true,
        content: [{ type: 'text', text: `ERROR: No calls to function "${function_name}" found.` }],
      };
    }

    // Validate bracket balance after inline
    const validation = refactoringHandlers.validateBracketBalance(newContent, file_path);
    if (!validation.valid) {
      return {
        isError: true,
        content: [
          { type: 'text', text: 'BRACKET VALIDATION FAILED - Inline would create unbalanced brackets:' },
          ...validation.errors.map(err => ({ type: 'text', text: `  ${err}` })),
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
  },

  /**
   * Replace code block with new implementation
   * NEW: bracket validation to prevent structure corruption
   */
  refactor_replace: async args => {
    const { file_path, old_code, new_code } = args;

    const content = await fs.readFile(file_path, 'utf-8');

    if (!content.includes(old_code)) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'ERROR: Old code block not found in file.' }],
      };
    }

    // Validate bracket balance in new code
    const newCodeValidation = refactoringHandlers.validateBracketBalance(new_code, file_path);
    if (!newCodeValidation.valid) {
      return {
        isError: true,
        content: [
          { type: 'text', text: 'BRACKET VALIDATION FAILED - New code has unbalanced brackets:' },
          ...newCodeValidation.errors.map(err => ({ type: 'text', text: `  ${err}` })),
          { type: 'text', text: 'Replace aborted to prevent structure corruption.' },
        ],
      };
    }

    const newContent = content.replace(old_code, new_code);

    // Validate bracket balance after replace
    const validation = refactoringHandlers.validateBracketBalance(newContent, file_path);
    if (!validation.valid) {
      return {
        isError: true,
        content: [
          { type: 'text', text: 'BRACKET VALIDATION FAILED - Replace would create unbalanced brackets:' },
          ...validation.errors.map(err => ({ type: 'text', text: `  ${err}` })),
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
  },

  /**
   * Delete a code block
   * NEW: bracket validation to prevent structure corruption
   */
  refactor_delete: async args => {
    const { file_path, code_block } = args;

    const content = await fs.readFile(file_path, 'utf-8');

    if (!content.includes(code_block)) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'ERROR: Code block not found in file.' }],
      };
    }

    const newContent = content.replace(code_block, '');

    // Validate bracket balance after delete
    const validation = refactoringHandlers.validateBracketBalance(newContent, file_path);
    if (!validation.valid) {
      return {
        isError: true,
        content: [
          { type: 'text', text: 'BRACKET VALIDATION FAILED - Delete would create unbalanced brackets:' },
          ...validation.errors.map(err => ({ type: 'text', text: `  ${err}` })),
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
  },

  /**
   * Split a file into multiple files based on delimiters
   * This is the ONLY operation that should leave partial code behind
   * NEW: bracket validation to prevent structure corruption
   */
  refactor_split_file: async args => {
    const { source_path, splits } = args; // splits: [{ delimiter, target_path, description }]

    const sourceContent = await fs.readFile(source_path, 'utf-8');
    const backupPath = await createBackup(source_path);

    if (!backupPath) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'BACKUP FAILED: Cannot split without verified backup.' }],
      };
    }

    let remainingContent = sourceContent;
    const results = [];
    const createdFiles = [];

    try {
      for (const split of splits) {
        const { delimiter, target_path, description } = split;

        if (!remainingContent.includes(delimiter)) {
          results.push({ success: false, message: `Delimiter not found: ${delimiter}` });
          continue;
        }

        const parts = remainingContent.split(delimiter);
        const extractedContent = parts[0].trim();
        remainingContent = parts.slice(1).join(delimiter).trim();

        const header = `// ${description || 'Module split by SWEObeyMe'}\n// Source: ${source_path}\n\n`;
        const newContent = header + extractedContent;

        if (newContent.split('\n').length > 700) {
          results.push({ success: false, message: `Split would exceed 700 lines: ${target_path}` });
          continue;
        }

        // Validate bracket balance in extracted content
        const validation = refactoringHandlers.validateBracketBalance(newContent, target_path);
        if (!validation.valid) {
          results.push({
            success: false,
            message: `Bracket validation failed for ${target_path}: ${validation.errors.join(', ')}`,
          });
          continue;
        }

        await fs.writeFile(target_path, newContent, 'utf-8');
        createdFiles.push(target_path);
        results.push({ success: true, path: target_path, lines: newContent.split('\n').length });
      }

      // Validate bracket balance in remaining source content
      const sourceValidation = refactoringHandlers.validateBracketBalance(remainingContent, source_path);
      if (!sourceValidation.valid) {
        // Rollback all created files
        for (const file of createdFiles) {
          await fs.unlink(file).catch(() => {});
        }
        return {
          isError: true,
          content: [
            { type: 'text', text: 'BRACKET VALIDATION FAILED - Remaining source content has unbalanced brackets:' },
            ...sourceValidation.errors.map(err => ({ type: 'text', text: `  ${err}` })),
            { type: 'text', text: 'Split aborted and all created files deleted to prevent structure corruption.' },
          ],
        };
      }

      // Update source file with remaining content and reference comments
      const sourceHeader = `// File split by SWEObMe\n// Remaining content after extraction\n\n`;
      const newSourceContent = sourceHeader + remainingContent;
      await fs.writeFile(source_path, newSourceContent, 'utf-8');

      recordAction('REFACTOR_SPLIT', { source_path, splits: results });

      return {
        content: [
          {
            type: 'text',
            text: `Successfully split ${source_path} into ${results.filter(r => r.success).length} files. Remaining content preserved in source. Bracket validation passed for all files.`,
          },
        ],
      };
    } catch (error) {
      // Rollback all created files on error
      for (const file of createdFiles) {
        await fs.unlink(file).catch(() => {});
      }
      throw error;
    }
  },
};
