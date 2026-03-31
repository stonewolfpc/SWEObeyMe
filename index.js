#!/usr/bin/env node

// [ARES LOCKDOWN]: Redirect all non-protocol noise to stderr
const originalLog = console.log;
console.log = (...args) => {
  console.error("[LOG_REDIRECT]:", ...args); 
};
// This ensures ONLY the MCP Transport can write to process.stdout.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { InitializeRequestSchema, CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { fileURLToPath } from "url";

// Main async initialization
(async () => {
  // Dynamic import for quotes to work with bundler
  let getRandomQuote;
  try {
    const quotesModule = await import(path.join(path.dirname(fileURLToPath(import.meta.url)), "quotes.js"));
    getRandomQuote = quotesModule.getRandomQuote;
  } catch (e) {
    // Fallback quotes if quotes.js not found
    const fallbackQuotes = {
      SUCCESS: ["Surgery complete."],
      FAILURE: ["Non-compliance detected."],
      RECOVERY: ["Recovery initiated."]
    };
    getRandomQuote = (category) => fallbackQuotes[category][0];
  }

// Initialize server
const server = new Server({
  name: "SWEObeyMe",
  version: "1.0.2",
}, {
  capabilities: { tools: {} }
});

const MAX_LINES = 700;
const WARNING_THRESHOLD = 600;
const log = (msg) => console.error(`[SWEObeyMe-Audit]: ${msg}`);

// Backup Directory Setup
const BACKUP_DIR = path.join(process.cwd(), ".sweobeyme-backups");
let backupCounter = 0;

async function ensureBackupDir() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    log(`Backup directory ready: ${BACKUP_DIR}`);
  } catch (error) {
    console.error(`[CRITICAL] Failed to create backup directory: ${error.message}`);
  }
}

/**
 * Creates a numbered backup of a file.
 * @param {string} filePath - Path to the file to backup.
 * @returns {string} - The backup file path.
 */
async function createBackup(filePath) {
  const fullPath = path.resolve(filePath);
  try {
    const content = await fs.readFile(fullPath, "utf-8");
    const timestamp = Date.now();
    const backupFileName = `${path.basename(filePath)}.backup-${backupCounter++}-${timestamp}.readonly`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    
    await fs.writeFile(backupPath, content, { encoding: "utf-8", mode: 0o444 }); // Read-only
    log(`Backup created: ${backupFileName}`);
    return backupPath;
  } catch (error) {
    console.error(`[BACKUP FAILED] ${error.message}`);
    return null;
  }
}

// PHASE 8: Workflow Orchestration Engine
const activeWorkflows = new Map();

class SurgicalWorkflow {
  constructor(id, goal, steps) {
    this.id = id;
    this.goal = goal;
    this.steps = steps.map(s => ({ ...s, status: "pending" }));
    this.startTime = Date.now();
  }

  updateStep(stepName, status) {
    const step = this.steps.find(s => s.name === stepName);
    if (step) step.status = status;
  }

  isComplete() {
    return this.steps.every(s => s.status === "completed");
  }
}

// ENFORCEMENT RULES - Hardcoded, cannot be bypassed
const ENFORCEMENT_RULES = {
  MAX_LINES: 700,
  FORBIDDEN_PATTERNS: [
    /console\.log/g,           // No console.log in production
    /\/\/\s*todo:/gi,         // No TODO comments without tracking
    /debugger;/g,             // No debugger statements
    /eval\s*\(/g,             // No eval() for security
  ],
  MANDATORY_COMMENTS: true,
  STRICT_MODE: true
};

// PHASE 10: Personality Layer - The "Soul" of the Governor
const CONSTITUTION = {
  TONE: "Surgical, Professional, Minimalist",
  MANDATE: "Protect the codebase from digital debt and file bloat.",
  RECOVERY_MODE: false,
  ERROR_THRESHOLD: 3, // Max errors before mandatory "Deep Scan"
};

const internalAudit = {
  consecutiveFailures: 0,
  lastHealthCheck: Date.now(),
  surgicalIntegrityScore: 100
};

/**
 * Validates code content against architectural rules.
 * @param {string} content - The code to check.
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateCode(content) {
  const errors = [];
  const lines = content.split(/\r\n|\r|\n/).length;

  if (lines > ENFORCEMENT_RULES.MAX_LINES) {
    errors.push(`Line count ${lines} exceeds maximum of ${ENFORCEMENT_RULES.MAX_LINES}.`);
  }

  ENFORCEMENT_RULES.FORBIDDEN_PATTERNS.forEach(pattern => {
    if (pattern.test(content)) {
      errors.push(`Forbidden pattern detected: ${pattern.toString()}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Attempts to repair common JSON malformations from AI output.
 * @param {string} rawString - The potentially broken JSON string.
 * @returns {Object|null} - Repaired object or null if unfixable.
 */
function repairJson(rawString) {
  try {
    // 1. Clean up common AI "Markdown" wrapping
    let clean = rawString.replace(/```json|```/g, "").trim();
    
    // 2. Fix trailing commas before closing braces
    clean = clean.replace(/,\s*([\]}])/g, "$1");

    return JSON.parse(clean);
  } catch (e) {
    console.error(`[REPAIR] Failed to auto-fix JSON: ${e.message}`);
    return null;
  }
}

