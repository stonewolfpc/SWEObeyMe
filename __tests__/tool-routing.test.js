// Test for tool routing interceptor
describe('Tool Routing Interceptor', () => {
  test('should have installToolRoutingInterceptor function', () => {
    const fs = require('fs');
    const path = require('path');
    const extensionCode = fs.readFileSync(path.join(__dirname, '..', 'extension.js'), 'utf8');
    expect(extensionCode).toContain('installToolRoutingInterceptor');
  });

  test('should disable tool routing interceptor due to read-only properties', () => {
    const fs = require('fs');
    const path = require('path');
    const extensionCode = fs.readFileSync(path.join(__dirname, '..', 'extension.js'), 'utf8');
    expect(extensionCode).toContain('Tool routing interceptor disabled - VS Code API properties are read-only');
  });

  test('should not override writeFile', () => {
    const fs = require('fs');
    const path = require('path');
    const extensionCode = fs.readFileSync(path.join(__dirname, '..', 'extension.js'), 'utf8');
    expect(extensionCode).not.toContain('vscode.workspace.fs.writeFile =');
  });

  test('should not override applyEdit', () => {
    const fs = require('fs');
    const path = require('path');
    const extensionCode = fs.readFileSync(path.join(__dirname, '..', 'extension.js'), 'utf8');
    expect(extensionCode).not.toContain('vscode.workspace.applyEdit =');
  });
});
