import test from "node:test";
import assert from "node:assert/strict";
import {
  connectorSyncStatusLabel,
  controlStatusLabel,
  controlStatusTone,
  evidenceStatusLabel,
  formatDate,
  formatPercent,
  offboardingIssueStatusTone,
  offboardingIssueTypeLabel,
  riskSeverityTone,
  riskStatusLabel,
} from "../../src/lib/client/format.ts";

test("formatDate returns a placeholder for null", () => {
  assert.equal(formatDate(null), "—");
});

test("formatDate returns a placeholder for an invalid string", () => {
  assert.equal(formatDate("not-a-date"), "—");
});

test("formatDate formats a valid ISO date", () => {
  assert.equal(formatDate("2026-01-15T00:00:00.000Z"), "Jan 15, 2026");
});

test("formatPercent rounds to the nearest whole number", () => {
  assert.equal(formatPercent(87.4), "87%");
  assert.equal(formatPercent(87.6), "88%");
});

test("controlStatusLabel covers every ControlStatus", () => {
  assert.equal(controlStatusLabel("compliant"), "Compliant");
  assert.equal(controlStatusLabel("at_risk"), "At Risk");
  assert.equal(controlStatusLabel("non_compliant"), "Non-Compliant");
  assert.equal(controlStatusLabel("not_applicable"), "Not Applicable");
});

test("controlStatusTone maps non_compliant to red and compliant to green", () => {
  assert.equal(controlStatusTone("non_compliant"), "red");
  assert.equal(controlStatusTone("compliant"), "green");
});

test("evidenceStatusLabel covers every EvidenceStatus", () => {
  assert.equal(evidenceStatusLabel("valid"), "Valid");
  assert.equal(evidenceStatusLabel("expiring"), "Expiring Soon");
  assert.equal(evidenceStatusLabel("expired"), "Expired");
});

test("riskStatusLabel covers every RiskStatus", () => {
  assert.equal(riskStatusLabel("open"), "Open");
  assert.equal(riskStatusLabel("mitigated"), "Mitigated");
  assert.equal(riskStatusLabel("accepted"), "Accepted");
  assert.equal(riskStatusLabel("closed"), "Closed");
});

test("riskSeverityTone escalates from gray to red", () => {
  assert.equal(riskSeverityTone("low"), "gray");
  assert.equal(riskSeverityTone("medium"), "yellow");
  assert.equal(riskSeverityTone("high"), "red");
  assert.equal(riskSeverityTone("critical"), "red");
});

test("offboardingIssueStatusTone marks open issues red and resolved green", () => {
  assert.equal(offboardingIssueStatusTone("open"), "red");
  assert.equal(offboardingIssueStatusTone("resolved"), "green");
});

test("offboardingIssueTypeLabel covers every OffboardingIssueType", () => {
  assert.equal(offboardingIssueTypeLabel("access_not_revoked"), "Access Not Revoked");
  assert.equal(offboardingIssueTypeLabel("device_not_returned"), "Device Not Returned");
  assert.equal(offboardingIssueTypeLabel("account_still_active"), "Account Still Active");
  assert.equal(offboardingIssueTypeLabel("other"), "Other");
});

test("connectorSyncStatusLabel covers every ConnectorSyncStatus", () => {
  assert.equal(connectorSyncStatusLabel("idle"), "Idle");
  assert.equal(connectorSyncStatusLabel("syncing"), "Syncing");
  assert.equal(connectorSyncStatusLabel("success"), "Synced");
  assert.equal(connectorSyncStatusLabel("error"), "Sync Failed");
});
