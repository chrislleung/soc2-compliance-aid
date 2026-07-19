"use client";

import { useState } from "react";
import { acknowledgePolicy } from "@/lib/client/api";
import { ApiRequestError } from "@/lib/client/http";

export function PolicyAcknowledgeButton({
  policyId,
  employeeId,
  alreadyAcknowledged,
  onAcknowledged,
}: {
  policyId: string;
  employeeId: string;
  alreadyAcknowledged: boolean;
  onAcknowledged: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (alreadyAcknowledged) {
    return (
      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
        Acknowledged
      </span>
    );
  }

  const handleClick = async () => {
    setPending(true);
    setError(null);
    try {
      await acknowledgePolicy(policyId, employeeId);
      onAcknowledged();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not record acknowledgement.",
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
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Saving…" : "Acknowledge"}
      </button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
