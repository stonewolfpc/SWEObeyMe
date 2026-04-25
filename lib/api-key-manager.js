import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { readFileSafe, writeFileSafe, existsSafe, readdirSafe } from './shared/async-utils.js';

class ApiKeyManager {
  constructor(encryptionManager) {
    this.encryptionManager = encryptionManager;
    // Configuration disabled in public build
    this.enabled = false;
    this.rotationDays = 30;

    this.apiKeys = new Map();
    this.keyDirectory = path.join(os.homedir(), '.sweobeyme', 'api-keys');

    this.initialize();
  }

  async initialize() {
    if (!this.enabled) {
      return;
    }

    try {
      if (!(await existsSafe(this.keyDirectory, 1000, 'initialize exists'))) {
        await fs.mkdir(this.keyDirectory, { recursive: true });
      }

      await this.loadApiKeys();
      await this.rotateKeysIfNeeded();
    } catch (error) {
      console.error('[ApiKeyManager] Failed to initialize:', error);
    }
  }

  generateApiKey() {
    const prefix = 'sweobeyme_';
    const randomBytes = crypto.randomBytes(32);
    const key = prefix + randomBytes.toString('base64url').replace(/=/g, '').substring(0, 40);
    return key;
  }

  async loadApiKeys() {
    try {
      const files = await readdirSafe(this.keyDirectory, {}, 5000, 'loadApiKeys readdir');

      for (const file of files) {
        if (!file.startsWith('apikey-') || !file.endsWith('.json')) {
          continue;
        }

        const filePath = path.join(this.keyDirectory, file);
        const content = await readFileSafe(filePath, 10000, `loadApiKeys read ${file}`);
        const keyData = JSON.parse(content);

        // Decrypt the secret if encryption is enabled
        let secret = keyData.secret;
        if (keyData.encrypted && this.encryptionManager) {
          try {
            secret = this.encryptionManager.decrypt({ encrypted: true, data: keyData.secret });
          } catch (error) {
            console.error('[ApiKeyManager] Failed to decrypt key:', error);
            continue;
          }
        }

        this.apiKeys.set(keyData.id, {
          id: keyData.id,
          name: keyData.name,
          secret,
          createdAt: new Date(keyData.createdAt),
          expiresAt: new Date(keyData.expiresAt),
          lastRotatedAt: keyData.lastRotatedAt ? new Date(keyData.lastRotatedAt) : null,
          scopes: keyData.scopes || [],
          active: !keyData.revoked,
          revoked: keyData.revoked || false,
          revokedAt: keyData.revokedAt ? new Date(keyData.revokedAt) : null,
        });
      }
    } catch (error) {
      console.error('[ApiKeyManager] Failed to load API keys:', error);
    }
  }

  async rotateKeysIfNeeded() {
    const now = new Date();

    for (const [id, keyData] of this.apiKeys.entries()) {
      if (keyData.expiresAt && now >= keyData.expiresAt) {
        await this.rotateKey(id);
      }
    }
  }

  async createApiKey(name, scopes = []) {
    const id = `apikey-${crypto.randomBytes(16).toString('hex')}`;
    const secret = this.generateApiKey();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.rotationDays * 24 * 60 * 60 * 1000);

    const keyData = {
      id,
      name,
      secret,
      createdAt: now,
      expiresAt,
      lastRotatedAt: now,
      scopes,
      active: true,
      revoked: false,
    };

    this.apiKeys.set(id, keyData);

    await this.saveApiKey(id, keyData);

