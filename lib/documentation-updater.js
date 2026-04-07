/**
 * Automatic Documentation Updates
 * Updates README, architecture.md, changelog.md, and project_map.json on structural changes
 * Integrates with version tracker for automatic change recording
 */

import fs from 'fs/promises';
import path from 'path';
import { getProjectMemory } from './project-memory.js';
import { getVersionTracker, initializeVersionTracker, CHANGE_TYPES } from './version-tracker.js';

/**
 * Documentation updater class
 */
export class DocumentationUpdater {
  constructor(workspacePath) {
    this.workspacePath = workspacePath;
    this.readmePath = path.join(workspacePath, 'README.md');
    this.changelogPath = path.join(workspacePath, 'CHANGELOG.md');
    this.architecturePath = path.join(workspacePath, 'docs', 'architecture.md');
  }

  /**
   * Update documentation after a structural change
   */
  async updateAfterStructuralChange(changeType, filePath, metadata = {}) {
    const updates = [];

    try {
      // Update project_map.json (always required)
      const pm = getProjectMemory();
      if (pm) {
        await pm.updateProjectMapForFile(filePath, changeType, metadata);
        updates.push('project_map.json');
      }

      // Update README if significant change
      if (this.isSignificantChange(changeType, metadata)) {
        await this.updateREADME(changeType, filePath, metadata);
        updates.push('README.md');
      }

      // Update changelog
      await this.updateChangelog(changeType, filePath, metadata);
      updates.push('CHANGELOG.md');

      // Update architecture.md if structural
      if (this.isStructuralChange(changeType, metadata)) {
        await this.updateArchitecture(changeType, filePath, metadata);
        updates.push('docs/architecture.md');
      }

      // Record change in version tracker
      const vt = getVersionTracker();
      if (!vt) {
        await initializeVersionTracker(this.workspacePath);
      }
      
      const tracker = getVersionTracker();
      if (tracker) {
        // Determine change type for versioning
        let versionChangeType = CHANGE_TYPES.PATCH;
        
        if (metadata.isBreakingChange || metadata.isMajorFeature) {
          versionChangeType = CHANGE_TYPES.MAJOR;
        } else if (metadata.isNewFeature) {
          versionChangeType = CHANGE_TYPES.MINOR;
        }
        
        tracker.recordChange({
          type: versionChangeType,
          description: metadata.description || `${changeType} operation on ${path.relative(this.workspacePath, filePath)}`,
          filePath: filePath,
          metadata: {
            changeType,
            documentationUpdated: updates,
            ...metadata
          }
        });
        
        await tracker.saveVersionState();
      }

      return {
        success: true,
        updatedFiles: updates,
        message: `Documentation updated: ${updates.join(', ')}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Failed to update documentation: ${error.message}`
      };
    }
  }

  /**
   * Determine if change is significant
   */
  isSignificantChange(changeType, metadata) {
    if (changeType === 'create' || changeType === 'delete') {
      return true;
    }
    if (changeType === 'move') {
      return true;
    }
    if (metadata.isMajorFeature || metadata.isBreakingChange) {
      return true;
    }
    return false;
  }

  /**
   * Determine if change is structural
   */
  isStructuralChange(changeType, metadata) {
    if (changeType === 'create' || changeType === 'delete' || changeType === 'move') {
      return true;
    }
    if (metadata.affectsStructure) {
      return true;
    }
    return false;
  }

  /**
   * Update README with new file/module
   */
  async updateREADME(changeType, filePath, metadata) {
    try {
      const readmeExists = await fs.access(this.readmePath).then(() => true).catch(() => false);
      
      if (!readmeExists) {
        return; // No README to update
      }

      const readmeContent = await fs.readFile(this.readmePath, 'utf-8');
      const relativePath = path.relative(this.workspacePath, filePath);
      
      // Add to appropriate section based on domain
      let updatedContent = readmeContent;
      
      if (changeType === 'create') {
        // Add new file/module mention
        if (metadata.domain) {
          const sectionHeader = `## ${metadata.domain.charAt(0).toUpperCase() + metadata.domain.slice(1)}`;
          if (!updatedContent.includes(sectionHeader)) {
            // Add new section
            updatedContent += `\n\n${sectionHeader}\n\n- ${relativePath}: ${metadata.purpose || 'New module'}`;
          } else {
            // Add to existing section
            const sectionStart = updatedContent.indexOf(sectionHeader);
            const sectionEnd = updatedContent.indexOf('\n## ', sectionStart + 1);
            const sectionContent = updatedContent.slice(sectionStart, sectionEnd !== -1 ? sectionEnd : undefined);
            
            if (!sectionContent.includes(relativePath)) {
              updatedContent = updatedContent.slice(0, sectionStart) + 
                              sectionContent + 
                              `\n- ${relativePath}: ${metadata.purpose || 'New module'}` +
                              (sectionEnd !== -1 ? updatedContent.slice(sectionEnd) : '');
            }
          }
        }
      } else if (changeType === 'delete') {
        // Remove file/module mention
        updatedContent = updatedContent.replace(new RegExp(`- ${relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*\\n?`, 'g'), '');
      } else if (changeType === 'move') {
        // Update file path
        const oldRelativePath = path.relative(this.workspacePath, metadata.oldPath);
        updatedContent = updatedContent.replace(oldRelativePath, relativePath);
      }

      if (updatedContent !== readmeContent) {
        await fs.writeFile(this.readmePath, updatedContent, 'utf-8');
      }
    } catch (error) {
      console.error(`Failed to update README: ${error.message}`);
    }
  }

