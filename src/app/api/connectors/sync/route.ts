import { apiError, json, parseJsonObject } from "@/server/api";
import { syncConnector } from "@/server/mock-data";
import { validateSyncConnectorRequest } from "@/server/validation";

export async function POST(request: Request) {
  const body = await parseJsonObject(request);

  if (body instanceof Response) {
    return body;
  }

  const connectorId = validateSyncConnectorRequest(body);

  if (connectorId instanceof Response) {
    return connectorId;
  }

  const result = syncConnector(connectorId);

  if (!result) {
    return apiError(404, "connector_not_found", "Connector was not found.");
  }

  return json(result);
}
