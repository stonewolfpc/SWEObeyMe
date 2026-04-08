/**
 * Version Tracker System
 * Monitors implementation changes, suggests version bumps, and enforces permission gates for push operations
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Change types for version bumping
 */
export const CHANGE_TYPES = {
  MAJOR: 'major',      // Breaking changes, API changes
  MINOR: 'minor',      // New features, backward-compatible changes
  PATCH: 'patch',      // Bug fixes, documentation updates
  NONE: 'none',        // No version bump needed
};

/**
 * Version tracker class
 */
export class VersionTracker {
  constructor(workspacePath) {
    this.workspacePath = workspacePath;
    this.packageJsonPath = path.join(workspacePath, 'package.json');
    this.versionStatePath = path.join(workspacePath, '.sweobeyme-version-state.json');
    this.currentVersion = null;
    this.changes = [];
    this.pendingPush = false;
    this.permissionRequested = false;
    this.permissionGranted = false;
  }

  /**
   * Load current version from package.json
   */
  async loadCurrentVersion() {
    try {
      const packageJson = JSON.parse(await fs.readFile(this.packageJsonPath, 'utf-8'));
      this.currentVersion = packageJson.version;
      return this.currentVersion;
    } catch (error) {
      console.error(`Failed to load version: ${error.message}`);
      return null;
    }
  }

  /**
   * Load version state
   */
  async loadVersionState() {
    try {
      const data = await fs.readFile(this.versionStatePath, 'utf-8');
      const state = JSON.parse(data);
      this.changes = state.changes || [];
      this.pendingPush = state.pendingPush || false;
      this.permissionRequested = state.permissionRequested || false;
      this.permissionGranted = state.permissionGranted || false;
      return state;
    } catch (error) {
      // State file doesn't exist, initialize fresh
      return {
        changes: [],
        pendingPush: false,
        permissionRequested: false,
        permissionGranted: false,
      };
    }
  }

