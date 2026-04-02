# SWEObeyMe Distribution Guide

## Quick Start for Users

### Method 1: Git Clone (Developers)
```bash
git clone https://github.com/YOUR_USERNAME/SWEObeyMe.git
cd SWEObeyMe
npm install
```

Add to `%USERPROFILE%\.codeium\windsurf-next\mcp_config.json`:
```json
{
  "mcpServers": {
    "swe-obey-me": {
      "command": "node",
      "args": ["C:\\SWEObeyMe\\index.js"],
      "env": { "NODE_ENV": "production" },
      "disabled": false
    }
  }
}
```

Reload Windsurf: `Ctrl+Shift+P` → "Developer: Reload Window"

### Method 2: Download Zip (Non-Developers)
1. Download `SWEObeyMe.zip` from Releases
2. Extract to `C:\SWEObeyMe`
3. Double-click `setup.bat`
4. Follow prompts to configure Windsurf

### Method 3: VSIX Extension (Windsurf Store)
1. Download `sweobeyme-1.0.13.vsix`
2. In Windsurf: Extensions → Install from VSIX
3. Select the downloaded file

---

## For Maintainers: Publishing

### GitHub Release
1. Tag release: `git tag -a v1.0.13 -m "Version 1.0.13 release"`
2. Push tag: `git push origin v1.0.13`
3. GitHub → Releases → Create new release
4. Attach files:
   - `SWEObeyMe.zip` (full package)
   - `sweobeyme-1.0.13.vsix` (extension)
5. Publish

### VSIX Extension Store
```bash
npm install -g @vscode/vsce
vsce package
# Upload to marketplace
```

### NPM Package (Optional)
```bash
npm publish
# Users install: npm install -g swe-obey-me
```

---

## Package Contents

Required files:
- `index.js` - Main MCP server
- `quotes.js` - Sci-fi quotes
- `package.json` - Dependencies
- `setup.bat` - Windows installer
- `README.md` - Documentation
- `LICENSE` - MIT License
- `.windsurfrules` - AI behavior rules

Auto-created on first run:
- `.sweobeyme-backups/` - Backup directory
- `.swe-memory/` - Session storage

---

## Verification Checklist

Before publishing, verify:
- [ ] All tests pass (`npm test`)
- [ ] All MCP protocol compliance tests pass (`node test-mcp-protocol-compliance.js`)
- [ ] Green dot in MCP panel
- [ ] 700-line wall blocks oversized files
- [ ] Auto-correction removes console.log
- [ ] Backups are created on write
- [ ] Quotes load from quotes.js
- [ ] `query_the_oracle` returns random quote

### v1.0.13 Specific Verification (C# & File Management)
- [ ] C# validation tools work correctly
- [ ] Bracket validation detects mismatches
- [ ] Complexity analysis provides metrics
- [ ] Math safety validation catches overflow risks
- [ ] File registry indexes project files
- [ ] Duplicate file detection prevents duplicates
- [ ] Operation audit tracks all operations
- [ ] Reference validation checks imports
- [ ] write_file prevents duplicate writes
- [ ] Total 65 tools available

---

## Support

Issues? Check:
1. Node.js installed: `node -v`
2. Path in mcp_config.json is correct
3. No trailing commas in JSON
4. Green dot appears after reload

Still stuck? Open an issue on GitHub.
