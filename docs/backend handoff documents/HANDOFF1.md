> [!IMPORTANT]
> This is a historical implementation handoff.
>
> It documents the repository state at an earlier development checkpoint.
> Some statements, API shapes, test limitations, Git status details, and
> recommended next actions have been superseded.
>
> Read the handoff documents in numerical order and treat `HANDOFF3.md`
> as the authoritative description of the completed backend branch.

# SOC 2 Compliance MVP Backend/Data Layer Handoff

## 1. Project And Task Objective

This repository is a one-day demonstration SOC 2 compliance MVP built with Next.js 16, React 19, TypeScript, and deterministic mock integrations. The current branch is the backend-owned branch:

- Branch: `feat/codex-compliance-backend`
- HEAD commit: `a193e1aa547d44848268eae8e0193380f3955f93`
- Latest commits:
  - `a193e1a merge: add shared MVP API contract`
  - `c1cba69 chore: define shared MVP API contract`
  - `1fee50c chore: initialize SOC 2 compliance MVP`
  - `8be35dc Initial commit`

The immediate completed task was to implement a Prisma/SQLite data layer for the SOC 2 MVP and leave the repository ready for another Codex instance to continue.

## 2. Original Requirements And Constraints

Project-level instructions from `AGENTS.md` and `CLAUDE.md`:

- Read `docs/MVP_SCOPE.md` before changing code.
- Read `docs/BRANCH_OWNERSHIP.md` before changing files.
- Use TypeScript.
- Do not introduce real cloud credentials.
- All external integrations must operate in deterministic mock mode.
- Do not describe the application as an official auditor or attestation.
- Run lint, tests, type checking, and build before committing.
- Do not modify files owned by the other development branch without explicit coordination.
- This is Next.js 16; read relevant local docs in `node_modules/next/dist/docs/` before writing Next code.

Branch ownership from `docs/BRANCH_OWNERSHIP.md`:

- Backend/Codex owns `prisma/**`, `src/server/**`, `src/app/api/**`, `tests/server/**`, `scripts/**`.
- Frontend/Claude owns `src/components/**`, `src/app/dashboard/**`, `src/app/evidence/**`, `src/app/employees/**`, `src/app/policies/**`, `src/app/risks/**`, `src/app/auditor/**`, `src/lib/client/**`, `tests/ui/**`.
- Shared files requiring coordination include `package.json`, `package-lock.json`, `src/lib/contracts/**`, `src/app/layout.tsx`, `.env.example`, `docs/**`.

Shared API contract constraints from `docs/MVP_CONTRACT.md` and `src/lib/contracts/index.ts`:

- Treat `src/lib/contracts/**` as source of truth for API routes and response shapes.
- Do not modify the shared contract unless a concrete incompatibility is found.
- Routes include `/api/dashboard`, `/api/controls`, `/api/evidence`, `/api/employees`, `/api/policies`, `/api/policies/:id/acknowledge`, `/api/risks`, `/api/connectors`, `/api/connectors/sync`, `/api/auditor/export`.
- All API failures should return `ApiErrorBody`.
- IDs must be stable strings; timestamps are ISO 8601 strings.
- Integrations for AWS, Azure, GitHub, Gusto, and Rippling must be deterministic mocks only.

Data layer requirements from the latest task:

- Use Prisma with SQLite unless the repository already uses a different database.
- Create models named `Connector`, `ComplianceControl`, `EvidenceItem`, `Employee`, `Policy`, `PolicyAcknowledgement`, `RiskAssessment`, `SyncRun`.
- Evidence records must have `collectedAt`.
- Compliance controls must store current status.
- Employee records must track employment status, source system, AWS access, Azure access, GitHub access, and optional termination date.
- Policy acknowledgements must track employee, policy, version, and timestamp.
- Risk assessments must track likelihood, impact, owner, mitigation, and status.
- Sync runs must record provider, start time, completion time, status, and optional error.
- Seed data must include 8 controls, at least 12 evidence items, 8 employees, at least 2 terminated employees, one terminated employee with system access, 5 policies, acknowledged and unacknowledged policies, 3 risks, and connector records for AWS, Azure, GitHub, Gusto, and Rippling.
- Developers must be able to run `npm run db:generate`, `npm run db:migrate`, and `npm run db:seed`.
- Do not implement frontend code.

## 3. Work Completed

Backend/API work completed earlier in this session:

- Added deterministic mock API implementation under `src/server/**` and `src/app/api/**`.
- Added route handlers for all shared contract routes.
- Added basic compliance evaluation helpers and mock connector interfaces.
- Added backend test files under `tests/server/**`.

