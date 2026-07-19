import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const now = new Date("2026-07-18T12:00:00.000Z");

const connectors = [
  { id: "conn-aws", provider: "aws", displayName: "AWS", status: "success", lastSyncedAt: "2026-07-18T11:59:04.000Z" },
  { id: "conn-azure", provider: "azure", displayName: "Azure", status: "success", lastSyncedAt: "2026-07-18T11:59:04.000Z" },
  { id: "conn-github", provider: "github", displayName: "GitHub", status: "success", lastSyncedAt: "2026-07-18T11:59:04.000Z" },
  { id: "conn-gusto", provider: "gusto", displayName: "Gusto", status: "success", lastSyncedAt: "2026-07-18T11:59:04.000Z" },
  { id: "conn-rippling", provider: "rippling", displayName: "Rippling", status: "error", lastSyncedAt: "2026-07-18T11:59:04.000Z" },
];

const controls = [
  ["ctrl-access-review", "CC-1", "Logical Access Review", "Access Control", "warning"],
  ["ctrl-mfa", "CC-2", "Multi-factor Authentication", "Access Control", "pass"],
  ["ctrl-change-management", "CC-3", "Change Management", "Change Management", "pass"],
  ["ctrl-logging", "CC-4", "Cloud Logging", "Monitoring", "pass"],
  ["ctrl-offboarding", "CC-5", "Employee Offboarding", "People Operations", "fail"],
  ["ctrl-policy-ack", "CC-6", "Policy Acknowledgement", "Governance", "warning"],
  ["ctrl-vendor-risk", "CC-7", "Vendor Risk Review", "Vendor Management", "pass"],
  ["ctrl-risk-assessment", "CC-8", "Risk Assessment Review", "Risk Management", "pass"],
].map(([id, code, name, category, currentStatus]) => ({
  id,
  code,
  name,
  category,
  currentStatus,
  description: `${name} control tracked for deterministic SOC 2 demo evidence.`,
  lastEvaluatedAt: now,
}));

const evidence = [
  ["ev-aws-mfa", "conn-aws", ["ctrl-mfa", "ctrl-access-review"], "AWS IAM MFA report", "valid", "2026-07-18T10:15:00.000Z", "2026-10-16T10:15:00.000Z", { users: 42, missingMfa: 0 }],
  ["ev-aws-cloudtrail", "conn-aws", ["ctrl-logging"], "AWS CloudTrail enabled", "valid", "2026-07-18T10:20:00.000Z", "2026-10-16T10:20:00.000Z", { organizationTrail: true }],
  ["ev-aws-admins", "conn-aws", ["ctrl-access-review"], "AWS administrator access", "expiring", "2026-07-18T10:25:00.000Z", "2026-08-17T10:25:00.000Z", { adminUsers: 3 }],
  ["ev-azure-activity-log", "conn-azure", ["ctrl-logging"], "Azure activity log retention", "valid", "2026-07-18T10:30:00.000Z", "2026-10-16T10:30:00.000Z", { retentionDays: 365 }],
  ["ev-azure-conditional-access", "conn-azure", ["ctrl-mfa"], "Azure conditional access", "valid", "2026-07-18T10:35:00.000Z", "2026-10-16T10:35:00.000Z", { mfaRequired: true }],
  ["ev-github-branch-protection", "conn-github", ["ctrl-change-management"], "GitHub branch protection", "valid", "2026-07-18T10:40:00.000Z", "2026-10-16T10:40:00.000Z", { protectedBranches: 8 }],
  ["ev-github-pr-approvals", "conn-github", ["ctrl-change-management"], "GitHub PR approvals", "valid", "2026-07-18T10:45:00.000Z", "2026-10-16T10:45:00.000Z", { sampledPullRequests: 12 }],
  ["ev-github-admin-review", "conn-github", ["ctrl-access-review"], "GitHub administrator review", "expiring", "2026-07-18T10:50:00.000Z", "2026-08-17T10:50:00.000Z", { pendingReviewCount: 1 }],
  ["ev-gusto-roster", "conn-gusto", ["ctrl-offboarding", "ctrl-policy-ack"], "Gusto employee roster", "valid", "2026-07-18T10:55:00.000Z", null, { employees: 8 }],
  ["ev-gusto-terminations", "conn-gusto", ["ctrl-offboarding"], "Gusto termination report", "valid", "2026-07-18T11:00:00.000Z", "2026-10-16T11:00:00.000Z", { terminatedEmployees: 2 }],
  ["ev-rippling-access", "conn-rippling", ["ctrl-offboarding", "ctrl-access-review"], "Rippling access reconciliation", "expired", "2026-06-01T09:00:00.000Z", "2026-07-01T09:00:00.000Z", { terminatedUsersWithAccess: 1 }],
  ["ev-policy-ack-summary", "conn-gusto", ["ctrl-policy-ack"], "Policy acknowledgement summary", "valid", "2026-07-18T11:05:00.000Z", null, { acknowledged: 26, pending: 14 }],
  ["ev-vendor-review", "conn-rippling", ["ctrl-vendor-risk"], "Vendor review tracker", "valid", "2026-07-18T11:10:00.000Z", "2026-10-16T11:10:00.000Z", { vendorsReviewed: 11 }],
  ["ev-risk-register", "conn-gusto", ["ctrl-risk-assessment"], "Risk register export", "valid", "2026-07-18T11:15:00.000Z", null, { openRisks: 2 }],
];

