# Shared MVP API Contract

Status: **draft** - proposed by the frontend (Claude Code) branch, reviewed by the backend (Codex) branch.

This document is the human-readable companion to the authoritative TypeScript types in [`src/lib/contracts/index.ts`](../src/lib/contracts/index.ts). If the two disagree, the TypeScript file wins and this doc should be updated to match.

Per [`docs/MVP_SCOPE.md`](MVP_SCOPE.md), this app is a demonstration aid. It is not an auditor, SOC 2 attestation, legal opinion, or official compliance determination. All external integrations (AWS, Azure, GitHub, Gusto, Rippling) must run in deterministic mock mode - no real credentials, no live calls.

## Routes

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| GET | `/api/dashboard` | - | `DashboardSummary` |
| GET | `/api/controls` | - | `Control[]` |
| GET | `/api/evidence` | query: `controlId?`, `provider?`, `status?` | `Evidence[]` |
| GET | `/api/employees` | - | `Employee[]` |
| GET | `/api/policies` | - | `Policy[]` |
| POST | `/api/policies/:id/acknowledge` | body: `AcknowledgePolicyRequest` | `PolicyAcknowledgement` |
| GET | `/api/risks` | - | `Risk[]` |
| POST | `/api/risks` | body: `CreateRiskRequest` | `Risk` |
| GET | `/api/connectors` | - | `Connector[]` |
| POST | `/api/connectors/sync` | body: `SyncConnectorRequest` or empty body | `SyncResult` or `SyncResult[]` |
| GET | `/api/auditor/export` | - | ZIP download |

All request/response type names refer to interfaces exported from `src/lib/contracts/index.ts`.

On failure, every route responds with a non-2xx status and an `ApiErrorBody`:

```json
{ "error": { "code": "string", "message": "string", "details": "optional" } }
```

## Enums / Status Values

- **`ControlStatus`**: `pass`, `warning`, `fail`
- **`ConnectorProvider`**: `aws`, `azure`, `github`, `gusto`, `rippling`
- **`EvidenceStatus`**: `valid`, `expiring`, `expired`
- **`EmployeeStatus`**: `active`, `offboarding`, `offboarded`
- **`OffboardingIssueType`**: `access_not_revoked`, `device_not_returned`, `account_still_active`, `other`
- **`RiskSeverity`**: `low`, `medium`, `high`, `critical`
- **`RiskStatus`**: `open`, `mitigated`, `accepted`, `closed`
- **`ConnectorConnectionStatus`**: `connected`, `disconnected`
- **`ConnectorLastSyncStatus`**: `never_run`, `running`, `success`, `error`
- **`SyncResultStatus`**: `running`, `success`, `error`

## Dashboard Response

`GET /api/dashboard` returns:

```ts
{
  generatedAt: string;
  lastDataRefreshAt?: string;
  overallCompliancePercent: number;
  controlCounts: {
    total: number;
    pass: number;
    warning: number;
    fail: number;
  };
  openRiskCount: number;
  openOffboardingIssueCount: number;
  policyMetrics: {
    completionPercentage: number;
    employeesWithPendingPolicies: number;
    totalMissingAcknowledgements: number;
  };
  connectors: Array<{
    id: string;
    provider: ConnectorProvider;
    displayName: string;
    connectionStatus: "connected" | "disconnected";
    lastSyncStatus: "never_run" | "running" | "success" | "error";
    lastSyncedAt: string | null;
    lastError: string | null;
  }>;
  recentEvidence: Evidence[];
  unresolvedOffboardingIssues: OffboardingIssue[];
}
```

`generatedAt` is the timestamp for the dashboard response. `lastDataRefreshAt` is the latest completed demo sync timestamp and is the field the frontend can use to show that a run completed. `controlCounts.total` must equal `controlCounts.pass + controlCounts.warning + controlCounts.fail`.

The MVP has eight controls. This agrees across deterministic mock API data, Prisma seed data, shared TypeScript types, backend tests, and this document.

## Entity Notes

- **`Control`** uses the normalized `pass | warning | fail` status vocabulary.
- **`Connector`** separates provider reachability (`connectionStatus`) from latest sync outcome (`lastSyncStatus`). A connector can be connected while its latest sync has failed.
- **Rippling** is connected in mock mode, but its latest sync is `error` because the deterministic mock data includes an unresolved offboarding checklist issue. It must not simultaneously report the same latest sync as both `success` and `error`.
- **`DashboardSummary.connectors`** is the single dashboard connector summary. There is no separate `connectorStatuses` duplicate.
- **`DashboardSummary.controlCounts`** is the single dashboard control aggregate. There are no separate `passCount`, `warningCount`, `failCount`, or `controlCountsByStatus` duplicates.
- **`DashboardSummary.policyMetrics`** reports completion percentage, unique active employees with pending required policy acknowledgements, and total missing required acknowledgements.

## Mock Data Expectations

- All data returned by these routes must be deterministic mock data - no real cloud credentials or live third-party calls.
- `POST /api/connectors/sync` simulates syncs and returns deterministic mock `SyncResult` objects.
- Each demo sync uses the current server time for its execution timestamp unless a test injects a clock at the server helper layer. It updates connector `lastSyncedAt`, connector `lastSyncStatus`, provider evidence `collectedAt`, sync-run history, and dashboard `lastDataRefreshAt`.
- IDs are stable strings so the UI can link related entities.
- Timestamps are ISO 8601 strings using fixed mock dates where practical.
- `GET /api/auditor/export` generates a deterministic ZIP archive from mock data.

## Ownership

This file and `src/lib/contracts/index.ts` are shared files per [`docs/BRANCH_OWNERSHIP.md`](BRANCH_OWNERSHIP.md). Coordinate before changing them.
