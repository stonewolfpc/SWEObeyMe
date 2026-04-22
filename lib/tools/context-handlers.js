import fs from 'fs/promises';
import { getFileContext, analyzeChangeImpact, getSymbolReferences } from '../context.js';
import { generateDiff, formatDiff, getChangeSummary } from '../comparison.js';

/**
 * Context and comparison tool handlers
 */

/**
 * Dispatcher: analyze_file swiss-army-knife handler
 * Routes to appropriate handler based on operation parameter
 */
export async function analyze_file_handler(params) {
  const { operation, path, changes, symbol, proposed_content } = params;

  if (!operation) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'operation parameter is required' }],
    };
  }

  switch (operation) {
    case 'context':
      return await get_file_context({ path });
    case 'impact':
      return await analyze_change_impact({ path, changes });
    case 'references':
      return await get_symbol_references({ path, symbol });
    case 'diff':
      return await diff_changes({ path, proposed_content });
    case 'history':
      return await get_historical_context({ path });
    default:
      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown operation: ${operation}` }],
      };
  }
}

export const contextHandlers = {
  analyze_file_handler,
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

  get_historical_context: async args => {
    try {
      const { filePath, limit = 10 } = args;
      
      // Get file modification history using git
      const { execSync } = require('child_process');
      const fs = require('fs');
      const path = require('path');
      
      if (!filePath || !fs.existsSync(filePath)) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: 'File not found or no path provided' }, null, 2) }],
        };
      }
      
      let history = [];
      
      try {
        // Get git log for the file
        const gitLog = execSync(`git log --oneline -n ${limit} -- "${filePath}"`, {
          encoding: 'utf8',
          cwd: path.dirname(filePath),
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        
        history = gitLog.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const parts = line.split(' ', 2);
            return {
              hash: parts[0],
              message: parts[1] || '',
            };
          });
      } catch (gitError) {
        // Git not available or not a git repo
        history = [{
          hash: 'N/A',
          message: 'Git history not available',
        }];
      }
      
      // Get file stats
      const stats = fs.statSync(filePath);
      const lastModified = new Date(stats.mtime).toISOString();
      
      return {
        content: [{ 
          type: 'text', 
          text: JSON.stringify({
            file: filePath,
            lastModified,
            history,
            recentEdits: history.length,
          }, null, 2)
        }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to get historical context: ${error.message}` }],
      };
    }
  },
};
