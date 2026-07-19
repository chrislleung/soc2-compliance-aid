import type { ConnectorProvider, Evidence, EvidenceStatus, SyncResult } from "@/lib/contracts";

import type {
  ConnectorConnectionTest,
  ConnectorFindingOutcome,
  DemoConnector,
  EvidenceItem,
} from "./types";

const MOCK_CONNECTION_CHECKED_AT = "2026-07-18T11:57:30.000Z";
const MOCK_SYNC_STARTED_AT = "2026-07-18T11:58:00.000Z";
const MOCK_SYNC_FINISHED_AT = "2026-07-18T11:59:04.000Z";

const providerDisplayNames: Record<ConnectorProvider, string> = {
  aws: "AWS",
  azure: "Azure",
  github: "GitHub",
  gusto: "Gusto",
  rippling: "Rippling",
};

const demoProviders: ConnectorProvider[] = ["aws", "azure", "github", "gusto", "rippling"];

const awsEvidence = [
  evidenceItem("aws", {
    id: "ev-aws-db-encryption-orders",
    controlIds: ["cc-6"],
    title: "AWS RDS orders database encryption",
    description: "Mock AWS Config finding showing the production orders database is encrypted at rest.",
    status: "valid",
    collectedAt: "2026-07-18T10:10:00.000Z",
    expiresAt: "2026-10-16T10:10:00.000Z",
    findingOutcome: "pass",
    metadata: {
      findingType: "database_encryption",
      account: "demo-prod",
      region: "us-east-1",
      resourceType: "rds_instance",
      resourceId: "rds-orders-prod",
      encryptedAtRest: true,
      customerManagedKey: true,
    },
  }),
  evidenceItem("aws", {
    id: "ev-aws-db-encryption-analytics",
    controlIds: ["cc-6"],
    title: "AWS RDS analytics database encryption",
    description: "Mock AWS Config finding showing one analytics replica without encryption at rest.",
    status: "valid",
    collectedAt: "2026-07-18T10:11:00.000Z",
    expiresAt: "2026-10-16T10:11:00.000Z",
    findingOutcome: "fail",
    metadata: {
      findingType: "database_encryption",
      account: "demo-prod",
      region: "us-west-2",
      resourceType: "rds_instance",
      resourceId: "rds-analytics-replica",
      encryptedAtRest: false,
      customerManagedKey: false,
    },
  }),
  evidenceItem("aws", {
    id: "ev-aws-iam-mfa-admins",
    controlIds: ["cc-1"],
    title: "AWS IAM administrator MFA enabled",
    description: "Mock IAM finding showing named administrator users with MFA enabled.",
    status: "valid",
    collectedAt: "2026-07-18T10:15:00.000Z",
    expiresAt: "2026-10-16T10:15:00.000Z",
    findingOutcome: "pass",
    metadata: {
      findingType: "iam_user_mfa",
      account: "demo-prod",
      userGroup: "administrators",
      sampledUsers: 4,
      usersMissingMfa: 0,
      mfaRequired: true,
    },
  }),
  evidenceItem("aws", {
    id: "ev-aws-iam-mfa",
    controlIds: ["cc-1"],
    title: "AWS IAM break-glass MFA exception",
    description: "Mock IAM finding showing one break-glass user missing MFA.",
    status: "valid",
    collectedAt: "2026-07-18T10:16:00.000Z",
    expiresAt: "2026-10-16T10:16:00.000Z",
    findingOutcome: "fail",
    metadata: {
      findingType: "iam_user_mfa",
      account: "demo-prod",
      userName: "break-glass-readonly",
      userType: "break_glass",
      mfaEnabled: false,
      mfaRequired: true,
    },
  }),
  evidenceItem("aws", {
    id: "ev-aws-cloudtrail",
    controlIds: ["cc-5"],
    title: "AWS CloudTrail status",
    description: "Mock CloudTrail status confirms organization logging is enabled.",
    status: "valid",
    collectedAt: "2026-07-18T10:18:00.000Z",
    expiresAt: "2026-10-16T10:18:00.000Z",
    findingOutcome: "pass",
    metadata: {
      findingType: "cloud_logging",
      account: "demo-prod",
      organizationTrail: true,
      logValidationEnabled: true,
    },
  }),
];

