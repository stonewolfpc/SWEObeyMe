#!/usr/bin/env node
/**
 * EXTENSION INSTALLATION TEST
 * 
 * Tests the extension installation process in a simulated VS Code/Windsurf environment.
 * This simulates what happens when a user installs the extension from the marketplace.
 */

import fs from 'fs';
import path from 'path';
import { spawn, exec } from 'child_process';
import { fileURLToPath } from 'url';
import os from 'os';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..', '..');
let errors = [];
let warnings = [];

console.log('EXTENSION INSTALLATION TEST');
console.log('='.repeat(50));

// Helper to simulate VS Code extension loading
async function simulateExtensionLoad(extensionPath) {
  return new Promise((resolve) => {
    // Create a mock VS Code environment
    const mockVSCode = `
      const vscode = {
        commands: {
          registerCommand: (cmd, handler) => console.log('Command registered:', cmd),
          executeCommand: (cmd) => console.log('Command executed:', cmd)
        },
        window: {
          registerWebviewViewProvider: (id, provider) => console.log('Webview registered:', id),
          showInformationMessage: (msg) => console.log('Info:', msg),
          showErrorMessage: (msg) => console.log('Error:', msg)
        },
        workspace: {
          getConfiguration: (section) => ({
            get: (key, defaultValue) => defaultValue,
            update: () => Promise.resolve()
          })
        },
        languages: {
          registerCodeLensProvider: (lang, provider) => console.log('CodeLens registered for:', lang)
        },
        DiagnosticSeverity: { Error: 1, Warning: 2, Information: 3 },
        Range: class Range {},
        Position: class Position {},
        Diagnostic: class Diagnostic {}
      };
      
      // Mock the VS Code module
      global.vscode = vscode;
      
      // Load the extension
      try {
        require('${extensionPath}');
        console.log('Extension loaded successfully');
        resolve({ success: true });
      } catch (error) {
        console.error('Extension failed to load:', error.message);
        resolve({ success: false, error: error.message });
      }
    `;
    
    const tempFile = path.join(os.tmpdir(), `extension-test-${Date.now()}.js`);
    fs.writeFileSync(tempFile, mockVSCode);
    
    const child = spawn('node', [tempFile], {
      stdio: 'pipe',
      cwd: extensionPath
    });
    
    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', (code) => {
      fs.unlinkSync(tempFile);
      resolve({ 
        success: code === 0 && output.includes('Extension loaded successfully'),
        output 
      });
    });
    
    child.on('error', (error) => {
      fs.unlinkSync(tempFile);
      resolve({ success: false, error: error.message });
    });
  });
}

// Test 1: Extension installation from .vsix
async function testVSIXInstallation() {
  console.log('\n1. Testing .vsix installation...');
  
  // Find the .vsix file
  const vsixFiles = fs.readdirSync(projectRoot).filter(f => f.endsWith('.vsix'));
  
  if (vsixFiles.length === 0) {
    console.log('FAIL: No .vsix file found. Run "vsce package" first.');
    errors.push('No .vsix file found');
    return false;
  }
  
  const vsixFile = vsixFiles[0];
  console.log(`Found .vsix: ${vsixFile}`);
  
  // Extract .vsix to temporary directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vsix-test-'));
  
  try {
    // Extract using appropriate method for OS
    if (os.platform() === 'win32') {
      await new Promise((resolve, reject) => {
        const child = spawn('powershell', [
          '-Command', 
          `Expand-Archive -Path "${path.join(projectRoot, vsixFile)}" -DestinationPath "${tempDir}" -Force`
        ]);
        child.on('close', resolve);
        child.on('error', reject);
      });
    } else {
      await new Promise((resolve, reject) => {
        const child = spawn('unzip', ['-q', path.join(projectRoot, vsixFile), '-d', tempDir]);
        child.on('close', resolve);
        child.on('error', reject);
      });
    }
    
    // Check extracted contents
    const extensionDir = path.join(tempDir, 'extension');
    const requiredFiles = ['package.json', 'dist/extension.js', 'dist/mcp/server.js'];
    
    let allFilesPresent = true;
    for (const file of requiredFiles) {
      const filePath = path.join(extensionDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`  Present: ${file}`);
      } else {
        console.log(`  MISSING: ${file}`);
        errors.push(`Missing file in .vsix: ${file}`);
        allFilesPresent = false;
      }
    }
    
    if (allFilesPresent) {
      console.log('PASS: All required files present in .vsix');
    }
    
    // Test extension loading
    const loadResult = await simulateExtensionLoad(path.join(extensionDir, 'dist', 'extension.js'));
    if (loadResult.success) {
      console.log('PASS: Extension loads successfully');
    } else {
      console.log('FAIL: Extension fails to load');
      errors.push('Extension load failure');
    }
    
  } catch (e) {
    console.log('FAIL: Could not extract .vsix:', e.message);
    errors.push('.vsix extraction failed');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  return errors.length === 0;
}

