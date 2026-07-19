import { describe, expect, test } from "vitest";
import {
  connectorSyncStatusLabel,
  controlStatusLabel,
  controlStatusTone,
  evidenceStatusLabel,
  formatDate,
  formatPercent,
  offboardingIssueStatusTone,
  offboardingIssueTypeLabel,
  riskStatusLabel,
} from "@/lib/client/format";

describe("formatDate", () => {
  test("returns a placeholder for null", () => {
    expect(formatDate(null)).toBe("—");
  });

  test("returns a placeholder for an invalid string", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });

  test("formats a valid ISO date", () => {
    expect(formatDate("2026-01-15T00:00:00.000Z")).toBe("Jan 15, 2026");
  });
});

test("formatPercent rounds to the nearest whole number", () => {
  expect(formatPercent(87.4)).toBe("87%");
  expect(formatPercent(87.6)).toBe("88%");
});

test("controlStatusLabel covers every ControlStatus", () => {
  expect(controlStatusLabel("compliant")).toBe("Compliant");
  expect(controlStatusLabel("at_risk")).toBe("At Risk");
  expect(controlStatusLabel("non_compliant")).toBe("Non-Compliant");
  expect(controlStatusLabel("not_applicable")).toBe("Not Applicable");
});

test("controlStatusTone maps non_compliant to red and compliant to green", () => {
  expect(controlStatusTone("non_compliant")).toBe("red");
  expect(controlStatusTone("compliant")).toBe("green");
});

test("evidenceStatusLabel covers every EvidenceStatus", () => {
  expect(evidenceStatusLabel("valid")).toBe("Valid");
  expect(evidenceStatusLabel("expiring")).toBe("Expiring Soon");
  expect(evidenceStatusLabel("expired")).toBe("Expired");
});

test("riskStatusLabel covers every RiskStatus", () => {
  expect(riskStatusLabel("open")).toBe("Open");
  expect(riskStatusLabel("mitigated")).toBe("Mitigated");
  expect(riskStatusLabel("accepted")).toBe("Accepted");
  expect(riskStatusLabel("closed")).toBe("Closed");
});

test("offboardingIssueStatusTone marks open issues red and resolved green", () => {
  expect(offboardingIssueStatusTone("open")).toBe("red");
  expect(offboardingIssueStatusTone("resolved")).toBe("green");
});

test("offboardingIssueTypeLabel covers every OffboardingIssueType", () => {
  expect(offboardingIssueTypeLabel("access_not_revoked")).toBe("Access Not Revoked");
  expect(offboardingIssueTypeLabel("device_not_returned")).toBe("Device Not Returned");
  expect(offboardingIssueTypeLabel("account_still_active")).toBe("Account Still Active");
  expect(offboardingIssueTypeLabel("other")).toBe("Other");
});

test("connectorSyncStatusLabel covers every ConnectorSyncStatus", () => {
  expect(connectorSyncStatusLabel("idle")).toBe("Idle");
  expect(connectorSyncStatusLabel("syncing")).toBe("Syncing");
  expect(connectorSyncStatusLabel("success")).toBe("Synced");
  expect(connectorSyncStatusLabel("error")).toBe("Sync Failed");
});
