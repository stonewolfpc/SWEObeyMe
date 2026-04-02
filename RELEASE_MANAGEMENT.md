# SWEObeyMe Professional Release Management Guide

## Overview

This guide outlines the professional release management process for SWEObeyMe v1.0.13 and beyond, ensuring easy updates, patches, and maintenance.

## Versioning Strategy

### Semantic Versioning (SemVer)

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.x.x): Breaking changes, major features
- **MINOR** (x.1.x): New features, backward compatible
- **PATCH** (x.x.1): Bug fixes, backward compatible

### Current Version: 1.0.13

**MAJOR** version 1 indicates:
- Initial stable release
- API is considered stable
- Breaking changes may occur in future major versions

## Pre-Release Checklist

### 1. Testing
```bash
# Run all tests
npm test

# Run MCP server integration test
node test-mcp-server.js

# Run MCP protocol compliance test
node test-mcp-protocol-compliance.js

# Run direct module tests
node -e "import('./lib/file-registry.js').then(async m => { const registry = m.getFileRegistry(); const result = await registry.indexProject(process.cwd()); console.log('✓ Indexed:', result.indexedCount, 'files'); })"
node -e "import('./lib/file-operation-audit.js').then(async m => { const record = await m.recordFileOperation('WRITE', 'test.js', { content: 'test' }); console.log('✓ Operation recorded:', record.status); })"
node -e "import('./lib/tools/handlers.js').then(m => { console.log('✓ Total handlers:', Object.keys(m.toolHandlers).length); })"
```

### 2. Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### 3. Documentation Updates
- [ ] Update version in `package.json`
- [ ] Update version in `index.js`
- [ ] Update version in `extension-package.json`
- [ ] Update `README.md` with new features
- [ ] Update `PUBLISH.md` with verification checklist
- [ ] Update `CHANGELOG.md` with detailed changes
- [ ] Update `.vscodeignore` if needed

### 4. Build Verification
```bash
# Build the project
npm run build

# Verify build output
ls -la dist/
```

## Release Process

### Step 1: Create Release Branch
```bash
# Create release branch
git checkout -b release/v1.0.13

# Ensure all changes are committed
git add .
git commit -m "chore: prepare for v1.0.13 release"
```

### Step 2: Tag the Release
```bash
# Create annotated tag
git tag -a v1.0.13 -m "Release v1.0.13: C# .NET 8/10 enhancements and file management system"

# Push tag
git push origin v1.0.13
```

### Step 3: Build Distribution Packages

#### Option A: Full Package (ZIP)
```bash
# Create release directory
mkdir -p release/SWEObeyMe-v1.0.13

# Copy required files
cp -r lib release/SWEObeyMe-v1.0.13/
cp index.js release/SWEObeyMe-v1.0.13/
cp quotes.js release/SWEObeyMe-v1.0.13/
cp package.json release/SWEObeyMe-v1.0.13/
cp package-lock.json release/SWEObeyMe-v1.0.13/
cp README.md release/SWEObeyMe-v1.0.13/
cp LICENSE release/SWEObeyMe-v1.0.13/
cp setup.bat release/SWEObeyMe-v1.0.13/
cp .windsurfrules release/SWEObeyMe-v1.0.13/
cp extension.js release/SWEObeyMe-v1.0.13/
cp extension-package.json release/SWEObeyMe-v1.0.13/
cp .gitignore release/SWEObeyMe-v1.0.13/

# Create ZIP
cd release
zip -r SWEObeyMe-v1.0.13.zip SWEObeyMe-v1.0.13/
```

#### Option B: VSIX Extension
```bash
# Install vsce if not already installed
npm install -g @vscode/vsce

# Build VSIX
vsce package

# Output: sweobeyme-1.0.13.vsix
```

#### Option C: NPM Package (Optional)
```bash
# Publish to npm
npm publish

# Users install: npm install -g swe-obey-me
```

### Step 4: Create GitHub Release

