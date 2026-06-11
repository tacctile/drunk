"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

const NAV = [
  { href: "/", icon: "luggage", label: "Trip" },
  { href: "/cities", icon: "location_city", label: "Cities" },
  { href: "/dates", icon: "calendar_month", label: "Dates" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/cities") return pathname.startsWith("/cities") || pathname.startsWith("/city/");
  return pathname.startsWith(href);
}

/**
 * App chrome: wordmark header + bottom nav on mobile, 224px left rail at
 * >= 840px. City detail highlights Cities. The /vote flow renders full-screen
 * with no chrome at all.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/vote")) return <>{children}</>;

  return (
    <div className="min-h-dvh min-[840px]:flex">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh w-56 flex-col gap-1 border-r border-line bg-surface p-4 min-[840px]:flex">
        <Link href="/" className="mb-4 flex h-11 items-center gap-2 px-2">
          <Icon name="sports_bar" filled size={26} />
          <span className="text-lg font-extrabold tracking-tight">Bar Hoppers</span>
        </Link>
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex h-11 items-center gap-3 rounded px-3 text-base font-semibold transition ${
                active ? "bg-accent-soft text-accent" : "text-dim hover:bg-raised hover:text-ink"
              }`}
            >
              <Icon name={item.icon} filled={active} size={22} />
              {item.label}
            </Link>
          );
        })}
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile header — wordmark only */}
        <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur min-[840px]:hidden">
          <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
            <Link href="/" className="flex h-11 items-center gap-2">
              <Icon name="sports_bar" filled size={24} />
              <span className="text-base font-extrabold tracking-tight">Bar Hoppers</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4 min-[840px]:max-w-5xl min-[840px]:px-8 min-[840px]:pb-16 min-[840px]:pt-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] min-[840px]:hidden">
        <div className="mx-auto grid h-16 max-w-2xl grid-cols-3">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition ${
                  active ? "text-accent" : "text-dim hover:text-muted"
                }`}
              >
                <Icon name={item.icon} filled={active} size={24} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
