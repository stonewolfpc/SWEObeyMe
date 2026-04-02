# Contributing to SWEObeyMe

Thank you for your interest in contributing to SWEObeyMe! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- Git
- npm or yarn

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/SWEObeyMe.git
   cd SWEObeyMe
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

## Development Workflow

### Branching Strategy

We use a Git Flow-inspired branching strategy:

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature branches
- `fix/*`: Bug fix branches
- `hotfix/*`: Emergency production fixes
- `release/*`: Pre-release stabilization

### Creating a Feature

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards

3. Commit your changes using conventional commits:
   ```bash
   npm run commit
   ```
   This will guide you through the commit message format.

4. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

5. Create a Pull Request to `develop`

### Creating a Bug Fix

1. Create a fix branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b fix/your-bug-fix
   ```

2. Make your changes and add tests

3. Commit using conventional commits:
   ```bash
   npm run commit
   ```

4. Push and create a Pull Request to `develop`

### Creating a Hotfix

Hotfixes are for emergency production fixes. See [HOTFIX.md](./HOTFIX.md) for detailed instructions.

## Code Standards

### Commit Messages

We use conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other changes
- `revert`: Revert a previous commit
- `hotfix`: Emergency production fix

### Code Style

- Use ESLint for linting
- Use Prettier for formatting
- Run `npm run lint` to check for issues
- Run `npm run format` to format code
- Run `npm run lint:fix` to auto-fix linting issues

### Testing

- Write unit tests for new features
- Maintain test coverage above 70%
- Run `npm test` to run tests
- Run `npm run test:coverage` to generate coverage report

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Update the CHANGELOG.md with your changes
4. Create a Pull Request using our PR template
5. Request review from at least one maintainer
6. Address review feedback
7. Once approved, your PR will be merged

### PR Review Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is well-commented
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] Breaking changes documented

## Release Process

Releases are automated using semantic versioning:

1. Maintain conventional commits
2. Merge PR to `develop`
3. Release is created automatically when merging to `main`
4. Version is bumped automatically based on commit types

## Reporting Issues

When reporting issues, please include:

- Clear description of the problem
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node.js version, etc.)
- Screenshots if applicable

## Questions?

Feel free to open an issue with your question, or contact the maintainers.

Thank you for contributing!
