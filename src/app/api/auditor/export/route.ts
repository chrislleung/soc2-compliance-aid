import { createAuditorExportZip } from "@/server/auditor/export-package";
import { MOCK_NOW, policyAcknowledgements } from "@/server/mock-data";
import { getDemoDataStore } from "@/server/repositories/demo-repository";

export function GET() {
  const zipPackage = createAuditorExportZip(MOCK_NOW, getDemoDataStore(), policyAcknowledgements);

  return new Response(new Uint8Array(zipPackage), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": 'attachment; filename="soc2-audit-package.zip"',
      "Content-Type": "application/zip",
    },
  });
}
