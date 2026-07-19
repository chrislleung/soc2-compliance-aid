import type { Connector, Control, Employee, Evidence, Policy, PolicyAcknowledgement, Risk, SyncResult } from "@/lib/contracts";
import {
  connectors,
  controls,
  employees,
  evidence,
  getLastDataRefreshAt,
  MOCK_NOW,
  policies,
  policyAcknowledgements,
  risks,
  syncRunHistory,
} from "@/server/mock-data";

export interface DemoDataStore {
  generatedAt: string;
  lastDataRefreshAt: string;
  controls: Control[];
  evidence: Evidence[];
  employees: Employee[];
  policies: Policy[];
  policyAcknowledgements: PolicyAcknowledgement[];
  risks: Risk[];
  connectors: Connector[];
  syncRunHistory: SyncResult[];
}

export function getDemoDataStore(): DemoDataStore {
  return {
    generatedAt: MOCK_NOW,
    lastDataRefreshAt: getLastDataRefreshAt(),
    controls,
    evidence,
    employees,
    policies,
    policyAcknowledgements,
    risks,
    connectors,
    syncRunHistory,
  };
}
