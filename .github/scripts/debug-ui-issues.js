#!/usr/bin/env node
/**
 * Debug script to identify specific UI issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..', '..');
const extensionJs = fs.readFileSync(path.join(projectRoot, 'extension.js'), 'utf8');

console.log('DEBUGGING UI ISSUES');
console.log('='.repeat(50));

// Extract HTML content for each generator
const generators = ['getSettingsHtml', 'getCSharpBridgeHtml', 'getAdminDashboardHtml'];

for (const generator of generators) {
  console.log(`\n=== ${generator} ===`);

  // Find the function
  const startPattern = new RegExp(`function ${generator}\\s*\\(`);
  const startIndex = extensionJs.search(startPattern);

  if (startIndex === -1) {
    console.log('Function not found');
    continue;
  }

  // Find the return statement with HTML
  const returnPattern = /return\s+`([^`]*(?:\\.[^`\\]*)*)`/g;
  let htmlContent = '';

  // Search from the function start
  const functionContent = extensionJs.substring(startIndex, startIndex + 5000);
  returnPattern.lastIndex = 0;

  let match;
  while ((match = returnPattern.exec(functionContent)) !== null) {
    htmlContent = match[1];
    break;
  }

  if (!htmlContent) {
    console.log('No HTML content found');
    continue;
  }

  console.log(`HTML length: ${htmlContent.length}`);

  // Debug unclosed tags
  const openTags = htmlContent.match(/<[^\/][^>]*>/g) || [];
  const closeTags = htmlContent.match(/<\/[^>]*>/g) || [];
  const selfClosing = htmlContent.match(/\/>/g) || [];

  console.log(`Open tags: ${openTags.length}`);
  console.log(`Close tags: ${closeTags.length}`);
  console.log(`Self-closing: ${selfClosing.length}`);
  console.log(`Open - Close: ${openTags.length - closeTags.length}`);
  console.log(`Expected max difference: ${selfClosing.length}`);

  // Show first few tags
  console.log('\nFirst 10 open tags:');
  openTags.slice(0, 10).forEach((tag, i) => console.log(`  ${i + 1}. ${tag}`));

  console.log('\nFirst 10 close tags:');
  closeTags.slice(0, 10).forEach((tag, i) => console.log(`  ${i + 1}. ${tag}`));

  // Debug hardcoded paths
  const windowsPaths = htmlContent.match(/[A-Z]:\\\\/g) || [];
  const unixPaths = htmlContent.match(/\/[^"'\\\\]*\//g) || [];

  console.log(`\Windows paths: ${windowsPaths.length}`);
  windowsPaths.forEach((p) => console.log(`  - ${p}`));

  console.log(`Unix paths: ${unixPaths.length}`);
  unixPaths.forEach((p) => console.log(`  - ${p}`));

  // Look for any paths
  const allPaths = htmlContent.match(/[a-zA-Z]:[\\/][^"'\\s]*|\/[^"'\\s]*\//g) || [];
  console.log(`\nAll paths found: ${allPaths.length}`);
  allPaths.forEach((p) => console.log(`  - ${p}`));
}
