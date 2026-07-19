"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { CompletionProgress } from "@/components/CompletionProgress";
import { AcknowledgeButton } from "@/components/AcknowledgeButton";
import type { Policy } from "@/lib/contracts";

export function PolicyCard({
  policy,
  employeeId,
  onAcknowledged,
}: {
  policy: Policy;
  employeeId: string;
  onAcknowledged: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {policy.name}{" "}
            <span className="font-normal text-zinc-500 dark:text-zinc-400">v{policy.version}</span>
          </p>
          <div className="mt-1">
            <StatusBadge
              label={policy.requiresAcknowledgement ? "Acknowledgement Required" : "Not Required"}
              tone={policy.requiresAcknowledgement ? "yellow" : "gray"}
            />
          </div>
        </div>

        {policy.requiresAcknowledgement ? (
          <AcknowledgeButton
            policyId={policy.id}
            employeeId={employeeId}
            alreadyAcknowledged={policy.currentUserAcknowledgement === "acknowledged"}
            onAcknowledged={onAcknowledged}
          />
        ) : (
          <StatusBadge label="No acknowledgement required" tone="gray" />
        )}
      </div>

      <div className="mt-3 max-w-sm">
        <CompletionProgress count={policy.acknowledgedCount} total={policy.totalEmployeeCount} />
      </div>

      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="mt-3 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        {expanded ? "Hide summary ▲" : "Show summary ▼"}
      </button>

      {expanded && (
        <div className="mt-2 rounded-md border border-zinc-100 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-zinc-900 dark:bg-zinc-900 dark:text-zinc-300">
          <p>
            {policy.description || "No summary is included for this policy template in this demo."}
          </p>
          <p className="mt-2 text-xs italic text-zinc-500 dark:text-zinc-400">
            This is a template for demonstration purposes only. It has not been reviewed by
            legal or compliance counsel and must not be adopted as-is.
          </p>
        </div>
      )}
    </div>
  );
}
