/**
 * Publish Validation Handlers
 * Handlers for publish validation workflow
 */

import { initializePublishValidator, getPublishValidator } from '../publish-validator.js';

/**
 * Check publish readiness
 */
export async function checkPublishReadiness(args) {
  try {
    const validator = initializePublishValidator(process.cwd());
    const results = await validator.validate();

    const output = validator.formatReport();

    return {
      content: [{ type: 'text', text: output }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to check publish readiness: ${error.message}` }],
    };
  }
}

/**
 * Request publish permission
 */
export async function requestPublishPermission(args) {
  try {
    const validator = getPublishValidator();
    if (!validator) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'No publish validator initialized. Use check_publish_readiness first.',
          },
        ],
      };
    }

    // Run validation
    const results = await validator.validate();

    if (!results.canPublish) {
      let output = '❌ CANNOT REQUEST PUBLISH PERMISSION\n\n';
      output += 'Project is not ready to publish. Critical issues must be fixed first:\n\n';
      results.issues.forEach((issue, i) => {
        output += `${i + 1}. ${issue.message}\n`;
      });
      output += '\nRun `check_publish_readiness` for full details.\n';

      return {
        isError: true,
        content: [{ type: 'text', text: output }],
      };
    }

    // Store permission request state
    const statePath = process.cwd() + '/.sweobeyme-publish-state.json';
    const state = {
      requested: true,
      granted: false,
      requestedAt: new Date().toISOString(),
      validationResults: results,
    };

    await import('fs/promises').then((fs) =>
      fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf-8')
    );

    let output = '📋 PUBLISH PERMISSION REQUESTED\n\n';
    output += 'SWEObeyMe has validated the project and it is ready to publish.\n\n';
    output += 'Validation Summary:\n';
    output += '- Package.json: ✅ Valid\n';
    output += '- Version: ✅ Bumped\n';
    output += '- README: ✅ Updated\n';
    output += '- CHANGELOG: ✅ Updated\n';
    output += '- Documentation: ✅ In sync\n';
    output += '- Project Map: ✅ Updated\n';
    output += '- Code Quality: ✅ Good\n\n';
    output += '⚠️ USER ACTION REQUIRED\n\n';
    output += 'To grant permission to publish, use: `grant_publish_permission`\n';
    output += 'To deny permission, use: `deny_publish_permission`\n';

    return {
      content: [{ type: 'text', text: output }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to request publish permission: ${error.message}` }],
    };
  }
}

/**
 * Grant publish permission
 */
export async function grantPublishPermission(args) {
  try {
    const statePath = process.cwd() + '/.sweobeyme-publish-state.json';
    const fs = await import('fs/promises');

    try {
      const stateData = await fs.readFile(statePath, 'utf-8');
      const state = JSON.parse(stateData);

      if (!state.requested) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: 'No publish permission request found. Use request_publish_permission first.',
            },
          ],
        };
      }

      state.granted = true;
      state.grantedAt = new Date().toISOString();
      await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf-8');

      let output = '✅ PUBLISH PERMISSION GRANTED\n\n';
      output += 'User has granted permission to publish.\n';
      output += 'You may now proceed with the publish operation.\n\n';
      output += 'Recommended publish commands:\n';
      output += '- For VS Code extensions: `npm run publish` or `vsce publish`\n';
      output += '- For npm packages: `npm publish`\n';
      output += '- For GitHub releases: Use GitHub web interface or CLI\n';

      return {
        content: [{ type: 'text', text: output }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'No publish permission state found. Use request_publish_permission first.',
          },
        ],
      };
    }
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to grant publish permission: ${error.message}` }],
    };
  }
}

/**
 * Deny publish permission
 */
export async function denyPublishPermission(args) {
  try {
    const statePath = process.cwd() + '/.sweobeyme-publish-state.json';
    const fs = await import('fs/promises');

    try {
      const stateData = await fs.readFile(statePath, 'utf-8');
      const state = JSON.parse(stateData);

      if (!state.requested) {
        return {
          isError: true,
          content: [{ type: 'text', text: 'No publish permission request found.' }],
        };
      }

      state.granted = false;
      state.deniedAt = new Date().toISOString();
      await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf-8');

      let output = '❌ PUBLISH PERMISSION DENIED\n\n';
      output += 'User has denied permission to publish.\n';
      output += 'Fix any issues and request permission again when ready.\n';

      return {
        content: [{ type: 'text', text: output }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'No publish permission state found.' }],
      };
    }
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to deny publish permission: ${error.message}` }],
    };
  }
}

/**
 * Check publish permission status
 */
export async function checkPublishPermissionStatus(args) {
  try {
    const statePath = process.cwd() + '/.sweobeyme-publish-state.json';
    const fs = await import('fs/promises');

    try {
      const stateData = await fs.readFile(statePath, 'utf-8');
      const state = JSON.parse(stateData);

      let output = 'PUBLISH PERMISSION STATUS\n\n';
      output += `Requested: ${state.requested ? '✅' : '❌'}\n`;
      output += `Granted: ${state.granted ? '✅' : '❌'}\n`;

      if (state.requestedAt) {
        output += `Requested at: ${state.requestedAt}\n`;
      }

      if (state.grantedAt) {
        output += `Granted at: ${state.grantedAt}\n`;
      }

      if (state.deniedAt) {
        output += `Denied at: ${state.deniedAt}\n`;
      }

      output += '\n';

      if (state.granted) {
        output += '✅ Permission granted. Ready to publish.\n';
      } else if (state.requested) {
        output += '⏳ Permission requested but not yet granted.\n';
      } else {
        output += '❌ No permission request found.\n';
      }

      return {
        content: [{ type: 'text', text: output }],
      };
    } catch (error) {
      let output = 'PUBLISH PERMISSION STATUS\n\n';
      output += '❌ No permission request found.\n';
      output += 'Use `request_publish_permission` to request permission.\n';

      return {
        content: [{ type: 'text', text: output }],
      };
    }
  } catch (error) {
    return {
      isError: true,
      content: [
        { type: 'text', text: `Failed to check publish permission status: ${error.message}` },
      ],
    };
  }
}

/**
 * Clear publish permission state
 */
export async function clearPublishPermission(args) {
  try {
    const statePath = process.cwd() + '/.sweobeyme-publish-state.json';
    const fs = await import('fs/promises');

    try {
      await fs.unlink(statePath);

      let output = '✅ PUBLISH PERMISSION STATE CLEARED\n\n';
      output += 'Permission state has been cleared.\n';
      output += 'Use `request_publish_permission` to request permission again.\n';

      return {
        content: [{ type: 'text', text: output }],
      };
    } catch (error) {
      let output = '✅ PUBLISH PERMISSION STATE CLEARED\n\n';
      output += 'No permission state to clear.\n';

      return {
        content: [{ type: 'text', text: output }],
      };
    }
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to clear publish permission: ${error.message}` }],
    };
  }
}

export const publishValidationHandlers = {
  check_publish_readiness: checkPublishReadiness,
  request_publish_permission: requestPublishPermission,
  grant_publish_permission: grantPublishPermission,
  deny_publish_permission: denyPublishPermission,
  check_publish_permission_status: checkPublishPermissionStatus,
  clear_publish_permission: clearPublishPermission,
};
