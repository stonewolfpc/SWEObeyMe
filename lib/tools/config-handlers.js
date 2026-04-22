import {
  getAllConfig,
  setConfigValues,
  resetConfig,
  getConfigSchema,
  saveConfig,
  setConfig as setConfigDirect,
} from '../config.js';
import { setReminderInterval } from '../session-state.js';

/**
 * Configuration tool handlers
 */

export const configHandlers = {
  get_config: async _args => {
    try {
      const config = getAllConfig();
      return {
        content: [{ type: 'text', text: JSON.stringify(config, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to get configuration: ${error.message}` }],
      };
    }
  },

  set_config: async args => {
    try {
      setConfigValues(args.settings);
      
      // Sync reminderInterval with session state if set
      if (args.settings?.reminderInterval !== undefined) {
        setReminderInterval(args.settings.reminderInterval);
      }
      
      await saveConfig();
      return {
        content: [
          {
            type: 'text',
            text: `Configuration updated successfully. New settings:\n${JSON.stringify(args.settings, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to set configuration: ${error.message}` }],
      };
    }
  },

  reset_config: async _args => {
    try {
      resetConfig();
      await saveConfig();
      return {
        content: [{ type: 'text', text: 'Configuration reset to defaults.' }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to reset configuration: ${error.message}` }],
      };
    }
  },

  get_config_schema: async _args => {
    try {
      const schema = getConfigSchema();
      return {
        content: [{ type: 'text', text: JSON.stringify(schema, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to get configuration schema: ${error.message}` }],
      };
    }
  },

  enforce_strict_mode: async args => {
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
        content: [
          {
            type: 'text',
            text: `Strict mode ${args.enable ? 'enabled' : 'disabled'}. ${args.enable ? 'Extra guardrails activated.' : 'Standard mode restored.'}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to set strict mode: ${error.message}` }],
      };
    }
  },

  config_manage: async params => {
    const { operation, settings, enable } = params;

    if (!operation) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'operation parameter is required' }],
      };
    }

    switch (operation) {
      case 'get':
        return await configHandlers.get_config(params);
      case 'set':
        return await configHandlers.set_config({ settings });
      case 'reset':
        return await configHandlers.reset_config(params);
      case 'schema':
        return await configHandlers.get_config_schema(params);
      case 'strict_mode':
        return await configHandlers.enforce_strict_mode({ enable });
      default:
        return {
          isError: true,
          content: [{ type: 'text', text: `Unknown operation: ${operation}` }],
        };
    }
  },
};
