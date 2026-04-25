import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';

class ProviderManager {
  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  initializeProviders() {
    // Initialize Ollama provider
    const ollamaConfig = vscode.workspace.getConfiguration('sweObeyMe.providers.ollama');
    if (ollamaConfig.get('enabled', false)) {
      this.providers.set('ollama', {
        name: 'Ollama',
        type: 'local',
        endpoint: ollamaConfig.get('endpoint', 'http://localhost:11434'),
        models: ollamaConfig.get('models', []),
        available: this.checkOllamaAvailability(
          ollamaConfig.get('endpoint', 'http://localhost:11434')
        ),
      });
    }

    // Initialize OpenAI provider
    const openaiConfig = vscode.workspace.getConfiguration('sweObeyMe.providers.openai');
    if (openaiConfig.get('enabled', false)) {
      this.providers.set('openai', {
        name: 'OpenAI',
        type: 'api',
        apiKey: openaiConfig.get('apiKey', '') || process.env.OPENAI_API_KEY,
        available: true,
      });
    }

    // Initialize Anthropic provider
    const anthropicConfig = vscode.workspace.getConfiguration('sweObeyMe.providers.anthropic');
    if (anthropicConfig.get('enabled', false)) {
      this.providers.set('anthropic', {
        name: 'Anthropic',
        type: 'api',
        apiKey: anthropicConfig.get('apiKey', '') || process.env.ANTHROPIC_API_KEY,
        available: true,
      });
    }
  }

  async checkOllamaAvailability(endpoint) {
    try {
      const url = new URL(endpoint);
      const client = url.protocol === 'https:' ? https : http;

      return new Promise((resolve) => {
        const req = client.get(`${url.href}/api/tags`, (res) => {
          resolve(res.statusCode === 200);
        });

        req.on('error', () => {
          resolve(false);
        });

        req.setTimeout(5000, () => {
          req.destroy();
          resolve(false);
        });
      });
    } catch (error) {
      console.error('[ProviderManager] Failed to check Ollama availability:', error);
      return false;
    }
  }

  async getOllamaModels(endpoint) {
    try {
      const url = new URL(endpoint);
      const client = url.protocol === 'https:' ? https : http;

      return new Promise((resolve, reject) => {
        const req = client.get(`${url.href}/api/tags`, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve(json.models || []);
            } catch (error) {
              reject(error);
            }
          });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
    } catch (error) {
      console.error('[ProviderManager] Failed to get Ollama models:', error);
      return [];
    }
  }

  getProvider(name) {
    return this.providers.get(name);
  }

  getAllProviders() {
    return Array.from(this.providers.values());
  }

  getAvailableProviders() {
    return Array.from(this.providers.values()).filter((p) => p.available);
  }

  async refreshProviderStatus() {
    for (const [name, provider] of this.providers.entries()) {
      if (provider.type === 'local' && name === 'ollama') {
        provider.available = await this.checkOllamaAvailability(provider.endpoint);
        if (provider.available && provider.models.length === 0) {
          provider.models = await this.getOllamaModels(provider.endpoint);
        }
      }
    }
  }

  async queryOllama(model, prompt, endpoint) {
    try {
      const url = new URL(endpoint);
      const client = url.protocol === 'https:' ? https : http;

      const postData = JSON.stringify({
        model,
        prompt,
        stream: false,
      });

      return new Promise((resolve, reject) => {
        const req = client.request(
          {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: '/api/generate',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
            },
          },
          (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              try {
                const json = JSON.parse(data);
                resolve(json);
              } catch (error) {
                reject(error);
              }
            });
          }
        );

        req.on('error', reject);
        req.write(postData);
        req.end();
      });
    } catch (error) {
      console.error('[ProviderManager] Failed to query Ollama:', error);
      throw error;
    }
  }
}

export { ProviderManager };
