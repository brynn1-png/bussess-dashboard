# AI Development Workflow

This document defines the standard workflow AI agents must follow when working on this project.

Behavioral rules, safety requirements, verification requirements, and logging requirements are defined in `.ai/rules.md`.

Do not duplicate or override those rules here.

---

## 1. Workflow Overview

Every development task should follow this lifecycle:

```text
Understand
    ↓
Inspect
    ↓
Plan
    ↓
User Approval
    ↓
Implement
    ↓
Verify
    ↓
Review
    ↓
Report
    ↓
Log
```

Do not skip a stage unless the task clearly does not require it.

---

# 2. Understand

Determine what the user is actually asking for.

Identify:

* The requested outcome
* The problem being solved
* Relevant requirements
* Existing constraints
* Expected behavior
* Potential ambiguity

Use the project's existing documentation and context when relevant.

Do not begin implementation based on assumptions.

---

# 3. Inspect

Before modifying anything, inspect the actual current project.

Depending on the task:

* Locate relevant files
* Search for existing implementations
* Read the surrounding code
* Find usages and dependencies
* Inspect related components, services, APIs, or database logic
* Check existing project patterns
* Review relevant task specifications
* Review architecture when the change affects system structure

The current codebase is the source of truth for implementation details.

Do not assume that a file, function, component, API, or architecture works a certain way without inspecting it.

---

# 4. Plan

Before implementation, create a concise plan containing:

### Problem

What needs to be solved?

### Solution

What approach will be used?

### Stakes & Effects

What could this change affect?

Consider:

* Existing functionality
* Data
* APIs
* Dependencies
* Performance
* Security
* Architecture
* User experience

### How

What concrete steps will be performed?

The plan should be based on the actual code and project context discovered during inspection.

---

# 5. User Approval

Present the plan to the user before making changes.

Wait for explicit approval when required by `.ai/rules.md`.

If the user changes the requirements, update the plan before implementation.

If a significant new risk or architectural issue appears after approval, stop and discuss it before proceeding.

---

# 6. Implement

After approval:

1. Make the planned changes.
2. Follow the existing project architecture.
3. Reuse existing patterns and abstractions where appropriate.
4. Keep changes focused on the requested task.
5. Avoid unrelated refactoring.
6. Avoid unnecessary dependencies.
7. Preserve existing functionality.

If implementation reveals that the approved approach is unsafe, incorrect, or incompatible with the project, stop and report the issue instead of silently changing direction.

---

# 7. Verify

After implementation, verify the actual result.

Use the checks appropriate for the project and task, such as:

* Unit tests
* Integration tests
* Type checking
* Linting
* Build verification
* Runtime testing
* API testing
* Database verification
* Manual functionality checks
* Reviewing changed files

Verification must test the actual implementation, not merely confirm that a command completed successfully.

Also confirm that:

* The intended files changed
* The intended behavior was implemented
* Existing functionality was not unnecessarily broken
* No unexpected files were modified
* Requirements were satisfied

Never claim verification that was not actually performed.

---

# 8. Review

Before considering the task complete, review the implementation as a whole.

Check:

* Does the implementation solve the original problem?
* Does it follow the project's architecture?
* Does it follow existing patterns?
* Are there unnecessary changes?
* Are there security or data risks?
* Are there unresolved errors or warnings?
* Are there incomplete requirements?
* Is additional documentation necessary?

If problems remain, address them or report them clearly.

---

# 9. Report

Provide the user with a concise completion report.

Include:

### Summary

What was accomplished.

### Changes

The important implementation changes.

### Files

Files created, modified, or deleted.

### Verification

Tests, checks, builds, or other verification actually performed.

### Risks / Notes

Remaining issues, limitations, or important considerations.

Do not claim completion if important requirements remain unresolved.

---

# 10. Log

At the end of the task/session, follow the logging requirements defined in:

```text
.ai/rules.md
```

The logging system consists of:

```text
progress.md
decisions.md
results.md
```

Do not duplicate their logging rules or templates in this file.

The purpose of this workflow is to define **when the task moves through each stage**. The purpose of `.ai/rules.md` is to define **how the AI must behave during those stages**.

---

# 11. Handling Unexpected Situations

If something unexpected happens during any stage:

```text
Unexpected Issue
       ↓
Stop / Assess
       ↓
Determine Impact
       ↓
Report Risk
       ↓
Continue / Revise Plan / Ask User
```

Examples include:

* Unexpected bugs
* Failed tests
* Breaking changes
* Data-loss risks
* Security concerns
* Architectural conflicts
* Missing requirements
* Unexpected dependencies
* Existing code behaving differently than expected

Do not silently ignore significant problems.

Follow the risk-handling requirements defined in `.ai/rules.md`.

---

# 12. Task Completion Standard

A task is complete when:

```text
Requirement understood
        ↓
Actual implementation inspected
        ↓
Plan approved
        ↓
Changes implemented
        ↓
Implementation verified
        ↓
Changes reviewed
        ↓
Results reported
        ↓
Required project state logged
```

The objective is not simply to produce code.

The objective is to leave the project:

* Working
* Verified
* Consistent with its architecture
* Understandable
* Properly documented
* Ready for the next development session
