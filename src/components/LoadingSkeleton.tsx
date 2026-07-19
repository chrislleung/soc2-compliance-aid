const PULSE = "animate-pulse rounded bg-zinc-200 dark:bg-zinc-800";

export function LoadingSkeleton({
  variant = "cards",
  count = 4,
  label = "Loading…",
}: {
  variant?: "cards" | "rows";
  count?: number;
  label?: string;
}) {
  if (variant === "rows") {
    return (
      <div role="status" aria-label={label} className="flex flex-col gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`h-14 w-full ${PULSE}`} />
        ))}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label={label}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`h-24 w-full ${PULSE}`} />
      ))}
    </div>
  );
}