Data layer work completed in the latest task:

- Added Prisma dependencies:
  - Runtime dependency: `@prisma/client`
  - Dev dependency: `prisma`
- Added Prisma SQLite schema at `prisma/schema.prisma`.
- Added SQL migration at `prisma/migrations/20260719000000_init/migration.sql`.
- Added deterministic seed script at `prisma/seed.mjs`.
- Updated `package.json` scripts:
  - `db:generate`: `prisma generate`
  - `db:migrate`: `prisma db execute --file prisma/migrations/20260719000000_init/migration.sql --schema prisma/schema.prisma`
  - `db:seed`: `node prisma/seed.mjs`
  - `typecheck`: `tsc --noEmit`
- Ran the requested database commands successfully:
  - `npm.cmd run db:generate`
  - `npm.cmd run db:migrate`
  - `npm.cmd run db:seed`
- Created local SQLite database `prisma/dev.db` by running the migration and seed commands.

Seed verification through Prisma Client returned:

```json
{
  "controls": 8,
  "evidence": 14,
  "employees": 8,
  "terminated": 2,
  "terminatedWithAccess": 1,
  "policies": 5,
  "acks": 10,
  "risks": 3,
  "connectors": 5,
  "syncRuns": 5
}
```

## 4. Files Added, Modified, Or Deleted

Tracked modified files:

- `package.json`
  - Added Prisma dependencies.
  - Added `typecheck`, `db:generate`, `db:migrate`, and `db:seed` scripts.
- `package-lock.json`
  - Updated by `npm.cmd install` after adding Prisma packages.

Untracked added files:

- `HANDOFF.md`
  - This handoff document.
- `prisma/schema.prisma`
  - Prisma schema with requested SQLite data models.
- `prisma/migrations/20260719000000_init/migration.sql`
  - SQLite migration SQL used by `npm run db:migrate`.
- `prisma/seed.mjs`
  - Deterministic Prisma seed script.
- `prisma/dev.db`
  - Generated local SQLite database created by `db:migrate` and `db:seed`.
  - This is an artifact; next agent should decide whether to commit it or ignore it. It is currently untracked.
- `src/server/api.ts`
  - JSON response helper, API error helper, JSON-object request parser, string validator.
- `src/server/mock-data.ts`
  - In-memory deterministic mock data matching the shared API contract.
- `src/server/validation.ts`
  - Request/query validation for API route handlers.
- `src/server/compliance/evaluate.ts`
  - Basic compliance status derivation and dashboard aggregate calculation.
- `src/server/connectors/types.ts`
  - `DemoConnector` interface.
- `src/server/connectors/mock-connectors.ts`
  - Deterministic mock connector implementations for AWS, Azure, GitHub, Gusto, and Rippling.
- `src/server/repositories/demo-repository.ts`
  - Facade returning the in-memory demo data store.
- `src/app/api/dashboard/route.ts`
  - `GET /api/dashboard`.
- `src/app/api/controls/route.ts`
  - `GET /api/controls`.
- `src/app/api/evidence/route.ts`
  - `GET /api/evidence` with `controlId` and `provider` query filtering.
- `src/app/api/employees/route.ts`
  - `GET /api/employees`.
- `src/app/api/policies/route.ts`
  - `GET /api/policies`.
- `src/app/api/policies/[id]/acknowledge/route.ts`
  - `POST /api/policies/:id/acknowledge`.
- `src/app/api/risks/route.ts`
  - `GET /api/risks` and `POST /api/risks`.
- `src/app/api/connectors/route.ts`
  - `GET /api/connectors`.
- `src/app/api/connectors/sync/route.ts`
  - `POST /api/connectors/sync`.
- `src/app/api/auditor/export/route.ts`
  - `GET /api/auditor/export`.
- `tests/server/compliance.test.ts`
  - Node test definitions for compliance evaluation.
- `tests/server/connectors.test.ts`
  - Node test definitions for mock connectors.

No files are staged. No files were deleted in the final working tree.

## 5. Important Implementation Decisions

- Prisma uses SQLite with `url = "file:./dev.db"` in `prisma/schema.prisma`.
  - Reason: latest task required Prisma with SQLite unless another database already existed. No existing database was present.
- Model names follow the latest task exactly: `ComplianceControl`, `EvidenceItem`, `RiskAssessment`, `SyncRun`, etc.
  - Reason: these names differ from the shared API contract names, but the task explicitly requested database model names.
- `EvidenceItem.controls` uses an implicit many-to-many relation with `ComplianceControl`.
  - Reason: one evidence item can support multiple controls, matching the API contract's `Evidence.controlIds`.
