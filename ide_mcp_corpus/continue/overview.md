Source: https://docs.continue.dev/index

# What is Continue?

## Quickstart

Quickstart

1. Go to [continue.dev/check](https://continue.dev/check) to run checks on a pull request.

## How it works

How it works

```
.continue/checks/
```

```
--- name: Security Review description: Flag hardcoded secrets and missing input validation --- Review this pull request for security issues. Flag as failing if any of these are true: - Hardcoded API keys, tokens, or passwords in source files - New API endpoints without input validation - SQL queries built with string concatenation - Sensitive data logged to stdout If none of these issues are found, pass the check.
```

[Write Your First Check](https://docs.continue.dev/checks/quickstart)
