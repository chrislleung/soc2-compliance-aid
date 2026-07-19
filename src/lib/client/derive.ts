import type { Control, Evidence, Policy } from "@/lib/contracts";

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