    return { id, secret, expiresAt };
  }

  async saveApiKey(id, keyData) {
    let secretToSave = keyData.secret;

    // Encrypt the secret if encryption is enabled
    if (this.encryptionManager) {
      try {
        const encrypted = this.encryptionManager.encrypt(keyData.secret);
        secretToSave = encrypted;
      } catch (error) {
        console.error('[ApiKeyManager] Failed to encrypt key:', error);
      }
    }

    const saveData = {
      id: keyData.id,
      name: keyData.name,
      secret: secretToSave,
      encrypted: !!this.encryptionManager,
      createdAt: keyData.createdAt.toISOString(),
      expiresAt: keyData.expiresAt.toISOString(),
      lastRotatedAt: keyData.lastRotatedAt ? keyData.lastRotatedAt.toISOString() : null,
      scopes: keyData.scopes,
      revoked: keyData.revoked,
      revokedAt: keyData.revokedAt ? keyData.revokedAt.toISOString() : null,
    };

    const filePath = path.join(this.keyDirectory, `${id}.json`);
    await writeFileSafe(
      filePath,
      JSON.stringify(saveData, null, 2),
      10000,
      `saveApiKey write ${id}`
    );
  }

  async rotateKey(id) {
    const keyData = this.apiKeys.get(id);
    if (!keyData) {
      throw new Error(`API key ${id} not found`);
    }

    // Generate new secret
    const newSecret = this.generateApiKey();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.rotationDays * 24 * 60 * 60 * 1000);

    // Update key data
    keyData.secret = newSecret;
    keyData.lastRotatedAt = now;
    keyData.expiresAt = expiresAt;

    this.apiKeys.set(id, keyData);

    await this.saveApiKey(id, keyData);

    return { id, secret: newSecret, expiresAt };
  }

  async revokeKey(id) {
    const keyData = this.apiKeys.get(id);
    if (!keyData) {
      throw new Error(`API key ${id} not found`);
    }

    keyData.revoked = true;
    keyData.revokedAt = new Date();
    keyData.active = false;

    this.apiKeys.set(id, keyData);

    await this.saveApiKey(id, keyData);
  }

  async deleteKey(id) {
    this.apiKeys.delete(id);

    const filePath = path.join(this.keyDirectory, `${id}.json`);
    if (await existsSafe(filePath, 1000, `deleteKey exists ${id}`)) {
      await fs.unlink(filePath);
    }
  }

  validateKey(secret) {
    for (const [id, keyData] of this.apiKeys.entries()) {
      if (keyData.secret === secret && keyData.active && !keyData.revoked) {
        return {
          valid: true,
          keyId: id,
          name: keyData.name,
          scopes: keyData.scopes,
        };
      }
    }

    return { valid: false };
  }

  validateKeyScopes(keyId, requiredScopes) {
    const keyData = this.apiKeys.get(keyId);
    if (!keyData) {
      return { valid: false, reason: 'Key not found' };
    }

    if (!keyData.active || keyData.revoked) {
      return { valid: false, reason: 'Key is revoked or inactive' };
    }

    for (const scope of requiredScopes) {
      if (!keyData.scopes.includes(scope) && !keyData.scopes.includes('*')) {
        return { valid: false, reason: `Missing scope: ${scope}` };
      }
    }

    return { valid: true };
  }

  getKey(id) {
    const keyData = this.apiKeys.get(id);
    if (!keyData) {
      return null;
    }

    // Return without secret for safety
    return {
      id: keyData.id,
      name: keyData.name,
      createdAt: keyData.createdAt,
      expiresAt: keyData.expiresAt,
      lastRotatedAt: keyData.lastRotatedAt,
      scopes: keyData.scopes,
      active: keyData.active,
      revoked: keyData.revoked,
      revokedAt: keyData.revokedAt,
    };
  }

  getAllKeys() {
    const keys = [];
    for (const [id, keyData] of this.apiKeys.entries()) {
      keys.push(this.getKey(id));
    }
    return keys;
  }

  getKeyUsageStats(id) {
    // This would track API key usage in a real implementation
    return {
      requests: 0,
      lastUsed: null,
    };
  }

  async exportKeys(includeSecrets = false) {
    const keys = {};

    for (const [id, keyData] of this.apiKeys.entries()) {
      keys[id] = {
        name: keyData.name,
        createdAt: keyData.createdAt.toISOString(),
        expiresAt: keyData.expiresAt.toISOString(),
        scopes: keyData.scopes,
        active: keyData.active,
      };

      if (includeSecrets) {
        keys[id].secret = keyData.secret;
      }
    }

    return keys;
  }
}

export { ApiKeyManager };
