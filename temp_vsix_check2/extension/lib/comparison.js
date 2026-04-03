import fs from 'fs/promises';

/**
 * Comparison tools for showing changes
 */

/**
 * Generate diff between two strings
 */
export function generateDiff(original, modified) {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  const diff = [];

  let originalIdx = 0;
  let modifiedIdx = 0;

  while (originalIdx < originalLines.length || modifiedIdx < modifiedLines.length) {
    const originalLine = originalLines[originalIdx];
    const modifiedLine = modifiedLines[modifiedIdx];

    if (originalLine === modifiedLine) {
      if (originalLine !== undefined) {
        diff.push({ type: 'equal', line: originalLine });
      }
      originalIdx++;
      modifiedIdx++;
    } else {
      // Line added
      if (originalIdx >= originalLines.length) {
        diff.push({ type: 'add', line: modifiedLine });
        modifiedIdx++;
      }
      // Line deleted
      else if (modifiedIdx >= modifiedLines.length) {
        diff.push({ type: 'remove', line: originalLine });
        originalIdx++;
      }
      // Line changed
      else {
        diff.push({ type: 'remove', line: originalLine });
        diff.push({ type: 'add', line: modifiedLine });
        originalIdx++;
        modifiedIdx++;
      }
    }
  }

  return diff;
}

/**
 * Format diff for display
 */
export function formatDiff(diff) {
  let output = '';

  diff.forEach(item => {
    switch (item.type) {
      case 'equal':
        output += `  ${item.line}\n`;
        break;
      case 'add':
        output += `+ ${item.line}\n`;
        break;
      case 'remove':
        output += `- ${item.line}\n`;
        break;
    }
  });

  return output;
}

/**
 * Get change summary
 */
export function getChangeSummary(original, modified) {
  const diff = generateDiff(original, modified);

  const summary = {
    additions: 0,
    deletions: 0,
    modifications: 0,
    unchanged: 0,
    totalChanges: 0,
  };

  let prevType = null;

  diff.forEach(item => {
    switch (item.type) {
      case 'add':
        if (prevType === 'remove') {
          summary.modifications++;
        } else {
          summary.additions++;
        }
        break;
      case 'remove':
        summary.deletions++;
        break;
      case 'equal':
        summary.unchanged++;
        break;
    }
    prevType = item.type;
  });

  summary.totalChanges = summary.additions + summary.deletions + summary.modifications;

  return summary;
}

/**
 * Compare with backup
 */
export function compareWithBackup(filePath, _backupIndex = 0) {
  // Backup comparison not yet implemented
  return {
    success: false,
    error: 'Backup comparison not yet implemented',
  };
}

/**
 * Compare two files
 */
export async function compareFiles(filePath1, filePath2) {
  try {
    const content1 = await fs.readFile(filePath1, 'utf-8');
    const content2 = await fs.readFile(filePath2, 'utf-8');

    const diff = generateDiff(content1, content2);
    const summary = getChangeSummary(content1, content2);

    return {
      success: true,
      diff,
      summary,
      formattedDiff: formatDiff(diff),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
