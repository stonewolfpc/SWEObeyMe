import * as vscode from 'vscode';

class PermissionManager {
  constructor() {
    this.perAgent = vscode.workspace
      .getConfiguration('sweObeyMe.toolControls')
      .get('perAgent', true);
    this.fileAccess = vscode.workspace
      .getConfiguration('sweObeyMe.toolControls')
      .get('fileAccess', 'ask');
    this.terminalAccess = vscode.workspace
      .getConfiguration('sweObeyMe.toolControls')
      .get('terminalAccess', 'ask');
    this.networkAccess = vscode.workspace
      .getConfiguration('sweObeyMe.toolControls')
      .get('networkAccess', 'ask');

    // Track agent-specific permissions
    this.agentPermissions = new Map();

    // Track active tools to prevent conflicts
    this.activeTools = new Set();

    // Track permission decisions for session
    this.permissionDecisions = new Map();
  }

  async requestPermission(agentId, toolType, resource, operation) {
    const key = `${agentId}:${toolType}:${resource}`;

    // Check if we already have a decision for this in the session
    if (this.permissionDecisions.has(key)) {
      return this.permissionDecisions.get(key);
    }

    // Get permission level for this tool type
    let permissionLevel = 'ask';
    if (toolType === 'file') {
      permissionLevel = this.fileAccess;
    } else if (toolType === 'terminal') {
      permissionLevel = this.terminalAccess;
    } else if (toolType === 'network') {
      permissionLevel = this.networkAccess;
    }

    // Handle based on permission level
    if (permissionLevel === 'allow') {
      const decision = true;
      this.permissionDecisions.set(key, decision);
      return decision;
    } else if (permissionLevel === 'deny') {
      const decision = false;
      this.permissionDecisions.set(key, decision);
      return decision;
    }

    // Ask user for permission
    const message = `Agent "${agentId}" wants to ${operation} ${resource}`;
    const options = ['Allow', 'Deny', 'Allow All for Session', 'Deny All for Session'];

    const selection = await vscode.window.showWarningMessage(message, ...options);

    let decision = false;
    if (selection === 'Allow') {
      decision = true;
    } else if (selection === 'Allow All for Session') {
      decision = true;
      // Remember this decision for the session
      this.permissionDecisions.set(key, decision);
    } else if (selection === 'Deny All for Session') {
      decision = false;
      this.permissionDecisions.set(key, decision);
    }

    return decision;
  }

  async checkToolConflict(toolType, agentId) {
    // Check if this tool is already active by another agent
    const activeToolKey = `${toolType}:${agentId}`;

    if (this.activeTools.has(toolType) && !this.activeTools.has(activeToolKey)) {
      // Tool is active by another agent
      const activeAgents = Array.from(this.activeTools)
        .filter((key) => key.startsWith(toolType))
        .map((key) => key.split(':')[1]);

      const message = `Tool "${toolType}" is already in use by agent(s): ${activeAgents.join(', ')}. Continue anyway?`;
      const selection = await vscode.window.showWarningMessage(message, 'Continue', 'Cancel');

      return selection === 'Continue';
    }

    return true;
  }

  registerToolUse(toolType, agentId) {
    const key = `${toolType}:${agentId}`;
    this.activeTools.add(key);
    this.activeTools.add(toolType);
  }

  unregisterToolUse(toolType, agentId) {
    const key = `${toolType}:${agentId}`;
    this.activeTools.delete(key);

    // Check if any other agent is using this tool
    const otherAgentsUsingTool = Array.from(this.activeTools).filter(
      (k) => k.startsWith(toolType) && k !== key
    );

    if (otherAgentsUsingTool.length === 0) {
      this.activeTools.delete(toolType);
    }
  }

  setAgentPermission(agentId, toolType, allowed) {
    if (!this.agentPermissions.has(agentId)) {
      this.agentPermissions.set(agentId, {});
    }

    const agentPerms = this.agentPermissions.get(agentId);
    agentPerms[toolType] = allowed;
    this.agentPermissions.set(agentId, agentPerms);
  }

  getAgentPermission(agentId, toolType) {
    if (!this.agentPermissions.has(agentId)) {
      return null; // No specific permission set for this agent
    }

    const agentPerms = this.agentPermissions.get(agentId);
    return agentPerms[toolType] || null;
  }

  clearPermissionDecisions() {
    this.permissionDecisions.clear();
  }

  clearAgentPermissions(agentId) {
    this.agentPermissions.delete(agentId);
  }

  getActiveTools() {
    return Array.from(this.activeTools);
  }

  getAgentPermissions(agentId) {
    return this.agentPermissions.get(agentId) || {};
  }
}

export { PermissionManager };