- `PolicyAcknowledgement` has a unique compound key over employee, policy, and policy version.
  - Reason: the requirement says acknowledgements must track employee, policy, version, and timestamp; uniqueness prevents duplicate acknowledgement rows for the same version.
- `db:migrate` uses `prisma db execute` with a checked-in SQL migration file, not `prisma migrate dev`.
  - Reason: `prisma migrate dev --name init`, `prisma migrate dev --create-only`, and `prisma db push` all failed locally with a blank `Schema engine error`, even for a minimal schema. `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` worked, and `prisma db execute --schema prisma/schema.prisma --stdin` worked. Applying checked-in SQL with `prisma db execute --file ...` succeeded.
- The current API routes still read the in-memory data in `src/server/mock-data.ts`; they do not yet read from Prisma.
  - Reason: the data layer task did not explicitly ask to replace API repositories with Prisma-backed repositories, and preserving the already-working contract endpoints avoids introducing route regressions without tests.
- No real provider credentials or network calls are used by connectors or seed data.
  - Reason: deterministic demo/mock mode is a hard project constraint.

## 6. Current Architecture And Execution Flow

API route flow:

- `src/app/api/**/route.ts` files are Next.js App Router route handlers.
- Route handlers call helpers in `src/server/**`.
- `src/server/api.ts` standardizes JSON responses, `Cache-Control: no-store`, and contract-shaped errors.
- `src/server/validation.ts` validates incoming JSON bodies and provider query filters.
- `src/server/mock-data.ts` holds deterministic contract-shaped data and small write simulations:
  - `acknowledgePolicy(policyId, employeeId)`
  - `createRisk(request)`
  - `syncConnector(connectorId)`
  - `getEvidence(filters)`
- `src/server/compliance/evaluate.ts` derives control statuses and dashboard aggregates from the in-memory data store.
- `src/server/connectors/mock-connectors.ts` implements mock connector behavior over static data.

Database flow:

- `npm run db:generate` generates Prisma Client from `prisma/schema.prisma`.
- `npm run db:migrate` applies `prisma/migrations/20260719000000_init/migration.sql` to `prisma/dev.db`.
- `npm run db:seed` runs `node prisma/seed.mjs`.
- `prisma/seed.mjs` clears existing rows in relation-safe order and then recreates all deterministic rows.
- Seeded data intentionally contains a Rippling/access issue: employee `emp-morgan` is terminated and still has GitHub access.

Next.js doc note:

- Route handlers follow Next.js 16 App Router route handler convention from `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` and `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`.

## 7. Commands Run

Inspection commands:

- `git status --short --branch`
- `git branch --show-current`
- `git log --oneline -5`
- `git rev-parse HEAD`
- `git diff --stat`
- `git diff --cached --stat`
- `git diff --cached --name-status`
- `git diff --name-status`
- `git ls-files --others --exclude-standard`
- `git diff -- package.json package-lock.json`
- `rg --files -g '!node_modules/**' -g '!.next/**'`
- `rg --files src/server src/app/api tests/server prisma`
- `Get-Content` against docs, contract, schema, seed, server files, and tests.

Implementation/setup commands:

- `npm.cmd install`
  - First attempt timed out after 120 seconds and did not install Prisma.
  - Second attempt was run with approved network escalation and succeeded.
- `npm.cmd run db:generate`
- `npm.cmd run db:migrate`
- `npm.cmd run db:seed`
- Prisma diagnostic commands used while debugging migration:
  - `npx.cmd prisma validate`
  - `npx.cmd prisma -v`
  - `npx.cmd prisma migrate dev --name init`
  - `npx.cmd prisma migrate dev --name init --create-only`
  - `npx.cmd prisma db push`
  - `npx.cmd prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`
  - `npx.cmd prisma db execute --schema prisma/schema.prisma --stdin`
- Seed count verification:
  - `node -e "const {PrismaClient}=require('@prisma/client'); ..."`
- Verification commands:
  - `npm.cmd run lint`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run test`
  - `npm.cmd audit --audit-level=moderate`

## 8. Verification Results

Final verification after writing `HANDOFF.md`:

- `npm.cmd run db:generate`: passed; Prisma Client v6.19.3 generated successfully.
- `npm.cmd run db:migrate`: passed; output was `Script executed successfully.`
- `npm.cmd run db:seed`: passed with no errors.
- Prisma Client seed-count smoke check: passed with `controls: 8`, `evidence: 14`, `employees: 8`, `terminated: 2`, `terminatedWithAccess: 1`, `policies: 5`, `acks: 10`, `risks: 3`, `connectors: 5`, `syncRuns: 5`.
- `npm.cmd run lint`: passed.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run build`: passed; Next.js 16.2.10 compiled successfully and listed 10 dynamic API routes.
- `npm.cmd run test`: failed as expected because `package.json` has no `test` script.

