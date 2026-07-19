import { json } from "@/server/api";
import { evaluateControls } from "@/server/compliance/evaluate";
import { getDemoDataStore } from "@/server/repositories/demo-repository";

export function GET() {
  return json(evaluateControls(getDemoDataStore()));
}
