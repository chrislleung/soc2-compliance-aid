"use client";

import { useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { RiskForm } from "@/components/RiskForm";
import { useApiResource } from "@/lib/client/useApiResource";
import { getRisks } from "@/lib/client/api";
import { riskScore } from "@/lib/client/derive";
import { riskStatusLabel, riskStatusTone } from "@/lib/client/format";
import type { Risk } from "@/lib/contracts";

export default function RisksPage() {
  const fetcher = useCallback(() => getRisks(), []);
  const { data, loading, error, refetch } = useApiResource<Risk[]>(fetcher);

  return (
    <div>
      <PageHeader
        title="Risk Assessments"
        description="Log of identified risks with likelihood, impact, and mitigation status."
      />

      <div className="mb-8">
        <RiskForm onCreated={refetch} />
      </div>

      {loading && <LoadingSkeleton variant="rows" count={4} label="Loading risks…" />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && (data?.length ?? 0) === 0 && (
        <EmptyState message="No risks have been logged yet." />
      )}
      {!loading && !error && (data?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-3">
          {data!.map((risk) => (
            <div
              key={risk.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {risk.title}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {risk.description}
                  </p>
                </div>
                <StatusBadge label={riskStatusLabel(risk.status)} tone={riskStatusTone(risk.status)} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span>Owner: {risk.owner}</span>
                <span>Likelihood: {risk.likelihood}/5</span>
                <span>Impact: {risk.impact}/5</span>
                <span>Score: {riskScore(risk.likelihood, risk.impact)} / 25</span>
              </div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Mitigation: {risk.mitigationPlan || "None recorded."}
              </p>
            </div>
          ))}
          <p className="text-xs italic text-zinc-500 dark:text-zinc-400">
            Score is likelihood × impact, a simple heuristic for sorting risks in this demo — not
            an official SOC 2 risk-scoring methodology.
          </p>
        </div>
      )}
    </div>
  );
}
