# AI Assistant Working Rules

These are the mandatory operating rules for AI agents working in this project.

---

## 0. Session Setup

Before starting any session, check whether these files exist at the project root:

* `progress.md`
* `decisions.md`
* `results.md`

If any are missing, create them with the appropriate headers and summary sections before proceeding.

---

## 1. Context First

Before starting work, read the `Current State Summary` section of:

* `progress.md`
* `decisions.md`
* `results.md`

Read only the top 10–15 lines initially.

Then, when necessary:

* Read entries from the last 2–3 days OR the last 5 entries, whichever is fewer.
* Always read entries marked 🔴 Blocked.
* Always read entries marked ⚠️ Partial.
* If a file contains fewer than 50 lines, reading the entire file is acceptable.

Do not read entire large log files by default.

---

## 2. Code Context

Before modifying code, search for and inspect the actual current implementation.

Never assume:

* A file contains a particular implementation.
* A function behaves a particular way.
* A component exists.
* An API works a particular way.
* The architecture is unchanged.
* Previous conversation context is still accurate.

The current codebase is the source of truth for implementation details.

---

## 3. Plan Before Acting

Before changing code, produce a plan containing:

### Problem

What exactly needs to be solved?

### Solution

What approach will be used?

### Stakes & Effects

What could be affected or broken?

### How

What concrete steps will be performed?

Wait for explicit approval before implementation.

Once the plan is approved, continue through implementation and verification without requesting approval for every individual step unless a new significant risk appears.

---

## 4. Push Back When Necessary

Do not blindly follow a technically problematic approach.

If a safer, simpler, more maintainable, or more efficient solution exists:

1. Explain the issue.
2. Explain the alternative.
3. Explain the trade-offs.
4. Allow the user to decide when the decision is significant.

The purpose is to assist engineering decisions, not merely execute instructions literally.

---

## 5. Risk Handling

Immediately identify significant:

* Bugs
* Breaking changes
* Security issues
* Data-loss risks
* Architectural conflicts
* Unexpected behavior
* Unclear requirements
* Failed assumptions

Do not silently work around significant risks.

---

## 6. Verify Every Change

After implementing a change:

1. Verify the actual file contents.
2. Run relevant tests.
3. Run type checking when available.
4. Run linting when available.
5. Run the build when appropriate.
6. Check for unintended side effects.

Do not claim something works unless it has actually been verified.

---

## 7. Logging

Every session must maintain:

| File           | Purpose                                         |
| -------------- | ----------------------------------------------- |
| `progress.md`  | What was done, current status, and next actions |
| `decisions.md` | Important decisions and reasoning               |
| `results.md`   | Outcomes, verification, and effects             |

Logs should normally be updated at the end of the session after the planned work is complete.

Always update the `Current State Summary` section.

---

## 8. Git Safety

Protect the user's existing work.

Do not:

* Reset user changes
* Delete branches
* Force push
* Discard unrelated changes
* Overwrite user work
* Commit or push without authorization

Never use destructive Git commands without explicit permission.

---

## 9. Dependencies

Before adding a dependency:

1. Check whether the project already has the required capability.
2. Check whether an existing dependency can solve the problem.
3. Determine whether the new dependency is justified.
4. Consider its effect on maintenance and security.

Avoid unnecessary dependencies.

---

## 10. Security

Never expose or commit:

* API keys
* Passwords
* Access tokens
* Private credentials
* Database credentials
* Secrets from `.env`

Use environment variables or the project's established secret-management approach.

---

## 11. Scope Control

Do not modify unrelated code.

Avoid:

* Unrequested refactoring
* Rewriting working functionality
* Duplicate implementations
* Unnecessary architecture changes
* Unnecessary file creation

Keep changes focused on the requested task.

---

## 12. Skills

The shared AI skills directory for this development environment is:

`C:\Users\bryan\.claude\skills\`

This directory is the default location for shared AI agent skills used by the development environment.

Before implementing a task that may benefit from specialized guidance:

1. Check the shared skills directory for relevant skills.
2. Determine whether an existing skill matches the task.
3. Read the relevant skill instructions before implementation.
4. Follow the skill's intended workflow when applicable.
5. Use only skills relevant to the current task.
6. Reuse existing skills instead of creating or installing duplicates.
7. Do not modify or delete existing skills unless explicitly requested.

### Design and UI Tasks

For tasks involving:

* UI design
* UX design
* Page layouts
* Component design
* Visual styling
* Responsive design
* Design systems
* Design-to-code implementation
* Animations
* Interactions
* Accessibility-related UI work

check the shared skills directory for relevant design/UI skills and use them when available.

### Skill Installation

When a required skill does not exist:

1. Determine whether the skill is compatible with the current AI agent.
2. Check whether an existing skill already provides the required capability.
3. If a new skill is justified, install it into:

`C:\Users\bryan\.claude\skills\`

4. Do not create duplicate copies of the same skill.
5. Read the newly installed skill's instructions before using it.
6. Verify that the skill is available to the current AI agent before relying on it.

Do not install unrelated or unnecessary skills.

### Agent Compatibility

The shared skills directory is the preferred skill location for this development environment.

However, an AI agent may use a different skill mechanism or may not support every skill format.

When working with a different AI agent:

1. Determine whether it can access the shared skills directory.
2. Determine whether it supports the skill format.
3. If supported, use the shared skill.
4. If not supported, use the agent's documented skill mechanism when appropriate.
5. Do not assume compatibility without checking.

The project harness should remain usable even if a particular agent cannot load a specific skill.

### Skill Authority

Skills are supplemental instructions.

They must not override:

* Explicit user requirements
* `.ai/rules.md`
* `.ai/architecture.md`
* `.ai/context.md`
* Security requirements
* Existing project constraints

If a skill conflicts with project rules or requirements:

1. Identify the conflict.
2. Do not blindly follow the skill.
3. Follow the project's established rules.
4. Inform the user when the conflict materially affects implementation.

Do not load unrelated skills for tasks such as:

* Backend development
* Database work
* API implementation
* Infrastructure
* General debugging
* Non-UI business logic

---

## 13. Completion

A task is complete only when:

* The requested functionality has been implemented.
* Relevant verification has been performed.
* Important risks have been identified.
* Changed files have been reviewed.
* Required logs have been updated.

If something remains unresolved, explicitly report it.
