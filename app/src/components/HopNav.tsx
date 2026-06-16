"use client";

import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { setLastWing } from "@/lib/auth";
import { useAdminHold } from "@/hooks/useAdminHold";
import { BottomNav, BottomNavItem } from "@hoppz-ui";

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
    <BottomNav fixed elevated className="z-30">
      {NAV.map((tab) => {
        const active = pathname === tab.href;
        return (
          <BottomNavItem
            key={tab.href}
            icon={tab.icon}
            label={tab.label}
            active={active}
            filled={active}
            activeColor="text-accent"
            fill
            onClick={() => router.push(tab.href)}
          />
        );
      })}
      <button
        type="button"
        {...holdHandlers}
        onClick={planClick}
        aria-label="Plan"
        className={`flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 bg-raised font-label-sm text-label-sm text-on-surface-variant transition hover:bg-surface-variant/50 active:scale-95 ${HOLD_CLASS} ${adminHold.holding ? "anim-hold" : ""}`}
      >
        <span className="material-symbols-outlined mb-0.5">list_alt</span>
        Plan
      </button>
    </BottomNav>
  );
}
