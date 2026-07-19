import { json, parseJsonObject } from "@/server/api";
import { createRisk, risks } from "@/server/mock-data";
import { validateCreateRiskRequest } from "@/server/validation";

export function GET() {
  return json(risks);
}

export async function POST(request: Request) {
  const body = await parseJsonObject(request);

  if (body instanceof Response) {
    return body;
  }

  const riskRequest = validateCreateRiskRequest(body);

  if (riskRequest instanceof Response) {
    return riskRequest;
  }

  return json(createRisk(riskRequest), { status: 201 });
}
