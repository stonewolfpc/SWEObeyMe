/**
 * Spec-Driven Development System
 * Addresses RedMonk Complaint #6: Spec-Driven Development
 * 
 * Developers want:
 * - requirements.md, design.md, tasks.md as source of truth
 * - Agents that update specs as code evolves
 * - Flag when implementation diverges from design
 * - Use specifications as verification checkpoints
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Spec Parser
 */
class SpecParser {
  /**
   * Parse requirements.md
   */
  async parseRequirements(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const requirements = this.parseSpecContent(content, 'requirement');
      return {
        type: 'requirements',
        filePath,
        items: requirements,
      };
    } catch (error) {
      console.error('[SPEC PARSER] Failed to parse requirements:', error);
      return null;
    }
  }

  /**
   * Parse design.md
   */
  async parseDesign(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const design = this.parseSpecContent(content, 'design');
      return {
        type: 'design',
        filePath,
        items: design,
      };
    } catch (error) {
      console.error('[SPEC PARSER] Failed to parse design:', error);
      return null;
    }
  }

  /**
   * Parse tasks.md
   */
  async parseTasks(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const tasks = this.parseSpecContent(content, 'task');
      return {
        type: 'tasks',
        filePath,
        items: tasks,
      };
    } catch (error) {
      console.error('[SPEC PARSER] Failed to parse tasks:', error);
      return null;
    }
  }

  /**
   * Parse spec content
   */
  parseSpecContent(content, itemType) {
    const items = [];
    const lines = content.split('\n');
    let currentItem = null;
    let currentSection = null;

    for (const line of lines) {
      // Section headers
      const sectionMatch = line.match(/^#{1,3}\s+(.+)/);
      if (sectionMatch) {
        currentSection = sectionMatch[1].trim();
        continue;
      }

      // Item markers (REQ, DES, TASK, etc.)
      const itemMatch = line.match(/^([A-Z]{3,})-\d+:\s*(.+)/);
      if (itemMatch) {
        if (currentItem) {
          items.push(currentItem);
        }
        currentItem = {
          id: line.split(':')[0],
          title: itemMatch[2],
          description: '',
          status: 'pending',
          section: currentSection,
          type: itemType,
          dependencies: [],
          acceptanceCriteria: [],
        };
        continue;
      }

      // Status markers
      const statusMatch = line.match(/^\[([A-Z]+)\]/);
      if (statusMatch && currentItem) {
        currentItem.status = statusMatch[1].toLowerCase();
        continue;
      }

      // Dependencies
      const depMatch = line.match(/depends:\s*(.+)/i);
      if (depMatch && currentItem) {
        currentItem.dependencies = depMatch[1].split(',').map(d => d.trim());
        continue;
      }

      // Acceptance criteria
      const acMatch = line.match(/ac:\s*(.+)/i);
      if (acMatch && currentItem) {
        currentItem.acceptanceCriteria.push(acMatch[1].trim());
        continue;
      }

      // Description content
      if (currentItem && line.trim()) {
        currentItem.description += line.trim() + ' ';
      }
    }

    if (currentItem) {
      items.push(currentItem);
    }

    return items;
  }
}

/**
 * Spec Tracker
 */
class SpecTracker {
  constructor() {
    this.specs = new Map();
    this.parser = new SpecParser();
    this.divergenceTracker = new DivergenceTracker();
  }

  /**
   * Load spec files
   */
  async loadSpecs(workspacePath) {
    const specs = {
      requirements: null,
      design: null,
      tasks: null,
    };

    // Try to load requirements.md
    const reqPath = path.join(workspacePath, 'requirements.md');
    specs.requirements = await this.parser.parseRequirements(reqPath);

    // Try to load design.md
    const designPath = path.join(workspacePath, 'design.md');
    specs.design = await this.parser.parseDesign(designPath);

    // Try to load tasks.md
    const tasksPath = path.join(workspacePath, 'tasks.md');
    specs.tasks = await this.parser.parseTasks(tasksPath);

    this.specs.set('root', specs);
    return specs;
  }

  /**
   * Get spec by type
   */
  getSpec(type) {
    const specs = this.specs.get('root');
    if (!specs) return null;
    return specs[type];
  }

  /**
   * Get all specs
   */
  getAllSpecs() {
    return this.specs.get('root');
  }

  /**
   * Track implementation against specs
   */
  trackImplementation(filePath, specItemIds) {
    return this.divergenceTracker.track(filePath, specItemIds);
  }

  /**
   * Check for divergence
   */
  checkDivergence() {
    return this.divergenceTracker.getDivergences();
  }

