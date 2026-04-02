# Branching Strategy

This document describes the branching strategy used in the SWEObeyMe project. We follow a Git Flow-inspired workflow with adaptations for modern CI/CD practices.

## Overview

Our branching strategy is designed to:
- Maintain a stable production branch
- Enable parallel feature development
- Facilitate quick hotfixes for production issues
- Support continuous integration and deployment
- Provide clear release management

## Main Branches

### main (Production)

- **Purpose**: Production-ready code that is deployed to users
- **Protection**: Protected branch, requires PR approval
- **Source**: Merged from `release/*` or `hotfix/*` branches
- **Status**: Always stable and deployable
- **Tags**: Every merge to main creates a version tag (v1.0.0, v1.0.1, etc.)

### develop (Integration)

- **Purpose**: Integration branch for features and bug fixes
- **Protection**: Protected branch, requires PR approval
- **Source**: Merged from `feature/*` and `fix/*` branches
- **Status**: Should be stable but may contain unreleased features
- **CI**: Runs full test suite on every push

## Supporting Branches

### feature/*

- **Purpose**: Develop new features
- **Source**: Branched from `develop`
- **Target**: Merged into `develop` via PR
- **Naming**: `feature/short-description` or `feature/JIRA-123-description`
- **Lifespan**: Short to medium term
- **Example**: `feature/user-authentication`

### fix/*

- **Purpose**: Fix bugs that are not production emergencies
- **Source**: Branched from `develop`
- **Target**: Merged into `develop` via PR
- **Naming**: `fix/short-description` or `fix/JIRA-456-description`
- **Lifespan**: Short term
- **Example**: `fix/login-validation-error`

### hotfix/*

- **Purpose**: Emergency fixes for production issues
- **Source**: Branched from latest `main` tag
- **Target**: Merged into both `main` and `develop`
- **Naming**: `hotfix/vX.Y.Z` where X.Y.Z is the version being patched
- **Lifespan**: Very short term (hours to days)
- **Example**: `hotfix/v1.0.13`
- **Documentation**: See [HOTFIX.md](./HOTFIX.md)

### release/*

- **Purpose**: Prepare for a new release
- **Source**: Branched from `develop`
- **Target**: Merged into `main` (for release) and `develop` (for backport)
- **Naming**: `release/vX.Y.Z` where X.Y.Z is the upcoming version
- **Lifespan**: Short term (days to weeks)
- **Example**: `release/v1.1.0`
- **Activities**: Final testing, version bumping, documentation updates

## Workflow Diagram

```
main (v1.0.0) ──────────────────────────────────┐
                                              │
                                              │ merge
                                              ↓
develop ────────────────────────────────── release/v1.1.0 ──┐
  │                                         │                │
  │ merge                                   │ merge          │ merge
  │                                         │                │
  ├─ feature/auth ──────────────────────────┘                │
  │                                                          │
  ├─ feature/ui ────────────────────────────────────────────┘
  │
  ├─ fix/login ─────────────────────────────────────────────┐
  │                                                          │
  └─ hotfix/v1.0.1 ─────────────────────────────────────────┘
        │
        │ merge to main (v1.0.1)
        │
        └─ merge back to develop
```

## Feature Development Workflow

### 1. Start a New Feature

```bash
# Ensure you're on develop and it's up to date
git checkout develop
git pull origin develop

# Create a new feature branch
git checkout -b feature/your-feature-name
```

### 2. Develop the Feature

- Make your changes
- Write tests
- Update documentation
- Commit frequently using conventional commits:
  ```bash
  npm run commit
  ```

### 3. Test Locally

```bash
# Run linter
npm run lint

# Run tests
npm test

# Build the project
npm run build
```

### 4. Push and Create PR

```bash
# Push your branch
git push origin feature/your-feature-name
```

Then create a Pull Request:
- Base: `develop`
- Compare: `feature/your-feature-name`
- Fill in the PR template
- Request review from at least one team member

### 5. Address Review Feedback

- Make requested changes
- Push updates to your branch
- Respond to review comments

### 6. Merge to Develop

- After approval, merge using squash merge
- Delete the feature branch (if desired)

## Bug Fix Workflow

### 1. Start a Fix

```bash
# Ensure you're on develop and it's up to date
git checkout develop
git pull origin develop

# Create a new fix branch
git checkout -b fix/your-bug-fix
```

### 2. Fix the Bug

- Implement the fix
- Add or update tests
- Commit using conventional commits:
  ```bash
  npm run commit
  # Use type: fix
  ```

### 3. Test and Create PR

