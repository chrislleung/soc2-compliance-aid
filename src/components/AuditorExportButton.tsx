"use client";

import { useState } from "react";
import { getAuditorExportUrl } from "@/lib/client/api";
import { ApiRequestError } from "@/lib/client/http";
import { filenameFromUrl } from "@/lib/client/derive";

const FALLBACK_FILENAME = "evidence-package.zip";

export function AuditorExportButton({
  onExported,
}: {
  onExported: (result: { url: string; filename: string }) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setPending(true);
    setError(null);
    try {
      const url = await getAuditorExportUrl();
      const filename = filenameFromUrl(url) ?? FALLBACK_FILENAME;

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onExported({ url, filename });
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not download the evidence package. Try again in a moment.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Preparing package…" : "Download Evidence Package"}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </div>
  );
}
