# ARES Test Rig

The ARES (Advanced Rig for Enterprise Simulation) Test Rig is a complete, editor-agnostic, MCP-aware, cross-platform simulation environment for SWEObeyMe.

## Purpose

This rig provides deterministic confidence (99.9%) that SWEObeyMe will work on every machine by simulating:
- Every failure mode
- Every OS
- Every config
- Every user behavior
- Every edge case

## Architecture

The rig consists of 10 simulation layers:

1. **Multi-Editor Simulation Layer** - Simulates Windsurf, Windsurf-Next, VS Code, Continue.dev, Cursor
2. **OS Matrix Simulation** - Simulates Windows (NTFS), macOS (APFS), Linux (ext4)
3. **MCP Loader Stress Test** - Corrupted config, race conditions, invalid JSON, crashes
4. **Tool Arbitration Test** - Model misbehavior, hallucinations, parameter errors
5. **File System Chaos Test** - Locked files, permissions, symlinks, long paths
6. **Workspace Awareness Test** - Multi-root, nested, missing workspaces
7. **Provider Failure Simulation** - Ollama, OpenAI, Anthropic failures
8. **Webview Failure Simulation** - CSP violations, crashes, reloads
9. **Checkpoint Stress Test** - 10k checkpoints, corruption, conflicts
10. **Full End-to-End Software Factory Test** - Complete user workflow simulation

## Usage

```bash
# Run all tests
node ares-rig.js --all

# Run specific layer
node ares-rig.js --layer mcp-loader

# Run with specific OS simulation
node ares-rig.js --os windows

# Run with specific editor simulation
node ares-rig.js --editor windsurf

# Generate report
node ares-rig.js --report
```

## Structure

```
ares-rig/
├── ares-rig.js              # Main test runner
├── config/                  # Test configurations
├── simulators/              # Simulation layers
│   ├── editor/             # Editor simulators
│   ├── os/                 # OS simulators
│   ├── mcp/                # MCP simulators
│   ├── fs/                 # File system simulators
│   ├── provider/           # Provider simulators
│   └── webview/            # Webview simulators
├── tests/                   # Test suites
│   ├── mcp-loader/         # MCP loader tests
│   ├── tool-arbitration/    # Tool arbitration tests
│   ├── workspace/           # Workspace awareness tests
│   ├── checkpoint/          # Checkpoint stress tests
│   └── e2e/                # End-to-end tests
├── fixtures/                # Test fixtures and data
├── reports/                 # Test reports
└── utils/                   # Utility functions
```

## Results

Building this rig provides:
- Deterministic confidence
- Cross-platform reliability
- Editor-agnostic behavior
- Provider-agnostic behavior
- Zero-guessing deployment
- Reproducible failures
- Reproducible fixes
- A sovereign test environment

This is how you ship software that never guesses.
