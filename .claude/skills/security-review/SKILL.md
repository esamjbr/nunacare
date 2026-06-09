---
name: security-review
description: Perform a structured security review of code, endpoints, diffs, or architecture.
---

# Security Review

Review for:

- Broken access control
- IDOR
- Missing tenant isolation
- Missing ownership checks
- Weak validation
- Secret leakage
- Sensitive data in logs
- SQL injection
- Command injection
- Mass assignment
- Unsafe file upload
- Insecure CORS
- Weak auth/session handling
- Webhook trust issues
- Missing rate limits
- Insecure dependency usage

Output findings by severity:

- Critical
- High
- Medium
- Low

For each finding include:

- Location
- Why it matters
- Exploit scenario
- Fix
- Test to prove the fix

Do not implement fixes unless explicitly asked.
