/**
 * Version Tracker Handlers
 * Handlers for version management and permission gate operations
 */

import { getVersionTracker, initializeVersionTracker, CHANGE_TYPES } from '../version-tracker.js';

/**
 * Check current version status
 */
export async function checkVersionStatus(args) {
  try {
    const vt = getVersionTracker();
    if (!vt) {
      const initialized = await initializeVersionTracker(process.cwd());
      if (!initialized) {
        return {
          isError: true,
          content: [{ type: 'text', text: 'Failed to initialize version tracker.' }],
        };
      }
    }

    const status = await vt.getVersionStatus();

    let output = 'Version Status:\n\n';
    output += `Current Version: ${status.currentVersion}\n`;
    output += `Suggested Bump: ${status.suggestedBump}\n`;
    output += `Suggested Version: ${status.suggestedVersion}\n`;
    output += `Bump Reason: ${status.bumpReason}\n\n`;

    output += 'Changes Summary:\n';
    output += `  Total Changes: ${status.changesSummary.totalChanges}\n`;
    output += `  Pending Push: ${status.changesSummary.pendingPush}\n`;
    output += `  Permission Requested: ${status.changesSummary.permissionRequested}\n`;
    output += `  Permission Granted: ${status.changesSummary.permissionGranted}\n\n`;

    output += `Can Push: ${status.canPush ? 'YES' : 'NO - Permission required'}\n`;

    if (status.changesSummary.totalChanges > 0) {
      output += '\nRecent Changes:\n';
      status.changesSummary.changes.slice(-5).forEach((change, i) => {
        output += `  ${i + 1}. [${change.type.toUpperCase()}] ${change.description}\n`;
      });
    }

    return {
      content: [{ type: 'text', text: output }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to check version status: ${error.message}` }],
    };
  }
}

/**
 * Suggest version bump based on changes
 */
export async function suggestVersionBump(args) {
  try {
    const vt = getVersionTracker();
    if (!vt) {
      await initializeVersionTracker(process.cwd());
    }

    const tracker = getVersionTracker();
    const analysis = tracker.analyzeChanges();

    let output = 'Version Bump Suggestion:\n\n';
    output += `Current Version: ${analysis.currentVersion}\n`;
    output += `Suggested Bump: ${analysis.suggestedBump}\n`;
    output += `Suggested Version: ${analysis.suggestedVersion}\n`;
    output += `Reason: ${analysis.reason}\n\n`;

    output += 'Change Analysis:\n';
    output += `  Major Changes: ${analysis.changeCounts.major}\n`;
    output += `  Minor Changes: ${analysis.changeCounts.minor}\n`;
    output += `  Patch Changes: ${analysis.changeCounts.patch}\n`;
    output += `  Total Changes: ${analysis.totalChanges}\n\n`;

    output += 'Semantic Versioning Rules:\n';
    output += '  MAJOR: Breaking changes, API changes\n';
    output += '  MINOR: New features, backward-compatible changes\n';
    output += '  PATCH: Bug fixes, documentation updates\n';

    return {
      content: [{ type: 'text', text: output }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to suggest version bump: ${error.message}` }],
    };
  }
}

/**
 * Record a change for version tracking
 */
export async function recordChange(args) {
  try {
    const vt = getVersionTracker();
    if (!vt) {
      await initializeVersionTracker(process.cwd());
    }

    const tracker = getVersionTracker();

    const change = {
      type: args.type || CHANGE_TYPES.PATCH,
      description: args.description,
      filePath: args.filePath,
      metadata: args.metadata || {},
    };

    tracker.recordChange(change);
    await tracker.saveVersionState();

    return {
      content: [
        {
          type: 'text',
          text: `Change recorded: [${change.type.toUpperCase()}] ${change.description}`,
        },
      ],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to record change: ${error.message}` }],
    };
  }
}

/**
 * Request push permission from user
 */
export async function requestPushPermission(args) {
  try {
    const vt = getVersionTracker();
    if (!vt) {
      await initializeVersionTracker(process.cwd());
    }

    const tracker = getVersionTracker();
    const result = await tracker.requestPushPermission();

    let output = '🔒 PUSH PERMISSION REQUESTED\n\n';
    output += result.message + '\n\n';
    output += 'Changes Summary:\n';
    output += `  Total Changes: ${result.changesSummary.totalChanges}\n`;
    output += `  Pending Push: ${result.changesSummary.pendingPush}\n\n`;

    if (result.changesSummary.totalChanges > 0) {
      output += 'Changes to be pushed:\n';
      result.changesSummary.changes.forEach((change, i) => {
        output += `  ${i + 1}. [${change.type.toUpperCase()}] ${change.description}\n`;
      });
    }

    output += '\n⚠️ USER ACTION REQUIRED:\n';
    output += 'Use `grant_push_permission` to authorize the push.\n';
    output += 'Use `revoke_push_permission` to deny the push.\n';

    return {
      content: [{ type: 'text', text: output }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to request push permission: ${error.message}` }],
    };
  }
}

