"use client";

import { useState, type FormEvent } from "react";
import { createRisk } from "@/lib/client/api";
import { ApiRequestError } from "@/lib/client/http";
import type { CreateRiskRequest, Risk, RiskImpact, RiskLikelihood } from "@/lib/contracts";

const LIKELIHOOD_OPTIONS: RiskLikelihood[] = ["low", "medium", "high"];
const IMPACT_OPTIONS: RiskImpact[] = ["low", "medium", "high"];

const EMPTY_FORM: CreateRiskRequest = {
  title: "",
  description: "",
  category: "",
  likelihood: "medium",
  impact: "medium",
  owner: "",
  mitigationPlan: "",
};

export function RiskForm({ onCreated }: { onCreated: (risk: Risk) => void }) {
  const [form, setForm] = useState<CreateRiskRequest>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof CreateRiskRequest>(key: K, value: CreateRiskRequest[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const risk = await createRisk({
        ...form,
        mitigationPlan: form.mitigationPlan || undefined,
      });
      onCreated(risk);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(
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
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        New Risk Assessment
      </h2>

      <label className="flex flex-col gap-1 text-sm">
        Title
        <input
          required
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Description
        <textarea
          required
          rows={3}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Category
          <input
            required
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Owner
          <input
            required
            value={form.owner}
            onChange={(e) => update("owner", e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Likelihood
          <select
            value={form.likelihood}
            onChange={(e) => update("likelihood", e.target.value as RiskLikelihood)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {LIKELIHOOD_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Impact
          <select
            value={form.impact}
            onChange={(e) => update("impact", e.target.value as RiskImpact)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {IMPACT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Mitigation Plan (optional)
        <textarea
          rows={2}
          value={form.mitigationPlan}
          onChange={(e) => update("mitigationPlan", e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

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
