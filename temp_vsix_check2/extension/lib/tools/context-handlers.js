import fs from 'fs/promises';
import { getFileContext, analyzeChangeImpact, getSymbolReferences } from '../context.js';
import { generateDiff, formatDiff, getChangeSummary } from '../comparison.js';

/**
 * Context and comparison tool handlers
 */

export const contextHandlers = {
  diff_changes: async args => {
    try {
      const currentContent = await fs.readFile(args.path, 'utf-8');
      const diff = generateDiff(currentContent, args.proposed_content);
      const summary = getChangeSummary(currentContent, args.proposed_content);
      return {
        content: [
          {
            type: 'text',
            text: `CHANGE SUMMARY:\n${JSON.stringify(summary, null, 2)}\n\nDIFF:\n${formatDiff(diff)}`,
          },
        ],
      };
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: `Diff failed: ${error.message}` }] };
    }
  },

  get_file_context: async args => {
    try {
      const context = await getFileContext(args.path);
      return {
        content: [{ type: 'text', text: JSON.stringify(context, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to get file context: ${error.message}` }],
      };
    }
  },

  analyze_change_impact: async args => {
    try {
      const impact = await analyzeChangeImpact(args.path, args.changes);
      return {
        content: [{ type: 'text', text: JSON.stringify(impact, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Impact analysis failed: ${error.message}` }],
      };
    }
  },

  get_symbol_references: async args => {
    try {
      const references = await getSymbolReferences(args.path, args.symbol);
      return {
        content: [{ type: 'text', text: JSON.stringify(references, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to get symbol references: ${error.message}` }],
      };
    }
  },
};
