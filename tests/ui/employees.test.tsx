import { afterEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EmployeesPage from "@/app/employees/page";
import { mockApi } from "./testUtils";
import { makeEmployee, makeOffboardingIssue } from "./fixtures";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("Terminated employee with active access is visibly flagged", async () => {
  mockApi({
    "/api/employees": [
      makeEmployee({ id: "e1", name: "Alex Active", status: "active" }),
      makeEmployee({
        id: "e2",
        name: "Terri Terminated",
        status: "offboarded",
        offboardingIssues: [
          makeOffboardingIssue({ system: "AWS", issueType: "access_not_revoked", status: "open" }),
        ],
      }),
    ],
  });

  render(<EmployeesPage />);

  expect(await screen.findByText("Terri Terminated")).toBeInTheDocument();
  expect(screen.getByText("Alex Active")).toBeInTheDocument();
  // Exactly one employee (the terminated one with an open issue) is flagged.
  expect(screen.getAllByText("Terminated — Retains Access").length).toBe(1);
});

test("API error renders an error state", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify({ error: { code: "server_error", message: "Something broke" } }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );

  render(<EmployeesPage />);

  expect(await screen.findByRole("alert")).toHaveTextContent("Something broke");
  expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
});

test("Empty API result renders an empty state", async () => {
  mockApi({ "/api/employees": [] });

  render(<EmployeesPage />);

  expect(await screen.findByText(/no employees match this filter/i)).toBeInTheDocument();
});
