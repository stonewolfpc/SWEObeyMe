/**
 * Startup Prompt Injector
 * 
 * Automatically injects orientation prompts at the start of conversations
 * This happens inside the MCP server, not through tools, not through the model
 * 
 * This ensures:
 * - Invisible to the user
 * - Automatic
 * - Deterministic
 * - Safe
 * - Consistent across models
 * - Impossible for the model to ignore
 * 
 * @module lib/startup-prompt-injector
 */

import { getShadowMemoryLedger } from './shadow-memory-ledger.js';
import { CONSTITUTION } from './enforcement.js';

class StartupPromptInjector {
  constructor() {
    this.currentSessionId = null;
    this.currentModel = null;
    this.conversationStarted = false;
    this.ledger = null;
  }

  initialize() {
    this.ledger = getShadowMemoryLedger();
    this.currentSessionId = this.ledger.currentSessionId;
    this.currentModel = this.ledger.currentModel;
  }

  detectNewConversation(modelInfo) {
    // Check if this is a new conversation
    const isNewSession = !this.currentSessionId || this.currentSessionId !== this.ledger.currentSessionId;
    const isModelChange = modelInfo && this.currentModel !== modelInfo;

    if (isNewSession || isModelChange) {
      this.currentSessionId = this.ledger.currentSessionId;
      this.currentModel = modelInfo || this.ledger.currentModel;
      this.conversationStarted = false;
      return true;
    }

    return false;
  }

  generateStartupPrompt(context = {}) {
    const { filePath, lastError } = context;
    
    let prompt = this.getToolOrientation();
    
    // Add project continuity snapshot
    const projectSnapshot = this.ledger.getProjectContinuitySnapshot();
    prompt += this.getProjectContinuitySection(projectSnapshot);
    
    // Add file-specific episodic memory if a file is open
    if (filePath) {
      const fileMemory = this.ledger.getFileEpisodicMemory(filePath);
      prompt += this.getFileEpisodicMemorySection(filePath, fileMemory);
    }
    
    // Add error context if provided
    if (lastError) {
      prompt += this.getErrorContextSection(lastError);
    }
    
    return prompt;
  }

  getToolOrientation() {
    return `=== SWEObeyMe Tool Orientation ===
You are operating inside SWEObeyMe, a surgical governance system for AI-assisted development.

MANDATORY TOOL USAGE:
- You MUST use the provided tools for all operations
- You MUST NOT guess or make assumptions
- You MUST follow the workflow defined by the tools
- You MUST obey the architectural invariants
- You MUST call read_file before editing any file
- You MUST call obey_surgical_plan before write_file
- You MUST validate code before writing

AVAILABLE TOOLS:
- read_file: Read file contents (ALWAYS use this before editing)
- write_file: Write file contents (ALWAYS use obey_surgical_plan first)
- grep: Search for patterns in files
- list_dir: List directory contents
- obey_surgical_plan: Validate surgical compliance before writing
- preflight_change: Validate significant changes before writing
- validate_code: Comprehensive code validation
- get_governance_constitution: Get architectural rules
- get_validation_status: Check compliance status
- audit: Pre-work audit and TODO management
- project_context: Project context management
- docs_lookup: Search documentation
- And many more specialized tools...

FORBIDDEN ACTIONS:
- Do NOT use console.log, debugger, eval, TODO comments
- Do NOT create files over 500 lines without asking
- Do NOT violate separation of concerns
- Do NOT ignore architectural rules
- Do NOT bypass tool validation

=== End Tool Orientation ===

`;
  }

  getProjectContinuitySection(snapshot) {
    if (!snapshot || snapshot.recentEntries.length === 0) {
      return '';
    }

    let section = `=== Project Continuity Snapshot ===
Last Session ID: ${snapshot.lastSessionId}
Last Model: ${snapshot.lastModel || 'Unknown'}

Recent Activity:
`;

    snapshot.recentEntries.slice(-5).forEach(entry => {
      section += `  [${entry.timestamp}] ${entry.summary}\n`;
    });

    section += '=== End Project Continuity ===\n\n';
    return section;
  }

  getFileEpisodicMemorySection(filePath, memory) {
    if (!memory || memory.length === 0) {
      return '';
    }

    let section = `=== File Episodic Memory: ${filePath} ===
Recent edits to this file:
`;

    memory.slice(-5).forEach(entry => {
      section += `  [${entry.timestamp}] ${entry.summary}\n`;
    });

    section += '=== End File Memory ===\n\n';
    return section;
  }

  getErrorContextSection(error) {
    return `=== Recent Error Context ===
Last Error: ${error.message || 'Unknown error'}
Suggested Action: Review recent edits to this file and use validate_code before retrying.
=== End Error Context ===\n\n`;
  }

  shouldInjectStartupPrompt() {
    // Only inject at the very start of a conversation
    return !this.conversationStarted;
  }

  markConversationStarted() {
    this.conversationStarted = true;
    this.ledger.recordEvent('conversation_started', {
      sessionId: this.currentSessionId,
      model: this.currentModel,
    });
  }

  injectStartupPromptIntoToolCall(toolName, args, context = {}) {
    // Only inject for the first tool call of a conversation
    if (!this.shouldInjectStartupPrompt()) {
      return null;
    }

    // Generate the startup prompt
    const startupPrompt = this.generateStartupPrompt(context);
    
    // Mark conversation as started
    this.markConversationStarted();
    
    // Return the prompt to be injected
    return {
      type: 'startup_prompt',
      prompt: startupPrompt,
      sessionId: this.currentSessionId,
      model: this.currentModel,
    };
  }
}

let injectorInstance = null;

export async function initializeStartupPromptInjector() {
  if (!injectorInstance) {
    injectorInstance = new StartupPromptInjector();
    injectorInstance.initialize();
  }
  return injectorInstance;
}

export function getStartupPromptInjector() {
  return injectorInstance;
}
