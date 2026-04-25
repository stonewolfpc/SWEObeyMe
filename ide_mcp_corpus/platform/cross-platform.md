# Cross-Platform Development

## Overview

This document covers Windows vs Linux differences, filesystem semantics, path handling, process management, environment variables, and packaging differences. These concepts enable MasterControl to help devs avoid platform-specific bugs.

## Windows vs Linux Differences

### Operating System Differences

#### Windows

- **Kernel**: NT kernel
- **Filesystem**: NTFS, FAT32
- **Case Sensitivity**: Case-insensitive (usually)
- **Line Endings**: CRLF (\r\n)
- **Path Separator**: Backslash (\)
- **Executable**: .exe extension
- **Permissions**: ACL-based

#### Linux

- **Kernel**: Linux kernel
- **Filesystem**: ext4, xfs, btrfs
- **Case Sensitivity**: Case-sensitive
- **Line Endings**: LF (\n)
- **Path Separator**: Forward slash (/)
- **Executable**: Executable bit
- **Permissions**: Unix permissions

### Case Sensitivity

#### Windows

- **Case-Insensitive**: Filesystem is case-insensitive
- **Preserves Case**: Preserves case but ignores for comparison
- **Example**: `file.txt` and `FILE.TXT` are the same file

#### Linux

- **Case-Sensitive**: Filesystem is case-sensitive
- **Strict**: Strict case matching
- **Example**: `file.txt` and `FILE.TXT` are different files

### Line Endings

#### Windows (CRLF)

```
Line 1\r\n
Line 2\r\n
```

#### Linux (LF)

```
Line 1\n
Line 2\n
```

### Handling Line Endings

#### Git Configuration

```bash
# Configure Git to handle line endings
git config --global core.autocrlf true  # Windows
git config --global core.autocrlf input   # Linux/Mac
```

#### .gitattributes

```
# Force LF for all text files
* text=auto eol=lf

# Force CRLF for Windows-specific files
*.bat text eol=crlf
*.cmd text eol=crlf
```

## Filesystem Semantics

### Path Separators

#### Windows

```python
# Backslash
path = "C:\\Users\\user\\file.txt"

# Raw string
path = r"C:\Users\user\file.txt"
```

#### Linux

```python
# Forward slash
path = "/home/user/file.txt"
```

### Path Handling

#### Use Path Libraries

```python
# Python - pathlib
from pathlib import Path

# Cross-platform
path = Path("folder") / "file.txt"
```

```javascript
// Node.js - path module
const path = require('path');

// Cross-platform
const fullPath = path.join('folder', 'file.txt');
```

### File Permissions

#### Windows (ACLs)

- **ACL**: Access Control Lists
- **Permissions**: Read, Write, Execute, Delete
- **Inheritance**: Permission inheritance
- **GUI**: Security tab in properties

#### Linux (Unix Permissions)

- **Modes**: Read, Write, Execute
- **Owner**: User, Group, Other
- **Octal**: 755, 644, etc.
- **chmod**: Change permissions

```bash
# Set permissions
chmod 755 script.sh
chmod 644 file.txt
```

### Symbolic Links

#### Windows

- **Junctions**: Directory junctions
- **Symlinks**: Symbolic links (requires admin)
- **Hard Links**: Hard links
- **Creation**: `mklink` command

```cmd
# Create symbolic link
mklink link target
```

#### Linux

- **Symlinks**: Symbolic links
- **Hard Links**: Hard links
- **Creation**: `ln` command

```bash
# Create symbolic link
ln -s target link
```

### File Locking

#### Windows

- **Mandatory**: Mandatory locking
- **Advisory**: Advisory locking
- **File Handles**: File handles lock files
- **API**: Windows file locking API

#### Linux

- **Advisory**: Advisory locking only
- **flock**: File locking
- **fcntl**: File control
- **API**: POSIX file locking API

## Path Handling

### Absolute vs Relative Paths

#### Absolute Paths

- **Windows**: `C:\Users\user\file.txt`
- **Linux**: `/home/user/file.txt`

#### Relative Paths

- **Windows**: `folder\file.txt`
- **Linux**: `folder/file.txt`

### Path Libraries

#### Python

```python
from pathlib import Path

# Current directory
current = Path.cwd()

# Join paths
full_path = Path("folder") / "file.txt"

# Get parent
parent = Path("folder/file.txt").parent

# Get extension
ext = Path("file.txt").suffix
```

#### Node.js

```javascript
const path = require('path');

// Join paths
const fullPath = path.join('folder', 'file.txt');

// Get directory
const dir = path.dirname('folder/file.txt');

// Get extension
const ext = path.extname('file.txt');

// Normalize path
const normalized = path.normalize('folder/../file.txt');
```

#### Rust

```rust
use std::path::Path;

// Join paths
let path = Path::new("folder").join("file.txt");

// Get parent
let parent = Path::new("folder/file.txt").parent();

// Get extension
let ext = Path::new("file.txt").extension();
```

