import type { ApiErrorBody } from "@/lib/contracts";

export class ApiRequestError extends Error {
  code: string;
  details?: unknown;
  status: number;

  constructor(status: number, body: ApiErrorBody["error"]) {
    super(body.message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error?: unknown }).error === "object"
  );
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiRequestError(0, {
      code: "network_error",
      message: "Could not reach the server. Check your connection and try again.",
    });
  }

  const text = await res.text();
  const parsed: unknown = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    if (isApiErrorBody(parsed)) {
      throw new ApiRequestError(res.status, parsed.error);
    }
    throw new ApiRequestError(res.status, {
      code: "unknown_error",
      message: `Request failed with status ${res.status}.`,
    });
  }

  return parsed as T;
}