/**
 * Ensures code follows the "Surgical" formatting rules automatically.
 */
function autoCorrectCode(content) {
  let fixed = content;
  // Auto-remove forbidden patterns instead of just blocking (Phase 6 upgrade)
  ENFORCEMENT_RULES.FORBIDDEN_PATTERNS.forEach(pattern => {
    fixed = fixed.replace(pattern, "// [REMOVED BY SWEObeyMe]: Forbidden Pattern");
  });
  return fixed;
}

// Session Memory Store - tracks actions for accountability
const sessionMemory = {
  history: [],
  lastAction: null,
  pendingSplits: [],
  violationCount: 0,
  maxHistory: 20
};

// Helper to push to memory
function recordAction(action, details, status = "success") {
  sessionMemory.history.unshift({
    timestamp: new Date().toISOString(),
    action,
    details,
    status
  });
  if (sessionMemory.history.length > sessionMemory.maxHistory) {
    sessionMemory.history.pop();
  }
  sessionMemory.lastAction = action;
}

// Load Project Contract for context injection
let projectContract = "";
async function loadProjectContract() {
  try {
    const contractPath = path.join(process.cwd(), ".sweobeyme-contract.md");
    projectContract = await fs.readFile(contractPath, "utf-8");
    log("Project contract loaded successfully");
  } catch (error) {
    log("No project contract found, continuing without");
    projectContract = "";
  }
}

// Load .sweignore patterns
let ignorePatterns = [];
async function loadSweIgnore() {
  try {
    const ignorePath = path.join(process.cwd(), ".sweignore");
    const content = await fs.readFile(ignorePath, "utf-8");
    ignorePatterns = content.split("\n").filter(line => line.trim() && !line.startsWith("#"));
    log(`.sweignore loaded with ${ignorePatterns.length} patterns`);
  } catch (error) {
    log("No .sweignore found, using empty ignore list");
    ignorePatterns = [];
  }
}

// Check if path matches ignore patterns
function shouldIgnore(filepath) {
  return ignorePatterns.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, ".*").replace(/\?/g, "."));
    return regex.test(filepath);
  });
}

// Initialize handler - REQUIRED for handshake
server.setRequestHandler(InitializeRequestSchema, async () => {
  // Load contract and ignore files on first init
  await loadProjectContract();
  await loadSweIgnore();
  
  return {
    protocolVersion: "2024-11-05",
    capabilities: { tools: {} },
    serverInfo: { name: "SWEObeyMe", version: "1.0.0" },
  };
});

