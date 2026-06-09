---
name: debugging-protocol
description: Debug an error systematically without shotgun changes.
---

# Debugging Protocol

Follow this sequence:

1. Read the exact error.
2. Identify the failing layer.
3. Find the smallest reproduction.
4. Inspect related code.
5. List possible causes ranked by likelihood.
6. Change only one thing at a time.
7. Verify with command, test, or log.
8. Explain root cause and final fix.

Rules:

- Do not make multiple unrelated changes.
- Do not guess silently.
- Do not hide uncertainty.
- Prefer proving the cause before editing.
