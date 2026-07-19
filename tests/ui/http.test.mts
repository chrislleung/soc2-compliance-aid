import test from "node:test";
import assert from "node:assert/strict";
import { apiRequest, ApiRequestError } from "../../src/lib/client/http.ts";

function mockFetch(response: { status: number; body: unknown }) {
  return async () =>
    new Response(response.body === undefined ? "" : JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
}

test("apiRequest returns parsed JSON on success", async (t) => {
  t.mock.method(globalThis, "fetch", mockFetch({ status: 200, body: { ok: true } }));
  const result = await apiRequest<{ ok: boolean }>("/api/dashboard");
  assert.deepEqual(result, { ok: true });
});

test("apiRequest throws ApiRequestError with the server's error body", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    mockFetch({
      status: 404,
      body: { error: { code: "not_found", message: "Policy not found" } },
    }),
  );

  await assert.rejects(
    () => apiRequest("/api/policies/missing/acknowledge", { method: "POST" }),
    (err: unknown) => {
      assert.ok(err instanceof ApiRequestError);
      assert.equal(err.code, "not_found");
      assert.equal(err.message, "Policy not found");
      assert.equal(err.status, 404);
      return true;
    },
  );
});

test("apiRequest falls back to a generic error when the body isn't an ApiErrorBody", async (t) => {
  t.mock.method(globalThis, "fetch", mockFetch({ status: 500, body: { oops: true } }));

  await assert.rejects(
    () => apiRequest("/api/dashboard"),
    (err: unknown) => {
      assert.ok(err instanceof ApiRequestError);
      assert.equal(err.code, "unknown_error");
      assert.equal(err.status, 500);
      return true;
    },
  );
});

test("apiRequest wraps network failures in an ApiRequestError", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("network down");
  });

  await assert.rejects(
    () => apiRequest("/api/dashboard"),
    (err: unknown) => {
      assert.ok(err instanceof ApiRequestError);
      assert.equal(err.code, "network_error");
      return true;
    },
  );
});
