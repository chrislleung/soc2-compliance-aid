import { apiError, json, parseJsonObject } from "@/server/api";
import { acknowledgePolicy } from "@/server/mock-data";
import { validateAcknowledgePolicyRequest } from "@/server/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await parseJsonObject(request);

  if (body instanceof Response) {
    return body;
  }

  const employeeId = validateAcknowledgePolicyRequest(body);

  if (employeeId instanceof Response) {
    return employeeId;
  }

  const { id } = await params;
  const acknowledgement = acknowledgePolicy(id, employeeId);

  if (!acknowledgement) {
    return apiError(404, "policy_or_employee_not_found", "Policy or employee was not found.");
  }

  return json(acknowledgement);
}
