import { json } from "@/server/api";
import { getPoliciesWithCompletion } from "@/server/mock-data";

export function GET() {
  return json(getPoliciesWithCompletion());
}
