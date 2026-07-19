import { describe, expect, test } from "vitest";
import {
  completionPercent,
  controlsRequiringAttention,
  evidenceResource,
  filenameFromUrl,
  filterEmployees,
  filterEvidence,
  hasUnresolvedOffboardingIssues,
  isTerminatedRetainingAccess,
  lastConnectorSync,
  openIssuesForSystem,
  policyCompletionPercent,
  recentEvidence,
  riskScore,
  totalControlCount,
  unresolvedOffboardingIssueCount,
  validateRiskForm,
} from "@/lib/client/derive";
import {
  makeConnector,
  makeControl,
  makeEmployee,
  makeEvidence,
  makeOffboardingIssue,
  makePolicy,
} from "./fixtures";

test("completionPercent computes a simple ratio and returns null for a zero total", () => {
  expect(completionPercent(3, 10)).toBe(30);
  expect(completionPercent(0, 0)).toBe(null);
  expect(completionPercent(5, 5)).toBe(100);
});

test("totalControlCount sums every status bucket", () => {
  expect(
    totalControlCount({ compliant: 5, at_risk: 2, non_compliant: 1, not_applicable: 3 }),
  ).toBe(11);
});

describe("policyCompletionPercent", () => {
  test("weights by employee count, not a flat average", () => {
    const policies = [
      makePolicy({ id: "p1", acknowledgedCount: 1, totalEmployeeCount: 1 }), // 100%
      makePolicy({ id: "p2", acknowledgedCount: 1, totalEmployeeCount: 9 }), // ~11%
    ];
    // Weighted: (1 + 1) / (1 + 9) = 20%, not the flat average of 100% and ~11% (~55.5%)
    expect(policyCompletionPercent(policies)).toBe(20);
  });

  test("ignores policies that don't require acknowledgement", () => {
    const policies = [
      makePolicy({ id: "p1", requiresAcknowledgement: false, acknowledgedCount: 0, totalEmployeeCount: 100 }),
      makePolicy({ id: "p2", requiresAcknowledgement: true, acknowledgedCount: 5, totalEmployeeCount: 5 }),
    ];
    expect(policyCompletionPercent(policies)).toBe(100);
  });

  test("returns null when there's nothing to measure", () => {
    expect(policyCompletionPercent([])).toBe(null);
    expect(policyCompletionPercent([makePolicy({ requiresAcknowledgement: false })])).toBe(null);
  });
});

describe("controlsRequiringAttention", () => {
  test("excludes compliant and not_applicable controls", () => {
    const controls = [
      makeControl({ id: "c1", status: "compliant" }),
      makeControl({ id: "c2", status: "not_applicable" }),
      makeControl({ id: "c3", status: "at_risk" }),
    ];
    expect(controlsRequiringAttention(controls).map((c) => c.id)).toEqual(["c3"]);
  });

  test("sorts non_compliant before at_risk", () => {
    const controls = [
      makeControl({ id: "warn", status: "at_risk" }),
      makeControl({ id: "fail", status: "non_compliant" }),
    ];
    expect(controlsRequiringAttention(controls).map((c) => c.id)).toEqual(["fail", "warn"]);
  });

  test("breaks ties by oldest evaluation first", () => {
    const controls = [
      makeControl({ id: "newer", status: "at_risk", lastEvaluatedAt: "2026-02-01T00:00:00.000Z" }),
      makeControl({ id: "older", status: "at_risk", lastEvaluatedAt: "2026-01-01T00:00:00.000Z" }),
    ];
    expect(controlsRequiringAttention(controls).map((c) => c.id)).toEqual(["older", "newer"]);
  });

  test("respects the limit", () => {
    const controls = Array.from({ length: 15 }, (_, i) => makeControl({ id: `c${i}`, status: "at_risk" }));
    expect(controlsRequiringAttention(controls, 10).length).toBe(10);
  });
});

test("recentEvidence sorts newest first and respects the limit", () => {
  const evidence = [
    makeEvidence({ id: "old", collectedAt: "2026-01-01T00:00:00.000Z" }),
    makeEvidence({ id: "new", collectedAt: "2026-03-01T00:00:00.000Z" }),
    makeEvidence({ id: "mid", collectedAt: "2026-02-01T00:00:00.000Z" }),
  ];
  expect(recentEvidence(evidence, 2).map((e) => e.id)).toEqual(["new", "mid"]);
});

test("evidenceResource reads metadata.resource, falling back to a placeholder", () => {
  expect(evidenceResource(makeEvidence({ metadata: { resource: "arn:aws:s3:::bucket" } }))).toBe(
    "arn:aws:s3:::bucket",
  );
  expect(evidenceResource(makeEvidence({ metadata: {} }))).toBe("—");
});