const azureEvidence = [
  evidenceItem("azure", {
    id: "ev-azure-sql-encryption-primary",
    controlIds: ["cc-6"],
    title: "Azure SQL production database encryption",
    description: "Mock Azure SQL finding showing transparent data encryption is enabled.",
    status: "valid",
    collectedAt: "2026-07-18T10:20:00.000Z",
    expiresAt: "2026-10-16T10:20:00.000Z",
    findingOutcome: "pass",
    metadata: {
      findingType: "database_encryption",
      subscription: "demo-production",
      resourceGroup: "rg-prod-data",
      resourceId: "sql-prod-primary",
      transparentDataEncryption: true,
      customerManagedKey: true,
    },
  }),
  evidenceItem("azure", {
    id: "ev-azure-storage-encryption-logs",
    controlIds: ["cc-6"],
    title: "Azure storage encryption key review",
    description: "Mock storage finding showing encryption is enabled with a platform-managed key.",
    status: "valid",
    collectedAt: "2026-07-18T10:21:00.000Z",
    expiresAt: "2026-10-16T10:21:00.000Z",
    findingOutcome: "warning",
    metadata: {
      findingType: "storage_encryption",
      subscription: "demo-production",
      resourceGroup: "rg-prod-logs",
      resourceId: "stprodlogs001",
      encryptedAtRest: true,
      customerManagedKey: false,
    },
  }),
  evidenceItem("azure", {
    id: "ev-azure-entra-mfa-admins",
    controlIds: ["cc-1"],
    title: "Entra ID administrator MFA policy",
    description: "Mock Entra ID finding showing administrators are covered by Conditional Access MFA.",
    status: "valid",
    collectedAt: "2026-07-18T10:22:00.000Z",
    expiresAt: "2026-10-16T10:22:00.000Z",
    findingOutcome: "pass",
    metadata: {
      findingType: "entra_id_mfa",
      tenant: "demo-tenant",
      policyName: "Require MFA for admins",
      coveredUsers: 6,
      excludedUsers: 0,
      mfaRequired: true,
    },
  }),
  evidenceItem("azure", {
    id: "ev-azure-entra-mfa-guests",
    controlIds: ["cc-1"],
    title: "Entra ID guest MFA exception",
    description: "Mock Entra ID finding showing one guest group excluded from the MFA policy.",
    status: "valid",
    collectedAt: "2026-07-18T10:23:00.000Z",
    expiresAt: "2026-10-16T10:23:00.000Z",
    findingOutcome: "warning",
    metadata: {
      findingType: "entra_id_mfa",
      tenant: "demo-tenant",
      policyName: "Require MFA for guests",
      coveredUsers: 18,
      excludedUsers: 1,
      mfaRequired: true,
    },
  }),
  evidenceItem("azure", {
    id: "ev-azure-activity-log",
    controlIds: ["cc-5"],
    title: "Azure activity log retention",
    description: "Mock Azure export showing activity logs retained for compliance review.",
    status: "valid",
    collectedAt: "2026-07-18T10:24:00.000Z",
    expiresAt: "2026-10-16T10:24:00.000Z",
    findingOutcome: "pass",
    metadata: {
      findingType: "cloud_logging",
      subscription: "demo-production",
      retentionDays: 365,
      diagnosticSettings: true,
    },
  }),
];

