import type {
  Connector,
  ConnectorProvider,
  Control,
  CreateRiskRequest,
  Employee,
  Evidence,
  Policy,
  PolicyAcknowledgement,
  Risk,
  SyncResult,
} from "@/lib/contracts";
import { connectorIdsByProvider, listRegisteredConnectors } from "@/server/connectors/registry";
import {
  syncAllConnectors as syncRegisteredConnectors,
  syncConnector as syncRegisteredConnector,
  type SyncExecutionOptions,
} from "@/server/connectors/sync-service";
import type { EvidenceStatusFilter } from "@/server/validation";

export const MOCK_NOW = "2026-07-18T12:00:00.000Z";

export const controls: Control[] = [
  {
    id: "cc-1",
    name: "Logical Access Review",
    description: "Access to production systems is reviewed and exceptions are tracked.",
    category: "Access Control",
    status: "non_compliant",
    lastEvaluatedAt: MOCK_NOW,
    relatedEvidenceIds: [
      "ev-aws-iam-mfa-admins",
      "ev-aws-iam-mfa",
      "ev-azure-entra-mfa-admins",
      "ev-azure-entra-mfa-guests",
      "ev-github-admins",
      "ev-rippling-offboarding",
    ],
  },
  {
    id: "cc-2",
    name: "Change Management",
    description: "Code changes are peer reviewed before deployment.",
    category: "Change Management",
    status: "non_compliant",
    lastEvaluatedAt: MOCK_NOW,
    relatedEvidenceIds: [
      "ev-github-branch-protection-app",
      "ev-github-branch-protection",
      "ev-github-pr-review-app",
      "ev-github-pr-review",
    ],
  },
  {
    id: "cc-3",
    name: "Employee Offboarding",
    description: "Terminated employees are removed from connected business systems.",
    category: "People Operations",
    status: "non_compliant",
    lastEvaluatedAt: MOCK_NOW,
    relatedEvidenceIds: ["ev-gusto-terminations", "ev-rippling-offboarding"],
  },
  {
    id: "cc-4",
    name: "Security Policy Acknowledgement",
    description: "Employees acknowledge current security policies.",
    category: "Governance",
    status: "at_risk",
    lastEvaluatedAt: MOCK_NOW,
    relatedEvidenceIds: ["ev-policy-ack-summary"],
  },
  {
    id: "cc-5",
    name: "Cloud Logging",
    description: "Cloud activity logging is enabled for production accounts.",
    category: "Monitoring",
    status: "compliant",
    lastEvaluatedAt: MOCK_NOW,
    relatedEvidenceIds: ["ev-aws-cloudtrail", "ev-azure-activity-log"],
  },
  {
    id: "cc-6",
    name: "Data Encryption",
    description: "Production cloud storage and databases are encrypted at rest.",
    category: "Infrastructure Security",
    status: "non_compliant",
    lastEvaluatedAt: MOCK_NOW,
    relatedEvidenceIds: [
      "ev-aws-db-encryption-orders",
      "ev-aws-db-encryption-analytics",
      "ev-azure-sql-encryption-primary",
      "ev-azure-storage-encryption-logs",
    ],
  },
  {
    id: "cc-7",
    name: "Vendor Risk Review",
    description: "Vendor risk reviews are tracked and refreshed before the audit window.",
    category: "Vendor Management",
    status: "compliant",
    lastEvaluatedAt: MOCK_NOW,
    relatedEvidenceIds: ["ev-vendor-risk-review"],
  },
  {
    id: "cc-8",
    name: "Risk Assessment Review",
    description: "Current risk assessments exist and are available for review.",
    category: "Risk Management",
    status: "compliant",
    lastEvaluatedAt: MOCK_NOW,
    relatedEvidenceIds: ["ev-risk-assessment-current"],
  },
];

export const evidence: Evidence[] = listRegisteredConnectors().flatMap((connectorItem) => connectorItem.collectEvidence());

