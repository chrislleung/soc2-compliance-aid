"use client";

import { useState } from "react";
import { runConnectorSync } from "@/lib/client/api";
import { ApiRequestError } from "@/lib/client/http";
import type { SyncResult } from "@/lib/contracts";

export function ConnectorSyncButton({
  onSynced,
}: {
  onSynced: (results: SyncResult[]) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleClick = async () => {
    setPending(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const results = await runConnectorSync();
      const failed = results.filter((result) => result.status === "error");
      setSuccessMessage(
        failed.length === 0
          ? `Synced ${results.length} connector${results.length === 1 ? "" : "s"} successfully.`
          : `Synced ${results.length - failed.length} of ${results.length} connectors; ${failed.length} failed.`,
      );
      onSynced(results);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Sync failed.");
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
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {pending ? "Syncing…" : "Run demo sync"}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
      {!error && successMessage && (
        <span role="status" className="text-xs text-emerald-700 dark:text-emerald-400">
          {successMessage}
        </span>
      )}
    </div>
  );
}
