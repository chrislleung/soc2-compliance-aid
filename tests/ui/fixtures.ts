import type {
  Connector,
  Control,
  DashboardSummary,
  Employee,
  Evidence,
  OffboardingIssue,
  Policy,
  Risk,
} from "@/lib/contracts";

export function makePolicy(overrides: Partial<Policy> = {}): Policy {
  return {
    id: "p1",
    name: "Policy",
    version: "1",
    description: "d",
    requiresAcknowledgement: true,
    acknowledgedCount: 0,
    totalEmployeeCount: 0,
    currentUserAcknowledgement: "pending",
    ...overrides,
  };
}

export function makeControl(overrides: Partial<Control> = {}): Control {
  return {
    id: "c1",
    name: "Control",
    description: "d",
    category: "Security",
    status: "compliant",
    lastEvaluatedAt: "2026-01-01T00:00:00.000Z",
    relatedEvidenceIds: [],
    ...overrides,
  };
}

export function makeEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: "e1",
    provider: "aws",
    controlIds: [],
    title: "Evidence",
    description: "d",
    status: "valid",
    collectedAt: "2026-01-01T00:00:00.000Z",
    expiresAt: null,
    metadata: {},
    ...overrides,
  };
}

export function makeOffboardingIssue(overrides: Partial<OffboardingIssue> = {}): OffboardingIssue {
  return {
    id: "i1",
    employeeId: "e1",
    issueType: "access_not_revoked",
    system: "AWS",
    detectedAt: "2026-01-01T00:00:00.000Z",
    resolvedAt: null,
    status: "open",
    ...overrides,
  };
}

export function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "e1",
    name: "Employee",
    email: "employee@example.com",
    source: "gusto",
    status: "active",
    startDate: "2025-01-01T00:00:00.000Z",
    terminationDate: null,
    offboardingIssues: [],
    ...overrides,
  };
}

export function makeConnector(overrides: Partial<Connector> = {}): Connector {
  return {
    id: "conn1",
    provider: "aws",
    displayName: "AWS",
    status: "success",
    lastSyncedAt: "2026-01-01T00:00:00.000Z",
    lastSyncResult: null,
    ...overrides,
  };
}

export function makeRisk(overrides: Partial<Risk> = {}): Risk {
  return {
    id: "r1",
    title: "Risk",
    description: "d",
    category: "General",
    likelihood: 3,
    impact: 3,
    status: "open",
    owner: "Owner",
    mitigationPlan: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeDashboardSummary(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return {
    generatedAt: "2026-01-01T00:00:00.000Z",
    overallCompliancePercent: 80,
    controlCountsByStatus: { compliant: 5, at_risk: 2, non_compliant: 1, not_applicable: 0 },
    openRiskCount: 3,
    openOffboardingIssueCount: 1,
    pendingPolicyAcknowledgementCount: 2,
    connectors: [
      makeConnector({ id: "aws", provider: "aws", displayName: "AWS" }),
      makeConnector({ id: "azure", provider: "azure", displayName: "Azure" }),
      makeConnector({ id: "github", provider: "github", displayName: "GitHub" }),
      makeConnector({ id: "gusto", provider: "gusto", displayName: "Gusto" }),
      makeConnector({ id: "rippling", provider: "rippling", displayName: "Rippling" }),
    ],
    ...overrides,
  };
}
