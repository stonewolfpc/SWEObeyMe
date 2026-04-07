/**
 * Plugin System Foundation for SWEObeyMe
 *
 * This module provides the foundation for a plugin system that allows
 * custom tools and extensions to be dynamically loaded and registered.
 */

import fs from 'fs';
import path from 'path';

/**
 * Plugin Manager class
 */
export class PluginManager {
  constructor(pluginsDir) {
    this.plugins = new Map();
    this.pluginTools = new Map();
    this.pluginsDir = pluginsDir;
  }

  /**
   * Load all plugins from the plugins directory
   */
  async loadPlugins(context) {
    if (!fs.existsSync(this.pluginsDir)) {
      context.logger.info(`Plugins directory not found: ${this.pluginsDir}`);
      return;
    }

    const pluginFiles = fs.readdirSync(this.pluginsDir)
      .filter(file => file.endsWith('.js') || file.endsWith('.mjs'));

    for (const file of pluginFiles) {
      try {
        const pluginPath = path.join(this.pluginsDir, file);
        const pluginModule = await import(pluginPath);
        const PluginClass = pluginModule.default || pluginModule;

        if (typeof PluginClass === 'function') {
          const plugin = new PluginClass();

          if (this.validatePlugin(plugin)) {
            await plugin.initialize(context);
            this.plugins.set(plugin.name, plugin);

            // Register tools from plugin
            if (plugin.getTools) {
              const tools = plugin.getTools();
              for (const tool of tools) {
                this.pluginTools.set(tool.name, tool);
              }
            }

            context.logger.info(`Loaded plugin: ${plugin.name} v${plugin.version}`);
          }
        }
      } catch (error) {
        context.logger.error(`Failed to load plugin ${file}: ${error.message}`);
      }
    }
  }

  /**
   * Validate that an object implements the Plugin interface
   */
  validatePlugin(plugin) {
    return (
      typeof plugin.name === 'string' &&
      typeof plugin.version === 'string' &&
      typeof plugin.description === 'string' &&
      typeof plugin.initialize === 'function'
    );
  }

  /**
   * Get a loaded plugin by name
   */
  getPlugin(name) {
    return this.plugins.get(name);
  }

  /**
   * Get all loaded plugins
   */
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all tools provided by plugins
   */
  getAllPluginTools() {
    return Array.from(this.pluginTools.values());
  }

  /**
   * Execute a plugin tool
   */
  async executeTool(toolName, params) {
    const tool = this.pluginTools.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    return tool.handler(params);
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(name) {
    const plugin = this.plugins.get(name);
    if (plugin) {
      if (plugin.cleanup) {
        await plugin.cleanup();
      }

      // Remove plugin tools
      if (plugin.getTools) {
        const tools = plugin.getTools();
        for (const tool of tools) {
          this.pluginTools.delete(tool.name);
        }
      }

      this.plugins.delete(name);
    }
  }

  /**
   * Unload all plugins
   */
  async unloadAllPlugins() {
    for (const name of this.plugins.keys()) {
      await this.unloadPlugin(name);
    }
  }
}

/**
 * Create default plugin context
 */
export function createPluginContext(workspacePath, configPath) {
  return {
    workspacePath,
    configPath,
    logger: {
      info: (message) => console.log(`[Plugin] ${message}`),
      warn: (message) => console.warn(`[Plugin] ${message}`),
      error: (message) => console.error(`[Plugin] ${message}`),
    },
  };
}
