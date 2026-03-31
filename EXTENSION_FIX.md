# SWEObeyMe Extension Fix Guide

## Issue: Store Installation Path Problem

When installed from Open-VSX, the extension can't find `index.js` because it's in a different location than during development.

## Fix Applied

1. **Better path detection** - Extension now logs where it's looking for `index.js`
2. **Error handling** - Shows user-friendly messages if files not found
3. **Auto-reload prompt** - Offers to reload Windsurf after configuration

## Testing the Fix

1. Package the updated extension:
   ```bash
   vsce package
   ```

2. Publish to Open-VSX:
   ```bash
   ovsx publish swe-obey-me-1.0.1.vsix -p YOUR_TOKEN
   ```

3. Users update to v1.0.1

## Manual Workaround (for current users)

If users are experiencing the yellow/red dot issue:

1. **Find extension path:**
   - Extensions → Right-click SWEObeyMe → Open Extension Folder
   - Note the full path

2. **Update mcp_config.json manually:**
   ```json
   {
     "mcpServers": {
       "swe-obey-me": {
         "command": "node",
         "args": ["FULL_PATH_TO_EXTENSIONS/stonewolfpc.swe-obey-me-1.0.0/index.js"],
         "env": { "NODE_ENV": "production" },
         "disabled": false
       }
     }
   }
   ```

3. Reload Windsurf

## Future Prevention

The extension now:
- Logs debug info to help diagnose issues
- Shows clear error messages
- Creates the config directory if missing
- Offers one-click reload

This ensures users get a green dot after installation.
