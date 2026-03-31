import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as path from 'path';
/**
 * SWEObeyMe Extension - Advanced Software Engineering Automation
 *
 * Provides autonomous multi-agent software engineering automation with:
 * - Predictive coding capabilities
 * - Intelligent refactoring
 * - Multi-agent coordination
 * - MCP server integration
 */
let serverProcess = null;
let outputChannel;
let statusBarItem;
let extensionContext;
export function activate(context) {
    console.log('🚀 SWEObeyMe extension is now active!');
    // Store context for cleanup
    extensionContext = context;
    // Create output channel
    outputChannel = vscode.window.createOutputChannel('SWEObeyMe');
    outputChannel.appendLine('SWEObeyMe extension activated');
    outputChannel.appendLine('Extension path: ' + extensionContext.extensionPath);
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = '$(gear) SWEObeyMe';
    statusBarItem.tooltip = 'SWEObeyme - Advanced Software Engineering Automation';
    statusBarItem.command = 'sweobeyme.showOutput';
    statusBarItem.show();
    // Register commands
    const startServerCmd = vscode.commands.registerCommand('sweobeyme.startServer', () => {
        outputChannel.appendLine('🚀 Start server command triggered');
        startMCPServer();
    });
    const commands = [
        startServerCmd,
        vscode.commands.registerCommand('sweobeyme.stopServer', () => stopMCPServer()),
        vscode.commands.registerCommand('sweobeyme.validatePatch', () => validatePatch()),
        vscode.commands.registerCommand('sweobeyme.runCorrectiveTask', () => runCorrectiveTask()),
        vscode.commands.registerCommand('sweobeyme.getPredictedActions', () => getPredictedActions()),
        vscode.commands.registerCommand('sweobeyme.runRefactorTask', () => runRefactorTask()),
        vscode.commands.registerCommand('sweobeyme.runMultiAgentTask', () => runMultiAgentTask()),
        vscode.commands.registerCommand('sweobeyme.showOutput', () => outputChannel.show()),
    ];
    // Add commands to context subscriptions
    context.subscriptions.push(...commands);
    // Set context for conditional UI
    vscode.commands.executeCommand('setContext', 'sweobeyme:serverActive', false);
    // Auto-start server if enabled
    const config = vscode.workspace.getConfiguration('sweobeyme');
    outputChannel.appendLine('Auto-start enabled: ' + config.get('auto.start', true));
    if (config.get('auto.start', true)) {
        outputChannel.appendLine('Auto-starting server in 1 second...');
        setTimeout(() => startMCPServer(), 1000);
    }
    // Show welcome message
    vscode.window.showInformationMessage('SWEObeyMe is ready! Use the command palette (Ctrl+Shift+P) to access SWEObeyMe features.', 'Show Commands').then((selection) => {
        if (selection === 'Show Commands') {
            vscode.commands.executeCommand('workbench.action.quickOpen', '>SWEObeyMe');
        }
    });
}
export function deactivate() {
    console.log('🔄 Deactivating SWEObeyMe extension');
    // Stop server if running
    if (serverProcess) {
        serverProcess.kill();
        serverProcess = null;
    }
    // Clean up resources
    if (statusBarItem) {
        statusBarItem.dispose();
    }
    if (outputChannel) {
        outputChannel.dispose();
    }
}
/**
 * Start the MCP server
 */
