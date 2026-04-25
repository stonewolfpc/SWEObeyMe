import fs from 'fs/promises';
import path from 'path';

const DEBUG_LOGS = process.env.SWEOBEYME_DEBUG === '1';
const log = (msg) => {
  if (!DEBUG_LOGS) return;
  process.stderr.write(`[SWEObeyMe-Audit]: ${msg}\n`);
};

// Load Project Contract for context injection
let projectContract = '';

/**
 * Load Project Contract for context injection
 */
export async function loadProjectContract() {
  try {
    const contractPath = path.join(process.cwd(), '.sweobeyme-contract.md');
    projectContract = await fs.readFile(contractPath, 'utf-8');
    log('Project contract loaded successfully');
  } catch (error) {
    log('No project contract found, continuing without');
    projectContract = '';
  }
}

/**
 * Get the loaded project contract
 */
export function getProjectContract() {
  return projectContract;
}

// Load .sweignore patterns
let ignorePatterns = [];

/**
 * Load .sweignore patterns
 */
export async function loadSweIgnore() {
  try {
    const ignorePath = path.join(process.cwd(), '.sweignore');
    const content = await fs.readFile(ignorePath, 'utf-8');
    ignorePatterns = content.split('\n').filter((line) => line.trim() && !line.startsWith('#'));
    log(`.sweignore loaded with ${ignorePatterns.length} patterns`);
  } catch (error) {
    log('No .sweignore found, using empty ignore list');
    ignorePatterns = [];
  }
}

/**
 * Check if path matches ignore patterns
 */
export function shouldIgnore(filepath) {
  return ignorePatterns.some((pattern) => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
    return regex.test(filepath);
  });
}
