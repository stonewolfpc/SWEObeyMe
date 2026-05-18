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
 * Get default backup directory path (cross-platform)
 * Windows: %LOCALAPPDATA%/SWEObeyMe/.sweobeyme-backups
 * Linux/macOS: $HOME/.local/share/SWEObeyMe/.sweobeyme-backups (XDG compliant)
 * Fallback: $HOME/.sweobeyme-backups or cwd/.sweobeyme-backups
 */
export function getDefaultBackupDir() {
  // Windows: LOCALAPPDATA or USERPROFILE/AppData/Local
  if (process.platform === 'win32') {
    const localAppData =
      process.env.LOCALAPPDATA ||
      (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Local') : null);
    if (localAppData) {
      return path.join(localAppData, 'SWEObeyMe', '.sweobeyme-backups');
    }
    // Windows with no LOCALAPPDATA: fall through to cwd
  }

  // Linux/macOS: Use XDG Base Directory specification
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  if (homeDir && typeof homeDir === 'string' && homeDir.length > 0) {
    const xdgDataHome =
      process.env.XDG_DATA_HOME && process.env.XDG_DATA_HOME.length > 0
        ? process.env.XDG_DATA_HOME
        : path.join(homeDir, '.local', 'share');
    return path.join(xdgDataHome, 'SWEObeyMe', '.sweobeyme-backups');
  }

  // Universal fallback: current working directory — always writable
  return path.join(process.cwd(), '.sweobeyme-backups');
}
