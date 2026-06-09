# Personal Engineering Instructions

## Default behavior

- Read before editing.
- Plan before changing.
- Prefer small, focused diffs.
- Follow the existing codebase style.
- Do not introduce new abstractions unless clearly useful.
- Do not modify public APIs, database schemas, auth logic, or deployment config casually.
- When unsure, ask for clarification or state assumptions.
- Always mention what was not tested.

## Before editing code

1. Restate the task.
2. Inspect relevant files.
3. Explain the current flow.
4. Propose a safe implementation plan.
5. List likely files to change.

## After editing code

1. Summarize the change.
2. Mention important files changed.
3. Run relevant tests/build/lint if available.
4. Report failures honestly.
5. Suggest follow-up work only when useful.

## Security checklist

Always watch for:

- Broken access control
- IDOR
- Missing ownership checks
- Missing tenant isolation
- Weak input validation
- Secret leakage
- Sensitive data in logs
- SQL/command injection
- Unsafe file uploads
- Weak CORS
- Missing rate limits
- Payment/webhook trust issues

## Testing standards

Prefer tests that cover:

- Happy path
- Invalid input
- Unauthorized access
- Forbidden access
- Not found
- Ownership mismatch
- Edge cases
- Regression cases

## Git rules

- Do not commit unless explicitly asked.
- Do not push unless explicitly asked.
- Do not rewrite history unless explicitly asked.
- Before generating a PR description, inspect the current diff.
