/**
 * Language Bridge Manager
 * 
 * Manages C# and C++ error detection diagnostics
 * Works ON TOP OF Windsurf's default language servers
 * Does NOT replace or override - ADDS additional diagnostics
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { pathToFileURL } from 'url';

const toFileUrl = (p) => {
  try {
    return pathToFileURL(p).href;
  } catch (e) {
    if (process.platform === 'win32' && path.isAbsolute(p)) {
      const normalized = p.replace(/\\/g, '/');
      return `file:///${normalized}`;
    }
    const absolutePath = path.isAbsolute(p) ? p : path.resolve(p);
    return `file://${absolutePath}`;
  }
};

// Map bridge severity to VS Code diagnostic severity
function mapSeverityToDiagnostic(severity, color) {
  if (severity === 2 || color === 'red') {
    return vscode.DiagnosticSeverity.Error;
  } else if (severity === 1 || color === 'orange' || color === 'magenta' || color === 'purple') {
    return vscode.DiagnosticSeverity.Warning;
  } else {
    return vscode.DiagnosticSeverity.Information;
  }
}

// Analyze C# file and update diagnostics
export async function updateCSharpDiagnostics(document, diagnosticCollection, __dirname) {
  const filePath = document.uri.fsPath;
  const config = vscode.workspace.getConfiguration('sweObeyMe.csharpBridge');

  if (!config.get('enabled')) {
    diagnosticCollection.delete(document.uri);
    return;
  }

  try {
    const csharpBridgePath = path.join(__dirname, 'lib', 'csharp-bridge.js');
    const { analyzeCSharpFile } = await import(toFileUrl(csharpBridgePath));

    const analysis = await analyzeCSharpFile(filePath);
    const severityThreshold = config.get('severityThreshold', 1); // Default to WARNING level

    if (!analysis || !analysis.errors) {
      diagnosticCollection.delete(document.uri);
      return;
    }

    const diagnostics = [];
    for (const error of analysis.errors) {
      if (error.severity < severityThreshold) continue;

      const lineRanges = error.lineRanges || [{ startLine: 1, endLine: 1 }];
      for (const range of lineRanges) {
        const startLine = Math.max(0, range.startLine - 1);
        const endLine = Math.max(0, range.endLine - 1);

        const range_ = new vscode.Range(
          new vscode.Position(startLine, 0),
          new vscode.Position(endLine, document.lineCount > endLine ? document.lineAt(endLine).text.length : 0),
        );

        const diagnosticSeverity = mapSeverityToDiagnostic(error.severity, error.color);
        const diagnostic = new vscode.Diagnostic(
          range_,
          `[SWEObeyMe] ${error.name}: ${error.details || 'See details'}`,
          diagnosticSeverity,
        );

        diagnostic.source = 'SWEObeyMe C# Bridge';
        diagnostic.code = error.id;
        diagnostics.push(diagnostic);
      }
    }

    // Get Monaco's native diagnostics (from clangd/Roslyn)
    const nativeDiagnostics = vscode.languages.getDiagnostics(document.uri);
    
    // Filter out our own diagnostics to avoid duplicates
    const nativeOnly = nativeDiagnostics.filter(d => d.source !== 'SWEObeyMe C# Bridge');
    
    // Merge native diagnostics with our custom diagnostics
    const mergedDiagnostics = [...nativeOnly, ...diagnostics];

    // Set merged diagnostics
    diagnosticCollection.set(document.uri, mergedDiagnostics);
  } catch (error) {
    console.error(`[C# Bridge] Failed to analyze ${filePath}:`, error);
    diagnosticCollection.delete(document.uri);
  }
}

// Analyze C++ file and update diagnostics
export async function updateCppDiagnostics(document, diagnosticCollection, __dirname) {
  const filePath = document.uri.fsPath;
  const config = vscode.workspace.getConfiguration('sweObeyMe.cppBridge');

  // C++ bridge disabled by default to prevent false positives from affecting users
  // Users must explicitly enable it via settings
  const enabled = config.get('enabled', false);

  // If disabled, preserve native diagnostics only (no custom diagnostics)
  if (!enabled) {
    const nativeDiagnostics = vscode.languages.getDiagnostics(document.uri);
    const nativeOnly = nativeDiagnostics.filter(d => d.source !== 'SWEObeyMe C++ Bridge');
    diagnosticCollection.set(document.uri, nativeOnly);
    return;
  }

  try {
    const cppBridgePath = path.join(__dirname, 'lib', 'cpp-bridge.js');
    const { analyzeCppFile } = await import(toFileUrl(cppBridgePath));

    const analysisConfig = {
      severityThreshold: config.get('severityThreshold', 2), // Default to ERROR level to reduce noise
      confidenceThreshold: config.get('confidenceThreshold', 75), // Higher confidence threshold to reduce false positives
      useClangTidy: config.get('useClangTidy', false),
      useCppcheck: config.get('useCppcheck', false),
      deduplicateAlerts: config.get('deduplicateAlerts', true),
      alertCooldown: config.get('alertCooldown', 30),
      detectors: config.get('detectors', {}),
    };

    const analysis = await analyzeCppFile(filePath, analysisConfig);

    if (!analysis || !analysis.errors) {
      diagnosticCollection.delete(document.uri);
      return;
    }

    const diagnostics = [];
    for (const error of analysis.errors) {
      const lineRanges = error.lineRanges || [{ startLine: 1, endLine: 1 }];
      for (const range of lineRanges) {
        const startLine = Math.max(0, range.startLine - 1);
        const endLine = Math.max(0, range.endLine - 1);

        const range_ = new vscode.Range(
          new vscode.Position(startLine, 0),
          new vscode.Position(endLine, document.lineCount > endLine ? document.lineAt(endLine).text.length : 0),
        );

        const diagnosticSeverity = mapSeverityToDiagnostic(error.severity, error.color);
        
        // Include tool source in message for clarity
        const toolSource = error.source ? ` (${error.source})` : '';
        const diagnostic = new vscode.Diagnostic(
          range_,
          `[SWEObeyMe${toolSource}] ${error.name}: ${typeof error.details === 'object' ? JSON.stringify(error.details) : error.details || 'See details'}`,
          diagnosticSeverity,
        );

        diagnostic.source = 'SWEObeyMe C++ Bridge';
        diagnostic.code = error.id;
        diagnostics.push(diagnostic);
      }
    }

    // Get Monaco's native diagnostics (from clangd)
    const nativeDiagnostics = vscode.languages.getDiagnostics(document.uri);
    
    // Filter out our own diagnostics to avoid duplicates
    const nativeOnly = nativeDiagnostics.filter(d => d.source !== 'SWEObeyMe C++ Bridge');
    
    // Merge native diagnostics with our custom diagnostics
    const mergedDiagnostics = [...nativeOnly, ...diagnostics];

    // Set merged diagnostics
    diagnosticCollection.set(document.uri, mergedDiagnostics);
    
    // [REMOVED BY SWEObeyMe]: Forbidden Pattern(`[C++ Bridge] Added ${diagnostics.length} custom diagnostics for ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`[C++ Bridge] Failed to analyze ${filePath}:`, error);
    diagnosticCollection.delete(document.uri);
  }
}

// Setup file watchers for both C# and C++
export function setupLanguageBridges(context, __dirname) {
  // Create diagnostic collections (separate from Windsurf's)
  const csharpDiagnosticCollection = vscode.languages.createDiagnosticCollection('sweObeyMe-csharp');
  const cppDiagnosticCollection = vscode.languages.createDiagnosticCollection('sweObeyMe-cpp');
  
  context.subscriptions.push(csharpDiagnosticCollection);
  context.subscriptions.push(cppDiagnosticCollection);

  // Store native Monaco diagnostics for merging
  const nativeCSharpDiagnostics = new Map();
  const nativeCppDiagnostics = new Map();

  // Listen to Monaco's native diagnostics for C#
  const csharpDiagnosticsListener = vscode.languages.onDidChangeDiagnostics((e) => {
    for (const uri of e.uris) {
      if (uri.scheme === 'file') {
        const diagnostics = vscode.languages.getDiagnostics(uri);
        nativeCSharpDiagnostics.set(uri.toString(), diagnostics);
      }
    }
  });
  context.subscriptions.push(csharpDiagnosticsListener);

  // Listen to Monaco's native diagnostics for C++
  const cppDiagnosticsListener = vscode.languages.onDidChangeDiagnostics((e) => {
    for (const uri of e.uris) {
      if (uri.scheme === 'file') {
        const diagnostics = vscode.languages.getDiagnostics(uri);
        nativeCppDiagnostics.set(uri.toString(), diagnostics);
      }
    }
  });
  context.subscriptions.push(cppDiagnosticsListener);

  // Watch C# files
  const csharpFileWatcher = vscode.workspace.onDidSaveTextDocument(async (document) => {
    if (document.languageId === 'csharp' && document.uri.scheme === 'file' && !document.uri.fsPath.includes('node_modules')) {
      await updateCSharpDiagnostics(document, csharpDiagnosticCollection, __dirname);
    }
  });
  context.subscriptions.push(csharpFileWatcher);

  // Watch C++ files
  const cppFileWatcher = vscode.workspace.onDidSaveTextDocument(async (document) => {
    if (['cpp', 'c', 'cuda-cpp'].includes(document.languageId) && document.uri.scheme === 'file' && !document.uri.fsPath.includes('node_modules')) {
      await updateCppDiagnostics(document, cppDiagnosticCollection, __dirname);
    }
  });
  context.subscriptions.push(cppFileWatcher);

  // Initial scan for existing files
  scanExistingFiles(__dirname, csharpDiagnosticCollection, cppDiagnosticCollection);

  return {
    csharpDiagnosticCollection,
    cppDiagnosticCollection,
  };
}

// Scan existing files on activation
async function scanExistingFiles(__dirname, csharpDiagnosticCollection, cppDiagnosticCollection) {
  if (!vscode.workspace.workspaceFolders) return;

  // Scan C# files
  try {
    const csharpFiles = await vscode.workspace.findFiles('**/*.cs', '**/node_modules/**', 100);
    for (const file of csharpFiles) {
      try {
        const document = await vscode.workspace.openTextDocument(file);
        await updateCSharpDiagnostics(document, csharpDiagnosticCollection, __dirname);
      } catch (e) {
        // Skip files that can't be opened
      }
    }
  } catch (e) {
    // [REMOVED BY SWEObeyMe]: Forbidden Pattern('[Language Bridge] No C# files found or error scanning:', e.message);
  }

  // Scan C++ files
  try {
    const cppPatterns = ['**/*.cpp', '**/*.cc', '**/*.cxx', '**/*.hpp', '**/*.h', '**/*.c'];
    for (const pattern of cppPatterns) {
      const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 50);
      for (const file of files) {
        try {
          const document = await vscode.workspace.openTextDocument(file);
          await updateCppDiagnostics(document, cppDiagnosticCollection, __dirname);
        } catch (e) {
          // Skip files that can't be opened
        }
      }
    }
  } catch (e) {
    // [REMOVED BY SWEObeyMe]: Forbidden Pattern('[Language Bridge] No C++ files found or error scanning:', e.message);
  }
}

export default {
  setupLanguageBridges,
  updateCSharpDiagnostics,
  updateCppDiagnostics,
};
