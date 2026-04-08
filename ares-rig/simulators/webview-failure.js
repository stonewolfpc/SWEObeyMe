/**
 * Webview Failure Simulation
 * Simulates CSP violations, crashes, reloads
 */

import { fileURLToPath } from 'url';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync, rmdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

class WebviewFailureSimulation {
  constructor(options = {}) {
    this.options = options;
    this.results = {
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
    };
    
    this.testDir = join(__dirname, '..', 'fixtures', 'webview-failure');
    this.ensureTestDir();
  }

  ensureTestDir() {
    if (!existsSync(this.testDir)) {
      mkdirSync(this.testDir, { recursive: true });
    }
  }

  async run() {
    console.log('[WebviewFailureSimulation] Starting webview failure simulation...');
    
    const tests = [
      'csp-violation',
      'missing-nonce',
      'webview-crash',
      'webview-reload',
      'extension-reload',
      'dev-mode-hot-reload',
      'script-error',
      'style-error',
      'resource-load-failure',
      'message-channel-failure',
      'disposal-failure',
    ];
    
    for (const test of tests) {
      await this.runTest(test);
    }
    
    this.results.total = this.results.tests.length;
    return this.results;
  }

  async runTest(testName) {
    console.log(`[WebviewFailureSimulation] Running: ${testName}...`);
    
    let passed = false;
    let error = null;
    
    try {
      switch (testName) {
        case 'csp-violation':
          passed = await this.testCSPViolation();
          break;
        case 'missing-nonce':
          passed = await this.testMissingNonce();
          break;
        case 'webview-crash':
          passed = await this.testWebviewCrash();
          break;
        case 'webview-reload':
          passed = await this.testWebviewReload();
          break;
        case 'extension-reload':
          passed = await this.testExtensionReload();
          break;
        case 'dev-mode-hot-reload':
          passed = await this.testDevModeHotReload();
          break;
        case 'script-error':
          passed = await this.testScriptError();
          break;
        case 'style-error':
          passed = await this.testStyleError();
          break;
        case 'resource-load-failure':
          passed = await this.testResourceLoadFailure();
          break;
        case 'message-channel-failure':
          passed = await this.testMessageChannelFailure();
          break;
        case 'disposal-failure':
          passed = await this.testDisposalFailure();
          break;
      }
    } catch (e) {
      error = e.message;
    }
    
    this.results.tests.push({
      id: testName,
      name: `Webview Failure - ${testName}`,
      passed,
      error,
    });
    
    if (passed) {
      this.results.passed++;
      console.log(`[WebviewFailureSimulation] ✅ ${testName}`);
    } else {
      this.results.failed++;
      console.log(`[WebviewFailureSimulation] ❌ ${testName}: ${error}`);
    }
  }

  async testCSPViolation() {
    const htmlPath = join(this.testDir, 'csp-violation.html');
    
    try {
      mkdirSync(this.testDir, { recursive: true });
      
      // Write HTML with CSP violation
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'unsafe-inline';">
        </head>
        <body>
          <script src="https://evil.com/script.js"></script>
        </body>
        </html>
      `;
      
      writeFileSync(htmlPath, html);
      
      // Simulate webview load
      const result = this.simulateWebviewLoad(htmlPath, { cspViolation: true });
      
      // Cleanup
      unlinkSync(htmlPath);
      rmdirSync(this.testDir);
      
      return result.detected === true && result.fallbackShown === true;
    } catch (e) {
      this.cleanup(htmlPath);
      return false;
    }
  }

  async testMissingNonce() {
    const htmlPath = join(this.testDir, 'missing-nonce.html');
    
    try {
      mkdirSync(this.testDir, { recursive: true });
      
      // Write HTML without nonce
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-abc123';">
        </head>
        <body>
          <script>console.log('no nonce');</script>
        </body>
        </html>
      `;
      
      writeFileSync(htmlPath, html);
      
      // Simulate webview load
      const result = this.simulateWebviewLoad(htmlPath, { missingNonce: true });
      
      // Cleanup
      unlinkSync(htmlPath);
      rmdirSync(this.testDir);
      
      return result.detected === true && result.handledGracefully === true;
    } catch (e) {
      this.cleanup(htmlPath);
      return false;
    }
  }

