import test from "node:test";
import assert from "node:assert/strict";
import {
  completionPercent,
  controlsRequiringAttention,
  evidenceResource,
  filterEmployees,
  filterEvidence,
  hasUnresolvedOffboardingIssues,
  isTerminatedRetainingAccess,
  openIssuesForSystem,
  policyCompletionPercent,
  recentEvidence,
  riskScore,
  unresolvedOffboardingIssueCount,
  validateRiskForm,
} from "../../src/lib/client/derive.ts";
import type { Control, Employee, Evidence, OffboardingIssue, Policy } from "../../src/lib/contracts/index.ts";

function makePolicy(overrides: Partial<Policy>): Policy {
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

function makeControl(overrides: Partial<Control>): Control {
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

function makeEvidence(overrides: Partial<Evidence>): Evidence {
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

function makeOffboardingIssue(overrides: Partial<OffboardingIssue>): OffboardingIssue {
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

function makeEmployee(overrides: Partial<Employee>): Employee {
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

test("completionPercent computes a simple ratio and returns null for a zero total", () => {
  assert.equal(completionPercent(3, 10), 30);
  assert.equal(completionPercent(0, 0), null);
  assert.equal(completionPercent(5, 5), 100);
});

test("policyCompletionPercent weights by employee count, not a flat average", () => {
  const policies = [
    makePolicy({ id: "p1", acknowledgedCount: 1, totalEmployeeCount: 1 }), // 100%
    makePolicy({ id: "p2", acknowledgedCount: 1, totalEmployeeCount: 9 }), // ~11%
  ];
  // Weighted: (1 + 1) / (1 + 9) = 20%, not the flat average of 100% and ~11% (~55.5%)
  assert.equal(policyCompletionPercent(policies), 20);
});

test("policyCompletionPercent ignores policies that don't require acknowledgement", () => {
  const policies = [
    makePolicy({ id: "p1", requiresAcknowledgement: false, acknowledgedCount: 0, totalEmployeeCount: 100 }),
    makePolicy({ id: "p2", requiresAcknowledgement: true, acknowledgedCount: 5, totalEmployeeCount: 5 }),
  ];
  assert.equal(policyCompletionPercent(policies), 100);
});

test("policyCompletionPercent returns null when there's nothing to measure", () => {
  assert.equal(policyCompletionPercent([]), null);
  assert.equal(
    policyCompletionPercent([makePolicy({ requiresAcknowledgement: false })]),
    null,
  );
});

test("controlsRequiringAttention excludes compliant and not_applicable controls", () => {
  const controls = [
    makeControl({ id: "c1", status: "compliant" }),
    makeControl({ id: "c2", status: "not_applicable" }),
    makeControl({ id: "c3", status: "at_risk" }),
  ];
  const result = controlsRequiringAttention(controls);
  assert.deepEqual(result.map((c) => c.id), ["c3"]);
});

test("controlsRequiringAttention sorts non_compliant before at_risk", () => {
  const controls = [
    makeControl({ id: "warn", status: "at_risk" }),
    makeControl({ id: "fail", status: "non_compliant" }),
  ];
  const result = controlsRequiringAttention(controls);
  assert.deepEqual(result.map((c) => c.id), ["fail", "warn"]);
});

test("controlsRequiringAttention breaks ties by oldest evaluation first", () => {
  const controls = [
    makeControl({ id: "newer", status: "at_risk", lastEvaluatedAt: "2026-02-01T00:00:00.000Z" }),
    makeControl({ id: "older", status: "at_risk", lastEvaluatedAt: "2026-01-01T00:00:00.000Z" }),
  ];
  const result = controlsRequiringAttention(controls);
  assert.deepEqual(result.map((c) => c.id), ["older", "newer"]);
});

test("controlsRequiringAttention respects the limit", () => {
  const controls = Array.from({ length: 15 }, (_, i) => makeControl({ id: `c${i}`, status: "at_risk" }));
  assert.equal(controlsRequiringAttention(controls, 10).length, 10);
});

test("recentEvidence sorts newest first and respects the limit", () => {
  const evidence = [
    makeEvidence({ id: "old", collectedAt: "2026-01-01T00:00:00.000Z" }),
    makeEvidence({ id: "new", collectedAt: "2026-03-01T00:00:00.000Z" }),
    makeEvidence({ id: "mid", collectedAt: "2026-02-01T00:00:00.000Z" }),
  ];
  assert.deepEqual(
    recentEvidence(evidence, 2).map((e) => e.id),
    ["new", "mid"],
  );
});

test("evidenceResource reads metadata.resource, falling back to a placeholder", () => {
  assert.equal(evidenceResource(makeEvidence({ metadata: { resource: "arn:aws:s3:::bucket" } })), "arn:aws:s3:::bucket");
  assert.equal(evidenceResource(makeEvidence({ metadata: {} })), "—");
});

test("filterEvidence filters by provider, status, and free-text search together", () => {
  const evidence = [
    makeEvidence({ id: "e1", provider: "aws", status: "valid", title: "IAM policy export" }),
    makeEvidence({ id: "e2", provider: "github", status: "expired", title: "Branch protection" }),
    makeEvidence({ id: "e3", provider: "aws", status: "expired", title: "S3 bucket policy" }),
  ];

  assert.deepEqual(filterEvidence(evidence, {}).map((e) => e.id), ["e1", "e2", "e3"]);
  assert.deepEqual(filterEvidence(evidence, { provider: "aws" }).map((e) => e.id), ["e1", "e3"]);
  assert.deepEqual(filterEvidence(evidence, { status: "expired" }).map((e) => e.id), ["e2", "e3"]);
  assert.deepEqual(
    filterEvidence(evidence, { provider: "aws", status: "expired" }).map((e) => e.id),
    ["e3"],
  );
  assert.deepEqual(filterEvidence(evidence, { search: "bucket" }).map((e) => e.id), ["e3"]);
});

test("filterEvidence search is case-insensitive and matches the resource metadata", () => {
  const evidence = [makeEvidence({ id: "e1", metadata: { resource: "prod-db-instance" } })];
  assert.deepEqual(filterEvidence(evidence, { search: "PROD-DB" }).map((e) => e.id), ["e1"]);
});

test("hasUnresolvedOffboardingIssues checks for at least one open issue", () => {
  assert.equal(hasUnresolvedOffboardingIssues(makeEmployee({ offboardingIssues: [] })), false);
  assert.equal(
    hasUnresolvedOffboardingIssues(
      makeEmployee({ offboardingIssues: [makeOffboardingIssue({ status: "resolved" })] }),
    ),
    false,
  );
  assert.equal(
    hasUnresolvedOffboardingIssues(
      makeEmployee({ offboardingIssues: [makeOffboardingIssue({ status: "open" })] }),
    ),
    true,
  );
});

test("isTerminatedRetainingAccess requires both offboarded status and an open issue", () => {
  const openIssue = makeOffboardingIssue({ status: "open" });
  assert.equal(
    isTerminatedRetainingAccess(makeEmployee({ status: "offboarded", offboardingIssues: [openIssue] })),
    true,
  );
  assert.equal(
    isTerminatedRetainingAccess(makeEmployee({ status: "active", offboardingIssues: [openIssue] })),
    false,
    "an active employee with an open issue isn't 'terminated retaining access'",
  );
  assert.equal(
    isTerminatedRetainingAccess(
      makeEmployee({ status: "offboarded", offboardingIssues: [makeOffboardingIssue({ status: "resolved" })] }),
    ),
    false,
    "a resolved issue doesn't count",
  );
});

test("unresolvedOffboardingIssueCount sums open issues across all employees", () => {
  const employees = [
    makeEmployee({
      id: "e1",
      offboardingIssues: [
        makeOffboardingIssue({ status: "open" }),
        makeOffboardingIssue({ status: "resolved" }),
      ],
    }),
    makeEmployee({ id: "e2", offboardingIssues: [makeOffboardingIssue({ status: "open" })] }),
  ];
  assert.equal(unresolvedOffboardingIssueCount(employees), 2);
});

test("openIssuesForSystem matches case-insensitively and excludes resolved issues", () => {
  const employee = makeEmployee({
    offboardingIssues: [
      makeOffboardingIssue({ id: "i1", system: "AWS IAM", status: "open" }),
      makeOffboardingIssue({ id: "i2", system: "aws", status: "resolved" }),
      makeOffboardingIssue({ id: "i3", system: "GitHub", status: "open" }),
    ],
  });
  assert.deepEqual(openIssuesForSystem(employee, "aws").map((i) => i.id), ["i1"]);
  assert.deepEqual(openIssuesForSystem(employee, "github").map((i) => i.id), ["i3"]);
  assert.deepEqual(openIssuesForSystem(employee, "azure"), []);
});

test("filterEmployees applies each filter correctly", () => {
  const employees = [
    makeEmployee({ id: "active", status: "active" }),
    makeEmployee({ id: "terminated", status: "offboarded" }),
    makeEmployee({
      id: "withIssue",
      status: "active",
      offboardingIssues: [makeOffboardingIssue({ status: "open" })],
    }),
  ];

  assert.deepEqual(filterEmployees(employees, "all").map((e) => e.id), [
    "active",
    "terminated",
    "withIssue",
  ]);
  assert.deepEqual(filterEmployees(employees, "active").map((e) => e.id), ["active", "withIssue"]);
  assert.deepEqual(filterEmployees(employees, "terminated").map((e) => e.id), ["terminated"]);
  assert.deepEqual(filterEmployees(employees, "has_issues").map((e) => e.id), ["withIssue"]);
});

test("riskScore multiplies likelihood by impact", () => {
  assert.equal(riskScore(1, 1), 1);
  assert.equal(riskScore(5, 5), 25);
  assert.equal(riskScore(3, 4), 12);
});

test("validateRiskForm flags each required field independently", () => {
  assert.deepEqual(validateRiskForm({ title: "", description: "", owner: "" }), {
    title: "Title is required.",
    description: "Description is required.",
    owner: "Owner is required.",
  });
  assert.deepEqual(
    validateRiskForm({ title: "  ", description: "d", owner: "o" }),
    { title: "Title is required." },
    "whitespace-only input counts as empty",
  );
  assert.deepEqual(validateRiskForm({ title: "t", description: "d", owner: "o" }), {});
});
