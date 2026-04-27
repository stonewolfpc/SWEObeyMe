/**
 * Project Memory Handlers
 * Handlers for project memory tools
 */

import { initializeProjectMemory, getProjectMemory } from '../project-memory.js';
import { getProjectMemoryManager } from '../project-memory-system.js';

/**
 * Index project structure
 */
export async function indexProjectStructure(args) {
  try {
    const pm = getProjectMemory();
    if (!pm) {
      const workspace = args.directory || process.env.SWEOBEYME_WORKSPACE || process.cwd();
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
    const directory = args.directory || process.env.SWEOBEYME_WORKSPACE || process.cwd();

    const structure = await currentPm.indexStructure(directory);

    return {
      content: [
        {
          type: 'text',
          text: `Project structure indexed successfully.\n\nDirectories: ${structure.dirs.length}\nFiles: ${structure.files.length}\n\nStructure has been saved to project memory for anti-hallucination protection.`,
        },
      ],
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
        content: [
          {
            type: 'text',
            text: 'Project memory not initialized. Call index_project_structure first.',
          },
        ],
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
        content: [
          {
            type: 'text',
            text: 'Project memory not initialized. Call index_project_structure first.',
          },
        ],
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
        content: [
          {
            type: 'text',
            text: 'Project memory not initialized. Call index_project_structure first.',
          },
        ],
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
        content: [
          {
            type: 'text',
            text: 'Project memory not initialized. Call index_project_structure first.',
          },
        ],
      };
    }

    const suggestions = pm.suggestFileLocation(args.fileType, args.purpose);

    if (suggestions.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No suitable location suggestions found. Consider creating a new directory following project conventions.',
          },
        ],
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
 * Query implementation knowledge
 */
export async function query_implementation_knowledge(args) {
  try {
    const { queryType, filters, relatedTo } = args;
    const projectName = args.projectName || 'default';

    const manager = await getProjectMemoryManager(projectName);
    if (!manager) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Project memory manager not found for project.' }],
      };
    }

    const results = {
      attempts: [],
      assumptions: [],
      patterns: [],
      annotations: [],
      impacts: [],
    };

    // Query errors (implementation attempts)
    if (queryType === 'attempts' || queryType === 'all') {
      const filteredErrors = manager.errors.filter((e) => {
        if (filters?.outcome && e.outcome !== filters.outcome) return false;
        if (relatedTo && !e.file?.includes(relatedTo)) return false;
        return true;
      });
      results.attempts = filteredErrors.slice(-20).map((e) => ({
        id: e.id,
        timestamp: e.timestamp,
        outcome: e.outcome,
        error: e.error,
        validationReference: e.validationReference,
        relatedAttemptId: e.relatedAttemptId,
      }));
    }

    // Query decisions (assumptions)
    if (queryType === 'assumptions' || queryType === 'all') {
      const filteredDecisions = manager.decisions.filter((d) => {
        if (filters?.status && d.assumptionStatus !== filters.status) return false;
        if (relatedTo && !d.description?.includes(relatedTo)) return false;
        return d.assumptionStatus;
      });
      results.assumptions = filteredDecisions.slice(-20).map((d) => ({
        id: d.id,
        timestamp: d.timestamp,
        description: d.description,
        assumptionStatus: d.assumptionStatus,
        validationEvidence: d.validationEvidence,
      }));
    }

    // Query patterns (working patterns)
    if (queryType === 'patterns' || queryType === 'all') {
      const filteredPatterns = manager.patterns.filter((p) => {
        if (filters?.isNonStandard && !p.isNonStandard) return false;
        if (relatedTo && !p.pattern?.includes(relatedTo)) return false;
        return true;
      });
      results.patterns = filteredPatterns.slice(-20).map((p) => ({
        id: p.id,
        timestamp: p.timestamp,
        pattern: p.pattern,
        overrideReason: p.overrideReason,
        whenToUse: p.whenToUse,
        isNonStandard: p.isNonStandard,
      }));
    }

    // Query context annotations
    if (queryType === 'annotations' || queryType === 'all') {
      const filteredAnnotations = manager.contextAnnotations.filter((a) => {
        if (filters?.annotationType && a.annotationType !== filters.annotationType) return false;
        if (relatedTo && !a.filePath?.includes(relatedTo)) return false;
        return true;
      });
      results.annotations = filteredAnnotations.slice(-20).map((a) => ({
        id: a.id,
        timestamp: a.timestamp,
        filePath: a.filePath,
        annotationType: a.annotationType,
        notes: a.notes,
        relatedAttemptId: a.relatedAttemptId,
      }));
    }

    // Query dependency impacts
    if (queryType === 'impacts' || queryType === 'all') {
      const filteredImpacts = manager.dependencyImpacts.filter((i) => {
        if (
          relatedTo &&
          !i.sourceFile?.includes(relatedTo) &&
          !i.affectedFiles?.some((f) => f.includes(relatedTo))
        )
          return false;
        return true;
      });
      results.impacts = filteredImpacts.slice(-20).map((i) => ({
        id: i.id,
        timestamp: i.timestamp,
        sourceFile: i.sourceFile,
        affectedFiles: i.affectedFiles,
        impactChain: i.impactChain,
        mitigationSteps: i.mitigationSteps,
      }));
    }

    // Generate warnings and recommendations
    const warnings = [];
    const recommendations = [];

    // Check for INVALIDATED assumptions
    results.assumptions.forEach((a) => {
      if (a.assumptionStatus === 'INVALIDATED') {
        warnings.push(`ASSUMPTION INVALIDATED: ${a.description}`);
      }
    });

    // Check for NON-STANDARD patterns
    results.patterns.forEach((p) => {
      if (p.isNonStandard) {
        recommendations.push(`NON-STANDARD PATTERN: ${p.pattern} - ${p.overrideReason}`);
      }
    });

    // Check for NON-STANDARD annotations
    results.annotations.forEach((a) => {
      if (a.annotationType === 'NON-STANDARD' || a.annotationType === 'REQUIRES_SPECIAL_HANDLING') {
        warnings.push(`FILE ANNOTATION: ${a.filePath} is ${a.annotationType} - ${a.notes}`);
      }
    });

    let output = `Implementation Knowledge Query Results:\n\n`;

    if (results.attempts.length > 0) {
      output += `Implementation Attempts (${results.attempts.length}):\n`;
      results.attempts.forEach((a) => {
        output += `  [${a.outcome}] ${a.timestamp}: ${a.error}\n`;
        if (a.validationReference) output += `    Validation: ${a.validationReference}\n`;
      });
      output += '\n';
    }

    if (results.assumptions.length > 0) {
      output += `Assumptions (${results.assumptions.length}):\n`;
      results.assumptions.forEach((a) => {
        output += `  [${a.assumptionStatus}] ${a.description}\n`;
        if (a.validationEvidence) output += `    Evidence: ${a.validationEvidence}\n`;
      });
      output += '\n';
    }

    if (results.patterns.length > 0) {
      output += `Working Patterns (${results.patterns.length}):\n`;
      results.patterns.forEach((p) => {
        output += `  ${p.pattern}\n`;
        if (p.isNonStandard) output += `    [NON-STANDARD] ${p.overrideReason}\n`;
        if (p.whenToUse) output += `    Use when: ${p.whenToUse}\n`;
      });
      output += '\n';
    }

    if (results.annotations.length > 0) {
      output += `Context Annotations (${results.annotations.length}):\n`;
      results.annotations.forEach((a) => {
        output += `  ${a.filePath}: ${a.annotationType}\n`;
        output += `    ${a.notes}\n`;
      });
      output += '\n';
    }

    if (results.impacts.length > 0) {
      output += `Dependency Impacts (${results.impacts.length}):\n`;
      results.impacts.forEach((i) => {
        output += `  ${i.sourceFile} affects ${i.affectedFiles.length} files\n`;
        if (i.mitigationSteps) output += `    Mitigation: ${i.mitigationSteps}\n`;
      });
      output += '\n';
    }

    if (warnings.length > 0) {
      output += `WARNINGS:\n`;
      warnings.forEach((w) => (output += `  ⚠️  ${w}\n`));
      output += '\n';
    }

    if (recommendations.length > 0) {
      output += `RECOMMENDATIONS:\n`;
      recommendations.forEach((r) => (output += `  💡 ${r}\n`));
    }

    return {
      content: [{ type: 'text', text: output }],
      data: results,
    };
  } catch (error) {
    return {
      isError: true,
      content: [
        { type: 'text', text: `Failed to query implementation knowledge: ${error.message}` },
      ],
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
  query_implementation_knowledge: query_implementation_knowledge,
};
