"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/evidence", label: "Evidence" },
  { href: "/employees", label: "Employees" },
  { href: "/policies", label: "Policies" },
  { href: "/risks", label: "Risks" },
  { href: "/auditor", label: "Auditor Portal" },
];

export function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
          onClick={() => setMobileOpen(false)}
        >
          SOC 2 Compliance Aid
        </Link>

        <nav className="hidden gap-x-6 text-sm sm:flex">
          {LINKS.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} pathname={pathname} />
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 sm:hidden dark:border-zinc-700 dark:text-zinc-300"
        >
          <span aria-hidden className="text-lg leading-none">
            {mobileOpen ? "✕" : "☰"}
          </span>
        </button>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-nav"
          className="flex flex-col gap-1 border-t border-zinc-200 px-6 py-3 text-sm sm:hidden dark:border-zinc-800"
        >
          {LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
              block
            />
          ))}
        </nav>
      )}
    </header>
  );
}

function NavLink({
  href,
  label,
  pathname,
  onNavigate,
  block,
}: {
  href: string;
  label: string;
  pathname: string | null;
  onNavigate?: () => void;
  block?: boolean;
}) {
  const active = pathname?.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`${block ? "block py-2" : ""} ${
        active
          ? "font-medium text-zinc-900 dark:text-zinc-50"
          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      }`}
    >
      {label}
    </Link>
  );
}
