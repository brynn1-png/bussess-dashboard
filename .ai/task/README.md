# AI Task Specifications

This directory contains task-specific specifications for complex, multi-step, or high-impact development work.

Task specifications provide a persistent definition of **what needs to be built and how success will be determined**.

They complement the general project instructions:

```text id="x7v2km"
.ai/rules.md
.ai/workflow.md
.ai/architecture.md
.ai/context.md
```

They do not replace them.

---

# 1. When to Create a Task Specification

Create a task specification when the work is:

* A large feature
* A multi-step implementation
* A major bug fix
* A significant architectural change
* A database migration
* A new integration
* A complex refactor
* A feature involving multiple systems
* Work that may span multiple sessions
* Work that needs clear acceptance criteria

Examples:

```text id="w8d3pk"
TASK-001-user-authentication.md
TASK-002-inventory-system.md
TASK-003-payment-integration.md
TASK-004-rfid-attendance.md
```

---

# 2. When Not to Create One

Do not create a task specification for simple work unless the project requires it.

Examples:

* Fixing a typo
* Small styling change
* Minor UI adjustment
* Simple configuration change
* Small bug fix with an obvious solution
* Renaming a variable
* Updating a dependency
* Other low-risk changes that do not require persistent planning

Use judgment.

The purpose of task specifications is to preserve useful context, not create unnecessary documentation.

---

# 3. Naming Convention

Use:

```text id="t4p7mz"
TASK-<ID>-<short-description>.md
```

Examples:

```text
TASK-001-user-authentication.md
TASK-002-inventory-management.md
TASK-003-sales-reporting.md
```

Use sequential task IDs when possible.

Keep filenames:

* Short
* Descriptive
* Lowercase after the task ID
* Easy to search

---

# 4. Task Lifecycle

A task generally follows:

```text id="r8y2nx"
Created
   ↓
Planned
   ↓
Approved
   ↓
In Progress
   ↓
Verification
   ↓
Completed
```

A task may also become:

```text
Blocked
Cancelled
Deferred
```

The task status should reflect its actual state.

---

# 5. Task Specification Template

A task specification should generally contain the following sections.

```md
# TASK-001: [Task Name]

**Status:** Created

**Created:** YYYY-MM-DD

---

## 1. Objective

[What needs to be accomplished?]

---

## 2. Problem

[What problem is being solved?]

---

## 3. Requirements

- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

---

## 4. Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

---

## 5. Scope

### In Scope

- [Item]

### Out of Scope

- [Item]

---

## 6. Technical Approach

[Describe the proposed implementation approach.]

---

## 7. Affected Areas

### Files / Modules

- [File or module]

### Database

- [Tables/schema if applicable]

### APIs

- [Endpoints/services if applicable]

### UI

- [Pages/components if applicable]

### External Services

- [Services if applicable]

---

## 8. Dependencies

- [Dependency]

---

## 9. Risks

- [Risk]

---

## 10. Verification

- [ ] Test
- [ ] Type check
- [ ] Lint
- [ ] Build
- [ ] Manual verification
- [ ] Other relevant checks

---

## 11. Notes

[Additional information.]

---
```

Only include sections that are relevant to the task.

---

# 6. Objective

The objective should describe the desired outcome clearly.

Good:

```text
Add barcode-based product lookup to the cashier interface so a
keyboard-input barcode scanner can identify products and add them
to the current transaction.
```

Avoid vague objectives such as:

```text
Improve the cashier system.
```

The objective should describe the outcome, not merely the implementation.

---

# 7. Requirements

Requirements describe what the system must do.

Separate requirements from implementation details when possible.

Example:

```text id="3z6x1m"
- The cashier can scan a product barcode.
- The system identifies the matching product.
- The product is added to the current transaction.
- Unknown barcodes produce a clear error.
```

Requirements should be specific enough to verify.

---

# 8. Acceptance Criteria

Acceptance criteria define when the task can be considered complete.

Good acceptance criteria should be:

* Specific
* Observable
* Testable
* Related directly to requirements

Example:

```text id="b9w4kc"
- [ ] Scanning a valid barcode adds the correct product.
- [ ] Scanning an unknown barcode displays an error.
- [ ] Multiple scans correctly increase the transaction quantity.
- [ ] Existing manual product selection continues to work.
```

