import { afterEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuditorPage from "@/app/auditor/page";
import { mockApi } from "./testUtils";
import { makeDashboardSummary } from "./fixtures";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("Auditor portal contains a download button and it downloads with the server filename", async () => {
  const user = userEvent.setup();
  // jsdom doesn't implement real navigation; the button creates a real <a
  // download> and clicks it, so stub that one native action for this test.
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

  mockApi({
    "/api/dashboard": makeDashboardSummary(),
    "/api/controls": [],
    "/api/policies": [],
    "/api/evidence": [],
    "/api/auditor/export": {
      generatedAt: "2026-01-01T00:00:00.000Z",
      format: "zip",
      downloadUrl: "/exports/evidence-package-2026-07-18.zip",
      manifest: [],
    },
  });

  render(<AuditorPage />);

  const button = await screen.findByRole("button", { name: /download evidence package/i });
  expect(button).toBeInTheDocument();

  await user.click(button);

  expect(await screen.findByText(/evidence-package-2026-07-18\.zip/)).toBeInTheDocument();
});

test("Auditor portal is visibly read-only", async () => {
  mockApi({
    "/api/dashboard": makeDashboardSummary(),
    "/api/controls": [],
    "/api/policies": [],
    "/api/evidence": [],
  });

  render(<AuditorPage />);

  expect(await screen.findByText("Read-Only View")).toBeInTheDocument();
  expect(screen.getByText(/no data can be created, edited, or acknowledged/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /acknowledge/i })).not.toBeInTheDocument();
});
