import { afterEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RisksPage from "@/app/risks/page";
import { mockApi } from "./testUtils";
import { makeRisk } from "./fixtures";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("Risk form rejects missing required fields", async () => {
  const user = userEvent.setup();
  const calls = mockApi({ "/api/risks": [] });

  render(<RisksPage />);

  await user.click(screen.getByRole("button", { name: "Submit Risk" }));

  expect(await screen.findByText("Title is required.")).toBeInTheDocument();
  expect(screen.getByText("Description is required.")).toBeInTheDocument();
  expect(screen.getByText("Owner is required.")).toBeInTheDocument();
  expect(calls.some((c) => c.init?.method === "POST")).toBe(false);
});

test("Valid risk form submits the correct payload", async () => {
  const user = userEvent.setup();
  const calls = mockApi({
    "/api/risks": (input: RequestInfo | URL, init?: RequestInit) =>
      init?.method === "POST" ? makeRisk({ title: "Vendor lockout" }) : [],
  });

  render(<RisksPage />);

  await user.type(screen.getByLabelText("Title"), "Vendor lockout");
  await user.type(screen.getByLabelText("Description"), "Single vendor dependency risk");
  await user.type(screen.getByLabelText("Owner"), "Jamie Doe");
  await user.click(screen.getByRole("button", { name: "Submit Risk" }));

  await screen.findByText("Risk submitted successfully.");

  const postCall = calls.find((c) => c.init?.method === "POST");
  expect(postCall).toBeDefined();
  expect(postCall?.url).toBe("/api/risks");
  expect(JSON.parse(String(postCall?.init?.body))).toEqual({
    title: "Vendor lockout",
    description: "Single vendor dependency risk",
    category: "General",
    likelihood: 3,
    impact: 3,
    status: "open",
    owner: "Jamie Doe",
  });
});
