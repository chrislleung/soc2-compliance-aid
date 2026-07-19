"use client";

import { useCallback, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SummaryCard } from "@/components/SummaryCard";
import { ConnectorCard } from "@/components/ConnectorCard";
import { ControlTable } from "@/components/ControlTable";
import { EvidenceTable } from "@/components/EvidenceTable";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { ConnectorSyncButton } from "@/components/ConnectorSyncButton";
import { useApiResource } from "@/lib/client/useApiResource";
import { getControls, getDashboard, getEvidence, getPolicies } from "@/lib/client/api";
import { controlsRequiringAttention, policyCompletionPercent, recentEvidence } from "@/lib/client/derive";
import { formatDate, formatPercent } from "@/lib/client/format";
import type { Connector, ConnectorProvider, Control, DashboardSummary, Evidence, Policy } from "@/lib/contracts";

const CONNECTOR_PROVIDERS: { provider: ConnectorProvider; label: string }[] = [
  { provider: "aws", label: "AWS" },
  { provider: "azure", label: "Azure" },
  { provider: "github", label: "GitHub" },
  { provider: "gusto", label: "Gusto" },
  { provider: "rippling", label: "Rippling" },
];

export default function DashboardPage() {
  const dashboardFetcher = useCallback(() => getDashboard(), []);
  const policiesFetcher = useCallback(() => getPolicies(), []);
  const controlsFetcher = useCallback(() => getControls(), []);
  const evidenceFetcher = useCallback(() => getEvidence(), []);

  const dashboard = useApiResource<DashboardSummary>(dashboardFetcher);
  const policies = useApiResource<Policy[]>(policiesFetcher);
  const controls = useApiResource<Control[]>(controlsFetcher);
  const evidence = useApiResource<Evidence[]>(evidenceFetcher);

  const overviewLoading = dashboard.loading || policies.loading;
  const overviewError = dashboard.error ?? policies.error;

  const connectorByProvider = useMemo(() => {
    const map = new Map<ConnectorProvider, Connector>();
    for (const connector of dashboard.data?.connectors ?? []) map.set(connector.provider, connector);
    return map;
  }, [dashboard.data]);

  const attentionControls = useMemo(
    () => controlsRequiringAttention(controls.data ?? []),
    [controls.data],
  );
  const latestEvidence = useMemo(() => recentEvidence(evidence.data ?? []), [evidence.data]);

  return (
    <div>
      <PageHeader
        title="Compliance Dashboard"
        description={
          dashboard.data
            ? `Snapshot of control status, policy completion, and connector health. Last updated ${formatDate(dashboard.data.generatedAt)}.`
            : "Snapshot of control status, policy completion, and connector health across mock data sources."
        }
      />

      <div className="flex flex-col gap-8">
        {/* Summary cards + connectors */}
        {overviewLoading && <LoadingSkeleton variant="cards" count={6} label="Loading dashboard summary…" />}
        {!overviewLoading && overviewError && (
          <ErrorState
            message={overviewError}
            onRetry={() => {
              dashboard.refetch();
              policies.refetch();
            }}
          />
        )}
        {!overviewLoading && !overviewError && dashboard.data && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <SummaryCard
                label="Total Controls"
                value={String(totalControls(dashboard.data))}
              />
              <SummaryCard
                label="Passing Controls"
                value={String(dashboard.data.controlCountsByStatus.compliant ?? 0)}
              />
              <SummaryCard
                label="Warning Controls"
                value={String(dashboard.data.controlCountsByStatus.at_risk ?? 0)}
              />
              <SummaryCard
                label="Failing Controls"
                value={String(dashboard.data.controlCountsByStatus.non_compliant ?? 0)}
              />
              <SummaryCard
                label="Policy Completion"
                value={
                  policies.data
                    ? formatCompletion(policyCompletionPercent(policies.data))
                    : "—"
                }
              />
              <SummaryCard
                label="Offboarding Issues"
                value={String(dashboard.data.openOffboardingIssueCount)}
              />
            </div>

            <section>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Connectors
                </h2>
                <ConnectorSyncButton onSynced={dashboard.refetch} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {CONNECTOR_PROVIDERS.map(({ provider, label }) => (
                  <ConnectorCard
                    key={provider}
                    label={label}
                    connector={connectorByProvider.get(provider)}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {/* Controls requiring attention */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Controls Requiring Attention
          </h2>
          {controls.loading && <LoadingSkeleton variant="rows" count={4} label="Loading controls…" />}
          {!controls.loading && controls.error && (
            <ErrorState message={controls.error} onRetry={controls.refetch} />
          )}
          {!controls.loading && !controls.error && attentionControls.length === 0 && (
            <EmptyState message="No controls currently require attention." />
          )}
          {!controls.loading && !controls.error && attentionControls.length > 0 && (
            <ControlTable controls={attentionControls} />
          )}
        </section>

        {/* Recent evidence */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Recent Evidence
          </h2>
          {evidence.loading && <LoadingSkeleton variant="rows" count={5} label="Loading evidence…" />}
          {!evidence.loading && evidence.error && (
            <ErrorState message={evidence.error} onRetry={evidence.refetch} />
          )}
          {!evidence.loading && !evidence.error && latestEvidence.length === 0 && (
            <EmptyState message="No evidence has been collected yet." />
          )}
          {!evidence.loading && !evidence.error && latestEvidence.length > 0 && (
            <EvidenceTable evidence={latestEvidence} />
          )}
        </section>
      </div>
    </div>
  );
}

function totalControls(data: DashboardSummary): number {
  return Object.values(data.controlCountsByStatus).reduce((sum, count) => sum + count, 0);
}

function formatCompletion(percent: number | null): string {
  return percent === null ? "—" : formatPercent(percent);
}