export const employees: Employee[] = [
  {
    id: "emp-001",
    name: "Avery Chen",
    email: "avery.chen@example.test",
    source: "gusto",
    status: "active",
    startDate: "2024-02-12T00:00:00.000Z",
    terminationDate: null,
    offboardingIssues: [],
  },
  {
    id: "emp-002",
    name: "Jordan Patel",
    email: "jordan.patel@example.test",
    source: "rippling",
    status: "active",
    startDate: "2023-09-18T00:00:00.000Z",
    terminationDate: null,
    offboardingIssues: [],
  },
  {
    id: "emp-003",
    name: "Morgan Rivera",
    email: "morgan.rivera@example.test",
    source: "gusto",
    status: "offboarding",
    startDate: "2022-04-04T00:00:00.000Z",
    terminationDate: "2026-07-15T00:00:00.000Z",
    offboardingIssues: [
      {
        id: "off-001",
        employeeId: "emp-003",
        issueType: "access_not_revoked",
        system: "GitHub",
        detectedAt: "2026-07-16T09:15:00.000Z",
        resolvedAt: null,
        status: "open",
      },
      {
        id: "off-002",
        employeeId: "emp-003",
        issueType: "device_not_returned",
        system: "Laptop inventory",
        detectedAt: "2026-07-16T09:20:00.000Z",
        resolvedAt: null,
        status: "open",
      },
    ],
  },
  {
    id: "emp-004",
    name: "Sam Okafor",
    email: "sam.okafor@example.test",
    source: "rippling",
    status: "offboarded",
    startDate: "2021-11-08T00:00:00.000Z",
    terminationDate: "2026-06-30T00:00:00.000Z",
    offboardingIssues: [
      {
        id: "off-003",
        employeeId: "emp-004",
        issueType: "account_still_active",
        system: "Azure AD",
        detectedAt: "2026-07-01T13:05:00.000Z",
        resolvedAt: "2026-07-01T16:30:00.000Z",
        status: "resolved",
      },
    ],
  },
  {
    id: "emp-005",
    name: "Taylor Brooks",
    email: "taylor.brooks@example.test",
    source: "gusto",
    status: "active",
    startDate: "2025-01-13T00:00:00.000Z",
    terminationDate: null,
    offboardingIssues: [],
  },
];

export const policies: Policy[] = [
  {
    id: "pol-security",
    name: "Information Security Policy",
    version: "2026.2",
    description: "Baseline security responsibilities for employees and contractors.",
    requiresAcknowledgement: true,
    acknowledgedCount: 4,
    totalEmployeeCount: employees.length,
    currentUserAcknowledgement: "acknowledged",
  },
  {
    id: "pol-access",
    name: "Access Control Policy",
    version: "2026.1",
    description: "Access request, review, and removal expectations for production systems.",
    requiresAcknowledgement: true,
    acknowledgedCount: 3,
    totalEmployeeCount: employees.length,
    currentUserAcknowledgement: "pending",
  },
  {
    id: "pol-vendor",
    name: "Vendor Risk Policy",
    version: "2025.4",
    description: "Guidance for onboarding and reviewing service providers.",
    requiresAcknowledgement: false,
    acknowledgedCount: 5,
    totalEmployeeCount: employees.length,
    currentUserAcknowledgement: "acknowledged",
  },
];

export const policyAcknowledgements: PolicyAcknowledgement[] = [
  { policyId: "pol-security", employeeId: "emp-001", acknowledgedAt: "2026-07-01T14:00:00.000Z" },
  { policyId: "pol-security", employeeId: "emp-002", acknowledgedAt: "2026-07-02T15:00:00.000Z" },
  { policyId: "pol-security", employeeId: "emp-003", acknowledgedAt: "2026-06-15T09:00:00.000Z" },
  { policyId: "pol-security", employeeId: "emp-004", acknowledgedAt: "2026-06-01T09:00:00.000Z" },
  { policyId: "pol-access", employeeId: "emp-001", acknowledgedAt: "2026-07-01T14:05:00.000Z" },
  { policyId: "pol-access", employeeId: "emp-002", acknowledgedAt: "2026-07-02T15:15:00.000Z" },
  { policyId: "pol-access", employeeId: "emp-005", acknowledgedAt: "2026-07-03T16:15:00.000Z" },
  { policyId: "pol-vendor", employeeId: "emp-001", acknowledgedAt: "2026-07-05T12:00:00.000Z" },
  { policyId: "pol-vendor", employeeId: "emp-002", acknowledgedAt: "2026-07-05T12:05:00.000Z" },
  { policyId: "pol-vendor", employeeId: "emp-003", acknowledgedAt: "2026-07-05T12:10:00.000Z" },
  { policyId: "pol-vendor", employeeId: "emp-004", acknowledgedAt: "2026-07-05T12:15:00.000Z" },
  { policyId: "pol-vendor", employeeId: "emp-005", acknowledgedAt: "2026-07-05T12:20:00.000Z" },
];

