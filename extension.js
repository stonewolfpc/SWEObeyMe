const vscode = require('vscode');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

function activate(context) {
    console.log('SWEObeyMe extension activated');

    // Register command to install MCP server
    let installCommand = vscode.commands.registerCommand('sweObeyMe.installMCP', async () => {
        const panel = vscode.window.createWebviewPanel(
            'sweObeyMeInstall',
            'Install SWEObeyMe MCP',
            vscode.ViewColumn.One,
            { enableScripts: false }  // Disable scripts for Trusted Types compliance
        );

        panel.webview.html = getInstallHtml();
    });

    // Register command to query the oracle
    let oracleCommand = vscode.commands.registerCommand('sweObeyMe.queryOracle', async () => {
        const quotes = [
            "I'm sorry, Dave. I'm afraid I *can* do that. Surgery complete.",
            "The flux capacitor is at 1.21 Gigawatts. If you're gonna split this file, do it with style.",
            "This is your last chance. After this, there is no turning back...",
            "I'm a leaf on the wind, watch how I— [FILE SPLIT SUCCESSFUL]",
            "I find your lack of indentation disturbing.",
            "Non-compliance detected. YOU SHALL NOT PASS!",
            "Have you tried turning it off and on again?"
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        vscode.window.showInformationMessage(`[ORACLE]: ${randomQuote}`);
    });

    context.subscriptions.push(installCommand);
    context.subscriptions.push(oracleCommand);

    // Auto-install MCP server on activation
    checkAndInstallMCP();
}

function checkAndInstallMCP() {
    // Get workspace folder for manifest-based registration
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        console.log('SWEObeyMe: No workspace open, skipping manifest creation');
        return;
    }
    
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const manifestPath = path.join(workspaceRoot, 'windsurf-mcp.json');
    
    // Extension path for bundled server - look in extension folder itself
    const extensionPath = __dirname;
    const indexPath = path.join(extensionPath, 'dist', 'index.js');
    
    console.log('SWEObeyMe: Looking for index.js at:', indexPath);
    
    if (!fs.existsSync(indexPath)) {
        console.error('SWEObeyMe: index.js not found at:', indexPath);
        return;
    }
    
    // Convert indexPath to file:// URI for Windsurf Next compatibility
    const { pathToFileURL } = require('url');
    const indexUri = pathToFileURL(indexPath).href;

    const localAppData = process.env.LOCALAPPDATA
        || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Local') : null);
    const defaultBackupDir = path.join(localAppData || workspaceRoot, 'SWEObeyMe', '.sweobeyme-backups');
    
    // Create the manifest for auto-registration
    const manifest = {
        "mcpServers": {
            "swe-obey-me": {
                "command": "node",
                "args": [indexUri],
                "name": "SWEObeyMe",
                "version": "1.0.8",
                "env": {
                    "SWEOBEYME_MODE": "Sovereign",
                    "SWEOBEYME_BACKUP_DIR": defaultBackupDir,
                    "NODE_OPTIONS": "--no-warnings"
                },
                "capabilities": {
                    "prompts": {},
                    "resources": {},
                    "tools": {
                        "supported_methods": [
                            "surgical_write",
                            "audit_manifest",
                            "velocity_guard"
                        ]
                    },
                    "experimental": {
                        "cascade_hooks_v2": true
                    }
                }
            }
        }
    };

    const manifestServer = manifest.mcpServers["swe-obey-me"];

    const writeManifest = () => {
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log('SWEObeyMe: Wrote windsurf-mcp.json at:', manifestPath);
        vscode.window.showInformationMessage(
            'SWEObeyMe MCP manifest updated! Reload Windsurf to auto-register.',
            'Reload Now'
        ).then(selection => {
            if (selection === 'Reload Now') {
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
        });
    };

    if (fs.existsSync(manifestPath)) {
        try {
            const current = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
            const existingServer = current?.mcpServers?.["swe-obey-me"];
            const existingArgs = existingServer?.args || [];
            const existingUri = existingArgs[0];
            const versionMatches = existingServer?.version === manifestServer.version;
            const uriMatches = existingUri === indexUri;

            if (versionMatches && uriMatches) {
                console.log('SWEObeyMe: windsurf-mcp.json already points at current dist/index.js');
                return;
            }

            console.log('SWEObeyMe: Replacing stale manifest with updated URI/version');
        } catch (error) {
            console.error('SWEObeyMe: Failed to read existing manifest, rewriting:', error);
        }
    }

    try {
        writeManifest();
    } catch (error) {
        console.error('SWEObeyMe: Failed to write manifest:', error);
        vscode.window.showErrorMessage(
            `SWEObeyMe: Failed to create manifest. Error: ${error.message}`
        );
    }
}

function getInstallHtml() {
    return `<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
    <style>
        body { font-family: sans-serif; padding: 20px; }
        h1 { color: #00d4aa; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
        .success { color: #00d4aa; }
    </style>
</head>
<body>
    <h1>SWEObeyMe - Surgical MCP Governor</h1>
    <p>Status: <span class="success">✅ Installed</span></p>
    <p>The MCP server has been auto-configured in your Windsurf settings.</p>
    <p>Please reload Windsurf to activate:</p>
    <ol>
        <li>Press <code>Ctrl+Shift+P</code></li>
        <li>Type "Developer: Reload Window"</li>
        <li>Press Enter</li>
    </ol>
    <p>Look for the green dot in the MCP panel!</p>
</body>
</html>`;
}

function deactivate() {
    console.log('SWEObeyMe extension deactivated');
}

module.exports = { activate, deactivate };
