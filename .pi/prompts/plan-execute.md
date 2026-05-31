---
description: Plan-confirm-execute workflow with validation
argument-hint: "[task description]"
---

Follow the plan-execute-validate workflow for this task.

1. **Plan**: Analyze the request and use the `submit_plan` tool to create a step-by-step plan. Include files to read, files to modify, and any commands.
2. **Confirm**: Wait for user approval via the confirmation dialog. Do not proceed until approved.
3. **Execute**: Implement the approved plan step by step using read, edit, write, and bash tools.
4. **Validate**: Run the project's test/lint/build commands and report results. Fix any failures.

$1