1. Go to GitHub → Releases → "Create a new release"
2. Select tag: `v1.0.13`
3. Release title: `v1.0.13 - C# .NET 8/10 & File Management`
4. Release notes (use CHANGELOG.md content)
5. Attach files:
   - `SWEObeyMe-v1.0.13.zip`
   - `sweobeyme-1.0.13.vsix`
6. Publish release

### Step 5: Update Version for Next Development
```bash
# Switch back to main
git checkout main

# Merge release branch
git merge release/v1.0.13

# Update to next development version (patch)
npm version patch

# Or for minor version:
npm version minor

# Commit version bump
git add package.json
git commit -m "chore: bump version to 1.0.14-dev"
git push origin main
```

## Distribution Methods

### Method 1: GitHub Release (Recommended for Users)
- Full ZIP package with all files
- Easy to download and install
- Includes setup.bat for Windows
- Best for non-developers

### Method 2: VSIX Extension (Recommended for Windsurf Users)
- Direct installation in Windsurf/VS Code
- Automatic updates when new versions released
- Integrates with extension marketplace
- Best for IDE users

### Method 3: Git Clone (Recommended for Developers)
```bash
git clone https://github.com/stonewolfpc/SWEObeyMe.git
cd SWEObeyMe
git checkout v1.0.13
npm install
```

### Method 4: NPM Package (Optional)
```bash
npm install -g swe-obey-me
```

## Update/Patch Management

### Hotfix Process (Critical Bugs Only)

1. Create hotfix branch from release tag:
```bash
git checkout -b hotfix/v1.0.13.1 v1.0.13
```

2. Make the fix and commit:
```bash
# Make changes
git add .
git commit -m "fix: critical bug in file registry"
```

3. Test thoroughly

4. Create hotfix tag:
```bash
git tag -a v1.0.13.1 -m "Hotfix v1.0.13.1: Critical bug fix"
git push origin v1.0.13.1
```

5. Build and publish hotfix packages

6. Merge to main and develop:
```bash
git checkout main
git merge hotfix/v1.0.13.1
git push origin main
```

### Minor Version Updates (New Features)

1. Create feature branch:
```bash
git checkout -b feature/new-feature
```

2. Develop and test

3. Merge to main:
```bash
git checkout main
git merge feature/new-feature
```

4. Bump minor version:
```bash
npm version minor
```

5. Create release:
```bash
git tag -a v1.1.0 -m "Release v1.1.0: New features"
git push origin v1.1.0
```

### Major Version Updates (Breaking Changes)

1. Create major version branch:
```bash
git checkout -b major/v2.0.0
```

2. Implement breaking changes

3. Update migration guide

4. Bump major version:
```bash
npm version major
```

5. Create release:
```bash
git tag -a v2.0.0 -m "Release v2.0.0: Major update with breaking changes"
git push origin v2.0.0
```

## Automated Updates (Future Enhancement)

### Auto-Update Mechanism

For VSIX extension, implement auto-update:

```json
{
  "version": "1.0.13",
  "engines": {
    "vscode": "^1.60.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/stonewolfpc/SWEObeyMe"
  }
}
```

VS Code will automatically check for updates when connected to the marketplace.

### Update Notification System

Implement in SWEObeyMe to notify users of updates:

```javascript
// In lib/config.js
export async function checkForUpdates() {
  try {
    const response = await fetch('https://api.github.com/repos/stonewolfpc/SWEObeyMe/releases/latest');
    const latest = await response.json();
    const currentVersion = '1.0.13';
    
    if (latest.tag_name !== `v${currentVersion}`) {
      console.error(`[SWEObeyMe] New version available: ${latest.tag_name}`);
      console.error(`[SWEObeyMe] Release notes: ${latest.html_url}`);
    }
  } catch (error) {
    // Silent fail
  }
}
```

## Release Communication

### Release Notes Template

