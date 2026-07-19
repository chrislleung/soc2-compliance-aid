import { StatusBadge } from "@/components/StatusBadge";
import { connectorSyncStatusLabel, connectorSyncStatusTone, formatDate } from "@/lib/client/format";
import type { Connector } from "@/lib/contracts";

export function ConnectorCard({
  label,
  connector,
}: {
  label: string;
  connector: Connector | undefined;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{label}</p>
      <div className="mt-2">
        {connector ? (
          <StatusBadge
            label={connectorSyncStatusLabel(connector.status)}
            tone={connectorSyncStatusTone(connector.status)}
          />
        ) : (
          <StatusBadge label="Not Connected" tone="gray" />
        )}
      </div>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Last synced {formatDate(connector?.lastSyncedAt ?? null)}
      </p>
    </div>
  );
}
