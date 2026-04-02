import fs from "fs/promises";
import path from "path";

/**
 * Feedback tools for providing guidance and explanations
 */

/**
 * Explain rejection
 */
export function explainRejection(rejectionReason, context) {
  const explanations = {
    'line_count_exceeded': {
      reason: 'File exceeds maximum line count limit',
      explanation: 'The file has too many lines. This can make code harder to maintain and understand.',
      suggestions: [
        'Extract functions into separate modules',
        'Use refactor_move_block to move code blocks to other files',
        'Consider splitting the file into smaller, focused modules',
        'Remove dead code or consolidate similar functions'
      ],
      tools: ['refactor_move_block', 'extract_to_new_file']
    },
    'forbidden_pattern': {
      reason: 'Contains forbidden pattern',
      explanation: 'The code contains patterns that are prohibited for security or code quality reasons.',
      suggestions: [
        'Remove the forbidden pattern',
        'Use auto_repair_submission to automatically fix the issue',
        'Replace console.log with proper logging',
        'Remove TODO/FIXME comments and create proper issues'
      ],
      tools: ['auto_repair_submission']
    },
    'backup_failed': {
      reason: 'Backup creation failed',
      explanation: 'Unable to create a backup before writing. This is a safety measure to prevent data loss.',
      suggestions: [
        'Check backup directory permissions',
        'Ensure backup directory exists',
        'Check available disk space',
        'Use create_backup manually to diagnose the issue'
      ],
      tools: ['create_backup']
    },
    'syntax_error': {
      reason: 'Syntax validation failed',
      explanation: 'The code contains syntax errors that would prevent it from running.',
      suggestions: [
        'Check for unmatched braces, parentheses, or brackets',
        'Verify string quotes are properly closed',
        'Check for missing semicolons or commas',
        'Use auto_repair_submission to fix common syntax issues'
      ],
      tools: ['auto_repair_submission']
    },
    'import_error': {
      reason: 'Import validation failed',
      explanation: 'The code contains imports that cannot be resolved.',
      suggestions: [
        'Verify import paths are correct',
        'Ensure imported files exist',
        'Check for circular dependencies',
        'Update relative import paths'
      ],
      tools: []
    },
    'loop_detected': {
      reason: 'Repetitive operation detected',
      explanation: 'The same operation has been attempted multiple times, suggesting a loop.',
      suggestions: [
        'Review your approach and try a different strategy',
        'Use request_surgical_recovery to reset session state',
        'Check get_session_context to understand what is happening',
        'Use get_architectural_directive for guidance'
      ],
      tools: ['request_surgical_recovery', 'get_session_context', 'get_architectural_directive']
    },
    'default': {
      reason: rejectionReason,
      explanation: 'The operation was rejected for the stated reason.',
      suggestions: [
        'Review the error message carefully',
        'Check get_config_schema to understand requirements',
        'Use get_architectural_directive for guidance',
        'Try a different approach'
      ],
      tools: ['get_config_schema', 'get_architectural_directive']
    }
  };
  
  const explanation = explanations[rejectionReason] || explanations['default'];
  
  return {
    reason: explanation.reason,
    explanation: explanation.explanation,
    suggestions: explanation.suggestions,
    tools: explanation.tools,
    context
  };
}

/**
 * Suggest alternatives
 */
export function suggestAlternatives(failedOperation, context) {
  const alternatives = {
    'write_file': [
      {
        tool: 'refactor_move_block',
        reason: 'Move code blocks to reduce file size',
        description: 'Extract a code block to another file to keep the source file under the line limit'
      },
      {
        tool: 'extract_to_new_file',
        reason: 'Create new module',
        description: 'Extract a code block to a new file when creating a new module'
      },
      {
        tool: 'auto_repair_submission',
        reason: 'Fix syntax or formatting issues',
        description: 'Automatically repair common JSON or code formatting issues'
      }
    ],
    'obey_surgical_plan': [
      {
        tool: 'refactor_move_block',
        reason: 'Reduce file size before writing',
        description: 'Move code blocks to other files to make room for new changes'
      },
      {
        tool: 'extract_to_new_file',
        reason: 'Extract code to new file',
        description: 'Extract large code blocks to new files to reduce source file size'
      },
      {
        tool: 'get_architectural_directive',
        reason: 'Get guidance on architectural approach',
        description: 'Query the architectural directive for guidance on how to proceed'
      }
    ],
    'default': [
      {
        tool: 'get_architectural_directive',
        reason: 'Get architectural guidance',
        description: 'Query the architectural directive for guidance on how to proceed'
      },
      {
        tool: 'get_session_context',
        reason: 'Review session history',
        description: 'Check session context to understand what has been attempted'
      },
      {
        tool: 'request_surgical_recovery',
        reason: 'Reset session state',
        description: 'Reset session state if stuck in a loop'
      }
    ]
  };
  
  const toolAlternatives = alternatives[failedOperation] || alternatives['default'];
  
  return {
    failedOperation,
    alternatives: toolAlternatives,
    context
  };
}

/**
 * Get historical context
 */
export async function getHistoricalContext(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Extract recent changes (last 50 lines)
    const recentLines = lines.slice(-50);
    
    // Look for recent change markers
    const changeMarkers = recentLines.filter(line => 
      line.includes('// Changed:') || 
      line.includes('// Updated:') ||
      line.includes('// Fixed:')
    );
    
    return {
      filePath,
      recentChanges: changeMarkers,
      lastModified: (await fs.stat(filePath)).mtime,
      lineCount: lines.length,
      summary: `${lines.length} lines, ${changeMarkers.length} recent change markers`
    };
  } catch (error) {
    throw new Error(`Failed to get historical context: ${error.message}`);
  }
}

/**
 * Get operation guidance
 */
export function getOperationGuidance(operation, context) {
  const guidance = {
    'write_file': {
      prerequisites: ['obey_surgical_plan', 'read_file'],
      warnings: [
        'Always call obey_surgical_plan before write_file',
        'Ensure you have read the file first',
        'Backups are created automatically for existing files'
      ],
      bestPractices: [
        'Keep changes focused and minimal',
        'Verify line count before writing',
        'Test changes locally if possible'
      ]
    },
    'refactor_move_block': {
      prerequisites: ['read_file'],
      warnings: [
        'Ensure source file exists',
        'Verify target file won\'t exceed line limit',
        'Make sure code block matches exactly'
      ],
      bestPractices: [
        'Move logically related code together',
        'Update imports if needed',
        'Verify the move does not break dependencies'
      ]
    },
    'default': {
      prerequisites: [],
      warnings: [],
      bestPractices: [
        'Read tool descriptions for usage guidance',
        'Follow the suggested tool ordering',
        'Use get_config_schema to understand requirements'
      ]
    }
  };
  
  const operationGuidance = guidance[operation] || guidance['default'];
  
  return {
    operation,
    ...operationGuidance,
    context
  };
}
