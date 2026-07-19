"use client";

import { useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SummaryCard } from "@/components/SummaryCard";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { ConnectorSyncButton } from "@/components/ConnectorSyncButton";
import { useApiResource } from "@/lib/client/useApiResource";
import { getDashboard } from "@/lib/client/api";
import {
  connectorSyncStatusLabel,
  connectorSyncStatusTone,
  controlStatusLabel,
  controlStatusTone,
  formatDate,
  formatPercent,
} from "@/lib/client/format";
import type { ControlStatus, DashboardSummary } from "@/lib/contracts";

const CONTROL_STATUS_ORDER: ControlStatus[] = [
  "compliant",
  "at_risk",
  "non_compliant",
  "not_applicable",
];

export default function DashboardPage() {
  const fetcher = useCallback(() => getDashboard(), []);
  const { data, loading, error, refetch } = useApiResource<DashboardSummary>(fetcher);

  return (
    <div>
      <PageHeader
        title="Compliance Dashboard"
        description="Snapshot of control status, open risks, and connector health across mock data sources."
      />

      {loading && <LoadingState label="Loading dashboard…" />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && data && (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Overall Compliance"
              value={formatPercent(data.overallCompliancePercent)}
              sublabel={`Generated ${formatDate(data.generatedAt)}`}
            />
            <SummaryCard
              label="Open Risks"
              value={String(data.openRiskCount)}
            />
            <SummaryCard
              label="Open Offboarding Issues"
              value={String(data.openOffboardingIssueCount)}
            />
            <SummaryCard
              label="Pending Policy Acknowledgements"
              value={String(data.pendingPolicyAcknowledgementCount)}
            />
          </div>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Controls by Status
            </h2>
            <div className="flex flex-wrap gap-3">
              {CONTROL_STATUS_ORDER.map((status) => (
                <div
                  key={status}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <StatusBadge label={controlStatusLabel(status)} tone={controlStatusTone(status)} />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {data.controlCountsByStatus[status] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Connectors
              </h2>
              <ConnectorSyncButton onSynced={refetch} />
            </div>
            {data.connectors.length === 0 ? (
              <EmptyState message="No connectors configured." />
            ) : (
              <div className="flex flex-col gap-2">
                {data.connectors.map((connector) => (
                  <div
                    key={connector.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {connector.displayName}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Last synced {formatDate(connector.lastSyncedAt)}
                      </p>
                    </div>
                    <StatusBadge
                      label={connectorSyncStatusLabel(connector.status)}
                      tone={connectorSyncStatusTone(connector.status)}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
