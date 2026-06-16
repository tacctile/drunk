"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useTripData } from "@/hooks/useTripData";
import { Icon } from "./Icon";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileOverlay } from "./ProfileOverlay";

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const { effectiveStatus, daysUntil } = useTripData();

  const hasOwnHeader =
    pathname.startsWith("/plan/city/") || pathname.startsWith("/plan/admin") || pathname.startsWith("/plan/moderator");

  if (hasOwnHeader) return null;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border-strong bg-raised">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="flex min-h-[44px] min-w-[44px] flex-none flex-col items-center justify-center text-ink-muted"
          >
            <Icon name="home" size={24} />
            <span className="text-label uppercase">Home</span>
          </button>
          <div className="flex items-center gap-3">
            {effectiveStatus === "upcoming" && daysUntil !== null && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3 py-1 text-label font-semibold">
                <Icon name="calendar_month" size={16} className="text-green" />
                {daysUntil === 0 ? "Today!" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d away`}
              </span>
            )}
            {effectiveStatus === "active" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3 py-1 text-label font-semibold">
                <Icon name="sports_bar" size={16} className="text-green" />
                Active Hopp
              </span>
            )}
            <ProfileAvatar className="flex-none" onClick={() => setProfileOpen(true)} />
          </div>
        </div>
      </header>
      <ProfileOverlay open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
