import type {
  ConnectorSyncStatus,
  ControlStatus,
  EvidenceStatus,
  OffboardingIssueStatus,
  RiskSeverity,
  RiskStatus,
} from "@/lib/contracts";

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

const CONTROL_STATUS_LABELS: Record<ControlStatus, string> = {
  compliant: "Compliant",
  at_risk: "At Risk",
  non_compliant: "Non-Compliant",
  not_applicable: "Not Applicable",
};

const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  valid: "Valid",
  expiring: "Expiring Soon",
  expired: "Expired",
};

const RISK_SEVERITY_LABELS: Record<RiskSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  open: "Open",
  mitigated: "Mitigated",
  accepted: "Accepted",
  closed: "Closed",
};

const OFFBOARDING_ISSUE_STATUS_LABELS: Record<OffboardingIssueStatus, string> = {
  open: "Open",
  resolved: "Resolved",
};

const CONNECTOR_SYNC_STATUS_LABELS: Record<ConnectorSyncStatus, string> = {
  idle: "Idle",
  syncing: "Syncing",
  success: "Synced",
  error: "Sync Failed",
};

export function controlStatusLabel(status: ControlStatus): string {
  return CONTROL_STATUS_LABELS[status];
}

export function evidenceStatusLabel(status: EvidenceStatus): string {
  return EVIDENCE_STATUS_LABELS[status];
}

export function riskSeverityLabel(severity: RiskSeverity): string {
  return RISK_SEVERITY_LABELS[severity];
}

export function riskStatusLabel(status: RiskStatus): string {
  return RISK_STATUS_LABELS[status];
}

export function offboardingIssueStatusLabel(status: OffboardingIssueStatus): string {
  return OFFBOARDING_ISSUE_STATUS_LABELS[status];
}

export function connectorSyncStatusLabel(status: ConnectorSyncStatus): string {
  return CONNECTOR_SYNC_STATUS_LABELS[status];
}

export type BadgeTone = "green" | "yellow" | "red" | "gray";

export function controlStatusTone(status: ControlStatus): BadgeTone {
  switch (status) {
    case "compliant":
      return "green";
    case "at_risk":
      return "yellow";
    case "non_compliant":
      return "red";
    case "not_applicable":
      return "gray";
  }
}

export function evidenceStatusTone(status: EvidenceStatus): BadgeTone {
  switch (status) {
    case "valid":
      return "green";
    case "expiring":
      return "yellow";
    case "expired":
      return "red";
  }
}

export function riskSeverityTone(severity: RiskSeverity): BadgeTone {
  switch (severity) {
    case "low":
      return "gray";
    case "medium":
      return "yellow";
    case "high":
      return "red";
    case "critical":
      return "red";
  }
}

export function riskStatusTone(status: RiskStatus): BadgeTone {
  switch (status) {
    case "open":
      return "yellow";
    case "mitigated":
      return "green";
    case "accepted":
      return "gray";
    case "closed":
      return "green";
  }
}

export function offboardingIssueStatusTone(status: OffboardingIssueStatus): BadgeTone {
  return status === "open" ? "red" : "green";
}

export function connectorSyncStatusTone(status: ConnectorSyncStatus): BadgeTone {
  switch (status) {
    case "idle":
      return "gray";
    case "syncing":
      return "yellow";
    case "success":
      return "green";
    case "error":
      return "red";
  }
}