  /**
   * Save version state
   */
  async saveVersionState() {
    try {
      const state = {
        currentVersion: this.currentVersion,
        changes: this.changes,
        pendingPush: this.pendingPush,
        permissionRequested: this.permissionRequested,
        permissionGranted: this.permissionGranted,
        lastUpdated: new Date().toISOString(),
      };
      await fs.writeFile(this.versionStatePath, JSON.stringify(state, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error(`Failed to save version state: ${error.message}`);
      return false;
    }
  }

  /**
   * Record a change
   */
  recordChange(change) {
    const changeRecord = {
      type: change.type || CHANGE_TYPES.PATCH,
      description: change.description,
      filePath: change.filePath,
      timestamp: new Date().toISOString(),
      metadata: change.metadata || {},
    };

    this.changes.push(changeRecord);
    this.pendingPush = true;
    this.permissionGranted = false; // Reset permission on new changes
  }

  /**
   * Analyze changes and suggest version bump
   */
  analyzeChanges() {
    if (this.changes.length === 0) {
      return {
        suggestedBump: CHANGE_TYPES.NONE,
        reason: 'No changes recorded',
        currentVersion: this.currentVersion,
        suggestedVersion: this.currentVersion,
      };
    }

    // Count change types
    const changeCounts = {
      [CHANGE_TYPES.MAJOR]: 0,
      [CHANGE_TYPES.MINOR]: 0,
      [CHANGE_TYPES.PATCH]: 0,
    };

    this.changes.forEach(change => {
      if (changeCounts[change.type] !== undefined) {
        changeCounts[change.type]++;
      }
    });

    // Determine suggested bump
    let suggestedBump;
    if (changeCounts[CHANGE_TYPES.MAJOR] > 0) {
      suggestedBump = CHANGE_TYPES.MAJOR;
    } else if (changeCounts[CHANGE_TYPES.MINOR] > 0) {
      suggestedBump = CHANGE_TYPES.MINOR;
    } else if (changeCounts[CHANGE_TYPES.PATCH] > 0) {
      suggestedBump = CHANGE_TYPES.PATCH;
    } else {
      suggestedBump = CHANGE_TYPES.NONE;
    }

    const suggestedVersion = this.bumpVersion(this.currentVersion, suggestedBump);

    return {
      suggestedBump,
      reason: this.getBumpReason(changeCounts),
      currentVersion: this.currentVersion,
      suggestedVersion,
      changeCounts,
      totalChanges: this.changes.length,
    };
  }

  /**
   * Get reason for version bump
   */
  getBumpReason(changeCounts) {
    const reasons = [];

    if (changeCounts[CHANGE_TYPES.MAJOR] > 0) {
      reasons.push(`${changeCounts[CHANGE_TYPES.MAJOR]} breaking change(s)`);
    }
    if (changeCounts[CHANGE_TYPES.MINOR] > 0) {
      reasons.push(`${changeCounts[CHANGE_TYPES.MINOR]} new feature(s)`);
    }
    if (changeCounts[CHANGE_TYPES.PATCH] > 0) {
      reasons.push(`${changeCounts[CHANGE_TYPES.PATCH]} fix(es)`);
    }

    return reasons.join(', ');
  }

  /**
   * Bump version
   */
  bumpVersion(version, bumpType) {
    if (!version || bumpType === CHANGE_TYPES.NONE) {
      return version;
    }

    const parts = version.split('.').map(Number);

    if (bumpType === CHANGE_TYPES.MAJOR) {
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
    } else if (bumpType === CHANGE_TYPES.MINOR) {
      parts[1]++;
      parts[2] = 0;
    } else if (bumpType === CHANGE_TYPES.PATCH) {
      parts[2]++;
    }

    return parts.join('.');
  }

  /**
   * Request push permission from user
   */
  async requestPushPermission() {
    this.permissionRequested = true;
    this.permissionGranted = false;
    await this.saveVersionState();

    return {
      permissionRequested: true,
      permissionGranted: false,
      message: 'Push permission requested. User must grant permission before proceeding.',
      changesSummary: this.getChangesSummary(),
    };
  }

  /**
   * Grant push permission
   */
  async grantPushPermission() {
    this.permissionGranted = true;
    await this.saveVersionState();

    return {
      permissionGranted: true,
      message: 'Push permission granted. You may now proceed with push operation.',
    };
  }

  /**
   * Revoke push permission
   */
  async revokePushPermission() {
    this.permissionGranted = false;
    await this.saveVersionState();

    return {
      permissionGranted: false,
      message: 'Push permission revoked.',
    };
  }

  /**
   * Check if push is permitted
   */
  isPushPermitted() {
    return this.permissionGranted === true;
  }

  /**
   * Apply version bump to package.json
   */
  async applyVersionBump(bumpType) {
    try {
      const packageJson = JSON.parse(await fs.readFile(this.packageJsonPath, 'utf-8'));
      const newVersion = this.bumpVersion(packageJson.version, bumpType);

      packageJson.version = newVersion;
      await fs.writeFile(this.packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');

      this.currentVersion = newVersion;
      await this.saveVersionState();

      return {
        success: true,
        oldVersion: packageJson.version,
        newVersion,
        bumpType,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Clear changes after push
   */
  async clearChanges() {
    this.changes = [];
    this.pendingPush = false;
    this.permissionRequested = false;
    this.permissionGranted = false;
    await this.saveVersionState();
  }

  /**
   * Get changes summary
   */
  getChangesSummary() {
    return {
      totalChanges: this.changes.length,
      changes: this.changes.map(c => ({
        type: c.type,
        description: c.description,
        filePath: c.filePath,
        timestamp: c.timestamp,
      })),
      pendingPush: this.pendingPush,
      permissionRequested: this.permissionRequested,
      permissionGranted: this.permissionGranted,
    };
  }

  /**
   * Get version status
   */
  async getVersionStatus() {
    await this.loadCurrentVersion();
    await this.loadVersionState();

    const analysis = this.analyzeChanges();

    return {
      currentVersion: this.currentVersion,
      suggestedBump: analysis.suggestedBump,
      suggestedVersion: analysis.suggestedVersion,
      bumpReason: analysis.reason,
      changesSummary: this.getChangesSummary(),
      canPush: this.isPushPermitted(),
    };
  }
}

/**
 * Global version tracker instance
 */
let globalVersionTracker = null;

/**
 * Initialize version tracker for workspace
 */
export async function initializeVersionTracker(workspacePath) {
  if (!globalVersionTracker) {
    globalVersionTracker = new VersionTracker(workspacePath);
    await globalVersionTracker.loadCurrentVersion();
    await globalVersionTracker.loadVersionState();
  }

  return globalVersionTracker;
}

/**
 * Get global version tracker instance
 */
export function getVersionTracker() {
  return globalVersionTracker;
}