  /**
   * Update changelog with change entry
   */
  async updateChangelog(changeType, filePath, metadata) {
    try {
      const changelogExists = await fs.access(this.changelogPath).then(() => true).catch(() => false);
      
      let changelogContent = '';
      if (changelogExists) {
        changelogContent = await fs.readFile(this.changelogPath, 'utf-8');
      } else {
        // Create new changelog
        changelogContent = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
      }

      const relativePath = path.relative(this.workspacePath, filePath);
      const timestamp = new Date().toISOString().split('T')[0];
      const entry = this.generateChangelogEntry(changeType, relativePath, metadata, timestamp);

      // Add entry to changelog
      if (changelogContent.includes(`## [Unreleased]`)) {
        // Add to unreleased section
        changelogContent = changelogContent.replace(
          /(## \[Unreleased\]\n)/,
          `$1${entry}\n`
        );
      } else {
        // Create new unreleased section
        changelogContent = `## [Unreleased]\n${entry}\n\n` + changelogContent;
      }

      await fs.writeFile(this.changelogPath, changelogContent, 'utf-8');
    } catch (error) {
      console.error(`Failed to update changelog: ${error.message}`);
    }
  }

  /**
   * Generate changelog entry
   */
  generateChangelogEntry(changeType, filePath, metadata, timestamp) {
    const changeMap = {
      create: 'Added',
      update: 'Changed',
      delete: 'Removed',
      move: 'Moved'
    };

    const action = changeMap[changeType] || 'Changed';
    const purpose = metadata.purpose || '';
    const domain = metadata.domain ? `(${metadata.domain})` : '';

    if (changeType === 'move') {
      const oldRelativePath = path.relative(this.workspacePath, metadata.oldPath);
      return `- **${action}** ${oldRelativePath} → ${filePath} ${domain}`;
    }

    return `- **${action}** ${filePath} ${domain} ${purpose ? `- ${purpose}` : ''}`;
  }

  /**
   * Update architecture documentation
   */
  async updateArchitecture(changeType, filePath, metadata) {
    try {
      const architectureExists = await fs.access(this.architecturePath).then(() => true).catch(() => false);
      
      if (!architectureExists) {
        // Create architecture.md if it doesn't exist
        await fs.mkdir(path.dirname(this.architecturePath), { recursive: true });
        await fs.writeFile(
          this.architecturePath,
          '# Architecture Documentation\n\nThis document describes the project architecture and module organization.\n\n## Module Structure\n\n',
          'utf-8'
        );
      }

      const architectureContent = await fs.readFile(this.architecturePath, 'utf-8');
      const relativePath = path.relative(this.workspacePath, filePath);
      
      let updatedContent = architectureContent;

      if (changeType === 'create') {
        // Add module to architecture
        if (metadata.domain) {
          const domainSection = `### ${metadata.domain.charAt(0).toUpperCase() + metadata.domain.slice(1)}`;
          
          if (!updatedContent.includes(domainSection)) {
            // Create new domain section
            updatedContent += `\n${domainSection}\n\n${metadata.purpose || 'Domain module'}\n\n- ${relativePath}\n`;
          } else {
            // Add to existing domain section
            const sectionStart = updatedContent.indexOf(domainSection);
            const sectionEnd = updatedContent.indexOf('\n### ', sectionStart + 1);
            const sectionContent = updatedContent.slice(sectionStart, sectionEnd !== -1 ? sectionEnd : undefined);
            
            if (!sectionContent.includes(relativePath)) {
              updatedContent = updatedContent.slice(0, sectionStart) + 
                              sectionContent + 
                              `\n- ${relativePath}` +
                              (sectionEnd !== -1 ? updatedContent.slice(sectionEnd) : '');
            }
          }
        }
      } else if (changeType === 'delete') {
        // Remove module from architecture
        updatedContent = updatedContent.replace(new RegExp(`- ${relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*\\n?`, 'g'), '');
      } else if (changeType === 'move') {
        // Update module path in architecture
        const oldRelativePath = path.relative(this.workspacePath, metadata.oldPath);
        updatedContent = updatedContent.replace(oldRelativePath, relativePath);
      }

      if (updatedContent !== architectureContent) {
        await fs.writeFile(this.architecturePath, updatedContent, 'utf-8');
      }
    } catch (error) {
      console.error(`Failed to update architecture.md: ${error.message}`);
    }
  }
}

/**
 * Global documentation updater instance
 */
let globalDocumentationUpdater = null;

/**
 * Initialize documentation updater for workspace
 */
export function initializeDocumentationUpdater(workspacePath) {
  if (!globalDocumentationUpdater) {
    globalDocumentationUpdater = new DocumentationUpdater(workspacePath);
  }
  return globalDocumentationUpdater;
}

/**
 * Get global documentation updater instance
 */
export function getDocumentationUpdater() {
  return globalDocumentationUpdater;
}
