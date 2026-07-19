import { StatusBadge } from "@/components/StatusBadge";
import { evidenceStatusLabel, evidenceStatusTone, formatDate } from "@/lib/client/format";
import type { Evidence } from "@/lib/contracts";

export function EvidenceTable({ evidence }: { evidence: Evidence[] }) {
  return (
    <>
      {/* Table layout for md+ screens */}
      <table className="hidden w-full text-left text-sm md:table">
        <thead>
          <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th className="py-2 pr-4 font-medium">Evidence</th>
            <th className="py-2 pr-4 font-medium">Provider</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">Collected</th>
          </tr>
        </thead>
        <tbody>
          {evidence.map((item) => (
            <tr
              key={item.id}
              className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
            >
              <td className="py-3 pr-4 font-medium text-zinc-900 dark:text-zinc-50">
                {item.title}
              </td>
              <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">{item.provider}</td>
              <td className="py-3 pr-4">
                <StatusBadge
                  label={evidenceStatusLabel(item.status)}
                  tone={evidenceStatusTone(item.status)}
                />
              </td>
              <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                {formatDate(item.collectedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Stacked card layout for narrow screens */}
      <div className="flex flex-col gap-2 md:hidden">
        {evidence.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
              <StatusBadge
                label={evidenceStatusLabel(item.status)}
                tone={evidenceStatusTone(item.status)}
              />
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {item.provider} · Collected {formatDate(item.collectedAt)}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
