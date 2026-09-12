"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Frozen page set (docs/Web_Facade_Architecture.md "Required pages").
const NAV = [
  { href: "/", label: "Live" },
  { href: "/history", label: "History" },
  { href: "/experiments", label: "Experiments" },
  { href: "/events", label: "Events" },
  { href: "/reports", label: "Reports" },
  { href: "/system", label: "System" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const linkClass = (href: string) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-emerald-600 text-white"
        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
    }`;

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 p-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span aria-hidden>🪸</span> Smart Tank
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-wrap items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm md:hidden dark:border-zinc-700"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <nav
          id="mobile-nav"
          className="flex flex-col gap-1 border-t border-zinc-200 p-3 md:hidden dark:border-zinc-800"
          aria-label="Mobile"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={linkClass(item.href)}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
