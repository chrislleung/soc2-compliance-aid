"use client";

import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { PolicyAcknowledgeButton } from "@/components/PolicyAcknowledgeButton";
import { useApiResource } from "@/lib/client/useApiResource";
import { getEmployees, getPolicies } from "@/lib/client/api";
import type { Employee, Policy } from "@/lib/contracts";

export default function PoliciesPage() {
  const [employeeId, setEmployeeId] = useState<string>("");

  const policiesFetcher = useCallback(() => getPolicies(), []);
  const employeesFetcher = useCallback(() => getEmployees(), []);

  const policies = useApiResource<Policy[]>(policiesFetcher);
  const employees = useApiResource<Employee[]>(employeesFetcher);

  const selectedEmployeeId = useMemo(() => {
    if (employeeId) return employeeId;
    return employees.data?.[0]?.id ?? "";
  }, [employeeId, employees.data]);

  const loading = policies.loading || employees.loading;
  const error = policies.error ?? employees.error;

  return (
    <div>
      <PageHeader
        title="Policies"
        description="Company policies and acknowledgement tracking across all employees."
      />

      {!loading && !error && (employees.data?.length ?? 0) > 0 && (
        <label className="mb-6 flex max-w-xs flex-col gap-1 text-sm">
          Acknowledging as
          <select
            value={selectedEmployeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {employees.data!.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {loading && <LoadingState label="Loading policies…" />}
      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={() => {
            policies.refetch();
            employees.refetch();
          }}
        />
      )}
      {!loading && !error && (policies.data?.length ?? 0) === 0 && (
        <EmptyState message="No policies found." />
      )}
      {!loading && !error && (policies.data?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-3">
          {policies.data!.map((policy) => (
            <div
              key={policy.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {policy.name}{" "}
                  <span className="font-normal text-zinc-500 dark:text-zinc-400">
                    v{policy.version}
                  </span>
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {policy.description}
                </p>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {policy.acknowledgedCount} of {policy.totalEmployeeCount} employees
                  acknowledged
                </p>
              </div>

              {policy.requiresAcknowledgement && selectedEmployeeId && (
                <PolicyAcknowledgeButton
                  policyId={policy.id}
                  employeeId={selectedEmployeeId}
                  alreadyAcknowledged={policy.currentUserAcknowledgement === "acknowledged"}
                  onAcknowledged={policies.refetch}
                />
              )}
              {!policy.requiresAcknowledgement && (
                <StatusBadge label="No acknowledgement required" tone="gray" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
