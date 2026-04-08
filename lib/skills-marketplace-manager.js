import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

class SkillsMarketplaceManager {
  constructor(context) {
    this.context = context;
    this.skills = new Map();
    this.skillLocations = [
      '.github/skills',
      '.agents/skills', // Legacy location
      'skills',
    ];
    this.apiUsage = new Map();
    this.loadSkills();
  }

  async loadSkills() {
    if (!vscode.workspace.workspaceFolders) {
      return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    
    for (const location of this.skillLocations) {
      const skillsPath = path.join(workspaceRoot, location);
      
      try {
        if (fs.existsSync(skillsPath)) {
          const skillFiles = fs.readdirSync(skillsPath);
          
          for (const file of skillFiles) {
            if (file.endsWith('.json') || file.endsWith('.js') || file.endsWith('.md')) {
              const skillPath = path.join(skillsPath, file);
              const skillKey = `${location}/${file}`;
              
              try {
                const content = fs.readFileSync(skillPath, 'utf-8');
                this.skills.set(skillKey, {
                  path: skillPath,
                  location,
                  filename: file,
                  content,
                  loaded: true,
                });
              } catch (error) {
                console.error(`[SkillsMarketplace] Failed to load skill ${skillKey}:`, error);
                this.skills.set(skillKey, {
                  path: skillPath,
                  location,
                  filename: file,
                  content: null,
                  loaded: false,
                  error: error.message,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error(`[SkillsMarketplace] Failed to read skills from ${location}:`, error);
      }
    }

    // Check for migration needs (.agents/skills -> .github/skills)
    await this.checkMigrationNeeded(workspaceRoot);
  }

  async checkMigrationNeeded(workspaceRoot) {
    const legacyPath = path.join(workspaceRoot, '.agents/skills');
    const newPath = path.join(workspaceRoot, '.github/skills');
    
    if (fs.existsSync(legacyPath) && !fs.existsSync(newPath)) {
      const migrate = await vscode.window.showWarningMessage(
        'Skills detected in legacy location (.agents/skills). Migrate to new location (.github/skills)?',
        'Migrate Now',
        'Later',
        'Skip'
      );
      
      if (migrate === 'Migrate Now') {
        await this.migrateSkills(legacyPath, newPath);
      } else if (migrate === 'Skip') {
        // Remember user's choice
        await this.context.globalState.update('skillsMigrationSkipped', true);
      }
    }
  }

  async migrateSkills(legacyPath, newPath) {
    try {
      // Create new directory
      fs.mkdirSync(path.dirname(newPath), { recursive: true });
      
      // Copy skills
      const skillFiles = fs.readdirSync(legacyPath);
      
      for (const file of skillFiles) {
        const srcPath = path.join(legacyPath, file);
        const destPath = path.join(newPath, file);
        
        const content = fs.readFileSync(srcPath);
        fs.writeFileSync(destPath, content);
      }
      
      vscode.window.showInformationMessage(
        `Successfully migrated ${skillFiles.length} skill(s) to .github/skills`
      );
      
      // Reload skills from new location
      this.skills.clear();
      await this.loadSkills();
      
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to migrate skills: ${error.message}`);
    }
  }

  listSkills() {
    return Array.from(this.skills.values());
  }

  getSkill(key) {
    return this.skills.get(key);
  }

  async addSkill(name, content, location = '.github/skills') {
    if (!vscode.workspace.workspaceFolders) {
      throw new Error('No workspace folder found');
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const skillsPath = path.join(workspaceRoot, location);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(skillsPath)) {
      fs.mkdirSync(skillsPath, { recursive: true });
    }
    
    const skillPath = path.join(skillsPath, name);
    fs.writeFileSync(skillPath, content);
    
    // Reload skills
    this.skills.clear();
    await this.loadSkills();
    
    return skillPath;
  }

  async removeSkill(key) {
    const skill = this.skills.get(key);
    
    if (!skill) {
      throw new Error('Skill not found');
    }
    
    try {
      fs.unlinkSync(skill.path);
      this.skills.delete(key);
      
      vscode.window.showInformationMessage(`Skill "${skill.filename}" removed`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to remove skill: ${error.message}`);
    }
  }

  trackApiUsage(skillKey, endpoint) {
    const key = `${skillKey}:${endpoint}`;
    const current = this.apiUsage.get(key) || 0;
    this.apiUsage.set(key, current + 1);
    
    // Warn about high API usage
    if (current > 100) {
      vscode.window.showWarningMessage(
        `Skill "${skillKey}" has made ${current + 1} API calls to ${endpoint}. Consider implementing caching.`
      );
    }
  }

  getApiUsage(skillKey) {
    const usage = {};
    
    for (const [key, count] of this.apiUsage.entries()) {
      if (key.startsWith(skillKey)) {
        const endpoint = key.split(':')[1];
        usage[endpoint] = count;
      }
    }
    
    return usage;
  }

  clearApiUsage() {
    this.apiUsage.clear();
  }

  async refreshSkills() {
    this.skills.clear();
    await this.loadSkills();
  }
}

export { SkillsMarketplaceManager };
