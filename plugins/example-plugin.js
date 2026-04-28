/**
 * Example Plugin for SWEObeyMe
 *
 * This is a sample plugin that demonstrates how to create custom tools
 * for the SWEObeyMe plugin system.
 */

export default class ExamplePlugin {
  constructor() {
    this.name = 'example-plugin';
    this.version = '1.0.0';
    this.description = 'Example plugin demonstrating the plugin system';
    this.author = 'SWEObeyMe';
  }

  async initialize(context) {
    context.logger.info(`Initializing ${this.name} plugin`);
  }

  getTools() {
    return [
      {
        name: 'example.hello',
        description: 'Say hello from the example plugin',
        handler: async (_params) => {
          return { message: 'Hello from example plugin!' };
        },
      },
      {
        name: 'example.echo',
        description: 'Echo back the provided message',
        handler: async (params) => {
          return { echo: params.message || 'No message provided' };
        },
      },
    ];
  }

  async cleanup() {
    console.log('Cleaning up example plugin');
  }
}
