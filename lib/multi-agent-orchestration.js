/**
 * Multi-Agent Orchestration System
 * Addresses RedMonk Complaint #5: Multi-Agent Orchestration
 * 
 * Developers want:
 * - Multiple agents working in parallel
 * - Dashboards showing which agents are working on what
 * - Ability to pause, redirect, or terminate agents mid-task
 * - Intelligent conflict resolution when agents work on overlapping code
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Agent Class
 */
class Agent {
  constructor(id, name, task, priority = 'medium') {
    this.id = id;
    this.name = name;
    this.task = task;
    this.priority = priority;
    this.status = 'pending'; // pending, running, paused, completed, failed, terminated
    this.startTime = null;
    this.endTime = null;
    this.progress = 0;
    this.affectedFiles = [];
    this.dependencies = [];
    this.conflicts = [];
    this.logs = [];
    this.result = null;
  }

  start() {
    this.status = 'running';
    this.startTime = new Date().toISOString();
    this.log('Agent started');
  }

  pause() {
    if (this.status === 'running') {
      this.status = 'paused';
      this.log('Agent paused');
    }
  }

  resume() {
    if (this.status === 'paused') {
      this.status = 'running';
      this.log('Agent resumed');
    }
  }

  terminate() {
    if (this.status === 'running' || this.status === 'paused') {
      this.status = 'terminated';
      this.endTime = new Date().toISOString();
      this.log('Agent terminated');
    }
  }

  complete(result) {
    this.status = 'completed';
    this.endTime = new Date().toISOString();
    this.progress = 100;
    this.result = result;
    this.log('Agent completed');
  }

  fail(error) {
    this.status = 'failed';
    this.endTime = new Date().toISOString();
    this.result = { error };
    this.log(`Agent failed: ${error}`);
  }

  updateProgress(progress) {
    this.progress = Math.min(100, Math.max(0, progress));
  }

  addAffectedFile(filePath) {
    if (!this.affectedFiles.includes(filePath)) {
      this.affectedFiles.push(filePath);
    }
  }

  addConflict(conflict) {
    this.conflicts.push(conflict);
  }

  log(message) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      message,
    });
  }

  getDuration() {
    if (!this.startTime) return 0;
    const end = this.endTime || new Date().toISOString();
    return new Date(end) - new Date(this.startTime);
  }
}

/**
 * Multi-Agent Orchestrator
 */
class MultiAgentOrchestrator {
  constructor() {
    this.storagePath = path.join(os.homedir(), '.sweobeyme-agents');
    this.agents = new Map();
    this.agentIdCounter = 0;
    this.conflictResolver = new ConflictResolver();
    this.dashboard = new AgentDashboard(this);
  }

