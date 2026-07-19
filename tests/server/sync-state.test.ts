import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { GET as getDashboard } from "@/app/api/dashboard/route";
import { POST as postSync } from "@/app/api/connectors/sync/route";
import type { DashboardSummary } from "@/lib/contracts";
import { syncAllConnectors, syncRunHistory } from "@/server/mock-data";

describe("demo sync state", () => {
  it("advances sync timestamps and dashboard refresh state without changing control outcomes", async () => {
    const before = await dashboard();
    const beforeEvidenceTimestamp = before.recentEvidence[0]?.collectedAt;
    const beforeCounts = { ...before.controlCounts };
    const beforeHistoryLength = syncRunHistory.length;
    const syncAt = "2026-07-19T15:30:00.000Z";
    const results = syncAllConnectors({ executedAt: syncAt });
    const after = await dashboard();

    assert.ok(beforeEvidenceTimestamp);
    assert.equal(results.length, 5);
    assert.equal(syncRunHistory.length, beforeHistoryLength + 5);
    assert.ok(results.every((result) => result.startedAt === syncAt));
    assert.ok(results.every((result) => result.finishedAt === syncAt));
    assert.deepEqual(after.controlCounts, beforeCounts);
    assert.equal(after.lastDataRefreshAt, syncAt);
    assert.ok(after.connectors.every((connector) => connector.lastSyncedAt === syncAt));
    assert.ok(after.recentEvidence.some((item) => item.collectedAt === syncAt));
  });

  it("preserves deterministic connector outcomes when one connector has an intentional error", async () => {
    const syncAt = "2026-07-19T16:00:00.000Z";
    const results = syncAllConnectors({ executedAt: syncAt });
    const dashboardBody = await dashboard();
    const rippling = dashboardBody.connectors.find((connector) => connector.provider === "rippling");

    assert.equal(results.find((result) => result.provider === "rippling")?.status, "error");
    assert.equal(rippling?.lastSyncStatus, "error");
    assert.equal(rippling?.lastSyncedAt, syncAt);
    assert.equal(rippling?.lastError, "One offboarding checklist item remains open.");
    assert.ok(results.some((result) => result.provider === "aws" && result.status === "success"));
    assert.ok(results.some((result) => result.provider === "github" && result.status === "success"));
    assert.deepEqual(dashboardBody.controlCounts, {
      total: 8,
      pass: 3,
      warning: 1,
      fail: 4,
    });
  });

  it("POST /api/connectors/sync updates dashboard-visible sync state using server time", async () => {
    const before = await dashboard();
    const response = await postSync(emptyJsonRequest());
    const results = await response.json();
    const after = await dashboard();

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(results));
    assert.ok(after.lastDataRefreshAt);
    assert.notEqual(after.lastDataRefreshAt, before.lastDataRefreshAt);
    assert.ok(after.connectors.every((connector) => connector.lastSyncedAt === after.lastDataRefreshAt));
    assert.equal(after.connectors.find((connector) => connector.provider === "rippling")?.lastSyncStatus, "error");
  });
});

async function dashboard(): Promise<DashboardSummary> {
  return (await getDashboard().json()) as DashboardSummary;
}

function emptyJsonRequest(): Request {
  return new Request("http://localhost/api/connectors/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: "{}",
  });
}
