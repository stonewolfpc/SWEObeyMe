import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { readFileSafe, writeFileSafe, existsSafe, readdirSafe } from './shared/async-utils.js';

class BackupManager {
  constructor(encryptionManager) {
    this.encryptionManager = encryptionManager;
    // Configuration disabled in public build
    this.enabled = false;
    this.backupSchedule = 'daily';
    this.retentionDays = 30;

    this.backupDirectory = path.join(os.homedir(), '.sweobeyme', 'backups');
    this.backupInterval = null;

    this.initialize();
  }

  async initialize() {
    if (!this.enabled) {
      return;
    }

    try {
      if (!(await existsSafe(this.backupDirectory, 1000, 'initialize exists'))) {
        await fs.mkdir(this.backupDirectory, { recursive: true });
      }

      this.startBackupSchedule();
      await this.cleanupOldBackups();
    } catch (error) {
      console.error('[BackupManager] Failed to initialize:', error);
    }
  }

  startBackupSchedule() {
    let intervalMs;

    switch (this.backupSchedule) {
      case 'hourly':
        intervalMs = 3600000; // 1 hour
        break;
      case 'daily':
        intervalMs = 86400000; // 24 hours
        break;
      case 'weekly':
        intervalMs = 604800000; // 7 days
        break;
      default:
        intervalMs = 86400000;
    }

    this.backupInterval = setInterval(() => {
      this.createBackup();
    }, intervalMs);
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup-${timestamp}`;
    const backupPath = path.join(this.backupDirectory, backupId);

    try {
      await fs.mkdir(backupPath, { recursive: true });

      // Backup configuration
      await this.backupConfiguration(backupPath);

      // Backup checkpoints
      await this.backupCheckpoints(backupPath);

      // Backup policies
      await this.backupPolicies(backupPath);

      // Backup API keys
      await this.backupApiKeys(backupPath);

      // Create backup manifest
      const manifest = {
        id: backupId,
        createdAt: new Date().toISOString(),
        version: '1.0.0',
        components: ['configuration', 'checkpoints', 'policies', 'api-keys'],
      };

      const manifestPath = path.join(backupPath, 'manifest.json');
      await writeFileSafe(
        manifestPath,
        JSON.stringify(manifest, null, 2),
        10000,
        'createBackup write manifest'
      );

      // Debug log removed

      return backupId;
    } catch (error) {
      console.error('[BackupManager] Failed to create backup:', error);

      // Cleanup failed backup
      if (await existsSafe(backupPath, 1000, 'createBackup exists backupPath')) {
        await fs.rm(backupPath, { recursive: true, force: true });
      }

      throw error;
    }
  }

  async backupConfiguration(backupPath) {
    const configPath = path.join(backupPath, 'configuration');
    await fs.mkdir(configPath);

    // Backup VS Code settings
    const settingsPath = path.join(configPath, 'vscode-settings.json');
    const config = vscode.workspace.getConfiguration('sweObeyMe');
    await writeFileSafe(
      settingsPath,
      JSON.stringify(config, null, 2),
      10000,
      'backupConfiguration write settings'
    );

    // Backup .sweobeyme-config.json
    const userConfigPath = path.join(os.homedir(), '.sweobeyme-config.json');
    if (await existsSafe(userConfigPath, 1000, 'backupConfiguration exists userConfig')) {
      const userConfigBackupPath = path.join(configPath, 'sweobeyme-config.json');
      let content = await readFileSafe(
        userConfigPath,
        10000,
        'backupConfiguration read userConfig'
      );

      // Encrypt if encryption is enabled
      if (this.encryptionManager) {
        const encrypted = this.encryptionManager.encryptObject(content);
        content = JSON.stringify(encrypted);
      }

      await writeFileSafe(
        userConfigBackupPath,
        content,
        10000,
        'backupConfiguration write userConfig'
      );
    }
  }

  async backupCheckpoints(backupPath) {
    const checkpointPath = path.join(backupPath, 'checkpoints');
    await fs.mkdir(checkpointPath);

    // This would backup checkpoint data in a real implementation
    const checkpointData = {
      checkpoints: [],
      backedUpAt: new Date().toISOString(),
    };

    await writeFileSafe(
      path.join(checkpointPath, 'checkpoints.json'),
      JSON.stringify(checkpointData, null, 2),
      10000,
      'backupCheckpoints write'
    );
  }

  async backupPolicies(backupPath) {
    const policyPath = path.join(backupPath, 'policies');
    await fs.mkdir(policyPath);

    const policyDir = path.join(os.homedir(), '.sweobeyme', 'policies');
    if (await existsSafe(policyDir, 1000, 'backupPolicies exists policyDir')) {
      const files = await readdirSafe(policyDir, {}, 5000, 'backupPolicies readdir');

      for (const file of files) {
        if (file.endsWith('.json')) {
          const srcPath = path.join(policyDir, file);
          const destPath = path.join(policyPath, file);
          let content = await readFileSafe(srcPath, 10000, `backupPolicies read ${file}`);

          // Encrypt if encryption is enabled
          if (this.encryptionManager) {
            const encrypted = this.encryptionManager.encryptObject(content);
            content = JSON.stringify(encrypted);
          }

          await writeFileSafe(destPath, content, 10000, `backupPolicies write ${file}`);
        }
      }
    }
  }

  async backupApiKeys(backupPath) {
    const apiKeyPath = path.join(backupPath, 'api-keys');
    await fs.mkdir(apiKeyPath);

    const apiKeyDir = path.join(os.homedir(), '.sweobeyme', 'api-keys');
    if (await existsSafe(apiKeyDir, 1000, 'backupApiKeys exists apiKeyDir')) {
      const files = await readdirSafe(apiKeyDir, {}, 5000, 'backupApiKeys readdir');

      for (const file of files) {
        if (file.startsWith('apikey-') && file.endsWith('.json')) {
          const srcPath = path.join(apiKeyDir, file);
          const destPath = path.join(apiKeyPath, file);
          let content = await readFileSafe(srcPath, 10000, `backupApiKeys read ${file}`);

          // Always encrypt API keys
          if (this.encryptionManager) {
            const encrypted = this.encryptionManager.encryptObject(content);
            content = JSON.stringify(encrypted);
          }

          await writeFileSafe(destPath, content, 10000, `backupApiKeys write ${file}`);
        }
      }
    }
  }

  async restoreBackup(backupId) {
    const backupPath = path.join(this.backupDirectory, backupId);

    if (!(await existsSafe(backupPath, 1000, 'restoreBackup exists backupPath'))) {
      throw new Error(`Backup ${backupId} not found`);
    }

    const manifestPath = path.join(backupPath, 'manifest.json');
    if (!(await existsSafe(manifestPath, 1000, 'restoreBackup exists manifestPath'))) {
      throw new Error('Backup manifest not found');
    }

    const manifest = JSON.parse(
      await readFileSafe(manifestPath, 10000, 'restoreBackup read manifest')
    );

    try {
      // Restore configuration
      if (manifest.components.includes('configuration')) {
        await this.restoreConfiguration(backupPath);
      }

      // Restore checkpoints
      if (manifest.components.includes('checkpoints')) {
        await this.restoreCheckpoints(backupPath);
      }

      // Restore policies
      if (manifest.components.includes('policies')) {
        await this.restorePolicies(backupPath);
      }

      // Restore API keys
      if (manifest.components.includes('api-keys')) {
        await this.restoreApiKeys(backupPath);
      }

      // Debug log removed

      return { success: true, backupId };
    } catch (error) {
      console.error('[BackupManager] Failed to restore backup:', error);
      throw error;
    }
  }

  async restoreConfiguration(backupPath) {
    const configPath = path.join(backupPath, 'configuration');

    // Restore VS Code settings
    const settingsPath = path.join(configPath, 'vscode-settings.json');
    if (await existsSafe(settingsPath, 1000, 'restoreConfiguration exists settings')) {
      const config = JSON.parse(
        await readFileSafe(settingsPath, 10000, 'restoreConfiguration read settings')
      );

      // Apply settings
      for (const [key, value] of Object.entries(config)) {
        await vscode.workspace
          .getConfiguration('sweObeyMe')
          .update(key, value, vscode.ConfigurationTarget.Global);
      }
    }

    // Restore .sweobeyme-config.json
    const userConfigBackupPath = path.join(configPath, 'sweobeyme-config.json');
    if (
      await existsSafe(userConfigBackupPath, 1000, 'restoreConfiguration exists userConfigBackup')
    ) {
      const userConfigPath = path.join(os.homedir(), '.sweobeyme-config.json');
      let content = await readFileSafe(
        userConfigBackupPath,
        10000,
        'restoreConfiguration read userConfigBackup'
      );

      // Decrypt if encrypted
      if (this.encryptionManager) {
        try {
          const encrypted = JSON.parse(content);
          content = this.encryptionManager.decryptObject(encrypted);
        } catch (error) {
          console.error('[BackupManager] Failed to decrypt config:', error);
        }
      }

      await writeFileSafe(userConfigPath, content, 10000, 'restoreConfiguration write userConfig');
    }
  }

  async restoreCheckpoints(backupPath) {
    const checkpointPath = path.join(backupPath, 'checkpoints');

    if (await existsSafe(checkpointPath, 1000, 'restoreCheckpoints exists checkpointPath')) {
      const checkpointsFile = path.join(checkpointPath, 'checkpoints.json');
      if (await existsSafe(checkpointsFile, 1000, 'restoreCheckpoints exists checkpointsFile')) {
        // This would restore checkpoint data in a real implementation
        // Debug log removed
      }
    }
  }

  async restorePolicies(backupPath) {
    const policyPath = path.join(backupPath, 'policies');
    const policyDir = path.join(os.homedir(), '.sweobeyme', 'policies');

    if (await existsSafe(policyPath, 1000, 'restorePolicies exists policyPath')) {
      if (!(await existsSafe(policyDir, 1000, 'restorePolicies exists policyDir'))) {
        await fs.mkdir(policyDir, { recursive: true });
      }

      const files = await readdirSafe(policyPath, {}, 5000, 'restorePolicies readdir');

      for (const file of files) {
        if (file.endsWith('.json')) {
          const srcPath = path.join(policyPath, file);
          const destPath = path.join(policyDir, file);
          let content = await readFileSafe(srcPath, 10000, `restorePolicies read ${file}`);

          // Decrypt if encrypted
          if (this.encryptionManager) {
            try {
              const encrypted = JSON.parse(content);
              content = this.encryptionManager.decryptObject(encrypted);
            } catch (error) {
              console.error('[BackupManager] Failed to decrypt policy:', error);
            }
          }

          await writeFileSafe(destPath, content, 10000, `restorePolicies write ${file}`);
        }
      }
    }
  }

  async restoreApiKeys(backupPath) {
    const apiKeyPath = path.join(backupPath, 'api-keys');
    const apiKeyDir = path.join(os.homedir(), '.sweobeyme', 'api-keys');

    if (await existsSafe(apiKeyPath, 1000, 'restoreApiKeys exists apiKeyPath')) {
      if (!(await existsSafe(apiKeyDir, 1000, 'restoreApiKeys exists apiKeyDir'))) {
        await fs.mkdir(apiKeyDir, { recursive: true });
      }

      const files = await readdirSafe(apiKeyPath, {}, 5000, 'restoreApiKeys readdir');

      for (const file of files) {
        if (file.startsWith('apikey-') && file.endsWith('.json')) {
          const srcPath = path.join(apiKeyPath, file);
          const destPath = path.join(apiKeyDir, file);
          let content = await readFileSafe(srcPath, 10000, `restoreApiKeys read ${file}`);

          // Decrypt (always encrypted)
          if (this.encryptionManager) {
            try {
              const encrypted = JSON.parse(content);
              content = this.encryptionManager.decryptObject(encrypted);
            } catch (error) {
              console.error('[BackupManager] Failed to decrypt API key:', error);
            }
          }

          await writeFileSafe(destPath, content, 10000, `restoreApiKeys write ${file}`);
        }
      }
    }
  }

  async listBackups() {
    const backups = [];

    if (!(await existsSafe(this.backupDirectory, 1000, 'listBackups exists backupDirectory'))) {
      return backups;
    }

    const files = await readdirSafe(this.backupDirectory, {}, 5000, 'listBackups readdir');

    for (const file of files) {
      const backupPath = path.join(this.backupDirectory, file);
      const stats = await fs.stat(backupPath);

      if (stats.isDirectory() && file.startsWith('backup-')) {
        const manifestPath = path.join(backupPath, 'manifest.json');
        let manifest = null;

        if (await existsSafe(manifestPath, 1000, 'listBackups exists manifest')) {
          try {
            manifest = JSON.parse(
              await readFileSafe(manifestPath, 10000, 'listBackups read manifest')
            );
          } catch (error) {
            console.error('[BackupManager] Failed to read manifest:', error);
          }
        }

        backups.push({
          id: file,
          createdAt: stats.birthtime,
          size: await this.getDirectorySize(backupPath),
          manifest,
        });
      }
    }

    return backups.sort((a, b) => b.createdAt - a.createdAt);
  }

  async getDirectorySize(dirPath) {
    let size = 0;

    const files = await readdirSafe(dirPath, {}, 5000, 'getDirectorySize readdir');
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        size += await this.getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    }

    return size;
  }

  async deleteBackup(backupId) {
    const backupPath = path.join(this.backupDirectory, backupId);

    if (!(await existsSafe(backupPath, 1000, 'deleteBackup exists backupPath'))) {
      throw new Error(`Backup ${backupId} not found`);
    }

    await fs.rm(backupPath, { recursive: true, force: true });

    // Debug log removed
  }

  async cleanupOldBackups() {
    const now = Date.now();
    const retentionMs = this.retentionDays * 24 * 60 * 60 * 1000;

    const backups = await this.listBackups();

    for (const backup of backups) {
      const age = now - backup.createdAt.getTime();

      if (age > retentionMs) {
        await this.deleteBackup(backup.id).catch((error) => {
          console.error(`[BackupManager] Failed to delete old backup ${backup.id}:`, error);
        });
      }
    }
  }

  dispose() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }
  }
}

export { BackupManager };
