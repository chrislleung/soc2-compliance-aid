"use client";

import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { SummaryCard } from "@/components/SummaryCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { useApiResource } from "@/lib/client/useApiResource";
import { getEmployees } from "@/lib/client/api";
import {
  filterEmployees,
  isTerminatedRetainingAccess,
  openIssuesForSystem,
  unresolvedOffboardingIssueCount,
  type EmployeeFilter,
} from "@/lib/client/derive";
import { formatDate, offboardingIssueTypeLabel } from "@/lib/client/format";
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

const ACCESS_SYSTEMS = [
  { name: "aws", label: "AWS" },
  { name: "azure", label: "Azure" },
  { name: "github", label: "GitHub" },
];

const FILTER_OPTIONS: { value: EmployeeFilter; label: string }[] = [
  { value: "all", label: "All employees" },
  { value: "active", label: "Active" },
  { value: "terminated", label: "Terminated" },
  { value: "has_issues", label: "Has offboarding issues" },
];

function AccessStatusCell({ employee, systemName }: { employee: Employee; systemName: string }) {
  const openIssues = openIssuesForSystem(employee, systemName);
  if (openIssues.length === 0) {
    return <StatusBadge label="No Issues Flagged" tone="gray" />;
  }
  return (
    <StatusBadge label={openIssues.map((issue) => offboardingIssueTypeLabel(issue.issueType)).join(", ")} tone="red" />
  );
}

export default function EmployeesPage() {
  const fetcher = useCallback(() => getEmployees(), []);
  const { data, loading, error, refetch } = useApiResource<Employee[]>(fetcher);
  const [filter, setFilter] = useState<EmployeeFilter>("all");

  const filtered = useMemo(() => filterEmployees(data ?? [], filter), [data, filter]);
  const unresolvedCount = useMemo(() => unresolvedOffboardingIssueCount(data ?? []), [data]);

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Employee records from Gusto and Rippling, including access status flagged by connected systems."
      />

      {!loading && !error && data && (
        <div className="mb-6 max-w-xs">
          <SummaryCard label="Unresolved Offboarding Issues" value={String(unresolvedCount)} />
        </div>
      )}

      <div className="mb-6">
        <label className="flex max-w-xs flex-col gap-1 text-sm">
          Filter
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as EmployeeFilter)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <LoadingSkeleton variant="rows" count={5} label="Loading employees…" />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState message="No employees match this filter." />
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((employee) => {
            const retainsAccess = isTerminatedRetainingAccess(employee);
            return (
              <div
                key={employee.id}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {employee.name}
                      </p>
                      {retainsAccess && (
                        <StatusBadge label="Terminated — Retains Access" tone="red" />
                      )}
                    </div>
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
                  <span>Terminated {formatDate(employee.terminationDate)}</span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 border-t border-zinc-100 pt-3 sm:grid-cols-3 dark:border-zinc-900">
                  {ACCESS_SYSTEMS.map((system) => (
                    <div key={system.name} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-zinc-700 dark:text-zinc-300">{system.label}</span>
                      <AccessStatusCell employee={employee} systemName={system.name} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
