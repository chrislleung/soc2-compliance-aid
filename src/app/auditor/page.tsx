"use client";

import { useCallback, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { SummaryCard } from "@/components/SummaryCard";
import { ControlTable } from "@/components/ControlTable";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { AuditorExportButton } from "@/components/AuditorExportButton";
import { useApiResource } from "@/lib/client/useApiResource";
import { getControls, getDashboard, getEvidence, getPolicies } from "@/lib/client/api";
import { lastConnectorSync, policyCompletionPercent, totalControlCount } from "@/lib/client/derive";
import { formatDate, formatPercentOrDash } from "@/lib/client/format";
import type { Control, DashboardSummary, Evidence, Policy } from "@/lib/contracts";

export default function AuditorPage() {
  const dashboardFetcher = useCallback(() => getDashboard(), []);
  const controlsFetcher = useCallback(() => getControls(), []);
  const policiesFetcher = useCallback(() => getPolicies(), []);
  const evidenceFetcher = useCallback(() => getEvidence(), []);

  const dashboard = useApiResource<DashboardSummary>(dashboardFetcher);
  const controls = useApiResource<Control[]>(controlsFetcher);
  const policies = useApiResource<Policy[]>(policiesFetcher);
  const evidence = useApiResource<Evidence[]>(evidenceFetcher);

  const [exported, setExported] = useState<{ url: string; filename: string } | null>(null);

  const loading = dashboard.loading || controls.loading || policies.loading || evidence.loading;
  const error = dashboard.error ?? controls.error ?? policies.error ?? evidence.error;
  const retryAll = () => {
    dashboard.refetch();
    controls.refetch();
    policies.refetch();
    evidence.refetch();
  };

  return (
    <div>
      <PageHeader
        title="Auditor Portal"
        description="A read-only compliance snapshot for auditors."
        action={<StatusBadge label="Read-Only View" tone="gray" />}
      />

      <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        This portal is read-only — no data can be created, edited, or acknowledged from this page.
        It is a demonstration aid, not an auditor, SOC 2 attestation, legal opinion, or official
        compliance determination.
      </div>

      {loading && <LoadingSkeleton variant="cards" count={7} label="Loading auditor summary…" />}
      {!loading && error && <ErrorState message={error} onRetry={retryAll} />}

      {!loading && !error && dashboard.data && (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <SummaryCard
              label="Total Controls"
              value={String(totalControlCount(dashboard.data.controlCountsByStatus))}
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
            <SummaryCard label="Evidence Count" value={String(evidence.data?.length ?? 0)} />
            <SummaryCard
              label="Policy Completion"
              value={policies.data ? formatPercentOrDash(policyCompletionPercent(policies.data)) : "—"}
            />
            <SummaryCard label="Open Risks" value={String(dashboard.data.openRiskCount)} />
            <SummaryCard
              label="Unresolved Offboarding Issues"
              value={String(dashboard.data.openOffboardingIssueCount)}
            />
            <SummaryCard
              label="Last Connector Sync"
              value={formatDate(lastConnectorSync(dashboard.data.connectors))}
            />
          </div>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Control Status
            </h2>
            {(controls.data?.length ?? 0) === 0 ? (
              <EmptyState message="No controls found." />
            ) : (
              <ControlTable controls={controls.data!} />
            )}
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Evidence Package
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
              The downloaded ZIP contains a manifest of the mock evidence items backing each
              control above, along with the evidence itself. It is a convenience export for review
              — it is not an official SOC 2 report or attestation, and generating or downloading it
              does not certify compliance.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <AuditorExportButton onExported={setExported} />
              {exported && (
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Downloaded as <span className="font-medium">{exported.filename}</span>.
                </span>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
