import { completionPercent } from "@/lib/client/derive";
import { formatPercent } from "@/lib/client/format";

export function CompletionProgress({
  count,
  total,
}: {
  count: number;
  total: number;
}) {
  const percent = completionPercent(count, total);

  return (
    <div>
      <div
        role="progressbar"
        aria-valuenow={percent ?? 0}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
      >
        <div
          className="h-2 rounded-full bg-emerald-500"
          style={{ width: `${percent ?? 0}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {count} of {total} acknowledged ({percent === null ? "—" : formatPercent(percent)})
      </p>
    </div>
  );
}
