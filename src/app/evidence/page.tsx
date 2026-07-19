"use client";

import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { useApiResource } from "@/lib/client/useApiResource";
import { getControls, getEvidence } from "@/lib/client/api";
import { evidenceResource, filterEvidence } from "@/lib/client/derive";
import { evidenceStatusLabel, evidenceStatusTone, formatDate } from "@/lib/client/format";
import type { Control, ConnectorProvider, Evidence, EvidenceStatus } from "@/lib/contracts";

const PROVIDERS: ConnectorProvider[] = ["aws", "azure", "github", "gusto", "rippling"];
const STATUSES: EvidenceStatus[] = ["valid", "expiring", "expired"];

export default function EvidencePage() {
  const evidenceFetcher = useCallback(() => getEvidence(), []);
  const controlsFetcher = useCallback(() => getControls(), []);
  const evidence = useApiResource<Evidence[]>(evidenceFetcher);
  const controls = useApiResource<Control[]>(controlsFetcher);

  const [provider, setProvider] = useState<ConnectorProvider | "">("");
  const [status, setStatus] = useState<EvidenceStatus | "">("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const controlNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const control of controls.data ?? []) map.set(control.id, control.name);
    return map;
  }, [controls.data]);

  const filtered = useMemo(
    () => filterEvidence(evidence.data ?? [], { provider, status, search }),
    [evidence.data, provider, status, search],
  );

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
            onChange={(e) => setProvider(e.target.value as ConnectorProvider | "")}
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
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EvidenceStatus | "")}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {evidenceStatusLabel(s)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 min-w-[200px] flex-col gap-1 text-sm">
          Search
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, summary, or resource…"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      </div>

      {loading && <LoadingSkeleton variant="rows" count={5} label="Loading evidence…" />}
      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={() => {
            evidence.refetch();
            controls.refetch();
          }}
        />
      )}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState message="No evidence matches these filters." />
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => {
            const expanded = expandedId === item.id;
            const controlNames = item.controlIds.map((id) => controlNameById.get(id) ?? id);
            return (
              <div
                key={item.id}
                className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : item.id)}
                  aria-expanded={expanded}
                  className="flex w-full flex-col gap-2 p-4 text-left sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {item.description}
                    </p>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-500 sm:grid-cols-4 dark:text-zinc-400">
                      <div>
                        <dt className="font-medium">Timestamp</dt>
                        <dd>{formatDate(item.collectedAt)}</dd>
                      </div>
                      <div>
                        <dt className="font-medium">Provider</dt>
                        <dd>{item.provider}</dd>
                      </div>
                      <div>
                        <dt className="font-medium">Control</dt>
                        <dd>{controlNames.length > 0 ? controlNames.join(", ") : "—"}</dd>
                      </div>
                      <div>
                        <dt className="font-medium">Resource</dt>
                        <dd>{evidenceResource(item)}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      label={evidenceStatusLabel(item.status)}
                      tone={evidenceStatusTone(item.status)}
                    />
                    <span aria-hidden="true" className="text-xs text-zinc-400">
                      {expanded ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-900">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Metadata
                    </p>
                    {Object.keys(item.metadata).length === 0 ? (
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        No additional metadata.
                      </p>
                    ) : (
                      <dl className="mt-1 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                        {Object.entries(item.metadata).map(([key, value]) => (
                          <div key={key} className="flex justify-between gap-2 sm:justify-start">
                            <dt className="text-zinc-500 dark:text-zinc-400">{key}</dt>
                            <dd className="text-zinc-900 dark:text-zinc-50">{String(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      Expires {formatDate(item.expiresAt)} · Evidence ID {item.id}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
