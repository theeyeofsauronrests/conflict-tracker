---
name: accelint-nextjs-best-practices
description: Use for Next.js architecture, routing, server/client boundaries, API route design, caching, and deployment-safe patterns in App Router projects.
---

# Next.js Best Practices

Use this skill when implementing or reviewing Next.js App Router code.

## Checklist
- Keep data fetching on the server by default.
- Use client components only for interactivity/browser APIs.
- Keep route handlers slim; move business logic into lib modules.
- Validate external input at boundaries.
- Prefer typed responses and explicit error branches.
- Use `cache: "no-store"` for volatile operational data.