describe("filterEvidence", () => {
  test("filters by provider, status, and free-text search together", () => {
    const evidence = [
      makeEvidence({ id: "e1", provider: "aws", status: "valid", title: "IAM policy export" }),
      makeEvidence({ id: "e2", provider: "github", status: "expired", title: "Branch protection" }),
      makeEvidence({ id: "e3", provider: "aws", status: "expired", title: "S3 bucket policy" }),
    ];

    expect(filterEvidence(evidence, {}).map((e) => e.id)).toEqual(["e1", "e2", "e3"]);
    expect(filterEvidence(evidence, { provider: "aws" }).map((e) => e.id)).toEqual(["e1", "e3"]);
    expect(filterEvidence(evidence, { status: "expired" }).map((e) => e.id)).toEqual(["e2", "e3"]);
    expect(filterEvidence(evidence, { provider: "aws", status: "expired" }).map((e) => e.id)).toEqual(["e3"]);
    expect(filterEvidence(evidence, { search: "bucket" }).map((e) => e.id)).toEqual(["e3"]);
  });

  test("search is case-insensitive and matches the resource metadata", () => {
    const evidence = [makeEvidence({ id: "e1", metadata: { resource: "prod-db-instance" } })];
    expect(filterEvidence(evidence, { search: "PROD-DB" }).map((e) => e.id)).toEqual(["e1"]);
  });
});

test("hasUnresolvedOffboardingIssues checks for at least one open issue", () => {
  expect(hasUnresolvedOffboardingIssues(makeEmployee({ offboardingIssues: [] }))).toBe(false);
  expect(
    hasUnresolvedOffboardingIssues(
      makeEmployee({ offboardingIssues: [makeOffboardingIssue({ status: "resolved" })] }),
    ),
  ).toBe(false);
  expect(
    hasUnresolvedOffboardingIssues(
      makeEmployee({ offboardingIssues: [makeOffboardingIssue({ status: "open" })] }),
    ),
  ).toBe(true);
});

test("isTerminatedRetainingAccess requires both offboarded status and an open issue", () => {
  const openIssue = makeOffboardingIssue({ status: "open" });
  expect(
    isTerminatedRetainingAccess(makeEmployee({ status: "offboarded", offboardingIssues: [openIssue] })),
  ).toBe(true);
  expect(
    isTerminatedRetainingAccess(makeEmployee({ status: "active", offboardingIssues: [openIssue] })),
  ).toBe(false);
  expect(
    isTerminatedRetainingAccess(
      makeEmployee({ status: "offboarded", offboardingIssues: [makeOffboardingIssue({ status: "resolved" })] }),
    ),
  ).toBe(false);
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
  expect(unresolvedOffboardingIssueCount(employees)).toBe(2);
});

test("openIssuesForSystem matches case-insensitively and excludes resolved issues", () => {
  const employee = makeEmployee({
    offboardingIssues: [
      makeOffboardingIssue({ id: "i1", system: "AWS IAM", status: "open" }),
      makeOffboardingIssue({ id: "i2", system: "aws", status: "resolved" }),
      makeOffboardingIssue({ id: "i3", system: "GitHub", status: "open" }),
    ],
  });
  expect(openIssuesForSystem(employee, "aws").map((i) => i.id)).toEqual(["i1"]);
  expect(openIssuesForSystem(employee, "github").map((i) => i.id)).toEqual(["i3"]);
  expect(openIssuesForSystem(employee, "azure")).toEqual([]);
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

  expect(filterEmployees(employees, "all").map((e) => e.id)).toEqual(["active", "terminated", "withIssue"]);
  expect(filterEmployees(employees, "active").map((e) => e.id)).toEqual(["active", "withIssue"]);
  expect(filterEmployees(employees, "terminated").map((e) => e.id)).toEqual(["terminated"]);
  expect(filterEmployees(employees, "has_issues").map((e) => e.id)).toEqual(["withIssue"]);
});

test("riskScore multiplies likelihood by impact", () => {
  expect(riskScore(1, 1)).toBe(1);
  expect(riskScore(5, 5)).toBe(25);
  expect(riskScore(3, 4)).toBe(12);
});

test("validateRiskForm flags each required field independently", () => {
  expect(validateRiskForm({ title: "", description: "", owner: "" })).toEqual({
    title: "Title is required.",
    description: "Description is required.",
    owner: "Owner is required.",
  });
  expect(validateRiskForm({ title: "  ", description: "d", owner: "o" })).toEqual({
    title: "Title is required.",
  });
  expect(validateRiskForm({ title: "t", description: "d", owner: "o" })).toEqual({});
});

test("lastConnectorSync returns the most recent timestamp across connectors", () => {
  const connectors = [
    makeConnector({ id: "c1", lastSyncedAt: "2026-01-01T00:00:00.000Z" }),
    makeConnector({ id: "c2", lastSyncedAt: "2026-03-01T00:00:00.000Z" }),
    makeConnector({ id: "c3", lastSyncedAt: null }),
  ];
  expect(lastConnectorSync(connectors)).toBe("2026-03-01T00:00:00.000Z");
});

test("lastConnectorSync returns null when no connector has synced yet", () => {
  expect(lastConnectorSync([makeConnector({ lastSyncedAt: null })])).toBe(null);
  expect(lastConnectorSync([])).toBe(null);
});

test("filenameFromUrl extracts the last path segment", () => {
  expect(filenameFromUrl("/exports/soc2-evidence-2026-07-18.zip")).toBe("soc2-evidence-2026-07-18.zip");
  expect(filenameFromUrl("https://example.com/files/pkg.zip?token=abc")).toBe("pkg.zip");
  expect(filenameFromUrl("/exports/")).toBe("exports");
  expect(filenameFromUrl("")).toBe(null);
});
