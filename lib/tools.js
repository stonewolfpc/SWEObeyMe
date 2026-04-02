import fs from "fs/promises";
import path from "path";
import { toWindsurfUri, normalizePath } from "./utils.js";
import { createBackup, BACKUP_DIR } from "./backup.js";
import { validateCode, autoCorrectCode, repairJson, ENFORCEMENT_RULES, CONSTITUTION, internalAudit } from "./enforcement.js";
import { recordAction, sessionMemory } from "./session.js";
import { getProjectContract, shouldIgnore } from "./project.js";
import { activeWorkflows, SurgicalWorkflow } from "./workflow.js";

const MAX_LINES = 700;
const WARNING_THRESHOLD = 600;
const DEBUG_LOGS = process.env.SWEOBEYME_DEBUG === "1";
const log = (msg) => {
  if (!DEBUG_LOGS) return;
  process.stderr.write(`[SWEObeyMe-Audit]: ${msg}\n`);
};

// Import tool handlers and registry
import { toolHandlers, setGetRandomQuote } from "./tools/handlers.js";
import { getToolDefinitions } from "./tools/registry.js";

// Set getRandomQuote after initialization
export async function initializeQuotes() {
  try {
    const { fileURLToPath } = await import("url");
    const quotesModule = await import(path.join(path.dirname(fileURLToPath(import.meta.url)), "../quotes.js"));
    const getRandomQuote = quotesModule.getRandomQuote;
    setGetRandomQuote(getRandomQuote);
  } catch (e) {
    // Fallback quotes if quotes.js not found
    const fallbackQuotes = {
      SUCCESS: ["Surgery complete."],
      FAILURE: ["Non-compliance detected."],
      RECOVERY: ["Recovery initiated."]
    };
    setGetRandomQuote((category) => fallbackQuotes[category][0]);
  }
}

// Re-export for convenience
export { toolHandlers, getToolDefinitions };
