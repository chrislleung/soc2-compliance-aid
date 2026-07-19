import type { NextRequest } from "next/server";

import type { AuditorExportResponse } from "@/lib/contracts";
import { apiError, json } from "@/server/api";
import { createAuditorExportManifest, createAuditorExportZip } from "@/server/auditor/export-package";
import { MOCK_NOW, policyAcknowledgements } from "@/server/mock-data";
import { getDemoDataStore } from "@/server/repositories/demo-repository";

export function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format");

  if (format !== null && format !== "zip") {
    return apiError(400, "invalid_format", "format must be zip when provided.");
  }

  const store = getDemoDataStore();

  if (format === "zip") {
    const zipPackage = createAuditorExportZip(MOCK_NOW, store, policyAcknowledgements);

    return new Response(new Uint8Array(zipPackage), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": 'attachment; filename="soc2-audit-package.zip"',
        "Content-Type": "application/zip",
      },
    });
  }

  const responseBody: AuditorExportResponse = {
    generatedAt: MOCK_NOW,
    format: "zip",
    downloadUrl: "/api/auditor/export?format=zip",
    manifest: createAuditorExportManifest(store.evidence),
  };

  return json(responseBody);
}
