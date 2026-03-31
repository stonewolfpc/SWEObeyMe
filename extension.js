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
            {}
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
    // When installed from store, index.js is in the extension folder
    const extensionPath = path.dirname(__dirname);
    const indexPath = path.join(extensionPath, 'dist', 'index.js'); // Use bundled version
    
    console.log('SWEObeyMe: Looking for index.js at:', indexPath);
    console.log('SWEObeyMe: Extension path:', extensionPath);
    
    // Check if index.js exists
    if (!fs.existsSync(indexPath)) {
        console.error('SWEObeyMe: index.js not found at:', indexPath);
        vscode.window.showErrorMessage(`SWEObeyMe: index.js not found. Please report this issue.`);
        return;
    }
    
    // Check if MCP is configured
    const mcpConfigPath = path.join(process.env.USERPROFILE || process.env.HOME, '.codeium', 'windsurf', 'mcp_config.json');
    
    try {
        let config = {};
        if (fs.existsSync(mcpConfigPath)) {
            config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
        }
        
        if (!config.mcpServers) {
            config.mcpServers = {};
        }
        
        if (!config.mcpServers['swe-obey-me']) {
            config.mcpServers['swe-obey-me'] = {
                command: 'node',
                args: ['--no-warnings', indexPath],
                env: { NODE_ENV: 'production' },
                disabled: false,
                windowsHide: true
            };
            
            // Ensure directory exists
            const configDir = path.dirname(mcpConfigPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            
            fs.writeFileSync(mcpConfigPath, JSON.stringify(config, null, 2));
            console.log('SWEObeyMe: MCP configured at:', indexPath);
            vscode.window.showInformationMessage(
                'SWEObeyMe MCP server configured! Please reload Windsurf to activate.',
                'Reload Now'
            ).then(selection => {
                if (selection === 'Reload Now') {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            });
        } else {
            console.log('SWEObeyMe: MCP already configured');
        }
    } catch (error) {
        console.error('SWEObeyMe: Failed to configure MCP:', error);
        vscode.window.showErrorMessage(
            `SWEObeyMe: Failed to auto-configure. Error: ${error.message}`
        );
    }
}

function getInstallHtml() {
    return `<!DOCTYPE html>
<html>
<head>
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
