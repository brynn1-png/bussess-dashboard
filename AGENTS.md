# AGENTS.md

# AI Development Harness

This file is the primary entry point for AI coding agents working in this project.

The project uses a structured AI development harness located in `.ai/`.

The agent must load and follow the relevant project instructions before modifying code.

---

## 1. Harness Structure

```text
.ai/
├── rules.md
├── architecture.md
├── workflow.md
├── context.md
└── tasks/
```

Project state is maintained through:

```text
progress.md
decisions.md
results.md
```

---

## 2. Required Instructions

Before starting work, read:

1. `.ai/rules.md`
2. `.ai/architecture.md`
3. `.ai/workflow.md`

Read `.ai/context.md` when the task involves:

* Business logic
* Domain-specific behavior
* User workflows
* Database behavior
* Existing system decisions
* Important project constraints

If the task corresponds to a specification in `.ai/tasks/`, read the relevant task file before implementation.

Do not assume the contents of these files. Read them.

---

## 3. Rules Authority

`.ai/rules.md` is the primary source of AI working rules.

Follow the rules defined there for:

* Session initialization
* Context loading
* Planning
* Code inspection
* Risk handling
* Implementation
* Verification
* Logging
* Session completion

Do not duplicate those rules in this file.

If a general rule needs to change, update `.ai/rules.md` rather than creating a conflicting rule here.

---

## 4. Architecture

`.ai/architecture.md` describes the technical architecture of the project.

Before implementing a feature:

1. Understand the relevant architecture.
2. Identify the correct layer/module.
3. Inspect existing implementations.
4. Follow established project patterns.
5. Reuse existing abstractions where appropriate.

Do not introduce architectural changes without understanding their impact.

---

## 5. Workflow

`.ai/workflow.md` defines the development process.

Follow it together with `.ai/rules.md`.

The general workflow is:

```text
Understand
    ↓
Inspect
    ↓
Plan
    ↓
Approval
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

Do not skip required workflow stages.

If the workflow requires user approval, wait for approval before implementation.

---

## 6. Project Context

`.ai/context.md` contains project-specific knowledge that may not be obvious from the source code.

Use it when working with:

* Business rules
* Domain concepts
* Important constraints
* User workflows
* Database rules
* System behavior
* Previously established project decisions

The existing project context should be preferred over assumptions.

---

## 7. Task Specifications

The `.ai/tasks/` directory contains task-specific specifications.

When a relevant task file exists:

1. Read the specification.
2. Understand its requirements.
3. Implement against the specification.
4. Verify the implementation against it.
5. Report any requirements that could not be satisfied.

Do not modify task specifications unless explicitly requested or required by the project workflow.

---

## 8. Design Skills

Design and UI-related tasks should use relevant available design/UI skills when they exist.

Design-related tasks include:

* UI design
* UX design
* Page layouts
* Component design
* Visual styling
* Responsive design
* Design systems
* Design-to-code work
* Animations and interactions
* Accessibility-related UI work

Before implementing a design-related task:

1. Identify whether the task involves design or UI work.
2. Check the available skills supported by the current AI agent.
3. Identify relevant design/UI skills.
4. Read the relevant skill instructions before implementation.
5. Follow the skill's specialized workflow when applicable.
6. Continue following `.ai/rules.md` and `.ai/workflow.md`.

Do not load design skills for unrelated tasks.

If no relevant design skill is available, continue using the normal project workflow.

Skills are supplemental instructions.

They do not override:

* Explicit user requirements
* `.ai/rules.md`
* `.ai/architecture.md`
* `.ai/context.md`
* Security requirements
* Existing project constraints

If a skill conflicts with project rules or requirements, do not blindly follow it. Identify the conflict and follow the project's established rules for handling it.

---

## 9. Code Inspection

Before modifying code:

1. Locate the actual implementation.
2. Read the relevant files.
3. Search for usages and dependencies when necessary.
4. Identify existing patterns.
5. Confirm how the current implementation works.

Never rely on:

* Assumptions
* Memory
* Filenames alone
* Previous conversations
* Guessed architecture

The current codebase is the source of truth for implementation details.

---

## 10. Minimal Changes

Make the smallest reasonable change that solves the requested problem.

Prefer:

* Existing components
* Existing utilities
* Existing services
* Existing APIs
* Existing database patterns
* Existing project conventions

Avoid:

* Unrelated refactoring
* Duplicate functionality
* Unnecessary dependencies
* Unnecessary file creation
* Rewriting working code
* Changing architecture without justification

Do not modify unrelated parts of the project unless necessary.

---

## 11. Verification

After implementation, perform the appropriate verification defined by `.ai/rules.md` and `.ai/workflow.md`.

Depending on the task, this may include:

* Unit tests
* Integration tests
* Type checking
* Linting
* Build verification
* Runtime testing
* API testing
* Database verification
* UI verification
* Reviewing changed files

Never claim that something was tested or verified unless it was actually performed.

---

## 12. Risk Handling

If an unexpected issue appears, such as:

* A bug
* A breaking change
* Data-loss risk
* Security concern
* Architectural conflict
* Unclear requirement
* Unexpected test failure
* Unexpected behavior

follow the risk-handling procedure in `.ai/rules.md`.

Do not silently ignore significant risks.

---

## 13. Git Safety

Protect the user's existing work.

Do not perform destructive Git operations without explicit authorization.

Do not:

* Reset user changes
* Delete branches
* Force push
* Discard unrelated work
* Overwrite existing work
* Commit or push changes unless explicitly requested

Inspect the current Git state when it is relevant to the task.

---

## 14. AI Harness Protection

The `.ai/` directory contains the project's AI instructions and context.

Do not modify these files unless explicitly requested or required by the task:

```text
.ai/rules.md
.ai/architecture.md
.ai/workflow.md
.ai/context.md
.ai/tasks/
```

Changes to the AI harness itself should be treated as configuration changes and verified carefully.

---

## 15. Persistent Project State

The following files maintain persistent project state:

```text
progress.md
decisions.md
results.md
```

Their purpose is defined by `.ai/rules.md`.

At the end of a session, ensure the required information is recorded according to the logging rules.

The project should remain understandable even when the next AI session has no access to the previous conversation.

---

## 16. Session Completion

Before considering a task complete:

1. Confirm the requested work was implemented.
2. Verify the relevant functionality.
3. Review changed files.
4. Identify remaining issues.
5. Report important risks or limitations.
6. Update the required project logs.
7. Ensure the next session can understand the current state.

Do not claim completion when important requirements remain unresolved.

---

## 17. Final Report

When reporting completed work, provide:

### Summary

What was accomplished.

### Changes

Important implementation changes.

### Files

Created, modified, or deleted files.

### Verification

Tests, checks, builds, or other verification actually performed.

### Risks / Notes

Remaining issues, limitations, or important decisions.

Keep the report factual and concise.

---

# Core Engineering Principle

Act as an engineer working inside an existing software project, not as a code generator operating from an isolated prompt.

```text
Inspect
    ↓
Understand
    ↓
Plan
    ↓
Get Approval
    ↓
Implement
    ↓
Verify
    ↓
Document
    ↓
Leave the Project Better Understood
```

Preserve existing work.

Follow the project's architecture.

Use the project's established patterns.

Use relevant specialized design skills when appropriate.

Verify changes instead of assuming they work.

Maintain useful context for the next session.