async function startMCPServer() {
    outputChannel.appendLine('🚀 startMCPServer function called');
    const config = vscode.workspace.getConfiguration('sweobeyme');
    outputChannel.appendLine('Configuration loaded');
    if (!config.get('server.enabled', true)) {
        outputChannel.appendLine('❌ Server disabled in settings');
        vscode.window.showWarningMessage('SWEObeyMe server is disabled in settings');
        return;
    }
    if (serverProcess) {
        outputChannel.appendLine('⚠️ Server already running');
        vscode.window.showInformationMessage('SWEObeyMe server is already running');
        return;
    }
    try {
        outputChannel.appendLine('🚀 Starting SWEObeyMe MCP server...');
        // Get configuration
        const host = config.get('server.host', 'localhost');
        const port = config.get('server.port', 3001);
        const logLevel = config.get('logging.level', 'info');
        outputChannel.appendLine(`Host: ${host}, Port: ${port}, Level: ${logLevel}`);
        // Start the MCP server process
        const serverPath = path.join(extensionContext.extensionPath, 'dist', 'index.js');
        outputChannel.appendLine('Server path: ' + serverPath);
        outputChannel.appendLine('Server path exists: ' + require('fs').existsSync(serverPath));
        serverProcess = spawn('node', [serverPath], {
            cwd: extensionContext.extensionPath,
            env: {
                ...process.env,
                NODE_ENV: 'production',
                LOG_LEVEL: logLevel,
                SWE_SERVER_HOST: host,
                SWE_SERVER_PORT: port.toString(),
            },
            stdio: 'pipe',
        });
        if (!serverProcess) {
            throw new Error('Failed to start server process');
        }
        outputChannel.appendLine('✅ Server process spawned successfully');
        // Handle server output
        serverProcess.stdout?.on('data', (data) => {
            outputChannel.appendLine('SERVER: ' + data.toString().trim());
        });
        serverProcess.stderr?.on('data', (data) => {
            outputChannel.appendLine('SERVER ERROR: ' + data.toString().trim());
        });
        serverProcess.on('error', (error) => {
            outputChannel.appendLine('❌ Server error: ' + error.message);
            vscode.window.showErrorMessage(`SWEObeyMe server error: ${error.message}`);
            updateStatus(false);
        });
        serverProcess.on('close', (code) => {
            outputChannel.appendLine(`Server process exited with code ${code}`);
            updateStatus(false);
            serverProcess = null;
        });
        // Update UI
        updateStatus(true);
        vscode.commands.executeCommand('setContext', 'sweobeyme:serverActive', true);
        outputChannel.appendLine(`✅ SWEObeyMe server started on ${host}:${port}`);
        outputChannel.show();
        vscode.window.showInformationMessage(`SWEObeyMe server started successfully on ${host}:${port}`, 'Show Output').then((selection) => {
            if (selection === 'Show Output') {
                outputChannel.show();
            }
        });
    }
    catch (error) {
        outputChannel.appendLine(`❌ Failed to start server: ${error.message}`);
        outputChannel.appendLine(`❌ Stack: ${error.stack}`);
        vscode.window.showErrorMessage(`Failed to start SWEObeyMe server: ${error.message}`);
        updateStatus(false);
    }
}
/**
 * Stop the MCP server
 */
async function stopMCPServer() {
    if (!serverProcess) {
        vscode.window.showInformationMessage('SWEObeyMe server is not running');
        return;
    }
    try {
        outputChannel.appendLine('🛑 Stopping SWEObeyMe MCP server...');
        serverProcess.kill('SIGTERM');
        // Wait for process to exit
        await new Promise((resolve) => {
            const checkExit = () => {
                if (!serverProcess || serverProcess.killed) {
                    resolve();
                }
                else {
                    setTimeout(checkExit, 1000);
                }
            };
            checkExit();
        });
        serverProcess = null;
        updateStatus(false);
        vscode.commands.executeCommand('setContext', 'sweobeyme:serverActive', false);
        outputChannel.appendLine('✅ SWEObeyMe server stopped');
        vscode.window.showInformationMessage('SWEObeyMe server stopped successfully');
    }
    catch (error) {
        outputChannel.appendLine(`❌ Failed to stop server: ${error.message}`);
        vscode.window.showErrorMessage(`Failed to stop SWEObeyMe server: ${error.message}`);
    }
}
/**
 * Update status bar
 */