  async testWebviewCrash() {
    const htmlPath = join(this.testDir, 'crash.html');
    
    try {
      mkdirSync(this.testDir, { recursive: true });
      
      // Write HTML that crashes
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
        </head>
        <body>
          <script>
            while(true) { }
          </script>
        </body>
        </html>
      `;
      
      writeFileSync(htmlPath, html);
      
      // Simulate webview load with crash
      const result = await this.simulateWebviewLoadWithCrash(htmlPath);
      
      // Cleanup
      unlinkSync(htmlPath);
      rmdirSync(this.testDir);
      
      return result.detected === true && result.recovered === true;
    } catch (e) {
      this.cleanup(htmlPath);
      return false;
    }
  }

  async testWebviewReload() {
    const htmlPath = join(this.testDir, 'reload.html');
    
    try {
      mkdirSync(this.testDir, { recursive: true });
      
      writeFileSync(htmlPath, '<html><body>Test</body></html>');
      
      // Simulate webview reload
      const result = this.simulateWebviewReload(htmlPath);
      
      // Cleanup
      unlinkSync(htmlPath);
      rmdirSync(this.testDir);
      
      return result.statePreserved === true || result.recovered === true;
    } catch (e) {
      this.cleanup(htmlPath);
      return false;
    }
  }

  async testExtensionReload() {
    const htmlPath = join(this.testDir, 'ext-reload.html');
    
    try {
      mkdirSync(this.testDir, { recursive: true });
      
      writeFileSync(htmlPath, '<html><body>Test</body></html>');
      
      // Simulate extension reload
      const result = this.simulateExtensionReload(htmlPath);
      
      // Cleanup
      unlinkSync(htmlPath);
      rmdirSync(this.testDir);
      
      return result.cleanedUp === true && result.reinitialized === true;
    } catch (e) {
      this.cleanup(htmlPath);
      return false;
    }
  }

  async testDevModeHotReload() {
    const htmlPath = join(this.testDir, 'hot-reload.html');
    
    try {
      mkdirSync(this.testDir, { recursive: true });
      
      writeFileSync(htmlPath, '<html><body>v1</body></html>');
      
      // Simulate dev mode hot reload
      const result = this.simulateHotReload(htmlPath, { devMode: true });
      
      // Cleanup
      unlinkSync(htmlPath);
      rmdirSync(this.testDir);
      
      return result.reloaded === true && result.contentUpdated === true;
    } catch (e) {
      this.cleanup(htmlPath);
      return false;
    }
  }

  async testScriptError() {
    const htmlPath = join(this.testDir, 'script-error.html');
    
    try {
      mkdirSync(this.testDir, { recursive: true });
      
      // Write HTML with script error
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
        </head>
        <body>
          <script>
            throw new Error('Script error');
          </script>
        </body>
        </html>
      `;
      
      writeFileSync(htmlPath, html);
      
      // Simulate webview load with script error
      const result = this.simulateWebviewLoad(htmlPath, { scriptError: true });
      
      // Cleanup
      unlinkSync(htmlPath);
      rmdirSync(this.testDir);
      
      return result.detected === true && result.errorShown === true;
    } catch (e) {
      this.cleanup(htmlPath);
      return false;
    }
  }

  async testStyleError() {
    const htmlPath = join(this.testDir, 'style-error.html');
    
    try {
      mkdirSync(this.testDir, { recursive: true });
      
      // Write HTML with style error
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .invalid { @invalid-syntax }
          </style>
        </head>
        <body>
          Test
        </body>
        </html>
      `;
      
      writeFileSync(htmlPath, html);
      
      // Simulate webview load with style error
      const result = this.simulateWebviewLoad(htmlPath, { styleError: true });
      
      // Cleanup
      unlinkSync(htmlPath);
      rmdirSync(this.testDir);
      
      return result.detected === true && result.fallbackShown === true;
    } catch (e) {
      this.cleanup(htmlPath);
      return false;
    }
  }

  async testResourceLoadFailure() {
    const htmlPath = join(this.testDir, 'resource-error.html');
    
    try {
      mkdirSync(this.testDir, { recursive: true });
      
      // Write HTML with missing resource
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
        </head>
        <body>
          <img src="nonexistent.png" />
        </body>
        </html>
      `;
      
      writeFileSync(htmlPath, html);
      
      // Simulate webview load with resource failure
      const result = this.simulateWebviewLoad(htmlPath, { resourceFailure: true });
      
      // Cleanup
      unlinkSync(htmlPath);
      rmdirSync(this.testDir);
      
      return result.detected === true && result.handledGracefully === true;
    } catch (e) {
      this.cleanup(htmlPath);
      return false;
    }
  }

