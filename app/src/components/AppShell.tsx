"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { useGroupData } from "@/hooks/useGroupData";
import { contrastColor } from "@/lib/colors";
import { getStoredName, getStoredPinColor } from "@/lib/identity";
import { Icon } from "./Icon";

const NAV = [
  { href: "/cities", icon: "location_city", label: "Cities" },
  { href: "/calendar", icon: "event_available", label: "Availability" },
  { href: "/board", icon: "leaderboard", label: "Results" },
  { href: "/locate", icon: "person_pin", label: "Locate" },
] as const;

const ADMIN_HOLD_MS = 3000;

function isActive(pathname: string, href: string): boolean {
  if (href === "/cities") return pathname.startsWith("/cities") || pathname.startsWith("/city/");
  return pathname.startsWith(href);
}

/**
 * 3-second hold on the Locate tab opens /admin — the only way in. A normal
 * tap still navigates to /locate. While the hold runs, the item pulses
 * (opacity 1 → 0.5 → 1 over the full 3s); once it fires, the click that
 * follows the release is swallowed so it can't bounce back to /locate.
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
      router.push("/admin");
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

/** "Nick B" → "NB"; a single word gives its first letter. */
function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "").toUpperCase();
}

/**
 * The avatar in the wordmark bar: initials on the auto-assigned pin color
 * once registered, a quiet person icon before that. localStorage is re-read
 * whenever the identity layer moves (registration, sign-in, roster re-sync)
 * so it updates without a reload; the storage listener covers other tabs.
 * Tapping it is a no-op until the profile screen lands (Prompt 3).
 */
function ProfileAvatar() {
  const { name, voters } = useGroupData();
  const [profile, setProfile] = useState<{ name: string; color: string | null }>({
    name: "",
    color: null,
  });

  useEffect(() => {
    const read = () => {
      const next = { name: getStoredName(), color: getStoredPinColor() };
      setProfile((prev) =>
        prev.name === next.name && prev.color === next.color ? prev : next,
      );
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, [name, voters]);

  const registered = profile.name.length > 0;
  const color = profile.color;

  return (
    <button
      type="button"
      aria-label="Your profile"
      className="-mr-1 flex h-11 w-11 flex-none items-center justify-center"
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full text-meta font-bold"
        style={{
          background: color ?? "var(--surface-raised)",
          border: `1.5px solid ${color ? `${color}4D` : "var(--border)"}`,
          color: color ? contrastColor(color) : "var(--ink)",
        }}
      >
        {registered ? (
          getInitials(profile.name)
        ) : (
          <Icon name="person" size={20} className="text-ink-dim" />
        )}
      </span>
    </button>
  );
}

/**
 * App chrome: sticky wordmark bar + fixed bottom nav on mobile, 80px icon
 * rail at >= 840px. City detail and admin bring their own sticky headers,
 * so the wordmark bar hides there.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hasOwnHeader = pathname.startsWith("/city/") || pathname.startsWith("/admin");
  const adminHold = useAdminHold();

  return (
    <div className="min-h-dvh min-[840px]:flex">
      {/* Desktop rail — icons only, tooltips via title */}
      <aside className="sticky top-0 hidden h-dvh w-20 flex-col items-center gap-2 border-r bg-surface pt-4 min-[840px]:flex">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const locate = item.href === "/locate";
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

      <div className="min-w-0 flex-1">
        {/* Sticky top bar — wordmark left, profile avatar right */}
        {!hasOwnHeader && (
          <header className="sticky top-0 z-30 border-b bg-bg">
            <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
              <Link href="/cities" className="flex h-11 items-center text-title font-extrabold tracking-tight">
                Bar Hoppers
              </Link>
              <ProfileAvatar />
            </div>
          </header>
        )}

        <main className="pb-[calc(140px+env(safe-area-inset-bottom))] min-[840px]:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav — 64px + safe area */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-surface pb-[env(safe-area-inset-bottom)] min-[840px]:hidden">
        <div className="grid h-16 grid-cols-4">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const locate = item.href === "/locate";
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
    </div>
  );
}