/**
 * Grant push permission
 */
export async function grantPushPermission(args) {
  try {
    const vt = getVersionTracker();
    if (!vt) {
      await initializeVersionTracker(process.cwd());
    }

    const tracker = getVersionTracker();
    const result = await tracker.grantPushPermission();

    let output = '✅ PUSH PERMISSION GRANTED\n\n';
    output += result.message + '\n\n';
    output += 'You may now proceed with the push operation.\n';
    output += 'Note: Permission will be revoked after successful push or new changes are recorded.';

    return {
      content: [{ type: 'text', text: output }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to grant push permission: ${error.message}` }],
    };
  }
}

/**
 * Revoke push permission
 */
export async function revokePushPermission(args) {
  try {
    const vt = getVersionTracker();
    if (!vt) {
      await initializeVersionTracker(process.cwd());
    }

    const tracker = getVersionTracker();
    const result = await tracker.revokePushPermission();

    let output = '🔒 PUSH PERMISSION REVOKED\n\n';
    output += result.message + '\n';

    return {
      content: [{ type: 'text', text: output }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to revoke push permission: ${error.message}` }],
    };
  }
}

/**
 * Apply version bump
 */
export async function applyVersionBump(args) {
  try {
    const vt = getVersionTracker();
    if (!vt) {
      await initializeVersionTracker(process.cwd());
    }

    const tracker = getVersionTracker();
    const bumpType = args.bumpType || CHANGE_TYPES.PATCH;

    if (!['major', 'minor', 'patch'].includes(bumpType)) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Invalid bump type. Must be: major, minor, or patch' }],
      };
    }

    const result = await tracker.applyVersionBump(bumpType);

    if (result.success) {
      let output = '✅ Version Bump Applied\n\n';
      output += `Old Version: ${result.oldVersion}\n`;
      output += `New Version: ${result.newVersion}\n`;
      output += `Bump Type: ${result.bumpType}\n\n`;
      output += 'package.json has been updated.';

      return {
        content: [{ type: 'text', text: output }],
      };
    } else {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to apply version bump: ${result.error}` }],
      };
    }
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to apply version bump: ${error.message}` }],
    };
  }
}

/**
 * Check if push is permitted
 */
export async function checkPushPermitted(args) {
  try {
    const vt = getVersionTracker();
    if (!vt) {
      await initializeVersionTracker(process.cwd());
    }

    const tracker = getVersionTracker();
    const permitted = tracker.isPushPermitted();
    const status = await tracker.getVersionStatus();

    if (permitted) {
      let output = '✅ PUSH PERMITTED\n\n';
      output += 'You have permission to push changes.\n';
      output += `Current Version: ${status.currentVersion}\n`;
      output += `Pending Changes: ${status.changesSummary.totalChanges}\n`;

      return {
        content: [{ type: 'text', text: output }],
      };
    } else {
      let output = '🔒 PUSH NOT PERMITTED\n\n';
      output += 'You do not have permission to push changes.\n\n';

      if (!status.changesSummary.permissionRequested) {
        output += 'Action Required:\n';
        output += '  1. Use `request_push_permission` to request permission\n';
        output += '  2. User must grant permission using `grant_push_permission`\n';
      } else if (!status.changesSummary.permissionGranted) {
        output += 'Action Required:\n';
        output += '  User must grant permission using `grant_push_permission`\n';
      }

      return {
        content: [{ type: 'text', text: output }],
      };
    }
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to check push permission: ${error.message}` }],
    };
  }
}

/**
 * Clear changes after successful push
 */
export async function clearChanges(args) {
  try {
    const vt = getVersionTracker();
    if (!vt) {
      await initializeVersionTracker(process.cwd());
    }

    const tracker = getVersionTracker();
    await tracker.clearChanges();

    return {
      content: [
        { type: 'text', text: '✅ Changes cleared after successful push. Version state reset.' },
      ],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to clear changes: ${error.message}` }],
    };
  }
}

export const versionTrackerHandlers = {
  check_version_status: checkVersionStatus,
  suggest_version_bump: suggestVersionBump,
  record_change: recordChange,
  request_push_permission: requestPushPermission,
  grant_push_permission: grantPushPermission,
  revoke_push_permission: revokePushPermission,
  apply_version_bump: applyVersionBump,
  check_push_permitted: checkPushPermitted,
  clear_changes: clearChanges,
};
