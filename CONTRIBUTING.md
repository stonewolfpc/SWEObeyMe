# Contributing to SWEObeyMe

Thank you for your interest in contributing to SWEObeyMe! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) in all interactions with the project.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git
- VS Code (recommended)

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/SWEObeyMe.git
   cd SWEObeyMe
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Install git hooks:
   ```bash
   npm run prepare
   ```

## Development Workflow

### Branching Strategy

- `main` - Stable production code

- `develop` - Integration branch for features

- `feature/*` - Feature branches

- `fix/*` - Bug fix branches

- `docs/*` - Documentation updates

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:

- `feat`: New feature

- `fix`: Bug fix

- `docs`: Documentation changes

- `style`: Code style changes (formatting)

- `refactor`: Code refactoring

- `perf`: Performance improvements

- `test`: Test additions/changes

- `build`: Build system changes

- `ci`: CI configuration changes

- `chore`: Other changes

Example:

```text
feat(handlers): add file operation validation

Implement validation for file operations to ensure
compliance with surgical governance rules.

Closes #123
```

### Pre-commit Hooks

Our project uses Husky for git hooks with lint-staged to ensure code quality:

- ESLint runs automatically on staged JavaScript files
- Prettier formats code before commit
- Commitizen guides you through writing conventional commit messages

## Coding Standards

### File Structure

- Maximum 700 lines per file (surgical limit)
- Logical separation of concerns
- Clear, descriptive file names (kebab-case)
- Organize code into logical modules

### Code Style

We use ESLint and Prettier for consistent code formatting:

```bash
npm run lint      # Check code style
npm run lint:fix  # Fix auto-fixable issues
npm run format    # Format all files
```

### Documentation

- Add JSDoc comments to all public functions and classes
- Include parameter types and return types
- Provide usage examples where appropriate
- Keep comments concise and up-to-date

### Testing

Write tests for new features and bug fixes:

```bash
npm test  # Run all tests
```

## Submitting Changes

### Pull Request Process

1. Create a new branch from `develop`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Commit with conventional commit messages
4. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a Pull Request

### Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] PR description clearly describes changes
- [ ] No merge conflicts with target branch

### Review Process

- Maintainers will review your PR
- Address review feedback promptly
- Keep PRs focused and small
- Rebase if necessary to keep history clean

## Reporting Issues

### Bug Reports

Use the [issue template](.github/ISSUE_TEMPLATE/bug_report.md) to report bugs:

1. Search existing issues first
2. Provide clear description of the problem
3. Include steps to reproduce
4. Add relevant logs/screenshots
5. Specify environment details

### Feature Requests

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md):

1. Describe the feature clearly
2. Explain the use case
3. Suggest implementation approach if possible
4. Consider impact on existing functionality

### Questions

For questions, use GitHub Discussions or check existing documentation.

## Additional Resources

- [Architecture Documentation](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Security Policy](SECURITY.md)

## License

By contributing to SWEObeyMe, you agree that your contributions will be licensed under the project's license.

Thank you for contributing!