export const risks: Risk[] = [
  {
    id: "risk-001",
    title: "Delayed production access review",
    description: "Quarterly GitHub administrative access review has one unresolved exception.",
    category: "Access Control",
    likelihood: 3,
    impact: 4,
    status: "open",
    owner: "Security Lead",
    mitigationPlan: "Complete access owner review and document exception approval.",
    createdAt: "2026-07-10T14:00:00.000Z",
    updatedAt: "2026-07-18T09:30:00.000Z",
  },
  {
    id: "risk-002",
    title: "Offboarding checklist delay",
    description: "One terminated employee still has unresolved offboarding tasks.",
    category: "People Operations",
    likelihood: 4,
    impact: 3,
    status: "open",
    owner: "People Ops",
    mitigationPlan: "Confirm access removal and device recovery before auditor walkthrough.",
    createdAt: "2026-07-16T12:00:00.000Z",
    updatedAt: "2026-07-18T09:45:00.000Z",
  },
  {
    id: "risk-003",
    title: "Cloud logging evidence freshness",
    description: "Cloud logging evidence collection cadence was formalized for the demo period.",
    category: "Monitoring",
    likelihood: 2,
    impact: 3,
    status: "mitigated",
    owner: "Platform Engineering",
    mitigationPlan: "Keep weekly mock evidence refresh on the compliance calendar.",
    createdAt: "2026-07-02T16:00:00.000Z",
    updatedAt: "2026-07-18T10:00:00.000Z",
  },
];

const connectorDisplayNames: Record<ConnectorProvider, string> = {
  aws: "AWS",
  azure: "Azure",
  github: "GitHub",
  gusto: "Gusto",
  rippling: "Rippling",
};

export const connectors: Connector[] = listRegisteredConnectors().map((connectorAdapter) =>
  connector(
    connectorIdsByProvider[connectorAdapter.provider],
    connectorAdapter.provider,
    connectorDisplayNames[connectorAdapter.provider],
    connectorAdapter.getLastSyncStatus(),
  ),
);

export const syncRunHistory: SyncResult[] = connectors
  .map((connectorItem) => connectorItem.lastSyncResult)
  .filter((result): result is SyncResult => result !== null);

let lastDataRefreshAt = MOCK_NOW;

export function getLastDataRefreshAt(): string {
  return lastDataRefreshAt;
}

export function getEvidence(filters: { controlId?: string; provider?: ConnectorProvider; status?: EvidenceStatusFilter }): Evidence[] {
  return evidence.filter((item) => {
    const matchesControl = filters.controlId ? item.controlIds.includes(filters.controlId) : true;
    const matchesProvider = filters.provider ? item.provider === filters.provider : true;
    const matchesStatus = filters.status ? evidenceMatchesStatus(item, filters.status) : true;

    return matchesControl && matchesProvider && matchesStatus;
  });
}

export function getEmployeesWithOffboardingIssue() {
  return employees.map((employee) => ({
    ...employee,
    offboardingIssue: employee.offboardingIssues.some((issue) => issue.status === "open"),
  }));
}

export function getPoliciesWithCompletion() {
  return policies.map((policy) => ({
    ...policy,
    pendingAcknowledgementCount: Math.max(policy.totalEmployeeCount - policy.acknowledgedCount, 0),
    completionPercentage: calculateCompletionPercentage(policy.acknowledgedCount, policy.totalEmployeeCount),
  }));
}

