import type { ConnectorProvider, Evidence, SyncResult } from "@/lib/contracts";

export type EvidenceItem = Evidence;

export type ConnectorFindingOutcome = "pass" | "warning" | "fail";

export interface ConnectorConnectionTest {
  provider: ConnectorProvider;
  ok: boolean;
  checkedAt: string;
  mode: "mock";
  message: string;
}

export interface ConnectorAdapter {
  provider: ConnectorProvider;
  testConnection(): ConnectorConnectionTest;
  collectEvidence(): EvidenceItem[];
  getLastSyncStatus(): SyncResult;
}

export interface DemoConnector extends ConnectorAdapter {
  sync(): SyncResult;
}