```bash
# Test the fix
npm test
npm run lint

# Push and create PR
git push origin fix/your-bug-fix
```

### 4. Merge to Develop

- Follow the same process as feature development
- Target: `develop` branch

## Release Workflow

### 1. Prepare Release

```bash
# Ensure develop is ready for release
git checkout develop
git pull origin develop

# Create release branch
git checkout -b release/v1.1.0
```

### 2. Finalize Release

- Update version numbers
- Update CHANGELOG.md
- Final testing
- Fix any critical bugs found

### 3. Merge to Main

```bash
# Merge release to main
git checkout main
git merge release/v1.1.0

# Tag the release
git tag -a v1.1.0 -m "Release v1.1.0"

# Push to main
git push origin main --tags
```

### 4. Backport to Develop

```bash
# Merge release back to develop
git checkout develop
git merge release/v1.1.0
git push origin develop

# Delete release branch
git branch -d release/v1.1.0
```

## Hotfix Workflow

See [HOTFIX.md](./HOTFIX.md) for detailed hotfix procedures.

## Branch Protection Rules

### main Branch

- **Status**: Protected
- **Required reviews**: At least 1 approval
- **Dismiss stale reviews**: Yes
- **Require branches to be up to date**: Yes
- **Require status checks**: All CI checks must pass
- **Restrict who can push**: Only maintainers

### develop Branch

- **Status**: Protected
- **Required reviews**: At least 1 approval
- **Dismiss stale reviews**: Yes
- **Require branches to be up to date**: Yes
- **Require status checks**: All CI checks must pass
- **Restrict who can push**: Only maintainers

## Commit Message Standards

We use conventional commits. Use `npm run commit` to be guided through the process.

### Format

```
type(scope): subject

body

footer
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other changes
- `revert`: Revert a previous commit
- `hotfix`: Emergency production fix

### Examples

```
feat(auth): add OAuth2 support

Implement OAuth2 authentication with Google and GitHub providers.

Closes #123
```

```
fix(api): handle null response from user endpoint

Previously, null responses would cause the application to crash.
Now we properly handle null responses and return appropriate error messages.

Fixes #456
```

## CI/CD Integration

All branches have CI/CD pipelines:

### feature/* and fix/* branches
- Run on every push
- Linting
- Unit tests
- Build verification
- No deployment

### develop branch
- Run on every push
- Full test suite
- Integration tests
- Build verification
- Deployment to staging (if configured)

### main branch
- Run on every push
- Full test suite
- Security scans
- Build and package
- Deployment to production (if configured)
- Release creation

### hotfix/* branches
- Run on every push
- Critical tests only
- Build verification
- Deployment to production (after merge)

## Best Practices

### 1. Keep Branches Focused
- Each branch should have a single purpose
- Don't mix features and bug fixes
- Keep branches small and focused

### 2. Short-Lived Branches
- Feature branches should live 1-2 weeks maximum
- Fix branches should be merged within days
- Hotfix branches should be merged within hours

### 3. Frequent Commits
- Commit often with meaningful messages
- Use conventional commits format
- Use `npm run commit` for guidance

### 4. Keep develop Stable
- Don't push broken code to develop
- Ensure tests pass before pushing
- Resolve conflicts promptly

### 5. Use Pull Requests
- All changes must go through PRs
- Use PR templates
- Request reviews before merging
- Address all review feedback

### 6. Delete Merged Branches
- Clean up merged branches regularly
- Use GitHub's automatic branch deletion
- Keep the repository clean

### 7. Sync Frequently
- Pull latest changes before starting work
- Rebase with develop if your branch falls behind
- Resolve conflicts early

### 8. Write Tests
- Write tests for new features
- Update tests for bug fixes
- Maintain test coverage above 70%

## Troubleshooting

### Merge Conflicts

```bash
# If you encounter conflicts when merging to develop
git checkout develop
git pull origin develop
git checkout feature/your-feature
git rebase develop

# Resolve conflicts
# Then continue
git rebase --continue

# Force push (careful!)
git push origin feature/your-feature --force-with-lease
```

### Accidental Commit to main

```bash
# If you accidentally commit to main
# Create a new branch
git checkout -b feature/accidental-commit

# Reset main to previous commit
git checkout main
git reset --hard HEAD~1

# Push the fix
git push origin main --force

# Now work on the feature branch properly
```

## Related Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [HOTFIX.md](./HOTFIX.md) - Hotfix procedures
- [README.md](./README.md) - Project overview

## Questions?

If you have questions about the branching strategy, please:
1. Check this documentation
2. Review existing PRs for examples
3. Ask in team discussions
4. Create an issue for clarification
