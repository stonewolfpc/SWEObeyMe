import { requireDocumentation, generateChangeSummary as docGenerateChangeSummary, generateCommitMessage } from "../documentation.js";
import { explainRejection, suggestAlternatives, getHistoricalContext, getOperationGuidance } from "../feedback.js";

/**
 * Documentation and feedback tool handlers
 */

export const feedbackHandlers = {
  require_documentation: async (args) => {
    try {
      const result = requireDocumentation(args.content);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Documentation check failed: ${error.message}` }] };
    }
  },

  generate_change_summary: async (args) => {
    try {
      const summary = docGenerateChangeSummary(args.path, args.changes);
      const commitMessage = generateCommitMessage(args.path, args.changes);
      return {
        content: [{ type: "text", text: `CHANGE SUMMARY:\n${JSON.stringify(summary, null, 2)}\n\nCOMMIT MESSAGE:\n${commitMessage}` }]
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Summary generation failed: ${error.message}` }] };
    }
  },

  explain_rejection: async (args) => {
    try {
      const result = explainRejection(args.reason, args.context);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Rejection explanation failed: ${error.message}` }] };
    }
  },

  suggest_alternatives: async (args) => {
    try {
      const result = suggestAlternatives(args.failed_operation, args.context);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Alternative suggestion failed: ${error.message}` }] };
    }
  },

  get_historical_context: async (args) => {
    try {
      const result = await getHistoricalContext(args.path);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Historical context failed: ${error.message}` }] };
    }
  },

  get_operation_guidance: async (args) => {
    try {
      const result = getOperationGuidance(args.operation, args.context);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Operation guidance failed: ${error.message}` }] };
    }
  }
};
