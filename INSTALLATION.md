# SWEObeyMe Extension Installation Guide

## 🚀 Quick Installation

### For VS Code / Windsurf

1. **Download the Extension**
   - Get the latest `sweobeyme-1.0.0.vsix` file from the dist folder

2. **Install Extension**
   - Open VS Code / Windsurf
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type "Extensions: Install from VSIX"
   - Select the `sweobeyme-1.0.0.vsix` file
   - Click "Install"

3. **Restart Editor**
   - Restart VS Code / Windsurf to complete installation

4. **Verify Installation**
   - Open Command Palette (`Ctrl+Shift+P`)
   - Type "SWEObeyMe" to see available commands
   - Check status bar for SWEObeyMe indicator

## ⚙️ Configuration

### Extension Settings

Open VS Code / Windsurf settings and search for "SWEObeyMe":

- **sweobeyme.server.enabled**: Enable/disable MCP server (default: true)
- **sweobeyme.server.port**: Server port (default: 3001)
- **sweobeyme.server.host**: Server host (default: localhost)
- **sweobeyme.auto.start**: Auto-start server on activation (default: true)
- **sweobeyme.logging.level**: Logging level (default: info)

### Workspace Configuration

Add to your `.vscode/settings.json`:

```json
{
  "sweobeyme.server.enabled": true,
  "sweobeyme.server.port": 3001,
  "sweobeyme.auto.start": true,
  "sweobeyme.logging.level": "info"
}
```

## 🎯 Available Commands

### Server Management
- `SWEObeyMe: Start Server` - Start the MCP server
- `SWEObeyMe: Stop Server` - Stop the MCP server
- `SWEObeyMe: Show Output` - Show server output channel

### SWE Automation Tools
- `SWEObeyMe: Validate Patch` - Validate code patches
- `SWEObeyMe: Run Corrective Task` - Run automated fixes
- `SWEObeyMe: Get Predicted Actions` - Get AI predictions
- `SWEObeyMe: Run Refactor Task` - Intelligent refactoring
- `SWEObeyMe: Run Multi-Agent Task` - Multi-agent coordination

## 🔧 Usage

### 1. Start the Server
- Use command palette: `SWEObeyMe: Start Server`
- Or enable auto-start in settings
- Check status bar for server status

### 2. Use SWE Tools
- Open command palette (`Ctrl+Shift+P`)
- Select desired SWEObeyMe command
- Follow prompts for task parameters
- Check output channel for results

### 3. Monitor Progress
- Status bar shows server status
- Output channel shows detailed logs
- Commands provide feedback notifications

## 🐛 Troubleshooting

### Extension Won't Activate
1. Check VS Code / Windsurf version (supports 1.82.0+)
2. Restart the editor
3. Check Developer Console for errors

### Server Won't Start
1. Check if port 3001 is available
2. Verify Node.js installation (18.0.0+)
3. Check output channel for error details
4. Try different port in settings

### Commands Not Working
1. Ensure server is running
2. Check output channel for errors
3. Verify file paths are correct
4. Restart the server

### Performance Issues
1. Disable auto-start if not needed
2. Adjust logging level to "warn" or "error"
3. Close unnecessary files
4. Restart server periodically

## 📋 Requirements

- **VS Code / Windsurf**: 1.82.0 or higher
- **Node.js**: 18.0.0 or higher (for server)
- **Memory**: 512MB minimum recommended
- **Disk**: 10MB for extension

## 🔄 Updates

To update the extension:
1. Download new VSIX file
2. Install over existing version
3. Restart editor
4. Verify functionality

## 📞 Support

For issues and support:
1. Check the output channel for error details
2. Verify configuration settings
3. Restart the extension/server
4. Report issues with detailed logs

## 🎉 Features

- ✅ Autonomous multi-agent SWE automation
- ✅ Predictive coding capabilities
- ✅ Intelligent refactoring engine
- ✅ Patch validation and correction
- ✅ Real-time server management
- ✅ Comprehensive logging
- ✅ Modern VS Code integration
- ✅ Windsurf compatibility
