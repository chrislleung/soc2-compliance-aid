# Backend Handoff

This backend is a deterministic demonstration MVP for SOC 2 evidence collection. It is not an auditor, SOC 2 attestation, legal opinion, or official compliance determination.

## Files Created

- `tests/register-alias.cjs` - Node test runner bootstrap for the `@/` TypeScript path alias.
- `tests/server/api-validation.test.ts` - API request validation tests.
- `tests/server/auditor-export.test.ts` - Auditor ZIP export tests.

## Files Updated

- `package.json` - Added `npm test`.
- `src/app/api/auditor/export/route.ts` - Returns the auditor ZIP download directly.
- `src/server/auditor/export-package.ts` - Builds the required UTF-8 ZIP package, JSON files, and escaped CSV files.
- `src/server/compliance/evaluate.ts` - Emits the normalized dashboard contract and exposes risk assessment coverage evaluation.
- `src/server/connectors/sync-service.ts` - Keeps full sync running when one connector throws and records the error in that connector sync result.
- `src/server/mock-data.ts` - Exposes deterministic policy acknowledgement records for export and dashboard policy metrics.
- `src/lib/contracts/index.ts` - Normalizes dashboard, connector, and control status interfaces.
- `docs/MVP_CONTRACT.md` - Documents the normalized dashboard response and eight-control MVP decision.
- `prisma/seed.mjs` - Aligns seeded control statuses with `pass`, `warning`, and `fail`.
- `tests/server/compliance.test.ts` - Adds MFA, encryption, GitHub branch protection, offboarding, policy completion, and risk assessment tests.
- `tests/server/connectors.test.ts` - Adds connector error resilience coverage.
- `tests/server/dashboard-api.test.ts` - Verifies the route-level dashboard response shape.

## API Routes

- `GET /api/dashboard` - Normalized compliance dashboard summary using `controlCounts`, `policyMetrics`, and connector connection/sync separation.
- `GET /api/controls` - Evaluated demo controls.
- `GET /api/evidence` - Mock evidence with optional `provider`, `status`, and `controlId` filters.
- `GET /api/employees` - Demo employees with computed offboarding issue state.
- `GET /api/policies` - Demo policies with acknowledgement completion data.
- `POST /api/policies/:id/acknowledge` - Create or update a deterministic in-memory policy acknowledgement.
- `GET /api/risks` - Demo risk register.
- `POST /api/risks` - Create a deterministic in-memory risk assessment.
- `GET /api/connectors` - Mock connector status.
- `POST /api/connectors/sync` - Deterministic single-connector or all-connector sync with observable in-memory refresh state.
- `GET /api/auditor/export` - Downloads `soc2-audit-package.zip`.

## Database Setup

Prisma uses SQLite with `prisma/dev.db`.

Commands:

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
```

The API currently uses deterministic in-memory mock data instead of querying Prisma at request time. The Prisma schema and seed data remain available for demo/data-layer work.

## Test Commands

Run the backend verification suite:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

`npm test` runs Node's built-in test runner through `jiti/register` so TypeScript test files can execute without adding another package.

## Known Limitations

- External integrations are deterministic mocks only.
- Runtime API writes are in-memory only.
- Runtime connector sync results are returned by the API but are not persisted to Prisma `SyncRun` rows.
- Demo sync updates are observable only for the current server process; restarting the dev server resets them to deterministic seed values.
- Policy metrics are calculated from deterministic mock active employees and acknowledgement rows.
- Offboarding access failure is represented by open offboarding issues in the API employee model.
- The ZIP export contains JSON and CSV data only, not screenshots, PDFs, or live provider artifacts.

## Frontend Integration Notes

- `/api/dashboard` uses `ControlStatus = "pass" | "warning" | "fail"` and always returns eight controls in `controlCounts.total`.
- `/api/dashboard.generatedAt` is the response generation time; `/api/dashboard.lastDataRefreshAt` is the latest completed demo sync time.
- Dashboard `controlCounts.total` equals `controlCounts.pass + controlCounts.warning + controlCounts.fail`.
- Dashboard connector summaries separate `connectionStatus` from `lastSyncStatus`; Rippling is connected but its deterministic latest sync is `error`.
- The auditor export route now downloads the ZIP directly from `GET /api/auditor/export`; no `?format=zip` query is required.
- Download headers are:
  - `Content-Type: application/zip`
  - `Content-Disposition: attachment; filename="soc2-audit-package.zip"`
- The ZIP includes `README.txt`, `controls.json`, `evidence.json`, `employees.csv`, `policies.csv`, `policy-acknowledgements.csv`, `risks.csv`, and `connector-sync-history.json`.
- CSV files are UTF-8 text with escaped values and header rows.
