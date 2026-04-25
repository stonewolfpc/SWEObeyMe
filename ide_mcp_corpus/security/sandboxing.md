# Security & Sandboxing

## Overview

This document covers capability-based security, sandboxing patterns, syscall filtering, resource limits, and safe execution patterns. These concepts are essential for building safe MCP tools, safe file access, safe code execution, and safe user-provided input handling.

## Capability-Based Security

### Core Concept

- **Capabilities**: Unforgeable tokens representing authority
- **Principle of Least Privilege**: Only grant necessary capabilities
- **No Global Authority**: No central permission system
- **Delegation**: Capabilities can be delegated

### vs ACL-Based Security

- **ACL**: Access Control Lists - who can do what
- **Capabilities**: What can be done (by whoever holds it)
- **ACL**: Centralized, difficult to reason about
- **Capabilities**: Decentralized, local reasoning

### Capability Design

- **Unforgeable**: Cannot be created arbitrarily
- **Transferable**: Can be passed between processes
- **Revocable**: Can be revoked when needed
- **Fine-Grained**: Specific to single operation

### Examples

- **File Descriptors**: Unix file descriptors are capabilities
- **Object References**: Language-level references
- **Tokens**: JWT tokens with claims
- **Handles**: Windows handles

### Implementations

- **seL4**: Capability-based microkernel
- **Capsicum**: FreeBSD capability framework
- **Chromium**: Capability-based security model
- **Web**: Origin-based capabilities

## Sandboxing Patterns

### Process Sandboxing

- **Separate Process**: Run untrusted code in separate process
- **Restricted Permissions**: Limit what process can do
- **Resource Limits**: CPU, memory, file descriptors
- **Monitoring**: Watch for suspicious behavior

### Container Sandboxing

- **Docker**: Container-based isolation
- **Namespaces**: Process, network, filesystem isolation
- **Cgroups**: Resource limits
- **Seccomp**: Syscall filtering

### Language Sandboxing

- **JavaScript**: Browser sandbox
- **Python**: Restricted execution environment
- **WebAssembly**: Sandboxed code execution
- **Safe Languages**: Rust, Java (with security manager)

### VM Sandboxing

- **KVM**: Kernel-based VM
- **QEMU**: Hardware virtualization
- **Firecracker**: Lightweight VMs
- **gVisor**: User-space kernel

## Syscall Filtering

### Seccomp-BPF

- **BPF Programs**: Attach BPF filter to syscalls
- **Filter Rules**: Allow/deny specific syscalls
- **Performance**: Low overhead
- **Linux**: Native support

### Seccomp Modes

- **Strict Mode**: Only allow read, write, exit, sigreturn
- **Filter Mode**: Allow specific syscalls based on BPF
- **Warn-Only Mode**: Log but don't block (for debugging)

### Implementation

```c
#include <linux/seccomp.h>
#include <sys/prctl.h>

// Enable seccomp
prctl(PR_SET_SECCOMP, SECCOMP_MODE_FILTER, &prog);

// BPF program to filter syscalls
struct sock_fprog prog = {
    .len = sizeof(filter) / sizeof(filter[0]),
    .filter = filter,
};
```

### Common Filters

- **File Operations**: Allow specific file operations
- **Network**: Block network access
- **IPC**: Block IPC mechanisms
- **Process**: Block process creation

### Tools

- **seccomp-tools**: Analyze seccomp filters
- **libseccomp**: Library for seccomp
- **strace**: Trace syscalls for filter design

### Landlock

- **Linux 5.13+:** Filesystem access control
- **Rules-based**: Define access rules
- **No Privilege Drop**: Works without dropping privileges
- **Declarative**: Easier to use than seccomp

### Seatbelt (macOS)

- **macOS Sandbox**: macOS sandbox framework
- **Profiles**: Predefined sandbox profiles
- **Custom Rules**: Define custom rules
- **System Call Filtering**: Similar to seccomp

## Resource Limits

### CPU Limits

- **CPU Quotas**: Limit CPU time
- **Nice/Priority**: Adjust scheduling priority
- **Cgroups**: CPU shares and quotas
- **ulimit**: Per-process limits

### Memory Limits

- **RLIMIT_AS**: Address space limit
- **RLIMIT_DATA**: Data segment limit
- **RLIMIT_STACK**: Stack size limit
- **Cgroups**: Memory limits and OOM control

### File Descriptor Limits

- **RLIMIT_NOFILE**: Open file descriptor limit
- **ulimit -n**: Set per-process limit
- **System-wide**: /proc/sys/fs/file-max
- **Monitoring**: Track usage

### Network Limits

- **Bandwidth**: Rate limiting
- **Connections**: Connection limits
- **Firewall**: Block unwanted traffic
- **Namespaces**: Network isolation

### Implementation

```c
#include <sys/resource.h>

struct rlimit lim;
lim.rlim_cur = 1024;  // Soft limit
lim.rlim_max = 4096;  // Hard limit
setrlimit(RLIMIT_NOFILE, &lim);
```

### Cgroups