const githubEvidence = [
  evidenceItem("github", {
    id: "ev-github-branch-protection-app",
    controlIds: ["cc-2"],
    title: "GitHub branch protection for soc2-compliance-aid",
    description: "Mock repository finding showing required checks and protected default branch settings.",
    status: "valid",
    collectedAt: "2026-07-18T10:25:00.000Z",
    expiresAt: "2026-10-16T10:25:00.000Z",
    findingOutcome: "pass",
    metadata: {
      findingType: "branch_protection",
      organization: "demo-org",
      repository: "soc2-compliance-aid",
      defaultBranch: "main",
      requiredStatusChecks: true,
      allowsForcePushes: false,
    },
  }),
  evidenceItem("github", {
    id: "ev-github-branch-protection",
    controlIds: ["cc-2"],
    title: "GitHub branch protection for internal-runbooks",
    description: "Mock repository finding showing the default branch is missing required protection.",
    status: "valid",
    collectedAt: "2026-07-18T10:26:00.000Z",
    expiresAt: "2026-10-16T10:26:00.000Z",
    findingOutcome: "fail",
    metadata: {
      findingType: "branch_protection",
      organization: "demo-org",
      repository: "internal-runbooks",
      defaultBranch: "main",
      requiredStatusChecks: false,
      allowsForcePushes: true,
    },
  }),
  evidenceItem("github", {
    id: "ev-github-pr-review-app",
    controlIds: ["cc-2"],
    title: "GitHub PR review requirement for soc2-compliance-aid",
    description: "Mock repository finding showing pull requests require approving reviews.",
    status: "valid",
    collectedAt: "2026-07-18T10:27:00.000Z",
    expiresAt: "2026-10-16T10:27:00.000Z",
    findingOutcome: "pass",
    metadata: {
      findingType: "pull_request_review_requirement",
      organization: "demo-org",
      repository: "soc2-compliance-aid",
      requiredApprovingReviews: 1,
      dismissesStaleReviews: true,
      sampledPullRequests: 12,
    },
  }),
  evidenceItem("github", {
    id: "ev-github-pr-review",
    controlIds: ["cc-2"],
    title: "GitHub PR review requirement for internal-runbooks",
    description: "Mock repository finding showing pull requests can merge without review approval.",
    status: "valid",
    collectedAt: "2026-07-18T10:28:00.000Z",
    expiresAt: "2026-10-16T10:28:00.000Z",
    findingOutcome: "fail",
    metadata: {
      findingType: "pull_request_review_requirement",
      organization: "demo-org",
      repository: "internal-runbooks",
      requiredApprovingReviews: 0,
      dismissesStaleReviews: false,
      sampledPullRequests: 4,
    },
  }),
  evidenceItem("github", {
    id: "ev-github-admins",
    controlIds: ["cc-1"],
    title: "GitHub organization administrators",
    description: "Mock admin access report with one pending access review item.",
    status: "valid",
    collectedAt: "2026-07-18T10:29:00.000Z",
    expiresAt: "2026-10-16T10:29:00.000Z",
    findingOutcome: "warning",
    metadata: {
      findingType: "administrator_access_review",
      organization: "demo-org",
      administratorCount: 4,
      pendingReviewCount: 1,
    },
  }),
];

