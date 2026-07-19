import type { NextRequest } from "next/server";

import { json } from "@/server/api";
import { getEvidence } from "@/server/mock-data";
import { parseConnectorProvider, parseEvidenceStatusFilter } from "@/server/validation";

export function GET(request: NextRequest) {
  const provider = parseConnectorProvider(request.nextUrl.searchParams.get("provider"));

  if (provider instanceof Response) {
    return provider;
  }

  const status = parseEvidenceStatusFilter(request.nextUrl.searchParams.get("status"));

  if (status instanceof Response) {
    return status;
  }

  return json(
    getEvidence({
      controlId: request.nextUrl.searchParams.get("controlId") ?? undefined,
      provider,
      status,
    }),
  );
}