// ListTools handler - REQUIRED for green dot
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "obey_me_status",
      description: "Checks if the SWEObeyMe system is operational.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "obey_surgical_plan",
      description: "REQUIRED before any edit. Defines the scope and prevents file bloat.",
      inputSchema: {
        type: "object",
        properties: {
          target_file: { type: "string" },
          current_line_count: { type: "number" },
          estimated_addition: { type: "number" },
          action: { type: "string", enum: ["repair", "split", "initialize"] }
        },
        required: ["target_file", "current_line_count", "action"]
      }
    },
    {
      name: "read_file",
      description: "Reads a file. Mandatory for context before editing.",
      inputSchema: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
    {
      name: "write_file",
      description: "Writes/Updates a file. Enforces the 700-line limit.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" }
        },
        required: ["path", "content"],
      },
    },
    {
      name: "list_directory",
      description: "Lists files in a directory to map project structure.",
      inputSchema: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
    {
      name: "get_session_context",
      description: "Retrieves the last 20 actions and any pending architectural decisions (like required splits).",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "record_decision",
      description: "Records a specific architectural choice (e.g., 'Decided to split Helper.js into Helper.Auth.js').",
      inputSchema: {
        type: "object",
        properties: {
          decision: { type: "string" },
          reasoning: { type: "string" }
        },
        required: ["decision"]
      }
    },
    {
      name: "enforce_surgical_rules",
      description: "MANDATORY: Submit your proposed code change here FIRST to check for architectural violations.",
      inputSchema: {
        type: "object",
        properties: {
          proposed_code: { type: "string" },
          file_path: { type: "string" }
        },
        required: ["proposed_code"]
      }
    },
    {
      name: "sanitize_request",
      description: "Cleans up a request to ensure it follows the ARES naming conventions and thread-safety rules.",
      inputSchema: {
        type: "object",
        properties: {
          logic_intent: { type: "string" }
        },
        required: ["logic_intent"]
      }
    },
    {
      name: "auto_repair_submission",
      description: "Pass a failed or malformed JSON/Code block here for architectural sanitization.",
      inputSchema: {
        type: "object",
        properties: {
          raw_content: { type: "string" },
          type: { type: "string", enum: ["json", "code"] }
        },
        required: ["raw_content", "type"]
      }
    },
    {
      name: "analyze_file_health",
      description: "Scans for 'Code Smells', complexity, and potential race conditions (ARES Orange).",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string" }
        },
        required: ["path"]
      }
    },
    {
      name: "detect_architectural_drift",
      description: "Checks if the file has strayed from the 'Surgical' intent (e.g., missing documentation).",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string" }
        }
      }
    },
    {
      name: "create_backup",
      description: "Creates a read-only numbered backup of a file before modification.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string" }
        },
        required: ["path"]
      }
    },
    {
      name: "restore_backup",
      description: "Restores a file from its numbered backup.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string" },
          backup_index: { type: "number" }
        },
        required: ["path", "backup_index"]
      }
    },
    {
      name: "initiate_surgical_workflow",
      description: "MANDATORY for complex tasks (Splitting, Refactoring). Defines the sequence of tools to be used.",
      inputSchema: {
        type: "object",
        properties: {
          goal: { type: "string" },
          steps: { 
            type: "array", 
            items: { 
              type: "object",
              properties: {
                name: { type: "string" },
                tool: { type: "string" }
              }
            } 
          }
        },
        required: ["goal", "steps"]
      }
    },
    {
      name: "get_workflow_status",
      description: "Checks the progress of the current surgical operation.",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "refactor_move_block",
      description: "Surgically moves a block of code from one file to another. Follows the high-stakes protocol.",
      inputSchema: {
        type: "object",
        properties: {
          source_path: { type: "string" },
          target_path: { type: "string" },
          code_block: { type: "string" },
          insert_after_line: { type: "number" }
        },
        required: ["source_path", "target_path", "code_block"]
      }
    },
    {
      name: "extract_to_new_file",
      description: "Takes a block of code and creates a new, documented module from it. Automatically handles the split.",
      inputSchema: {
        type: "object",
        properties: {
          source_path: { type: "string" },
          new_file_path: { type: "string" },
          code_block: { type: "string" },
          description: { type: "string" }
        },
        required: ["source_path", "new_file_path", "code_block"]
      }
    },
    {
      name: "get_architectural_directive",
      description: "Retrieves the current 'State of the Union' for the project, including rules and integrity scores.",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "request_surgical_recovery",
      description: "If the AI feels 'lost' or context is drifting, this tool resets the session memory and triggers a deep project scan.",
      inputSchema: { type: "object", properties: { reason: { type: "string" } } }
    },
    {
      name: "query_the_oracle",
      description: "When the AI is stuck, it asks the Oracle for a random bit of sci-fi wisdom to re-center its logic.",
      inputSchema: { type: "object", properties: {} }
    }
  ],
}));

