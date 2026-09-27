# Project Context

This document contains stable project knowledge that may not be obvious from the source code.

It describes the project's purpose, domain, users, business rules, workflows, terminology, constraints, and other important context.

This document should help an AI agent understand why the system exists and how it is expected to behave.

Do not store temporary session information here.

Do not store secrets, passwords, API keys, tokens, or other sensitive credentials.

---

# 1. Project Overview

## Project Name

AI Business Automation Platform

## Purpose

The project is a portfolio-focused business automation platform designed to demonstrate how Python, backend development, AI, databases, and workflow automation can be combined into a practical business application.

The system allows customers to submit support inquiries and allows administrators to manage, analyze, and automate the processing of those inquiries.

## Problem Being Solved

Businesses can receive many customer inquiries that require repetitive manual processing.

The system demonstrates how common support operations can be automated, including:

* Categorizing customer inquiries
* Determining ticket priority
* Summarizing customer requests
* Analyzing sentiment
* Generating suggested responses
* Managing support tickets
* Running configurable automation workflows

## Expected Outcome

The system should allow a business to:

* Receive customer support inquiries.
* Organize inquiries into support tickets.
* Automatically analyze incoming tickets.
* Review AI-generated results.
* Manage customers and tickets.
* Configure business automation workflows.
* Monitor support activity through an administrative dashboard.
* Test the system using generated demo data without requiring a real business.

## Current Status

Development

The project is currently in the planning and initial implementation stage.

---

# 2. Users

## User Types

### 1. Administrator

**Who they are:**

The person responsible for managing the business support system.

**Responsibilities:**

* Manage support tickets.
* Review customer information.
* Review AI analysis.
* Manage automation workflows.
* Monitor system activity.
* Review high-priority requests.

**Access:**

* Administrative dashboard.
* Support tickets.
* Customer records.
* AI analysis.
* Automation workflows.
* Analytics.

**Restrictions:**

Administrative access must not be available to ordinary customers.

---

### 2. Customer

**Who they are:**

A person submitting a support request to the business.

**Responsibilities:**

* Submit support inquiries.
* Provide accurate information.
* View their own support requests.
* Provide additional information when required.

**Access:**

* Customer-facing support functionality.
* Their own support information.

**Restrictions:**

Customers must not access administrative functionality or other customers' private information.

---

# 3. Core Domain Concepts

## Customer

Represents a person who interacts with the business and submits support inquiries.

A customer may have multiple support tickets.

## Support Ticket

Represents a customer support request.

A ticket contains the customer's inquiry and its current processing state.

A ticket may have:

* Category
* Priority
* Status
* Messages
* AI analysis
* Suggested response
* Customer information

## Ticket Message

Represents an individual message associated with a support ticket.

Messages provide the conversation history associated with a ticket.

## AI Analysis

Represents the system's AI-generated interpretation of a support ticket.

It may include:

* Category
* Priority
* Sentiment
* Summary
* Suggested response

AI-generated information should be treated as assistance and should remain reviewable by an administrator.

## Workflow

Represents an automation rule that determines what the system should do when specified conditions are met.

Example:

```text
New Ticket
    ↓
Priority = High
    ↓
Notify Administrator
    ↓
Generate Suggested Response
```

## Workflow Run

Represents an execution of a workflow.

It should provide enough information to understand whether the automation was executed successfully or failed.

---

# 4. Business Rules

* Customers may create support inquiries.
* Customers may only access their own customer-facing information.
* Administrators may manage support operations.
* Administrative functionality must not be accessible to ordinary customers.
* Every support ticket must be associated with a customer.
* AI analysis must be associated with the ticket being analyzed.
* AI-generated responses are suggestions and should not automatically be treated as confirmed human responses.
* Invalid ticket information must not be accepted.
* Workflow actions should only execute when their configured conditions are satisfied.
* Failed automation should not silently appear as successful.
* Sensitive credentials must never be exposed to customers.
* AI provider credentials must remain private.
* Customer data must not be exposed to other customers.
* Demo/test data must remain distinguishable from real business data if both are ever supported.

---

# 5. User Workflows

## Customer Creates a Support Ticket

```text
Customer
    ↓
Opens Support Form
    ↓
Provides Ticket Information
    ↓
Client Validation
    ↓
Submit
    ↓
Backend Validation
    ↓
Create Ticket
    ↓
AI Processing
    ↓
Store Analysis
    ↓
Customer Receives Confirmation
```