const employees = [
  ["emp-avery", "Avery Chen", "avery.chen@example.test", "active", "gusto", true, true, true, "2024-02-12T00:00:00.000Z", null],
  ["emp-jordan", "Jordan Patel", "jordan.patel@example.test", "active", "rippling", true, false, true, "2023-09-18T00:00:00.000Z", null],
  ["emp-morgan", "Morgan Rivera", "morgan.rivera@example.test", "terminated", "gusto", false, false, true, "2022-04-04T00:00:00.000Z", "2026-07-15T00:00:00.000Z"],
  ["emp-sam", "Sam Okafor", "sam.okafor@example.test", "terminated", "rippling", false, false, false, "2021-11-08T00:00:00.000Z", "2026-06-30T00:00:00.000Z"],
  ["emp-taylor", "Taylor Brooks", "taylor.brooks@example.test", "active", "gusto", false, true, true, "2025-01-13T00:00:00.000Z", null],
  ["emp-riley", "Riley Stone", "riley.stone@example.test", "active", "rippling", true, true, false, "2024-06-03T00:00:00.000Z", null],
  ["emp-casey", "Casey Nguyen", "casey.nguyen@example.test", "active", "gusto", false, false, true, "2025-03-24T00:00:00.000Z", null],
  ["emp-drew", "Drew Kim", "drew.kim@example.test", "leave", "rippling", false, true, false, "2023-12-11T00:00:00.000Z", null],
].map(([id, name, email, employmentStatus, sourceSystem, hasAwsAccess, hasAzureAccess, hasGithubAccess, startDate, terminationDate]) => ({
  id,
  name,
  email,
  employmentStatus,
  sourceSystem,
  hasAwsAccess,
  hasAzureAccess,
  hasGithubAccess,
  startDate: new Date(startDate),
  terminationDate: terminationDate ? new Date(terminationDate) : null,
}));

const policies = [
  ["pol-security", "Information Security Policy", "2026.2", "Security", true],
  ["pol-access", "Access Control Policy", "2026.1", "Access Control", true],
  ["pol-incident", "Incident Response Policy", "2026.1", "Security", true],
  ["pol-vendor", "Vendor Risk Policy", "2025.4", "Vendor Management", true],
  ["pol-data", "Data Retention Policy", "2026.1", "Privacy", true],
].map(([id, name, version, category, requiresAcknowledgement]) => ({
  id,
  name,
  version,
  category,
  requiresAcknowledgement,
  description: `${name} template used for the deterministic SOC 2 demo.`,
}));

