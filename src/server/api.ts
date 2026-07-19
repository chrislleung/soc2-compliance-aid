import type { ApiErrorBody } from "@/lib/contracts";

export function json<T>(body: T, init?: ResponseInit): Response {
  return Response.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): Response {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  };

  return json(body, { status });
}

export async function parseJsonObject(request: Request): Promise<Record<string, unknown> | Response> {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return apiError(400, "invalid_request_body", "Request body must be a JSON object.");
    }

    return body as Record<string, unknown>;
  } catch {
    return apiError(400, "invalid_json", "Request body must be valid JSON.");
  }
}

export async function parseOptionalJsonObject(request: Request): Promise<Record<string, unknown> | Response> {
  let text: string;

  try {
    text = await request.text();
  } catch {
    return apiError(400, "invalid_request_body", "Request body could not be read.");
  }

  if (text.trim().length === 0) {
    return {};
  }

  try {
    const body: unknown = JSON.parse(text);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return apiError(400, "invalid_request_body", "Request body must be a JSON object.");
    }

    return body as Record<string, unknown>;
  } catch {
    return apiError(400, "invalid_json", "Request body must be valid JSON.");
  }
}

export function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
