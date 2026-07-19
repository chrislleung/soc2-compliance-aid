import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import type { Control, Employee, Evidence, Policy, Risk } from "@/lib/contracts";
import { evaluateControls, evaluateRiskAssessmentCoverage, getDashboardSummary } from "@/server/compliance/evaluate";
import type { DemoDataStore } from "@/server/repositories/demo-repository";
import { getDemoDataStore } from "@/server/repositories/demo-repository";

describe("compliance evaluation", () => {
  it("derives control status from deterministic mock evidence and issues", () => {
    const controls = evaluateControls(getDemoDataStore());
    const statuses = Object.fromEntries(controls.map((control) => [control.id, control.status]));

    assert.equal(controls.length, 8);
    assert.equal(statuses["cc-1"], "fail");
    assert.equal(statuses["cc-2"], "fail");
    assert.equal(statuses["cc-3"], "fail");
    assert.equal(statuses["cc-4"], "warning");
    assert.equal(statuses["cc-5"], "pass");
    assert.equal(statuses["cc-6"], "fail");
    assert.equal(statuses["cc-7"], "pass");
    assert.equal(statuses["cc-8"], "pass");
  });

  it("builds a normalized dashboard response without duplicate aggregate concepts", () => {
    const summary = getDashboardSummary(getDemoDataStore());
    const controlCountSum = summary.controlCounts.pass + summary.controlCounts.warning + summary.controlCounts.fail;

    assert.equal(summary.overallCompliancePercent, 38);
    assert.deepEqual(summary.controlCounts, {
      total: 8,
      pass: 3,
      warning: 1,
      fail: 4,
    });
    assert.equal(summary.controlCounts.total, controlCountSum);
    assert.equal(summary.openRiskCount, 2);
    assert.equal(summary.openOffboardingIssueCount, 2);
    assert.deepEqual(summary.policyMetrics, {
      completionPercentage: 83,
      employeesWithPendingPolicies: 1,
      totalMissingAcknowledgements: 1,
    });
    assert.equal(summary.unresolvedOffboardingIssues.length, 2);
    assert.ok(summary.recentEvidence.length > 0);
    assert.ok(summary.connectors.every((connector) => connector.connectionStatus === "connected"));
    assert.ok(summary.connectors.every((connector) => connector.lastSyncedAt !== null));
    assert.ok(summary.connectors.every((connector) => ["success", "error"].includes(connector.lastSyncStatus)));
    assert.equal(summary.connectors.find((connector) => connector.provider === "rippling")?.lastSyncStatus, "error");
    assert.equal(summary.connectors.find((connector) => connector.provider === "rippling")?.lastError, "One offboarding checklist item remains open.");
    assert.equal(summary.connectors.find((connector) => connector.provider === "aws")?.lastError, null);
    assert.ok(!("controlCountsByStatus" in summary));
    assert.ok(!("connectorStatuses" in summary));
    assert.ok(!("passCount" in summary));
    assert.ok(!("pendingPolicyAcknowledgementCount" in summary));
  });

  it("passes AWS MFA evaluation when all users have MFA", () => {
    assert.equal(evaluateSingleControl("cc-1", [finding("cc-1", "pass", { findingType: "iam_user_mfa", usersMissingMfa: 0 })]), "pass");
  });

  it("fails AWS MFA evaluation when one user lacks MFA", () => {
    assert.equal(
      evaluateSingleControl("cc-1", [finding("cc-1", "fail", { findingType: "iam_user_mfa", usersMissingMfa: 1 })]),
      "fail",
    );
  });

  it("passes encryption evaluation when all resources are encrypted", () => {
    assert.equal(
      evaluateSingleControl("cc-6", [
        finding("cc-6", "pass", { findingType: "database_encryption", encryptedAtRest: true }),
        finding("cc-6", "pass", { findingType: "storage_encryption", encryptedAtRest: true }),
      ]),
      "pass",
    );
  });

  it("fails encryption evaluation when one resource is unencrypted", () => {
    assert.equal(
      evaluateSingleControl("cc-6", [
        finding("cc-6", "pass", { findingType: "database_encryption", encryptedAtRest: true }),
        finding("cc-6", "fail", { findingType: "storage_encryption", encryptedAtRest: false }),
      ]),
      "fail",
    );
  });

  it("passes GitHub branch protection when all repositories are protected", () => {
    assert.equal(
      evaluateSingleControl("cc-2", [
        finding("cc-2", "pass", { findingType: "branch_protection", requiredStatusChecks: true }),
        finding("cc-2", "pass", { findingType: "pull_request_review_requirement", requiredApprovingReviews: 1 }),
      ]),
      "pass",
    );
  });

  it("fails GitHub branch protection when one repository lacks required reviews", () => {
    assert.equal(
      evaluateSingleControl("cc-2", [
        finding("cc-2", "pass", { findingType: "branch_protection", requiredStatusChecks: true }),
        finding("cc-2", "fail", { findingType: "pull_request_review_requirement", requiredApprovingReviews: 0 }),
      ]),
      "fail",
    );
  });

  it("passes offboarding when a terminated user has no open access issue", () => {
    assert.equal(
      evaluateSingleControl("cc-3", [finding("cc-3", "pass", { recordType: "offboarding_checklist" })], {
        employees: [employee({ status: "offboarded", terminationDate: "2026-07-01T00:00:00.000Z" })],
      }),
      "pass",
    );
  });

  it("fails offboarding when a terminated user has any open access issue", () => {
    assert.equal(
      evaluateSingleControl("cc-3", [finding("cc-3", "pass", { recordType: "offboarding_checklist" })], {
        employees: [
          employee({
            status: "offboarded",
            terminationDate: "2026-07-01T00:00:00.000Z",
            openIssue: true,
          }),
        ],
      }),
      "fail",
    );
  });

  it("passes policy completion when every tracked policy is acknowledged", () => {
    assert.equal(
      evaluateSingleControl("cc-4", [finding("cc-4", "pass", { recordType: "policy_acknowledgement_summary" })], {
        policies: [policy({ acknowledgedCount: 2, totalEmployeeCount: 2, currentUserAcknowledgement: "acknowledged" })],
      }),
      "pass",
    );
  });

  it("warns on policy completion when one acknowledgement is missing", () => {
    assert.equal(
      evaluateSingleControl("cc-4", [finding("cc-4", "pass", { recordType: "policy_acknowledgement_summary" })], {
        policies: [policy({ acknowledgedCount: 1, totalEmployeeCount: 2, currentUserAcknowledgement: "pending" })],
      }),
      "warning",
    );
  });

  it("passes risk assessment coverage when a current assessment exists", () => {
    assert.equal(evaluateRiskAssessmentCoverage([risk()]), "pass");
  });

  it("fails risk assessment coverage when no assessment exists", () => {
    assert.equal(evaluateRiskAssessmentCoverage([]), "fail");
  });
});

