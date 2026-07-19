/**
 * Shared MVP API contract.
 *
 * This file is the single source of truth for API route shapes shared
 * between the frontend (feat/claude-frontend-portal) and backend
 * (feat/codex-compliance-backend) branches. See docs/MVP_CONTRACT.md
 * for the human-readable version of this contract.
 *
 * This is a demonstration aid, not an auditor, SOC 2 attestation, or
 * official compliance determination.
 */

// ---------------------------------------------------------------------------
// Enums / literal unions
// ---------------------------------------------------------------------------

export type ControlStatus = "pass" | "warning" | "fail";

export type ConnectorProvider = "aws" | "azure" | "github" | "gusto" | "rippling";

export type EvidenceStatus = "valid" | "expiring" | "expired";

export type EmployeeSource = "gusto" | "rippling";

export type EmployeeStatus = "active" | "offboarding" | "offboarded";

export type OffboardingIssueType =
  | "access_not_revoked"
  | "device_not_returned"
  | "account_still_active"
  | "other";

export type OffboardingIssueStatus = "open" | "resolved";

export type PolicyAcknowledgementStatus = "acknowledged" | "pending";

export type RiskLikelihood = "low" | "medium" | "high";

export type RiskImpact = "low" | "medium" | "high";

export type RiskSeverity = "low" | "medium" | "high" | "critical";

export type RiskStatus = "open" | "mitigated" | "accepted" | "closed";

export type ConnectorConnectionStatus = "connected" | "disconnected";

export type ConnectorLastSyncStatus = "never_run" | "running" | "success" | "error";

export type SyncResultStatus = "running" | "success" | "error";

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

export interface Control {
  id: string;
  name: string;
  description: string;
  category: string;
  status: ControlStatus;
  lastEvaluatedAt: string; // ISO 8601
  relatedEvidenceIds: string[];
}

export interface Evidence {
  id: string;
  provider: ConnectorProvider;
  controlIds: string[];
  title: string;
  description: string;
  status: EvidenceStatus;
  collectedAt: string; // ISO 8601
  expiresAt: string | null; // ISO 8601
  metadata: Record<string, string | number | boolean>;
}

export interface OffboardingIssue {
  id: string;
  employeeId: string;
  issueType: OffboardingIssueType;
  system: string;
  detectedAt: string; // ISO 8601
  resolvedAt: string | null; // ISO 8601
  status: OffboardingIssueStatus;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  source: EmployeeSource;
  status: EmployeeStatus;
  startDate: string; // ISO 8601
  terminationDate: string | null; // ISO 8601
  offboardingIssues: OffboardingIssue[];
}

export interface PolicyAcknowledgement {
  policyId: string;
  employeeId: string;
  acknowledgedAt: string; // ISO 8601
}

export interface Policy {
  id: string;
  name: string;
  version: string;
  description: string;
  requiresAcknowledgement: boolean;
  acknowledgedCount: number;
  totalEmployeeCount: number;
  currentUserAcknowledgement: PolicyAcknowledgementStatus;
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: string;
  likelihood: RiskLikelihood;
  impact: RiskImpact;
  severity: RiskSeverity;
  status: RiskStatus;
  owner: string;
  mitigationPlan: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface Connector {
  id: string;
  provider: ConnectorProvider;
  displayName: string;
  connectionStatus: ConnectorConnectionStatus;
  lastSyncStatus: ConnectorLastSyncStatus;
  lastSyncedAt: string | null; // ISO 8601
  lastError: string | null;
  lastSyncResult: SyncResult | null;
}

export interface SyncResult {
  connectorId: string;
  provider: ConnectorProvider;
  status: SyncResultStatus;
  startedAt: string; // ISO 8601
  finishedAt: string | null; // ISO 8601
  recordsProcessed: number;
  errors: string[];
}

export interface DashboardControlCounts {
  total: number;
  pass: number;
  warning: number;
  fail: number;
}

export interface DashboardPolicyMetrics {
  completionPercentage: number;
  employeesWithPendingPolicies: number;
  totalMissingAcknowledgements: number;
}

export interface DashboardConnectorSummary {
  id: string;
  provider: ConnectorProvider;
  displayName: string;
  connectionStatus: ConnectorConnectionStatus;
  lastSyncStatus: ConnectorLastSyncStatus;
  lastSyncedAt: string | null; // ISO 8601
  lastError: string | null;
}

export interface DashboardSummary {
  generatedAt: string; // ISO 8601
  lastDataRefreshAt?: string; // ISO 8601
  overallCompliancePercent: number;
  controlCounts: DashboardControlCounts;
  openRiskCount: number;
  openOffboardingIssueCount: number;
  policyMetrics: DashboardPolicyMetrics;
  connectors: DashboardConnectorSummary[];
  recentEvidence: Evidence[];
  unresolvedOffboardingIssues: OffboardingIssue[];
}

// ---------------------------------------------------------------------------
// Request bodies
// ---------------------------------------------------------------------------

export interface AcknowledgePolicyRequest {
  employeeId: string;
}

export interface CreateRiskRequest {
  title: string;
  description: string;
  category: string;
  likelihood: RiskLikelihood;
  impact: RiskImpact;
  owner: string;
  mitigationPlan?: string;
}

export interface SyncConnectorRequest {
  connectorId: string;
}

// ---------------------------------------------------------------------------
// Auditor export
// ---------------------------------------------------------------------------

export interface AuditorExportManifestEntry {
  evidenceId: string;
  controlIds: string[];
  title: string;
  provider: ConnectorProvider;
  collectedAt: string; // ISO 8601
}

export interface AuditorExportResponse {
  generatedAt: string; // ISO 8601
  format: "zip";
  downloadUrl: string;
  manifest: AuditorExportManifestEntry[];
}

// ---------------------------------------------------------------------------
// Error shape
// ---------------------------------------------------------------------------

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ---------------------------------------------------------------------------
// Route map
//
// Maps each agreed route to its request and response shapes. Consumed by
// src/lib/client/** on the frontend; implemented under src/app/api/** on
// the backend. Not executable — a compile-time reference only.
// ---------------------------------------------------------------------------

export interface ApiRouteMap {
  "GET /api/dashboard": {
    response: DashboardSummary;
  };
  "GET /api/controls": {
    response: Control[];
  };
  "GET /api/evidence": {
    query?: { controlId?: string; provider?: ConnectorProvider };
    response: Evidence[];
  };
  "GET /api/employees": {
    response: Employee[];
  };
  "GET /api/policies": {
    response: Policy[];
  };
  "POST /api/policies/:id/acknowledge": {
    params: { id: string };
    body: AcknowledgePolicyRequest;
    response: PolicyAcknowledgement;
  };
  "GET /api/risks": {
    response: Risk[];
  };
  "POST /api/risks": {
    body: CreateRiskRequest;
    response: Risk;
  };
  "GET /api/connectors": {
    response: Connector[];
  };
  "POST /api/connectors/sync": {
    body: SyncConnectorRequest;
    response: SyncResult;
  };
  "GET /api/auditor/export": {
    response: Blob;
  };
}
