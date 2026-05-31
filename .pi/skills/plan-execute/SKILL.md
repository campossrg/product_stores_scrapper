---
name: plan-execute
description: Plan-confirm-execute workflow for safe, validated code changes. Use whenever the user asks for implementation, refactoring, feature additions, or non-trivial edits.
---

# Plan-Execute-Validate Workflow

Follow this workflow for any implementation or refactoring task:

## 1. Plan
Analyze the request and create a detailed step-by-step plan using the `submit_plan` tool.
Include:
- Which files to read first
- Which files to modify
- Any commands to run

**Always use `submit_plan` before making file changes.**

## 2. Confirm
The `submit_plan` tool will present the plan to the user and block until they approve or reject it.
- If approved, proceed to implementation.
- If rejected, ask what to change and submit a revised plan.

## 3. Execute
Implement the plan step by step using `read`, `edit`, `write`, and `bash`.
- Read files before editing them.
- Make focused, incremental changes.
- Run intermediate commands if helpful.

## 4. Validate
After all steps are complete, run the project's validation commands (tests, lint, typecheck, build) using the `bash` tool or the `validate_changes` tool.
Report the results clearly:
- Success: summarize what passed.
- Failure: show the error, fix it, and re-run validation.

## Cleanup
When the workflow is fully complete, you may tell the user to run `/clear-plan` if they want to remove the plan file.
