/**
 * Project Memory Handlers
 * Handlers for project memory tools
 */

import { initializeProjectMemory, getProjectMemory } from '../project-memory.js';

/**
 * Index project structure
 */
export async function indexProjectStructure(args) {
  try {
    const pm = getProjectMemory();
    if (!pm) {
      const workspace = args.directory || process.cwd();
      await initializeProjectMemory(workspace);
      const initializedPm = getProjectMemory();
      if (!initializedPm) {
        return {
          isError: true,
          content: [{ type: 'text', text: 'Failed to initialize project memory.' }],
        };
      }
    }

    const currentPm = getProjectMemory();
    const directory = args.directory || process.cwd();

    const structure = await currentPm.indexStructure(directory);

    return {
      content: [{
        type: 'text',
        text: `Project structure indexed successfully.\n\nDirectories: ${structure.dirs.length}\nFiles: ${structure.files.length}\n\nStructure has been saved to project memory for anti-hallucination protection.`,
      }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to index project structure: ${error.message}` }],
    };
  }
}

/**
 * Analyze project conventions
 */
export async function analyzeProjectConventions(args) {
  try {
    const pm = getProjectMemory();
    if (!pm) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Project memory not initialized. Call index_project_structure first.' }],
      };
    }

    const conventions = await pm.analyzeConventions();

    let output = 'Project Conventions Analysis:\n\n';
    for (const [key, pattern] of conventions) {
      output += `${key}: ${pattern}\n`;
    }

    return {
      content: [{ type: 'text', text: output }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to analyze conventions: ${error.message}` }],
    };
  }
}

/**
 * Get project memory summary
 */
export async function getProjectMemorySummary(args) {
  try {
    const pm = getProjectMemory();
    if (!pm) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Project memory not initialized. Call index_project_structure first.' }],
      };
    }

    const summary = pm.getSummary();

    let output = 'Project Memory Summary:\n\n';
    output += 'Structure:\n';
    output += `  Total Directories: ${summary.structure.totalDirectories}\n`;
    output += `  Total Files: ${summary.structure.totalFiles}\n`;
    output += `  Last Indexed: ${summary.structure.lastIndexed ? new Date(summary.structure.lastIndexed).toISOString() : 'Never'}\n\n`;

    output += 'Conventions:\n';
    for (const [key, pattern] of Object.entries(summary.conventions.namingPatterns)) {
      output += `  ${key}: ${pattern}\n`;
    }
    output += `  Last Analyzed: ${summary.conventions.lastAnalyzed ? new Date(summary.conventions.lastAnalyzed).toISOString() : 'Never'}\n\n`;

    output += 'Decisions:\n';
    output += `  Total Recorded: ${summary.decisions.total}\n`;
    if (summary.decisions.recent.length > 0) {
      output += '  Recent Decisions:\n';
      summary.decisions.recent.forEach((d, i) => {
        output += `    ${i + 1}. ${d.decision.substring(0, 100)}...\n`;
      });
    }

    return {
      content: [{ type: 'text', text: output }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get project memory summary: ${error.message}` }],
    };
  }
}

/**
 * Record project decision
 */
export async function recordProjectDecision(args) {
  try {
    const pm = getProjectMemory();
    if (!pm) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Project memory not initialized. Call index_project_structure first.' }],
      };
    }

    pm.recordDecision(args.decision);
    await pm.save();

    return {
      content: [{ type: 'text', text: `Decision recorded: ${args.decision.substring(0, 100)}...` }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to record decision: ${error.message}` }],
    };
  }
}

/**
 * Suggest file location
 */
export async function suggestFileLocation(args) {
  try {
    const pm = getProjectMemory();
    if (!pm) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Project memory not initialized. Call index_project_structure first.' }],
      };
    }

    const suggestions = pm.suggestFileLocation(args.fileType, args.purpose);

    if (suggestions.length === 0) {
      return {
        content: [{ type: 'text', text: 'No suitable location suggestions found. Consider creating a new directory following project conventions.' }],
      };
    }

    let output = `Suggested locations for ${args.fileType} file (${args.purpose}):\n\n`;
    suggestions.forEach((s, i) => {
      output += `${i + 1}. ${s.path}\n`;
      output += `   Confidence: ${(s.confidence * 100).toFixed(0)}%\n`;
      output += `   Reason: ${s.reason}\n\n`;
    });

    return {
      content: [{ type: 'text', text: output }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to suggest file location: ${error.message}` }],
    };
  }
}

/**
 * Dispatcher: project_memory swiss-army-knife handler
 * Routes to appropriate handler based on operation parameter
 */
export async function project_memory_handler(params) {
  const { operation, directory, decision, fileType, purpose } = params;

  if (!operation) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'operation parameter is required' }],
    };
  }

  switch (operation) {
    case 'index':
      return await indexProjectStructure({ directory });
    case 'conventions':
      return await analyzeProjectConventions(params);
    case 'summary':
      return await getProjectMemorySummary(params);
    case 'record_decision':
      return await recordProjectDecision({ decision });
    case 'suggest_location':
      return await suggestFileLocation({ fileType, purpose });
    default:
      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown operation: ${operation}` }],
      };
  }
}

export const projectMemoryHandlers = {
  project_memory: project_memory_handler,
  index_project_structure: indexProjectStructure,
  analyze_project_conventions: analyzeProjectConventions,
  get_project_memory_summary: getProjectMemorySummary,
  record_project_decision: recordProjectDecision,
  suggest_file_location: suggestFileLocation,
};
