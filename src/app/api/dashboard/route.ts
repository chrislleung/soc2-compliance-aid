import { json } from "@/server/api";
import { getDashboardSummary } from "@/server/compliance/evaluate";
import { getDemoDataStore } from "@/server/repositories/demo-repository";

export function GET() {
  return json(getDashboardSummary(getDemoDataStore()));
}