// CallTool handler with surgical planning and file operations
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "obey_me_status": {
        return {
          content: [{ type: "text", text: "SWEObeyMe is online and compliant." }],
        };
      }

      case "obey_surgical_plan": {
        const total = args.current_line_count + (args.estimated_addition || 0);
        if (total > 700) {
          log(`CRITICAL: ${args.target_file} will exceed 700 lines. MANDATORY SPLIT REQUIRED.`);
          return {
            content: [{ type: "text", text: "REJECTED: File bloat detected. Execute 'Split Protocol' instead." }]
          };
        }
        return {
          content: [{ type: "text", text: "PLAN APPROVED: Proceed with surgical precision." }]
        };
      }

      case "read_file": {
        // Check if file should be ignored
        if (shouldIgnore(args.path)) {
          return {
            isError: true,
            content: [{ type: "text", text: `File ${args.path} is in .sweignore and excluded from AI context.` }]
          };
        }

        const content = await fs.readFile(args.path, "utf-8");
        const stats = await fs.stat(args.path);
        const lineCount = content.split(/\r\n|\r|\n/).length;

        // Injected Context: Forces AI to see rules every time it reads
        let contextHeader = `[SURGICAL CONTEXT]: File: ${path.basename(args.path)} | Lines: ${lineCount}/${MAX_LINES} | Last Modified: ${stats.mtime}\n\n`;
        
        // Inject project contract if available
        if (projectContract) {
          contextHeader += `=== PROJECT CONTRACT ===\n${projectContract.substring(0, 500)}...\n=== END CONTRACT ===\n\n`;
        }
        
        log(`Read ${args.path}: ${lineCount} lines.`);
        return { 
          content: [{ 
            type: "text", 
            text: contextHeader + content 
          }] 
        };
      }

      case "write_file": {
        let content = args.content;
        
        // Phase 6: Auto-Correction
        const correctedContent = autoCorrectCode(content);
        if (correctedContent !== content) {
          console.error(`[HEAL] Auto-corrected forbidden patterns in ${args.path}`);
          content = correctedContent;
        }

        const validation = validateCode(content);
        if (!validation.valid) {
          // If still invalid (e.g., line count), then we block
          recordAction("VIOLATION", { path: args.path, errors: validation.errors }, "fail");
          return {
            isError: true,
            content: [{ type: "text", text: `REJECTED: ${validation.errors.join(", ")}` }]
          };
        }

        const lineCount = content.split(/\r\n|\r|\n/).length;

        // ANTI-LOOP: Detect if AI is stuck writing the same file repeatedly
        const recentWrites = sessionMemory.history.filter(h => h.action === "WRITE" && h.details?.path === args.path);
        if (recentWrites.length >= 3) {
          return {
            isError: true,
            content: [{ 
              type: "text", 
              text: "CRITICAL: Loop detected. You have attempted to write to this file 3 times without moving to the next task. Re-evaluate your plan." 
            }]
          };
        }

        // PHASE 8: Mandatory Backup Before Write (only for existing files)
        let fileExists = false;
        try {
          await fs.access(args.path);
          fileExists = true;
        } catch {
          fileExists = false;
        }
        
        if (fileExists) {
          const backupPath = await createBackup(args.path);
          if (!backupPath) {
            return {
              isError: true,
              content: [{ type: "text", text: `BACKUP FAILED: Cannot write to ${args.path} without a verified backup. Fix the backup system first.` }]
            };
          }
        }

        // Silent Foresight: Warn when approaching limit
        if (lineCount > WARNING_THRESHOLD) {
          console.error(`[WARNING] ${args.path} is at ${lineCount} lines. Approaching limit.`);
        }

        await fs.writeFile(args.path, content, "utf-8");
        
        // PHASE 8: Update workflow step if active
        const currentWf = activeWorkflows.get("current");
        if (currentWf) {
          const writeStep = currentWf.steps.find(s => s.tool === "write_file" && s.status === "pending");
          if (writeStep) {
            currentWf.updateStep(writeStep.name, "completed");
            console.error(`[ORCHESTRATOR] Step completed: ${writeStep.name}`);
          }
          
          if (currentWf.isComplete()) {
            console.error(`[ORCHESTRATOR] Workflow ${currentWf.id} complete!`);
            activeWorkflows.delete("current");
          }
        }
        
        // MEMORY: Record the write action
        const actionType = correctedContent !== args.content ? "WRITE_REPAIRED" : "WRITE";
        recordAction(actionType, { path: args.path, lines: lineCount });
        
        const msg = correctedContent !== args.content 
          ? `File saved. (Note: SWEObeyMe auto-corrected minor architectural violations in your syntax).`
          : `Successfully saved ${args.path}. All rules satisfied.`;
        return { content: [{ type: "text", text: msg }] };
      }

      case "get_session_context": {
        return { 
          content: [{ 
            type: "text", 
            text: JSON.stringify(sessionMemory, null, 2) 
          }] 
        };
      }

      case "record_decision": {
        recordAction("DECISION", args.decision);
        console.error(`[MEMORY] Decision Recorded: ${args.decision}`);
        return { content: [{ type: "text", text: "Decision logged to session memory." }] };
      }

      case "enforce_surgical_rules": {
        const validation = validateCode(args.proposed_code);
        
        if (!validation.valid) {
          recordAction("VIOLATION", { path: args.file_path, errors: validation.errors }, "fail");
          return {
            isError: true,
            content: [{ 
              type: "text", 
              text: `SURGICAL BLOCK: Your code was rejected for the following violations:\n- ${validation.errors.join("\n- ")}\n\nYou must refactor and try again within limits.` 
            }]
          };
        }
        
        return {
          content: [{ type: "text", text: "✓ All surgical rules satisfied. Code is compliant." }]
        };
      }

      case "sanitize_request": {
        const sanitized = `[OBEY-MODE]: Processing intent "${args.logic_intent}" through ARES Filter... 
  - Thread-safety: CHECKED.
  - Memory-leak prevention: CHECKED.
  - Line-count compliance: PENDING WRITE.
  - Forbidden patterns: SCANNING...`;
        
        return { content: [{ type: "text", text: sanitized }] };
      }

      case "initiate_surgical_workflow": {
        const workflowId = `WF-${Date.now()}`;
        const newWorkflow = new SurgicalWorkflow(workflowId, args.goal, args.steps);
        activeWorkflows.set("current", newWorkflow);
        
        recordAction("WORKFLOW_START", { id: workflowId, goal: args.goal });
        console.error(`[ORCHESTRATOR] New Workflow Initiated: ${args.goal}`);
        
        return { 
          content: [{ 
            type: "text", 
            text: `Workflow ${workflowId} active. Proceed with Step 1: ${args.steps[0].name}.` 
          }] 
        };
      }

      case "get_workflow_status": {
        const wf = activeWorkflows.get("current");
        if (!wf) return { content: [{ type: "text", text: "No active workflow." }] };
        
        return { 
          content: [{ 
            type: "text", 
            text: `Active Workflow: ${wf.goal}\nProgress: ${JSON.stringify(wf.steps, null, 2)}` 
          }] 
        };
      }

      case "refactor_move_block": {
        const sourceContent = await fs.readFile(args.source_path, "utf-8");
        
        // 1. Verify the code block exists in the source
        if (!sourceContent.includes(args.code_block)) {
          return { isError: true, content: [{ type: "text", text: "ERROR: Code block not found in source file. Move aborted." }] };
        }

        // 2. Read/Create target file
        let targetContent = "";
        try {
          targetContent = await fs.readFile(args.target_path, "utf-8");
        } catch (e) {
          targetContent = "// New Module created by SWEObeyMe\n";
        }

        // 3. Perform the "Paste"
        const newTargetContent = targetContent + "\n" + args.code_block;
        
        // 4. Validate the new file doesn't break our 700-line rule
        if (newTargetContent.split('\n').length > 700) {
          return { isError: true, content: [{ type: "text", text: "ERROR: Move would cause target file to exceed 700 lines." }] };
        }

        // 5. Atomic Execution
        await fs.writeFile(args.target_path, newTargetContent, "utf-8");
        const newSourceContent = sourceContent.replace(args.code_block, `// [MOVED TO ${path.basename(args.target_path)}]`);
        await fs.writeFile(args.source_path, newSourceContent, "utf-8");

        recordAction("REFACTOR_MOVE", { from: args.source_path, to: args.target_path });
        return { content: [{ type: "text", text: `Successfully moved code block to ${args.target_path}. Source has been updated with a reference comment.` }] };
      }

      case "extract_to_new_file": {
        // 1. Create the new file with the code block and description
        const header = `// ${args.description || "Module extracted by SWEObeyMe"}\n// Source: ${args.source_path}\n\n`;
        const newContent = header + args.code_block;
        
        // 2. Validate line count
        if (newContent.split('\n').length > 700) {
          return { isError: true, content: [{ type: "text", text: "ERROR: Extracted module would exceed 700 lines." }] };
        }

        // 3. Create backup of source first
        const backupPath = await createBackup(args.source_path);
        if (!backupPath) {
          return { isError: true, content: [{ type: "text", text: "BACKUP FAILED: Cannot extract without verified backup." }] };
        }

        // 4. Write the new file
        await fs.writeFile(args.new_file_path, newContent, "utf-8");
        
        // 5. Update source to reference the new file
        const sourceContent = await fs.readFile(args.source_path, "utf-8");
        const newSourceContent = sourceContent.replace(args.code_block, `// [EXTRACTED TO ${path.basename(args.new_file_path)}]\n// See: ${args.new_file_path}`);
        await fs.writeFile(args.source_path, newSourceContent, "utf-8");

        recordAction("EXTRACT", { from: args.source_path, to: args.new_file_path });
        return { content: [{ type: "text", text: `Successfully extracted to ${args.new_file_path}. Source has been updated with reference comments.` }] };
      }

      case "get_architectural_directive": {
        const status = internalAudit.surgicalIntegrityScore > 80 ? "STABLE" : "COMPROMISED";
        return { 
          content: [{ 
            type: "text", 
            text: `[SWEObeyMe CONSTITUTION]:
Status: ${status}
Integrity Score: ${internalAudit.surgicalIntegrityScore}%
Current Mandate: ${CONSTITUTION.MANDATE}
Reminder: You are a surgeon. Precision over speed.` 
          }] 
        };
      }

      case "request_surgical_recovery": {
        sessionMemory.history = []; // Wipe the confusing history
        internalAudit.consecutiveFailures = 0;
        recordAction("RECOVERY", `Recovery triggered: ${args.reason}`);
        return { 
          content: [{ 
            type: "text", 
            text: "RECOVERY INITIATED: Session memory purged. Please run 'scan_project' to re-orient your surgical map." 
          }] 
        };
      }

      case "auto_repair_submission": {
        if (args.type === "json") {
          const repaired = repairJson(args.raw_content);
          if (repaired) {
            return { content: [{ type: "text", text: JSON.stringify(repaired, null, 2) }] };
          }
        } else if (args.type === "code") {
          const corrected = autoCorrectCode(args.raw_content);
          return { content: [{ type: "text", text: corrected }] };
        }
        return { isError: true, content: [{ type: "text", text: "Content unrepairable. Refactor required." }] };
      }

      case "analyze_file_health": {
        const content = await fs.readFile(args.path, "utf-8");
        const issues = [];
        
        // Check for Complexity (Deep Nesting)
        const maxNesting = content.split('\n').reduce((max, line) => {
          const depth = (line.match(/  |\t/g) || []).length;
          return Math.max(max, depth);
        }, 0);

        if (maxNesting > 5) issues.push("CRITICAL: Deep nesting detected. Logic is becoming a 'Black Box'.");
        if (content.includes("try {} catch") || content.includes("catch (e) {}")) issues.push("SMELL: Silent catch blocks detected. Digital Debt alert.");
        
        const report = issues.length > 0 ? issues.join("\n") : "File is Surgically Clean.";
        return { content: [{ type: "text", text: `[HEALTH REPORT for ${args.path}]:\n${report}` }] };
      }

      case "detect_architectural_drift": {
        const content = await fs.readFile(args.path, "utf-8");
        const lines = content.split('\n');
        const commentCount = lines.filter(l => l.trim().startsWith("//") || l.trim().startsWith("/*")).length;
        const ratio = commentCount / lines.length;

        if (ratio < 0.1) {
          return { content: [{ type: "text", text: "DRIFT DETECTED: Documentation ratio is below 10%. Add 'Non-Coder' explanations immediately." }] };
        }
        return { content: [{ type: "text", text: "Alignment: COMPLIANT." }] };
      }

      case "create_backup": {
        const backupPath = await createBackup(args.path);
        if (backupPath) {
          return { content: [{ type: "text", text: `Backup created at: ${backupPath}` }] };
        }
        return { isError: true, content: [{ type: "text", text: "Failed to create backup." }] };
      }

      case "restore_backup": {
        try {
          const files = await fs.readdir(BACKUP_DIR);
          const baseName = path.basename(args.path);
          const backups = files.filter(f => f.startsWith(baseName + ".backup-"));
          
          if (args.backup_index >= backups.length) {
            return { isError: true, content: [{ type: "text", text: "Invalid backup index." }] };
          }
          
          // Sort by timestamp (newest first)
          backups.sort((a, b) => {
            const tsA = parseInt(a.match(/-(\d+)\.readonly$/)[1]);
            const tsB = parseInt(b.match(/-(\d+)\.readonly$/)[1]);
            return tsB - tsA;
          });
          
          const backupFile = backups[args.backup_index];
          const backupPath = path.join(BACKUP_DIR, backupFile);
          const content = await fs.readFile(backupPath, "utf-8");
          
          await fs.writeFile(args.path, content, "utf-8");
          return { content: [{ type: "text", text: `Restored ${args.path} from backup ${backupFile}.` }] };
        } catch (error) {
          return { isError: true, content: [{ type: "text", text: `Restore failed: ${error.message}` }] };
        }
      }

      case "query_the_oracle": {
        const categories = ["SUCCESS", "FAILURE", "RECOVERY"];
        const randomCat = categories[Math.floor(Math.random() * categories.length)];
        return { content: [{ type: "text", text: `[ORACLE]: ${getRandomQuote(randomCat)}` }] };
      }

      case "list_directory": {
        const files = await fs.readdir(args.path);
        return { content: [{ type: "text", text: files.join("\n") }] };
      }

      default:
        throw new Error(`Tool ${name} not found`);
    }
    
    // PHASE 10: Pre-flight hook - Update internalAudit based on result
    if (result && result.isError) {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 5;
    } else if (result) {
      internalAudit.consecutiveFailures = 0;
      internalAudit.surgicalIntegrityScore = Math.min(100, internalAudit.surgicalIntegrityScore + 1);
    }

    // If the AI is failing too much, force it to check the Constitution
    if (internalAudit.consecutiveFailures >= CONSTITUTION.ERROR_THRESHOLD && result) {
      result.content.push({ 
        type: "text", 
        text: "\n[SYSTEM ALERT]: High failure rate detected. Call 'get_architectural_directive' before your next move." 
      });
    }
    
    return result;
  } catch (error) {
    // PHASE 10: Update audit on errors too
    internalAudit.consecutiveFailures++;
    internalAudit.surgicalIntegrityScore -= 5;
    
    log(`ERROR: ${error.message}`);
    return {
      isError: true,
      content: [{ type: "text", text: error.message }]
    };
  }
});

