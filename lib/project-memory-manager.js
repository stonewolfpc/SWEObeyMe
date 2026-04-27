/**
 * ProjectMemoryManager — Per-project memory with automatic archiving.
 * Extracted from project-memory-system.js for SoC compliance.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);

const MAX_ENTRIES = 1000;
const MAX_FILE_HISTORY = 50;
const PROJECTS_DIR = path.join(os.homedir(), '.sweobeyme', 'projects');
const ARCHIVES_DIR = path.join(os.homedir(), '.sweobeyme', 'archives');

export class ProjectMemoryManager {
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
    this.editSnapshots = [];
    this.isActive = false;
    this.initialized = false;
    this.currentSessionId = null;
    this.currentModel = null;
    this.currentVersionId = null;
    this.currentTaskList = [];
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
      await this.loadEditSnapshots();
      this.currentSessionId = this.generateSessionId();
      this.initialized = true;
      this.isActive = true;
    } catch (error) {
      console.error(`[ProjectMemoryManager] Failed to initialize for project ${this.projectName}:`, error);
    }
  }

  generateSessionId() { return crypto.randomUUID(); }

  async loadLedger() {
    try {
      const data = await fs.readFile(path.join(this.memoryDir, 'ledger.json'), 'utf-8');
      this.ledger = JSON.parse(data);
      if (this.ledger.length > MAX_ENTRIES) this.ledger = this.ledger.slice(-MAX_ENTRIES);
    } catch (_e) { this.ledger = []; }
  }

  async saveLedger() {
    try { await fs.writeFile(path.join(this.memoryDir, 'ledger.json'), JSON.stringify(this.ledger, null, 2), 'utf-8'); }
    catch (e) { console.error(`[ProjectMemoryManager] Failed to save ledger for ${this.projectName}:`, e); }
  }

  async loadFileHistory() {
    try {
      const data = await fs.readFile(path.join(this.memoryDir, 'file-history.json'), 'utf-8');
      this.fileHistory = new Map(Object.entries(JSON.parse(data)));
    } catch (_e) { this.fileHistory = new Map(); }
  }

  async saveFileHistory() {
    try { await fs.writeFile(path.join(this.memoryDir, 'file-history.json'), JSON.stringify(Object.fromEntries(this.fileHistory), null, 2), 'utf-8'); }
    catch (e) { console.error(`[ProjectMemoryManager] Failed to save file history for ${this.projectName}:`, e); }
  }

  async loadDecisions() {
    try { this.decisions = JSON.parse(await fs.readFile(path.join(this.memoryDir, 'decisions.json'), 'utf-8')); }
    catch (_e) { this.decisions = []; }
  }

  async saveDecisions() {
    try { await fs.writeFile(path.join(this.memoryDir, 'decisions.json'), JSON.stringify(this.decisions, null, 2), 'utf-8'); }
    catch (e) { console.error(`[ProjectMemoryManager] Failed to save decisions for ${this.projectName}:`, e); }
  }

  async loadPatterns() {
    try { this.patterns = JSON.parse(await fs.readFile(path.join(this.memoryDir, 'patterns.json'), 'utf-8')); }
    catch (_e) { this.patterns = []; }
  }

  async savePatterns() {
    try { await fs.writeFile(path.join(this.memoryDir, 'patterns.json'), JSON.stringify(this.patterns, null, 2), 'utf-8'); }
    catch (e) { console.error(`[ProjectMemoryManager] Failed to save patterns for ${this.projectName}:`, e); }
  }

  async loadErrors() {
    try { this.errors = JSON.parse(await fs.readFile(path.join(this.memoryDir, 'errors.json'), 'utf-8')); }
    catch (_e) { this.errors = []; }
  }

  async saveErrors() {
    try { await fs.writeFile(path.join(this.memoryDir, 'errors.json'), JSON.stringify(this.errors, null, 2), 'utf-8'); }
    catch (e) { console.error(`[ProjectMemoryManager] Failed to save errors for ${this.projectName}:`, e); }
  }

  async loadArchitecture() {
    try { this.architecture = JSON.parse(await fs.readFile(path.join(this.memoryDir, 'architecture.json'), 'utf-8')); }
    catch (_e) { this.architecture = []; }
  }

  async saveArchitecture() {
    try { await fs.writeFile(path.join(this.memoryDir, 'architecture.json'), JSON.stringify(this.architecture, null, 2), 'utf-8'); }
    catch (e) { console.error(`[ProjectMemoryManager] Failed to save architecture for ${this.projectName}:`, e); }
  }

  async loadBackupLinks() {
    try { this.backupLinks = JSON.parse(await fs.readFile(path.join(this.memoryDir, 'backup-links.json'), 'utf-8')); }
    catch (_e) { this.backupLinks = []; }
  }

  async saveBackupLinks() {
    try { await fs.writeFile(path.join(this.memoryDir, 'backup-links.json'), JSON.stringify(this.backupLinks, null, 2), 'utf-8'); }
    catch (e) { console.error(`[ProjectMemoryManager] Failed to save backup links for ${this.projectName}:`, e); }
  }

  async loadContextAnnotations() {
    try { this.contextAnnotations = JSON.parse(await fs.readFile(path.join(this.memoryDir, 'context-annotations.json'), 'utf-8')); }
    catch (_e) { this.contextAnnotations = []; }
  }

  async saveContextAnnotations() {
    try { await fs.writeFile(path.join(this.memoryDir, 'context-annotations.json'), JSON.stringify(this.contextAnnotations, null, 2), 'utf-8'); }
    catch (e) { console.error(`[ProjectMemoryManager] Failed to save context annotations for ${this.projectName}:`, e); }
  }

  async loadDependencyImpacts() {
    try { this.dependencyImpacts = JSON.parse(await fs.readFile(path.join(this.memoryDir, 'dependency-impacts.json'), 'utf-8')); }
    catch (_e) { this.dependencyImpacts = []; }
  }

  async saveDependencyImpacts() {
    try { await fs.writeFile(path.join(this.memoryDir, 'dependency-impacts.json'), JSON.stringify(this.dependencyImpacts, null, 2), 'utf-8'); }
    catch (e) { console.error(`[ProjectMemoryManager] Failed to save dependency impacts for ${this.projectName}:`, e); }
  }

  async loadEditSnapshots() {
    try {
      this.editSnapshots = JSON.parse(await fs.readFile(path.join(this.memoryDir, 'edit-snapshots.json'), 'utf-8'));
      if (this.editSnapshots.length > 100) this.editSnapshots = this.editSnapshots.slice(-100);
    } catch (_e) { this.editSnapshots = []; }
  }

  async saveEditSnapshots() {
    try { await fs.writeFile(path.join(this.memoryDir, 'edit-snapshots.json'), JSON.stringify(this.editSnapshots, null, 2), 'utf-8'); }
    catch (e) { console.error(`[ProjectMemoryManager] Failed to save edit snapshots for ${this.projectName}:`, e); }
  }

  _newEntry(type, extra = {}) {
    return { id: crypto.randomUUID(), timestamp: new Date().toISOString(), sessionId: this.currentSessionId, model: this.currentModel, projectName: this.projectName, type, ...extra };
  }

  recordEvent(type, data) {
    const entry = this._newEntry(type, { data });
    this.ledger.push(entry);
    if (this.ledger.length > MAX_ENTRIES) this.ledger = this.ledger.slice(-MAX_ENTRIES);
    this.saveLedger().catch(() => {});
    return entry;
  }

  recordFileEvent(filePath, type, data) {
    const entry = this._newEntry(type, { data });
    if (!this.fileHistory.has(filePath)) this.fileHistory.set(filePath, []);
    const history = this.fileHistory.get(filePath);
    history.push(entry);
    if (history.length > MAX_FILE_HISTORY) history.shift();
    this.saveFileHistory().catch(() => {});
    return entry;
  }

  recordDecision(decision) {
    const entry = { ...this._newEntry('decision'), assumptionStatus: decision.assumptionStatus || null, validationEvidence: decision.validationEvidence || null, ...decision };
    this.decisions.push(entry);
    if (this.decisions.length > 100) this.decisions = this.decisions.slice(-100);
    this.saveDecisions().catch(() => {});
    return entry;
  }

  recordPattern(pattern) {
    const entry = { ...this._newEntry('pattern'), overrideReason: pattern.overrideReason || null, whenToUse: pattern.whenToUse || null, isNonStandard: pattern.isNonStandard || false, ...pattern };
    this.patterns.push(entry);
    if (this.patterns.length > 100) this.patterns = this.patterns.slice(-100);
    this.savePatterns().catch(() => {});
    return entry;
  }

  recordError(error) {
    const entry = { ...this._newEntry('error'), outcome: error.outcome || 'FAILURE', validationReference: error.validationReference || null, relatedAttemptId: error.relatedAttemptId || null, ...error };
    this.errors.push(entry);
    if (this.errors.length > 100) this.errors = this.errors.slice(-100);
    this.saveErrors().catch(() => {});
    return entry;
  }

  recordArchitecture(decision) {
    const entry = { ...this._newEntry('architecture'), ...decision };
    this.architecture.push(entry);
    if (this.architecture.length > 100) this.architecture = this.architecture.slice(-100);
    this.saveArchitecture().catch(() => {});
    return entry;
  }

  linkToBackup(filePath, backupId, taskContext = null) {
    const entry = { ...this._newEntry('backup_link'), filePath, backupId, taskContext };
    this.backupLinks.push(entry);
    if (this.backupLinks.length > 200) this.backupLinks = this.backupLinks.slice(-200);
    this.saveBackupLinks().catch(() => {});
    return entry;
  }

  recordContextAnnotation(filePath, annotationType, notes, relatedAttemptId = null) {
    const entry = { ...this._newEntry('context_annotation'), filePath, annotationType, notes, relatedAttemptId };
    this.contextAnnotations.push(entry);
    if (this.contextAnnotations.length > 100) this.contextAnnotations = this.contextAnnotations.slice(-100);
    this.saveContextAnnotations().catch(() => {});
    return entry;
  }

  recordDependencyImpact(sourceFile, affectedFiles, impactChain, mitigationSteps = null) {
    const entry = { ...this._newEntry('dependency_impact'), sourceFile, affectedFiles, impactChain, mitigationSteps };
    this.dependencyImpacts.push(entry);
    if (this.dependencyImpacts.length > 100) this.dependencyImpacts = this.dependencyImpacts.slice(-100);
    this.saveDependencyImpacts().catch(() => {});
    return entry;
  }

  recordEditSnapshot(filePath, editSummary, context = null) {
    const entry = { ...this._newEntry('edit_snapshot'), versionId: this.currentVersionId, taskList: this.currentTaskList, filePath, editSummary, context };
    this.editSnapshots.push(entry);
    if (this.editSnapshots.length > 100) this.editSnapshots = this.editSnapshots.slice(-100);
    this.saveEditSnapshots().catch(() => {});
    return entry;
  }

  getRecentEditSnapshots(count = 5) { return this.editSnapshots.slice(-count); }
  setTaskList(taskList) { this.currentTaskList = taskList; }
  setVersionId(versionId) { this.currentVersionId = versionId; }
  setModel(model) { this.currentModel = model; }
  getRecentFileHistory(filePath, count = 5) { return (this.fileHistory.get(filePath) || []).slice(-count); }
  getRecentLedgerEntries(count = 20) { return this.ledger.slice(-count); }

  summarizeEntry(entry) {
    switch (entry.type) {
      case 'file_edit': return `Edited ${entry.data.filePath}`;
      case 'file_read': return `Read ${entry.data.filePath}`;
      case 'tool_call': return `Called tool: ${entry.data.tool}`;
      case 'error': return `Error: ${entry.data.message}`;
      default: return entry.type;
    }
  }

  getProjectSnapshot() {
    return {
      projectName: this.projectName,
      lastSessionId: this.currentSessionId,
      lastModel: this.currentModel,
      recentEntries: this.getRecentLedgerEntries(50).map((e) => ({ type: e.type, timestamp: e.timestamp, summary: this.summarizeEntry(e) })),
      recentDecisions: this.decisions.slice(-10).map((d) => ({ description: d.description, timestamp: d.timestamp })),
      recentPatterns: this.patterns.slice(-10).map((p) => ({ pattern: p.pattern, timestamp: p.timestamp })),
      recentErrors: this.errors.slice(-10).map((e) => ({ error: e.error, timestamp: e.timestamp })),
      recentArchitecture: this.architecture.slice(-10).map((a) => ({ decision: a.decision, timestamp: a.timestamp })),
      recentEditSnapshots: this.getRecentEditSnapshots(5).map((s) => ({ versionId: s.versionId, timestamp: s.timestamp, taskList: s.taskList, filePath: s.filePath, editSummary: s.editSummary, context: s.context })),
    };
  }

  getFileEpisodicMemory(filePath) {
    return this.getRecentFileHistory(filePath, 10).map((e) => ({ type: e.type, timestamp: e.timestamp, summary: this.summarizeEntry(e) }));
  }

  detectModelChange(newModel) { return !!(this.currentModel && this.currentModel !== newModel); }

  startNewSession() {
    this.currentSessionId = this.generateSessionId();
    this.recordEvent('session_start', { previousSessionId: this.ledger[this.ledger.length - 1]?.sessionId });
  }

  async archive() {
    const archiveContent = { projectName: this.projectName, archivedAt: new Date().toISOString(), decisions: this.decisions, patterns: this.patterns, errors: this.errors, architecture: this.architecture };
    try {
      await fs.mkdir(ARCHIVES_DIR, { recursive: true });
      const archivePath = path.join(ARCHIVES_DIR, `${this.projectName}.json.gz`);
      const compressed = await gzip(JSON.stringify(archiveContent, null, 2));
      await fs.writeFile(archivePath, compressed);
      return true;
    } catch (error) {
      console.error(`[ProjectMemoryManager] Failed to archive ${this.projectName}:`, error);
      return false;
    }
  }

  async deactivate() { this.isActive = false; }
}
