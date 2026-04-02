# Hotfix Workflow

This document describes the hotfix workflow for emergency production fixes.

## What is a Hotfix?

A hotfix is an emergency fix for a production issue that requires immediate attention. Hotfixes bypass the normal development workflow to address critical issues quickly.

## When to Use Hotfixes

Hotfixes should only be used for:

- Security vulnerabilities
- Data corruption issues
- Complete service outages
- Revenue-impacting bugs
- Critical functionality failures

Do NOT use hotfixes for:
- Minor bugs
- Feature requests
- Performance optimizations
- Documentation updates
- Code refactoring

## Hotfix Workflow

### Option 1: Manual Hotfix (Recommended)

1. **Create hotfix branch from production tag**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/v1.0.13
   ```

2. **Implement the minimal fix**
   - Make only the changes necessary to fix the issue
   - Do not include any other changes
   - Keep the fix as small as possible

3. **Test the fix**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

4. **Commit the fix**
   ```bash
   npm run commit
   # Use type: hotfix
   ```

5. **Push the hotfix branch**
   ```bash
   git push origin hotfix/v1.0.13
   ```

6. **Create Pull Request**
   - Target: `main` branch
   - Label: `hotfix`, `urgent`
   - Request expedited review

7. **Merge to main**
   - After approval, merge the PR
   - Use squash merge

8. **Create release**
   ```bash
   npm run release:patch
   ```

9. **Tag and push**
   ```bash
   git push origin main --tags
   ```

10. **Backport to develop**
    ```bash
    git checkout develop
    git pull origin develop
    git merge main
    git push origin develop
    ```

### Option 2: GitHub Actions Hotfix

Use the GitHub Actions workflow for automated hotfix creation:

1. Go to Actions tab in GitHub
2. Select "Hotfix" workflow
3. Click "Run workflow"
4. Provide:
   - Version (e.g., 1.0.13)
   - Description of the hotfix
5. The workflow will:
   - Create a hotfix branch
   - Open a PR to main
   - Label it appropriately

## Post-Hotfix Actions

### 1. Root Cause Analysis

Within 24 hours of deploying a hotfix, conduct a root cause analysis:

- Why did the issue occur?
- Why wasn't it caught in testing?
- What process changes can prevent this in the future?

### 2. Update Tests

Add or update tests to prevent regression:

```bash
# Create test for the fix
npm test
```

### 3. Update Documentation

Update any relevant documentation:
- README.md
- API documentation
- Troubleshooting guides

### 4. Improve Monitoring

Add or update monitoring/alerting for similar issues.

### 5. Post-Mortem

Create a post-mortem document that includes:
- Timeline of events
- Impact assessment
- Root cause analysis
- Lessons learned
- Action items

## Hotfix Checklist

Before creating a hotfix, ensure:

- [ ] Issue is critical and affects production
- [ ] No workaround is available
- [ ] Fix is minimal and focused
- [ ] Tests will pass
- [ ] Rollback plan is documented
- [ ] Stakeholders are notified
- [ ] Team is available for deployment

After deploying a hotfix:

- [ ] Fix is verified in production
- [ ] No regressions introduced
- [ ] Root cause analysis scheduled
- [ ] Tests updated
- [ ] Documentation updated
- [ ] Monitoring configured
- [ ] Post-mortem created

## Rollback Plan

Always have a rollback plan before deploying a hotfix:

```bash
# Rollback to previous version
git checkout v1.0.12
# Rebuild and deploy
npm run build
# Deploy to production
```

## Communication

- Notify stakeholders before deploying hotfix
- Update status page if applicable
- Communicate expected impact
- Provide ETA for resolution
- Post update when fix is deployed

## Hotfix vs. Regular Fix

| Aspect | Hotfix | Regular Fix |
|--------|--------|-------------|
| Urgency | Critical | Normal |
| Branch | From main tag | From develop |
| Testing | Critical tests only | Full test suite |
| Review | Expedited | Standard |
| Deployment | Immediate | Scheduled |
| Documentation | Post-deployment | Pre-deployment |

## Best Practices

1. **Keep it minimal** - Only fix the immediate issue
2. **Test thoroughly** - Even though it's urgent, don't skip testing
3. **Document everything** - Hotfixes often lack documentation
4. **Plan rollback** - Always have a way to undo the change
5. **Communicate** - Keep stakeholders informed
6. **Learn from it** - Use hotfixes to improve processes

## Example Hotfix Commit

```
hotfix(auth): fix token expiration causing service outage

Users were unable to authenticate due to token validation error.
Fixed by adding proper error handling for expired tokens.

Fixes #123
```

## Related Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) - General contribution guidelines
- [BRANCHING.md](./BRANCHING.md) - Branching strategy
- [RELEASE.md](./RELEASE.md) - Release process (if it exists)
