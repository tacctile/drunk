"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTripData } from "@/hooks/useTripData";
import { Icon } from "./Icon";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileOverlay } from "./ProfileOverlay";

export function TopBar() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const { effectiveStatus, daysUntil } = useTripData();

  const hasOwnHeader =
    pathname.startsWith("/plan/city/") || pathname.startsWith("/plan/admin") || pathname.startsWith("/plan/moderator");

  if (hasOwnHeader) return null;

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-bg">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
          <Link
            href="/home"
            className="flex h-11 flex-none items-center text-title font-extrabold tracking-tight"
          >
            Hoppz
          </Link>
          <div className="flex flex-1 justify-center">
            {effectiveStatus === "upcoming" && daysUntil !== null && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                <Icon name="calendar_month" size={14} />
                {daysUntil === 0 ? "Today!" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d away`}
              </span>
            )}
            {effectiveStatus === "active" && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: "var(--green-dim)", color: "var(--green)" }}>
                <Icon name="sports_bar" size={14} />
                On Trip
              </span>
            )}
          </div>
          <ProfileAvatar className="-mr-1 flex-none" onClick={() => setProfileOpen(true)} />
        </div>
      </header>
      <ProfileOverlay open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
