import { apiError, json, parseOptionalJsonObject } from "@/server/api";
import { syncAllConnectors, syncConnector } from "@/server/mock-data";
import { validateSyncConnectorRequest } from "@/server/validation";

export async function POST(request: Request) {
  const body = await parseOptionalJsonObject(request);

  if (body instanceof Response) {
    return body;
  }

  if (body.connectorId === undefined) {
    return json(syncAllConnectors());
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