// Test 2: MCP server auto-discovery
async function testMCPAutoDiscovery() {
  console.log('\n2. Testing MCP auto-discovery...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    const mcpServers = packageJson.contributes?.mcpServers || [];
    
    if (mcpServers.length === 0) {
      console.log('FAIL: No MCP servers declared in package.json');
      errors.push('No MCP servers declared');
      return false;
    }
    
    for (const server of mcpServers) {
      console.log(`  MCP Server: ${server.id}`);
      console.log(`    Command: ${server.command}`);
      console.log(`    Args: ${server.args?.join(' ') || 'none'}`);
      
      // Validate server configuration
      if (!server.id) {
        console.log('  FAIL: Missing server ID');
        errors.push('MCP server missing ID');
        continue;
      }
      
      if (!server.command) {
        console.log('  FAIL: Missing server command');
        errors.push('MCP server missing command');
        continue;
      }
      
      // Check if server file exists
      const serverPath = path.join(projectRoot, 'dist', server.args?.[0] || '');
      if (fs.existsSync(serverPath)) {
        console.log(`  PASS: Server file exists at ${serverPath}`);
      } else {
        console.log(`  FAIL: Server file missing at ${serverPath}`);
        errors.push(`MCP server file missing: ${serverPath}`);
      }
    }
    
  } catch (e) {
    console.log('FAIL: Could not parse package.json:', e.message);
    errors.push('Package.json parse error');
  }
  
  return errors.length === 0;
}

// Test 3: Configuration schema validation
async function testConfigSchema() {
  console.log('\n3. Testing configuration schema...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    const configuration = packageJson.contributes?.configuration;
    
    if (!configuration) {
      console.log('FAIL: No configuration section in package.json');
      errors.push('No configuration section');
      return false;
    }
    
    const properties = configuration.properties || {};
    
    // Check for required configuration properties
    const requiredProps = ['sweObeyMe.enabled'];
    for (const prop of requiredProps) {
      if (properties[prop]) {
        console.log(`  Present: ${prop}`);
      } else {
        console.log(`  MISSING: ${prop}`);
        errors.push(`Missing config property: ${prop}`);
      }
    }
    
    // Validate configuration structure
    let validConfig = true;
    for (const [key, prop] of Object.entries(properties)) {
      if (!prop.type) {
        console.log(`  WARN: ${key} missing type`);
        warnings.push(`Config property ${key} missing type`);
      }
      
      if (!prop.description) {
        console.log(`  WARN: ${key} missing description`);
        warnings.push(`Config property ${key} missing description`);
      }
    }
    
    if (validConfig) {
      console.log('PASS: Configuration schema valid');
    }
    
  } catch (e) {
    console.log('FAIL: Configuration validation error:', e.message);
    errors.push('Configuration schema validation failed');
  }
  
  return errors.length === 0;
}

