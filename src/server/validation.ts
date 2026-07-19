import type {
  ConnectorProvider,
  CreateRiskRequest,
  EvidenceStatus,
  RiskImpact,
  RiskLikelihood,
} from "@/lib/contracts";
import type { ConnectorFindingOutcome } from "@/server/connectors/types";

import { apiError, isString } from "./api";

const connectorProviders = new Set<ConnectorProvider>(["aws", "azure", "github", "gusto", "rippling"]);
const evidenceStatuses = new Set<EvidenceStatus>(["valid", "expiring", "expired"]);
const findingOutcomes = new Set<ConnectorFindingOutcome>(["pass", "warning", "fail"]);
const riskLikelihoods = new Set<RiskLikelihood>(["low", "medium", "high"]);
const riskImpacts = new Set<RiskImpact>(["low", "medium", "high"]);

export type EvidenceStatusFilter = EvidenceStatus | ConnectorFindingOutcome;

export function parseConnectorProvider(value: string | null): ConnectorProvider | Response | undefined {
  if (value === null || value === "") {
    return undefined;
  }

  if (connectorProviders.has(value as ConnectorProvider)) {
    return value as ConnectorProvider;
  }

  return apiError(400, "invalid_provider", "Provider filter is not supported.", {
    allowed: Array.from(connectorProviders),
  });
}

export function parseEvidenceStatusFilter(value: string | null): EvidenceStatusFilter | Response | undefined {
  if (value === null || value === "") {
    return undefined;
  }

  if (evidenceStatuses.has(value as EvidenceStatus) || findingOutcomes.has(value as ConnectorFindingOutcome)) {
    return value as EvidenceStatusFilter;
  }

  return apiError(400, "invalid_evidence_status", "Evidence status filter is not supported.", {
    allowed: [...Array.from(evidenceStatuses), ...Array.from(findingOutcomes)],
  });
}

export function validateAcknowledgePolicyRequest(body: Record<string, unknown>): string | Response {
  if (!isString(body.employeeId)) {
    return apiError(400, "invalid_employee_id", "employeeId is required.");
  }

  return body.employeeId.trim();
}

export function validateSyncConnectorRequest(body: Record<string, unknown>): string | Response {
  if (!isString(body.connectorId)) {
    return apiError(400, "invalid_connector_id", "connectorId is required.");
  }

  return body.connectorId.trim();
}

export function validateCreateRiskRequest(body: Record<string, unknown>): CreateRiskRequest | Response {
  const missing = ["title", "description", "category", "owner"].filter((key) => !isString(body[key]));

  if (missing.length > 0) {
    return apiError(400, "invalid_risk_request", "Required risk fields are missing.", { missing });
  }

  if (!riskLikelihoods.has(body.likelihood as RiskLikelihood)) {
    return apiError(400, "invalid_likelihood", "likelihood must be low, medium, or high.");
  }

  if (!riskImpacts.has(body.impact as RiskImpact)) {
    return apiError(400, "invalid_impact", "impact must be low, medium, or high.");
  }

  if (body.mitigationPlan !== undefined && typeof body.mitigationPlan !== "string") {
    return apiError(400, "invalid_mitigation_plan", "mitigationPlan must be a string when provided.");
  }

  const title = body.title as string;
  const description = body.description as string;
  const category = body.category as string;
  const owner = body.owner as string;

  return {
    title: title.trim(),
    description: description.trim(),
    category: category.trim(),
    likelihood: body.likelihood as RiskLikelihood,
    impact: body.impact as RiskImpact,
    owner: owner.trim(),
    ...(typeof body.mitigationPlan === "string" ? { mitigationPlan: body.mitigationPlan.trim() } : {}),
  };
}
