/**
 * Visual Studio Developer Environment Handler
 * Provides tools to detect, analyze, and configure VS environments
 */

import { createErrorResponse, createSuccessResponse } from '../shared/error-utils.js';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dynamic imports to prevent VS Code URI normalization warnings
const vsdevDetector = await import(pathToFileURL(path.join(__dirname, '..', 'shared', 'vsdev-detector.js')).href);
const vsdevExecutor = await import(pathToFileURL(path.join(__dirname, '..', 'shared', 'vsdev-executor.js')).href);

const {
  detectVisualStudio,
  detectProjectCppRequirements,
  getRecommendedVsVersion,
  generateVsEnvironmentCommand,
  listVsInstallations,
  VS_VERSIONS,
  VC_TOOLSETS,
  isWindows,
} = vsdevDetector;

const {
  executeVsDevCommand,
  executeMsBuild,
  executeClCompile,
  getVsEnvironmentVars,
  isVsDevTool,
  validateVsCommand,
} = vsdevExecutor;

/**
 * Detect all Visual Studio installations
 */
export async function detectVsHandler(args = {}) {
  if (!isWindows()) {
    return createSuccessResponse(
      '=== VISUAL STUDIO DETECTION ===\n\n' +
      'Platform: Not Windows\n\n' +
      'Visual Studio is Windows-only. Alternative toolchains:\n' +
      '  - GCC/G++ (Linux/macOS)\n' +
      '  - Clang (Cross-platform)\n' +
      '  - MinGW-w64 (Windows GCC on Linux)\n\n' +
      'Use detect_project_type to find build system.'
    );
  }

  try {
    const result = await detectVisualStudio();

    let message = '=== VISUAL STUDIO DETECTION RESULTS ===\n\n';

    if (!result.success) {
      message += 'STATUS: No Visual Studio detected\n\n';
      message += 'INSTALLATION REQUIRED:\n';
      message += '  Download: https://visualstudio.microsoft.com/downloads/\n';
      message += '  Recommended: Build Tools for Visual Studio (free)\n';
      message += '  Components needed:\n';
      message += '    - C++ build tools\n';
      message += '    - Windows SDK\n';
      message += '    - CMake tools (optional)\n\n';

      return createErrorResponse(
        'detect_vs',
        new Error('No Visual Studio installation found'),
        'VS Detection',
        {
          expected: true,
          guidance: 'Install VS Build Tools from https://visualstudio.microsoft.com/downloads/',
        }
      );
    }

    message += 'STATUS: Visual Studio detected\n\n';

    if (result.bestVersion) {
      message += `RECOMMENDED VERSION: VS ${result.bestVersion}\n\n`;
    }

    // List all found versions
    const foundVersions = new Set([
      ...result.byPaths.map(v => v.version),
      ...result.devCmdScripts.map(v => v.version),
    ]);

    if (foundVersions.size > 0) {
      message += '=== FOUND VERSIONS ===\n';
      for (const ver of Array.from(foundVersions).sort().reverse()) {
        const info = VS_VERSIONS[ver];
        const devCmd = result.devCmdScripts.find(s => s.version === ver);
        const byPath = result.byPaths.find(p => p.version === ver);

        message += `  VS ${ver}: `;
        if (devCmd) message += `${devCmd.edition} edition`;
        else if (byPath) message += `${byPath.edition} edition`;
        else message += 'Detected';
        message += '\n';

        if (info) {
          message += `    Toolset: v${info.version}0, Compiler: 19.${info.version}\n`;
        }
      }
      message += '\n';
    }

    // MSBuild info
    if (result.msBuild.length > 0) {
      message += '=== MSBUILD ===\n';
      for (const msb of result.msBuild.slice(0, 3)) {
        message += `  ${msb.version || 'Unknown version'}:\n`;
        message += `    ${msb.path}\n`;
      }
      message += '\n';
    }

    // VC++ Compiler info
    if (result.vcCompilers.length > 0) {
      message += '=== VC++ COMPILER ===\n';
      const latest = result.vcCompilers[0];
      message += `  Version: ${latest.version}\n`;
      message += `  Architecture: ${latest.arch}\n`;
      message += `  Path: ${latest.path}\n`;
      message += '\n';
    }

    // Usage info
    message += '=== USAGE ===\n';
    message += 'To set up environment:\n';
    if (result.bestVersion) {
      const script = result.devCmdScripts.find(s => s.version === result.bestVersion);
      if (script) {
        message += `  call "${script.scriptPath}"\n`;
      }
    }
    message += '\n';
    message += 'For project-specific detection:\n';
    message += '  Use detect_project_vs_requirements with project_path\n\n';

    message += '=== END DETECTION ===';

    return createSuccessResponse(message);
  } catch (error) {
    return createErrorResponse('detect_vs', error, 'Visual Studio detection');
  }
}

/**
 * Detect VS requirements for a specific project
 */