Avoid criteria that cannot be objectively verified.

---

# 9. Scope

Clearly define what is included and excluded.

This prevents scope expansion during implementation.

Example:

```text id="q6v1ry"
### In Scope

- Barcode scanning
- Product lookup
- Cart integration

### Out of Scope

- Payment processing
- Receipt printing
- Inventory reporting
```

If scope changes, update the task specification before continuing significant work.

---

# 10. Technical Approach

Describe the intended implementation approach after inspecting the existing project.

Include:

* Relevant architecture
* Existing patterns to reuse
* Proposed changes
* Important technical considerations

Do not invent technical details before inspecting the code.

The technical approach should remain consistent with:

```text
.ai/architecture.md
```

If the task requires an architectural change, identify it explicitly.

---

# 11. Affected Areas

Identify areas likely to be affected.

Examples:

```text id="x3r9mz"
Frontend:
- Cashier page
- Product search component

Backend:
- Product lookup service

Database:
- products table

External:
- Barcode scanner input
```

This section helps the AI understand the potential impact before implementation.

---

# 12. Dependencies

Document dependencies required to complete the task.

Examples:

* Existing API
* Database migration
* External service
* Hardware
* Another feature
* Library
* Environment configuration

Do not add dependencies automatically.

Follow dependency rules in `.ai/rules.md`.

---

# 13. Risks

Document known risks.

Examples:

* Breaking existing workflows
* Data migration problems
* Backward compatibility
* Security concerns
* Performance impact
* External service availability
* Hardware compatibility

If a new significant risk appears during implementation, stop and follow the risk-handling requirements in `.ai/rules.md`.

---

# 14. Verification

Define how the task will be verified.

Possible verification methods:

```text id="z2x8hf"
- Unit tests
- Integration tests
- End-to-end tests
- Type checking
- Linting
- Build
- API testing
- Database verification
- Manual testing
- Hardware testing
```

Only mark verification complete after it has actually been performed.

---

# 15. Task Status

Use one of the following statuses:

```text id="8j1vps"
Created
Planned
Approved
In Progress
Verification
Completed
Blocked
Cancelled
Deferred
```

Update the status when the task moves between lifecycle stages.

---

# 16. Relationship With Project Logs

Task specifications describe **the task itself**.

Project logs describe **what happened during development**.

Use:

```text id="c4y7qn"
Task file
    ↓
What needs to be done
```

and:

```text id="p8k3vz"
progress.md
    ↓
What is currently happening
```

```text id="m1r6xd"
decisions.md
    ↓
Why important decisions were made
```

```text id="v5t9qa"
results.md
    ↓
What happened and what was verified
```

Do not duplicate complete task history across these files.

---

# 17. Task Completion

Before marking a task `Completed`:

1. All required implementation is finished.
2. Acceptance criteria have been checked.
3. Relevant verification has been performed.
4. Remaining risks or limitations are identified.
5. Changed files have been reviewed.
6. Required project logs are updated according to `.ai/rules.md`.

A task must not be marked completed simply because the code was written.

---

# 18. Task Changes

Requirements may change during development.

When requirements change:

1. Identify the change.
2. Determine its impact.
3. Update the task specification.
4. Reassess the technical approach if necessary.
5. Reassess acceptance criteria.
6. Follow the approval requirements in `.ai/rules.md`.

Do not silently change the task's objective or scope.

---

# 19. Source of Truth

For task requirements, use this hierarchy:

```text id="n7b4xp"
Current User Requirements
        ↓
Approved Task Specification
        ↓
.ai/context.md
        ↓
.ai/architecture.md
        ↓
Other Documentation
```

However, implementation details must still be verified against the actual codebase.

If requirements conflict with existing implementation, do not silently assume which one is correct.

Follow `.ai/rules.md` for handling ambiguity and risk.

---

# 20. Principle

Task specifications should answer:

> **"What exactly are we building, why are we building it, and how will we know it is complete?"**

They should not become copies of:

* `.ai/rules.md`
* `.ai/workflow.md`
* `.ai/architecture.md`
* `.ai/context.md`
* `progress.md`
* `decisions.md`
* `results.md`

Each document should have one clear responsibility.
