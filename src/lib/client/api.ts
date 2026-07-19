import { apiRequest } from "./http";
import type {
  AuditorExportResponse,
  Connector,
  ConnectorProvider,
  Control,
  CreateRiskRequest,
  DashboardSummary,
  Employee,
  Evidence,
  Policy,
  PolicyAcknowledgement,
  Risk,
  SyncResult,
} from "@/lib/contracts";

export function getDashboard(): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>("/api/dashboard");
}

export function getControls(): Promise<Control[]> {
  return apiRequest<Control[]>("/api/controls");
}

export function getEvidence(params?: {
  controlId?: string;
  provider?: ConnectorProvider;
}): Promise<Evidence[]> {
  const query = new URLSearchParams();
  if (params?.controlId) query.set("controlId", params.controlId);
  if (params?.provider) query.set("provider", params.provider);
  const qs = query.toString();
  return apiRequest<Evidence[]>(`/api/evidence${qs ? `?${qs}` : ""}`);
}

export function getEmployees(): Promise<Employee[]> {
  return apiRequest<Employee[]>("/api/employees");
}

export function getPolicies(): Promise<Policy[]> {
  return apiRequest<Policy[]>("/api/policies");
}

export function acknowledgePolicy(
  policyId: string,
  employeeId: string,
): Promise<PolicyAcknowledgement> {
  return apiRequest<PolicyAcknowledgement>(
    `/api/policies/${encodeURIComponent(policyId)}/acknowledge`,
    { method: "POST", body: JSON.stringify({ employeeId }) },
  );
}

export function getRisks(): Promise<Risk[]> {
  return apiRequest<Risk[]>("/api/risks");
}

export function createRisk(body: CreateRiskRequest): Promise<Risk> {
  return apiRequest<Risk>("/api/risks", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getConnectors(): Promise<Connector[]> {
  return apiRequest<Connector[]>("/api/connectors");
}

function syncOneConnector(connectorId: string): Promise<SyncResult> {
  return apiRequest<SyncResult>("/api/connectors/sync", {
    method: "POST",
    body: JSON.stringify({ connectorId }),
  });
}

/**
 * Triggers a mock sync for every configured connector. The backend only
 * exposes a per-connector sync route, so this fans out one request per
 * connector and waits for all of them.
 */
export async function runConnectorSync(): Promise<SyncResult[]> {
  const connectors = await getConnectors();
  return Promise.all(connectors.map((connector) => syncOneConnector(connector.id)));
}

export async function getAuditorExportUrl(): Promise<string> {
  const result = await apiRequest<AuditorExportResponse>("/api/auditor/export");
  return result.downloadUrl;
}