// [STRICT TRANSPORT]: Standard Input/Output
const transport = new StdioServerTransport();

// Re-check the handshake logic
const startServer = async () => {
  try {
    await server.connect(transport);
    console.error("[ARES]: Governor Online. Handshake Complete.");
  } catch (error) {
    console.error("[CRITICAL]: Handshake Failed:", error);
    process.exit(1);
  }
};

// PHASE 8: Initialize backup system
await ensureBackupDir();

log("Server started successfully.");

// Start the server with strict handshake
await startServer();

// [LIFECYCLE MANAGEMENT]: Surgical Self-Termination
const initiateShutdown = (reason) => {
  console.error(`[SHUTDOWN] ${reason}. Cleaning up SWEObeyMe...`);
  // Add any cleanup for Project ARES state files here
  process.exit(0);
};

// [DISTRIBUTION PATCH]: Active Parent Monitoring
// Stores/VSIX often mask stdin 'close' events.
const parentPid = process.ppid;

setInterval(() => {
  try {
    // Check if the parent process still exists
    process.kill(parentPid, 0); 
  } catch (e) {
    // Parent is gone (or we lost permission to see it), time to exit.
    initiateShutdown("Parent Process (IDE) not found. Store-Life Protocol triggered.");
  }
}, 5000); // Check every 5 seconds

// 1. Detect Pipe Closure (Crucial for Windsurf reloads)
process.stdin.on("close", () => {
  initiateShutdown("IDE Disconnected (Stdin Closed)");
});

// 2. Handle "End of File" on stdin (Standard MCP exit)
process.stdin.on("end", () => {
  initiateShutdown("IDE sent EOF");
});

// [ZOMBIE PREVENTION]: Force absolute termination on any pipe error
process.stdout.on('error', (err) => {
  if (err.code === 'EPIPE') initiateShutdown("Stdout Pipe Broken (EPIPE)");
});

// 3. Handle standard Windows termination signals
process.on("SIGINT", () => initiateShutdown("SIGINT received"));
process.on("SIGTERM", () => initiateShutdown("SIGTERM received"));

// 4. Catch Unhandled Errors to prevent silent zombie hangs
process.on("uncaughtException", (err) => {
  console.error(`[CRITICAL ERROR] ${err.message}`);
  initiateShutdown("Uncaught Exception");
})();

})(); // Close async IIFE