  /**
   * Update spec item status
   */
  async updateSpecItem(specType, itemId, status, updateContent = '') {
    const spec = this.getSpec(specType);
    if (!spec) {
      throw new Error(`Spec ${specType} not loaded`);
    }

    const item = spec.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found in ${specType}`);
    }

    item.status = status;

    // Update the file
    const content = await fs.readFile(spec.filePath, 'utf-8');
    const updatedContent = this.updateSpecContent(content, itemId, status, updateContent);

    return {
      success: true,
      updatedContent,
    };
  }

  /**
   * Update spec content
   */
  updateSpecContent(content, itemId, status, updateContent) {
    const lines = content.split('\n');
    let found = false;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(itemId)) {
        found = true;
        // Update status on next line if it exists
        if (i + 1 < lines.length && lines[i + 1].match(/^\[([A-Z]+)\]/)) {
          lines[i + 1] = `[${status.toUpperCase()}]`;
        } else {
          // Insert status line
          lines.splice(i + 1, 0, `[${status.toUpperCase()}]`);
        }
        break;
      }
    }

    if (!found) {
      throw new Error(`Item ${itemId} not found in spec`);
    }

    return lines.join('\n');
  }

  /**
   * Generate spec compliance report
   */
  generateComplianceReport() {
    const specs = this.getAllSpecs();
    const divergences = this.divergenceTracker.getDivergences();

    let report = '\n';
    report += '='.repeat(60) + '\n';
    report += 'SPEC-DRIVEN DEVELOPMENT COMPLIANCE REPORT\n';
    report += '='.repeat(60) + '\n\n';

    if (specs.requirements) {
      report += 'Requirements:\n';
      report += `  Total: ${specs.requirements.items.length}\n`;
      report += `  Completed: ${specs.requirements.items.filter(i => i.status === 'completed').length}\n`;
      report += `  Pending: ${specs.requirements.items.filter(i => i.status === 'pending').length}\n\n`;
    }

    if (specs.design) {
      report += 'Design:\n';
      report += `  Total: ${specs.design.items.length}\n`;
      report += `  Completed: ${specs.design.items.filter(i => i.status === 'completed').length}\n`;
      report += `  Pending: ${specs.design.items.filter(i => i.status === 'pending').length}\n\n`;
    }

    if (specs.tasks) {
      report += 'Tasks:\n';
      report += `  Total: ${specs.tasks.items.length}\n`;
      report += `  Completed: ${specs.tasks.filter(i => i.status === 'completed').length}\n`;
      report += `  Pending: ${specs.tasks.filter(i => i.status === 'pending').length}\n\n`;
    }

    if (divergences.length > 0) {
      report += 'Divergences:\n';
      divergences.forEach(div => {
        report += `  - ${div.filePath}: ${div.description}\n`;
      });
      report += '\n';
    }

    report += '='.repeat(60) + '\n';

    return report;
  }
}

/**
 * Divergence Tracker
 */
class DivergenceTracker {
  constructor() {
    this.implementationMap = new Map(); // filePath -> specItemIds
    this.divergences = [];
  }

  /**
   * Track implementation
   */
  track(filePath, specItemIds) {
    this.implementationMap.set(filePath, specItemIds);
  }

  /**
   * Check for divergences
   */
  getDivergences() {
    return this.divergences;
  }

  /**
   * Add divergence
   */
  addDivergence(filePath, description) {
    this.divergences.push({
      filePath,
      description,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Clear divergences
   */
  clearDivergences() {
    this.divergences = [];
  }
}

/**
 * Spec Verification Checkpoint
 */
class SpecVerificationCheckpoint {
  constructor(specTracker) {
    this.specTracker = specTracker;
  }

  /**
   * Verify implementation against specs
   */
  async verify(workspacePath) {
    await this.specTracker.loadSpecs(workspacePath);
    
    const specs = this.specTracker.getAllSpecs();
    const verificationResults = {
      requirements: [],
      design: [],
      tasks: [],
      overall: 'unknown',
    };

    // Verify requirements
    if (specs.requirements) {
      verificationResults.requirements = specs.requirements.items.map(req => ({
        id: req.id,
        title: req.title,
        status: req.status,
        implemented: req.status === 'completed',
      }));
    }

    // Verify design
    if (specs.design) {
      verificationResults.design = specs.design.items.map(design => ({
        id: design.id,
        title: design.title,
        status: design.status,
        implemented: design.status === 'completed',
      }));
    }

    // Verify tasks
    if (specs.tasks) {
      verificationResults.tasks = specs.tasks.items.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        implemented: task.status === 'completed',
      }));
    }

    // Calculate overall status
    const allItems = [
      ...verificationResults.requirements,
      ...verificationResults.design,
      ...verificationResults.tasks,
    ];

    if (allItems.length === 0) {
      verificationResults.overall = 'no-specs';
    } else if (allItems.every(i => i.implemented)) {
      verificationResults.overall = 'complete';
    } else if (allItems.some(i => i.implemented)) {
      verificationResults.overall = 'partial';
    } else {
      verificationResults.overall = 'not-started';
    }

    return verificationResults;
  }

  /**
   * Format verification report
   */
  formatVerificationReport(results) {
    let output = '\n';
    output += '='.repeat(60) + '\n';
    output += 'SPEC VERIFICATION CHECKPOINT\n';
    output += '='.repeat(60) + '\n\n';

    output += `Overall Status: ${results.overall.toUpperCase()}\n\n`;

    if (results.requirements.length > 0) {
      output += 'Requirements:\n';
      results.requirements.forEach(req => {
        const status = req.implemented ? '✅' : '⏳';
        output += `  ${status} ${req.id}: ${req.title}\n`;
      });
      output += '\n';
    }

    if (results.design.length > 0) {
      output += 'Design:\n';
      results.design.forEach(design => {
        const status = design.implemented ? '✅' : '⏳';
        output += `  ${status} ${design.id}: ${design.title}\n`;
      });
      output += '\n';
    }

    if (results.tasks.length > 0) {
      output += 'Tasks:\n';
      results.tasks.forEach(task => {
        const status = task.implemented ? '✅' : '⏳';
        output += `  ${status} ${task.id}: ${task.title}\n`;
      });
      output += '\n';
    }

    output += '='.repeat(60) + '\n';

    return output;
  }
}

// Global instances
let specTracker = null;
let specVerificationCheckpoint = null;

/**
 * Get spec tracker instance
 */
export function getSpecTracker() {
  if (!specTracker) {
    specTracker = new SpecTracker();
  }
  return specTracker;
}

/**
 * Get spec verification checkpoint instance
 */
export function getSpecVerificationCheckpoint() {
  if (!specVerificationCheckpoint) {
    specVerificationCheckpoint = new SpecVerificationCheckpoint(getSpecTracker());
  }
  return specVerificationCheckpoint;
}

export { SpecParser, SpecTracker, DivergenceTracker, SpecVerificationCheckpoint };
