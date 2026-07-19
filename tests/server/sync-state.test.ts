import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { GET as getDashboard } from "@/app/api/dashboard/route";
import { POST as postSync } from "@/app/api/connectors/sync/route";
import type { DashboardSummary } from "@/lib/contracts";
import { evidence, syncAllConnectors, syncRunHistory } from "@/server/mock-data";

describe("demo sync state", () => {
  it("advances sync timestamps without changing control outcomes", async () => {
    const before = await dashboard();
    const beforeCounts = { ...before.controlCountsByStatus };
    const beforeHistoryLength = syncRunHistory.length;
    const syncAt = "2026-07-19T15:30:00.000Z";
    const results = syncAllConnectors({ executedAt: syncAt });
    const after = await dashboard();

    assert.equal(results.length, 5);
    assert.equal(syncRunHistory.length, beforeHistoryLength + 5);
    assert.ok(results.every((result) => result.startedAt === syncAt));
    assert.ok(results.every((result) => result.finishedAt === syncAt));
    assert.deepEqual(after.controlCountsByStatus, beforeCounts);
    assert.ok(after.connectors.every((connector) => connector.lastSyncedAt === syncAt));
    assert.ok(evidence.some((item) => item.collectedAt === syncAt));
  });

  it("preserves deterministic connector outcomes when one connector has an intentional error", async () => {
    const syncAt = "2026-07-19T16:00:00.000Z";
    const results = syncAllConnectors({ executedAt: syncAt });
    const dashboardBody = await dashboard();
    const rippling = dashboardBody.connectors.find((connector) => connector.provider === "rippling");

    assert.equal(results.find((result) => result.provider === "rippling")?.status, "error");
    assert.equal(rippling?.status, "error");
    assert.equal(rippling?.lastSyncedAt, syncAt);
    assert.deepEqual(rippling?.lastSyncResult?.errors, ["One offboarding checklist item remains open."]);
    assert.ok(results.some((result) => result.provider === "aws" && result.status === "success"));
    assert.ok(results.some((result) => result.provider === "github" && result.status === "success"));
    assert.deepEqual(dashboardBody.controlCountsByStatus, {
      compliant: 3,
      at_risk: 1,
      non_compliant: 4,
      not_applicable: 0,
    });
  });

  it("POST /api/connectors/sync updates dashboard-visible sync state using server time", async () => {
    const before = await dashboard();
    const beforeRippling = before.connectors.find((connector) => connector.provider === "rippling");
    const response = await postSync(jsonRequest({ connectorId: "conn-rippling" }));
    const result = await response.json();
    const after = await dashboard();
    const afterRippling = after.connectors.find((connector) => connector.provider === "rippling");

    assert.equal(response.status, 200);
    assert.equal(result.provider, "rippling");
    assert.equal(result.status, "error");
    assert.ok(afterRippling?.lastSyncedAt);
    assert.notEqual(afterRippling?.lastSyncedAt, beforeRippling?.lastSyncedAt);
    assert.equal(afterRippling?.status, "error");
  });
});

async function dashboard(): Promise<DashboardSummary> {
  return (await getDashboard().json()) as DashboardSummary;
}

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/connectors/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
