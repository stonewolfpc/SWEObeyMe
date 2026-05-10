/**
 * Cross-platform backup directory test
 * Validates getDefaultBackupDir() returns correct paths for each platform
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDefaultBackupDir } from '../lib/utils.js';
import * as path from 'path';

describe('getDefaultBackupDir - Cross-Platform', () => {
  const originalEnv = { ...process.env };
  const originalPlatform = process.platform;

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      configurable: true,
    });
  });

  describe('Windows', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true,
      });
    });

    it('should use LOCALAPPDATA when available', () => {
      process.env.LOCALAPPDATA = 'C:\\Users\\Test\\AppData\\Local';
      const result = getDefaultBackupDir();
      expect(result).toContain('SWEObeyMe');
      expect(result).toContain('.sweobeyme-backups');
      expect(result).toContain('AppData\\Local');
    });

    it('should fallback to USERPROFILE/AppData/Local when LOCALAPPDATA missing', () => {
      delete process.env.LOCALAPPDATA;
      process.env.USERPROFILE = 'C:\\Users\\Test';
      const result = getDefaultBackupDir();
      expect(result).toContain('SWEObeyMe');
      expect(result).toContain('.sweobeyme-backups');
      expect(result).toContain('AppData\\Local');
    });

    it('should fallback to cwd when neither available', () => {
      delete process.env.LOCALAPPDATA;
      delete process.env.USERPROFILE;
      const result = getDefaultBackupDir();
      expect(result).toContain('.sweobeyme-backups');
    });
  });

  describe('Linux', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true,
      });
    });

    it('should use XDG_DATA_HOME when set', () => {
      process.env.HOME = '/home/test';
      process.env.XDG_DATA_HOME = '/home/test/.local/share';
      const result = getDefaultBackupDir();
      expect(result).toContain('SWEObeyMe');
      expect(result).toContain('.sweobeyme-backups');
      // Check for path components regardless of separator
      const normalized = result.replace(/\\/g, '/');
      expect(normalized).toContain('.local/share');
    });

    it('should use default XDG path when XDG_DATA_HOME not set', () => {
      process.env.HOME = '/home/test';
      delete process.env.XDG_DATA_HOME;
      const result = getDefaultBackupDir();
      expect(result).toContain('SWEObeyMe');
      expect(result).toContain('.sweobeyme-backups');
      // Check for path components regardless of separator
      const normalized = result.replace(/\\/g, '/');
      expect(normalized).toContain('.local/share');
    });

    it('should fallback to HOME when available', () => {
      process.env.HOME = '/home/test';
      const result = getDefaultBackupDir();
      expect(result).toContain('SWEObeyMe');
      expect(result).toContain('.sweobeyme-backups');
      // Should be under .local/share (XDG compliant) or HOME
      const normalized = result.replace(/\\/g, '/');
      expect(normalized).toMatch(/home\/test/);
    });

    it('should fallback to cwd when HOME not available', () => {
      delete process.env.HOME;
      delete process.env.USERPROFILE;
      const result = getDefaultBackupDir();
      expect(result).toContain('.sweobeyme-backups');
    });

    it('should NOT create absolute path at root /SWEObeyMe', () => {
      process.env.HOME = '/home/test';
      const result = getDefaultBackupDir();
      const normalized = result.replace(/\\/g, '/');
      expect(normalized).not.toBe('/SWEObeyMe/.sweobeyme-backups');
      expect(normalized).not.toBe('/SWEObeyMe/.sweobeyme-snapshots');
    });
  });

  describe('macOS', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true,
      });
    });

    it('should use XDG_DATA_HOME when set', () => {
      process.env.HOME = '/Users/test';
      process.env.XDG_DATA_HOME = '/Users/test/.local/share';
      const result = getDefaultBackupDir();
      expect(result).toContain('SWEObeyMe');
      expect(result).toContain('.sweobeyme-backups');
      // Check for path components regardless of separator
      const normalized = result.replace(/\\/g, '/');
      expect(normalized).toContain('.local/share');
    });

    it('should use default XDG path when XDG_DATA_HOME not set', () => {
      process.env.HOME = '/Users/test';
      delete process.env.XDG_DATA_HOME;
      const result = getDefaultBackupDir();
      expect(result).toContain('SWEObeyMe');
      expect(result).toContain('.sweobeyme-backups');
      // Check for path components regardless of separator
      const normalized = result.replace(/\\/g, '/');
      expect(normalized).toContain('.local/share');
    });

    it('should NOT create absolute path at root /SWEObeyMe', () => {
      process.env.HOME = '/Users/test';
      const result = getDefaultBackupDir();
      const normalized = result.replace(/\\/g, '/');
      expect(normalized).not.toBe('/SWEObeyMe/.sweobeyme-backups');
      expect(normalized).not.toBe('/SWEObeyMe/.sweobeyme-snapshots');
    });
  });

  describe('Path Safety', () => {
    it('should never return an absolute path at filesystem root', () => {
      // Test all platforms
      ['win32', 'linux', 'darwin'].forEach((platform) => {
        Object.defineProperty(process, 'platform', {
          value: platform,
          configurable: true,
        });

        // Clear all env vars to force fallback
        delete process.env.LOCALAPPDATA;
        delete process.env.USERPROFILE;
        delete process.env.HOME;
        delete process.env.XDG_DATA_HOME;

        const result = getDefaultBackupDir();

        // On Unix-like systems, should not be /SWEObeyMe
        if (platform !== 'win32') {
          expect(result).not.toBe('/SWEObeyme/.sweobeyme-backups');
        }

        // Should always contain the backup directory name
        expect(result).toContain('.sweobeyme-backups');
      });
    });
  });
});
