import type { BadgeTone } from "@/lib/client/format";

const TONE_CLASSES: Record<BadgeTone, string> = {
  green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  yellow: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  red: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  gray: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

// Icons (not just color) distinguish tones for colorblind users and non-color contexts.
const TONE_ICONS: Record<BadgeTone, string> = {
  green: "✓", // check mark
  yellow: "⚠", // warning triangle
  red: "✕", // cross
  gray: "–", // en dash
};

export function StatusBadge({ label, tone }: { label: string; tone: BadgeTone }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      <span aria-hidden="true">{TONE_ICONS[tone]}</span>
      {label}
    </span>
  );
}
