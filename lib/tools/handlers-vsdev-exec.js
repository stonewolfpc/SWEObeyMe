/**
 * Visual Studio Developer Execution Handlers
 * Native command execution within VS Developer environment
 * Handles msbuild, cl.exe, link.exe, and other VS tools
 */

import { createErrorResponse, createSuccessResponse } from '../shared/error-utils.js';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dynamic imports to prevent VS Code URI normalization warnings
const vsdevDetector = await import(pathToFileURL(path.join(__dirname, '..', 'shared', 'vsdev-detector.js')).href);
const vsdevExecutor = await import(pathToFileURL(path.join(__dirname, '..', 'shared', 'vsdev-executor.js')).href);

const {
  isWindows,
} = vsdevDetector;

const {
  executeVsDevCommand,
  executeMsBuild,
  executeClCompile,
  isVsDevTool,
  validateVsCommand,
} = vsdevExecutor;

// Import base handlers for dispatcher
import {
  detectVsHandler,
  detectProjectVsRequirementsHandler,
  getVsEnvironmentHandler,
  listVsVersionsHandler,
} from './handlers-vsdev.js';

/**
 * Execute a VS Developer tool command
 * Automatically sets up VsDevCmd environment before executing
 */
export async function executeVsToolHandler(args) {
  if (!isWindows()) {
    return createErrorResponse(
      'execute_vs_tool',
      new Error('Visual Studio tools only available on Windows'),
      'Platform check',
      {
        guidance: 'Use GCC/Clang on Linux/macOS, or cross-compile with MinGW-w64',
      }
    );
  }

  if (!args.command) {
    return createErrorResponse(
      'execute_vs_tool',
      new Error('command parameter is required. Example: "msbuild MyProject.sln /t:Build"'),
      'Parameter validation'
    );
  }

  // Validate command
  const commandStr = args.command.trim();
  const validation = validateVsCommand(commandStr);

  if (!validation.valid) {
    return createErrorResponse(
      'execute_vs_tool',
      new Error(validation.error),
      'Command validation',
      { guidance: validation.suggestion }
    );
  }

  // Check if it's a VS tool
  if (!isVsDevTool(commandStr)) {
    return createErrorResponse(
      'execute_vs_tool',
      new Error(`"${commandStr.split(/\s+/)[0]}" is not a recognized VS Developer tool`),
      'Tool validation',
      {
        guidance: 'Use detect_vs to see available tools. Common tools: msbuild, cl, link, lib',
      }
    );
  }

  const startTime = Date.now();

  try {
    const result = await executeVsDevCommand(commandStr, {
      version: args.version || '2022',
      timeout: args.timeout || 300000, // 5 min default
      workingDir: args.working_dir || process.cwd(),
      captureOutput: true,
    });

    const duration = Date.now() - startTime;

    if (result.timedOut) {
      return createErrorResponse(
        'execute_vs_tool',
        new Error(`Command timed out after ${args.timeout || 300000}ms`),
        'Execution timeout',
        {
          guidance: 'Increase timeout parameter or check for infinite loops/deadlocks',
          stdout: result.stdout?.substring(0, 5000),
        }
      );
    }

    let message = '=== VS DEVELOPER COMMAND EXECUTION ===\n\n';
    message += `Command: ${commandStr}\n`;
    message += `VS Version: ${result.vsVersion || 'Unknown'}\n`;
    message += `Duration: ${duration}ms\n`;
    message += `Exit Code: ${result.code}\n\n`;

    if (result.stdout) {
      const stdoutTrimmed = result.stdout.length > 50000
        ? result.stdout.substring(0, 50000) + '\n\n[OUTPUT TRUNCATED - 50KB limit]'
        : result.stdout;
      message += `=== STDOUT ===\n${stdoutTrimmed}\n\n`;
    }

    if (result.stderr) {
      const stderrTrimmed = result.stderr.length > 20000
        ? result.stderr.substring(0, 20000) + '\n\n[STDERR TRUNCATED]'
        : result.stderr;
      message += `=== STDERR ===\n${stderrTrimmed}\n\n`;
    }

    message += '=== END EXECUTION ===';

    if (result.success) {
      return createSuccessResponse(message);
    } else {
      return createErrorResponse(
        'execute_vs_tool',
        new Error(`Command failed with exit code ${result.code}`),
        'Command execution',
        { guidance: 'Check STDERR output for compilation errors or missing files' }
      );
    }
  } catch (error) {
    return createErrorResponse(
      'execute_vs_tool',
      error,
      'Executing VS Developer command'
    );
  }
}

/**
 * Build a project using MSBuild
 */
