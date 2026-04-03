import path from 'path';
import { pathToFileURL } from 'url';

/**
 * MARCH 2026 COMPLIANCE: Sovereign URI Normalizer
 * Ensures Windsurf Next matches files in explorer to MCP edits
 */
export function toWindsurfUri(barePath) {
  if (!barePath) return barePath;
  // 1. Normalize slashes
  let normalized = barePath.replace(/\\/g, '/');
  // 2. Ensure it's absolute
  if (!path.isAbsolute(normalized)) {
    normalized = path.resolve(process.cwd(), normalized);
  }
  // 3. Convert to file:// URI
  return pathToFileURL(normalized).href;
}

/**
 * Legacy normalizePath function for backwards compatibility
 */
export function normalizePath(pathString) {
  return toWindsurfUri(pathString);
}

/**
 * Get default backup directory path
 */
export function getDefaultBackupDir() {
  const localAppData =
    process.env.LOCALAPPDATA ||
    (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Local') : null);
  const base = localAppData || process.cwd();
  return path.join(base, 'SWEObeyMe', '.sweobeyme-backups');
}
