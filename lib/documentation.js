import path from 'path';
import { MIN_DOCUMENTATION_RATIO } from './config.js';

/**
 * Documentation tools for enforcing documentation requirements
 */

/**
 * Require documentation for code
 */
export function requireDocumentation(content) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    documentationRatio: 0,
  };

  const lines = content.split('\n');
  const lineCount = lines.length;

  // Count comment lines
  const commentLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
  });

  const commentCount = commentLines.length;
  const ratio = lineCount > 0 ? commentCount / lineCount : 0;
  result.documentationRatio = ratio;

  // Check minimum documentation ratio
  const minRatio = MIN_DOCUMENTATION_RATIO();
  if (ratio < minRatio) {
    result.valid = false;
    result.errors.push(
      `Documentation ratio ${(ratio * 100).toFixed(1)}% below minimum of ${(minRatio * 100).toFixed(1)}%`,
    );
    result.errors.push(`Need ${Math.ceil(minRatio * lineCount) - commentCount} more comment lines`);
  }

  // Check for function documentation
  const functions = content.match(/function\s+(\w+)/g) || [];
  const documentedFunctions = content.match(/\/\*\*[\s\S]*?\*\/\s*function/g) || [];

  if (functions.length > documentedFunctions.length) {
    result.warnings.push(
      `${functions.length - documentedFunctions.length} functions without JSDoc`,
    );
  }

  // Check for class documentation
  const classes = content.match(/class\s+(\w+)/g) || [];
  const documentedClasses = content.match(/\/\*\*[\s\S]*?\*\/\s*class/g) || [];

  if (classes.length > documentedClasses.length) {
    result.warnings.push(`${classes.length - documentedClasses.length} classes without JSDoc`);
  }

  return result;
}

/**
 * Generate change summary
 */
export function generateChangeSummary(filePath, changes) {
  const summary = {
    filePath,
    timestamp: new Date().toISOString(),
    changes: [],
    filesModified: [],
    functionsAdded: [],
    functionsRemoved: [],
    classesAdded: [],
    classesRemoved: [],
  };

  // Parse changes
  const lines = changes.split('\n');
  lines.forEach(line => {
    if (line.startsWith('+')) {
      summary.changes.push({ type: 'add', content: line.substring(1) });

      // Check for function additions
      const fnMatch = line.match(/\+\s*function\s+(\w+)/);
      if (fnMatch) summary.functionsAdded.push(fnMatch[1]);

      // Check for class additions
      const clsMatch = line.match(/\+\s*class\s+(\w+)/);
      if (clsMatch) summary.classesAdded.push(clsMatch[1]);
    } else if (line.startsWith('-')) {
      summary.changes.push({ type: 'remove', content: line.substring(1) });

      // Check for function removals
      const fnMatch = line.match(/-\s*function\s+(\w+)/);
      if (fnMatch) summary.functionsRemoved.push(fnMatch[1]);

      // Check for class removals
      const clsMatch = line.match(/-\s*class\s+(\w+)/);
      if (clsMatch) summary.classesRemoved.push(clsMatch[1]);
    }
  });

  summary.filesModified.push(filePath);

  return summary;
}

/**
 * Generate commit message draft
 */
export function generateCommitMessage(filePath, changes) {
  const summary = generateChangeSummary(filePath, changes);

  let commitType = 'chore';
  const commitScope = path.basename(filePath, path.extname(filePath));

  // Determine commit type based on changes
  if (summary.functionsAdded.length > 0 || summary.classesAdded.length > 0) {
    commitType = 'feat';
  } else if (summary.functionsRemoved.length > 0 || summary.classesRemoved.length > 0) {
    commitType = 'refactor';
  } else if (summary.changes.some(c => c.content.includes('fix') || c.content.includes('bug'))) {
    commitType = 'fix';
  }

  let message = `${commitType}(${commitScope}): `;

  // Add description
  if (summary.functionsAdded.length > 0) {
    message += `Add ${summary.functionsAdded.join(', ')}`;
  } else if (summary.functionsRemoved.length > 0) {
    message += `Remove ${summary.functionsRemoved.join(', ')}`;
  } else {
    message += 'Update implementation';
  }

  // Add details
  if (summary.classesAdded.length > 0) {
    message += `\n\n- Add classes: ${summary.classesAdded.join(', ')}`;
  }

  if (summary.classesRemoved.length > 0) {
    message += `\n\n- Remove classes: ${summary.classesRemoved.join(', ')}`;
  }

  return message;
}
