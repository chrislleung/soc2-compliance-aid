import type { ConnectorProvider, SyncResult } from "@/lib/contracts";

import { getConnector, getConnectorById, listRegisteredConnectors } from "./registry";
import type { DemoConnector } from "./types";

const FALLBACK_SYNC_TIMESTAMP = "2026-07-18T12:00:00.000Z";

export interface SyncExecutionOptions {
  executedAt?: Date | string;
}

export function syncConnector(connectorId: string, options: SyncExecutionOptions = {}): SyncResult | null {
  const connector = getConnectorById(connectorId);

  if (!connector) {
    return null;
  }

  return syncConnectorAdapter(connector, options);
}

export function syncConnectorByProvider(provider: ConnectorProvider, options: SyncExecutionOptions = {}): SyncResult {
  return syncConnectorAdapter(getConnector(provider), options);
}

export function syncAllConnectors(options: SyncExecutionOptions = {}): SyncResult[] {
  return syncConnectorAdapters(listRegisteredConnectors(), options);
}

export function syncConnectorAdapters(connectors: DemoConnector[], options: SyncExecutionOptions = {}): SyncResult[] {
  return connectors.map((connector) => syncConnectorAdapter(connector, options));
}

function syncConnectorAdapter(connector: DemoConnector, options: SyncExecutionOptions): SyncResult {
  const executedAt = resolveExecutionTimestamp(options);

  try {
    const connection = connector.testConnection();

    if (!connection.ok) {
      const previousStatus = connector.getLastSyncStatus();

      return {
        ...previousStatus,
        status: "error",
        startedAt: executedAt,
        finishedAt: executedAt,
        recordsProcessed: 0,
        errors: [connection.message],
      };
    }

    const collectedEvidence = connector.collectEvidence();
    const previousStatus = connector.getLastSyncStatus();
    const errors = [...previousStatus.errors];

    return {
      ...previousStatus,
      status: errors.length > 0 ? "error" : "success",
      startedAt: executedAt,
      finishedAt: executedAt,
      recordsProcessed: collectedEvidence.length,
      errors,
    };
  } catch (error) {
    return createFailedSyncResult(connector, error, executedAt);
  }
}

function createFailedSyncResult(connector: DemoConnector, error: unknown, executedAt: string): SyncResult {
  const previousStatus = safeLastSyncStatus(connector);
  const message = error instanceof Error ? error.message : "Connector sync failed.";

  return {
    ...previousStatus,
    status: "error",
    startedAt: executedAt,
    finishedAt: executedAt,
    recordsProcessed: 0,
    errors: [...previousStatus.errors, message],
  };
}

function safeLastSyncStatus(connector: DemoConnector): SyncResult {
  try {
    return connector.getLastSyncStatus();
  } catch {
    return {
      connectorId: `conn-${connector.provider}`,
      provider: connector.provider,
      status: "error",
      startedAt: FALLBACK_SYNC_TIMESTAMP,
      finishedAt: FALLBACK_SYNC_TIMESTAMP,
      recordsProcessed: 0,
      errors: [],
    };
  }
}

function resolveExecutionTimestamp(options: SyncExecutionOptions): string {
  if (options.executedAt instanceof Date) {
    return options.executedAt.toISOString();
  }

  if (typeof options.executedAt === "string") {
    return options.executedAt;
  }

  return new Date().toISOString();
}
