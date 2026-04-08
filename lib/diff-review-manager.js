import * as vscode from 'vscode';

class DiffReviewManager {
  constructor() {
    this.enabled = vscode.workspace.getConfiguration('sweObeyMe.diffReview').get('enabled', true);
    this.showSideBySide = vscode.workspace.getConfiguration('sweObeyMe.diffReview').get('showSideBySide', true);
    this.requireApproval = vscode.workspace.getConfiguration('sweObeyMe.diffReview').get('requireApproval', true);
  }

  async reviewChanges(originalContent, newContent, filePath) {
    if (!this.enabled) {
      return { approved: true, reason: 'Diff review disabled' };
    }

    // Create a diff string
    const diff = this.createDiff(originalContent, newContent);

    // Show diff in a webview or use VS Code's diff viewer
    const approved = await this.showDiffReview(diff, filePath);

    return { approved, reason: approved ? 'User approved changes' : 'User rejected changes' };
  }

  createDiff(original, modified) {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    let diff = '';

    let i = 0, j = 0;
    while (i < originalLines.length || j < modifiedLines.length) {
      if (i < originalLines.length && j < modifiedLines.length && originalLines[i] === modifiedLines[j]) {
        // Unchanged line
        diff += `  ${originalLines[i]}\n`;
        i++;
        j++;
      } else if (j < modifiedLines.length && (i >= originalLines.length || originalLines[i] !== modifiedLines[j])) {
        // Added line
        diff += `+ ${modifiedLines[j]}\n`;
        j++;
      } else if (i < originalLines.length && (j >= modifiedLines.length || originalLines[i] !== modifiedLines[j])) {
        // Removed line
        diff += `- ${originalLines[i]}\n`;
        i++;
      }
    }

    return diff;
  }

  async showDiffReview(diff, filePath) {
    if (!this.requireApproval) {
      return true;
    }

    // Create a temporary file with the diff
    const diffPath = vscode.Uri.parse(`untitled:${filePath}.diff`);
    
    try {
      const doc = await vscode.workspace.openTextDocument(diffPath);
      const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
      
      // Write diff content
      const edit = new vscode.WorkspaceEdit();
      edit.insert(diffPath, new vscode.Position(0, 0), diff);
      await vscode.workspace.applyEdit(edit);
      
      // Ask for approval
      const selection = await vscode.window.showInformationMessage(
        `Review changes for ${filePath}`,
        'Approve',
        'Reject',
        'Edit'
      );

      if (selection === 'Approve') {
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        return true;
      } else if (selection === 'Reject') {
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        return false;
      } else if (selection === 'Edit') {
        // Allow user to edit, then ask again
        return true;
      }

      return false;
    } catch (error) {
      console.error('[DiffReviewManager] Failed to show diff review:', error);
      // Fallback to simple approval dialog
      const selection = await vscode.window.showWarningMessage(
        `Review changes for ${filePath}`,
        'Approve',
        'Reject'
      );
      return selection === 'Approve';
    }
  }

  async showSideBySideDiff(originalUri, modifiedUri) {
    if (!this.showSideBySide) {
      return false;
    }

    try {
      await vscode.commands.executeCommand(
        'vscode.diff',
        originalUri,
        modifiedUri,
        'SWEObeyMe Diff Review',
        {
          preview: true,
          viewColumn: vscode.ViewColumn.Beside,
        }
      );
      return true;
    } catch (error) {
      console.error('[DiffReviewManager] Failed to show side-by-side diff:', error);
      return false;
    }
  }
}

export { DiffReviewManager };
