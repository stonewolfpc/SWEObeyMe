module.exports = {
  types: [
    { value: "feat", name: "feat:     A new feature" },
    { value: "fix", name: "fix:      A bug fix" },
    { value: "docs", name: "docs:     Documentation only changes" },
    { value: "style", name: "style:    Code style changes (formatting, etc)" },
    { value: "refactor", name: "refactor: Code refactoring" },
    { value: "perf", name: "perf:     Performance improvements" },
    { value: "test", name: "test:     Adding or updating tests" },
    { value: "build", name: "build:    Build system changes" },
    { value: "ci", name: "ci:       CI/CD changes" },
    { value: "chore", name: "chore:    Other changes" },
    { value: "revert", name: "revert:   Revert a previous commit" },
    { value: "hotfix", name: "hotfix:   Emergency production fix" }
  ],
  scopes: [
    { name: "mcp" },
    { name: "tools" },
    { name: "utils" },
    { name: "extension" },
    { name: "docs" },
    { name: "tests" },
    { name: "ci" }
  ],
  allowTicketNumber: false,
  isTicketNumberRequired: false,
  ticketNumberPrefix: "TICKET-",
  ticketNumberRegExp: "\\d{1,5}",
  messages: {
    type: "Select the type of change that you're committing:",
    scope: "Denote the scope of this change (optional):",
    customScope: "Denote the scope of this change:",
    subject: "Write a short, imperative tense description of the change:\n",
    body: "Provide a longer description of the change (optional):\n",
    breaking: "List any BREAKING CHANGES:\n",
    footer: "List any issues closed by this change (optional):\n",
    confirmCommit: "Are you sure you want to proceed with the commit above?"
  }
};