  /**
   * Initialize orchestrator
   */
  async initialize() {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
    } catch (error) {
      console.error('[AGENT ORCHESTRATOR] Failed to initialize:', error);
    }
  }

  /**
   * Spawn a new agent
   */
  spawnAgent(name, task, priority = 'medium', dependencies = []) {
    const id = `agent-${++this.agentIdCounter}`;
    const agent = new Agent(id, name, task, priority);
    agent.dependencies = dependencies;
    
    this.agents.set(id, agent);
    
    return agent;
  }

  /**
   * Get agent by ID
   */
  getAgent(id) {
    return this.agents.get(id);
  }

  /**
   * Get all agents
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Get running agents
   */
  getRunningAgents() {
    return this.getAllAgents().filter(a => a.status === 'running');
  }

  /**
   * Get pending agents
   */
  getPendingAgents() {
    return this.getAllAgents().filter(a => a.status === 'pending');
  }

  /**
   * Start an agent
   */
  startAgent(id) {
    const agent = this.getAgent(id);
    if (!agent) {
      throw new Error(`Agent ${id} not found`);
    }

    // Check dependencies
    const unmetDependencies = agent.dependencies.filter(depId => {
      const depAgent = this.getAgent(depId);
      return !depAgent || depAgent.status !== 'completed';
    });

    if (unmetDependencies.length > 0) {
      throw new Error(`Agent ${id} has unmet dependencies: ${unmetDependencies.join(', ')}`);
    }

    // Check for conflicts with running agents
    const conflicts = this.checkForConflicts(agent);
    if (conflicts.length > 0) {
      const resolution = this.conflictResolver.resolve(agent, conflicts);
      if (resolution.action === 'block') {
        throw new Error(`Agent ${id} blocked due to conflicts: ${conflicts.map(c => c.description).join(', ')}`);
      }
      if (resolution.action === 'queue') {
        agent.status = 'pending';
        agent.log('Queued due to conflicts');
        return agent;
      }
    }

    agent.start();
    return agent;
  }

  /**
   * Pause an agent
   */
  pauseAgent(id) {
    const agent = this.getAgent(id);
    if (!agent) {
      throw new Error(`Agent ${id} not found`);
    }
    agent.pause();
    return agent;
  }

  /**
   * Resume an agent
   */
  resumeAgent(id) {
    const agent = this.getAgent(id);
    if (!agent) {
      throw new Error(`Agent ${id} not found`);
    }
    agent.resume();
    return agent;
  }

  /**
   * Terminate an agent
   */
  terminateAgent(id) {
    const agent = this.getAgent(id);
    if (!agent) {
      throw new Error(`Agent ${id} not found`);
    }
    agent.terminate();
    return agent;
  }

  /**
   * Check for conflicts between agents
   */
  checkForConflicts(agent) {
    const conflicts = [];
    const runningAgents = this.getRunningAgents();

    for (const runningAgent of runningAgents) {
      // Check file overlap
      const overlappingFiles = agent.affectedFiles.filter(file =>
        runningAgent.affectedFiles.includes(file)
      );

      if (overlappingFiles.length > 0) {
        conflicts.push({
          type: 'file_overlap',
          agent: runningAgent,
          description: `File overlap with ${runningAgent.name}: ${overlappingFiles.join(', ')}`,
          files: overlappingFiles,
        });
      }
    }

    return conflicts;
  }

  /**
   * Execute agents in parallel
   */
  async executeParallel(agentIds) {
    const agents = agentIds.map(id => this.getAgent(id)).filter(a => a);

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    agents.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Start agents
    const promises = agents.map(agent => {
      try {
        this.startAgent(agent.id);
        return this.executeAgent(agent);
      } catch (error) {
        agent.fail(error.message);
        return Promise.resolve(agent);
      }
    });

    await Promise.all(promises);

    return agents;
  }

  /**
   * Execute a single agent (placeholder for actual execution)
   */
  async executeAgent(agent) {
    // This is a placeholder - actual execution would be implemented
    // based on the specific task type
    agent.updateProgress(50);
    agent.log('Executing task...');
    
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    agent.complete({ success: true });
  }

  /**
   * Get dashboard data
   */
  getDashboardData() {
    return this.dashboard.getData();
  }

  /**
   * Get orchestration summary
   */
  getSummary() {
    const agents = this.getAllAgents();
    const running = agents.filter(a => a.status === 'running').length;
    const pending = agents.filter(a => a.status === 'pending').length;
    const completed = agents.filter(a => a.status === 'completed').length;
    const failed = agents.filter(a => a.status === 'failed').length;
    const terminated = agents.filter(a => a.status === 'terminated').length;
    const paused = agents.filter(a => a.status === 'paused').length;

    return {
      total: agents.length,
      running,
      pending,
      completed,
      failed,
      terminated,
      paused,
      agents: agents.map(a => ({
        id: a.id,
        name: a.name,
        status: a.status,
        priority: a.priority,
        progress: a.progress,
        duration: a.getDuration(),
      })),
    };
  }

  /**
   * Clear completed agents
   */
  clearCompleted() {
    const completed = this.getAllAgents().filter(a => 
      a.status === 'completed' || a.status === 'failed' || a.status === 'terminated'
    );

    completed.forEach(agent => {
      this.agents.delete(agent.id);
    });

    return completed.length;
  }
}

/**
 * Conflict Resolver
 */
class ConflictResolver {
  constructor() {
    this.resolutionStrategies = {
      file_overlap: 'queue', // queue, block, proceed
    };
  }

  resolve(agent, conflicts) {
    const resolution = {
      action: 'queue',
      conflicts,
      message: '',
    };

    if (conflicts.length === 0) {
      resolution.action = 'proceed';
      return resolution;
    }

    // Apply resolution strategy based on conflict type
    conflicts.forEach(conflict => {
      const strategy = this.resolutionStrategies[conflict.type] || 'queue';
      resolution.action = strategy;
      resolution.message += `${conflict.description}. `;
    });

    // Priority-based override
    if (agent.priority === 'high') {
      resolution.action = 'proceed';
      resolution.message += 'Proceeding due to high priority. ';
    }

    return resolution;
  }

