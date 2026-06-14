"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { isAuthenticated, setLastWing } from "@/lib/auth";

const TABS = [
  { href: "/social", icon: "chat_bubble", label: "Chat" },
  { href: "/social/camera", icon: "photo_camera", label: "Camera" },
] as const;

/**
 * Social-wing wrapper. The AppShell header (wordmark + avatar) still renders,
 * but the AppShell suppresses its plan nav on /social/* — so this layout
 * brings its own bottom nav (same 64px + safe-area dimensions and surface /
 * hairline styling as the plan nav): Chat, Camera, and a Switch-to-Plan tab
 * that crosses back to the plan wing.
 */
export default function SocialLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setLastWing("social");
    isAuthenticated();
  }, []);

  const switchToPlan = () => {
    setLastWing("plan");
    router.push("/plan");
  };

  return (
    <>
      {children}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-surface pb-[env(safe-area-inset-bottom)]">
        <div className="grid h-16 grid-cols-3">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 flex-col items-center justify-center gap-0.5 text-label font-semibold transition ${
                  active ? "text-accent" : "text-ink-muted"
                }`}
              >
                <Icon name={tab.icon} filled={active} size={24} />
                {tab.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={switchToPlan}
            aria-label="Switch to trip planning"
            className="flex min-h-11 flex-col items-center justify-center gap-0.5 text-label font-semibold text-ink-muted transition hover:text-ink"
          >
            <Icon name="map" size={24} />
            Plan
          </button>
        </div>
      </nav>
    </>
  );
}
