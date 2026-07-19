import type { ConnectorProvider, Control, Employee, Evidence, EvidenceStatus, OffboardingIssue, Policy } from "@/lib/contracts";

/**
 * Overall policy-acknowledgement completion, weighted by employee count
 * across every policy that requires acknowledgement. Returns null when
 * there's nothing to measure (no policies require acknowledgement, or
 * there are no employees), so callers can render "—" instead of a
 * misleading 0% or 100%.
 */
export function policyCompletionPercent(policies: Policy[]): number | null {
  const relevant = policies.filter((policy) => policy.requiresAcknowledgement);
  if (relevant.length === 0) return null;

  const totalAcknowledged = relevant.reduce((sum, policy) => sum + policy.acknowledgedCount, 0);
  const totalRequired = relevant.reduce((sum, policy) => sum + policy.totalEmployeeCount, 0);
  if (totalRequired === 0) return null;

  return (totalAcknowledged / totalRequired) * 100;
}

const ATTENTION_STATUSES = new Set<Control["status"]>(["at_risk", "non_compliant"]);

/**
 * Controls that aren't compliant, most severe first, then oldest
 * evaluation first. `status` itself is fully backend-determined; this
 * only filters and orders the already-computed values for display.
 */
export function controlsRequiringAttention(controls: Control[], limit = 10): Control[] {
  return controls
    .filter((control) => ATTENTION_STATUSES.has(control.status))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "non_compliant" ? -1 : 1;
      return a.lastEvaluatedAt < b.lastEvaluatedAt ? -1 : a.lastEvaluatedAt > b.lastEvaluatedAt ? 1 : 0;
    })
    .slice(0, limit);
}

/** Most recently collected evidence, for the dashboard's activity feed. */
export function recentEvidence(evidence: Evidence[], limit = 5): Evidence[] {
  return [...evidence]
    .sort((a, b) => (a.collectedAt < b.collectedAt ? 1 : a.collectedAt > b.collectedAt ? -1 : 0))
    .slice(0, limit);
}

/** The `metadata.resource` convention used by evidence records, when present. */
export function evidenceResource(evidence: Evidence): string {
  const resource = evidence.metadata.resource;
  return resource === undefined || resource === null ? "—" : String(resource);
}

export interface EvidenceFilters {
  provider?: ConnectorProvider | "";
  status?: EvidenceStatus | "";
  search?: string;
}

/** Provider, status, and free-text filtering over an already-fetched evidence list. */
export function filterEvidence(evidence: Evidence[], filters: EvidenceFilters): Evidence[] {
  const search = filters.search?.trim().toLowerCase();
  return evidence.filter((item) => {
    if (filters.provider && item.provider !== filters.provider) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (search) {
      const haystack = `${item.title} ${item.description} ${item.provider} ${evidenceResource(item)}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

/** Whether an employee has any offboarding issue the backend hasn't marked resolved. */
export function hasUnresolvedOffboardingIssues(employee: Employee): boolean {
  return employee.offboardingIssues.some((issue) => issue.status === "open");
}

/**
 * A terminated employee with at least one open offboarding issue — the
 * backend already flags the issue as open; this just checks that fact
 * against the employee's own terminal status, without asserting anything
 * about which system or what the compliance impact is.
 */
export function isTerminatedRetainingAccess(employee: Employee): boolean {
  return employee.status === "offboarded" && hasUnresolvedOffboardingIssues(employee);
}

/** Total open offboarding issues across all employees, for a dashboard-style summary count. */
export function unresolvedOffboardingIssueCount(employees: Employee[]): number {
  return employees.reduce(
    (sum, employee) =>
      sum + employee.offboardingIssues.filter((issue) => issue.status === "open").length,
    0,
  );
}

/**
 * Open offboarding issues whose free-text `system` field mentions the
 * given name (e.g. "aws"). This is a best-effort match, not a backend
 * determination of access state — see the employees page for context.
 */
export function openIssuesForSystem(employee: Employee, systemName: string): OffboardingIssue[] {
  const needle = systemName.toLowerCase();
  return employee.offboardingIssues.filter(
    (issue) => issue.status === "open" && issue.system.toLowerCase().includes(needle),
  );
}

export type EmployeeFilter = "all" | "active" | "terminated" | "has_issues";

/** Employment-status and issue-presence filtering over an already-fetched employee list. */
export function filterEmployees(employees: Employee[], filter: EmployeeFilter): Employee[] {
  switch (filter) {
    case "active":
      return employees.filter((employee) => employee.status === "active");
    case "terminated":
      return employees.filter((employee) => employee.status === "offboarded");
    case "has_issues":
      return employees.filter(hasUnresolvedOffboardingIssues);
    default:
      return employees;
  }
}
