import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import type { ConnectorProvider } from "@/lib/contracts";
import { getDemoConnector, getDemoConnectors } from "@/server/connectors/mock-connectors";
import { getConnectorById, getConnectorByProvider, listRegisteredConnectors } from "@/server/connectors/registry";
import { syncConnectorAdapters, syncConnectorByProvider } from "@/server/connectors/sync-service";
import type { DemoConnector, EvidenceItem } from "@/server/connectors/types";

describe("mock connectors", () => {
  it("provides one deterministic connector per supported provider", () => {
    const connectors = listRegisteredConnectors();

    assert.deepEqual(
      connectors.map((connector) => connector.provider),
      ["aws", "azure", "github", "gusto", "rippling"],
    );
  });

  it("tests connections and simulates sync without live provider calls", () => {
    const connector = getConnectorByProvider("aws");
    const connection = connector.testConnection();
    const result = syncConnectorByProvider("aws");

    assert.equal(connection.ok, true);
    assert.equal(connection.mode, "mock");
    assert.equal(result.connectorId, "conn-aws");
    assert.equal(result.provider, "aws");
    assert.equal(result.status, "success");
    assert.equal(result.recordsProcessed, connector.collectEvidence().length);
  });

  it("collects provider-scoped mock evidence normalized as evidence items", () => {
    const evidence = getDemoConnector("github").collectEvidence();

    assert.ok(evidence.length > 0);
    assert.ok(evidence.every((item) => item.provider === "github"));
    assert.ok(evidence.every((item) => item.metadata.mockMode === true));
  });

  it("returns AWS database encryption and IAM MFA pass/fail findings", () => {
    const evidence = getDemoConnector("aws").collectEvidence();
    const databaseEncryption = evidence.filter((item) => item.metadata.findingType === "database_encryption");
    const iamMfa = evidence.filter((item) => item.metadata.findingType === "iam_user_mfa");

    assert.ok(databaseEncryption.some((item) => item.metadata.findingOutcome === "pass"));
    assert.ok(databaseEncryption.some((item) => item.metadata.findingOutcome === "fail"));
    assert.ok(iamMfa.some((item) => item.metadata.findingOutcome === "pass"));
    assert.ok(iamMfa.some((item) => item.metadata.findingOutcome === "fail"));
  });

  it("returns Azure encryption and Entra ID MFA findings with a warning", () => {
    const evidence = getDemoConnector("azure").collectEvidence();

    assert.ok(evidence.some((item) => item.metadata.findingType === "database_encryption"));
    assert.ok(evidence.some((item) => item.metadata.findingType === "storage_encryption"));
    assert.ok(evidence.some((item) => item.metadata.findingType === "entra_id_mfa"));
    assert.ok(evidence.some((item) => item.metadata.findingOutcome === "pass"));
    assert.ok(evidence.some((item) => item.metadata.findingOutcome === "warning"));
  });

  it("returns GitHub branch protection and PR review findings with one inadequate repository", () => {
    const evidence = getDemoConnector("github").collectEvidence();
    const unprotectedRepository = evidence.find((item) => item.metadata.repository === "internal-runbooks");

    assert.ok(evidence.some((item) => item.metadata.findingType === "branch_protection"));
    assert.ok(evidence.some((item) => item.metadata.findingType === "pull_request_review_requirement"));
    assert.equal(unprotectedRepository?.metadata.findingOutcome, "fail");
    assert.equal(unprotectedRepository?.metadata.requiredStatusChecks, false);
  });

  it("returns Gusto employee identity, employment, and onboarding data", () => {
    const employeeEvidence = getDemoConnector("gusto")
      .collectEvidence()
      .filter((item) => item.metadata.recordType === "employee_roster");

    assert.ok(employeeEvidence.length > 0);
    assert.ok(employeeEvidence.every((item) => typeof item.metadata.employeeId === "string"));
    assert.ok(employeeEvidence.every((item) => typeof item.metadata.name === "string"));
    assert.ok(employeeEvidence.every((item) => typeof item.metadata.email === "string"));
    assert.ok(employeeEvidence.every((item) => typeof item.metadata.employmentStatus === "string"));
    assert.ok(employeeEvidence.every((item) => typeof item.metadata.onboardingStatus === "string"));
  });

  it("returns Rippling employee termination and background-check data", () => {
    const employeeEvidence = getDemoConnector("rippling")
      .collectEvidence()
      .filter((item) => item.metadata.recordType === "employee_roster");

    assert.ok(employeeEvidence.length > 0);
    assert.ok(employeeEvidence.some((item) => item.metadata.employmentStatus === "terminated"));
    assert.ok(employeeEvidence.some((item) => item.metadata.terminationTimestamp === "2026-06-30T00:00:00.000Z"));
    assert.ok(employeeEvidence.every((item) => typeof item.metadata.backgroundCheckStatus === "string"));
  });

  it("looks up connectors by connector id through the registry", () => {
    assert.equal(getConnectorById("conn-github")?.provider, "github");
    assert.equal(getConnectorById("conn-missing"), null);
    assert.equal(getDemoConnectors().length, 5);
  });

  it("records a connector error without crashing the entire sync", () => {
    const results = syncConnectorAdapters([
      throwingConnector("aws", "AWS mock sync failed"),
      ...listRegisteredConnectors().filter((connector) => connector.provider !== "aws"),
    ]);
    const awsResult = results.find((result) => result.provider === "aws");

    assert.equal(results.length, 5);
    assert.equal(awsResult?.status, "error");
    assert.equal(awsResult?.recordsProcessed, 0);
    assert.ok(awsResult?.errors.includes("AWS mock sync failed"));
    assert.ok(results.some((result) => result.provider !== "aws" && result.status === "success"));
  });
});

function throwingConnector(provider: ConnectorProvider, message: string): DemoConnector {
  return {
    provider,
    testConnection() {
      return {
        provider,
        ok: true,
        checkedAt: "2026-07-18T12:00:00.000Z",
        mode: "mock",
        message: "Connection succeeds before collection fails.",
      };
    },
    collectEvidence(): EvidenceItem[] {
      throw new Error(message);
    },
    getLastSyncStatus() {
      return {
        connectorId: `conn-${provider}`,
        provider,
        status: "success",
        startedAt: "2026-07-18T11:58:00.000Z",
        finishedAt: "2026-07-18T11:59:04.000Z",
        recordsProcessed: 1,
        errors: [],
      };
    },
    sync() {
      return this.getLastSyncStatus();
    },
  };
}
