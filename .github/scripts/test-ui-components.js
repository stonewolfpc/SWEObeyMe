/**
 * UI COMPONENT TESTS - Validates webviews, panels, and commands
 * Tests that all UI components are properly registered and functional
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🖥️  UI COMPONENT TESTS\n');

const projectRoot = path.join(__dirname, '..', '..');
const errors = [];
const warnings = [];

// Test 1: Check extension.js has all required activation events
console.log('1️⃣  Checking extension.js structure...');
const extensionJsPath = path.join(projectRoot, 'extension.js');
const extensionJs = fs.readFileSync(extensionJsPath, 'utf8');

const requiredActivations = [
  { pattern: /activate\s*\(/, name: 'activate function' },
  { pattern: /deactivate/, name: 'deactivate function' },
  { pattern: /registerCommand/, name: 'command registration' },
  { pattern: /createWebviewPanel|WebviewPanel/, name: 'webview panel creation' },
];

for (const check of requiredActivations) {
  if (!check.pattern.test(extensionJs)) {
    errors.push(`Missing ${check.name} in extension.js`);
  }
}

if (errors.length === 0) {
  console.log('   ✅ Extension structure valid\n');
} else {
  console.error('   ❌ Extension structure issues:');
  errors.forEach((e) => console.error(`      - ${e}`));
}

// Test 2: Check package.json commands are registered
console.log('2️⃣  Checking command declarations...');
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const declaredCommands = packageJson.contributes?.commands || [];
const commandIds = declaredCommands.map((c) => c.command);

console.log(`   Found ${declaredCommands.length} commands in package.json`);

// Verify each command has required fields
const commandIssues = [];
for (const cmd of declaredCommands) {
  if (!cmd.title) commandIssues.push(`${cmd.command}: missing title`);
  if (!cmd.command) commandIssues.push('Command missing ID');
  if (cmd.command && !cmd.command.startsWith('sweObeyMe.')) {
    commandIssues.push(`${cmd.command}: doesn't use sweObeyMe. prefix`);
  }
}

if (commandIssues.length > 0) {
  warnings.push(...commandIssues);
  console.warn('   ⚠️  Command issues:');
  commandIssues.forEach((i) => console.warn(`      - ${i}`));
} else {
  console.log('   ✅ All commands properly declared\n');
}

// Test 3: Check webview provider registration
console.log('3️⃣  Checking webview providers...');
const hasWebviewProvider =
  extensionJs.includes('WebviewViewProvider') ||
  extensionJs.includes('registerWebviewViewProvider');
const hasWebviewPanel = extensionJs.includes('createWebviewPanel');

if (hasWebviewProvider || hasWebviewPanel) {
  console.log('   ✅ Webview components detected');
} else {
  warnings.push('No webview components detected');
  console.warn('   ⚠️  No webview components found');
}

// Test 4: Check C# Bridge UI components
console.log('\n4️⃣  Checking C# Bridge UI...');
const csharpSettingsPath = path.join(projectRoot, 'lib/csharp-settings-provider.js');
if (fs.existsSync(csharpSettingsPath)) {
  const csharpSettings = fs.readFileSync(csharpSettingsPath, 'utf8');
  const hasWebview = csharpSettings.includes('webview');
  const hasGetHtml =
    csharpSettings.includes('getHtml') || csharpSettings.includes('_getHtmlForWebview');

  if (hasWebview && hasGetHtml) {
    console.log('   ✅ C# Bridge settings provider has webview');
  } else {
    warnings.push('C# Bridge settings provider may be incomplete');
    console.warn('   ⚠️  C# Bridge webview may be incomplete');
  }
} else {
  errors.push('C# Bridge settings provider not found');
  console.error('   ❌ lib/csharp-settings-provider.js missing');
}

// Test 5: Check for UI activation events
console.log('\n5️⃣  Checking activation events...');
const activationEvents = packageJson.activationEvents || [];
const hasOnStartup = activationEvents.includes('onStartupFinished');
const hasOnCommand = activationEvents.some((e) => e.startsWith('onCommand:'));

if (hasOnStartup) {
  console.log('   ✅ Extension activates on startup');
} else if (hasOnCommand) {
  console.log('   ✅ Extension activates on command');
} else {
  warnings.push('No activation events detected');
  console.warn('   ⚠️  No activation events found');
}

// Test 6: Validate icon files exist
console.log('\n6️⃣  Checking icon files...');
const iconPng = path.join(projectRoot, 'icon.png');
const iconSvg = path.join(projectRoot, 'icon.svg');

if (fs.existsSync(iconPng)) {
  console.log('   ✅ icon.png exists');
} else {
  warnings.push('icon.png not found');
  console.warn('   ⚠️  icon.png missing');
}

if (fs.existsSync(iconSvg)) {
  console.log('   ✅ icon.svg exists');
} else {
  warnings.push('icon.svg not found');
  console.warn('   ⚠️  icon.svg missing');
}

// Test 7: Check for view containers
console.log('\n7️⃣  Checking view containers...');
const contributes = packageJson.contributes || {};
const viewContainers = contributes.viewsContainers || {};
const hasActivitybar = viewContainers.activitybar && viewContainers.activitybar.length > 0;
const hasPanel = viewContainers.panel && viewContainers.panel.length > 0;

if (hasActivitybar || hasPanel) {
  console.log('   ✅ View containers configured');
} else {
  console.log('   ℹ️  No custom view containers (may be optional)');
}

// Test 8: Check configuration properties
console.log('\n8️⃣  Checking configuration schema...');
const configuration = contributes.configuration;
if (configuration) {
  const properties = configuration.properties || {};
  const propCount = Object.keys(properties).length;
  console.log(`   ✅ ${propCount} configuration properties defined`);

  // Check for critical config
  const hasCsharpBridge = Object.keys(properties).some((p) => p.includes('csharpBridge'));
  if (hasCsharpBridge) {
    console.log('   ✅ C# Bridge configuration found');
  }
} else {
  warnings.push('No configuration schema defined');
  console.warn('   ⚠️  No configuration schema');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 UI COMPONENT TEST SUMMARY');
console.log('='.repeat(60));
console.log(`   Errors: ${errors.length}`);
console.log(`   Warnings: ${warnings.length}`);
console.log(`   Commands: ${declaredCommands.length}`);

if (errors.length > 0) {
  console.error('\n❌ UI TESTS FAILED');
  console.error('   Critical errors found:');
  errors.forEach((e) => console.error(`      - ${e}`));
  process.exit(1);
} else if (warnings.length > 0) {
  console.warn('\n⚠️  UI TESTS PASSED WITH WARNINGS');
  console.warn('   Review warnings before release');
  process.exit(0);
} else {
  console.log('\n✅ ALL UI TESTS PASSED');
  console.log('   UI components properly configured');
  process.exit(0);
}
