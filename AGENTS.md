<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Instructions

This is a one-day demonstration SOC 2 compliance MVP.

## General rules

- Read `docs/MVP_SCOPE.md` before changing code.
- Read `docs/BRANCH_OWNERSHIP.md` before changing files.
- Use TypeScript.
- Do not introduce real cloud credentials.
- All external integrations must operate in deterministic mock mode.
- Do not describe the application as an official auditor or attestation.
- Run lint, tests, type checking, and build before committing.
- Do not modify files owned by the other development branch without explicit coordination.