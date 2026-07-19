"use client";

import { Suspense, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { useApiResource } from "@/lib/client/useApiResource";
import { getControls, getEvidence } from "@/lib/client/api";
import { evidenceStatusLabel, evidenceStatusTone, formatDate } from "@/lib/client/format";
import type { Control, ConnectorProvider, Evidence } from "@/lib/contracts";

const PROVIDERS: ConnectorProvider[] = ["aws", "azure", "github", "gusto", "rippling"];

function EvidenceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const provider = (searchParams.get("provider") as ConnectorProvider | null) ?? "";
  const controlId = searchParams.get("controlId") ?? "";

  const evidenceFetcher = useCallback(
    () =>
      getEvidence({
        provider: provider || undefined,
        controlId: controlId || undefined,
      }),
    [provider, controlId],
  );
  const controlsFetcher = useCallback(() => getControls(), []);

  const evidence = useApiResource<Evidence[]>(evidenceFetcher);
  const controls = useApiResource<Control[]>(controlsFetcher);

  const controlNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const control of controls.data ?? []) map.set(control.id, control.name);
    return map;
  }, [controls.data]);

  const updateFilter = (key: "provider" | "controlId", value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/evidence${next.toString() ? `?${next.toString()}` : ""}`);
  };

  const loading = evidence.loading || controls.loading;
  const error = evidence.error ?? controls.error;

  return (
    <div>
      <PageHeader
        title="Evidence"
        description="Mock evidence collected from connected providers, mapped to the controls they support."
      />

      <div className="mb-6 flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Provider
          <select
            value={provider}
            onChange={(e) => updateFilter("provider", e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">All providers</option>
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Control
          <select
            value={controlId}
            onChange={(e) => updateFilter("controlId", e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">All controls</option>
            {(controls.data ?? []).map((control) => (
              <option key={control.id} value={control.id}>
                {control.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <LoadingState label="Loading evidence…" />}
      {!loading && error && (
        <ErrorState message={error} onRetry={() => { evidence.refetch(); controls.refetch(); }} />
      )}
      {!loading && !error && (evidence.data?.length ?? 0) === 0 && (
        <EmptyState message="No evidence matches these filters." />
      )}
      {!loading && !error && (evidence.data?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-3">
          {evidence.data!.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {item.description}
                  </p>
                </div>
                <StatusBadge label={evidenceStatusLabel(item.status)} tone={evidenceStatusTone(item.status)} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span>Provider: {item.provider}</span>
                <span>Collected {formatDate(item.collectedAt)}</span>
                <span>Expires {formatDate(item.expiresAt)}</span>
                {item.controlIds.length > 0 && (
                  <span>
                    Controls:{" "}
                    {item.controlIds
                      .map((id) => controlNameById.get(id) ?? id)
                      .join(", ")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EvidencePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading evidence…" />}>
      <EvidenceContent />
    </Suspense>
  );
}
