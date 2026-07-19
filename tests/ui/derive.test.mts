import test from "node:test";
import assert from "node:assert/strict";
import {
  controlsRequiringAttention,
  policyCompletionPercent,
  recentEvidence,
} from "../../src/lib/client/derive.ts";
import type { Control, Evidence, Policy } from "../../src/lib/contracts/index.ts";

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
