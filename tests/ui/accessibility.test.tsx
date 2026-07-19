import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavBar } from "@/components/NavBar";
import { StatusBadge } from "@/components/StatusBadge";
import { RiskForm } from "@/components/RiskForm";
import { ConnectorSyncButton } from "@/components/ConnectorSyncButton";
import { AcknowledgeButton } from "@/components/AcknowledgeButton";
import { AuditorExportButton } from "@/components/AuditorExportButton";
import type { BadgeTone } from "@/lib/client/format";

test("Buttons have accessible names", () => {
  render(
    <>
      <NavBar />
      <RiskForm onCreated={() => {}} />
      <ConnectorSyncButton onSynced={() => {}} />
      <AcknowledgeButton
        policyId="p1"
        employeeId="e1"
        alreadyAcknowledged={false}
        onAcknowledged={() => {}}
      />
      <AuditorExportButton onExported={() => {}} />
    </>,
  );

  const buttons = screen.getAllByRole("button");
  expect(buttons.length).toBeGreaterThan(0);
  for (const button of buttons) {
    expect(button).toHaveAccessibleName();
  }
});

test("Form inputs have labels", () => {
  render(<RiskForm onCreated={() => {}} />);

  const inputs = [...screen.getAllByRole("textbox"), ...screen.getAllByRole("combobox")];
  expect(inputs.length).toBeGreaterThan(0);
  for (const input of inputs) {
    expect(input).toHaveAccessibleName();
  }
});

test("Status is not represented by color alone", () => {
  const tones: BadgeTone[] = ["green", "yellow", "red", "gray"];
  for (const tone of tones) {
    const { unmount } = render(<StatusBadge label="Example Status" tone={tone} />);
    const badge = screen.getByText("Example Status");
    // The visible text carries the label; an icon glyph is present too, so
    // the tone is never the only signal (colorblind-safe, non-color contexts).
    expect(badge.textContent).toMatch(/[✓⚠✕–]/);
    expect(badge.textContent).toContain("Example Status");
    unmount();
  }
});

test("Navigation links are keyboard-accessible", () => {
  render(<NavBar />);

  const expectedLinks = ["Dashboard", "Evidence", "Employees", "Policies", "Risks", "Auditor Portal"];
  for (const name of expectedLinks) {
    const link = screen.getByRole("link", { name });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href");
  }
});
