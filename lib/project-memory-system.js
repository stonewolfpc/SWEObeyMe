/**
 * Project-Aware Memory System
 * 
 * Per-project memory isolation with automatic archiving and backup integration
 * Extension-internal storage only (never in project directories)
 * 
 * @module lib/project-memory-system
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

const MAX_ENTRIES = 1000;
const MAX_FILE_HISTORY = 50;
const MAX_SESSION_HISTORY = 100;
const PROJECTS_DIR = path.join(os.homedir(), '.sweobeyme', 'projects');
const ARCHIVES_DIR = path.join(os.homedir(), '.sweobeyme', 'archives');

/**
 * Project Memory Manager
 * Manages per-project memory with automatic archiving and backup integration
 */
class ProjectMemoryManager {
  constructor(projectName) {
    this.projectName = projectName;
    this.memoryDir = path.join(PROJECTS_DIR, projectName, 'memory');
    this.ledger = [];
    this.fileHistory = new Map();
    this.decisions = [];
    this.patterns = [];
    this.errors = [];
    this.architecture = [];
    this.backupLinks = [];
    this.contextAnnotations = [];
    this.dependencyImpacts = [];
    this.isActive = false;
    this.initialized = false;
    this.currentSessionId = null;
    this.currentModel = null;
  }

  async initialize() {
    try {
      await fs.mkdir(this.memoryDir, { recursive: true });
      await this.loadLedger();
      await this.loadFileHistory();
      await this.loadDecisions();
      await this.loadPatterns();
      await this.loadErrors();
      await this.loadArchitecture();
      await this.loadBackupLinks();
      await this.loadContextAnnotations();
      await this.loadDependencyImpacts();
      this.currentSessionId = this.generateSessionId();
      this.initialized = true;
      this.isActive = true;
      console.log(`[ProjectMemoryManager] Initialized for project: ${this.projectName}`);
    } catch (error) {
      console.error(`[ProjectMemoryManager] Failed to initialize for project ${this.projectName}:`, error);
    }
  }

  generateSessionId() {
    return crypto.randomUUID();
  }

  async loadLedger() {
    try {
      const ledgerPath = path.join(this.memoryDir, 'ledger.json');
      const data = await fs.readFile(ledgerPath, 'utf-8');
      this.ledger = JSON.parse(data);
      if (this.ledger.length > MAX_ENTRIES) {
        this.ledger = this.ledger.slice(-MAX_ENTRIES);
      }
    } catch (error) {
      this.ledger = [];
    }
  }

  async saveLedger() {
    try {
      const ledgerPath = path.join(this.memoryDir, 'ledger.json');
      await fs.writeFile(ledgerPath, JSON.stringify(this.ledger, null, 2), 'utf-8');
    } catch (error) {
      console.error(`[ProjectMemoryManager] Failed to save ledger for ${this.projectName}:`, error);
    }
  }

  async loadFileHistory() {
    try {
      const historyPath = path.join(this.memoryDir, 'file-history.json');
      const data = await fs.readFile(historyPath, 'utf-8');
      const history = JSON.parse(data);
      this.fileHistory = new Map(Object.entries(history));
    } catch (error) {
      this.fileHistory = new Map();
    }
  }

  async saveFileHistory() {
    try {
      const historyPath = path.join(this.memoryDir, 'file-history.json');
      const historyObj = Object.fromEntries(this.fileHistory);
      await fs.writeFile(historyPath, JSON.stringify(historyObj, null, 2), 'utf-8');
    } catch (error) {
      console.error(`[ProjectMemoryManager] Failed to save file history for ${this.projectName}:`, error);
    }
  }

  async loadDecisions() {
    try {
      const decisionsPath = path.join(this.memoryDir, 'decisions.json');
      const data = await fs.readFile(decisionsPath, 'utf-8');
      this.decisions = JSON.parse(data);
    } catch (error) {
      this.decisions = [];
    }
  }

  async saveDecisions() {
    try {
      const decisionsPath = path.join(this.memoryDir, 'decisions.json');
      await fs.writeFile(decisionsPath, JSON.stringify(this.decisions, null, 2), 'utf-8');
    } catch (error) {
      console.error(`[ProjectMemoryManager] Failed to save decisions for ${this.projectName}:`, error);
    }
  }

