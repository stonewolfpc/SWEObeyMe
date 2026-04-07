import fs from 'fs/promises';
import path from 'path';
import { toWindsurfUri, normalizePath } from '../utils.js';
import { createBackup, BACKUP_DIR } from '../backup.js';
import { recordAction } from '../session.js';

/**
 * Refactoring handlers
 */
export const refactoringHandlers = {
  /**
   * Move a code block from one file to another
   */
  refactor_move_block: async args => {
    const sourceContent = await fs.readFile(args.source_path, 'utf-8');

    if (!sourceContent.includes(args.code_block)) {
      return {
        isError: true,
        content: [
          { type: 'text', text: 'ERROR: Code block not found in source file. Move aborted.' },
        ],
      };
    }

    let targetContent = '';
    try {
      targetContent = await fs.readFile(args.target_path, 'utf-8');
    } catch (e) {
      targetContent = '// New Module created by SWEObeyMe\n';
    }

    const newTargetContent = targetContent + '\n' + args.code_block;

    if (newTargetContent.split('\n').length > 700) {
      return {
        isError: true,
        content: [
          { type: 'text', text: 'ERROR: Move would cause target file to exceed 700 lines.' },
        ],
      };
    }

    await fs.writeFile(args.target_path, newTargetContent, 'utf-8');
    const newSourceContent = sourceContent.replace(
      args.code_block,
      `// [MOVED TO ${path.basename(args.target_path)}]`
    );
    await fs.writeFile(args.source_path, newSourceContent, 'utf-8');

    recordAction('REFACTOR_MOVE', { from: args.source_path, to: args.target_path });
    return {
      content: [
        {
          type: 'text',
          text: `Successfully moved code block to ${args.target_path} (URI: ${normalizePath(args.target_path)}). Source has been updated with a reference comment.`,
        },
      ],
      uri: toWindsurfUri(args.target_path),
    };
  },

  /**
   * Extract a code block to a new file
   */
  extract_to_new_file: async args => {
    const header = `// ${args.description || 'Module extracted by SWEObeyMe'}\n// Source: ${args.source_path}\n\n`;
    const newContent = header + args.code_block;

    if (newContent.split('\n').length > 700) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'ERROR: Extracted module would exceed 700 lines.' }],
      };
    }

    const backupPath = await createBackup(args.source_path);
    if (!backupPath) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'BACKUP FAILED: Cannot extract without verified backup.' }],
      };
    }

    await fs.writeFile(args.new_file_path, newContent, 'utf-8');

    const sourceContent = await fs.readFile(args.source_path, 'utf-8');
    const newSourceContent = sourceContent.replace(
      args.code_block,
      `// [EXTRACTED TO ${path.basename(args.new_file_path)}]\n// See: ${args.new_file_path}`
    );
    await fs.writeFile(args.source_path, newSourceContent, 'utf-8');

    recordAction('EXTRACT', { from: args.source_path, to: args.new_file_path });
    return {
      content: [
        {
          type: 'text',
          text: `Successfully extracted to ${args.new_file_path} (URI: ${normalizePath(args.new_file_path)}). Source has been updated with reference comments.`,
        },
      ],
      uri: toWindsurfUri(args.new_file_path),
    };
  },
};
