# Shared MVP API Contract

Status: **draft** — proposed by the frontend (Claude Code) branch, pending
review by the backend (Codex) branch. Change this file and
`src/lib/contracts/index.ts` together; do not fork them.

This document is the human-readable companion to the authoritative
TypeScript types in [`src/lib/contracts/index.ts`](../src/lib/contracts/index.ts).
If the two disagree, the TypeScript file wins and this doc should be
updated to match.

Per [`docs/MVP_SCOPE.md`](MVP_SCOPE.md), this app is a demonstration aid.
It is not an auditor, SOC 2 attestation, legal opinion, or official
compliance determination. All external integrations (AWS, Azure, GitHub,
Gusto, Rippling) must run in deterministic mock mode — no real credentials,
no live calls.

## Routes

| Method | Path                            | Request                        | Response               |
|--------|----------------------------------|---------------------------------|-------------------------|
| GET    | `/api/dashboard`                 | —                                | `DashboardSummary`      |
| GET    | `/api/controls`                  | —                                | `Control[]`             |
| GET    | `/api/evidence`                  | query: `controlId?`, `provider?` | `Evidence[]`            |
| GET    | `/api/employees`                 | —                                | `Employee[]`            |
| GET    | `/api/policies`                  | —                                | `Policy[]`              |
| POST   | `/api/policies/:id/acknowledge`  | body: `AcknowledgePolicyRequest` | `PolicyAcknowledgement` |
| GET    | `/api/risks`                     | —                                | `Risk[]`                |
| POST   | `/api/risks`                     | body: `CreateRiskRequest`       | `Risk`                  |
| GET    | `/api/connectors`                | —                                | `Connector[]`           |
| POST   | `/api/connectors/sync`           | body: `SyncConnectorRequest`    | `SyncResult`             |
| GET    | `/api/auditor/export`            | —                                | `AuditorExportResponse` |

All request/response type names refer to interfaces exported from
`src/lib/contracts/index.ts`.

On failure, every route responds with a non-2xx status and an `ApiErrorBody`:

```json
{ "error": { "code": "string", "message": "string", "details": "optional" } }
```

## Enums / status values

- **`ControlStatus`**: `compliant` · `at_risk` · `non_compliant` · `not_applicable`
- **`ConnectorProvider`**: `aws` · `azure` · `github` · `gusto` · `rippling`
- **`EvidenceStatus`**: `valid` · `expiring` · `expired`
- **`EmployeeStatus`**: `active` · `offboarding` · `offboarded`
- **`OffboardingIssueType`**: `access_not_revoked` · `device_not_returned` · `account_still_active` · `other`
- **`RiskSeverity`**: `low` · `medium` · `high` · `critical` (derived from likelihood × impact)
- **`RiskStatus`**: `open` · `mitigated` · `accepted` · `closed`
- **`ConnectorSyncStatus`**: `idle` · `syncing` · `success` · `error`

## Entity shapes

Summarized here; see the TypeScript file for exact field types.

- **`DashboardSummary`** — overall compliance percentage, control counts by
  status, open risk / offboarding-issue / pending-acknowledgement counts,
  and current connector states. Backs the compliance dashboard page.
- **`Control`** — a single SOC 2 control with its current status and the
  evidence IDs backing that status.
- **`Evidence`** — one mock evidence item collected from a provider
  (AWS, Azure, GitHub, Gusto, Rippling), linked to one or more controls.
- **`Employee`** — an employee record from Gusto or Rippling, including
  any open offboarding issues (e.g. access not revoked after termination).
- **`Policy`** — a company policy with acknowledgement tracking (count of
  employees who have acknowledged it, and whether the current viewer has).
- **`Risk`** — a risk assessment entry: likelihood, impact, derived
  severity, status, owner, and optional mitigation plan.
- **`Connector`** — the sync state of one mock integration (AWS/Azure/
  GitHub/Gusto/Rippling), including its most recent `SyncResult`.
- **`AuditorExportResponse`** — a downloadable evidence package: a
  manifest of included evidence plus a `downloadUrl` for the packaged
  file. Backs the read-only auditor portal's export feature.

## Mock-data expectations

- All data returned by these routes must be deterministic mock data —
  no real cloud credentials or live third-party calls, per
  [`docs/MVP_SCOPE.md`](MVP_SCOPE.md) and the root project instructions.
  `POST /api/connectors/sync` simulates a sync and returns a mock
  `SyncResult`; it must not attempt any real network call to a provider.
- IDs should be stable strings (not regenerated per request) so the UI
  can link related entities (e.g. `Evidence.controlIds` →
  `Control.id`) reliably across page loads.
- Timestamps are ISO 8601 strings. Mock data may use fixed/seeded dates
  so demo screenshots and tests are reproducible.
- `GET /api/auditor/export` may point `downloadUrl` at a static mock
  file/route rather than generating a real archive, as long as the
  manifest accurately lists the mock evidence it represents.

## Ownership

This file and `src/lib/contracts/index.ts` are shared files per
[`docs/BRANCH_OWNERSHIP.md`](BRANCH_OWNERSHIP.md). Coordinate before
changing them — do not fork the contract between branches.