export async function detectProjectVsRequirementsHandler(args) {
  if (!args.project_path) {
    return createErrorResponse(
      'detect_project_vs_requirements',
      new Error('project_path parameter is required'),
      'Parameter validation'
    );
  }

  if (!isWindows()) {
    return createSuccessResponse(
      '=== PROJECT VS REQUIREMENTS ===\n\n' +
      'Platform: Not Windows\n' +
      `Project: ${args.project_path}\n\n` +
      'Note: Visual Studio is Windows-only.\n' +
      'This project may use CMake, Make, or other cross-platform build system.\n' +
      'Use detect_project_type for build system analysis.'
    );
  }

  try {
    const requirements = await detectProjectCppRequirements(args.project_path);
    const installed = await detectVisualStudio();
    const recommendation = await getRecommendedVsVersion(args.project_path);

    let message = '=== PROJECT VS REQUIREMENTS ===\n\n';
    message += `Project: ${args.project_path}\n\n`;

    // Detected requirements
    message += '=== DETECTED REQUIREMENTS ===\n';

    if (requirements.toolset) {
      message += `Platform Toolset: ${requirements.toolset}\n`;
      const toolsetInfo = VC_TOOLSETS[requirements.toolset];
      if (toolsetInfo) {
        message += `  Maps to: VS ${toolsetInfo.vs}\n`;
        message += `  MSVC Toolset: ${toolsetInfo.toolset}\n`;
        message += `  Compiler: ${toolsetInfo.compiler}\n`;
      }
    }

    if (requirements.cppStandard) {
      message += `C++ Standard: ${requirements.cppStandard}\n`;
    }

    if (requirements.needsWindowsSDK) {
      message += 'Windows SDK: Required\n';
    }

    message += `Target Platform: ${requirements.platform}\n`;
    message += '\n';

    // Recommendation
    message += '=== RECOMMENDATION ===\n';
    if (recommendation.canBuild) {
      message += 'Can Build: YES\n';
      message += `Use: ${recommendation.recommendation}\n`;

      if (recommendation.devCmd) {
        message += '\nSetup command:\n';
        message += `  call "${recommendation.devCmd.scriptPath}"\n`;
      }
    } else {
      message += 'Can Build: NO\n';
      message += `Issue: ${recommendation.recommendation}\n\n`;

      if (recommendation.needsUpgrade) {
        message += `Required: VS ${recommendation.idealVersion}\n`;
        message += `Available: VS ${recommendation.availableVersion}\n`;
        message += '\nOptions:\n';
        message += '  1. Install required VS version\n';
        message += '  2. Modify project to use available toolset\n';
        message += '  3. Use vcpkg or Conan for dependencies\n';
      } else {
        message += `Action: ${recommendation.recommendation}\n`;
        if (recommendation.installUrl) {
          message += `Download: ${recommendation.installUrl}\n`;
        }
      }
    }

    message += '\n=== END ANALYSIS ===';

    return createSuccessResponse(message);
  } catch (error) {
    return createErrorResponse(
      'detect_project_vs_requirements',
      error,
      `Analyzing project: ${args.project_path}`
    );
  }
}

/**
 * Get environment setup command for a specific VS version
 */
export async function getVsEnvironmentHandler(args) {
  const version = args.version || null;

  if (!isWindows()) {
    return createErrorResponse(
      'get_vs_environment',
      new Error('Visual Studio environment only available on Windows'),
      'Platform check',
      {
        guidance: 'Use GCC/Clang on Linux/macOS, or install MinGW-w64',
      }
    );
  }

  try {
    const result = await generateVsEnvironmentCommand(version);

    if (!result.success) {
      return createErrorResponse(
        'get_vs_environment',
        new Error(result.error),
        'Environment generation',
        {
          guidance: result.availableVersions
            ? `Available versions: ${result.availableVersions.join(', ')}`
            : 'Run detect_vs to find installed versions',
        }
      );
    }

    let message = '=== VISUAL STUDIO ENVIRONMENT ===\n\n';
    message += `Version: VS ${result.version}\n\n`;
    message += '=== SETUP COMMANDS ===\n';
    for (const cmd of result.setupCommands) {
      message += `${cmd}\n`;
    }

    if (result.msbuildPath) {
      message += `\nMSBuild: ${result.msbuildPath}\n`;
    }

    if (result.vcCompilerPath) {
      message += `VC++ Compiler: ${result.vcCompilerPath}\n`;
    }

    message += '\n=== USAGE ===\n';
    message += '1. Open Command Prompt\n';
    message += '2. Run the setup command above\n';
    message += '3. Use msbuild or cl as needed\n';
    message += '\nFor PowerShell:\n';
    message += '  & "path\\to\\VsDevCmd.bat"\n';
    message += '\n=== END ENVIRONMENT ===';

    return createSuccessResponse(message);
  } catch (error) {
    return createErrorResponse('get_vs_environment', error, 'Getting VS environment');
  }
}

/**
 * List all supported VS versions and toolsets
 */
export async function listVsVersionsHandler() {
  let message = '=== VISUAL STUDIO VERSIONS ===\n\n';

  message += '=== SUPPORTED VERSIONS ===\n';
  for (const [year, info] of Object.entries(VS_VERSIONS).reverse()) {
    message += `  VS ${year}: `;
    message += `v${info.version} (Compiler 19.${info.version})\n`;
  }

  message += '\n=== PLATFORM TOOLSETS ===\n';
  for (const [toolset, info] of Object.entries(VC_TOOLSETS).reverse()) {
    message += `  ${toolset}: VS ${info.vs}, MSVC ${info.toolset}\n`;
  }

  message += '\n=== END VERSIONS ===';

  return createSuccessResponse(message);
}

// Re-export execution handlers from separate module
export {
  executeVsToolHandler,
  msbuildHandler,
  clCompileHandler,
} from './handlers-vsdev-exec.js';

// Re-export dispatcher and handlers object
export { vsDevHandler, vsDevHandlers } from './handlers-vsdev-exec.js';
