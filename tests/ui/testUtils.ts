import { vi } from "vitest";

export interface RecordedCall {
  url: string;
  init?: RequestInit;
}

type RouteValue = unknown | ((input: RequestInfo | URL, init?: RequestInit) => unknown | Promise<unknown>);

/**
 * Stubs global fetch to resolve based on the request's pathname (query
 * string ignored), so tests never need a running backend. Route values
 * can be a plain JSON-serializable value or a function computing one
 * (sync or async) per call — handy for POST routes.
 */
export function mockApi(routes: Record<string, RouteValue>): RecordedCall[] {
  const calls: RecordedCall[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init });
      const path = url.split("?")[0];
      const route = path in routes ? routes[path] : routes[url];
      if (route === undefined) {
        return new Response(
          JSON.stringify({ error: { code: "not_found", message: `No mock registered for ${url}` } }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }
      const body = typeof route === "function" ? await route(input, init) : route;
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
  return calls;
}

/** A promise whose resolution the test controls, for asserting mid-flight UI state (e.g. disabled buttons). */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
