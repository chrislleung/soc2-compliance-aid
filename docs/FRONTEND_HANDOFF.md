# Frontend Handoff

Status of the `feat/claude-frontend-portal` branch's frontend work, for
whoever picks up the backend (`feat/codex-compliance-backend`) or
continues the frontend. This is a one-day demonstration aid — see
[`docs/MVP_SCOPE.md`](MVP_SCOPE.md) and [`docs/MVP_CONTRACT.md`](MVP_CONTRACT.md).

## Pages created

All under `src/app/`, each with its own `page.tsx`, `loading.tsx`, and
`error.tsx`:

| Route | Purpose |
|---|---|
| `/` | Landing page with cards linking to each section |
| `/dashboard` | Control totals (total/passing/warning/failing), policy completion, offboarding issues, per-provider connector status, controls requiring attention, recent evidence, "Run demo sync" |
| `/evidence` | Evidence list with provider/status filters, free-text search, and an expandable per-item metadata detail view |
| `/employees` | Employee list with active/terminated/has-issues filters, an unresolved-offboarding-issues summary, and a "Terminated — Retains Access" flag |
| `/policies` | Policy templates with acknowledgement tracking, a demo-employee selector, and an expandable summary per policy |
| `/risks` | Risk log (likelihood/impact/score/status/mitigation) plus a create-risk form with client-side validation |
| `/auditor` | Read-only compliance snapshot (control/evidence/policy/risk/offboarding/connector summary) with an evidence-package download |

Root `layout.tsx` wraps every page with `NavBar` (responsive, with a
mobile hamburger menu) and a persistent `DisclaimerBanner`.

## Components created

`src/components/`:

- **Layout/shared**: `NavBar`, `DisclaimerBanner`, `PageHeader`
- **Status display**: `StatusBadge` (icon + text, never color-only), `SummaryCard`, `CompletionProgress`, `ConnectorCard`
- **Tables**: `ControlTable`, `EvidenceTable` (both render as a real `<table>` on `md+` screens and a stacked card list below that)
- **State**: `LoadingState`, `LoadingSkeleton` (`cards`/`rows` variants), `ErrorState`, `EmptyState`
- **Forms/actions**: `RiskForm`, `PolicyCard`, `AcknowledgeButton`, `EmployeeSelector`, `ConnectorSyncButton`, `AuditorExportButton`

Client-side logic lives in `src/lib/client/`:

- `api.ts` — one typed function per contract route
- `http.ts` — centralized fetch wrapper; throws `ApiRequestError` (with `code`/`message`/`status`) on any non-2xx response
- `useApiResource.ts` — shared `{data, loading, error, refetch}` hook used by every page
- `format.ts` — display label/tone/date formatting, no business logic
- `derive.ts` — pure, tested functions that filter/sort/aggregate already-backend-computed fields for display (e.g. `policyCompletionPercent`, `riskScore`, `controlsRequiringAttention`) — see "Assumptions" below for where this touches contract gaps

## API endpoints consumed

Per [`docs/MVP_CONTRACT.md`](MVP_CONTRACT.md):

```
GET  /api/dashboard
GET  /api/controls
GET  /api/evidence          (query: controlId?, provider? — currently unused; filtering is done client-side)
GET  /api/employees
GET  /api/policies
POST /api/policies/:id/acknowledge
GET  /api/risks
POST /api/risks
GET  /api/connectors
POST /api/connectors/sync
GET  /api/auditor/export
```

**None of these routes are implemented yet** — only the shared contract
(`src/lib/contracts/index.ts` + `docs/MVP_CONTRACT.md`) has been merged
from the backend branch as of this handoff. Every page will show its
`ErrorState` against a real dev server until the routes exist.

## Test commands

```
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest run — unit + component tests, mocked fetch, no backend needed
npm run build       # next build
npm run dev         # manual verification in a browser
```

Test infrastructure: Vitest + `@testing-library/react` + `jsdom` (added
this session — see `vitest.config.ts` and `tests/ui/setupTests.ts`).
`next/navigation` is mocked globally in the setup file since components
render outside a real Next.js router in tests. `tests/ui/testUtils.ts`
provides `mockApi()` (routes a stubbed `fetch` by pathname) and
`deferred()` (for asserting mid-flight UI state like disabled buttons).
`tests/ui/fixtures.ts` has one factory per contract entity.

63 tests across 11 files: `format`, `http`, `api`, `derive` (pure-logic
unit tests) and `dashboard`, `evidence`, `employees`, `policies`,
`risks`, `auditor`, `accessibility` (component tests).

## Known limitations

- **Backend doesn't exist yet.** Everything here is verified against
  mocked `fetch` responses in tests, plus manual checks that pages
  render their loading/error shells correctly against a real (routeless)
  dev server. Nothing has been checked against real mock data shapes
  from the backend.
- **No auth.** The Policies page's "Acknowledging as" selector and the
  Risk form's owner field are free-form stand-ins for a real identity
  system, per `docs/MVP_SCOPE.md`'s "Not Included: Production
  authentication."
- **Per-provider access status on the Employees page is best-effort.**
  It matches each employee's *open* `offboardingIssues` against a
  provider name by substring, case-insensitively, on the issue's
  free-text `system` field. A cell showing "No Issues Flagged" means no
  matching open issue was found — it is **not** a claim that access was
  actually revoked or is currently active. See the code comment in
  `src/lib/client/derive.ts` (`openIssuesForSystem`).
- **Risk score is frontend-only.** It's `likelihood * impact` (both
  1–5), computed and displayed client-side; the backend does not need
  to compute, store, or return it. It's explicitly labeled in the UI as
  a sorting heuristic, not an official SOC 2 methodology.
- **Auditor export filename is best-effort.** `filenameFromUrl()`
  derives a filename from the last path segment of `downloadUrl`; if
  that's not parseable, the UI falls back to `evidence-package.zip`.
- **Risk category.** The contract still requires `category` on every
  risk, but the create-risk form (matching the requested field list)
  doesn't collect it — it submits a fixed `"General"` value.

## Assumptions about backend responses / contract changes made this session

- **Risk scoring required a contract change** (coordinated, reflected in
  `src/lib/contracts/index.ts` and `docs/MVP_CONTRACT.md`):
  `RiskLikelihood`/`RiskImpact` moved from `"low"|"medium"|"high"` to a
  numeric `1|2|3|4|5` scale, the derived `RiskSeverity`/`Risk.severity`
  field was removed, and `CreateRiskRequest` gained a required `status`
  field. **The backend's `GET`/`POST /api/risks` implementation needs to
  match this shape**, not the original enum-based one.
- All list-returning routes are assumed to return **arrays directly**
  (not wrapped in a `{data: [...]}` envelope) — matches `ApiRouteMap` in
  the contract.
- All timestamps are assumed to be ISO 8601 strings; `formatDate` treats
  anything else as unparseable and renders "—".
- `GET /api/evidence`'s `controlId`/`provider` query params are defined
  in the contract but currently unused by the frontend (filtering moved
  client-side for consistency with status filtering, which has no query
  param). The backend can still support them for other consumers.
- `Policy.currentUserAcknowledgement` is assumed to reflect some
  backend-determined "current viewer" concept independent of the
  frontend's own employee selector — there's no way for the frontend to
  tell the backend which employee it means when fetching `GET
  /api/policies`. This was flagged in an earlier session; no contract
  change was made for it since the frontend doesn't rely on the two
  concepts matching (the selector only supplies `employeeId` for the
  acknowledge POST itself).
