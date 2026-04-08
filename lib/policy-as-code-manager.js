import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

class PolicyAsCodeManager {
  constructor() {
    // Configuration disabled in public build
    this.enabled = false;
    this.systemRulesEnabled = false;
    this.systemWorkflowsEnabled = false;
    this.systemSkillsEnabled = false;
    
    this.systemRules = new Map();
    this.systemWorkflows = new Map();
    this.systemSkills = new Map();
    
    this.policies = new Map();
    
    this.initialize();
  }

  async initialize() {
    if (!this.enabled) {
      return;
    }
    
    await this.loadSystemRules();
    await this.loadSystemWorkflows();
    await this.loadSystemSkills();
    await this.loadPolicies();
  }

  getSystemDirectory(type) {
    let directory = '';
    
    if (type === 'rules') {
      directory = '';
    } else if (type === 'workflows') {
      directory = '';
    } else if (type === 'skills') {
      directory = '';
    }
    
    if (!directory) {
      // Use OS-specific default directories following Windsurf pattern
      const platform = os.platform();
      if (platform === 'darwin') {
        directory = `/Library/Application Support/Windsurf/${type}`;
      } else if (platform === 'linux' || platform === 'win32') {
        if (platform === 'win32') {
          directory = `C:/ProgramData/Windsurf/${type}`;
        } else {
          directory = `/etc/windsurf/${type}`;
        }
      }
    }
    
    return directory;
  }