```markdown
## SWEObeyMe v1.0.13 Release Notes

### What's New
- C# .NET 8/10 enhancements with 10 new validation tools
- File management system to prevent duplication
- 19 new tools (total: 65 tools)

### Improvements
- Enhanced write_file with automatic duplicate prevention
- C# complexity warnings in read_file
- Comprehensive operation audit tracking

### Bug Fixes
- Fixed async/await issues in file-operation-audit.js
- Improved error handling in file registry

### Breaking Changes
None

### Upgrade Instructions
1. Download SWEObeyMe-v1.0.13.zip
2. Extract to C:\SWEObeyMe
3. Run setup.bat
4. Restart Windsurf

### Migration Guide
No migration required - fully backward compatible

### Known Issues
None

### Support
- GitHub Issues: https://github.com/stonewolfpc/SWEObeyMe/issues
- Documentation: https://github.com/stonewolfpc/SWEObeyMe/blob/main/README.md
```

### Communication Channels

1. **GitHub Release** - Primary announcement
2. **GitHub Discussions** - Community feedback
3. **Twitter/X** - Quick announcements
4. **Reddit** - Community discussion

## Backward Compatibility

### Compatibility Matrix

| Version | Compatible With | Notes |
|---------|----------------|-------|
| 1.0.13 | 1.0.12+ | Fully backward compatible |
| 1.0.12 | 1.0.11+ | Fully backward compatible |
| 1.0.11 | 1.0.10+ | Fully backward compatible |

### Deprecation Policy

- Features are deprecated for at least 2 minor versions before removal
- Breaking changes only in major versions
- Migration guide provided for breaking changes

## Rollback Plan

### If Critical Issues Found

1. Immediately notify users via GitHub release notes
2. Provide rollback instructions:
```bash
# Uninstall v1.0.13
# Install previous version
git clone https://github.com/stonewolfpc/SWEObeyMe.git
cd SWEObeyMe
git checkout v1.0.12
npm install
```

3. Release hotfix if possible
4. If hotfix impossible, rollback release and re-issue v1.0.12

## Release Metrics

### Track These Metrics

- Download count (GitHub releases)
- Installation count (VSIX marketplace)
- Issue reports
- User feedback
- Test coverage

### Post-Release Review

After 1 week, review:
- Critical bugs reported
- User feedback
- Performance issues
- Documentation gaps

## Automation Scripts

### Automated Release Script

Create `scripts/release.sh`:

```bash
#!/bin/bash

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Usage: ./scripts/release.sh <version>"
    exit 1
fi

echo "Releasing SWEObeyMe v$VERSION"

# Run tests
npm test
if [ $? -ne 0 ]; then
    echo "Tests failed. Aborting release."
    exit 1
fi

# Update version
npm version $VERSION --no-git-tag-version

# Commit version bump
git add package.json
git commit -m "chore: bump version to $VERSION"

# Create tag
git tag -a "v$VERSION" -m "Release v$VERSION"

# Push
git push origin main
git push origin "v$VERSION"

# Build VSIX
vsce package

echo "Release v$VERSION complete!"
echo "VSIX: sweobeyme-$VERSION.vsix"
echo "Don't forget to create GitHub release manually."
```

Usage:
```bash
chmod +x scripts/release.sh
./scripts/release.sh 1.0.13
```

## Summary

### Best Practices

1. ✅ Always test before releasing
2. ✅ Use semantic versioning
3. ✅ Document all changes in CHANGELOG
4. ✅ Provide migration guides for breaking changes
5. ✅ Support at least one previous version
6. ✅ Monitor user feedback after release
7. ✅ Have rollback plan ready
8. ✅ Automate where possible

### Release Timeline

- **Development**: Main branch
- **Testing**: Release branch
- **Release**: GitHub Release
- **Hotfix**: Hotfix branch from release tag
- **Next Version**: Main branch (bumped)

### Support Commitment

- Critical bugs: Hotfix within 24-48 hours
- Minor bugs: Next patch version
- New features: Next minor version
- Breaking changes: Next major version
