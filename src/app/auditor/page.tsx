"use client";

import { useCallback, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { AuditorExportButton } from "@/components/AuditorExportButton";
import { useApiResource } from "@/lib/client/useApiResource";
import { getControls, getEvidence } from "@/lib/client/api";
import { controlStatusLabel, controlStatusTone, formatDate } from "@/lib/client/format";
import type { Control, Evidence } from "@/lib/contracts";

export default function AuditorPage() {
  const controlsFetcher = useCallback(() => getControls(), []);
  const evidenceFetcher = useCallback(() => getEvidence(), []);
  const controls = useApiResource<Control[]>(controlsFetcher);
  const evidence = useApiResource<Evidence[]>(evidenceFetcher);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  const loading = controls.loading || evidence.loading;
  const error = controls.error ?? evidence.error;

  return (
    <div>
      <PageHeader
        title="Auditor Portal"
        description="Read-only view of controls and supporting evidence. This is a demonstration aid, not an auditor, SOC 2 attestation, or official compliance determination."
        action={<AuditorExportButton onExported={setExportUrl} />}
      />

      {exportUrl && (
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Evidence package ready —{" "}
          <a
            href={exportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            open it again
          </a>
          .
        </p>
      )}

      {loading && <LoadingState label="Loading auditor view…" />}
      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={() => {
            controls.refetch();
            evidence.refetch();
          }}
        />
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Controls
            </h2>
            {(controls.data?.length ?? 0) === 0 ? (
              <EmptyState message="No controls found." />
            ) : (
              <div className="flex flex-col gap-2">
                {controls.data!.map((control) => (
                  <div
                    key={control.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {control.name}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {control.description}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {control.relatedEvidenceIds.length} supporting evidence item(s) ·
                        last evaluated {formatDate(control.lastEvaluatedAt)}
                      </p>
                    </div>
                    <StatusBadge
                      label={controlStatusLabel(control.status)}
                      tone={controlStatusTone(control.status)}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Evidence
            </h2>
            {(evidence.data?.length ?? 0) === 0 ? (
              <EmptyState message="No evidence found." />
            ) : (
              <div className="flex flex-col gap-2">
                {evidence.data!.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {item.title}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {item.provider} · collected {formatDate(item.collectedAt)}
                    </span>
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
