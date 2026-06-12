"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

const NAV = [
  { href: "/cities", icon: "location_city", label: "Cities" },
  { href: "/calendar", icon: "calendar_month", label: "Calendar" },
  { href: "/board", icon: "bar_chart", label: "The Board" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/cities") return pathname.startsWith("/cities") || pathname.startsWith("/city/");
  return pathname.startsWith(href);
}

/**
 * App chrome: sticky wordmark bar + fixed bottom nav on mobile, 80px icon
 * rail at >= 840px. City detail pages bring their own sticky header, so the
 * wordmark bar hides there.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const onCityDetail = pathname.startsWith("/city/");

  return (
    <div className="min-h-dvh min-[840px]:flex">
      {/* Desktop rail — icons only, tooltips via title */}
      <aside className="sticky top-0 hidden h-dvh w-20 flex-col items-center gap-2 border-r bg-surface pt-4 min-[840px]:flex">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`flex h-11 w-11 items-center justify-center rounded-btn transition ${
                active ? "bg-accent-dim text-accent" : "text-ink-muted hover:bg-raised hover:text-ink"
              }`}
            >
              <Icon name={item.icon} filled={active} size={24} />
            </Link>
          );
        })}
      </aside>

      <div className="min-w-0 flex-1">
        {/* Sticky top bar — wordmark left, nothing right */}
        {!onCityDetail && (
          <header className="sticky top-0 z-30 border-b bg-bg/90 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
              <Link href="/cities" className="flex h-11 items-center text-title font-extrabold tracking-tight">
                Bar Hoppers
              </Link>
            </div>
          </header>
        )}

        <main className="pb-[calc(140px+env(safe-area-inset-bottom))] min-[840px]:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav — 64px + safe area */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-surface pb-[env(safe-area-inset-bottom)] min-[840px]:hidden">
        <div className="grid h-16 grid-cols-3">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 flex-col items-center justify-center gap-0.5 text-label font-semibold transition ${
                  active ? "text-accent" : "text-ink-muted"
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