function evaluateSingleControl(
  controlId: string,
  evidence: Evidence[],
  overrides: Partial<Pick<DemoDataStore, "employees" | "policies" | "policyAcknowledgements" | "risks">> = {},
) {
  return evaluateControls({
    generatedAt: "2026-07-18T12:00:00.000Z",
    lastDataRefreshAt: "2026-07-18T12:00:00.000Z",
    controls: [control(controlId)],
    evidence,
    employees: overrides.employees ?? [],
    policies: overrides.policies ?? [],
    policyAcknowledgements: overrides.policyAcknowledgements ?? [],
    risks: overrides.risks ?? [],
    connectors: [],
    syncRunHistory: [],
  })[0]?.status;
}

function control(id: string): Control {
  return {
    id,
    name: `Control ${id}`,
    description: "Demo control",
    category: "Demo",
    status: "fail",
    lastEvaluatedAt: "2026-07-18T12:00:00.000Z",
    relatedEvidenceIds: [],
  };
}

function finding(controlId: string, outcome: "pass" | "warning" | "fail", metadata: Evidence["metadata"]): Evidence {
  return {
    id: `ev-${controlId}-${outcome}-${JSON.stringify(metadata).length}`,
    provider: controlId === "cc-2" ? "github" : "aws",
    controlIds: [controlId],
    title: "Demo finding",
    description: "Demo finding",
    status: "valid",
    collectedAt: "2026-07-18T12:00:00.000Z",
    expiresAt: null,
    metadata: {
      mockMode: true,
      findingOutcome: outcome,
      ...metadata,
    },
  };
}

function employee(overrides: { status?: Employee["status"]; terminationDate?: string | null; openIssue?: boolean } = {}): Employee {
  const employeeId = "emp-test";

  return {
    id: employeeId,
    name: "Test Employee",
    email: "test.employee@example.test",
    source: "gusto",
    status: overrides.status ?? "active",
    startDate: "2025-01-01T00:00:00.000Z",
    terminationDate: overrides.terminationDate ?? null,
    offboardingIssues: overrides.openIssue
      ? [
          {
            id: "off-test",
            employeeId,
            issueType: "access_not_revoked",
            system: "GitHub",
            detectedAt: "2026-07-02T00:00:00.000Z",
            resolvedAt: null,
            status: "open",
          },
        ]
      : [],
  };
}

function policy(overrides: Partial<Policy> = {}): Policy {
  return {
    id: "pol-test",
    name: "Demo Policy",
    version: "2026.1",
    description: "Demo policy",
    requiresAcknowledgement: true,
    acknowledgedCount: 1,
    totalEmployeeCount: 1,
    currentUserAcknowledgement: "acknowledged",
    ...overrides,
  };
}

function risk(overrides: Partial<Risk> = {}): Risk {
  return {
    id: "risk-test",
    title: "Demo risk",
    description: "Demo risk",
    category: "Governance",
    likelihood: "low",
    impact: "low",
    severity: "low",
    status: "open",
    owner: "Security",
    mitigationPlan: null,
    createdAt: "2026-07-18T12:00:00.000Z",
    updatedAt: "2026-07-18T12:00:00.000Z",
    ...overrides,
  };
}