const gustoEvidence = [
  evidenceItem("gusto", {
    id: "ev-gusto-employee-emp-001",
    controlIds: ["cc-3", "cc-4"],
    title: "Gusto employee record for Avery Chen",
    description: "Mock Gusto employee roster row normalized into an evidence item.",
    status: "valid",
    collectedAt: "2026-07-18T10:35:00.000Z",
    expiresAt: null,
    findingOutcome: "pass",
    metadata: {
      recordType: "employee_roster",
      employeeId: "emp-001",
      name: "Avery Chen",
      email: "avery.chen@example.test",
      employmentStatus: "active",
      onboardingStatus: "complete",
    },
  }),
  evidenceItem("gusto", {
    id: "ev-gusto-employee-emp-003",
    controlIds: ["cc-3"],
    title: "Gusto employee record for Morgan Rivera",
    description: "Mock Gusto employee roster row for an employee in offboarding.",
    status: "valid",
    collectedAt: "2026-07-18T10:36:00.000Z",
    expiresAt: null,
    findingOutcome: "warning",
    metadata: {
      recordType: "employee_roster",
      employeeId: "emp-003",
      name: "Morgan Rivera",
      email: "morgan.rivera@example.test",
      employmentStatus: "terminated",
      onboardingStatus: "not_applicable",
    },
  }),
  evidenceItem("gusto", {
    id: "ev-gusto-employee-emp-005",
    controlIds: ["cc-3", "cc-4"],
    title: "Gusto employee record for Taylor Brooks",
    description: "Mock Gusto employee roster row with onboarding still in progress.",
    status: "valid",
    collectedAt: "2026-07-18T10:37:00.000Z",
    expiresAt: null,
    findingOutcome: "warning",
    metadata: {
      recordType: "employee_roster",
      employeeId: "emp-005",
      name: "Taylor Brooks",
      email: "taylor.brooks@example.test",
      employmentStatus: "active",
      onboardingStatus: "in_progress",
    },
  }),
  evidenceItem("gusto", {
    id: "ev-gusto-terminations",
    controlIds: ["cc-3"],
    title: "Gusto termination roster",
    description: "Mock employee termination report for the current quarter.",
    status: "valid",
    collectedAt: "2026-07-18T10:38:00.000Z",
    expiresAt: "2026-10-16T10:38:00.000Z",
    findingOutcome: "warning",
    metadata: {
      recordType: "termination_summary",
      terminatedEmployees: 1,
      pendingOffboardingEmployees: 1,
      source: "mock-gusto",
    },
  }),
  evidenceItem("gusto", {
    id: "ev-policy-ack-summary",
    controlIds: ["cc-4"],
    title: "Security policy acknowledgement summary",
    description: "Mock acknowledgement export from HR records.",
    status: "valid",
    collectedAt: "2026-07-18T10:40:00.000Z",
    expiresAt: null,
    findingOutcome: "warning",
    metadata: {
      recordType: "policy_acknowledgement_summary",
      acknowledgedEmployees: 3,
      totalEmployees: 5,
      pendingAcknowledgements: 2,
    },
  }),
  evidenceItem("gusto", {
    id: "ev-vendor-risk-review",
    controlIds: ["cc-7"],
    title: "Vendor risk review register",
    description: "Mock vendor review register showing required vendor reviews are current.",
    status: "valid",
    collectedAt: "2026-07-18T10:41:00.000Z",
    expiresAt: null,
    findingOutcome: "pass",
    metadata: {
      recordType: "vendor_risk_review",
      reviewedVendors: 4,
      overdueReviews: 0,
    },
  }),
  evidenceItem("gusto", {
    id: "ev-risk-assessment-current",
    controlIds: ["cc-8"],
    title: "Current risk assessment register",
    description: "Mock risk assessment register export for the current demo period.",
    status: "valid",
    collectedAt: "2026-07-18T10:41:30.000Z",
    expiresAt: null,
    findingOutcome: "pass",
    metadata: {
      recordType: "risk_assessment_register",
      currentAssessments: 3,
    },
  }),
];

const ripplingEvidence = [
  evidenceItem("rippling", {
    id: "ev-rippling-employee-emp-002",
    controlIds: ["cc-3"],
    title: "Rippling employee record for Jordan Patel",
    description: "Mock Rippling employee row with background check status.",
    status: "valid",
    collectedAt: "2026-07-18T10:42:00.000Z",
    expiresAt: null,
    findingOutcome: "pass",
    metadata: {
      recordType: "employee_roster",
      employeeId: "emp-002",
      name: "Jordan Patel",
      email: "jordan.patel@example.test",
      employmentStatus: "active",
      terminationTimestamp: "",
      backgroundCheckStatus: "clear",
    },
  }),
  evidenceItem("rippling", {
    id: "ev-rippling-employee-emp-004",
    controlIds: ["cc-3"],
    title: "Rippling employee record for Sam Okafor",
    description: "Mock Rippling employee row for a terminated employee.",
    status: "valid",
    collectedAt: "2026-07-18T10:43:00.000Z",
    expiresAt: null,
    findingOutcome: "pass",
    metadata: {
      recordType: "employee_roster",
      employeeId: "emp-004",
      name: "Sam Okafor",
      email: "sam.okafor@example.test",
      employmentStatus: "terminated",
      terminationTimestamp: "2026-06-30T00:00:00.000Z",
      backgroundCheckStatus: "clear",
    },
  }),
  evidenceItem("rippling", {
    id: "ev-rippling-employee-emp-006",
    controlIds: ["cc-3"],
    title: "Rippling employee record for Riley Stone",
    description: "Mock Rippling employee row with a background check pending review.",
    status: "valid",
    collectedAt: "2026-07-18T10:44:00.000Z",
    expiresAt: null,
    findingOutcome: "warning",
    metadata: {
      recordType: "employee_roster",
      employeeId: "emp-006",
      name: "Riley Stone",
      email: "riley.stone@example.test",
      employmentStatus: "active",
      terminationTimestamp: "",
      backgroundCheckStatus: "pending_review",
    },
  }),
  evidenceItem("rippling", {
    id: "ev-rippling-offboarding",
    controlIds: ["cc-1", "cc-3"],
    title: "Rippling offboarding checks",
    description: "Mock offboarding checklist export with unresolved application access.",
    status: "expired",
    collectedAt: "2026-06-01T09:00:00.000Z",
    expiresAt: "2026-07-01T09:00:00.000Z",
    findingOutcome: "fail",
    metadata: {
      recordType: "offboarding_checklist",
      openChecklistItems: 2,
      overdueItems: 1,
      terminatedEmployeesWithAccess: 1,
    },
  }),
];

