/**
 * Visual Studio Developer Command Executor
 * Executes commands within the VS Developer environment (MSBuild, CL, LINK, etc.)
 * Safely handles VsDevCmd.bat setup before running user commands
 */

import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { createErrorResponse, createSuccessResponse } from './error-utils.js';
import { detectVisualStudio, detectDevCmdScripts } from './vsdev-detector.js';

// Default timeout for VS commands (5 minutes for builds)
const DEFAULT_TIMEOUT = 300000;
const SHORT_TIMEOUT = 30000;

/**
 * Check if a command is a VS Developer tool
 */
export function isVsDevTool(command) {
  // Handle null, undefined, non-string inputs
  if (command === null || command === undefined || typeof command !== 'string') {
    return false;
  }
  
  const vsTools = [
    'msbuild', 'cl', 'link', 'lib', 'dumpbin', 'editbin', 'nmake',
    'devenv', 'vstest.console', 'tf', 'tf.cmd', 'tf.exe',
    'csc', 'vbc', 'fsc', 'al', 'aximp', 'tlbimp', 'tlbexp',
    'midl', 'rc', 'mc', 'mt', 'cvtres', 'bcc', 'bscmake',
    'mage', 'mageui', 'peverify', 'sn', 'gacutil', 'ngen',
    'cordbg', 'ildasm', 'ilasm', 'wsdl', 'xsd', 'discover',
    'soap', 'soapsuds', 'sqlmetal', 'svcutil', 'svcconfigeditor',
    'installutil', 'jsc', 'lc', 'btstask', 'mssqlbindingimport',
    'wca', 'mageui.exe', 'mage.exe', 'makecert', 'certmgr',
    'chktrust', 'setreg', 'cert2spc', 'pvkimprt', 'signcode',
    'spcverify', 'chktrust.exe', 'signtool', 'makecat', 'cat',
  ];
  
  const cmdLower = command.toLowerCase().trim();
  const firstWord = cmdLower.split(/\s+/)[0];
  
  return vsTools.some(tool => 
    firstWord === tool || 
    firstWord === `${tool}.exe` ||
    firstWord.endsWith(`/${tool}`) ||
    firstWord.endsWith(`\\${tool}`)
  );
}

/**
 * Find the appropriate VsDevCmd.bat for a VS version
 */
export async function findVsDevCmd(version = '2022') {
  const scripts = await detectDevCmdScripts();
  
  // Exact match
  let script = scripts.find(s => s.version === version);
  
  // Fallback to newer versions
  if (!script && version === '2022') {
    script = scripts.find(s => s.version === '2026');
  }
  if (!script && version === '2019') {
    script = scripts.find(s => ['2022', '2026'].includes(s.version));
  }
  
  // Any available version
  if (!script && scripts.length > 0) {
    script = scripts.sort((a, b) => (b.version > a.version ? 1 : -1))[0];
  }
  
  return script || null;
}

/**
 * Execute a command within the VS Developer environment
 * Uses cmd.exe /k to run VsDevCmd.bat then execute the command
 */
export async function executeVsDevCommand(command, options = {}) {
  const {
    version = '2022',
    timeout = DEFAULT_TIMEOUT,
    workingDir = process.cwd(),
    env = {},
    captureOutput = true,
  } = options;
  
  // Validate this is a VS tool
  if (!isVsDevTool(command)) {
    return {
      success: false,
      error: `Command "${command.split(/\s+/)[0]}" is not a recognized Visual Studio tool. ` +
             `Use detect_vs to see available tools or run a standard shell command.`,
      suggestion: 'For non-VS commands, use a regular terminal or shell tool.',
    };
  }
  
  // Find the VS Developer Command Prompt
  const devCmd = await findVsDevCmd(version);
  
  if (!devCmd) {
    return {
      success: false,
      error: `No Visual Studio ${version} Developer Command Prompt found.`,
      suggestion: 'Install Visual Studio Build Tools or run detect_vs to find available versions.',
    };
  }
  
  // Build the command sequence
  // Use cmd.exe with /k to keep environment after VsDevCmd, then execute user command
  const cmdScript = `@echo off
call "${devCmd.scriptPath}" >nul 2>&1
if %errorlevel% neq 0 (
  echo ERROR: Failed to initialize VS Developer environment
  exit /b 1
)
${command}
exit /b %errorlevel%`;
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let killed = false;
    
    // Spawn cmd.exe with the script
    const child = spawn('cmd.exe', ['/c', cmdScript], {
      cwd: workingDir,
      env: { ...process.env, ...env },
      windowsHide: true,
    });
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      killed = true;
      child.kill('SIGTERM');
      
      // Force kill after 5 seconds if still running
      setTimeout(() => {
        try {
          child.kill('SIGKILL');
        } catch {}
      }, 5000);
    }, timeout);
    
    // Capture stdout
    if (captureOutput && child.stdout) {
      child.stdout.on('data', (data) => {
        stdout += data.toString('utf8');
        
        // Prevent memory explosion on huge output
        if (stdout.length > 10 * 1024 * 1024) { // 10MB max
          stdout = stdout.substring(0, 10 * 1024 * 1024) + 
            '\n\n[OUTPUT TRUNCATED: Exceeded 10MB limit]\n';
          child.kill('SIGTERM');
        }
      });
    }
    
    // Capture stderr
    if (captureOutput && child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data.toString('utf8');
      });
    }
    
    // Handle completion
    child.on('close', (code, signal) => {
      clearTimeout(timeoutId);
      
      const duration = Date.now() - startTime;
      
      if (killed && signal === 'SIGTERM') {
        resolve({
          success: false,
          error: `Command timed out after ${timeout}ms`,
          stdout: stdout.substring(0, 100000),
          stderr: stderr.substring(0, 100000),
          duration,
          timedOut: true,
        });
        return;
      }
      
      resolve({
        success: code === 0,
        code,
        stdout,
        stderr,
        duration,
        vsVersion: devCmd.version,
        vsEdition: devCmd.edition,
      });
    });
    
    // Handle spawn errors
    child.on('error', (error) => {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        error: `Failed to spawn command: ${error.message}`,
        stdout: '',
        stderr: error.message,
        duration: Date.now() - startTime,
      });
    });
  });
}

