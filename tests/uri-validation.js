#!/usr/bin/env node

/**
 * URI Validation Test
 * Ensures extension code never passes bare file paths to VS Code APIs
 * This prevents URI normalization warnings from our code
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== URI Validation Test ===\n');

const libDir = path.join(__dirname, '..', 'lib');
const extensionFile = path.join(__dirname, '..', 'extension.js');

let hasErrors = false;

// Check 1: Verify vscode.Uri.file() usage
console.log('Check 1: vscode.Uri.file() usage');
const libFiles = fs.readdirSync(libDir).filter(f => f.endsWith('.js'));
let uriFileUsageCorrect = true;

for (const file of libFiles) {
  const filePath = path.join(libDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check for bare paths being passed to VS Code APIs
  const problematicPatterns = [
    /vscode\.workspace\.fs\.writeFile\([^)]*[^)]fsPath[^)]*\)/g,
    /vscode\.workspace\.openTextDocument\([^)]*[^)]fsPath[^)]*\)/g,
    /vscode\.window\.showTextDocument\([^)]*[^)]fsPath[^)]*\)/g,
  ];
  
  for (const pattern of problematicPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      console.log(`  ❌ ERROR in ${file}: Bare path passed to VS Code API`);
      matches.forEach(m => console.log(`     ${m}`));
      hasErrors = true;
      uriFileUsageCorrect = false;
    }
  }
}

if (uriFileUsageCorrect) {
  console.log('  ✅ No bare paths passed to VS Code APIs');
}

// Check 2: Verify vscode.Uri.file() is used when converting paths
console.log('\nCheck 2: vscode.Uri.file() usage for path conversion');
let uriConversionCorrect = true;

for (const file of libFiles) {
  const filePath = path.join(libDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check for file paths being used with VS Code APIs without URI conversion
  const fileOperations = content.match(/vscode\.workspace\.(fs|openTextDocument|showTextDocument)\([^)]+\)/g);
  if (fileOperations) {
    for (const op of fileOperations) {
      if (!op.includes('vscode.Uri') && op.includes('fsPath')) {
        console.log(`  ❌ ERROR in ${file}: fsPath used without URI conversion`);
        console.log(`     ${op}`);
        hasErrors = true;
        uriConversionCorrect = false;
      }
    }
  }
}

if (uriConversionCorrect) {
  console.log('  ✅ All VS Code API calls use proper URI conversion');
}

// Check 3: Verify extension.js doesn't pass bare paths to VS Code
console.log('\nCheck 3: extension.js VS Code API usage');
if (fs.existsSync(extensionFile)) {
  const extensionContent = fs.readFileSync(extensionFile, 'utf-8');
  
  // Only check APIs that expect URIs (file operations, text document operations)
  const uriRequiringApis = [
    /vscode\.workspace\.fs\.[a-zA-Z]+\([^)]*path[^)]*\)/gi,
    /vscode\.workspace\.openTextDocument\([^)]*path[^)]*\)/gi,
    /vscode\.window\.showTextDocument\([^)]*path[^)]*\)/gi,
  ];
  
  let extensionIssuesFound = false;
  for (const pattern of uriRequiringApis) {
    const matches = extensionContent.match(pattern);
    if (matches) {
      for (const match of matches) {
        if (!match.includes('vscode.Uri')) {
          console.log(`  ❌ ERROR in extension.js: Bare path in VS Code API call`);
          console.log(`     ${match}`);
          hasErrors = true;
          extensionIssuesFound = true;
        }
      }
    }
  }
  
  if (!extensionIssuesFound) {
    console.log('  ✅ extension.js uses proper URI conversion');
  }
} else {
  console.log('  ⚠️  extension.js not found (skipped)');
}

console.log('\n=== Test Complete ===');

if (hasErrors) {
  console.log('\n❌ FAILED - URI validation found errors');
  console.log('Fix the issues above to prevent URI normalization warnings.');
  process.exit(1);
} else {
  console.log('\n✅ PASSED - All VS Code API calls use proper URIs');
  process.exit(0);
}