const acknowledgements = [
  ["ack-001", "emp-avery", "pol-security", "2026.2", "2026-07-01T14:00:00.000Z"],
  ["ack-002", "emp-avery", "pol-access", "2026.1", "2026-07-01T14:05:00.000Z"],
  ["ack-003", "emp-jordan", "pol-security", "2026.2", "2026-07-02T15:00:00.000Z"],
  ["ack-004", "emp-jordan", "pol-incident", "2026.1", "2026-07-02T15:10:00.000Z"],
  ["ack-005", "emp-taylor", "pol-security", "2026.2", "2026-07-03T16:00:00.000Z"],
  ["ack-006", "emp-riley", "pol-access", "2026.1", "2026-07-03T16:15:00.000Z"],
  ["ack-007", "emp-casey", "pol-vendor", "2025.4", "2026-07-05T12:00:00.000Z"],
  ["ack-008", "emp-drew", "pol-data", "2026.1", "2026-07-06T12:30:00.000Z"],
  ["ack-009", "emp-sam", "pol-security", "2026.2", "2026-06-01T09:00:00.000Z"],
  ["ack-010", "emp-morgan", "pol-security", "2026.2", "2026-06-15T09:00:00.000Z"],
];

const risks = [
  ["risk-access-review", "Delayed access review", "Quarterly admin access review has one unresolved exception.", "Access Control", "medium", "high", "high", "Security Lead", "Complete owner review and document exception approval.", "open"],
  ["risk-offboarding", "Terminated employee retains access", "One terminated employee still has GitHub access after termination.", "People Operations", "high", "high", "critical", "People Ops", "Revoke access and verify via Rippling reconciliation.", "open"],
  ["risk-vendor-refresh", "Vendor review freshness", "One vendor review will need refresh before the next audit window.", "Vendor Management", "low", "medium", "medium", "Compliance Manager", "Schedule refresh review for next month.", "mitigated"],
].map(([id, title, description, category, likelihood, impact, severity, owner, mitigation, status]) => ({
  id,
  title,
  description,
  category,
  likelihood,
  impact,
  severity,
  owner,
  mitigation,
  status,
  createdAt: new Date("2026-07-10T14:00:00.000Z"),
  updatedAt: now,
}));

async function main() {
  await prisma.policyAcknowledgement.deleteMany();
  await prisma.evidenceItem.deleteMany();
  await prisma.syncRun.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.complianceControl.deleteMany();
  await prisma.connector.deleteMany();

  for (const connector of connectors) {
    await prisma.connector.create({
      data: {
        ...connector,
        lastSyncedAt: connector.lastSyncedAt ? new Date(connector.lastSyncedAt) : null,
      },
    });
  }

  for (const control of controls) {
    await prisma.complianceControl.create({ data: control });
  }

  for (const item of evidence) {
    const [id, connectorId, controlIds, title, status, collectedAt, expiresAt, metadata] = item;
    await prisma.evidenceItem.create({
      data: {
        id,
        connectorId,
        title,
        status,
        description: `${title} collected from deterministic mock provider data.`,
        collectedAt: new Date(collectedAt),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        metadata,
        controls: {
          connect: controlIds.map((controlId) => ({ id: controlId })),
        },
      },
    });
  }

  for (const employee of employees) {
    await prisma.employee.create({ data: employee });
  }

  for (const policy of policies) {
    await prisma.policy.create({ data: policy });
  }

  for (const [id, employeeId, policyId, policyVersion, acknowledgedAt] of acknowledgements) {
    await prisma.policyAcknowledgement.create({
      data: {
        id,
        employeeId,
        policyId,
        policyVersion,
        acknowledgedAt: new Date(acknowledgedAt),
      },
    });
  }

  for (const risk of risks) {
    await prisma.riskAssessment.create({ data: risk });
  }

  for (const connector of connectors) {
    await prisma.syncRun.create({
      data: {
        id: `sync-${connector.provider}-latest`,
        connectorId: connector.id,
        provider: connector.provider,
        status: connector.status,
        startedAt: new Date("2026-07-18T11:58:00.000Z"),
        completedAt: connector.lastSyncedAt ? new Date(connector.lastSyncedAt) : null,
        error: connector.provider === "rippling" ? "One terminated employee still has GitHub access." : null,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
