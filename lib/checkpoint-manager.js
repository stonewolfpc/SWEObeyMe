import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// ESM-safe __dirname with Windows path handling
let __dirname;
try {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} catch (e) {
  // Fallback for Windows ESM path issues
  __dirname = process.cwd();
}

// Checkpoint storage class
class CheckpointManager {
  constructor(context) {
    this.checkpoints = new Map();
    this.maxCheckpoints = vscode.workspace.getConfiguration('sweObeyMe.checkpoints').get('maxCount', 10);
    this.autoCreate = vscode.workspace.getConfiguration('sweObeyMe.checkpoints').get('autoCreate', true);
    this.storagePath = path.join(context.globalStorageUri.fsPath, 'checkpoints.json');
    this.loadCheckpoints();
  }

  loadCheckpoints() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf8');
        const checkpoints = JSON.parse(data);
        this.checkpoints = new Map(Object.entries(checkpoints));
      }
    } catch (error) {
      console.error('[CheckpointManager] Failed to load checkpoints:', error);
    }
  }

  saveCheckpoints() {
    try {
      const data = JSON.stringify(Object.fromEntries(this.checkpoints), null, 2);
      fs.writeFileSync(this.storagePath, data);
    } catch (error) {
      console.error('[CheckpointManager] Failed to save checkpoints:', error);
    }
  }

  async createCheckpoint(name, description) {
    const id = `checkpoint-${Date.now()}`;
    const files = {};

    if (vscode.workspace.workspaceFolders) {
      for (const folder of vscode.workspace.workspaceFolders) {
        const workspaceFiles = await vscode.workspace.findFiles('**/*', null);
        for (const fileUri of workspaceFiles) {
          try {
            const document = await vscode.workspace.openTextDocument(fileUri);
            files[fileUri.fsPath] = document.getText();
          } catch (error) {
            console.error(`[CheckpointManager] Failed to read file ${fileUri.fsPath}:`, error);
          }
        }
      }
    }

    const checkpoint = {
      id,
      name,
      timestamp: Date.now(),
      files,
      description,
    };

    this.checkpoints.set(id, checkpoint);

    // Enforce max checkpoint limit
    if (this.checkpoints.size > this.maxCheckpoints) {
      const sorted = Array.from(this.checkpoints.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = sorted.slice(0, sorted.length - this.maxCheckpoints);
      for (const [idToRemove] of toRemove) {
        this.checkpoints.delete(idToRemove);
      }
    }

    this.saveCheckpoints();
    return id;
  }

  async revertToCheckpoint(checkpointId) {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      vscode.window.showErrorMessage('Checkpoint not found');
      return false;
    }

    const confirm = await vscode.window.showWarningMessage(
      `Revert to checkpoint "${checkpoint.name}"? This will overwrite all files.`,
      'Revert',
      'Cancel'
    );

    if (confirm !== 'Revert') {
      return false;
    }

    try {
      for (const [filePath, content] of Object.entries(checkpoint.files)) {
        const uri = vscode.Uri.file(filePath);
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(uri, encoder.encode(content));
      }

      vscode.window.showInformationMessage(`Reverted to checkpoint: ${checkpoint.name}`);
      return true;
    } catch (error) {
      console.error('[CheckpointManager] Failed to revert checkpoint:', error);
      vscode.window.showErrorMessage(`Failed to revert checkpoint: ${error.message}`);
      return false;
    }
  }

  listCheckpoints() {
    return Array.from(this.checkpoints.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  deleteCheckpoint(checkpointId) {
    return this.checkpoints.delete(checkpointId);
  }

  async autoCreateCheckpoint(description) {
    if (!this.autoCreate) {
      return null;
    }
    const name = `Auto-${new Date().toISOString()}`;
    return this.createCheckpoint(name, description);
  }
}

export { CheckpointManager };