Successful:

- `npm.cmd run db:generate`
  - Passed.
  - Output included: `Generated Prisma Client (v6.19.3) to .\node_modules\@prisma\client`.
- `npm.cmd run db:migrate`
  - Passed.
  - Output: `Script executed successfully.`
- `npm.cmd run db:seed`
  - Passed with no errors.
- Prisma Client seed-count smoke check
  - Passed with counts:
    - `controls: 8`
    - `evidence: 14`
    - `employees: 8`
    - `terminated: 2`
    - `terminatedWithAccess: 1`
    - `policies: 5`
    - `acks: 10`
    - `risks: 3`
    - `connectors: 5`
    - `syncRuns: 5`
- `npm.cmd run lint`
  - Passed.
- `npm.cmd run typecheck`
  - Passed.
- `npm.cmd run build`
  - Passed.
  - Next.js 16.2.10 compiled successfully and listed all API routes as dynamic:
    - `/api/auditor/export`
    - `/api/connectors`
    - `/api/connectors/sync`
    - `/api/controls`
    - `/api/dashboard`
    - `/api/employees`
    - `/api/evidence`
    - `/api/policies`
    - `/api/policies/[id]/acknowledge`
    - `/api/risks`

Failed or unavailable:

- `npm.cmd run test`
  - Failed because `package.json` has no `test` script.
  - The files in `tests/server/**` are typechecked by `npm.cmd run typecheck`, but there is no npm test runner configured.
- `npm.cmd audit --audit-level=moderate`
  - Failed because the audit endpoint request returned an error in this environment.
  - Earlier `npm.cmd install` output reported `2 moderate severity vulnerabilities`; this was not resolved.
- `prisma migrate dev`
  - Failed with blank `Schema engine error`.
  - See implementation decision above; `db:migrate` intentionally uses `prisma db execute`.

## 9. Current Git State

Branch and tracking:

- `feat/codex-compliance-backend...origin/feat/codex-compliance-backend`

Staged files:

- None.

Tracked modified files:

- `package-lock.json`
- `package.json`

Untracked files:

- `HANDOFF.md`
- `prisma/dev.db`
- `prisma/migrations/20260719000000_init/migration.sql`
- `prisma/schema.prisma`
- `prisma/seed.mjs`
- `src/app/api/auditor/export/route.ts`
- `src/app/api/connectors/route.ts`
- `src/app/api/connectors/sync/route.ts`
- `src/app/api/controls/route.ts`
- `src/app/api/dashboard/route.ts`
- `src/app/api/employees/route.ts`
- `src/app/api/evidence/route.ts`
- `src/app/api/policies/[id]/acknowledge/route.ts`
- `src/app/api/policies/route.ts`
- `src/app/api/risks/route.ts`
- `src/server/api.ts`
- `src/server/compliance/evaluate.ts`
- `src/server/connectors/mock-connectors.ts`
- `src/server/connectors/types.ts`
- `src/server/mock-data.ts`
- `src/server/repositories/demo-repository.ts`
- `src/server/validation.ts`
- `tests/server/compliance.test.ts`
- `tests/server/connectors.test.ts`

Tracked diff summary before writing this handoff:

- `package-lock.json`: Prisma-related lockfile changes.
- `package.json`: added Prisma deps and scripts.

## 10. Known Defects, Blockers, Risks, Edge Cases, And Incomplete Work

- API routes are not Prisma-backed yet.
  - They return data from `src/server/mock-data.ts`, while the new Prisma data layer exists separately.
- `prisma/dev.db` is untracked and not ignored.
  - Decide whether to commit the seeded SQLite database for demo convenience or add it to `.gitignore`. Do not make that decision without considering handoff/demo expectations.
- `db:migrate` is not a normal Prisma migration workflow.
  - It applies checked-in SQL through `prisma db execute` because `prisma migrate dev` failed locally with a blank schema engine error.
- No `test` npm script exists.
  - `tests/server/*.test.ts` use `node:test` and TypeScript imports with the `@/*` alias. They are not currently executable through npm without adding a TS-aware runner or build step.
- `npm audit` could not complete due an endpoint/network error.
  - `npm install` reported `2 moderate severity vulnerabilities`.
