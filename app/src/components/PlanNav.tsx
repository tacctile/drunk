"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { setLastWing } from "@/lib/auth";
import { useAdminHold } from "@/hooks/useAdminHold";
import { Icon } from "./Icon";

const NAV = [
  { href: "/plan/cities", icon: "location_city", label: "Cities" },
  { href: "/plan/calendar", icon: "event_available", label: "Availability" },
  { href: "/plan/board", icon: "leaderboard", label: "Results" },
  { href: "/plan/hopperz", icon: "group", label: "Hopperz" },
] as const;

const HOLD_CLASS = "select-none [-webkit-touch-callout:none]";

function isActive(pathname: string, href: string): boolean {
  if (href === "/plan/cities")
    return pathname.startsWith("/plan/cities") || pathname.startsWith("/plan/city/");
  return pathname.startsWith(href);
}

export function PlanNav() {
  const pathname = usePathname();
  const router = useRouter();
  const adminHold = useAdminHold();
  const { onClick: holdClick, ...holdHandlers } = adminHold.handlers;

  const inPlan = pathname.startsWith("/plan");
  if (!inPlan) return null;

  const hoppClick = (e: MouseEvent) => {
    holdClick(e);
    if (!e.defaultPrevented) {
      setLastWing("social");
      router.push("/social");
    }
  };

  return (
    <>
      {/* Desktop rail — plan wing only, icons with title tooltips */}
      <aside className="sticky top-0 hidden h-dvh w-20 flex-col items-center gap-2 border-r bg-surface pt-4 min-[840px]:flex">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const results = item.href === "/plan/board";
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              {...(results ? adminHold.handlers : {})}
              className={`flex h-11 w-11 items-center justify-center rounded-btn transition ${
                active ? "bg-accent-dim text-accent" : "text-ink-muted hover:bg-raised hover:text-ink"
              } ${results ? HOLD_CLASS : ""} ${results && adminHold.holding ? "anim-hold" : ""}`}
            >
              <Icon name={item.icon} filled={active} size={24} />
            </Link>
          );
        })}
        <button
          type="button"
          title="Hopp"
          aria-label="Hopp"
          {...holdHandlers}
          onClick={hoppClick}
          className={`flex h-11 w-11 items-center justify-center rounded-btn bg-raised text-ink-dim transition hover:text-ink ${HOLD_CLASS} ${adminHold.holding ? "anim-hold" : ""}`}
        >
          <Icon name="sports_bar" size={24} />
        </button>
      </aside>

      {/* Mobile bottom nav — plan wing only, 64px + safe area */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-surface pb-[env(safe-area-inset-bottom)] min-[840px]:hidden">
        <div className="flex h-16 items-stretch">
          {NAV.map((item, index) => {
            const active = isActive(pathname, item.href);
            const results = item.href === "/plan/board";
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                {...(results ? adminHold.handlers : {})}
                className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-label font-semibold transition ${
                  active ? "text-accent" : "text-ink-muted"
                } ${results ? HOLD_CLASS : ""} ${results && adminHold.holding ? "anim-hold" : ""}`}
              >
                <Icon name={item.icon} filled={active} size={24} />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={hoppClick}
            aria-label="Hopp"
            {...holdHandlers}
            className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 bg-raised text-label font-semibold text-ink-dim transition ${HOLD_CLASS} ${adminHold.holding ? "anim-hold" : ""}`}
          >
            <Icon name="sports_bar" size={24} />
            Hopp
          </button>
        </div>
      </nav>
    </>
  );
}