The workflow may stop if:

* Required information is missing.
* Input is invalid.
* The customer is not authorized.
* The backend cannot process the request.

---

## Administrator Reviews a Ticket

```text
Administrator
    ↓
Opens Ticket Dashboard
    ↓
Selects Ticket
    ↓
Views Customer Information
    ↓
Views Ticket Messages
    ↓
Views AI Analysis
    ↓
Reviews Suggested Response
    ↓
Takes Appropriate Action
```

---

## AI Ticket Analysis

```text
New Ticket
    ↓
System Sends Relevant Information
    ↓
AI Analysis
    ↓
Validate AI Result
    ↓
Store Result
    ↓
Display to Administrator
```

The system must not assume that AI output is always correct.

---

## Workflow Automation

```text
Trigger
    ↓
Evaluate Conditions
    ↓
Conditions Met?
   ↙       ↘
 Yes        No
 ↓           ↓
Execute     Stop
Action
 ↓
Record Result
```

---

## Demo Data Generation

The project must support generated test scenarios so the platform can be demonstrated without a real business.

Example:

```text
Generate Demo Data
        ↓
Customers
        ↓
Support Tickets
        ↓
AI Analysis
        ↓
Workflow Processing
        ↓
Dashboard
```

Generated data should represent realistic business situations such as:

* Delivery problems
* Billing problems
* Account access issues
* Product questions
* General inquiries
* Urgent support requests
* Frustrated customers

---

# 6. Data Behavior

* A customer record is created when a customer is registered or introduced into the system.
* A support ticket is created when a customer submits a support request.
* Ticket messages belong to their associated ticket.
* AI analysis belongs to the ticket it analyzed.
* Workflow executions should be associated with the workflow that triggered them.
* Ticket history should remain available while the ticket exists.
* AI-generated results should remain associated with the ticket for administrative review.
* Failed operations should not be represented as successful operations.
* Demo data should be removable without affecting unrelated system data.
* Historical support information should remain available for reporting when appropriate.

Technical storage behavior belongs in `.ai/architecture.md`.

---

# 7. Permissions & Access Rules

```text
Administrator

├── View support tickets
├── Manage support tickets
├── View customers
├── Review AI analysis
├── Manage workflows
└── View analytics


Customer

├── Submit support tickets
├── View own tickets
└── View own support information
```

Customers must not:

* View other customers' tickets.
* Access the administrator dashboard.
* Manage automation workflows.
* Access AI provider credentials.
* Access internal administrative information.

Administrators must still be subject to authentication and authorization checks.

---

# 8. Important System Behaviors

* Every support ticket must maintain its association with the correct customer.
* AI analysis must remain associated with the correct ticket.
* AI-generated responses must be clearly distinguishable from confirmed human responses.
* Workflow conditions must be evaluated before workflow actions execute.
* Failed workflow executions must not be reported as successful.
* Customer information must not be exposed across customer accounts.
* Administrative functionality must remain protected.
* Generated demo data must be suitable for testing and demonstration.
* The system should provide useful feedback when an operation fails.
* Long-running or resource-intensive automation should not be introduced without considering its effect on user experience.

---

# 9. External Dependencies

## AI Provider

**Purpose:**

Analyze customer support inquiries and generate AI-assisted results.

**Why the project depends on it:**

AI functionality is a core feature of the platform.

**Important business behavior:**

The system should remain understandable and usable if AI processing fails.

AI output should be treated as assistance rather than unquestionable truth.

**Failure considerations:**

* AI provider unavailable.
* Request failure.
* Rate limiting.
* Invalid AI response.
* Unexpected AI output.

The technical integration belongs in `.ai/architecture.md`.

---

# 10. User Experience Expectations

The application should provide:

* Responsive layouts.
* Clear navigation.
* Clear validation messages.
* Loading indicators during processing.
* Useful error feedback.
* Confirmation for destructive actions.
* Clear distinction between AI-generated information and human-confirmed information.
* Clear ticket status.
* Clear priority indicators.
* A usable administrative dashboard.
* A straightforward customer support form.

The application should be suitable for demonstration from a normal web browser.

---

# 11. Terminology

**Customer**

A person who submits or interacts with a support request.

**Support Ticket**

A structured record representing a customer support inquiry.

**Ticket Message**

A message belonging to a support ticket.

**AI Analysis**

AI-generated information about a support ticket.

**Priority**

The relative urgency assigned to a support ticket.

**Category**

