import { afterEach, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PoliciesPage from "@/app/policies/page";
import { mockApi, deferred } from "./testUtils";
import { makeEmployee, makePolicy } from "./fixtures";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("Policy acknowledgement calls the correct endpoint", async () => {
  const user = userEvent.setup();
  const calls = mockApi({
    "/api/employees": [makeEmployee({ id: "emp1", name: "Jamie Doe" })],
    "/api/policies": [
      makePolicy({
        id: "pol1",
        name: "Security Policy",
        requiresAcknowledgement: true,
        currentUserAcknowledgement: "pending",
      }),
    ],
    "/api/policies/pol1/acknowledge": { policyId: "pol1", employeeId: "emp1", acknowledgedAt: "now" },
  });

  render(<PoliciesPage />);

  const button = await screen.findByRole("button", { name: "Acknowledge" });
  await user.click(button);

  await waitFor(() => {
    const call = calls.find((c) => c.url === "/api/policies/pol1/acknowledge");
    expect(call).toBeDefined();
    expect(call?.init?.method).toBe("POST");
    expect(call?.init?.body).toBe(JSON.stringify({ employeeId: "emp1" }));
  });
});

test("Policy acknowledgement button is disabled while submitting", async () => {
  const user = userEvent.setup();
  const ackDeferred = deferred<{ policyId: string; employeeId: string; acknowledgedAt: string }>();
  // The refetch after a successful acknowledgement re-requests /api/policies,
  // so the mock reflects the new state the way a real backend would.
  let acknowledged = false;

  mockApi({
    "/api/employees": [makeEmployee({ id: "emp1", name: "Jamie Doe" })],
    "/api/policies": () => [
      makePolicy({
        id: "pol1",
        requiresAcknowledgement: true,
        currentUserAcknowledgement: acknowledged ? "acknowledged" : "pending",
      }),
    ],
    "/api/policies/pol1/acknowledge": () => ackDeferred.promise,
  });

  render(<PoliciesPage />);

  const button = await screen.findByRole("button", { name: "Acknowledge" });
  await user.click(button);

  expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();

  acknowledged = true;
  ackDeferred.resolve({ policyId: "pol1", employeeId: "emp1", acknowledgedAt: "now" });
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Acknowledged"));
});