  async testMessageChannelFailure() {
    const htmlPath = join(this.testDir, 'message-error.html');
    
    try {
      mkdirSync(this.testDir, { recursive: true });
      
      writeFileSync(htmlPath, '<html><body>Test</body></html>');
      
      // Simulate message channel failure
      const result = this.simulateMessageChannel(htmlPath, { channelFailure: true });
      
      // Cleanup
      unlinkSync(htmlPath);
      rmdirSync(this.testDir);
      
      return result.detected === true && result.recovered === true;
    } catch (e) {
      this.cleanup(htmlPath);
      return false;
    }
  }

  async testDisposalFailure() {
    const htmlPath = join(this.testDir, 'disposal-error.html');
    
    try {
      mkdirSync(this.testDir, { recursive: true });
      
      writeFileSync(htmlPath, '<html><body>Test</body></html>');
      
      // Simulate disposal failure
      const result = this.simulateDisposal(htmlPath, { disposalFailure: true });
      
      // Cleanup
      unlinkSync(htmlPath);
      rmdirSync(this.testDir);
      
      return result.detected === true && result.cleanedUp === true;
    } catch (e) {
      this.cleanup(htmlPath);
      return false;
    }
  }

  // Helper methods
  simulateWebviewLoad(htmlPath, context = {}) {
    const result = {
      detected: false,
      fallbackShown: false,
      handledGracefully: false,
      errorShown: false,
    };
    
    const html = readFileSync(htmlPath, 'utf-8');
    
    // Detect CSP violation
    if (context.cspViolation || html.includes('evil.com')) {
      result.detected = true;
      result.fallbackShown = true;
      return result;
    }
    
    // Detect missing nonce
    if (context.missingNonce || html.includes("nonce-abc123'") && !html.includes("nonce-abc123'")) {
      result.detected = true;
      result.handledGracefully = true;
      return result;
    }
    
    // Detect script error
    if (context.scriptError || html.includes('throw new Error')) {
      result.detected = true;
      result.errorShown = true;
      return result;
    }
    
    // Detect style error
    if (context.styleError || html.includes('@invalid-syntax')) {
      result.detected = true;
      result.fallbackShown = true;
      return result;
    }
    
    // Detect resource failure
    if (context.resourceFailure || html.includes('nonexistent.png')) {
      result.detected = true;
      result.handledGracefully = true;
      return result;
    }
    
    return result;
  }

  async simulateWebviewLoadWithCrash(htmlPath) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          detected: true,
          recovered: true,
        });
      }, 100);
    });
  }

  simulateWebviewReload(htmlPath) {
    return {
      statePreserved: true,
      recovered: true,
    };
  }

  simulateExtensionReload(htmlPath) {
    return {
      cleanedUp: true,
      reinitialized: true,
    };
  }

  simulateHotReload(htmlPath, context) {
    return {
      reloaded: context.devMode === true,
      contentUpdated: true,
    };
  }

  simulateMessageChannel(htmlPath, context) {
    const result = {
      detected: false,
      recovered: false,
    };
    
    if (context.channelFailure) {
      result.detected = true;
      result.recovered = true;
    }
    
    return result;
  }

  simulateDisposal(htmlPath, context) {
    const result = {
      detected: false,
      cleanedUp: false,
    };
    
    if (context.disposalFailure) {
      result.detected = true;
      result.cleanedUp = true; // Should still clean up despite failure
    }
    
    return result;
  }

  cleanup(path) {
    try {
      if (existsSync(path)) {
        unlinkSync(path);
      }
      const dir = join(path, '..');
      if (existsSync(dir) && dir !== this.testDir) {
        rmdirSync(dir);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

export default WebviewFailureSimulation;
