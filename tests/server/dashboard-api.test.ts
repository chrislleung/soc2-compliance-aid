import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import type { DashboardSummary } from "@/lib/contracts";
import { GET } from "@/app/api/dashboard/route";

describe("dashboard API contract", () => {
  it("returns the shared frontend contract shape", async () => {
    const response = GET();
    const body = (await response.json()) as DashboardSummary;
    const controlCountSum =
      body.controlCountsByStatus.compliant +
      body.controlCountsByStatus.at_risk +
      body.controlCountsByStatus.non_compliant +
      body.controlCountsByStatus.not_applicable;

    assert.equal(response.status, 200);
    assert.equal(controlCountSum, 8);
    assert.deepEqual(Object.keys(body.controlCountsByStatus), ["compliant", "at_risk", "non_compliant", "not_applicable"]);
    assert.equal(typeof body.pendingPolicyAcknowledgementCount, "number");
    assert.ok(body.connectors.every((connector) => ["idle", "syncing", "success", "error"].includes(connector.status)));
    assert.equal(body.connectors.find((connector) => connector.provider === "rippling")?.status, "error");
    assert.deepEqual(
      body.connectors.find((connector) => connector.provider === "rippling")?.lastSyncResult?.errors,
      ["One offboarding checklist item remains open."],
    );
    assert.ok(!("controlCounts" in body));
    assert.ok(!("policyMetrics" in body));
    assert.ok(!("recentEvidence" in body));
  });
});
