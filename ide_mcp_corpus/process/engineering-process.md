# Project Management & Engineering Process

## Overview

This document covers Agile done correctly, Kanban flow, technical debt management, Architecture Decision Records (ADRs), RFC processes, and code review guidelines. These concepts enable MasterControl to become a team lead in a box.

## Agile Done Correctly

### Core Principles

- **Individuals and Interactions**: People over processes
- **Working Software**: Working software over comprehensive documentation
- **Customer Collaboration**: Customer collaboration over contract negotiation
- **Responding to Change**: Responding to change over following a plan

### Common Misconceptions

- **Not Waterfall with Sprints**: Agile is not waterfall with sprints
- **Not No Planning**: Agile requires planning, just adaptive
- **Not No Documentation**: Documentation is valuable, just not excessive
- **Not No Design**: Design is important, just evolutionary

### Scrum vs Kanban

#### Scrum

- **Time-Boxed**: Fixed length sprints (2 weeks typical)
- **Roles**: Scrum Master, Product Owner, Team
- **Ceremonies**: Sprint Planning, Daily Standup, Sprint Review, Sprint Retrospective
- **Artifacts**: Product Backlog, Sprint Backlog, Increment

#### Kanban

- **Continuous Flow**: No time boxes
- **Visual**: Visual board with columns
- **WIP Limits**: Work in progress limits
- **Pull System**: Pull work when capacity available

### Effective Sprint Planning

- **Goal**: Clear sprint goal
- **Capacity**: Account for team capacity
- **Estimation**: Relative estimation (story points)
- **Commitment**: Team commits to goal
- **Definition of Done**: Clear DoD

### Effective Daily Standups

- **Three Questions**: What did I do? What will I do? Any blockers?
- **Time-Boxed**: 15 minutes max
- **Stand Up**: Literally stand up
- **Focus**: Focus on blockers, not status report

### Effective Sprint Review

- **Demo**: Demo working software
- **Feedback**: Get stakeholder feedback
- **Adjust**: Adjust backlog based on feedback
- **Celebrate**: Celebrate achievements

### Effective Retrospective

- **Safe Space**: Psychological safety
- **What Went Well**: Celebrate successes
- **What Didn't**: Identify improvements
- **Action Items**: Create action items

## Kanban Flow

### Core Principles

- **Visualize**: Visualize work
- **Limit WIP**: Limit work in progress
- **Manage Flow**: Manage flow of work
- **Make Policies Explicit**: Make process policies explicit
- **Feedback Loops**: Implement feedback loops
- **Improve Collaboratively**: Improve collaboratively

### Kanban Board

```
Backlog → To Do → In Progress → Review → Done
         ↑       ↑           ↑       ↑
      WIP Limit WIP Limit WIP Limit WIP Limit
```

### WIP Limits

- **Purpose**: Prevent bottlenecks
- **Setting**: Start with current capacity, adjust
- **Enforcement**: Strictly enforce limits
- **Benefits**: Faster feedback, less context switching

### Cycle Time

- **Definition**: Time from start to finish
- **Measure**: Track cycle time
- **Optimize**: Optimize for shorter cycle time
- **Predict**: Predict completion times

### Lead Time

- **Definition**: Time from request to delivery
- **Includes**: Wait time + cycle time
- **Measure**: Track lead time
- **Optimize**: Optimize for shorter lead time

### Throughput

- **Definition**: Items completed per time period
- **Measure**: Track throughput
- **Stabilize**: Stabilize throughput
- **Predict**: Predict completion based on throughput

## Technical Debt Management

### What is Technical Debt

- **Definition**: Trade speed for quality now, pay later
- **Analogy**: Financial debt
- **Interest**: Accumulates over time
- **Bankruptcy**: System becomes unmaintainable

### Types of Technical Debt

#### Deliberate Debt

- **Intentional**: Conscious decision to take on debt
- **Reason**: Time pressure, prototype
- **Plan**: Plan to pay back
- **Example**: Quick prototype for demo

#### Accidental Debt

- **Unintentional**: Poor design, lack of knowledge
- **Reason**: Inexperience, pressure
- **No Plan**: No plan to pay back
- **Example**: Poorly designed module

#### Bit Rot

- **Gradual**: Gradual degradation over time
- **Reason**: Outdated dependencies, changing requirements
- **Continuous**: Continuous accumulation
- **Example**: Outdated libraries

### Managing Technical Debt

#### Track Debt

- **Inventory**: Track debt items
- **Prioritize**: Prioritize by impact
- **Estimate**: Estimate cost to fix
- **Plan**: Plan to pay back

#### Pay Back Debt

- **Regular**: Regularly pay back debt
- **Percentage**: Allocate percentage of time (e.g., 20%)
- **Sprints**: Dedicate sprints to debt
- **Features**: Pair debt with features

#### Prevent Debt

- **Code Review**: Review code to prevent debt
- **Standards**: Follow coding standards
- **Training**: Train team on best practices
- **Refactoring**: Regularly refactor

### Debt Quadrant

- **High Impact, Low Cost**: Fix immediately
- **High Impact, High Cost**: Plan to fix
- **Low Impact, Low Cost**: Fix when convenient
- **Low Impact, High Cost**: Ignore

## Architecture Decision Records (ADRs)

### What is an ADR

- **Definition**: Record of architecture decision
- **Format**: Short, focused document
- **Context**: Context of decision
- **Decision**: Decision made
- **Consequences**: Consequences of decision

### ADR Template

```markdown
# ADR-001: Use PostgreSQL for User Data

## Status
Accepted

## Context
We need to store user data with strong consistency guarantees.

## Decision
Use PostgreSQL as the primary database for user data.

## Consequences
- Positive: Strong ACID guarantees
- Positive: Mature ecosystem
- Negative: Scaling challenges at very high scale
- Negative: Requires DBA expertise
```

