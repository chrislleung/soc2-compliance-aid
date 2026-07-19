import { afterEach, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "@/app/dashboard/page";
import { mockApi, deferred } from "./testUtils";
import { makeConnector, makeDashboardSummary } from "./fixtures";
import type { Connector } from "@/lib/contracts";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("Dashboard renders pass, warning, and fail totals", async () => {
  mockApi({
    "/api/dashboard": makeDashboardSummary({
      controlCountsByStatus: { compliant: 5, at_risk: 2, non_compliant: 1, not_applicable: 0 },
    }),
    "/api/policies": [],
    "/api/controls": [],
    "/api/evidence": [],
  });

  render(<DashboardPage />);

  expect(await screen.findByText("Passing Controls")).toBeInTheDocument();
  expect(screen.getByText("Warning Controls").parentElement).toHaveTextContent("2");
  expect(screen.getByText("Passing Controls").parentElement).toHaveTextContent("5");
  expect(screen.getByText("Failing Controls").parentElement).toHaveTextContent("1");
  expect(screen.getByText("Total Controls").parentElement).toHaveTextContent("8");
});

test("Dashboard displays connector statuses", async () => {
  mockApi({
    "/api/dashboard": makeDashboardSummary(),
    "/api/policies": [],
    "/api/controls": [],
    "/api/evidence": [],
  });

  render(<DashboardPage />);

  for (const label of ["AWS", "Azure", "GitHub", "Gusto", "Rippling"]) {
    expect(await screen.findByText(label)).toBeInTheDocument();
  }
  expect(screen.getAllByText("Synced").length).toBe(5);
});

test("Run demo sync button becomes disabled while the request is pending", async () => {
  const user = userEvent.setup();
  const connectorsDeferred = deferred<Connector[]>();

  mockApi({
    "/api/dashboard": makeDashboardSummary(),
    "/api/policies": [],
    "/api/controls": [],
    "/api/evidence": [],
    "/api/connectors": () => connectorsDeferred.promise,
    "/api/connectors/sync": (input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}"));
      return { connectorId: body.connectorId, provider: "aws", status: "success", startedAt: "now", finishedAt: "now", recordsProcessed: 1, errors: [] };
    },
  });

  render(<DashboardPage />);

  const button = await screen.findByRole("button", { name: "Run demo sync" });
  expect(button).toBeEnabled();

  await user.click(button);
  expect(button).toBeDisabled();

  connectorsDeferred.resolve([makeConnector({ id: "aws", provider: "aws" })]);
  // The sync also refreshes the dashboard summary, which briefly swaps the
  // whole overview section (including this button) for a loading skeleton,
  // so re-query by role rather than asserting on the original element.
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Run demo sync" })).toBeEnabled(),
  );
});