export const connectorRegistry: Readonly<Record<ConnectorProvider, DemoConnector>> = {
  aws: createMockConnector("aws", awsEvidence),
  azure: createMockConnector("azure", azureEvidence),
  github: createMockConnector("github", githubEvidence),
  gusto: createMockConnector("gusto", gustoEvidence),
  rippling: createMockConnector("rippling", ripplingEvidence, ["One offboarding checklist item remains open."]),
};

export function getDemoConnectors(): DemoConnector[] {
  return demoProviders.map((provider) => getDemoConnector(provider));
}

export function getDemoConnector(provider: ConnectorProvider): DemoConnector {
  return connectorRegistry[provider];
}

function createMockConnector(
  provider: ConnectorProvider,
  collectedEvidence: EvidenceItem[],
  errors: string[] = [],
): DemoConnector {
  const lastSyncStatus = mockSyncResult(provider, collectedEvidence.length, errors);

  return {
    provider,
    testConnection() {
      return mockConnectionTest(provider);
    },
    collectEvidence() {
      return collectedEvidence.map(cloneEvidenceItem);
    },
    getLastSyncStatus() {
      return cloneSyncResult(lastSyncStatus);
    },
    sync() {
      return cloneSyncResult(lastSyncStatus);
    },
  };
}

interface MockEvidenceInput {
  id: string;
  controlIds: string[];
  title: string;
  description: string;
  status: EvidenceStatus;
  collectedAt: string;
  expiresAt: string | null;
  findingOutcome: ConnectorFindingOutcome;
  metadata: Evidence["metadata"];
}

function evidenceItem(provider: ConnectorProvider, input: MockEvidenceInput): EvidenceItem {
  return {
    id: input.id,
    provider,
    controlIds: input.controlIds,
    title: input.title,
    description: input.description,
    status: input.status,
    collectedAt: input.collectedAt,
    expiresAt: input.expiresAt,
    metadata: {
      mockMode: true,
      findingOutcome: input.findingOutcome,
      ...input.metadata,
    },
  };
}

function mockConnectionTest(provider: ConnectorProvider): ConnectorConnectionTest {
  return {
    provider,
    ok: true,
    checkedAt: MOCK_CONNECTION_CHECKED_AT,
    mode: "mock",
    message: `${providerDisplayNames[provider]} mock connector is reachable.`,
  };
}

function mockSyncResult(
  provider: ConnectorProvider,
  recordsProcessed: number,
  errors: string[],
): SyncResult {
  return {
    connectorId: `conn-${provider}`,
    provider,
    status: errors.length > 0 ? "error" : "success",
    startedAt: MOCK_SYNC_STARTED_AT,
    finishedAt: MOCK_SYNC_FINISHED_AT,
    recordsProcessed,
    errors,
  };
}

function cloneEvidenceItem(item: EvidenceItem): EvidenceItem {
  return {
    ...item,
    controlIds: [...item.controlIds],
    metadata: { ...item.metadata },
  };
}

function cloneSyncResult(result: SyncResult): SyncResult {
  return {
    ...result,
    errors: [...result.errors],
  };
}
