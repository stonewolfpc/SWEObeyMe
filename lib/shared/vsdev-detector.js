/**
 * Visual Studio Developer Environment Detector
 * Automatically detects installed VS versions, toolchains, and required components
 */

import { execSync, spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { createErrorResponse, createSuccessResponse } from './error-utils.js';

// Known VS versions
export const VS_VERSIONS = {
  '2026': { name: 'Visual Studio 2026', version: '20', year: 2026, minVer: '20.0' },
  '2025': { name: 'Visual Studio 2025', version: '19', year: 2025, minVer: '19.0' },
  '2022': { name: 'Visual Studio 2022', version: '17', year: 2022, minVer: '17.0' },
  '2019': { name: 'Visual Studio 2019', version: '16', year: 2019, minVer: '16.0' },
  '2017': { name: 'Visual Studio 2017', version: '15', year: 2017, minVer: '15.0' },
  '2015': { name: 'Visual Studio 2015', version: '14', year: 2015, minVer: '14.0' },
  '2013': { name: 'Visual Studio 2013', version: '12', year: 2013, minVer: '12.0' },
};

// MSBuild versions
export const MSBUILD_VERSIONS = {
  '2026': '20.0',
  '2025': '19.0',
  '2022': '17.0',
  '2019': '16.0',
  '2017': '15.0',
  '2015': '14.0',
};

// VC Toolset versions
export const VC_TOOLSETS = {
  'v144': { vs: '2026', toolset: '14.4', compiler: '19.4' },
  'v143': { vs: '2022', toolset: '14.3', compiler: '19.3' },
  'v142': { vs: '2019', toolset: '14.2', compiler: '19.2' },
  'v141': { vs: '2017', toolset: '14.1', compiler: '19.1' },
  'v140': { vs: '2015', toolset: '14.0', compiler: '19.0' },
};

/**
 * Detect if running on Windows
 */
export function isWindows() {
  return process.platform === 'win32';
}

/**
 * Check if VSWhere is available (modern VS detection)
 */
export function hasVsWhere() {
  const vsWherePaths = [
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\Installer\\vswhere.exe',
    'C:\\Program Files\\Microsoft Visual Studio\\Installer\\vswhere.exe',
  ];
  
  return vsWherePaths.some(p => existsSync(p));
}

/**
 * Run VSWhere to get installed VS instances
 */
export async function runVsWhere() {
  if (!isWindows()) {
    return { success: false, error: 'VSWhere only available on Windows' };
  }
  
  const vsWherePaths = [
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\Installer\\vswhere.exe',
    'C:\\Program Files\\Microsoft Visual Studio\\Installer\\vswhere.exe',
  ];
  
  const vsWherePath = vsWherePaths.find(p => existsSync(p));
  
  if (!vsWherePath) {
    return { success: false, error: 'VSWhere not found' };
  }
  
  try {
    const result = execSync(
      `"${vsWherePath}" -all -format json -include packages`,
      {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
        windowsHide: true,
        timeout: 30000,
      }
    );
    
    return {
      success: true,
      instances: JSON.parse(result),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Detect installed VS versions by searching common paths
 */
export async function detectVsByPaths() {
  const found = [];
  const basePaths = [
    'C:\\Program Files\\Microsoft Visual Studio',
    'C:\\Program Files (x86)\\Microsoft Visual Studio',
    'D:\\Program Files\\Microsoft Visual Studio',
    'D:\\Program Files (x86)\\Microsoft Visual Studio',
  ];
  
  for (const basePath of basePaths) {
    if (!existsSync(basePath)) continue;
    
    try {
      const editions = ['Community', 'Professional', 'Enterprise', 'Preview', 'BuildTools'];
      
      for (const edition of editions) {
        const editionPath = path.join(basePath, '2026', edition);
        if (existsSync(editionPath)) {
          found.push({
            version: '2026',
            edition,
            path: editionPath,
            detectedBy: 'path',
          });
        }
        
        const vs2022Path = path.join(basePath, '2022', edition);
        if (existsSync(vs2022Path)) {
          found.push({
            version: '2022',
            edition,
            path: vs2022Path,
            detectedBy: 'path',
          });
        }
        
        const vs2019Path = path.join(basePath, '2019', edition);
        if (existsSync(vs2019Path)) {
          found.push({
            version: '2019',
            edition,
            path: vs2019Path,
            detectedBy: 'path',
          });
        }
      }
    } catch {
      // Continue to next base path
    }
  }
  
  return found;
}

/**
 * Detect VS Developer Command Prompt scripts
 */
export async function detectDevCmdScripts() {
  const found = [];
  
  const searchPaths = [
    'C:\\Program Files\\Microsoft Visual Studio\\2026\\Community\\Common7\\Tools\\VsDevCmd.bat',
    'C:\\Program Files\\Microsoft Visual Studio\\2026\\Professional\\Common7\\Tools\\VsDevCmd.bat',
    'C:\\Program Files\\Microsoft Visual Studio\\2026\\Enterprise\\Common7\\Tools\\VsDevCmd.bat',
    'C:\\Program Files\\Microsoft Visual Studio\\2026\\BuildTools\\Common7\\Tools\\VsDevCmd.bat',
    
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\Common7\\Tools\\VsDevCmd.bat',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Professional\\Common7\\Tools\\VsDevCmd.bat',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise\\Common7\\Tools\\VsDevCmd.bat',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\BuildTools\\Common7\\Tools\\VsDevCmd.bat',
    
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Community\\Common7\\Tools\\VsDevCmd.bat',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Professional\\Common7\\Tools\\VsDevCmd.bat',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Enterprise\\Common7\\Tools\\VsDevCmd.bat',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\BuildTools\\Common7\\Tools\\VsDevCmd.bat',
  ];
  
  for (const scriptPath of searchPaths) {
    if (existsSync(scriptPath)) {
      const match = scriptPath.match(/(202\d|201\d)/);
      const edition = scriptPath.match(/(Community|Professional|Enterprise|BuildTools)/)?.[1] || 'Unknown';
      
      found.push({
        version: match ? match[1] : 'Unknown',
        edition,
        scriptPath,
        type: 'DevCmd',
      });
    }
  }
  
  return found;
}

/**
 * Find MSBuild installations
 */
export async function detectMsBuild() {
  const found = [];
  
  const searchPaths = [
    // VS 2026
    'C:\\Program Files\\Microsoft Visual Studio\\2026\\MSBuild\\Current\\Bin\\MSBuild.exe',
    'C:\\Program Files\\Microsoft Visual Studio\\2026\\BuildTools\\MSBuild\\Current\\Bin\\MSBuild.exe',
    
    // VS 2022
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\MSBuild\\Current\\Bin\\MSBuild.exe',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Professional\\MSBuild\\Current\\Bin\\MSBuild.exe',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise\\MSBuild\\Current\\Bin\\MSBuild.exe',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\BuildTools\\MSBuild\\Current\\Bin\\MSBuild.exe',
    
    // VS 2019
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Community\\MSBuild\\Current\\Bin\\MSBuild.exe',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Professional\\MSBuild\\Current\\Bin\\MSBuild.exe',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Enterprise\\MSBuild\\Current\\Bin\\MSBuild.exe',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\BuildTools\\MSBuild\\Current\\Bin\\MSBuild.exe',
    
    // .NET Framework MSBuild
    'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\MSBuild.exe',
    'C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\MSBuild.exe',
  ];
  
  for (const msbuildPath of searchPaths) {
    if (existsSync(msbuildPath)) {
      // Try to get version
      try {
        const version = execSync(`"${msbuildPath}" -version`, {
          encoding: 'utf8',
          windowsHide: true,
          timeout: 10000,
        });
        
        found.push({
          path: msbuildPath,
          version: version.match(/(\d+\.\d+\.\d+\.\d+)/)?.[0] || 'Unknown',
          fullVersion: version,
        });
      } catch {
        found.push({
          path: msbuildPath,
          version: 'Unknown',
        });
      }
    }
  }
  
  return found;
}

/**
 * Detect VC++ compiler (cl.exe)
 */
export async function detectVcCompiler() {
  const found = [];
  
  const searchPaths = [
    // VS 2026
    'C:\\Program Files\\Microsoft Visual Studio\\2026\\Community\\VC\\Tools\\MSVC',
    'C:\\Program Files\\Microsoft Visual Studio\\2026\\Professional\\VC\\Tools\\MSVC',
    'C:\\Program Files\\Microsoft Visual Studio\\2026\\Enterprise\\VC\\Tools\\MSVC',
    'C:\\Program Files\\Microsoft Visual Studio\\2026\\BuildTools\\VC\\Tools\\MSVC',
    
    // VS 2022
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\VC\\Tools\\MSVC',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Professional\\VC\\Tools\\MSVC',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise\\VC\\Tools\\MSVC',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\BuildTools\\VC\\Tools\\MSVC',
    
    // VS 2019
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Community\\VC\\Tools\\MSVC',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Professional\\VC\\Tools\\MSVC',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Enterprise\\VC\\Tools\\MSVC',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\BuildTools\\VC\\Tools\\MSVC',
  ];
  
  for (const msvcBase of searchPaths) {
    if (!existsSync(msvcBase)) continue;
    
    try {
      const versions = await fs.readdir(msvcBase);
      
      for (const version of versions) {
        const clPath = path.join(msvcBase, version, 'bin', 'Hostx64', 'x64', 'cl.exe');
        const clPath32 = path.join(msvcBase, version, 'bin', 'Hostx86', 'x86', 'cl.exe');
        
        if (existsSync(clPath)) {
          found.push({
            version,
            path: clPath,
            arch: 'x64',
          });
        }
        
        if (existsSync(clPath32)) {
          found.push({
            version,
            path: clPath32,
            arch: 'x86',
          });
        }
      }
    } catch {
      // Continue
    }
  }
  
  return found;
}

/**
 * Get environment from VS Developer Prompt
 */
export async function getVsDevEnvironment(version = '2022') {
  const scripts = await detectDevCmdScripts();
  const script = scripts.find(s => s.version === version);
  
  if (!script) {
    return {
      success: false,
      error: `No VS ${version} Developer Command Prompt found`,
    };
  }
  
  // Return info about how to use it
  return {
    success: true,
    version,
    edition: script.edition,
    scriptPath: script.scriptPath,
    usage: `Run: "${script.scriptPath}" to set up environment`,
  };
}

/**
 * Comprehensive VS detection
 */
export async function detectVisualStudio() {
  if (!isWindows()) {
    return {
      success: true,
      isWindows: false,
      message: 'Visual Studio detection only available on Windows',
      alternatives: ['GCC', 'Clang', 'MinGW-w64'],
    };
  }
  
  const results = {
    isWindows: true,
    vsWhere: null,
    byPaths: [],
    devCmdScripts: [],
    msBuild: [],
    vcCompilers: [],
    hasVs2026: false,
    hasVs2022: false,
    hasVs2019: false,
    hasMsBuild: false,
    hasVcCompiler: false,
    bestVersion: null,
    recommendations: [],
  };
  
  // Try VSWhere first
  results.vsWhere = await runVsWhere();
  
  // Search by paths
  results.byPaths = await detectVsByPaths();
  
  // Find DevCmd scripts
  results.devCmdScripts = await detectDevCmdScripts();
  
  // Find MSBuild
  results.msBuild = await detectMsBuild();
  results.hasMsBuild = results.msBuild.length > 0;
  
  // Find VC compilers
  results.vcCompilers = await detectVcCompiler();
  results.hasVcCompiler = results.vcCompilers.length > 0;
  
  // Determine which versions are installed
  const allVersions = new Set([
    ...results.byPaths.map(v => v.version),
    ...results.devCmdScripts.map(v => v.version),
  ]);
  
  results.hasVs2026 = allVersions.has('2026');
  results.hasVs2022 = allVersions.has('2022');
  results.hasVs2019 = allVersions.has('2019');
  
  // Determine best version to use
  if (results.hasVs2026) {
    results.bestVersion = '2026';
  } else if (results.hasVs2022) {
    results.bestVersion = '2022';
  } else if (results.hasVs2019) {
    results.bestVersion = '2019';
  } else if (allVersions.size > 0) {
    results.bestVersion = Array.from(allVersions).sort().pop();
  }
  
  // Generate recommendations
  if (!results.hasMsBuild) {
    results.recommendations.push(
      'Install Build Tools for Visual Studio from: https://visualstudio.microsoft.com/downloads/?q=build+tools'
    );
  }
  
  if (!results.hasVcCompiler && !results.bestVersion) {
    results.recommendations.push(
      'Install Visual Studio Community (free) or Build Tools with C++ workload'
    );
  }
  
  results.success = results.bestVersion !== null || results.hasMsBuild;
  
  return results;
}

/**
 * Detect C++ build requirements from project files
 */
export async function detectProjectCppRequirements(projectPath) {
  const requirements = {
    needsVs2026: false,
    needsVs2022: false,
    needsVs2019: false,
    toolset: null,
    platform: 'x64',
    cppStandard: null,
    needsWindowsSDK: false,
  };
  
  try {
    // Check for .vcxproj
    const vcxprojPath = path.join(projectPath, 'project.vcxproj');
    const vcxprojFiles = (await fs.readdir(projectPath).catch(() => []))
      .filter(f => f.endsWith('.vcxproj'));
    
    for (const projFile of vcxprojFiles) {
      const content = await fs.readFile(path.join(projectPath, projFile), 'utf8').catch(() => '');
      
      // Check for toolset version
      const toolsetMatch = content.match(/<PlatformToolset>(v\d+)<\/PlatformToolset>/);
      if (toolsetMatch) {
        const toolset = toolsetMatch[1];
        requirements.toolset = toolset;
        
        if (VC_TOOLSETS[toolset]) {
          const vsYear = VC_TOOLSETS[toolset].vs;
          if (vsYear === '2026') requirements.needsVs2026 = true;
          if (vsYear === '2022') requirements.needsVs2022 = true;
          if (vsYear === '2019') requirements.needsVs2019 = true;
        }
      }
      
      // Check for Windows SDK
      if (content.includes('<WindowsTargetPlatformVersion>') || 
          content.includes('<TargetPlatformVersion>')) {
        requirements.needsWindowsSDK = true;
      }
      
      // Check for C++ standard
      const cppStdMatch = content.match(/<LanguageStandard>(stdcpplatest|stdcpp\d+)<\/LanguageStandard>/);
      if (cppStdMatch) {
        requirements.cppStandard = cppStdMatch[1];
      }
    }
    
    // Check for CMakeLists.txt
    const cmakePath = path.join(projectPath, 'CMakeLists.txt');
    if (existsSync(cmakePath)) {
      const cmakeContent = await fs.readFile(cmakePath, 'utf8').catch(() => '');
      
      if (cmakeContent.includes('CMAKE_VS_WINDOWS_TARGET_PLATFORM_VERSION') ||
          cmakeContent.includes('WIN32')) {
        requirements.needsWindowsSDK = true;
      }
      
      if (cmakeContent.includes('CMAKE_CXX_STANDARD 23') || 
          cmakeContent.includes('CMAKE_CXX_STANDARD 26')) {
        requirements.needsVs2026 = true;
      } else if (cmakeContent.includes('CMAKE_CXX_STANDARD 20')) {
        requirements.needsVs2022 = true;
      }
    }
    
    // Check for solution file
    const slnFiles = (await fs.readdir(projectPath).catch(() => []))
      .filter(f => f.endsWith('.sln'));
    
    for (const slnFile of slnFiles) {
      const content = await fs.readFile(path.join(projectPath, slnFile), 'utf8').catch(() => '');
      
      // Visual Studio Version line
      const vsVersionMatch = content.match(/VisualStudioVersion = (\d+)\.(\d+)/);
      if (vsVersionMatch) {
        const major = parseInt(vsVersionMatch[1]);
        if (major >= 20) requirements.needsVs2026 = true;
        else if (major >= 17) requirements.needsVs2022 = true;
        else if (major >= 16) requirements.needsVs2019 = true;
      }
      
      // Format version
      const formatMatch = content.match(/Format Version (\d+)\.(\d+)/);
      if (formatMatch) {
        const version = parseFloat(`${formatMatch[1]}.${formatMatch[2]}`);
        if (version >= 12.0) {
          // Could be any modern VS
        }
      }
    }
    
  } catch {
    // Ignore errors
  }
  
  return requirements;
}

/**
 * Get recommended VS version for a project
 */
export async function getRecommendedVsVersion(projectPath) {
  const requirements = await detectProjectCppRequirements(projectPath);
  const installed = await detectVisualStudio();
  
  if (!installed.success) {
    return {
      canBuild: false,
      recommendation: 'Install Visual Studio Build Tools',
      installUrl: 'https://visualstudio.microsoft.com/downloads/?q=build+tools',
      requirements,
    };
  }
  
  // Check if we have the required version
  if (requirements.needsVs2026 && !installed.hasVs2026) {
    return {
      canBuild: installed.hasVs2022, // Can fallback to 2022
      recommendation: 'Project requires VS 2026, but VS 2022 can be used as fallback',
      idealVersion: '2026',
      availableVersion: installed.bestVersion,
      needsUpgrade: true,
    };
  }
  
  if (requirements.needsVs2022 && !installed.hasVs2022 && !installed.hasVs2026) {
    return {
      canBuild: installed.hasVs2019,
      recommendation: 'Project requires VS 2022, but VS 2019 can be used as fallback',
      idealVersion: '2022',
      availableVersion: installed.bestVersion,
      needsUpgrade: true,
    };
  }
  
  return {
    canBuild: true,
    recommendation: `Use VS ${installed.bestVersion}`,
    version: installed.bestVersion,
    devCmd: installed.devCmdScripts.find(s => s.version === installed.bestVersion),
  };
}

/**
 * Generate environment setup command
 */
export async function generateVsEnvironmentCommand(version = null) {
  const installed = await detectVisualStudio();
  
  if (!installed.success) {
    return {
      success: false,
      error: 'No Visual Studio installation detected',
      setupCommands: [],
    };
  }
  
  const targetVersion = version || installed.bestVersion;
  const script = installed.devCmdScripts.find(s => s.version === targetVersion);
  
  if (!script) {
    return {
      success: false,
      error: `No VS ${targetVersion} Developer Command Prompt found`,
      availableVersions: installed.devCmdScripts.map(s => s.version),
    };
  }
  
  return {
    success: true,
    version: targetVersion,
    setupCommands: [
      `call "${script.scriptPath}"`,
      'REM Environment is now configured for MSBuild and VC++',
    ],
    msbuildPath: installed.msBuild.find(m => m.path.includes(targetVersion))?.path,
    vcCompilerPath: installed.vcCompilers[0]?.path,
  };
}

/**
 * List all detected VS installations
 */
export async function listVsInstallations() {
  const installed = await detectVisualStudio();
  
  if (!installed.success) {
    return createErrorResponse(
      'list_vs_installations',
      new Error('No Visual Studio installations detected'),
      'VS Detection',
      {
        guidance: 'Install Visual Studio Build Tools from https://visualstudio.microsoft.com/downloads/',
      }
    );
  }
  
  let message = '=== VISUAL STUDIO DETECTION RESULTS ===\n\n';
  
  message += `Windows Platform: ${installed.isWindows ? 'Yes' : 'No'}\n`;
  message += `VSWhere Available: ${installed.vsWhere?.success ? 'Yes' : 'No'}\n\n`;
  
  if (installed.bestVersion) {
    message += `RECOMMENDED VERSION: VS ${installed.bestVersion}\n\n`;
  }
  
  if (installed.byPaths.length > 0) {
    message += '=== DETECTED BY PATHS ===\n';
    for (const vs of installed.byPaths) {
      message += `  VS ${vs.version} ${vs.edition}: ${vs.path}\n`;
    }
    message += '\n';
  }
  
  if (installed.devCmdScripts.length > 0) {
    message += '=== DEVELOPER COMMAND PROMPTS ===\n';
    for (const cmd of installed.devCmdScripts) {
      message += `  VS ${cmd.version} ${cmd.edition}:\n`;
      message += `    ${cmd.scriptPath}\n`;
    }
    message += '\n';
  }
  
  if (installed.msBuild.length > 0) {
    message += '=== MSBUILD INSTANCES ===\n';
    for (const msb of installed.msBuild.slice(0, 3)) {
      message += `  ${msb.version}: ${msb.path}\n`;
    }
    message += '\n';
  }
  
  if (installed.vcCompilers.length > 0) {
    message += '=== VC++ COMPILERS ===\n';
    const latest = installed.vcCompilers[0];
    message += `  Latest: ${latest.version} (${latest.arch})\n`;
    message += `  Path: ${latest.path}\n`;
    message += '\n';
  }
  
  if (installed.recommendations.length > 0) {
    message += '=== RECOMMENDATIONS ===\n';
    for (const rec of installed.recommendations) {
      message += `  - ${rec}\n`;
    }
  }
  
  message += '\n=== END DETECTION ===';
  
  return createSuccessResponse(message);
}

export default {
  detectVisualStudio,
  detectProjectCppRequirements,
  getRecommendedVsVersion,
  generateVsEnvironmentCommand,
  listVsInstallations,
  VS_VERSIONS,
  VC_TOOLSETS,
};
