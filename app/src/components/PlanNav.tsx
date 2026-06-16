"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { setLastWing } from "@/lib/auth";
import { useAdminHold } from "@/hooks/useAdminHold";
import { Icon } from "./Icon";
import { BottomNav, BottomNavItem } from "@hoppz-ui";

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

      {/* Mobile bottom nav — plan wing only */}
      <BottomNav fixed elevated className="min-[840px]:hidden z-30">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const isResults = item.href === "/plan/board";

          if (isResults) {
            return (
              <button
                key={item.href}
                type="button"
                aria-current={active ? "page" : undefined}
                {...adminHold.handlers}
                className={`flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 font-label-sm text-label-sm transition ${
                  active ? "text-accent font-bold" : "text-on-surface-variant"
                } hover:bg-surface-variant/50 active:scale-95 ${HOLD_CLASS} ${adminHold.holding ? "anim-hold" : ""}`}
              >
                <span
                  className="material-symbols-outlined mb-0.5"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          }

          return (
            <BottomNavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              active={active}
              filled={active}
              activeColor="text-accent"
              fill
              onClick={() => router.push(item.href)}
            />
          );
        })}
        <button
          type="button"
          aria-label="Hopp"
          {...holdHandlers}
          onClick={hoppClick}
          className={`flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 bg-raised font-label-sm text-label-sm text-on-surface-variant transition hover:bg-surface-variant/50 active:scale-95 ${HOLD_CLASS} ${adminHold.holding ? "anim-hold" : ""}`}
        >
          <span className="material-symbols-outlined mb-0.5">sports_bar</span>
          Hopp
        </button>
      </BottomNav>
    </>
  );
}