// Test 4: Command registration validation
async function testCommandRegistration() {
  console.log('\n4. Testing command registration...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    const commands = packageJson.contributes?.commands || [];
    
    if (commands.length === 0) {
      console.log('FAIL: No commands declared');
      errors.push('No commands declared');
      return false;
    }
    
    console.log(`Found ${commands.length} commands`);
    
    // Check command structure
    for (const cmd of commands) {
      if (!cmd.command) {
        console.log(`  FAIL: Command missing ID`);
        errors.push('Command missing ID');
        continue;
      }
      
      if (!cmd.title) {
        console.log(`  WARN: ${cmd.command} missing title`);
        warnings.push(`Command ${cmd.command} missing title`);
      }
      
      if (!cmd.command.startsWith('sweObeyMe.')) {
        console.log(`  WARN: ${cmd.command} doesn't use sweObeyMe. prefix`);
        warnings.push(`Command ${cmd.command} doesn't follow naming convention`);
      }
      
      console.log(`  Command: ${cmd.command}`);
    }
    
    // Check if commands are implemented
    const extensionJs = fs.readFileSync(path.join(projectRoot, 'extension.js'), 'utf8');
    
    for (const cmd of commands) {
      const registrationPattern = new RegExp(`registerCommand\\(['"]${cmd.command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);
      if (registrationPattern.test(extensionJs)) {
        console.log(`  Implemented: ${cmd.command}`);
      } else {
        console.log(`  NOT IMPLEMENTED: ${cmd.command}`);
        errors.push(`Command not implemented: ${cmd.command}`);
      }
    }
    
  } catch (e) {
    console.log('FAIL: Command validation error:', e.message);
    errors.push('Command validation failed');
  }
  
  return errors.length === 0;
}

// Test 5: View registration validation
async function testViewRegistration() {
  console.log('\n5. Testing view registration...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    const views = packageJson.contributes?.views || {};
    const viewContainers = packageJson.contributes?.viewsContainers || {};
    
    // Check if SWEObeyMe activity bar container exists
    const activityBarContainers = viewContainers.activitybar || [];
    const sweObeyMeContainer = activityBarContainers.find(c => c.id === 'sweObeyMe');
    
    if (!sweObeyMeContainer) {
      console.log('FAIL: No sweObeyMe activity bar container');
      errors.push('Missing sweObeyMe activity bar container');
      return false;
    }
    
    console.log(`Activity bar container: ${sweObeyMeContainer.title}`);
    
    // Check views in sweObeyMe container
    const sweObeyMeViews = views.sweObeyMe || [];
    
    if (sweObeyMeViews.length === 0) {
      console.log('FAIL: No views in sweObeyMe container');
      errors.push('No views in sweObeyMe container');
      return false;
    }
    
    console.log(`Found ${sweObeyMeViews.length} views`);
    
    // Expected views
    const expectedViews = [
      'sweObeyMe.csharpSettings',
      'sweObeyMe.csharpSettingsView',
      'sweObeyMe.adminDashboard'
    ];
    
    for (const viewId of expectedViews) {
      const view = sweObeyMeViews.find(v => v.id === viewId);
      if (view) {
        console.log(`  View: ${viewId} (${view.name})`);
        
        if (view.type !== 'webview') {
          console.log(`    WARN: Not a webview type`);
          warnings.push(`View ${viewId} is not a webview`);
        }
      } else {
        console.log(`  MISSING: ${viewId}`);
        errors.push(`Missing view: ${viewId}`);
      }
    }
    
    // Check if webview providers are registered
    const extensionJs = fs.readFileSync(path.join(projectRoot, 'extension.js'), 'utf8');
    
    for (const view of sweObeyMeViews) {
      const providerPattern = new RegExp(`registerWebviewViewProvider\\(['"]${view.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);
      if (providerPattern.test(extensionJs)) {
        console.log(`  Provider registered: ${view.id}`);
      } else {
        console.log(`  Provider NOT registered: ${view.id}`);
        errors.push(`Webview provider not registered: ${view.id}`);
      }
    }
    
  } catch (e) {
    console.log('FAIL: View validation error:', e.message);
    errors.push('View validation failed');
  }
  
  return errors.length === 0;
}

// Test 6: Extension activation events
async function testActivationEvents() {
  console.log('\n6. Testing activation events...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(pathRoot, 'package.json'), 'utf8');
    const activationEvents = packageJson.activationEvents || [];
    
    if (activationEvents.length === 0) {
      console.log('FAIL: No activation events');
      errors.push('No activation events');
      return false;
    }
    
    console.log(`Found ${activationEvents.length} activation events`);
    
    for (const event of activationEvents) {
      console.log(`  Event: ${event}`);
      
      // Validate common activation events
      if (event === 'onStartupFinished') {
        console.log('    Good: onStartupFinished ensures extension loads after VS Code starts');
      } else if (event.startsWith('onCommand:')) {
        console.log('    OK: Command-based activation');
      } else if (event.startsWith('onLanguage:')) {
        console.log('    OK: Language-based activation');
      } else {
        console.log(`    WARN: Unusual activation event: ${event}`);
        warnings.push(`Unusual activation event: ${event}`);
      }
    }
    
    // Check if activate function exists
    const extensionJs = fs.readFileSync(path.join(projectRoot, 'extension.js'), 'utf8');
    
    if (extensionJs.includes('function activate') || extensionJs.includes('async function activate')) {
      console.log('PASS: activate function found');
    } else {
      console.log('FAIL: No activate function');
      errors.push('Missing activate function');
    }
    
    if (extensionJs.includes('function deactivate') || extensionJs.includes('async function deactivate')) {
      console.log('PASS: deactivate function found');
    } else {
      console.log('WARN: No deactivate function');
      warnings.push('Missing deactivate function');
    }
    
  } catch (e) {
    console.log('FAIL: Activation events validation error:', e.message);
    errors.push('Activation events validation failed');
  }
  
  return errors.length === 0;
}

// Run all installation tests
async function runInstallationTests() {
  console.log('Starting extension installation tests...\n');
  
  const tests = [
    { name: 'VSIX Installation', fn: testVSIXInstallation },
    { name: 'MCP Auto-Discovery', fn: testMCPAutoDiscovery },
    { name: 'Configuration Schema', fn: testConfigSchema },
    { name: 'Command Registration', fn: testCommandRegistration },
    { name: 'View Registration', fn: testViewRegistration },
    { name: 'Activation Events', fn: testActivationEvents }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n${test.name}`);
    console.log('-'.repeat(test.name.length));
    
    const success = await test.fn();
    results.push({ name: test.name, success });
    
    if (success) {
      console.log(`PASS: ${test.name}`);
    } else {
      console.log(`FAIL: ${test.name}`);
    }
  }
  
  // Final report
  console.log('\n' + '='.repeat(50));
  console.log('INSTALLATION TEST SUMMARY');
  console.log('='.repeat(50));
  
  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`Passed: ${passedTests}/${totalTests}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);
  
  if (errors.length > 0) {
    console.log('\nERRORS:');
    errors.forEach(err => console.log(`  - ${err}`));
  }
  
  if (warnings.length > 0) {
    console.log('\nWARNINGS:');
    warnings.forEach(warn => console.log(`  - ${warn}`));
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (errors.length === 0) {
    console.log('INSTALLATION TESTS PASSED');
    console.log('Extension should install and activate correctly.');
    return true;
  } else {
    console.log('INSTALLATION TESTS FAILED');
    console.log('Fix errors before releasing.');
    return false;
  }
}

// Execute
runInstallationTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Installation test crashed:', error);
  process.exit(1);
});
