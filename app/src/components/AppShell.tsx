"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { setLastWing } from "@/lib/auth";
import { Icon } from "./Icon";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileOverlay } from "./ProfileOverlay";

const NAV = [
  { href: "/plan/cities", icon: "location_city", label: "Cities" },
  { href: "/plan/calendar", icon: "event_available", label: "Availability" },
  { href: "/plan/board", icon: "leaderboard", label: "Results" },
  { href: "/plan/locate", icon: "person_pin", label: "Locate" },
] as const;

const ADMIN_HOLD_MS = 3000;

function isActive(pathname: string, href: string): boolean {
  if (href === "/plan/cities")
    return pathname.startsWith("/plan/cities") || pathname.startsWith("/plan/city/");
  return pathname.startsWith(href);
}

/**
 * 3-second hold on the Locate tab opens /plan/admin — the only way in. A
 * normal tap still navigates to /plan/locate. While the hold runs, the item
 * pulses (opacity 1 → 0.5 → 1 over the full 3s); once it fires, the click that
 * follows the release is swallowed so it can't bounce back to /plan/locate.
 */
function useAdminHold() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const [holding, setHolding] = useState(false);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setHolding(false);
  }, []);

  const start = useCallback(() => {
    if (timerRef.current) return;
    firedRef.current = false;
    setHolding(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      firedRef.current = true;
      setHolding(false);
      router.push("/plan/admin");
    }, ADMIN_HOLD_MS);
  }, [router]);

  useEffect(() => cancel, [cancel]);

  const onClick = useCallback((e: MouseEvent) => {
    if (firedRef.current) {
      e.preventDefault();
      firedRef.current = false;
    }
  }, []);

  return {
    holding,
    handlers: {
      onMouseDown: start,
      onTouchStart: start,
      onMouseUp: cancel,
      onMouseLeave: cancel,
      onTouchEnd: cancel,
      onTouchCancel: cancel,
      onClick,
      onContextMenu: (e: MouseEvent) => e.preventDefault(),
      draggable: false,
    },
  };
}

// Suppresses the iOS link preview/callout so a 3s hold stays a hold.
const HOLD_CLASS = "select-none [-webkit-touch-callout:none]";

/**
 * App chrome, pathname-aware:
 *   - /login and the transient / redirect render bare (no chrome).
 *   - The wordmark bar shows everywhere else except pages with their own
 *     sticky header (plan city detail + admin).
 *   - The four plan tabs (bottom nav on mobile, 80px rail at >= 840px) show
 *     only inside the plan wing; the social wing brings its own bottom nav,
 *     and /home has neither.
 * A subtle Night Out icon button sits left of the avatar in the plan wing to
 * cross over to the social wing.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const adminHold = useAdminHold();
  const [profileOpen, setProfileOpen] = useState(false);

  const bare = pathname === "/login" || pathname === "/";
  const hasOwnHeader = pathname.startsWith("/plan/city/") || pathname.startsWith("/plan/admin");
  const inPlan = pathname.startsWith("/plan");

  // Login owns its full-screen layout; / only ever flashes during the redirect.
  if (bare) return <>{children}</>;

  return (
    <div className="min-h-dvh min-[840px]:flex">
      {/* Desktop rail — plan wing only, icons with title tooltips */}
      {inPlan && (
        <aside className="sticky top-0 hidden h-dvh w-20 flex-col items-center gap-2 border-r bg-surface pt-4 min-[840px]:flex">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const locate = item.href === "/plan/locate";
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                {...(locate ? adminHold.handlers : {})}
                className={`flex h-11 w-11 items-center justify-center rounded-btn transition ${
                  active ? "bg-accent-dim text-accent" : "text-ink-muted hover:bg-raised hover:text-ink"
                } ${locate ? HOLD_CLASS : ""} ${locate && adminHold.holding ? "anim-hold" : ""}`}
              >
                <Icon name={item.icon} filled={active} size={24} />
              </Link>
            );
          })}
        </aside>
      )}

      <div className="min-w-0 flex-1">
        {/* Sticky top bar — wordmark left, wing switch + profile avatar right */}
        {!hasOwnHeader && (
          <header className="sticky top-0 z-30 border-b bg-bg">
            <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
              <Link href="/home" className="flex h-11 items-center text-title font-extrabold tracking-tight">
                Bar Hoppers
              </Link>
              <div className="flex items-center">
                {inPlan && (
                  <button
                    type="button"
                    aria-label="Switch to Night Out"
                    onClick={() => {
                      setLastWing("social");
                      router.push("/social");
                    }}
                    className="flex h-11 w-11 items-center justify-center text-ink-dim transition hover:text-ink"
                  >
                    <Icon name="local_bar" size={22} />
                  </button>
                )}
                <ProfileAvatar className="-mr-1" onClick={() => setProfileOpen(true)} />
              </div>
            </div>
          </header>
        )}

        {/* Plan pages need room for the floating action bar + bottom nav; the
            home and social wings own their full-height layouts. */}
        <main className={inPlan ? "pb-[calc(140px+env(safe-area-inset-bottom))] min-[840px]:pb-10" : ""}>
          {children}
        </main>

        <ProfileOverlay open={profileOpen} onClose={() => setProfileOpen(false)} />
      </div>

      {/* Mobile bottom nav — plan wing only, 64px + safe area */}
      {inPlan && (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-surface pb-[env(safe-area-inset-bottom)] min-[840px]:hidden">
          <div className="grid h-16 grid-cols-4">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              const locate = item.href === "/plan/locate";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  {...(locate ? adminHold.handlers : {})}
                  className={`flex min-h-11 flex-col items-center justify-center gap-0.5 text-label font-semibold transition ${
                    active ? "text-accent" : "text-ink-muted"
                  } ${locate ? HOLD_CLASS : ""} ${locate && adminHold.holding ? "anim-hold" : ""}`}
                >
                  <Icon name={item.icon} filled={active} size={24} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
