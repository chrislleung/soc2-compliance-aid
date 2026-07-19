import { afterEach, expect, test, vi } from "vitest";
import * as api from "@/lib/client/api";

interface Call {
  input: RequestInfo | URL;
  init?: RequestInit;
}

function mockJsonFetch(body: unknown): Call[] {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ input, init });
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("getDashboard requests GET /api/dashboard", async () => {
  const calls = mockJsonFetch({ overallCompliancePercent: 90 });
  await api.getDashboard();
  expect(calls[0].input).toBe("/api/dashboard");
  expect(calls[0].init?.method).toBeUndefined();
});

test("getEvidence builds a query string from provided filters", async () => {
  const calls = mockJsonFetch([]);
  await api.getEvidence({ controlId: "ctrl_1", provider: "aws" });
  expect(calls[0].input).toBe("/api/evidence?controlId=ctrl_1&provider=aws");
});

test("getEvidence omits the query string when no filters are given", async () => {
  const calls = mockJsonFetch([]);
  await api.getEvidence();
  expect(calls[0].input).toBe("/api/evidence");
});

test("acknowledgePolicy POSTs to the policy-specific acknowledge route", async () => {
  const calls = mockJsonFetch({ policyId: "p1", employeeId: "e1", acknowledgedAt: "now" });
  await api.acknowledgePolicy("p1", "e1");
  expect(calls[0].input).toBe("/api/policies/p1/acknowledge");
  expect(calls[0].init?.method).toBe("POST");
  expect(calls[0].init?.body).toBe(JSON.stringify({ employeeId: "e1" }));
});

test("acknowledgePolicy encodes the policy id for the URL", async () => {
  const calls = mockJsonFetch({});
  await api.acknowledgePolicy("p 1/x", "e1");
  expect(calls[0].input).toBe("/api/policies/p%201%2Fx/acknowledge");
});

test("createRisk POSTs the risk payload to /api/risks", async () => {
  const body = {
    title: "t",
    description: "d",
    category: "c",
    likelihood: 2 as const,
    impact: 4 as const,
    status: "open" as const,
    owner: "o",
  };
  const calls = mockJsonFetch({ id: "r1", ...body });
  await api.createRisk(body);
  expect(calls[0].input).toBe("/api/risks");
  expect(calls[0].init?.method).toBe("POST");
  expect(calls[0].init?.body).toBe(JSON.stringify(body));
});

test("runConnectorSync fetches connectors then POSTs a sync for each one", async () => {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ input, init });
      if (input === "/api/connectors") {
        return new Response(JSON.stringify([{ id: "c1" }, { id: "c2" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ connectorId: "synced" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );

  const results = await api.runConnectorSync();

  expect(calls[0].input).toBe("/api/connectors");
  const syncCalls = calls.filter((c) => c.input === "/api/connectors/sync");
  expect(syncCalls.length).toBe(2);
  expect(syncCalls.map((c) => c.init?.body).sort()).toEqual(
    [JSON.stringify({ connectorId: "c1" }), JSON.stringify({ connectorId: "c2" })].sort(),
  );
  expect(results.length).toBe(2);
});

test("getAuditorExportUrl requests the export route and returns its downloadUrl", async () => {
  const calls = mockJsonFetch({ generatedAt: "now", downloadUrl: "/exports/pkg.zip" });
  const url = await api.getAuditorExportUrl();
  expect(calls[0].input).toBe("/api/auditor/export");
  expect(url).toBe("/exports/pkg.zip");
});