export function acknowledgePolicy(policyId: string, employeeId: string): PolicyAcknowledgement | null {
  const policy = policies.find((policyItem) => policyItem.id === policyId);

  if (!policy || !employees.some((employee) => employee.id === employeeId)) {
    return null;
  }

  const acknowledgement = {
    policyId,
    employeeId,
    acknowledgedAt: MOCK_NOW,
  };

  const existingIndex = policyAcknowledgements.findIndex(
    (item) => item.policyId === policyId && item.employeeId === employeeId,
  );

  if (existingIndex >= 0) {
    policyAcknowledgements[existingIndex] = acknowledgement;
  } else {
    policyAcknowledgements.push(acknowledgement);
    policy.acknowledgedCount = Math.min(policy.acknowledgedCount + 1, policy.totalEmployeeCount);
  }

  if (employeeId === employees[0]?.id) {
    policy.currentUserAcknowledgement = "acknowledged";
  }

  return acknowledgement;
}

export function createRisk(request: CreateRiskRequest): Risk {
  const risk: Risk = {
    id: nextRiskId(request.title),
    title: request.title.trim(),
    description: request.description.trim(),
    category: request.category.trim(),
    likelihood: request.likelihood,
    impact: request.impact,
    status: request.status,
    owner: request.owner.trim(),
    mitigationPlan: request.mitigationPlan?.trim() || null,
    createdAt: MOCK_NOW,
    updatedAt: MOCK_NOW,
  };

  risks.push(risk);

  return risk;
}

export function syncConnector(connectorId: string, options: SyncExecutionOptions = {}): SyncResult | null {
  const result = syncRegisteredConnector(connectorId, options);

  if (!result) {
    return null;
  }

  applySyncResults([result]);

  return result;
}

export function syncAllConnectors(options: SyncExecutionOptions = {}): SyncResult[] {
  const results = syncRegisteredConnectors(options);

  applySyncResults(results);

  return results;
}

function connector(id: string, provider: ConnectorProvider, displayName: string, result: SyncResult): Connector {
  return {
    id,
    provider,
    displayName,
    status: result.status,
    lastSyncedAt: result.finishedAt,
    lastSyncResult: result,
  };
}

function applySyncResults(results: SyncResult[]) {
  for (const result of results) {
    updateConnector(result);
    updateProviderEvidenceCollectionTime(result);
    appendSyncRun(result);
  }

  const finishedAt = results
    .map((result) => result.finishedAt)
    .filter((value): value is string => value !== null)
    .sort()
    .at(-1);

  if (finishedAt) {
    lastDataRefreshAt = finishedAt;
  }
}

function updateConnector(result: SyncResult) {
  const connectorItem = connectors.find((item) => item.id === result.connectorId);

  if (!connectorItem) {
    return;
  }

  connectorItem.status = result.status;
  connectorItem.lastSyncedAt = result.finishedAt;
  connectorItem.lastSyncResult = result;
}

function updateProviderEvidenceCollectionTime(result: SyncResult) {
  if (!result.finishedAt) {
    return;
  }

  for (const item of evidence) {
    if (item.provider === result.provider) {
      item.collectedAt = result.finishedAt;
    }
  }
}

function appendSyncRun(result: SyncResult) {
  syncRunHistory.push({ ...result, errors: [...result.errors] });
}

function evidenceMatchesStatus(item: Evidence, status: EvidenceStatusFilter): boolean {
  return item.status === status || item.metadata.findingOutcome === status;
}

function calculateCompletionPercentage(acknowledgedCount: number, totalEmployeeCount: number): number {
  if (totalEmployeeCount === 0) {
    return 100;
  }

  return Math.round((Math.min(acknowledgedCount, totalEmployeeCount) / totalEmployeeCount) * 100);
}

function nextRiskId(title: string): string {
  const baseId = `risk-demo-${slugify(title)}`;

  if (!risks.some((risk) => risk.id === baseId)) {
    return baseId;
  }

  let suffix = 2;

  while (risks.some((risk) => risk.id === `${baseId}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseId}-${suffix}`;
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "untitled";
}
