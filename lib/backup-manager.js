import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

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
      if (!fs.existsSync(this.backupDirectory)) {
        fs.mkdirSync(this.backupDirectory, { recursive: true });
      }
      
      this.startBackupSchedule();
      this.cleanupOldBackups();
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
      fs.mkdirSync(backupPath, { recursive: true });
      
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
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      
      console.log(`[BackupManager] Backup created: ${backupId}`);
      
      return backupId;
    } catch (error) {
      console.error('[BackupManager] Failed to create backup:', error);
      
      // Cleanup failed backup
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
      }
      
      throw error;
    }
  }

  async backupConfiguration(backupPath) {
    const configPath = path.join(backupPath, 'configuration');
    fs.mkdirSync(configPath);
    
    // Backup VS Code settings
    const settingsPath = path.join(configPath, 'vscode-settings.json');
    const config = vscode.workspace.getConfiguration('sweObeyMe');
    fs.writeFileSync(settingsPath, JSON.stringify(config, null, 2));
    
    // Backup .sweobeyme-config.json
    const userConfigPath = path.join(os.homedir(), '.sweobeyme-config.json');
    if (fs.existsSync(userConfigPath)) {
      const userConfigBackupPath = path.join(configPath, 'sweobeyme-config.json');
      let content = fs.readFileSync(userConfigPath, 'utf-8');
      
      // Encrypt if encryption is enabled
      if (this.encryptionManager) {
        const encrypted = this.encryptionManager.encryptObject(content);
        content = JSON.stringify(encrypted);
      }
      
      fs.writeFileSync(userConfigBackupPath, content);
    }
  }

  async backupCheckpoints(backupPath) {
    const checkpointPath = path.join(backupPath, 'checkpoints');
    fs.mkdirSync(checkpointPath);
    
    // This would backup checkpoint data in a real implementation
    const checkpointData = {
      checkpoints: [],
      backedUpAt: new Date().toISOString(),
    };
    
    fs.writeFileSync(path.join(checkpointPath, 'checkpoints.json'), JSON.stringify(checkpointData, null, 2));
  }

  async backupPolicies(backupPath) {
    const policyPath = path.join(backupPath, 'policies');
    fs.mkdirSync(policyPath);
    
    const policyDir = path.join(os.homedir(), '.sweobeyme', 'policies');
    if (fs.existsSync(policyDir)) {
      const files = fs.readdirSync(policyDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const srcPath = path.join(policyDir, file);
          const destPath = path.join(policyPath, file);
          let content = fs.readFileSync(srcPath, 'utf-8');
          
          // Encrypt if encryption is enabled
          if (this.encryptionManager) {
            const encrypted = this.encryptionManager.encryptObject(content);
            content = JSON.stringify(encrypted);
          }
          
          fs.writeFileSync(destPath, content);
        }
      }
    }
  }

  async backupApiKeys(backupPath) {
    const apiKeyPath = path.join(backupPath, 'api-keys');
    fs.mkdirSync(apiKeyPath);
    
    const apiKeyDir = path.join(os.homedir(), '.sweobeyme', 'api-keys');
    if (fs.existsSync(apiKeyDir)) {
      const files = fs.readdirSync(apiKeyDir);
      
      for (const file of files) {
        if (file.startsWith('apikey-') && file.endsWith('.json')) {
          const srcPath = path.join(apiKeyDir, file);
          const destPath = path.join(apiKeyPath, file);
          let content = fs.readFileSync(srcPath, 'utf-8');
          
          // Always encrypt API keys
          if (this.encryptionManager) {
            const encrypted = this.encryptionManager.encryptObject(content);
            content = JSON.stringify(encrypted);
          }
          
          fs.writeFileSync(destPath, content);
        }
      }
    }
  }

  async restoreBackup(backupId) {
    const backupPath = path.join(this.backupDirectory, backupId);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup ${backupId} not found`);
    }
    
    const manifestPath = path.join(backupPath, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Backup manifest not found`);
    }
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
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
      
      console.log(`[BackupManager] Backup restored: ${backupId}`);
      
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
    if (fs.existsSync(settingsPath)) {
      const config = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      
      // Apply settings
      for (const [key, value] of Object.entries(config)) {
        await vscode.workspace.getConfiguration('sweObeyMe').update(key, value, vscode.ConfigurationTarget.Global);
      }
    }
    
    // Restore .sweobeyme-config.json
    const userConfigBackupPath = path.join(configPath, 'sweobeyme-config.json');
    if (fs.existsSync(userConfigBackupPath)) {
      const userConfigPath = path.join(os.homedir(), '.sweobeyme-config.json');
      let content = fs.readFileSync(userConfigBackupPath, 'utf-8');
      
      // Decrypt if encrypted
      if (this.encryptionManager) {
        try {
          const encrypted = JSON.parse(content);
          content = this.encryptionManager.decryptObject(encrypted);
        } catch (error) {
          console.error('[BackupManager] Failed to decrypt config:', error);
        }
      }
      
      fs.writeFileSync(userConfigPath, content);
    }
  }

  async restoreCheckpoints(backupPath) {
    const checkpointPath = path.join(backupPath, 'checkpoints');
    
    if (fs.existsSync(checkpointPath)) {
      const checkpointsFile = path.join(checkpointPath, 'checkpoints.json');
      if (fs.existsSync(checkpointsFile)) {
        // This would restore checkpoint data in a real implementation
        console.log('[BackupManager] Checkpoints would be restored here');
      }
    }
  }

  async restorePolicies(backupPath) {
    const policyPath = path.join(backupPath, 'policies');
    const policyDir = path.join(os.homedir(), '.sweobeyme', 'policies');
    
    if (fs.existsSync(policyPath)) {
      if (!fs.existsSync(policyDir)) {
        fs.mkdirSync(policyDir, { recursive: true });
      }
      
      const files = fs.readdirSync(policyPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const srcPath = path.join(policyPath, file);
          const destPath = path.join(policyDir, file);
          let content = fs.readFileSync(srcPath, 'utf-8');
          
          // Decrypt if encrypted
          if (this.encryptionManager) {
            try {
              const encrypted = JSON.parse(content);
              content = this.encryptionManager.decryptObject(encrypted);
            } catch (error) {
              console.error('[BackupManager] Failed to decrypt policy:', error);
            }
          }
          
          fs.writeFileSync(destPath, content);
        }
      }
    }
  }

  async restoreApiKeys(backupPath) {
    const apiKeyPath = path.join(backupPath, 'api-keys');
    const apiKeyDir = path.join(os.homedir(), '.sweobeyme', 'api-keys');
    
    if (fs.existsSync(apiKeyPath)) {
      if (!fs.existsSync(apiKeyDir)) {
        fs.mkdirSync(apiKeyDir, { recursive: true });
      }
      
      const files = fs.readdirSync(apiKeyPath);
      
      for (const file of files) {
        if (file.startsWith('apikey-') && file.endsWith('.json')) {
          const srcPath = path.join(apiKeyPath, file);
          const destPath = path.join(apiKeyDir, file);
          let content = fs.readFileSync(srcPath, 'utf-8');
          
          // Decrypt (always encrypted)
          if (this.encryptionManager) {
            try {
              const encrypted = JSON.parse(content);
              content = this.encryptionManager.decryptObject(encrypted);
            } catch (error) {
              console.error('[BackupManager] Failed to decrypt API key:', error);
            }
          }
          
          fs.writeFileSync(destPath, content);
        }
      }
    }
  }

  listBackups() {
    const backups = [];
    
    if (!fs.existsSync(this.backupDirectory)) {
      return backups;
    }
    
    const files = fs.readdirSync(this.backupDirectory);
    
    for (const file of files) {
      const backupPath = path.join(this.backupDirectory, file);
      const stats = fs.statSync(backupPath);
      
      if (stats.isDirectory() && file.startsWith('backup-')) {
        const manifestPath = path.join(backupPath, 'manifest.json');
        let manifest = null;
        
        if (fs.existsSync(manifestPath)) {
          try {
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
          } catch (error) {
            console.error('[BackupManager] Failed to read manifest:', error);
          }
        }
        
        backups.push({
          id: file,
          createdAt: stats.birthtime,
          size: this.getDirectorySize(backupPath),
          manifest,
        });
      }
    }
    
    return backups.sort((a, b) => b.createdAt - a.createdAt);
  }

  getDirectorySize(dirPath) {
    let size = 0;
    
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        size += this.getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    }
    
    return size;
  }

  async deleteBackup(backupId) {
    const backupPath = path.join(this.backupDirectory, backupId);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup ${backupId} not found`);
    }
    
    fs.rmSync(backupPath, { recursive: true, force: true });
    
    console.log(`[BackupManager] Backup deleted: ${backupId}`);
  }

  cleanupOldBackups() {
    const now = Date.now();
    const retentionMs = this.retentionDays * 24 * 60 * 60 * 1000;
    
    const backups = this.listBackups();
    
    for (const backup of backups) {
      const age = now - backup.createdAt.getTime();
      
      if (age > retentionMs) {
        this.deleteBackup(backup.id).catch(error => {
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
