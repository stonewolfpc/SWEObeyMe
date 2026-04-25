/**
 * OAuth Token Manager
 * Handles OAuth token storage, PKCE flow, and token refresh
 * Supports multiple OAuth providers
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import pkceChallenge from 'pkce-challenge';

const TOKEN_STORE_PATH = path.join(os.homedir(), '.sweobeyme', 'oauth-tokens.json');

/**
 * OAuth token structure
 */
class OAuthToken {
  constructor(provider, accessToken, refreshToken, expiresAt, scopes = []) {
    this.provider = provider;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresAt = expiresAt;
    this.scopes = scopes;
    this.createdAt = Date.now();
  }

  isExpired() {
    return Date.now() >= this.expiresAt;
  }

  willExpireSoon(bufferSeconds = 300) {
    return Date.now() >= this.expiresAt - bufferSeconds * 1000;
  }
}

/**
 * OAuth Manager
 */
class OAuthManager {
  constructor() {
    this.tokens = new Map();
    this.pkceChallenges = new Map();
    this.initialized = false;
  }

  /**
   * Initialize OAuth manager
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      await this.loadTokens();
      this.initialized = true;
      console.log('[OAuth Manager] Initialized');
    } catch (error) {
      console.error('[OAuth Manager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load tokens from storage
   */
  async loadTokens() {
    try {
      const tokenDir = path.dirname(TOKEN_STORE_PATH);
      await fs.mkdir(tokenDir, { recursive: true });

      const data = await fs.readFile(TOKEN_STORE_PATH, 'utf8');
      const tokenData = JSON.parse(data);

      for (const [provider, token] of Object.entries(tokenData)) {
        this.tokens.set(
          provider,
          new OAuthToken(
            token.provider,
            token.accessToken,
            token.refreshToken,
            token.expiresAt,
            token.scopes
          )
        );
      }

      console.log(`[OAuth Manager] Loaded ${this.tokens.size} tokens`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('[OAuth Manager] No existing tokens found');
      } else {
        console.error('[OAuth Manager] Failed to load tokens:', error);
      }
    }
  }

  /**
   * Save tokens to storage
   */
  async saveTokens() {
    try {
      const tokenDir = path.dirname(TOKEN_STORE_PATH);
      await fs.mkdir(tokenDir, { recursive: true });

      const tokenData = {};
      for (const [provider, token] of this.tokens.entries()) {
        tokenData[provider] = {
          provider: token.provider,
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          expiresAt: token.expiresAt,
          scopes: token.scopes,
          createdAt: token.createdAt,
        };
      }

      await fs.writeFile(TOKEN_STORE_PATH, JSON.stringify(tokenData, null, 2), 'utf8');
      console.log(`[OAuth Manager] Saved ${this.tokens.size} tokens`);
    } catch (error) {
      console.error('[OAuth Manager] Failed to save tokens:', error);
      throw error;
    }
  }

  /**
   * Store a token
   */
  async storeToken(provider, accessToken, refreshToken, expiresIn, scopes = []) {
    const expiresAt = Date.now() + expiresIn * 1000;
    const token = new OAuthToken(provider, accessToken, refreshToken, expiresAt, scopes);
    this.tokens.set(provider, token);
    await this.saveTokens();
    console.log(`[OAuth Manager] Stored token for ${provider}`);
  }

  /**
   * Get a token
   */
  getToken(provider) {
    return this.tokens.get(provider);
  }

  /**
   * Check if token exists and is valid
   */
  hasValidToken(provider) {
    const token = this.tokens.get(provider);
    return token && !token.isExpired();
  }

  /**
   * Get access token, refresh if needed
   */
  async getAccessToken(provider, refreshTokenCallback) {
    const token = this.tokens.get(provider);

    if (!token) {
      throw new Error(`No token found for ${provider}`);
    }

    // Token is still valid
    if (!token.willExpireSoon()) {
      return token.accessToken;
    }

    // Token needs refresh
    if (token.refreshToken && refreshTokenCallback) {
      console.log(`[OAuth Manager] Refreshing token for ${provider}`);
      const newToken = await refreshTokenCallback(token.refreshToken);
      await this.storeToken(
        provider,
        newToken.access_token,
        newToken.refresh_token || token.refreshToken,
        newToken.expires_in,
        newToken.scope ? newToken.scope.split(' ') : token.scopes
      );
      return newToken.access_token;
    }

    // No refresh token or callback
    throw new Error(`Token for ${provider} is expired and cannot be refreshed`);
  }

  /**
   * Remove a token
   */
  async removeToken(provider) {
    this.tokens.delete(provider);
    await this.saveTokens();
    console.log(`[OAuth Manager] Removed token for ${provider}`);
  }

  /**
   * Clear all tokens
   */
  async clearAllTokens() {
    this.tokens.clear();
    await this.saveTokens();
    console.log('[OAuth Manager] Cleared all tokens');
  }

  /**
   * Generate PKCE challenge
   */
  async generatePKCEChallenge(state) {
    const { codeVerifier, codeChallenge } = await pkceChallenge();

    this.pkceChallenges.set(state, {
      codeVerifier,
      codeChallenge,
      createdAt: Date.now(),
    });

    return {
      codeChallenge,
      codeChallengeMethod: 'S256',
      state,
    };
  }

  /**
   * Verify PKCE challenge
   */
  verifyPKCEChallenge(state, codeVerifier) {
    const challenge = this.pkceChallenges.get(state);

    if (!challenge) {
      throw new Error('Invalid or expired PKCE challenge');
    }

    // Verify code verifier matches
    const computedChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    if (computedChallenge !== challenge.codeChallenge) {
      throw new Error('Code verifier does not match challenge');
    }

    // Clean up
    this.pkceChallenges.delete(state);

    return challenge.codeVerifier;
  }

  /**
   * Clean up expired PKCE challenges (older than 10 minutes)
   */
  cleanupExpiredChallenges() {
    const now = Date.now();
    const expirationMs = 10 * 60 * 1000; // 10 minutes

    for (const [state, challenge] of this.pkceChallenges.entries()) {
      if (now - challenge.createdAt > expirationMs) {
        this.pkceChallenges.delete(state);
      }
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const validTokens = Array.from(this.tokens.values()).filter((t) => !t.isExpired());
    const expiredTokens = Array.from(this.tokens.values()).filter((t) => t.isExpired());

    return {
      totalTokens: this.tokens.size,
      validTokens: validTokens.length,
      expiredTokens: expiredTokens.length,
      pendingChallenges: this.pkceChallenges.size,
    };
  }
}

// Global instance
let globalOAuthManager = null;

/**
 * Initialize global OAuth manager
 */
export async function initializeOAuthManager() {
  if (!globalOAuthManager) {
    globalOAuthManager = new OAuthManager();
    await globalOAuthManager.initialize();
  }
  return globalOAuthManager;
}

/**
 * Get global OAuth manager
 */
export function getOAuthManager() {
  return globalOAuthManager;
}

export { OAuthManager, OAuthToken };
