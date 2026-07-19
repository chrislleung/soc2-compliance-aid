import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import * as api from "../../src/lib/client/api.ts";

function mockJsonFetch(t: TestContext, body: unknown) {
  const calls: { input: RequestInfo | URL; init?: RequestInit }[] = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ input, init });
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  return calls;
}

test("getDashboard requests GET /api/dashboard", async (t) => {
  const calls = mockJsonFetch(t, { overallCompliancePercent: 90 });
  await api.getDashboard();
  assert.equal(calls[0].input, "/api/dashboard");
  assert.equal(calls[0].init?.method, undefined);
});

test("getEvidence builds a query string from provided filters", async (t) => {
  const calls = mockJsonFetch(t, []);
  await api.getEvidence({ controlId: "ctrl_1", provider: "aws" });
  assert.equal(calls[0].input, "/api/evidence?controlId=ctrl_1&provider=aws");
});

test("getEvidence omits the query string when no filters are given", async (t) => {
  const calls = mockJsonFetch(t, []);
  await api.getEvidence();
  assert.equal(calls[0].input, "/api/evidence");
});

test("acknowledgePolicy POSTs to the policy-specific acknowledge route", async (t) => {
  const calls = mockJsonFetch(t, { policyId: "p1", employeeId: "e1", acknowledgedAt: "now" });
  await api.acknowledgePolicy("p1", "e1");
  assert.equal(calls[0].input, "/api/policies/p1/acknowledge");
  assert.equal(calls[0].init?.method, "POST");
  assert.equal(calls[0].init?.body, JSON.stringify({ employeeId: "e1" }));
});

test("acknowledgePolicy encodes the policy id for the URL", async (t) => {
  const calls = mockJsonFetch(t, {});
  await api.acknowledgePolicy("p 1/x", "e1");
  assert.equal(calls[0].input, "/api/policies/p%201%2Fx/acknowledge");
});

test("createRisk POSTs the risk payload to /api/risks", async (t) => {
  const body = {
    title: "t",
    description: "d",
    category: "c",
    likelihood: "low" as const,
    impact: "low" as const,
    owner: "o",
  };
  const calls = mockJsonFetch(t, { id: "r1", ...body });
  await api.createRisk(body);
  assert.equal(calls[0].input, "/api/risks");
  assert.equal(calls[0].init?.method, "POST");
  assert.equal(calls[0].init?.body, JSON.stringify(body));
});

test("runConnectorSync fetches connectors then POSTs a sync for each one", async (t) => {
  const calls: { input: RequestInfo | URL; init?: RequestInit }[] = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ input, init });
    if (input === "/api/connectors") {
      return new Response(
        JSON.stringify([{ id: "c1" }, { id: "c2" }]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ connectorId: "synced" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

  const results = await api.runConnectorSync();

  assert.equal(calls[0].input, "/api/connectors");
  const syncCalls = calls.filter((c) => c.input === "/api/connectors/sync");
  assert.equal(syncCalls.length, 2);
  assert.deepEqual(
    syncCalls.map((c) => c.init?.body).sort(),
    [JSON.stringify({ connectorId: "c1" }), JSON.stringify({ connectorId: "c2" })].sort(),
  );
  assert.equal(results.length, 2);
});

test("getAuditorExportUrl requests the export route and returns its downloadUrl", async (t) => {
  const calls = mockJsonFetch(t, { generatedAt: "now", downloadUrl: "/exports/pkg.zip" });
  const url = await api.getAuditorExportUrl();
  assert.equal(calls[0].input, "/api/auditor/export");
  assert.equal(url, "/exports/pkg.zip");
});
