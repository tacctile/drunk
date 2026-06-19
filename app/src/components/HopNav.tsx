"use client";

import { usePathname, useRouter } from "next/navigation";
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

  const planClick = () => {
    setLastWing("plan");
    router.push("/plan");
  };

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
            <button
              key={tab.href}
              type="button"
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              {...adminHold.handlers}
              onClick={() => router.push(tab.href)}
              className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-label font-semibold transition-all ${
                active ? "text-green font-bold" : "text-ink-muted"
              } ${HOLD_CLASS} ${adminHold.holding ? "anim-hold" : ""}`}
            >
              <Icon name={tab.icon} filled={active} size={24} />
              {tab.label}
            </button>
          );
        })}
        <button
          type="button"
          {...adminHold.handlers}
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
