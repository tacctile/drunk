"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { setLastWing } from "@/lib/auth";
import { useAdminHold } from "@/hooks/useAdminHold";
import { Icon } from "./Icon";

const NAV = [
  { href: "/social", icon: "chat_bubble", label: "Chat" },
  { href: "/social/camera", icon: "photo_camera", label: "Camera" },
  { href: "/social/gallery", icon: "photo_library", label: "Gallery" },
  { href: "/social/locate", icon: "person_pin", label: "Locate" },
] as const;

const HOLD_CLASS = "select-none [-webkit-touch-callout:none]";

export function HopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const adminHold = useAdminHold();
  const { onClick: holdClick, ...holdHandlers } = adminHold.handlers;

  const planClick = (e: MouseEvent) => {
    holdClick(e);
    if (!e.defaultPrevented) {
      setLastWing("plan");
      router.push("/plan");
    }
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-surface pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-16 items-stretch">
        {NAV.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-label font-semibold transition ${
                active ? "text-accent" : "text-ink-muted"
              }`}
            >
              <Icon name={tab.icon} filled={active} size={24} />
              {tab.label}
            </Link>
          );
        })}
        <div className="flex items-center">
          <div className="h-6 w-px bg-border" />
        </div>
        <button
          type="button"
          {...holdHandlers}
          onClick={planClick}
          aria-label="Plan"
          className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-label font-semibold text-ink-dim transition ${HOLD_CLASS} ${adminHold.holding ? "anim-hold" : ""}`}
        >
          <Icon name="list_alt" size={24} />
          Plan
        </button>
      </div>
    </nav>
  );
}