export async function msbuildHandler(args) {
  if (!isWindows()) {
    return createErrorResponse(
      'msbuild',
      new Error('MSBuild only available on Windows'),
      'Platform check'
    );
  }

  if (!args.project_path) {
    return createErrorResponse(
      'msbuild',
      new Error('project_path parameter is required'),
      'Parameter validation'
    );
  }

  try {
    const result = await executeMsBuild(args.project_path, {
      configuration: args.configuration || 'Release',
      platform: args.platform || 'x64',
      target: args.target || 'Build',
      additionalArgs: args.additional_args || [],
      version: args.version || '2022',
      timeout: args.timeout || 600000, // 10 min for builds
    });

    if (result.timedOut) {
      return createErrorResponse(
        'msbuild',
        new Error('Build timed out'),
        'Build timeout',
        { guidance: 'Large projects may need timeout=1200000 (20 min)' }
      );
    }

    let message = '=== MSBUILD RESULTS ===\n\n';
    message += `Project: ${args.project_path}\n`;
    message += `Configuration: ${args.configuration || 'Release'}\n`;
    message += `Platform: ${args.platform || 'x64'}\n`;
    message += `Target: ${args.target || 'Build'}\n`;
    message += `Duration: ${result.duration}ms\n`;
    message += `Exit Code: ${result.code}\n\n`;

    if (result.stdout) {
      // Extract build summary
      const lines = result.stdout.split('\n');
      const errorLines = lines.filter(l => l.includes('error') || l.includes('Error'));
      const warningLines = lines.filter(l => l.includes('warning') || l.includes('Warning'));

      if (errorLines.length > 0) {
        message += `ERRORS (${errorLines.length}):\n${errorLines.slice(0, 20).join('\n')}\n\n`;
      }

      if (warningLines.length > 0) {
        message += `WARNINGS (${warningLines.length}):\n${warningLines.slice(0, 10).join('\n')}\n\n`;
      }

      // Last 50 lines usually have the summary
      message += '=== BUILD OUTPUT (last 50 lines) ===\n';
      message += lines.slice(-50).join('\n');
    }

    message += '\n\n=== END BUILD ===';

    if (result.success) {
      return createSuccessResponse(message);
    } else {
      return createErrorResponse(
        'msbuild',
        new Error(`Build failed with exit code ${result.code}`),
        'MSBuild execution',
        { guidance: 'Check error messages above or run with /v:diag for detailed output' }
      );
    }
  } catch (error) {
    return createErrorResponse('msbuild', error, 'Running MSBuild');
  }
}

/**
 * Compile a C++ file using CL.exe
 */
export async function clCompileHandler(args) {
  if (!isWindows()) {
    return createErrorResponse(
      'cl_compile',
      new Error('CL compiler only available on Windows'),
      'Platform check'
    );
  }

  if (!args.source_file) {
    return createErrorResponse(
      'cl_compile',
      new Error('source_file parameter is required'),
      'Parameter validation'
    );
  }

  try {
    const result = await executeClCompile(args.source_file, {
      outputFile: args.output_file,
      includeDirs: args.include_dirs || [],
      defines: args.defines || [],
      optimization: args.optimization || 'O2',
      cppStandard: args.cpp_standard || 'c++17',
      version: args.version || '2022',
    });

    let message = '=== CL COMPILATION RESULTS ===\n\n';
    message += `Source: ${args.source_file}\n`;
    message += `Duration: ${result.duration}ms\n`;
    message += `Exit Code: ${result.code}\n\n`;

    if (result.stdout) {
      message += `=== OUTPUT ===\n${result.stdout}\n\n`;
    }

    if (result.stderr) {
      message += `=== ERRORS/WARNINGS ===\n${result.stderr}\n\n`;
    }

    message += '=== END COMPILATION ===';

    if (result.success) {
      return createSuccessResponse(message);
    } else {
      return createErrorResponse(
        'cl_compile',
        new Error(`Compilation failed with exit code ${result.code}`),
        'CL compilation'
      );
    }
  } catch (error) {
    return createErrorResponse('cl_compile', error, 'Compiling with CL');
  }
}

/**
 * Dispatcher: vs_dev swiss-army-knife handler
 */
export async function vsDevHandler(params) {
  const { operation, project_path, version, command } = params;

  if (!operation) {
    return createErrorResponse(
      'vs_dev',
      new Error('operation parameter is required (detect, project_requirements, environment, versions, execute, msbuild, cl_compile)'),
      'Parameter validation'
    );
  }

  switch (operation) {
    case 'detect':
      return await detectVsHandler(params);
    case 'project_requirements':
      return await detectProjectVsRequirementsHandler({ project_path });
    case 'environment':
      return await getVsEnvironmentHandler({ version });
    case 'versions':
      return await listVsVersionsHandler();
    case 'execute':
      return await executeVsToolHandler({ command, version, ...params });
    case 'msbuild':
      return await msbuildHandler({ project_path, ...params });
    case 'cl_compile':
      return await clCompileHandler({ source_file: params.source_file, ...params });
    default:
      return createErrorResponse(
        'vs_dev',
        new Error(`Unknown operation: ${operation}. Valid: detect, project_requirements, environment, versions, execute, msbuild, cl_compile`),
        'Operation validation'
      );
  }
}

export const vsDevHandlers = {
  detect_vs: detectVsHandler,
  detect_project_vs_requirements: detectProjectVsRequirementsHandler,
  get_vs_environment: getVsEnvironmentHandler,
  list_vs_versions: listVsVersionsHandler,
  execute_vs_tool: executeVsToolHandler,
  msbuild: msbuildHandler,
  cl_compile: clCompileHandler,
  vs_dev: vsDevHandler,
};

export default vsDevHandlers;
