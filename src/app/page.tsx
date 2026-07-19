import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

const SECTIONS = [
  {
    href: "/dashboard",
    title: "Dashboard",
    description: "Overall compliance status, control counts, and connector health.",
  },
  {
    href: "/evidence",
    title: "Evidence",
    description: "Mock evidence collected from AWS, Azure, GitHub, Gusto, and Rippling.",
  },
  {
    href: "/employees",
    title: "Employees",
    description: "Employee records and offboarding issue tracking.",
  },
  {
    href: "/policies",
    title: "Policies",
    description: "Policy acknowledgement tracking.",
  },
  {
    href: "/risks",
    title: "Risks",
    description: "Risk assessment log and submission form.",
  },
  {
    href: "/auditor",
    title: "Auditor Portal",
    description: "Read-only view for auditors with a downloadable evidence package.",
  },
];

export default function Home() {
  return (
    <div>
      <PageHeader
        title="SOC 2 Compliance Aid"
        description="A demonstration aid for automated SOC 2 evidence collection. This is not an auditor, SOC 2 attestation, legal opinion, or official compliance determination."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
          >
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {section.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
