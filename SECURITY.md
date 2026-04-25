# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.3.x   | :white_check_mark: |
| 1.2.x   | :white_check_mark: |
| < 1.2   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in SWEObeyMe, please report it responsibly.

### How to Report

**Do not** open a public issue for security vulnerabilities. Instead, send an email to:

- **Email**: [INSERT SECURITY EMAIL]
- **Subject**: [Security] SWEObeyMe Vulnerability Report

### What to Include

Please include the following information in your report:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact of the vulnerability
- Any suggested fixes or mitigations
- Your name and contact information (for follow-up)

### Response Timeline

- We will acknowledge receipt of your report within 48 hours
- We will provide a detailed response within 7 days
- We will work with you to understand and validate the issue
- We will aim to release a fix within 30 days for critical issues

### Disclosure Policy

We follow responsible disclosure principles:

- We will coordinate with you on the disclosure timeline
- We will credit you for the discovery (unless you prefer anonymity)
- We will disclose the vulnerability after a fix is released
- We will publish a security advisory with details

## Security Best Practices

### For Users

- Keep your VS Code and extensions updated
- Review the source code before using in production
- Configure appropriate file access permissions
- Regularly review backup files and logs
- Use the surgical governance features as intended

### For Developers

- Follow the [Contributing Guidelines](CONTRIBUTING.md)
- Use the provided linting and formatting tools
- Review code changes for security implications
- Test changes thoroughly before submitting
- Report any security concerns you discover

## Security Features

SWEObeyMe includes several security-focused features:

- File operation validation and backup
- Surgical governance to prevent unauthorized changes
- Project memory with integrity tracking
- C# error detection and reporting
- Duplicate and loop detection

### File Security

- Automatic backups before file modifications
- Validation of file paths and operations
- Detection of potentially dangerous operations
- Confirmation prompts for destructive actions

### Data Protection

- Project memory stored locally in workspace
- No external data transmission
- Secure file operations with validation
- Backup retention policies

## Known Security Considerations

- The extension runs with VS Code's permissions
- File operations are subject to OS-level permissions
- Project memory files are not encrypted
- C# Bridge analyzes code but does not execute it

## Security Updates

Security updates will be released as:

- **Critical**: Immediate release (within 24-48 hours)
- **High**: Priority release (within 7 days)
- **Medium**: Next scheduled release
- **Low**: Next minor release

Users will be notified through:

- GitHub Security Advisories
- VS Code Marketplace update notifications
- Release notes with security bulletins

## Security Resources

- [GitHub Security](https://github.com/security)
- [VS Code Security](https://code.visualstudio.com/docs/editor/security)
- [OWASP](https://owasp.org/)
- [CVE Database](https://cve.mitre.org/)

## License

This security policy is part of the SWEObeyMe project. See the [LICENSE](LICENSE) file for details.

## Contact

For general security questions or concerns, please open an issue with the "security" label.

Thank you for helping keep SWEObeyMe secure!
