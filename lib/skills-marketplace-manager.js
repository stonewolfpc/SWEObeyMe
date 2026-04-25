import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { readFileSafe, writeFileSafe, existsSafe, readdirSafe } from './shared/async-utils.js';

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
        if (await existsSafe(skillsPath, 1000, `loadSkills exists ${location}`)) {
          const skillFiles = await readdirSafe(skillsPath, {}, 5000, `loadSkills readdir ${location}`);
          
          for (const file of skillFiles) {
            if (file.endsWith('.json') || file.endsWith('.js') || file.endsWith('.md')) {
              const skillPath = path.join(skillsPath, file);
              const skillKey = `${location}/${file}`;
              
              try {
                const content = await readFileSafe(skillPath, 10000, `loadSkills read ${file}`);
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
    
    if (await existsSafe(legacyPath, 1000, 'checkMigrationNeeded exists legacyPath') && !(await existsSafe(newPath, 1000, 'checkMigrationNeeded exists newPath'))) {
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
      await fs.mkdir(path.dirname(newPath), { recursive: true });
      
      // Copy skills
      const skillFiles = await readdirSafe(legacyPath, {}, 5000, 'migrateSkills readdir');
      
      for (const file of skillFiles) {
        const srcPath = path.join(legacyPath, file);
        const destPath = path.join(newPath, file);
        
        const content = await readFileSafe(srcPath, 10000, `migrateSkills read ${file}`);
        await writeFileSafe(destPath, content, 10000, `migrateSkills write ${file}`);
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
    if (!(await existsSafe(skillsPath, 1000, 'addSkill exists skillsPath'))) {
      await fs.mkdir(skillsPath, { recursive: true });
    }
    
    const skillPath = path.join(skillsPath, name);
    await writeFileSafe(skillPath, content, 10000, 'addSkill write');
    
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
      await fs.unlink(skill.path);
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
