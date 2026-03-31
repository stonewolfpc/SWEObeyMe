import * as vscode from 'vscode';
export function activate(context) {
    console.log('SWEObeyMe extension is activating...');
    // Show a notification immediately
    vscode.window.showInformationMessage('SWEObeyMe extension activated!');
    // Create output channel
    const outputChannel = vscode.window.createOutputChannel('SWEObeyMe');
    outputChannel.appendLine('SWEObeyMe extension activated successfully');
    outputChannel.show();
    // Register a simple test command
    const disposable = vscode.commands.registerCommand('sweobeyme.test', () => {
        vscode.window.showInformationMessage('SWEObeyMe test command works!');
        outputChannel.appendLine('Test command executed');
    });
    context.subscriptions.push(disposable);
}
export function deactivate() {
    console.log('SWEObeyMe extension deactivated');
}
//# sourceMappingURL=extension-minimal.js.map