### ADR Types

- **Accepted**: Decision accepted
- **Rejected**: Decision rejected
- **Superseded**: Decision superseded by new decision
- **Deprecated**: Decision deprecated

### ADR Best Practices

- **Short**: Keep ADRs short
- **Focused**: One decision per ADR
- **Numbered**: Number ADRs sequentially
- **Tracked**: Track ADRs in version control
- **Reviewed**: Review ADRs regularly

### ADR Process

1. **Draft**: Draft ADR
2. **Discuss**: Discuss with team
3. **Decide**: Make decision
4. **Record**: Record decision as ADR
5. **Communicate**: Communicate decision
6. **Review**: Review periodically

## RFC (Request for Comments) Process

### What is an RFC

- **Definition**: Document proposing a change
- **Purpose**: Get feedback before implementation
- **Format**: Structured proposal
- **Process**: Review and discussion

### RFC Template

```markdown
# RFC-001: Add OAuth 2.0 Authentication

## Summary
Add OAuth 2.0 authentication to allow third-party integrations.

## Motivation
Users want to integrate with third-party services.

## Proposed Implementation
Use OAuth 2.0 with PKCE for security.

## Alternatives Considered
- API Keys: Less secure
- Custom Auth: Reinventing the wheel

## Unresolved Questions
- Which OAuth providers to support?
```

### RFC Process

1. **Draft**: Draft RFC
2. **Submit**: Submit for review
3. **Discuss**: Discuss with team
4. **Revise**: Revise based on feedback
5. **Accept/Reject**: Accept or reject
6. **Implement**: Implement if accepted
7. **Retrospective**: Review after implementation

### RFC Best Practices

- **Early**: Submit RFC early
- **Collaborative**: Collaborative discussion
- **Open**: Open to feedback
- **Documented**: Document discussion
- **Time-Boxed**: Time-box discussion

## Code Review Guidelines

### Purpose of Code Review

- **Quality**: Improve code quality
- **Knowledge Sharing**: Share knowledge
- **Consistency**: Ensure consistency
- **Mentoring**: Mentor team members

### Review Checklist

#### Correctness

- **Bug Free**: No obvious bugs
- **Logic**: Logic is correct
- **Edge Cases**: Edge cases handled
- **Error Handling**: Error handling appropriate

#### Maintainability

- **Readable**: Code is readable
- **Comments**: Comments where needed
- **Naming**: Good naming
- **Structure**: Good structure

#### Performance

- **Efficient**: Efficient algorithms
- **Scalable**: Scalable design
- **Database**: Efficient database queries
- **Caching**: Appropriate caching

#### Security

- **Input Validation**: Input validated
- **Output Encoding**: Output encoded
- **Authentication**: Authenticated appropriately
- **Authorization**: Authorized appropriately

#### Testing

- **Unit Tests**: Unit tests included
- **Integration Tests**: Integration tests if needed
- **Test Coverage**: Adequate coverage
- **Edge Cases**: Edge cases tested

### Review Best Practices

- **Small PRs**: Keep PRs small
- **Focused**: One change per PR
- **Self-Review**: Self-review before submitting
- **Clear Description**: Clear PR description
- **Timely**: Review promptly
- **Constructive**: Constructive feedback
- **Kind**: Be kind

### Review Process

1. **Submit**: Submit PR with clear description
2. **Automated Checks**: Wait for automated checks
3. **Review**: Review code
4. **Feedback**: Provide feedback
5. **Revise**: Author revises
6. **Approve**: Approve when ready
7. **Merge**: Merge after approval

### Common Review Issues

- **Too Large**: PR too large
- **No Tests**: No tests included
- **Unclear**: Unclear what changed
- **Style**: Style issues (use linters)
- **Performance**: Performance concerns

## Engineering Metrics

### DORA Metrics

- **Deployment Frequency**: How often you deploy
- **Lead Time for Changes**: Time from commit to deploy
- **Mean Time to Restore**: Time to restore service
- **Change Failure Rate**: Percentage of failed deployments

### Velocity

- **Definition**: Story points completed per sprint
- **Use**: Predict future capacity
- **Trend**: Track velocity trend
- **Warning**: Don't use for performance evaluation

### Cycle Time

- **Definition**: Time from start to finish
- **Measure**: Track for PRs, issues
- **Optimize**: Optimize for shorter cycle time
- **Goal**: Faster feedback

### Defect Rate

- **Definition**: Defects per feature
- **Measure**: Track defects found
- **Goal**: Reduce defect rate
- **Root Cause**: Analyze root causes

### Code Coverage

- **Definition**: Percentage of code covered by tests
- **Measure**: Track coverage
- **Goal**: Maintain or improve coverage
- **Warning**: High coverage != quality

## Best Practices

### Planning

- **Realistic**: Be realistic in planning
- **Buffer**: Include buffer for uncertainty
- **Involve Team**: Involve team in planning
- **Adjust**: Adjust plans as needed

### Communication

- **Transparent**: Be transparent
- **Regular**: Regular communication
- **Clear**: Clear communication
- **Two-Way**: Two-way communication

### Collaboration

- **Inclusive**: Include everyone
- **Respectful**: Be respectful
- **Constructive**: Constructive feedback
- **Supportive**: Support each other

### Continuous Improvement

- **Retrospectives**: Regular retrospectives
- **Experiments**: Try new approaches
- **Learn**: Learn from mistakes
- **Share**: Share learnings

### Balance

- **Speed vs Quality**: Balance speed and quality
- **Features vs Debt**: Balance features and debt
- **Innovation vs Stability**: Balance innovation and stability
- **Individual vs Team**: Balance individual and team
