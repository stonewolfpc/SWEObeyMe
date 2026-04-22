/**
 * Shadow Memory Ledger
 * 
 * Invisible, automatic, append-only memory system for SWEObeyMe
 * Never exposed to the model directly - used for startup prompt injection
 * 
 * This simulates human memory:
 * - Episodic (what happened)
 * - Semantic (why it happened)
 * - Procedural (what to do next)
 * 
 * @module lib/shadow-memory-ledger
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const MAX_ENTRIES = 1000;
const MAX_FILE_HISTORY = 50;
const MAX_SESSION_HISTORY = 100;
const MEMORY_DIR = path.join(os.homedir(), '.sweobeyme-shadow-memory');

class ShadowMemoryLedger {
  constructor() {
    this.ledger = [];
    this.fileHistory = new Map(); // filePath -> array of entries
    this.sessionHistory = [];
    this.currentSessionId = null;
    this.currentModel = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      await fs.mkdir(MEMORY_DIR, { recursive: true });
      await this.loadLedger();
      await this.loadFileHistory();
      await this.loadSessionHistory();
      this.currentSessionId = this.generateSessionId();
      this.initialized = true;
      console.log('[ShadowMemoryLedger] Initialized');
    } catch (error) {
      console.error('[ShadowMemoryLedger] Failed to initialize:', error);
    }
  }

  generateSessionId() {
    return crypto.randomUUID();
  }

  async loadLedger() {
    try {
      const ledgerPath = path.join(MEMORY_DIR, 'ledger.json');
      const data = await fs.readFile(ledgerPath, 'utf-8');
      this.ledger = JSON.parse(data);
      // Trim if too large
      if (this.ledger.length > MAX_ENTRIES) {
        this.ledger = this.ledger.slice(-MAX_ENTRIES);
      }
    } catch (error) {
      this.ledger = [];
    }
  }

  async saveLedger() {
    try {
      const ledgerPath = path.join(MEMORY_DIR, 'ledger.json');
      await fs.writeFile(ledgerPath, JSON.stringify(this.ledger, null, 2), 'utf-8');
    } catch (error) {
      console.error('[ShadowMemoryLedger] Failed to save ledger:', error);
    }
  }

  async loadFileHistory() {
    try {
      const historyPath = path.join(MEMORY_DIR, 'file-history.json');
      const data = await fs.readFile(historyPath, 'utf-8');
      const history = JSON.parse(data);
      this.fileHistory = new Map(Object.entries(history));
    } catch (error) {
      this.fileHistory = new Map();
    }
  }

  async saveFileHistory() {
    try {
      const historyPath = path.join(MEMORY_DIR, 'file-history.json');
      const historyObj = Object.fromEntries(this.fileHistory);
      await fs.writeFile(historyPath, JSON.stringify(historyObj, null, 2), 'utf-8');
    } catch (error) {
      console.error('[ShadowMemoryLedger] Failed to save file history:', error);
    }
  }

  async loadSessionHistory() {
    try {
      const historyPath = path.join(MEMORY_DIR, 'session-history.json');
      const data = await fs.readFile(historyPath, 'utf-8');
      this.sessionHistory = JSON.parse(data);
      // Trim if too large
      if (this.sessionHistory.length > MAX_SESSION_HISTORY) {
        this.sessionHistory = this.sessionHistory.slice(-MAX_SESSION_HISTORY);
      }
    } catch (error) {
      this.sessionHistory = [];
    }
  }

  async saveSessionHistory() {
    try {
      const historyPath = path.join(MEMORY_DIR, 'session-history.json');
      await fs.writeFile(historyPath, JSON.stringify(this.sessionHistory, null, 2), 'utf-8');
    } catch (error) {
      console.error('[ShadowMemoryLedger] Failed to save session history:', error);
    }
  }

  recordEvent(type, data) {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sessionId: this.currentSessionId,
      model: this.currentModel,
      type,
      data,
    };

    this.ledger.push(entry);

    // Trim if too large
    if (this.ledger.length > MAX_ENTRIES) {
      this.ledger = this.ledger.slice(-MAX_ENTRIES);
    }

    // Save asynchronously
    this.saveLedger().catch(() => {});

    return entry;
  }

  recordFileEvent(filePath, type, data) {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sessionId: this.currentSessionId,
      model: this.currentModel,
      type,
      data,
    };

    if (!this.fileHistory.has(filePath)) {
      this.fileHistory.set(filePath, []);
    }

    const history = this.fileHistory.get(filePath);
    history.push(entry);

    // Trim if too large
    if (history.length > MAX_FILE_HISTORY) {
      history.shift();
    }

    // Save asynchronously
    this.saveFileHistory().catch(() => {});

    return entry;
  }

  recordSessionEvent(type, data) {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sessionId: this.currentSessionId,
      model: this.currentModel,
      type,
      data,
    };

    this.sessionHistory.push(entry);

    // Trim if too large
    if (this.sessionHistory.length > MAX_SESSION_HISTORY) {
      this.sessionHistory = this.sessionHistory.slice(-MAX_SESSION_HISTORY);
    }

    // Save asynchronously
    this.saveSessionHistory().catch(() => {});

    return entry;
  }

  setModel(model) {
    this.currentModel = model;
  }

  getRecentFileHistory(filePath, count = 5) {
    const history = this.fileHistory.get(filePath) || [];
    return history.slice(-count);
  }

  getRecentSessionHistory(count = 10) {
    return this.sessionHistory.slice(-count);
  }

  getRecentLedgerEntries(count = 20) {
    return this.ledger.slice(-count);
  }

  getProjectContinuitySnapshot() {
    const recentEntries = this.getRecentLedgerEntries(50);
    const recentSession = this.getRecentSessionHistory(10);

    return {
      lastSessionId: this.currentSessionId,
      lastModel: this.currentModel,
      recentEntries: recentEntries.map(e => ({
        type: e.type,
        timestamp: e.timestamp,
        summary: this.summarizeEntry(e),
      })),
      recentSession: recentSession.map(e => ({
        type: e.type,
        timestamp: e.timestamp,
        summary: this.summarizeEntry(e),
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
    // Generate a concise summary of the entry
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
    this.recordSessionEvent('session_start', {
      previousSessionId: this.sessionHistory[this.sessionHistory.length - 1]?.sessionId,
    });
  }
}

let ledgerInstance = null;

export async function initializeShadowMemoryLedger() {
  if (!ledgerInstance) {
    ledgerInstance = new ShadowMemoryLedger();
    await ledgerInstance.initialize();
  }
  return ledgerInstance;
}

export function getShadowMemoryLedger() {
  return ledgerInstance;
}