  setResolutionStrategy(conflictType, strategy) {
    this.resolutionStrategies[conflictType] = strategy;
  }
}

/**
 * Agent Dashboard
 */
class AgentDashboard {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
  }

  getData() {
    const agents = this.orchestrator.getAllAgents();
    const summary = this.orchestrator.getSummary();

    let output = '\n';
    output += '='.repeat(60) + '\n';
    output += 'MULTI-AGENT ORCHESTRATION DASHBOARD\n';
    output += '='.repeat(60) + '\n\n';

    output += 'Summary:\n';
    output += `  Total Agents: ${summary.total}\n`;
    output += `  Running: ${summary.running}\n`;
    output += `  Pending: ${summary.pending}\n`;
    output += `  Completed: ${summary.completed}\n`;
    output += `  Failed: ${summary.failed}\n`;
    output += `  Terminated: ${summary.terminated}\n`;
    output += `  Paused: ${summary.paused}\n\n`;

    if (agents.length > 0) {
      output += 'Agents:\n';
      agents.forEach(agent => {
        const statusIcon = this.getStatusIcon(agent.status);
        output += `  ${statusIcon} ${agent.name} (${agent.id})\n`;
        output += `    Status: ${agent.status.toUpperCase()}\n`;
        output += `    Priority: ${agent.priority}\n`;
        output += `    Progress: ${agent.progress}%\n`;
        output += `    Duration: ${Math.floor(agent.getDuration() / 1000)}s\n`;
        if (agent.affectedFiles.length > 0) {
          output += `    Files: ${agent.affectedFiles.length}\n`;
        }
        if (agent.conflicts.length > 0) {
          output += `    Conflicts: ${agent.conflicts.length}\n`;
        }
        output += '\n';
      });
    }

    output += '='.repeat(60) + '\n';

    return output;
  }

  getStatusIcon(status) {
    const icons = {
      pending: '⏳',
      running: '🔄',
      paused: '⏸️',
      completed: '✅',
      failed: '❌',
      terminated: '🛑',
    };
    return icons[status] || '❓';
  }

  getAgentDetails(id) {
    const agent = this.orchestrator.getAgent(id);
    if (!agent) {
      return 'Agent not found';
    }

    let output = '\n';
    output += '='.repeat(60) + '\n';
    output += `AGENT DETAILS: ${agent.name}\n`;
    output += '='.repeat(60) + '\n\n';

    output += `ID: ${agent.id}\n`;
    output += `Status: ${agent.status.toUpperCase()}\n`;
    output += `Priority: ${agent.priority}\n`;
    output += `Progress: ${agent.progress}%\n`;
    output += `Start Time: ${agent.startTime || 'N/A'}\n`;
    output += `End Time: ${agent.endTime || 'N/A'}\n`;
    output += `Duration: ${Math.floor(agent.getDuration() / 1000)}s\n\n`;

    output += 'Task:\n';
    output += `  ${agent.task}\n\n`;

    if (agent.affectedFiles.length > 0) {
      output += 'Affected Files:\n';
      agent.affectedFiles.forEach(file => {
        output += `  - ${file}\n`;
      });
      output += '\n';
    }

    if (agent.dependencies.length > 0) {
      output += 'Dependencies:\n';
      agent.dependencies.forEach(dep => {
        output += `  - ${dep}\n`;
      });
      output += '\n';
    }

    if (agent.conflicts.length > 0) {
      output += 'Conflicts:\n';
      agent.conflicts.forEach(conflict => {
        output += `  - ${conflict.description}\n`;
      });
      output += '\n';
    }

    if (agent.logs.length > 0) {
      output += 'Logs (last 10):\n';
      agent.logs.slice(-10).forEach(log => {
        output += `  [${log.timestamp}] ${log.message}\n`;
      });
      output += '\n';
    }

    output += '='.repeat(60) + '\n';

    return output;
  }
}

// Global orchestrator instance
let orchestrator = null;

/**
 * Get or create orchestrator instance
 */
export function getOrchestrator() {
  if (!orchestrator) {
    orchestrator = new MultiAgentOrchestrator();
    orchestrator.initialize();
  }
  return orchestrator;
}

export { MultiAgentOrchestrator, Agent, ConflictResolver, AgentDashboard };
