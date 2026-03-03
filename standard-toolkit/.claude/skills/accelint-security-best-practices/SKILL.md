---
name: accelint-security-best-practices
description: Use for secure-by-default coding, secret handling, data access policies, endpoint hardening, and least-privilege patterns.
---

# Security Best Practices

Use this skill when implementing or reviewing security-sensitive paths.

## Checklist
- Keep secrets server-side only.
- Validate auth/cron signatures before side effects.
- Enforce least-privilege data access.
- Restrict write paths to trusted service credentials.
- Sanitize and validate all external input.
- Avoid leaking sensitive internals in error responses.
