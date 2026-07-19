import { afterEach, expect, test, vi } from "vitest";
import { apiRequest, ApiRequestError } from "@/lib/client/http";

function mockFetch(response: { status: number; body: unknown }) {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(response.body === undefined ? "" : JSON.stringify(response.body), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }),
    ),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("apiRequest returns parsed JSON on success", async () => {
  mockFetch({ status: 200, body: { ok: true } });
  const result = await apiRequest<{ ok: boolean }>("/api/dashboard");
  expect(result).toEqual({ ok: true });
});

test("apiRequest throws ApiRequestError with the server's error body", async () => {
  mockFetch({
    status: 404,
    body: { error: { code: "not_found", message: "Policy not found" } },
  });

  await expect(apiRequest("/api/policies/missing/acknowledge", { method: "POST" })).rejects.toMatchObject({
    code: "not_found",
    message: "Policy not found",
    status: 404,
  });
});

test("apiRequest falls back to a generic error when the body isn't an ApiErrorBody", async () => {
  mockFetch({ status: 500, body: { oops: true } });

  await expect(apiRequest("/api/dashboard")).rejects.toMatchObject({
    code: "unknown_error",
    status: 500,
  });
});

test("apiRequest wraps network failures in an ApiRequestError", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new TypeError("network down");
    }),
  );

  const promise = apiRequest("/api/dashboard");
  await expect(promise).rejects.toBeInstanceOf(ApiRequestError);
  await expect(promise).rejects.toMatchObject({ code: "network_error" });
});