/**
 * Execute MSBuild with project-specific detection
 */
export async function executeMsBuild(projectPath, options = {}) {
  const {
    configuration = 'Release',
    platform = 'x64',
    target = 'Build',
    additionalArgs = [],
    version = '2022',
    timeout = DEFAULT_TIMEOUT,
  } = options;
  
  // Find the project file
  let projectFile = projectPath;
  
  if (!projectPath.endsWith('.sln') && !projectPath.endsWith('.vcxproj')) {
    // Try to find solution or project file
    try {
      const files = await fs.readdir(projectPath);
      const sln = files.find(f => f.endsWith('.sln'));
      const vcxproj = files.find(f => f.endsWith('.vcxproj'));
      
      if (sln) {
        projectFile = path.join(projectPath, sln);
      } else if (vcxproj) {
        projectFile = path.join(projectPath, vcxproj);
      } else {
        return {
          success: false,
          error: `No .sln or .vcxproj file found in ${projectPath}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Cannot read directory ${projectPath}: ${error.message}`,
      };
    }
  }
  
  // Build MSBuild command
  const args = [
    `"${projectFile}"`,
    `/t:${target}`,
    `/p:Configuration=${configuration}`,
    `/p:Platform=${platform}`,
    '/m', // Parallel builds
    '/v:normal', // Verbosity
    ...additionalArgs,
  ];
  
  const command = `msbuild ${args.join(' ')}`;
  
  return await executeVsDevCommand(command, {
    version,
    timeout,
    workingDir: path.dirname(projectFile),
  });
}

/**
 * Compile a single C++ file using CL.exe
 */
export async function executeClCompile(sourceFile, options = {}) {
  const {
    outputFile = null,
    includeDirs = [],
    defines = [],
    optimization = 'O2',
    cppStandard = 'c++17',
    version = '2022',
    timeout = SHORT_TIMEOUT,
  } = options;
  
  // Build output filename if not specified
  const outFile = outputFile || sourceFile.replace(/\.cpp$/, '.obj').replace(/\.c$/, '.obj');
  
  // Build CL command
  const args = [
    `/nologo`,
    `/${optimization}`,
    `/std:${cppStandard}`,
    `/EHsc`, // Enable C++ exceptions
    `/W3`, // Warning level 3
    `/c`, // Compile only, no link
    `/Fo"${outFile}"`,
    ...includeDirs.map(d => `/I"${d}"`),
    ...defines.map(d => `/D${d}`),
    `"${sourceFile}"`,
  ];
  
  const command = `cl ${args.join(' ')}`;
  
  return await executeVsDevCommand(command, {
    version,
    timeout,
    workingDir: path.dirname(sourceFile),
  });
}

/**
 * Get VS environment variables without running a command
 * Useful for setting up the environment for other tools
 */
export async function getVsEnvironmentVars(version = '2022') {
  const devCmd = await findVsDevCmd(version);
  
  if (!devCmd) {
    return {
      success: false,
      error: `No VS ${version} Developer Command Prompt found`,
    };
  }
  
  // Run VsDevCmd and dump environment
  const cmdScript = `@echo off
call "${devCmd.scriptPath}" >nul 2>&1
set`;
  
  return new Promise((resolve) => {
    const child = spawn('cmd.exe', ['/c', cmdScript], {
      windowsHide: true,
    });
    
    let output = '';
    let timeoutId = setTimeout(() => {
      child.kill('SIGTERM');
    }, 10000);
    
    child.stdout.on('data', (data) => {
      output += data.toString('utf8');
    });
    
    child.on('close', (code) => {
      clearTimeout(timeoutId);
      
      // Parse environment variables
      const env = {};
      const lines = output.split('\n');
      
      for (const line of lines) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          // Only include VS-related vars to avoid clutter
          if (key.startsWith('VS') || 
              key.startsWith('VC') || 
              key.startsWith('MSBuild') ||
              key.startsWith('LIB') ||
              key.startsWith('INCLUDE') ||
              key.includes('VisualStudio') ||
              key.includes('VCTools')) {
            env[key] = value;
          }
        }
      }
      
      resolve({
        success: code === 0,
        variables: env,
        vsVersion: devCmd.version,
        vsEdition: devCmd.edition,
        scriptPath: devCmd.scriptPath,
      });
    });
    
    child.on('error', (error) => {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        error: error.message,
      });
    });
  });
}

/**
 * Safe command validator - prevents dangerous operations
 */
export function validateVsCommand(command) {
  const dangerousPatterns = [
    /rm\s+-rf/i,
    /del\s+\/f/i,
    /format\s+/i,
    />[\s]*[a-z]:/i, // Direct drive access
    /reg\s+delete/i,
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      return {
        valid: false,
        error: `Command contains potentially dangerous pattern: ${pattern}`,
        suggestion: 'Remove dangerous operations from command.',
      };
    }
  }
  
  return { valid: true };
}

export default {
  executeVsDevCommand,
  executeMsBuild,
  executeClCompile,
  getVsEnvironmentVars,
  isVsDevTool,
  validateVsCommand,
  findVsDevCmd,
};