- `package.json` and `package-lock.json` are shared files per branch ownership docs.
  - They were modified because Prisma dependencies and scripts were required by the task.
- `docs/MVP_CONTRACT.md` displays mojibake for punctuation in this environment, but it was not modified.
- The Prisma schema uses string fields for enum-like statuses/providers instead of Prisma enums.
  - This preserves flexibility against the draft API contract but leaves validation to application code.
- SQLite migration SQL uses `JSONB` for `EvidenceItem.metadata` because that was produced by Prisma diff for the Prisma `Json` field.
  - SQLite accepts flexible types, and `db:migrate` plus `db:seed` succeeded. Next agent should verify this remains acceptable if changing Prisma versions.
- The seeded data uses fixed timestamps centered on `2026-07-18T12:00:00.000Z`.
- Frontend pages/components remain untouched and are still the default starter UI unless another branch changes them.

## 11. Remaining Tasks In Priority Order

1. Decide whether `prisma/dev.db` should be committed or ignored.
2. Add a real test script/runner for `tests/server/**`, or convert tests to a runnable setup compatible with TypeScript and `@/*` aliases.
3. Decide whether API routes should remain in-memory mock-backed for the MVP or be refactored to query Prisma.
4. If using Prisma from API routes, add a Prisma client singleton under `src/server/**` and repository methods mapping DB models to `src/lib/contracts` response shapes.
5. Add tests for route handlers and Prisma seed invariants.
6. Investigate why `prisma migrate dev` fails with blank `Schema engine error` on this machine.
7. Re-run `npm audit` in a network-enabled environment and assess the two moderate vulnerabilities.
8. Consider moving status/provider strings to Prisma enums only if doing so does not conflict with the draft shared contract or demo speed.

## 12. Exact Next Recommended Action

Add a `test` script and runnable backend test setup, then decide whether to integrate API routes with Prisma.

Recommended first concrete step:

- Add a minimal test runner that can execute `tests/server/*.test.ts` with TypeScript and the `@/*` alias, then run it and fix any resulting failures.

## 13. Commands To Resume Development And Verify Environment

From repository root:

```powershell
npm.cmd install
npm.cmd run db:generate
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

Optional seed verification:

```powershell
node -e "const {PrismaClient}=require('@prisma/client'); const prisma=new PrismaClient(); (async()=>{ const [controls,evidence,employees,terminated,terminatedWithAccess,policies,acks,risks,connectors,syncRuns]=await Promise.all([prisma.complianceControl.count(),prisma.evidenceItem.count(),prisma.employee.count(),prisma.employee.count({where:{employmentStatus:'terminated'}}),prisma.employee.count({where:{employmentStatus:'terminated',OR:[{hasAwsAccess:true},{hasAzureAccess:true},{hasGithubAccess:true}]}}),prisma.policy.count(),prisma.policyAcknowledgement.count(),prisma.riskAssessment.count(),prisma.connector.count(),prisma.syncRun.count()]); console.log(JSON.stringify({controls,evidence,employees,terminated,terminatedWithAccess,policies,acks,risks,connectors,syncRuns},null,2)); await prisma.`$disconnect(); })().catch(async e=>{ console.error(e); await prisma.`$disconnect(); process.exit(1); })"
```

Do not expect `npm.cmd run test` to work yet; no `test` script exists.

## 14. Assumptions The Next Agent Must Verify

- Verify whether committing `prisma/dev.db` is desired.
- Verify whether the frontend branch expects API responses from the current in-memory data or from seeded Prisma rows.
- Verify whether package/shared file changes are acceptable for coordination.
- Verify whether the Prisma SQL migration strategy is acceptable for the team, given `prisma migrate dev` failures here.
- Verify whether the seed data values align with demo/storytelling expectations.
- Verify whether the two moderate npm vulnerabilities matter for a one-day MVP.
- Verify whether frontend pages/components have changed on another branch before modifying any API response assumptions.

## 15. Files Or Areas That Must Not Be Changed Without Coordination

Do not change these without explicit coordination:

- `src/components/**`
- `src/app/dashboard/**`
- `src/app/evidence/**`
- `src/app/employees/**`
- `src/app/policies/**`
- `src/app/risks/**`
- `src/app/auditor/**`
- `src/lib/client/**`
- `tests/ui/**`
- `src/lib/contracts/**`
- `docs/**`
- `src/app/layout.tsx`
- `.env.example`
- Shared package files such as `package.json` and `package-lock.json`, unless required and coordinated.

Allowed/backend-owned areas:

- `prisma/**`
- `src/server/**`
- `src/app/api/**`
- `tests/server/**`
- `scripts/**`
