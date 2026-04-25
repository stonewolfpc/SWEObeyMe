/**
 * Refactoring handlers - Swiss-Army-Knife for all refactoring needs
 * Responsibility: Orchestrate refactoring operations
 * Delegates to: bracket-validator, refactoring-move, refactoring-extract, refactoring-rename, refactoring-inline, refactoring-replace, refactoring-delete, refactoring-split (SoC compliance)
 *
 * @module lib/tools/handlers-refactoring
 */

import { validateBracketBalance } from './refactoring/bracket-validator.js';
import { refactorMoveBlock } from './refactoring/refactoring-move.js';
import { extractToNewFile } from './refactoring/refactoring-extract.js';
import { refactorRenameSymbol } from './refactoring/refactoring-rename.js';
import { refactorInline } from './refactoring/refactoring-inline.js';
import { refactorReplace } from './refactoring/refactoring-replace.js';
import { refactorDelete } from './refactoring/refactoring-delete.js';
import { refactorSplitFile } from './refactoring/refactoring-split.js';

/**
 * Refactoring handlers - unified dispatcher for all refactoring operations
 */
export const refactoringHandlers = {
  /**
   * Unified refactoring operation
   * Supports: move, extract, rename, inline, replace, delete, split
   */
  refactor_manage: async (args) => {
    const { operation, ...operationArgs } = args;

    switch (operation) {
      case 'move':
        return refactorMoveBlock(operationArgs);
      case 'extract':
        return extractToNewFile(operationArgs);
      case 'rename':
        return refactorRenameSymbol(operationArgs);
      case 'inline':
        return refactorInline(operationArgs);
      case 'replace':
        return refactorReplace(operationArgs);
      case 'delete':
        return refactorDelete(operationArgs);
      case 'split':
        return refactorSplitFile(operationArgs);
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
  validateBracketBalance,

  /**
   * Move a code block from one file to another
   * Delegates to: refactoring-move.js
   */
  refactor_move_block: refactorMoveBlock,

  /**
   * Extract a code block to a new file
   * Delegates to: refactoring-extract.js
   */
  extract_to_new_file: extractToNewFile,

  /**
   * Rename a symbol (function, class, variable) across a file
   * Delegates to: refactoring-rename.js
   */
  refactor_rename_symbol: refactorRenameSymbol,

  /**
   * Inline a function by replacing its calls with its implementation
   * Delegates to: refactoring-inline.js
   */
  refactor_inline: refactorInline,

  /**
   * Replace code block with new implementation
   * Delegates to: refactoring-replace.js
   */
  refactor_replace: refactorReplace,

  /**
   * Delete a code block
   * Delegates to: refactoring-delete.js
   */
  refactor_delete: refactorDelete,

  /**
   * Split a file into multiple files based on delimiters
   * Delegates to: refactoring-split.js
   */
  refactor_split_file: refactorSplitFile,
};
