import type {
  Control,
  ControlStatus,
  DashboardSummary,
  Employee,
  Evidence,
  OffboardingIssue,
  Policy,
  PolicyAcknowledgement,
  Risk,
} from "@/lib/contracts";

import type { DemoDataStore } from "@/server/repositories/demo-repository";

export function evaluateControls(store: DemoDataStore): Control[] {
  return store.controls.map((control) => ({
    ...control,
    status: evaluateControlStatus(control.id, store),
  }));
}

export function evaluateRiskAssessmentCoverage(risks: Risk[]): ControlStatus {
  return risks.length > 0 ? "compliant" : "non_compliant";
}

export function getDashboardSummary(store: DemoDataStore): DashboardSummary {
  const evaluatedControls = evaluateControls(store);
  const statusCounts: Record<ControlStatus, number> = {
    compliant: 0,
    at_risk: 0,
    non_compliant: 0,
    not_applicable: 0,
  };

  for (const control of evaluatedControls) {
    statusCounts[control.status] += 1;
  }

  const unresolvedOffboardingIssues = getUnresolvedOffboardingIssues(store.employees);
  const evaluatedControlCount = evaluatedControls.length - statusCounts.not_applicable;

  return {
    generatedAt: new Date().toISOString(),
    overallCompliancePercent:
      evaluatedControlCount === 0 ? 100 : Math.round((statusCounts.compliant / evaluatedControlCount) * 100),
    controlCountsByStatus: statusCounts,
    openRiskCount: store.risks.filter((risk) => risk.status === "open").length,
    openOffboardingIssueCount: unresolvedOffboardingIssues.length,
    pendingPolicyAcknowledgementCount: countMissingAcknowledgements(
      store.employees,
      store.policies,
      store.policyAcknowledgements,
    ),
    connectors: store.connectors.map(({ id, provider, displayName, status, lastSyncedAt, lastSyncResult }) => ({
      id,
      provider,
      displayName,
      status,
      lastSyncedAt,
      lastSyncResult,
    })),
  };
}

function evaluateControlStatus(controlId: string, store: DemoDataStore): ControlStatus {
  const relatedEvidence = store.evidence.filter((item) => item.controlIds.includes(controlId));

  if (relatedEvidence.length === 0) {
    return "not_applicable";
  }

  if (controlId === "cc-8" && evaluateRiskAssessmentCoverage(store.risks) === "non_compliant") {
    return "non_compliant";
  }

  if (controlId === "cc-3" && countOpenOffboardingIssues(store.employees) > 0) {
    return "non_compliant";
  }

  if (controlId === "cc-4" && countPendingPolicyAcknowledgements(store.policies) > 0) {
    return "at_risk";
  }

  if (hasExpiredEvidence(relatedEvidence) || hasFailingFinding(relatedEvidence)) {
    return "non_compliant";
  }

  if (hasExpiringEvidence(relatedEvidence) || hasWarningFinding(relatedEvidence) || hasOpenAccessRisk(controlId, store.risks)) {
    return "at_risk";
  }

  return "compliant";
}

function hasExpiredEvidence(evidence: Evidence[]): boolean {
  return evidence.some((item) => item.status === "expired");
}

function hasExpiringEvidence(evidence: Evidence[]): boolean {
  return evidence.some((item) => item.status === "expiring");
}

function hasFailingFinding(evidence: Evidence[]): boolean {
  return evidence.some((item) => item.metadata.findingOutcome === "fail");
}

function hasWarningFinding(evidence: Evidence[]): boolean {
  return evidence.some((item) => item.metadata.findingOutcome === "warning");
}

function hasOpenAccessRisk(controlId: string, risks: Risk[]): boolean {
  return controlId === "cc-1" && risks.some((risk) => risk.status === "open" && risk.category === "Access Control");
}

function countOpenOffboardingIssues(employees: Employee[]): number {
  return getUnresolvedOffboardingIssues(employees).length;
}

function countPendingPolicyAcknowledgements(policies: Policy[]): number {
  return policies.filter((policy) => policy.currentUserAcknowledgement === "pending").length;
}

function getUnresolvedOffboardingIssues(employees: Employee[]): OffboardingIssue[] {
  return employees
    .flatMap((employee) => employee.offboardingIssues)
    .filter((issue) => issue.status === "open");
}

function countMissingAcknowledgements(
  employees: Employee[],
  policies: Policy[],
  acknowledgements: PolicyAcknowledgement[],
): number {
  const acknowledgementPolicies = policies.filter((policy) => policy.requiresAcknowledgement);
  const activeEmployees = employees.filter((employee) => employee.status === "active");
  let totalMissingAcknowledgements = 0;

  for (const employee of activeEmployees) {
    for (const policy of acknowledgementPolicies) {
      const acknowledged = acknowledgements.some(
        (acknowledgement) => acknowledgement.employeeId === employee.id && acknowledgement.policyId === policy.id,
      );

      if (!acknowledged) {
        totalMissingAcknowledgements += 1;
      }
    }
  }

  return totalMissingAcknowledgements;
}