### Path Normalization

- **Resolve**: Resolve to absolute path
- **Normalize**: Normalize separators and `.` and `..`
- **Canonical**: Resolve symlinks
- **Absolute**: Make absolute

## Process Management

### Process Creation

#### Windows

```python
import subprocess

# Run process
subprocess.run(["notepad.exe", "file.txt"])
```

#### Linux

```python
import subprocess

# Run process
subprocess.run(["gedit", "file.txt"])
```

### Process Termination

#### Windows

- **SIGTERM**: Not supported
- **SIGKILL**: Not supported
- **TerminateProcess**: Windows API
- **taskkill**: Command line

```cmd
taskkill /F /PID 1234
```

#### Linux

- **SIGTERM**: Termination signal
- **SIGKILL**: Kill signal
- **kill**: Command line

```bash
kill -TERM 1234
kill -9 1234
```

### Process Trees

#### Windows

- **Job Objects**: Job objects for process groups
- **Parent-Child**: Parent-child relationships
- **Task Manager**: Task Manager

#### Linux

- **Process Groups**: Process groups
- **Sessions**: Sessions
- **pstree**: Process tree

### Background Processes

#### Windows

```cmd
# Start in background
start /B notepad.exe
```

#### Linux

```bash
# Run in background
gedit &

# No hangup
nohup gedit &
```

## Environment Variables

### Setting Environment Variables

#### Windows

```cmd
# Set temporarily
set PATH=%PATH%;C:\new\path

# Set permanently
setx PATH "%PATH%;C:\new\path"
```

#### Linux

```bash
# Set temporarily
export PATH=$PATH:/new/path

# Set permanently (add to ~/.bashrc)
echo 'export PATH=$PATH:/new/path' >> ~/.bashrc
```

### Reading Environment Variables

#### Python

```python
import os

# Read environment variable
path = os.environ.get('PATH', '')
```

#### Node.js

```javascript
// Read environment variable
const path = process.env.PATH || '';
```

#### Shell

```bash
# Read environment variable
echo $PATH
```

### Environment Variable Differences

#### Windows

- **PATH**: Path separator is semicolon (;)
- **HOME**: Not standard (use USERPROFILE)
- **TEMP**: Temporary directory
- **APPDATA**: Application data directory

#### Linux

- **PATH**: Path separator is colon (:)
- **HOME**: Home directory
- **TMP**: Temporary directory
- **XDG_DATA_HOME**: Data directory

### Cross-Platform Environment Variables

```python
import os
from pathlib import Path

# Cross-platform home directory
home = Path.home()

# Cross-platform temp directory
temp = Path(os.environ.get('TMP', '/tmp'))

# Cross-platform data directory
if os.name == 'nt':
    data_dir = Path(os.environ.get('APPDATA'))
else:
    data_dir = Path.home() / '.local' / 'share'
```

## Packaging

#### Windows

- **Installer**: MSI, NSIS
- **Portable**: Zip archive
- **ClickOnce**: ClickOnce deployment
- **MSIX**: MSIX packaging

#### Linux

- **DEB**: Debian packages
- **RPM**: Red Hat packages
- **AppImage**: Self-contained
- **Flatpak**: Containerized
- **Snap**: Universal packages

### Packaging Tools

#### Electron

- **electron-builder**: Cross-platform packaging
- **electron-forge**: Build tool
- **electron-packager**: Packager

#### Python

- **PyInstaller**: Cross-platform executables
- **cx_Freeze**: Cross-platform executables
- **py2exe**: Windows only
- **py2app**: macOS only

#### Rust

- **cargo**: Cross-platform compilation
- **cross**: Cross compilation tool
- **rustup**: Rust toolchain manager

## Cross-Platform Best Practices

### Use Cross-Platform Libraries

- **Path**: Use path libraries
- **File I/O**: Use cross-platform libraries
- **Process**: Use cross-platform process libraries
- **Network**: Use cross-platform network libraries

### Test on All Platforms

- **CI**: Test on all platforms in CI
- **Local**: Test on all platforms locally
- **VMs**: Use VMs for testing
- **Containers**: Use containers

### Handle Differences Explicitly

- **Detect**: Detect platform
- **Branch**: Branch on platform
- **Document**: Document differences
- **Test**: Test platform-specific code

```python
import os
import sys

if os.name == 'nt':
    # Windows-specific code
    pass
elif sys.platform == 'darwin':
    # macOS-specific code
    pass
else:
    # Linux-specific code
    pass
```

### Use Configuration Files

- **Config**: Use configuration files
- **Environment**: Use environment variables
- **Defaults**: Provide sensible defaults
- **Override**: Allow overrides

### Document Platform-Specific Behavior

- **README**: Document in README
- **Docs**: Document in docs
- **Issues**: Document known issues
- **Workarounds**: Document workarounds