- **Control Groups**: Linux resource management
- **Subsystems**: CPU, memory, devices, etc.
- **Hierarchy**: Nested control groups
- **v2**: Unified hierarchy

## Safe Tool Execution

### Input Validation

- **Type Checking**: Validate input types
- **Range Checking**: Validate input ranges
- **Sanitization**: Remove dangerous content
- **Encoding**: Proper encoding/decoding

### Output Sanitization

- **Escaping**: Escape special characters
- **Encoding**: Use safe encodings
- **Filtering**: Remove sensitive data
- **Validation**: Validate output format

### Command Injection Prevention

- **Avoid Shell**: Don't use shell for command execution
- **Argument Arrays**: Use execve with array
- **Whitelisting**: Whitelist allowed commands
- **Escaping**: Properly escape arguments

### Code Injection Prevention

- **No eval**: Never evaluate untrusted code
- **Restricted Environment**: Use restricted execution
- **Static Analysis**: Analyze code before execution
- **Sandboxing**: Run in sandbox

## Safe File Access

### Path Traversal Prevention

- **Canonicalize Paths**: Resolve symlinks, remove ..
- **Whitelist Directories**: Only allow specific directories
- **Chroot**: Change root directory
- **Namespaces**: Filesystem isolation

### File Permission Checks

- **Principle of Least Privilege**: Minimum necessary permissions
- **Read-Only**: Default to read-only when possible
- **Temporary Files**: Use secure temp file creation
- **Atomic Operations**: Use atomic file operations

### Secure File Operations

- **Atomic Writes**: Write to temp, rename
- **Locking**: Use file locking when needed
- **Permissions**: Set appropriate permissions
- **Cleanup**: Clean up temp files

### Implementation

```python
import os
import tempfile

# Secure temp file
with tempfile.NamedTemporaryFile(mode='w', delete=False) as f:
    f.write(data)
    temp_path = f.name

# Atomic rename
os.rename(temp_path, final_path)
```

## Safe Code Execution

### Restricted Execution Environments

- **PyPy Sandbox**: Restricted Python execution
- **RestrictedPython**: Python sandbox library
- **JS Sandbox**: Browser or Node.js sandbox
- **WebAssembly**: Sandboxed execution

### Language-Level Sandboxing

- **SafePython**: Restricted Python subset
- **Jail**: Python jail library
- **Brython**: Python in browser sandbox
- **Transcrypt**: Python to JavaScript

### VM-Based Execution

- **Firecracker**: Lightweight VM for code execution
- **gVisor**: User-space kernel for containers
- **Kata Containers**: VM-based containers
- **QEMU**: Full virtualization

### Timeout and Resource Limits

- **Execution Timeout**: Limit execution time
- **Memory Limits**: Prevent memory bombs
- **CPU Limits**: Limit CPU usage
- **Network Limits**: Block network access

## Safe User-Provided Input

### Input Validation

- **Type Validation**: Check input types
- **Length Limits**: Enforce maximum lengths
- **Character Whitelisting**: Allow only safe characters
- **Pattern Matching**: Validate against patterns

### Sanitization

- **HTML Sanitization**: Remove dangerous HTML
- **SQL Injection**: Use parameterized queries
- **Command Injection**: Avoid shell commands
- **XSS Prevention**: Escape output

### Encoding

- **UTF-8**: Use consistent encoding
- **Base64**: For binary data
- **JSON**: For structured data
- **URL Encoding**: For URLs

### Rate Limiting

- **Per-User Limits**: Limit requests per user
- **Per-IP Limits**: Limit requests per IP
- **Token Buckets**: Smooth rate limiting
- **Backpressure**: Signal overload

## Monitoring and Auditing

### Logging

- **Security Events**: Log security-relevant events
- **Audit Trail**: Maintain audit trail
- **Log Rotation**: Rotate logs to prevent disk fill
- **Secure Storage**: Protect log files

### Anomaly Detection

- **Behavior Analysis**: Detect unusual behavior
- **Rate Limiting**: Detect abuse patterns
- **Resource Monitoring**: Monitor resource usage
- **Alerting**: Alert on suspicious activity

### Forensics

- **Preserve Evidence**: Don't destroy evidence
- **Timeline**: Reconstruct events
- **Root Cause**: Find root cause of incidents
- **Lessons Learned**: Improve security posture

## Best Practices

### Defense in Depth

- **Multiple Layers**: Don't rely on single defense
- **Layered Security**: Network, host, application
- **Fail Secure**: Default to secure on failure
- **Least Privilege**: Minimum necessary access

### Secure by Design

- **Security First**: Design for security from start
- **Threat Modeling**: Identify threats early
- **Secure Defaults**: Default to secure configuration
- **Security Reviews**: Review code for security

### Secure Deployment

- **Hardening**: Harden systems before deployment
- **Updates**: Keep systems updated
- **Monitoring**: Monitor for security issues
- **Incident Response**: Plan for incidents

### Secure Development

- **Code Review**: Review code for security
- **Static Analysis**: Use static analysis tools
- **Dynamic Analysis**: Use dynamic analysis tools
- **Penetration Testing**: Test security proactively
