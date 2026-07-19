> [!IMPORTANT]
> This is a historical implementation handoff.
>
> It documents the repository state at an earlier development checkpoint.
> Some statements, API shapes, test limitations, Git status details, and
> recommended next actions have been superseded.
>
> Read the handoff documents in numerical order and treat `HANDOFF3.md`
> as the authoritative description of the completed backend branch.


# SOC 2 Compliance MVP Handoff 2

## 1. Scope

This handoff documents the work completed after `docs/handoff documents/HANDOFF1.md`.

The work focused on two backend-owned areas:

- Deterministic mock integration adapters for AWS, Azure, GitHub, Gusto, and Rippling.
- API route implementation and response shaping for the MVP routes documented in `docs/MVP_CONTRACT.md`.

The application remains a demonstration aid only. It is not an auditor, SOC 2 attestation, legal opinion, or official compliance determination.

## 2. Important Constraints Followed

- Read `docs/MVP_SCOPE.md` and `docs/BRANCH_OWNERSHIP.md` before changing files.
- Kept all integration behavior deterministic and mock-only.
- Did not add real cloud credentials, API keys, tokens, or secrets.
- Did not modify `src/lib/contracts/index.ts` or `docs/MVP_CONTRACT.md`.
- API response additions were implemented as backward-compatible supersets where the current shared contract did not yet contain the newer requested fields.
- Stayed in backend-owned areas: `src/server/**`, `src/app/api/**`, `tests/server/**`, plus this handoff document under `docs/handoff documents/`.

## 3. Connector Adapter Work

### Common interface

Updated `src/server/connectors/types.ts` with:

- `EvidenceItem` alias to the shared contract `Evidence` representation.
- `ConnectorFindingOutcome`: `pass`, `warning`, `fail`.
- `ConnectorConnectionTest` for deterministic mock connection checks.
- `ConnectorAdapter` interface with:
  - `provider`
  - `testConnection()`
  - `collectEvidence()`
  - `getLastSyncStatus()`
- `DemoConnector` extends the new adapter and preserves `sync()` compatibility for earlier tests/callers.

### Provider adapters

Reworked `src/server/connectors/mock-connectors.ts` so each provider has deterministic mock evidence generated through the connector adapter layer.

AWS mock evidence now includes:

- Database encryption findings.
- IAM user MFA findings.
- At least one passing and one failing finding.

Azure mock evidence now includes:

- Azure SQL database encryption finding.
- Azure storage encryption finding.
- Entra ID MFA findings.
- Passing and warning outcomes.

GitHub mock evidence now includes:

- Branch protection findings.
- Pull request review requirement findings.
- One repository, `internal-runbooks`, without adequate protection.

Gusto mock evidence now includes employee roster evidence with:

- Employee IDs.
- Names.
- Emails.
- Employment statuses.
- Onboarding statuses.

Rippling mock evidence now includes employee/offboarding evidence with:

- Employee IDs.
- Names.
- Emails.
- Employment statuses.
- Termination timestamps.
- Background-check statuses.

All connector evidence is normalized into shared `Evidence`/`EvidenceItem` objects. Finding-level status is stored in flat metadata using `findingOutcome`, while the shared `Evidence.status` field remains the contract-defined freshness status.

### Registry and sync service

Added:

- `src/server/connectors/registry.ts`
  - Lists supported providers.
  - Maps provider IDs to connector IDs.
  - Looks up connectors by provider or connector ID.
  - Exposes `listRegisteredConnectors()`.
- `src/server/connectors/sync-service.ts`
  - Runs deterministic single-connector syncs.
  - Runs deterministic full demo syncs with `syncAllConnectors()`.
  - Uses `testConnection()`, `collectEvidence()`, and `getLastSyncStatus()`.

## 4. Mock Data And Compliance Evaluation

Updated `src/server/mock-data.ts`:

- Evidence now comes from `listRegisteredConnectors().flatMap(connector.collectEvidence())`.
- Connector statuses now come from adapter `getLastSyncStatus()` results.
- Added a new `Data Encryption` control (`cc-6`) tied to AWS/Azure encryption evidence.
- Updated related evidence IDs for access, change management, logging, and encryption controls.
- Added `getEvidence()` support for filtering by:
  - `provider`
  - `status`
  - `controlId`