  async loadPatterns() {
    try {
      const patternsPath = path.join(this.memoryDir, 'patterns.json');
      const data = await fs.readFile(patternsPath, 'utf-8');
      this.patterns = JSON.parse(data);
    } catch (error) {
      this.patterns = [];
    }
  }

  async savePatterns() {
    try {
      const patternsPath = path.join(this.memoryDir, 'patterns.json');
      await fs.writeFile(patternsPath, JSON.stringify(this.patterns, null, 2), 'utf-8');
    } catch (error) {
      console.error(`[ProjectMemoryManager] Failed to save patterns for ${this.projectName}:`, error);
    }
  }

  async loadErrors() {
    try {
      const errorsPath = path.join(this.memoryDir, 'errors.json');
      const data = await fs.readFile(errorsPath, 'utf-8');
      this.errors = JSON.parse(data);
    } catch (error) {
      this.errors = [];
    }
  }

  async saveErrors() {
    try {
      const errorsPath = path.join(this.memoryDir, 'errors.json');
      await fs.writeFile(errorsPath, JSON.stringify(this.errors, null, 2), 'utf-8');
    } catch (error) {
      console.error(`[ProjectMemoryManager] Failed to save errors for ${this.projectName}:`, error);
    }
  }

  async loadArchitecture() {
    try {
      const archPath = path.join(this.memoryDir, 'architecture.json');
      const data = await fs.readFile(archPath, 'utf-8');
      this.architecture = JSON.parse(data);
    } catch (error) {
      this.architecture = [];
    }
  }

  async saveArchitecture() {
    try {
      const archPath = path.join(this.memoryDir, 'architecture.json');
      await fs.writeFile(archPath, JSON.stringify(this.architecture, null, 2), 'utf-8');
    } catch (error) {
      console.error(`[ProjectMemoryManager] Failed to save architecture for ${this.projectName}:`, error);
    }
  }

  async loadBackupLinks() {
    try {
      const linksPath = path.join(this.memoryDir, 'backup-links.json');
      const data = await fs.readFile(linksPath, 'utf-8');
      this.backupLinks = JSON.parse(data);
    } catch (error) {
      this.backupLinks = [];
    }
  }

  async saveBackupLinks() {
    try {
      const linksPath = path.join(this.memoryDir, 'backup-links.json');
      await fs.writeFile(linksPath, JSON.stringify(this.backupLinks, null, 2), 'utf-8');
    } catch (error) {
      console.error(`[ProjectMemoryManager] Failed to save backup links for ${this.projectName}:`, error);
    }
  }

  async loadContextAnnotations() {
    try {
      const annotationsPath = path.join(this.memoryDir, 'context-annotations.json');
      const data = await fs.readFile(annotationsPath, 'utf-8');
      this.contextAnnotations = JSON.parse(data);
    } catch (error) {
      this.contextAnnotations = [];
    }
  }

  async saveContextAnnotations() {
    try {
      const annotationsPath = path.join(this.memoryDir, 'context-annotations.json');
      await fs.writeFile(annotationsPath, JSON.stringify(this.contextAnnotations, null, 2), 'utf-8');
    } catch (error) {
      console.error(`[ProjectMemoryManager] Failed to save context annotations for ${this.projectName}:`, error);
    }
  }

  async loadDependencyImpacts() {
    try {
      const impactsPath = path.join(this.memoryDir, 'dependency-impacts.json');
      const data = await fs.readFile(impactsPath, 'utf-8');
      this.dependencyImpacts = JSON.parse(data);
    } catch (error) {
      this.dependencyImpacts = [];
    }
  }

  async saveDependencyImpacts() {
    try {
      const impactsPath = path.join(this.memoryDir, 'dependency-impacts.json');
      await fs.writeFile(impactsPath, JSON.stringify(this.dependencyImpacts, null, 2), 'utf-8');
    } catch (error) {
      console.error(`[ProjectMemoryManager] Failed to save dependency impacts for ${this.projectName}:`, error);
    }
  }

  recordEvent(type, data) {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sessionId: this.currentSessionId,
      model: this.currentModel,
      projectName: this.projectName,
      type,
      data,
    };

    this.ledger.push(entry);

