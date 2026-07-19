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
  return risks.length > 0 ? "pass" : "fail";
}

export function getDashboardSummary(store: DemoDataStore): DashboardSummary {
  const evaluatedControls = evaluateControls(store);
  const statusCounts: Record<ControlStatus, number> = {
    pass: 0,
    warning: 0,
    fail: 0,
  };

  for (const control of evaluatedControls) {
    statusCounts[control.status] += 1;
  }

  const unresolvedOffboardingIssues = getUnresolvedOffboardingIssues(store.employees);
  const policyMetrics = calculatePolicyMetrics(store.employees, store.policies, store.policyAcknowledgements);
  const totalControlCount = evaluatedControls.length;

  return {
    generatedAt: new Date().toISOString(),
    lastDataRefreshAt: store.lastDataRefreshAt,
    overallCompliancePercent: totalControlCount === 0 ? 100 : Math.round((statusCounts.pass / totalControlCount) * 100),
    controlCounts: {
      total: totalControlCount,
      pass: statusCounts.pass,
      warning: statusCounts.warning,
      fail: statusCounts.fail,
    },
    openRiskCount: store.risks.filter((risk) => risk.status === "open").length,
    openOffboardingIssueCount: unresolvedOffboardingIssues.length,
    policyMetrics,
    connectors: store.connectors.map(({ id, provider, displayName, connectionStatus, lastSyncStatus, lastSyncedAt, lastError }) => ({
      id,
      provider,
      displayName,
      connectionStatus,
      lastSyncStatus,
      lastSyncedAt,
      lastError,
    })),
    recentEvidence: getRecentEvidence(store.evidence, 5),
    unresolvedOffboardingIssues,
  };
}

function evaluateControlStatus(controlId: string, store: DemoDataStore): ControlStatus {
  const relatedEvidence = store.evidence.filter((item) => item.controlIds.includes(controlId));

  if (relatedEvidence.length === 0) {
    return "fail";
  }

  if (controlId === "cc-8" && evaluateRiskAssessmentCoverage(store.risks) === "fail") {
    return "fail";
  }

  if (controlId === "cc-3" && countOpenOffboardingIssues(store.employees) > 0) {
    return "fail";
  }

  if (controlId === "cc-4" && countPendingPolicyAcknowledgements(store.policies) > 0) {
    return "warning";
  }

  if (hasExpiredEvidence(relatedEvidence) || hasFailingFinding(relatedEvidence)) {
    return "fail";
  }

  if (hasExpiringEvidence(relatedEvidence) || hasWarningFinding(relatedEvidence) || hasOpenAccessRisk(controlId, store.risks)) {
    return "warning";
  }

  return "pass";
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

function getRecentEvidence(evidence: Evidence[], limit: number): Evidence[] {
  return [...evidence]
    .sort((left, right) => right.collectedAt.localeCompare(left.collectedAt))
    .slice(0, limit);
}

function getUnresolvedOffboardingIssues(employees: Employee[]): OffboardingIssue[] {
  return employees
    .flatMap((employee) => employee.offboardingIssues)
    .filter((issue) => issue.status === "open");
}

function calculatePolicyMetrics(
  employees: Employee[],
  policies: Policy[],
  acknowledgements: PolicyAcknowledgement[],
): DashboardSummary["policyMetrics"] {
  const acknowledgementPolicies = policies.filter((policy) => policy.requiresAcknowledgement);
  const activeEmployees = employees.filter((employee) => employee.status === "active");
  const pendingEmployeeIds = new Set<string>();
  let totalMissingAcknowledgements = 0;

  for (const employee of activeEmployees) {
    for (const policy of acknowledgementPolicies) {
      const acknowledged = acknowledgements.some(
        (acknowledgement) => acknowledgement.employeeId === employee.id && acknowledgement.policyId === policy.id,
      );

      if (!acknowledged) {
        pendingEmployeeIds.add(employee.id);
        totalMissingAcknowledgements += 1;
      }
    }
  }

  const requiredAcknowledgementCount = activeEmployees.length * acknowledgementPolicies.length;

  if (requiredAcknowledgementCount === 0) {
    return {
      completionPercentage: 100,
      employeesWithPendingPolicies: 0,
      totalMissingAcknowledgements: 0,
    };
  }

  return {
    completionPercentage: Math.round(
      ((requiredAcknowledgementCount - totalMissingAcknowledgements) / requiredAcknowledgementCount) * 100,
    ),
    employeesWithPendingPolicies: pendingEmployeeIds.size,
    totalMissingAcknowledgements,
  };
}