- `status` filtering accepts both freshness statuses (`valid`, `expiring`, `expired`) and finding outcomes (`pass`, `warning`, `fail`).
- Added `getEmployeesWithOffboardingIssue()`, which appends computed `offboardingIssue`.
- Added `getPoliciesWithCompletion()`, which appends:
  - `pendingAcknowledgementCount`
  - `completionPercentage`
- Added in-memory policy acknowledgement state and made `acknowledgePolicy()` create or update acknowledgements.
- Made `createRisk()` persist newly created risks in memory for the running demo process.
- Added duplicate-safe generated risk IDs for repeated titles.
- Removed the older duplicate `getDashboardSummary()` helper from this file so dashboard responses use the compliance evaluator path.

Updated `src/server/compliance/evaluate.ts`:

- Dashboard response now includes the existing shared contract fields plus:
  - `totalControlCount`
  - `passCount`
  - `warningCount`
  - `failCount`
  - `connectorStatuses`
  - `recentEvidence`
  - `unresolvedOffboardingIssues`
  - `policyCompletionPercentage`
- Compliance evaluation now treats `metadata.findingOutcome === "fail"` as non-compliant.
- Compliance evaluation now treats `metadata.findingOutcome === "warning"` as at-risk.

## 5. API Route Work

### `GET /api/dashboard`

Still implemented at `src/app/api/dashboard/route.ts`.

Returns:

- Existing `DashboardSummary` contract fields.
- Total control count.
- Pass, warning, and fail counts.
- Connector statuses.
- Recent evidence.
- Unresolved offboarding issues.
- Policy completion percentage.

### `GET /api/controls`

Still implemented at `src/app/api/controls/route.ts`.

Returns evaluated controls from the demo data store.

### `GET /api/evidence`

Updated `src/app/api/evidence/route.ts`.

Supports optional query parameters:

- `provider`
- `status`
- `controlId`

Invalid `provider` or `status` values return JSON error responses with HTTP 400.

### `GET /api/employees`

Updated `src/app/api/employees/route.ts`.

Returns employee records plus computed `offboardingIssue: boolean`.

### `GET /api/policies`

Updated `src/app/api/policies/route.ts`.

Returns policy templates and acknowledgement completion information.

### `POST /api/policies/:id/acknowledge`

Existing route remains at `src/app/api/policies/[id]/acknowledge/route.ts`.

Behavior:

- Accepts `employeeId`.
- Validates request body.
- Creates or updates a deterministic in-memory acknowledgement.
- Returns 404 if the policy or employee is not found.

### `GET /api/risks`

Still implemented at `src/app/api/risks/route.ts`.

Returns risk assessments from mock data.

### `POST /api/risks`

Still implemented at `src/app/api/risks/route.ts`.

Behavior:

- Validates required fields and likelihood/impact values through `src/server/validation.ts`.
- Creates and stores a new in-memory risk.
- Returns HTTP 201 with the created risk.

### `GET /api/connectors`

Still implemented at `src/app/api/connectors/route.ts`.

Returns connector status and most recent sync information.

### `POST /api/connectors/sync`

Updated `src/app/api/connectors/sync/route.ts`.

Behavior:

- If body includes `connectorId`, syncs that connector and returns one `SyncResult`.
- If body is empty or omits `connectorId`, runs a full demo sync and returns `SyncResult[]`.
- Returns 404 for unknown connector IDs.
- Uses optional JSON parsing so an empty POST body is valid for full sync.

Note: the shared contract still declares this route as returning one `SyncResult`. The full-sync behavior is an additive demo behavior requested after the shared contract was written.

### `GET /api/auditor/export`

Updated `src/app/api/auditor/export/route.ts`.

Behavior:

- Default response returns the documented JSON export manifest.
- `downloadUrl` now points to `/api/auditor/export?format=zip`.
- `?format=zip` returns a real downloadable ZIP response.
- Invalid `format` values return JSON error responses with HTTP 400.

Added `src/server/auditor/export-package.ts`:

- Builds a no-dependency ZIP package.
- Includes `manifest.json`.
- Includes one JSON file per evidence item under `evidence/`.

## 6. Validation And Error Handling

Updated `src/server/api.ts`:

