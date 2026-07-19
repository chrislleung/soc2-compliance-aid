"use client";

import { useState, type FormEvent } from "react";
import { createRisk } from "@/lib/client/api";
import { ApiRequestError } from "@/lib/client/http";
import { validateRiskForm, type RiskFormErrors } from "@/lib/client/derive";
import { riskStatusLabel } from "@/lib/client/format";
import type { RiskImpact, RiskLikelihood, RiskStatus } from "@/lib/contracts";

const LIKELIHOOD_OPTIONS: { value: RiskLikelihood; label: string }[] = [
  { value: 1, label: "1 — Rare" },
  { value: 2, label: "2 — Unlikely" },
  { value: 3, label: "3 — Possible" },
  { value: 4, label: "4 — Likely" },
  { value: 5, label: "5 — Near-certain" },
];

const IMPACT_OPTIONS: { value: RiskImpact; label: string }[] = [
  { value: 1, label: "1 — Negligible" },
  { value: 2, label: "2 — Minor" },
  { value: 3, label: "3 — Moderate" },
  { value: 4, label: "4 — Major" },
  { value: 5, label: "5 — Severe" },
];

const STATUS_OPTIONS: RiskStatus[] = ["open", "mitigated", "accepted", "closed"];

// The shared contract still requires a category on every risk, but this
// form intentionally doesn't expose that field — every risk created here
// is filed under this default bucket.
const DEFAULT_CATEGORY = "General";

interface FormState {
  title: string;
  description: string;
  likelihood: RiskLikelihood;
  impact: RiskImpact;
  mitigationPlan: string;
  owner: string;
  status: RiskStatus;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  likelihood: 3,
  impact: 3,
  mitigationPlan: "",
  owner: "",
  status: "open",
};

export function RiskForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<RiskFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSucceeded(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return; // guard against a rapid double-submit

    const validationErrors = validateRiskForm({
      title: form.title,
      description: form.description,
      owner: form.owner,
    });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await createRisk({
        title: form.title,
        description: form.description,
        category: DEFAULT_CATEGORY,
        likelihood: form.likelihood,
        impact: form.impact,
        status: form.status,
        owner: form.owner,
        mitigationPlan: form.mitigationPlan || undefined,
      });
      setForm(EMPTY_FORM);
      setErrors({});
      setSucceeded(true);
      onCreated();
    } catch (err) {
      setSubmitError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not submit this risk assessment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        New Risk Assessment
      </h2>

      <label className="flex flex-col gap-1 text-sm">
        Title
        <input
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          aria-invalid={Boolean(errors.title)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {errors.title && <span role="alert" className="text-xs text-red-600 dark:text-red-400">{errors.title}</span>}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Description
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          aria-invalid={Boolean(errors.description)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {errors.description && (
          <span role="alert" className="text-xs text-red-600 dark:text-red-400">{errors.description}</span>
        )}
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Owner
          <input
            value={form.owner}
            onChange={(e) => update("owner", e.target.value)}
            aria-invalid={Boolean(errors.owner)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          {errors.owner && <span role="alert" className="text-xs text-red-600 dark:text-red-400">{errors.owner}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Status
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value as RiskStatus)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {riskStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Likelihood (1–5)
          <select
            value={form.likelihood}
            onChange={(e) => update("likelihood", Number(e.target.value) as RiskLikelihood)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {LIKELIHOOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Impact (1–5)
          <select
            value={form.impact}
            onChange={(e) => update("impact", Number(e.target.value) as RiskImpact)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {IMPACT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Mitigation (optional)
        <textarea
          rows={2}
          value={form.mitigationPlan}
          onChange={(e) => update("mitigationPlan", e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      {submitError && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {submitError}
        </p>
      )}
      {succeeded && (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
          Risk submitted successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {submitting ? "Submitting…" : "Submit Risk"}
      </button>
    </form>
  );
}
