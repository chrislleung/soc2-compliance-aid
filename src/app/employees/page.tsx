"use client";

import { useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { useApiResource } from "@/lib/client/useApiResource";
import { getEmployees } from "@/lib/client/api";
import { formatDate, offboardingIssueStatusLabel, offboardingIssueStatusTone } from "@/lib/client/format";
import type { Employee } from "@/lib/contracts";

const EMPLOYEE_STATUS_LABELS: Record<Employee["status"], string> = {
  active: "Active",
  offboarding: "Offboarding",
  offboarded: "Offboarded",
};

const EMPLOYEE_STATUS_TONES: Record<Employee["status"], "green" | "yellow" | "gray"> = {
  active: "green",
  offboarding: "yellow",
  offboarded: "gray",
};

export default function EmployeesPage() {
  const fetcher = useCallback(() => getEmployees(), []);
  const { data, loading, error, refetch } = useApiResource<Employee[]>(fetcher);

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Employee records from Gusto and Rippling, including open offboarding issues."
      />

      {loading && <LoadingState label="Loading employees…" />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && (data?.length ?? 0) === 0 && (
        <EmptyState message="No employee records found." />
      )}
      {!loading && !error && (data?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-3">
          {data!.map((employee) => (
            <div
              key={employee.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {employee.name}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{employee.email}</p>
                </div>
                <StatusBadge
                  label={EMPLOYEE_STATUS_LABELS[employee.status]}
                  tone={EMPLOYEE_STATUS_TONES[employee.status]}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span>Source: {employee.source}</span>
                <span>Start {formatDate(employee.startDate)}</span>
                {employee.terminationDate && (
                  <span>Terminated {formatDate(employee.terminationDate)}</span>
                )}
              </div>

              {employee.offboardingIssues.length > 0 && (
                <div className="mt-3 flex flex-col gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  {employee.offboardingIssues.map((issue) => (
                    <div key={issue.id} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {issue.issueType.replace(/_/g, " ")} — {issue.system}
                      </span>
                      <StatusBadge
                        label={offboardingIssueStatusLabel(issue.status)}
                        tone={offboardingIssueStatusTone(issue.status)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