- Existing `json()`, `apiError()`, and `parseJsonObject()` remain.
- Added `parseOptionalJsonObject()` for routes that can accept an empty JSON body.
- JSON errors use the shared `{ error: { code, message, details? } }` shape.
- Stack traces are not exposed.

Updated `src/server/validation.ts`:

- Existing provider, acknowledgement, sync, and risk validators remain.
- Added `parseEvidenceStatusFilter()` for `GET /api/evidence?status=...`.
- Invalid inputs return suitable HTTP 400 JSON errors.

## 7. Tests Updated

Updated `tests/server/connectors.test.ts`:

- Verifies one connector per provider.
- Verifies mock connection testing and deterministic sync behavior.
- Verifies all evidence is provider-scoped and normalized with `mockMode`.
- Verifies AWS database encryption and IAM MFA pass/fail findings.
- Verifies Azure encryption and Entra ID MFA pass/warning findings.
- Verifies GitHub branch protection and PR review findings, including an inadequate repository.
- Verifies Gusto employee identity, employment, and onboarding evidence fields.
- Verifies Rippling termination timestamp and background-check evidence fields.
- Verifies registry lookup by connector ID.

Updated `tests/server/compliance.test.ts`:

- Adjusted control status expectations after failing adapter findings were introduced.
- Added assertions for the expanded dashboard summary fields:
  - total/pass/warning/fail counts
  - policy completion percentage
  - unresolved offboarding issues
  - recent evidence
  - connector status timestamps

Important: the tests are still not runnable through npm because `package.json` has no `test` script. They are covered by TypeScript compilation.

## 8. Verification Run

Commands run after the final API changes:

- `npm.cmd run lint`
  - Passed.
- `npm.cmd run typecheck`
  - Passed.
- `npm.cmd run build`
  - Passed.
- `npm.cmd run test`
  - Failed because `package.json` has no `test` script.

The final `next build` successfully compiled all API routes:

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

## 9. Current Git State Notes

At the time this handoff was written, the worktree still contained the broad untracked backend/data-layer files from `HANDOFF1.md`.

Observed `git status --short` included:

- Modified:
  - `package-lock.json`
  - `package.json`
- Untracked:
  - `docs/handoff documents/`
  - `prisma/`
  - `src/app/api/`
  - `src/server/api.ts`
  - `src/server/auditor/`
  - `src/server/compliance/`
  - `src/server/connectors/`
  - `src/server/mock-data.ts`
  - `src/server/repositories/`
  - `src/server/validation.ts`
  - `tests/server/compliance.test.ts`
  - `tests/server/connectors.test.ts`

Because most backend files are still untracked, normal `git diff` does not show the full content-level changes made in this pass.

## 10. Known Caveats And Follow-Ups

1. `package.json` still has no `test` script.
   - `npm.cmd run test` fails with `Missing script: "test"`.
   - Next recommended work is still to add a TS-aware test runner for `tests/server/**/*.test.ts`.

2. API responses are mock/in-memory backed, not Prisma-backed.
   - This preserves deterministic MVP behavior.
   - Newly acknowledged policies and newly created risks persist only for the running server process.

3. Some route responses are supersets of the current shared contract.
   - This includes dashboard summary additions, employee `offboardingIssue`, policy completion fields, and full-sync response arrays.
   - The shared contract file was intentionally not changed because it is listed as a shared ownership file.

4. The full-sync route behavior is additive.
   - `POST /api/connectors/sync` with `connectorId` still returns a single `SyncResult`.
   - Empty body or missing `connectorId` returns `SyncResult[]`.

5. The auditor ZIP builder is intentionally minimal.
   - It creates a valid stored ZIP without external dependencies.
   - It contains JSON evidence files, not binary screenshots or PDFs.

6. No live provider integrations exist.
   - All AWS, Azure, GitHub, Gusto, and Rippling behavior is deterministic mock mode.
   - No secrets were added.

## 11. Recommended Next Action

Add an npm test script and runner for the existing `node:test` TypeScript files, then add route-level tests for:

- Evidence query filters.
- Empty-body full connector sync.
- Single connector sync.
- Policy acknowledgement create/update.
- Risk creation validation.
- Auditor export JSON and ZIP responses.
