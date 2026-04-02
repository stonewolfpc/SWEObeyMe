# SWE Automation MCP Server

> **Note from the Developer (April 2026):** Oops! I should have read the documentation for the updated methods more carefully before releasing v1.0.4. The Windsurf Next March 2026 update introduced strict URI normalization and Trusted Types requirements that I initially missed. I've now updated the extension to properly handle `file:///` URIs and removed all `process.exit()` calls that were causing issues with the VS Code extension host. Sorry about the trouble, folks! I hope this works better for you now. - stonewolfpc

A comprehensive Model Context Protocol (MCP) server designed specifically for SWE-1.5 and other AI models to enhance software engineering workflows with advanced automation capabilities.

## Overview

This MCP server provides intelligent automation tools that integrate seamlessly with Windsurf, enabling AI models to perform complex software engineering tasks with enhanced efficiency and accuracy.

## Features

### 🔧 Core Automation Tools

- **Project Structure Analysis**: Deep analysis of codebase architecture, dependencies, and patterns
- **Smart File Operations**: Intelligent file management with automatic backups and safety checks
- **Automated Testing**: Test generation, execution, and coverage analysis
- **Code Quality Analysis**: Comprehensive quality metrics, code smell detection, and improvement suggestions
- **Dependency Management**: Automated dependency analysis, updates, and vulnerability scanning

### 🚀 Advanced Capabilities

- **Debug Assistant**: Intelligent debugging with root cause analysis and fix suggestions
- **Performance Optimization**: Bottleneck identification and performance enhancement recommendations
- **Documentation Generator**: AI-powered documentation creation for APIs, READMEs, and architecture
- **Security Scanner**: Comprehensive security analysis with vulnerability detection
- **Deployment Automation**: Automated deployment pipeline setup and execution

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- Windsurf IDE with MCP support
- Git (for some features)

### Setup

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Configure Windsurf to use the MCP server (see Configuration section)

## Configuration

### Windsurf Integration

Add the following to your Windsurf MCP configuration:

```json
{
  "mcpServers": {
    "swe-obey-me": {
      "command": "node",
      "args": ["d:/SWEObeyMe-restored/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Environment Variables

- `NODE_ENV`: Set to 'production' for production use
- `SWE_BACKUP_DIR`: Custom backup directory (default: `.swe-backups`)
- `SWE_LOG_LEVEL`: Logging level (default: `info`)

## Usage

### Available Tools

The server provides 10 main automation tools:

1. **analyze_project_structure**
   - Analyzes project structure and identifies key components
   - Returns architecture patterns, dependencies, and metrics

2. **smart_file_operations**
   - Performs intelligent file operations with safety checks
   - Supports create, update, delete, move, and copy operations

3. **automated_testing**
   - Generates and runs automated tests
   - Supports unit, integration, e2e, and performance testing

4. **code_quality_analysis**
   - Performs comprehensive code quality analysis
   - Provides metrics, smells detection, and improvement suggestions

5. **dependency_management**
   - Automated dependency analysis and management
   - Includes vulnerability scanning and updates

6. **debug_assistant**
   - Intelligent debugging assistance
   - Root cause analysis and fix suggestions

7. **performance_optimization**
   - Performance analysis and optimization
   - Bottleneck identification and benchmarking

8. **documentation_generator**
   - AI-powered documentation generation
   - Supports API docs, READMEs, and architecture documentation

9. **security_scanner**
   - Comprehensive security analysis
   - Vulnerability detection and security recommendations

10. **deployment_automation**
    - Automated deployment pipeline management
    - Setup, deploy, rollback, and status monitoring

### Example Usage

#### Analyze Project Structure

```json
{
  "tool": "analyze_project_structure",
  "arguments": {
    "path": "./src",
    "depth": 3
  }
}
```

#### Smart File Operations

```json
{
  "tool": "smart_file_operations",
  "arguments": {
    "operation": "create",
    "source": "./src/new-component.ts",
    "content": "// New component code",
    "backup": true
  }
}
```

#### Automated Testing

```json
{
  "tool": "automated_testing",
  "arguments": {
    "target": "./src/utils",
    "testType": "unit",
    "coverage": true
  }
}
```

## Development

### Project Structure

```
src/
├── index.ts                 # Main server entry point
├── tools/
│   └── swe-automation.ts   # Tool definitions and handlers
├── utils/
│   ├── file-manager.ts      # File operations utility
│   ├── project-analyzer.ts  # Project analysis utility
│   └── task-runner.ts       # Task execution utility
└── types/
    └── index.ts            # Type definitions
```

### Scripts

- `npm run build`: Build the TypeScript project
- `npm run start`: Start the MCP server
- `npm run dev`: Development mode with watch
- `npm test`: Run tests
- `npm run lint`: Lint the code
- `npm run format`: Format the code

### Building

```bash
npm run build
```

This creates the `dist/` directory with compiled JavaScript files ready for execution.

## API Reference

### Tool Execution

All tools follow a consistent execution pattern:

1. **Input Validation**: Parameters are validated before execution
2. **Safety Checks**: Additional safety checks for destructive operations
3. **Backup Creation**: Automatic backups for file operations (when enabled)
4. **Execution**: Core tool logic is executed
5. **Result Formatting**: Results are formatted and returned
6. **Logging**: Operations are logged for audit and debugging

### Error Handling

- Validation errors are returned with descriptive messages
- Runtime errors are caught and reported with context
- Backup files are created before destructive operations
- Rollback functionality is available where applicable

## Security Considerations

- File operations are restricted to the workspace directory
- External command execution is limited to approved tools
- Network access is restricted to approved domains
- All operations are logged for audit purposes

## Troubleshooting

### Common Issues

1. **Module not found errors**: Ensure all dependencies are installed with `npm install`
2. **Permission denied**: Check file permissions and workspace access
3. **Command not found**: Ensure required tools are installed and in PATH

### Debug Mode

Enable debug logging by setting:
```bash
export SWE_LOG_LEVEL=debug
```

### Logs

Check the following locations for logs:
- Console output for real-time logs
- `.swe-backups/` directory for operation logs
- Windsurf developer tools for MCP communication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

## Changelog

### v1.0.12
- Updated version references
- Version alignment across all project files
