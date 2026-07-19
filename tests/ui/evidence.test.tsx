import { afterEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EvidencePage from "@/app/evidence/page";
import { mockApi } from "./testUtils";
import { makeEvidence } from "./fixtures";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("Evidence filtering limits displayed records", async () => {
  const user = userEvent.setup();
  mockApi({
    "/api/controls": [],
    "/api/evidence": [
      makeEvidence({ id: "e1", provider: "aws", title: "IAM Policy Export" }),
      makeEvidence({ id: "e2", provider: "github", title: "Branch Protection" }),
      makeEvidence({ id: "e3", provider: "aws", title: "S3 Bucket Policy" }),
    ],
  });

  render(<EvidencePage />);

  expect(await screen.findByText("IAM Policy Export")).toBeInTheDocument();
  expect(screen.getByText("Branch Protection")).toBeInTheDocument();
  expect(screen.getByText("S3 Bucket Policy")).toBeInTheDocument();

  await user.selectOptions(screen.getByLabelText("Provider"), "aws");

  expect(screen.getByText("IAM Policy Export")).toBeInTheDocument();
  expect(screen.getByText("S3 Bucket Policy")).toBeInTheDocument();
  expect(screen.queryByText("Branch Protection")).not.toBeInTheDocument();
});
