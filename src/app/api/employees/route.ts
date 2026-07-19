import { json } from "@/server/api";
import { getEmployeesWithOffboardingIssue } from "@/server/mock-data";

export function GET() {
  return json(getEmployeesWithOffboardingIssue());
}
