import * as vscode from 'vscode';
export function activate(context) {
    console.log('SWEObeyMe extension activated');
    // Create output channel
    const outputChannel = vscode.window.createOutputChannel('SWEObeyMe');
    outputChannel.appendLine('SWEObeyMe extension activated');
    // Register a simple test command first
    const testCommand = vscode.commands.registerCommand('sweobeyme.test', () => {
        vscode.window.showInformationMessage('SWEObeyMe test command works!');
        outputChannel.appendLine('Test command executed');
    });
    // Register the start server command
    const startServerCommand = vscode.commands.registerCommand('sweobeyme.startServer', () => {
        vscode.window.showInformationMessage('SWEObeyMe start server command works!');
        outputChannel.appendLine('Start server command executed');
    });
    // Add to subscriptions
    context.subscriptions.push(testCommand, startServerCommand);
    // Show success message
    vscode.window.showInformationMessage('SWEObeyMe extension loaded successfully!');
    outputChannel.appendLine('Extension loaded successfully');
    outputChannel.show();
}
export function deactivate() {
    console.log('SWEObeyMe extension deactivated');
}
//# sourceMappingURL=extension-simple.js.map