import { getAllConfig, setConfig, setConfigValues, resetConfig, getConfigSchema, saveConfig, setConfig as setConfigDirect } from "../config.js";

/**
 * Configuration tool handlers
 */

export const configHandlers = {
  get_config: async (args) => {
    try {
      const config = getAllConfig();
      return {
        content: [{ type: "text", text: JSON.stringify(config, null, 2) }]
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Failed to get configuration: ${error.message}` }] };
    }
  },

  set_config: async (args) => {
    try {
      setConfigValues(args.settings);
      await saveConfig();
      return {
        content: [{ type: "text", text: `Configuration updated successfully. New settings:\n${JSON.stringify(args.settings, null, 2)}` }]
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Failed to set configuration: ${error.message}` }] };
    }
  },

  reset_config: async (args) => {
    try {
      resetConfig();
      await saveConfig();
      return {
        content: [{ type: "text", text: "Configuration reset to defaults." }]
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Failed to reset configuration: ${error.message}` }] };
    }
  },

  get_config_schema: async (args) => {
    try {
      const schema = getConfigSchema();
      return {
        content: [{ type: "text", text: JSON.stringify(schema, null, 2) }]
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Failed to get configuration schema: ${error.message}` }] };
    }
  },

  enforce_strict_mode: async (args) => {
    try {
      if (args.enable) {
        setConfigDirect('strictMode', true);
        setConfigDirect('requireDryRun', true);
        setConfigDirect('enableSyntaxValidation', true);
        setConfigDirect('enableImportValidation', true);
        setConfigDirect('enableAntiPatternDetection', true);
      } else {
        setConfigDirect('strictMode', false);
        setConfigDirect('requireDryRun', false);
      }
      await saveConfig();
      return {
        content: [{ type: "text", text: `Strict mode ${args.enable ? 'enabled' : 'disabled'}. ${args.enable ? 'Extra guardrails activated.' : 'Standard mode restored.'}` }]
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Failed to set strict mode: ${error.message}` }] };
    }
  }
};
