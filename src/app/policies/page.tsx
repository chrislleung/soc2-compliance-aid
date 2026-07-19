"use client";

import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { EmployeeSelector } from "@/components/EmployeeSelector";
import { PolicyCard } from "@/components/PolicyCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
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
        description="Company policy templates and acknowledgement tracking across all employees."
      />

      <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        The policies below are generic templates provided for demonstration purposes only. They
        have not been reviewed by legal or compliance counsel and must be reviewed by a qualified
        professional before adoption.
      </div>

      {!loading && !error && (employees.data?.length ?? 0) > 0 && (
        <div className="mb-6">
          <EmployeeSelector
            employees={employees.data!}
            value={selectedEmployeeId}
            onChange={setEmployeeId}
            label="Acknowledging as"
          />
        </div>
      )}

      {loading && <LoadingSkeleton variant="rows" count={5} label="Loading policies…" />}
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
            <PolicyCard
              key={policy.id}
              policy={policy}
              employeeId={selectedEmployeeId}
              onAcknowledged={policies.refetch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
