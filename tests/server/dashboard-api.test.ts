import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import type { DashboardSummary } from "@/lib/contracts";
import { GET } from "@/app/api/dashboard/route";

describe("dashboard API contract", () => {
  it("returns the normalized frontend integration shape", async () => {
    const response = GET();
    const body = (await response.json()) as DashboardSummary;
    const controlCountSum = body.controlCounts.pass + body.controlCounts.warning + body.controlCounts.fail;

    assert.equal(response.status, 200);
    assert.equal(body.controlCounts.total, 8);
    assert.equal(body.controlCounts.total, controlCountSum);
    assert.deepEqual(Object.keys(body.controlCounts), ["total", "pass", "warning", "fail"]);
    assert.deepEqual(Object.keys(body.policyMetrics), [
      "completionPercentage",
      "employeesWithPendingPolicies",
      "totalMissingAcknowledgements",
    ]);
    assert.ok(body.connectors.every((connector) => connector.connectionStatus === "connected"));
    assert.ok(body.connectors.every((connector) => ["success", "error"].includes(connector.lastSyncStatus)));
    assert.equal(body.connectors.find((connector) => connector.provider === "rippling")?.lastSyncStatus, "error");
    assert.equal(body.connectors.find((connector) => connector.provider === "rippling")?.lastError, "One offboarding checklist item remains open.");
    assert.ok(!("controlCountsByStatus" in body));
    assert.ok(!("connectorStatuses" in body));
  });
});
