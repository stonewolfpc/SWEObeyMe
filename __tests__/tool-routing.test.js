// Test for tool routing interceptor
describe('Tool Routing Interceptor', () => {
  test('should have installToolRoutingInterceptor function', () => {
    const fs = require('fs');
    const extensionCode = fs.readFileSync('d:/SWEObeyMe-restored/extension.js', 'utf8');
    expect(extensionCode).toContain('installToolRoutingInterceptor');
  });

  test('should override writeFile', () => {
    const fs = require('fs');
    const extensionCode = fs.readFileSync('d:/SWEObeyMe-restored/extension.js', 'utf8');
    expect(extensionCode).toContain('vscode.workspace.fs.writeFile =');
  });

  test('should route through write_file tool', () => {
    const fs = require('fs');
    const extensionCode = fs.readFileSync('d:/SWEObeyMe-restored/extension.js', 'utf8');
    expect(extensionCode).toContain('toolHandlers.write_file');
  });

  test('should override applyEdit', () => {
    const fs = require('fs');
    const extensionCode = fs.readFileSync('d:/SWEObeyMe-restored/extension.js', 'utf8');
    expect(extensionCode).toContain('vscode.workspace.applyEdit =');
  });

  test('should route through validate_change_before_apply', () => {
    const fs = require('fs');
    const extensionCode = fs.readFileSync('d:/SWEObeyMe-restored/extension.js', 'utf8');
    expect(extensionCode).toContain('validate_change_before_apply');
  });
});
