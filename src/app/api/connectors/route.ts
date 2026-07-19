import { json } from "@/server/api";
import { connectors } from "@/server/mock-data";

export function GET() {
  return json(connectors);
}
