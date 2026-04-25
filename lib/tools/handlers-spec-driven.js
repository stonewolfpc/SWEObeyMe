/**
 * Spec-Driven Development Handlers
 * Addresses RedMonk Complaint #6: Spec-Driven Development
 */

import { getSpecTracker, getSpecVerificationCheckpoint } from '../spec-driven-development.js';

/**
 * Spec-driven development handlers
 */
export const specDrivenHandlers = {
  /**
   * Load spec files
   */
  spec_load: async (args) => {
    const { workspace_path } = args;

    try {
      const tracker = getSpecTracker();
      const specs = await tracker.loadSpecs(workspace_path || process.cwd());

      let output = '\n';
      output += '='.repeat(60) + '\n';
      output += 'SPEC FILES LOADED\n';
      output += '='.repeat(60) + '\n\n';

      if (specs.requirements) {
        output += `✅ requirements.md (${specs.requirements.items.length} items)\n`;
      } else {
        output += `❌ requirements.md (not found)\n`;
      }

      if (specs.design) {
        output += `✅ design.md (${specs.design.items.length} items)\n`;
      } else {
        output += `❌ design.md (not found)\n`;
      }

      if (specs.tasks) {
        output += `✅ tasks.md (${specs.tasks.items.length} items)\n`;
      } else {
        output += `❌ tasks.md (not found)\n`;
      }

      output += '\n';

      return {
        content: [{ type: 'text', text: output }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to load specs: ${error.message}` }],
      };
    }
  },

  /**
   * Get spec compliance report
   */
  spec_compliance: async (args) => {
    try {
      const tracker = getSpecTracker();
      const report = tracker.generateComplianceReport();

      return {
        content: [{ type: 'text', text: report }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to generate compliance report: ${error.message}` }],
      };
    }
  },

  /**
   * Verify implementation against specs
   */
  spec_verify: async (args) => {
    const { workspace_path } = args;

    try {
      const checkpoint = getSpecVerificationCheckpoint();
      const results = await checkpoint.verify(workspace_path || process.cwd());
      const report = checkpoint.formatVerificationReport(results);

      return {
        content: [{ type: 'text', text: report }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to verify specs: ${error.message}` }],
      };
    }
  },

  /**
   * Update spec item status
   */
  spec_update: async (args) => {
    const { spec_type, item_id, status, update_content = '' } = args;

    if (!spec_type || !item_id || !status) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'spec_type, item_id, and status are required' }],
      };
    }

    try {
      const tracker = getSpecTracker();
      const result = await tracker.updateSpecItem(spec_type, item_id, status, update_content);

      return {
        content: [
          {
            type: 'text',
            text: `Updated ${spec_type} item ${item_id} to status: ${status}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to update spec: ${error.message}` }],
      };
    }
  },

  /**
   * Track implementation against specs
   */
  spec_track: async (args) => {
    const { file_path, spec_item_ids } = args;

    if (!file_path || !spec_item_ids) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'file_path and spec_item_ids are required' }],
      };
    }

    try {
      const tracker = getSpecTracker();
      tracker.trackImplementation(file_path, spec_item_ids);

      return {
        content: [
          {
            type: 'text',
            text: `Tracked ${file_path} against spec items: ${spec_item_ids.join(', ')}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to track implementation: ${error.message}` }],
      };
    }
  },

  /**
   * Check for divergences
   */
  spec_divergence: async (args) => {
    try {
      const tracker = getSpecTracker();
      const divergences = tracker.checkDivergence();

      let output = '\n';
      output += '='.repeat(60) + '\n';
      output += 'SPEC DIVERGENCE CHECK\n';
      output += '='.repeat(60) + '\n\n';

      if (divergences.length === 0) {
        output += 'No divergences detected.\n';
      } else {
        output += `Found ${divergences.length} divergences:\n\n`;
        divergences.forEach((div) => {
          output += `- ${div.filePath}\n`;
          output += `  ${div.description}\n`;
          output += `  ${div.timestamp}\n\n`;
        });
      }

      output += '='.repeat(60) + '\n';

      return {
        content: [{ type: 'text', text: output }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to check divergences: ${error.message}` }],
      };
    }
  },
};