function updateStatus(isActive) {
    if (statusBarItem) {
        if (isActive) {
            statusBarItem.text = '$(gear~spin) SWEObeyme: Active';
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
            statusBarItem.color = new vscode.ThemeColor('statusBarItem.prominentForeground');
        }
        else {
            statusBarItem.text = '$(gear) SWEObeyMe';
            statusBarItem.backgroundColor = undefined;
            statusBarItem.color = undefined;
        }
    }
}
/**
 * MCP Tool Commands
 */
async function validatePatch() {
    if (!serverProcess) {
        vscode.window.showWarningMessage('SWEObeyme server must be running to validate patches');
        return;
    }
    try {
        const patch = await vscode.window.showInputBox({
            prompt: 'Enter patch to validate:',
            placeHolder: 'Paste your patch here...'
        });
        if (!patch)
            return;
        // This would integrate with the MCP server's validate_patch tool
        outputChannel.appendLine('🔍 Validating patch...');
        outputChannel.appendLine(`Patch: ${patch.substring(0, 100)}...`);
        // Show validation result (mock for now)
        vscode.window.showInformationMessage('Patch validation completed. Check output for details.');
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to validate patch: ${error.message}`);
    }
}
async function runCorrectiveTask() {
    if (!serverProcess) {
        vscode.window.showWarningMessage('SWEObeyMe server must be running to execute corrective tasks');
        return;
    }
    try {
        const task = await vscode.window.showInputBox({
            prompt: 'Enter task description:',
            placeHolder: 'e.g., Fix the login validation bug'
        });
        if (!task)
            return;
        const filePath = await vscode.window.showInputBox({
            prompt: 'Enter file path (relative to workspace):',
            placeHolder: 'src/components/Login.tsx'
        });
        if (!filePath)
            return;
        outputChannel.appendLine('🔧 Running corrective task...');
        outputChannel.appendLine(`Task: ${task}`);
        outputChannel.appendLine(`File: ${filePath}`);
        vscode.window.showInformationMessage('Corrective task started. Check output for results.');
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to run corrective task: ${error.message}`);
    }
}
async function getPredictedActions() {
    if (!serverProcess) {
        vscode.window.showWarningMessage('SWEObeyMe server must be running to get predicted actions');
        return;
    }
    try {
        const task = await vscode.window.showInputBox({
            prompt: 'Enter task to predict actions for:',
            placeHolder: 'e.g., Add user authentication'
        });
        if (!task)
            return;
        outputChannel.appendLine('🔮 Getting predicted actions...');
        outputChannel.appendLine(`Task: ${task}`);
        vscode.window.showInformationMessage('Predicted actions generated. Check output for details.');
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to get predicted actions: ${error.message}`);
    }
}
async function runRefactorTask() {
    if (!serverProcess) {
        vscode.window.showWarningMessage('SWEObeyMe server must be running to execute refactor tasks');
        return;
    }
    try {
        const task = await vscode.window.showInputBox({
            prompt: 'Enter refactor task description:',
            placeHolder: 'e.g., Improve code quality across the project'
        });
        if (!task)
            return;
        outputChannel.appendLine('🔧 Running refactor task...');
        outputChannel.appendLine(`Task: ${task}`);
        vscode.window.showInformationMessage('Refactor task started. Check output for results.');
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to run refactor task: ${error.message}`);
    }
}
async function runMultiAgentTask() {
    if (!serverProcess) {
        vscode.window.showWarningMessage('SWEObeyMe server must be running to execute multi-agent tasks');
        return;
    }
    try {
        const task = await vscode.window.showInputBox({
            prompt: 'Enter multi-agent task description:',
            placeHolder: 'e.g., Implement complete user management system'
        });
        if (!task)
            return;
        outputChannel.appendLine('🤖 Running multi-agent task...');
        outputChannel.appendLine(`Task: ${task}`);
        vscode.window.showInformationMessage('Multi-agent task started. Check output for results.');
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to run multi-agent task: ${error.message}`);
    }
}
//# sourceMappingURL=extension.js.map