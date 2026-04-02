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

function readJsonFileSafe(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        const raw = fs.readFileSync(filePath, 'utf-8');
        if (!raw || !raw.trim()) return {};
        return JSON.parse(raw);
    } catch (error) {
        console.error('SWEObeyMe: Failed to read JSON file, treating as empty:', filePath, error);
        return {};
    }
}

function writeJsonFileSafe(filePath, obj) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
}

function updateUserMcpConfig(desiredServer) {
    const homeDir = process.env.USERPROFILE || process.env.HOME;
    if (!homeDir) {
        console.log('SWEObeyMe: No home directory detected; cannot update user mcp_config.json');
        return false;
    }

    const candidatePaths = [
        path.join(homeDir, '.codeium', 'windsurf-next', 'mcp_config.json')
    ];

    let updatedAny = false;

    for (const mcpConfigPath of candidatePaths) {
        try {
            const config = readJsonFileSafe(mcpConfigPath) || {};
            if (!config.mcpServers) config.mcpServers = {};

            const existing = config.mcpServers['swe-obey-me'];
            const existingArgs = existing?.args || [];
            const existingUri = existingArgs[existingArgs.length - 1];

            const desiredArgs = desiredServer.args || [];
            const desiredUri = desiredArgs[desiredArgs.length - 1];

            const uriMatches = existingUri === desiredUri;
            const backupMatches = existing?.env?.SWEOBEYME_BACKUP_DIR === desiredServer?.env?.SWEOBEYME_BACKUP_DIR;

            if (!existing || !uriMatches || !backupMatches) {
                config.mcpServers['swe-obey-me'] = {
                    ...existing,
                    ...desiredServer,
                    env: {
                        ...(existing?.env || {}),
                        ...(desiredServer.env || {})
                    }
                };
                writeJsonFileSafe(mcpConfigPath, config);
                console.log('SWEObeyMe: Updated user mcp_config.json at:', mcpConfigPath);
                updatedAny = true;
            }
        } catch (error) {
            console.error('SWEObeyMe: Failed to update user mcp_config.json at:', mcpConfigPath, error);
        }
    }

    return updatedAny;
}

function checkAndInstallMCP() {
    // Extension path for bundled server - look in extension folder itself
    const extensionPath = __dirname;
    const indexPath = path.join(extensionPath, 'index.js');

    console.log('SWEObeyMe: Looking for index.js at:', indexPath);

    if (!fs.existsSync(indexPath)) {
        console.error('SWEObeyMe: index.js not found at:', indexPath);
        return;
    }

    // Use absolute Windows path for Windsurf Next compatibility
    // Windsurf Next requires file:// URIs for MCP server paths
    const { pathToFileURL } = require('url');
    const indexUri = pathToFileURL(indexPath).href;

    const localAppData = process.env.LOCALAPPDATA
        || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Local') : null);
    const defaultBackupDir = path.join(localAppData || extensionPath, 'SWEObeyMe', '.sweobeyme-backups');

    // Windsurf Next (March 2026+): use user-level MCP registration only.
    // Workspace manifests are deprecated and cause path normalization issues.
    const desiredUserServer = {
        command: 'node',
        args: ['--no-warnings', indexUri],
        env: {
            NODE_ENV: 'production',
            SWEOBEYME_BACKUP_DIR: defaultBackupDir,
            SWEOBEYME_DEBUG: '0'
        },
        disabled: false
    };

    const userUpdated = updateUserMcpConfig(desiredUserServer);

    if (userUpdated) {
        vscode.window.showInformationMessage(
            'SWEObeyMe MCP configured in user settings! Reload Windsurf to activate.',
            'Reload Now'
        ).then(selection => {
            if (selection === 'Reload Now') {
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
        });
    } else {
        console.log('SWEObeyMe: User MCP config unchanged');
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