  async loadSystemRules() {
    if (!this.systemRulesEnabled) {
      return;
    }
    
    const directory = this.getSystemDirectory('rules');
    
    try {
      if (fs.existsSync(directory)) {
        const files = fs.readdirSync(directory);
        
        for (const file of files) {
          if (file.endsWith('.md')) {
            const filePath = path.join(directory, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const name = path.basename(file, '.md');
            
            this.systemRules.set(name, {
              name,
              content,
              source: 'system',
              path: filePath,
            });
          }
        }
      }
    } catch (error) {
      console.error('[PolicyAsCode] Failed to load system rules:', error);
    }
  }

  async loadSystemWorkflows() {
    if (!this.systemWorkflowsEnabled) {
      return;
    }
    
    const directory = this.getSystemDirectory('workflows');
    
    try {
      if (fs.existsSync(directory)) {
        const files = fs.readdirSync(directory);
        
        for (const file of files) {
          if (file.endsWith('.md')) {
            const filePath = path.join(directory, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const name = path.basename(file, '.md');
            
            this.systemWorkflows.set(name, {
              name,
              content,
              source: 'system',
              path: filePath,
            });
          }
        }
      }
    } catch (error) {
      console.error('[PolicyAsCode] Failed to load system workflows:', error);
    }
  }

  async loadSystemSkills() {
    if (!this.systemSkillsEnabled) {
      return;
    }
    
    const directory = this.getSystemDirectory('skills');
    
    try {
      if (fs.existsSync(directory)) {
        const files = fs.readdirSync(directory);
        
        for (const file of files) {
          if (file.endsWith('.md')) {
            const filePath = path.join(directory, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const name = path.basename(file, '.md');
            
            this.systemSkills.set(name, {
              name,
              content,
              source: 'system',
              path: filePath,
            });
          }
        }
      }
    } catch (error) {
      console.error('[PolicyAsCode] Failed to load system skills:', error);
    }
  }

  async loadPolicies() {
    const policyDir = path.join(os.homedir(), '.sweobeyme', 'policies');
    
    try {
      if (fs.existsSync(policyDir)) {
        const files = fs.readdirSync(policyDir);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(policyDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const policy = JSON.parse(content);
            
            this.policies.set(policy.id, policy);
          }
        }
      }
    } catch (error) {
      console.error('[PolicyAsCode] Failed to load policies:', error);
    }
  }

  getSystemRule(name) {
    return this.systemRules.get(name);
  }

  getAllSystemRules() {
    return Array.from(this.systemRules.values());
  }

  getSystemWorkflow(name) {
    return this.systemWorkflows.get(name);
  }

  getAllSystemWorkflows() {
    return Array.from(this.systemWorkflows.values());
  }

  getSystemSkill(name) {
    return this.systemSkills.get(name);
  }

  getAllSystemSkills() {
    return Array.from(this.systemSkills.values());
  }

  getPolicy(id) {
    return this.policies.get(id);
  }

  getAllPolicies() {
    return Array.from(this.policies.values());
  }

  createPolicy(policy) {
    if (!policy.id) {
      policy.id = `policy-${Date.now()}`;
    }
    
    policy.createdAt = new Date().toISOString();
    policy.updatedAt = new Date().toISOString();
    
    this.policies.set(policy.id, policy);
    
    // Save to disk
    const policyDir = path.join(os.homedir(), '.sweobeyme', 'policies');
    if (!fs.existsSync(policyDir)) {
      fs.mkdirSync(policyDir, { recursive: true });
    }
    
    const filePath = path.join(policyDir, `${policy.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(policy, null, 2));
    
    return policy.id;
  }

  updatePolicy(id, updates) {
    const policy = this.policies.get(id);
    if (!policy) {
      throw new Error(`Policy ${id} not found`);
    }
    
    const updated = { ...policy, ...updates, updatedAt: new Date().toISOString() };
    this.policies.set(id, updated);
    
    // Save to disk
    const policyDir = path.join(os.homedir(), '.sweobeyme', 'policies');
    const filePath = path.join(policyDir, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
  }

  deletePolicy(id) {
    this.policies.delete(id);
    
    // Remove from disk
    const policyDir = path.join(os.homedir(), '.sweobeyme', 'policies');
    const filePath = path.join(policyDir, `${id}.json`);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  evaluatePolicy(policyId, context) {
    const policy = this.policies.get(policyId);
    if (!policy) {
      return { allowed: true, reason: 'Policy not found' };
    }
    
    if (!policy.enabled) {
      return { allowed: true, reason: 'Policy disabled' };
    }
    
    // Evaluate policy conditions
    for (const condition of policy.conditions || []) {
      const result = this.evaluateCondition(condition, context);
      if (!result) {
        return { allowed: false, reason: policy.description || 'Policy condition not met' };
      }
    }
    
    return { allowed: true, reason: 'Policy passed' };
  }

  evaluateCondition(condition, context) {
    switch (condition.operator) {
      case 'equals':
        return context[condition.field] === condition.value;
      case 'not_equals':
        return context[condition.field] !== condition.value;
      case 'contains':
        return Array.isArray(context[condition.field]) && 
               context[condition.field].includes(condition.value);
      case 'not_contains':
        return Array.isArray(context[condition.field]) && 
               !context[condition.field].includes(condition.value);
      case 'greater_than':
        return context[condition.field] > condition.value;
      case 'less_than':
        return context[condition.field] < condition.value;
      case 'regex':
        return new RegExp(condition.value).test(context[condition.field]);
      default:
        return true;
    }
  }

  // Predefined policy templates
  createSurgicalPolicy() {
    return {
      id: 'surgical-enforcement',
      name: 'Surgical Enforcement Policy',
      description: 'Enforces surgical rules for code quality',
      enabled: true,
      conditions: [
        {
          field: 'fileExtension',
          operator: 'equals',
          value: '.js'
        }
      ],
      actions: [
        {
          type: 'enforce_max_lines',
          parameters: { maxLines: 700 }
        },
        {
          type: 'require_documentation',
          parameters: { minRatio: 0.1 }
        }
      ]
    };
  }

  createSecurityPolicy() {
    return {
      id: 'security-policy',
      name: 'Security Policy',
      description: 'Enforces security best practices',
      enabled: true,
      conditions: [
        {
          field: 'operation',
          operator: 'contains',
          value: 'network'
        }
      ],
      actions: [
        {
          type: 'require_permission',
          parameters: { permission: 'network_access' }
        },
        {
          type: 'log_audit',
          parameters: { level: 'info' }
        }
      ]
    };
  }

  createCompliancePolicy(standard) {
    return {
      id: `compliance-${standard.toLowerCase()}`,
      name: `${standard} Compliance Policy`,
      description: `Enforces ${standard} compliance requirements`,
      enabled: true,
      standard,
      conditions: [],
      actions: [
        {
          type: 'log_audit',
          parameters: { level: 'info' }
        },
        {
          type: 'require_encryption',
          parameters: { enabled: true }
        }
      ]
    };
  }

  exportPolicies() {
    const policies = {};
    for (const [id, policy] of this.policies.entries()) {
      policies[id] = policy;
    }
    return policies;
  }

  importPolicies(policies) {
    for (const [id, policy] of Object.entries(policies)) {
      this.policies.set(id, policy);
      
      // Save to disk
      const policyDir = path.join(os.homedir(), '.sweobeyme', 'policies');
      if (!fs.existsSync(policyDir)) {
        fs.mkdirSync(policyDir, { recursive: true });
      }
      
      const filePath = path.join(policyDir, `${id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(policy, null, 2));
    }
  }
}

export { PolicyAsCodeManager };