The type of issue represented by a support ticket.

**Sentiment**

The detected emotional tone of a customer message.

**Suggested Response**

An AI-generated response that an administrator may review and use as appropriate.

**Workflow**

A configurable set of conditions and actions used to automate business processes.

**Workflow Run**

A recorded execution of a workflow.

**Demo Data**

Generated data used for development, testing, and portfolio demonstration rather than representing real business activity.

---

# 12. Important Constraints

* The system must be usable without requiring a real business during development.
* The project must support generated demo data.
* The project is intended to demonstrate practical software engineering skills.
* Python must be used for backend development.
* AI functionality must be handled through the backend.
* Sensitive credentials must never be exposed to users.
* Customer data must remain isolated between customers.
* The system should remain simple enough to understand and maintain.
* Additional infrastructure should only be introduced when justified by an actual requirement.
* AI-generated information must remain reviewable.
* The system should be suitable for portfolio demonstration.

Technical architecture constraints belong in `.ai/architecture.md`.

---

# 13. Historical Context

## Previous Process

There is no existing real-business process being replaced.

The project is being created as a simulated business automation environment for learning and portfolio purposes.

## Reason for Creation

The project was created to provide practical experience with:

* Python
* Backend development
* REST APIs
* Databases
* AI integration
* Business automation
* Testing
* Software architecture

## Important Requirement

The project must be capable of demonstrating realistic business automation without requiring an actual business customer.

---

# 14. Known Ambiguities

## AI Provider

**Question:**

Which external AI provider should be used?

**Affected Area:**

AI processing and backend integration.

**Current Understanding:**

The system will use an external LLM/AI API.

**Required Clarification:**

The exact provider should be selected before implementing the provider-specific integration.

---

## Authentication Provider

**Question:**

Should authentication be implemented directly in FastAPI or delegated to an authentication service?

**Affected Area:**

Authentication and authorization.

**Current Understanding:**

The application requires authenticated users and role-based access.

**Required Clarification:**

The final authentication approach should be selected before implementing authentication.

---

## Workflow Scope

**Question:**

How complex should the initial workflow engine be?

**Affected Area:**

Workflow automation.

**Current Understanding:**

The initial system should support basic triggers, conditions, and actions.

**Required Clarification:**

The exact supported trigger/condition/action types should be defined before implementing the workflow builder.

---

# 15. Important Decisions

* The project will use a fictional business environment for initial development and demonstration.
* The system must not require a real business to be usable.
* Generated demo data will be used for testing and portfolio demonstrations.
* AI-generated results must remain distinguishable from human-confirmed results.
* Customers must only access their own customer-facing information.
* Administrative functionality must be protected.
* AI processing belongs to the backend rather than the frontend.
* Technical architecture decisions are maintained in `.ai/architecture.md`.
* Detailed historical decisions belong in `decisions.md`.

---

# 16. Context Maintenance

Update this document when:

* A business rule changes.
* A major workflow changes.
* A user role changes.
* A domain concept changes.
* A project requirement changes.
* An important system behavior changes.
* A terminology definition changes.
* A significant constraint changes.

Do not update this document for:

* Temporary debugging information.
* Individual coding tasks.
* Minor implementation details.
* Personal session notes.
* Test results.
* Git history.

Those belong elsewhere in the project harness.

---

# 17. Source of Truth

When determining expected project behavior, use this hierarchy:

```text
Explicit Current Requirements
          ↓
Confirmed Business Rules
          ↓
Actual System Behavior
          ↓
.ai/context.md
          ↓
Historical Documentation
          ↓
Assumptions
```

If the documented context conflicts with confirmed current requirements or actual behavior:

1. Identify the conflict.
2. Do not silently choose an interpretation.
3. Follow `.ai/rules.md` for handling uncertainty.
4. Clarify the requirement when necessary.
5. Update this document when the correct behavior is established.

Never treat assumptions as confirmed requirements.

---

# 18. Context Principle

The purpose of this document is to answer:

> **"What does this project need to accomplish, and what rules govern its behavior?"**

It should not attempt to answer:

> "How is the code technically implemented?"

For technical implementation, refer to:

```text
.ai/architecture.md
```

For AI behavior and development rules, refer to:

```text
.ai/rules.md
```

For development process, refer to:

```text
.ai/workflow.md
```

For task-specific requirements, refer to:

```text
.ai/tasks/
```

For persistent project state, refer to:

```text
progress.md
decisions.md
results.md
```