    if (this.ledger.length > MAX_ENTRIES) {
      this.ledger = this.ledger.slice(-MAX_ENTRIES);
    }

    this.saveLedger().catch(() => {});

    return entry;
  }

  recordFileEvent(filePath, type, data) {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sessionId: this.currentSessionId,
      model: this.currentModel,
      projectName: this.projectName,
      type,
      data,
    };

    if (!this.fileHistory.has(filePath)) {
      this.fileHistory.set(filePath, []);
    }

    const history = this.fileHistory.get(filePath);
    history.push(entry);

    if (history.length > MAX_FILE_HISTORY) {
      history.shift();
    }

    this.saveFileHistory().catch(() => {});

    return entry;
  }

  recordDecision(decision) {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sessionId: this.currentSessionId,
      projectName: this.projectName,
      assumptionStatus: decision.assumptionStatus || null,
      validationEvidence: decision.validationEvidence || null,
      ...decision,
    };

    this.decisions.push(entry);

    if (this.decisions.length > 100) {
      this.decisions = this.decisions.slice(-100);
    }

    this.saveDecisions().catch(() => {});

    return entry;
  }

  recordPattern(pattern) {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sessionId: this.currentSessionId,
      projectName: this.projectName,
      overrideReason: pattern.overrideReason || null,
      whenToUse: pattern.whenToUse || null,
      isNonStandard: pattern.isNonStandard || false,
      ...pattern,
    };

    this.patterns.push(entry);

    if (this.patterns.length > 100) {
      this.patterns = this.patterns.slice(-100);
    }

    this.savePatterns().catch(() => {});

    return entry;
  }

  recordError(error) {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sessionId: this.currentSessionId,
      projectName: this.projectName,
      outcome: error.outcome || 'FAILURE',
      validationReference: error.validationReference || null,
      relatedAttemptId: error.relatedAttemptId || null,
      ...error,
    };

    this.errors.push(entry);

    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }

    this.saveErrors().catch(() => {});

    return entry;
  }

  recordArchitecture(decision) {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sessionId: this.currentSessionId,
      projectName: this.projectName,
      ...decision,
    };

    this.architecture.push(entry);

    if (this.architecture.length > 100) {
      this.architecture = this.architecture.slice(-100);
    }

    this.saveArchitecture().catch(() => {});

    return entry;
  }

  linkToBackup(filePath, backupId, taskContext = null) {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sessionId: this.currentSessionId,
      projectName: this.projectName,
      filePath,
      backupId,
      taskContext, // Include task context if available
    };

    this.backupLinks.push(entry);

    if (this.backupLinks.length > 200) {
      this.backupLinks = this.backupLinks.slice(-200);
    }

    this.saveBackupLinks().catch(() => {});

    return entry;
  }

  recordContextAnnotation(filePath, annotationType, notes, relatedAttemptId = null) {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sessionId: this.currentSessionId,
      projectName: this.projectName,
      filePath,
      annotationType, // NON-STANDARD/REQUIRES_SPECIAL_HANDLING/EXPERIMENTAL/STABLE
      notes,
      relatedAttemptId,
    };

    this.contextAnnotations.push(entry);

    if (this.contextAnnotations.length > 100) {
      this.contextAnnotations = this.contextAnnotations.slice(-100);
    }

    this.saveContextAnnotations().catch(() => {});

    return entry;
  }

  recordDependencyImpact(sourceFile, affectedFiles, impactChain, mitigationSteps = null) {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sessionId: this.currentSessionId,
      projectName: this.projectName,
      sourceFile,
      affectedFiles,
      impactChain,
      mitigationSteps,
    };

    this.dependencyImpacts.push(entry);

    if (this.dependencyImpacts.length > 100) {
      this.dependencyImpacts = this.dependencyImpacts.slice(-100);
    }

    this.saveDependencyImpacts().catch(() => {});

    return entry;
  }

  setModel(model) {
    this.currentModel = model;
  }

  getRecentFileHistory(filePath, count = 5) {
    const history = this.fileHistory.get(filePath) || [];
    return history.slice(-count);
  }

  getRecentLedgerEntries(count = 20) {
    return this.ledger.slice(-count);
  }

  getProjectSnapshot() {
    const recentEntries = this.getRecentLedgerEntries(50);
    const recentDecisions = this.decisions.slice(-10);
    const recentPatterns = this.patterns.slice(-10);
    const recentErrors = this.errors.slice(-10);
    const recentArchitecture = this.architecture.slice(-10);

    return {
      projectName: this.projectName,
      lastSessionId: this.currentSessionId,
      lastModel: this.currentModel,
      recentEntries: recentEntries.map(e => ({
        type: e.type,
        timestamp: e.timestamp,
        summary: this.summarizeEntry(e),
      })),
      recentDecisions: recentDecisions.map(d => ({
        description: d.description,
        timestamp: d.timestamp,
      })),
      recentPatterns: recentPatterns.map(p => ({
        pattern: p.pattern,
        timestamp: p.timestamp,
      })),
      recentErrors: recentErrors.map(e => ({
        error: e.error,
        timestamp: e.timestamp,
      })),
      recentArchitecture: recentArchitecture.map(a => ({
        decision: a.decision,
        timestamp: a.timestamp,
      })),
    };
  }

  getFileEpisodicMemory(filePath) {
    const history = this.getRecentFileHistory(filePath, 10);
    return history.map(e => ({
      type: e.type,
      timestamp: e.timestamp,
      summary: this.summarizeEntry(e),
    }));
  }

  summarizeEntry(entry) {
    switch (entry.type) {
      case 'file_edit':
        return `Edited ${entry.data.filePath}`;
      case 'file_read':
        return `Read ${entry.data.filePath}`;
      case 'tool_call':
        return `Called tool: ${entry.data.tool}`;
      case 'error':
        return `Error: ${entry.data.message}`;
      default:
        return entry.type;
    }
  }

  detectModelChange(newModel) {
    if (this.currentModel && this.currentModel !== newModel) {
      return true;
    }
    return false;
  }

  startNewSession() {
    this.currentSessionId = this.generateSessionId();
    this.recordEvent('session_start', {
      previousSessionId: this.ledger[this.ledger.length - 1]?.sessionId,
    });
  }

  async archive() {
    const archiveContent = {
      projectName: this.projectName,
      archivedAt: new Date().toISOString(),
      decisions: this.decisions,
      patterns: this.patterns,
      errors: this.errors,
      architecture: this.architecture,
    };

    try {
      await fs.mkdir(ARCHIVES_DIR, { recursive: true });
      const archivePath = path.join(ARCHIVES_DIR, `${this.projectName}.json.gz`);
      const compressed = await gzip(JSON.stringify(archiveContent, null, 2));
      await fs.writeFile(archivePath, compressed);
      console.log(`[ProjectMemoryManager] Archived project: ${this.projectName}`);
      return true;
    } catch (error) {
      console.error(`[ProjectMemoryManager] Failed to archive ${this.projectName}:`, error);
      return false;
    }
  }

  async deactivate() {
    this.isActive = false;
    console.log(`[ProjectMemoryManager] Deactivated for project: ${this.projectName}`);
  }
}

let activeManagers = new Map();

export async function getProjectMemoryManager(projectName) {
  if (!activeManagers.has(projectName)) {
    const manager = new ProjectMemoryManager(projectName);
    await manager.initialize();
    activeManagers.set(projectName, manager);
  }
  return activeManagers.get(projectName);
}

export function hasActiveManager(projectName) {
  return activeManagers.has(projectName);
}

export async function deactivateProjectMemory(projectName) {
  const manager = activeManagers.get(projectName);
  if (manager) {
    await manager.deactivate();
    activeManagers.delete(projectName);
  }
}

export async function archiveProjectMemory(projectName) {
  const manager = activeManagers.get(projectName);
  if (manager) {
    const success = await manager.archive();
    if (success) {
      await deactivateProjectMemory(projectName);
    }
    return success;
  }
  return false;
}

export async function initializeProjectMemorySystem() {
  try {
    await fs.mkdir(PROJECTS_DIR, { recursive: true });
    await fs.mkdir(ARCHIVES_DIR, { recursive: true });
    console.log('[ProjectMemorySystem] Initialized');
  } catch (error) {
    console.error('[ProjectMemorySystem] Failed to initialize:', error);
  }
}
