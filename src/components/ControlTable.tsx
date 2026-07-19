import { StatusBadge } from "@/components/StatusBadge";
import { controlStatusLabel, controlStatusTone, formatDate } from "@/lib/client/format";
import type { Control } from "@/lib/contracts";

export function ControlTable({ controls }: { controls: Control[] }) {
  return (
    <>
      {/* Table layout for md+ screens */}
      <table className="hidden w-full text-left text-sm md:table">
        <thead>
          <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th className="py-2 pr-4 font-medium">Control</th>
            <th className="py-2 pr-4 font-medium">Category</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">Last Evaluated</th>
          </tr>
        </thead>
        <tbody>
          {controls.map((control) => (
            <tr
              key={control.id}
              className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
            >
              <td className="py-3 pr-4 font-medium text-zinc-900 dark:text-zinc-50">
                {control.name}
              </td>
              <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">{control.category}</td>
              <td className="py-3 pr-4">
                <StatusBadge
                  label={controlStatusLabel(control.status)}
                  tone={controlStatusTone(control.status)}
                />
              </td>
              <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                {formatDate(control.lastEvaluatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Stacked card layout for narrow screens */}
      <div className="flex flex-col gap-2 md:hidden">
        {controls.map((control) => (
          <div
            key={control.id}
            className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {control.name}
              </p>
              <StatusBadge
                label={controlStatusLabel(control.status)}
                tone={controlStatusTone(control.status)}
              />
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {control.category} · Last evaluated {formatDate(control.lastEvaluatedAt)}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
