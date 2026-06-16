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
] as const;

const HOLD_CLASS = "select-none [-webkit-touch-callout:none]";

export function HopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const adminHold = useAdminHold();
  const locateHold = useAdminHold();
  const { onClick: holdClick, ...holdHandlers } = adminHold.handlers;
  const { onClick: locateHoldClick, ...locateHoldHandlers } = locateHold.handlers;

  const locateClick = (e: MouseEvent) => {
    locateHoldClick(e);
    if (!e.defaultPrevented) {
      router.push("/social/locate");
    }
  };

  const planClick = (e: MouseEvent) => {
    holdClick(e);
    if (!e.defaultPrevented) {
      setLastWing("plan");
      router.push("/plan");
    }
  };

  const locateActive = pathname === "/social/locate";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 bg-raised pb-[env(safe-area-inset-bottom)]"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 -2px 16px rgba(0,0,0,0.4)",
      }}
    >
      <div className="flex h-16 items-stretch">
        {NAV.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-label font-semibold transition-all ${
                active ? "text-green font-bold" : "text-ink-muted"
              }`}
            >
              <Icon name={tab.icon} filled={active} size={24} />
              {tab.label}
            </Link>
          );
        })}
        <button
          type="button"
          {...locateHoldHandlers}
          onClick={locateClick}
          aria-label="Locate"
          aria-current={locateActive ? "page" : undefined}
          className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-label font-semibold transition-all ${
            locateActive ? "text-green font-bold" : "text-ink-muted"
          } ${HOLD_CLASS} ${locateHold.holding ? "anim-hold" : ""}`}
        >
          <Icon name="person_pin" filled={locateActive} size={24} />
          Locate
        </button>
        <button
          type="button"
          {...holdHandlers}
          onClick={planClick}
          aria-label="Plan"
          className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 bg-surface text-label font-semibold text-ink-dim transition ${HOLD_CLASS} ${adminHold.holding ? "anim-hold" : ""}`}
        >
          <Icon name="list_alt" size={24} />
          Plan
        </button>
      </div>
    </nav>
  );
}
