"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTripData } from "@/hooks/useTripData";
import { TopAppBar, StatusPill } from "@hoppz-ui";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileOverlay } from "./ProfileOverlay";

export function TopBar() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const { effectiveStatus, daysUntil } = useTripData();

  const hasOwnHeader =
    pathname.startsWith("/plan/city/") || pathname.startsWith("/plan/admin") || pathname.startsWith("/plan/moderator");

  if (hasOwnHeader) return null;

  const tripPill = (() => {
    if (effectiveStatus === "upcoming" && daysUntil !== null) {
      const label = daysUntil === 0 ? "Today!" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d away`;
      return <StatusPill icon="calendar_month" label={label} size="sm" variant="primary" />;
    }
    if (effectiveStatus === "active") {
      return <StatusPill icon="sports_bar" label="On Trip" size="sm" variant="active" />;
    }
    return null;
  })();

  return (
    <>
      <TopAppBar
        title="Hoppz"
        position="sticky"
        glass={false}
        centerSlot={tripPill}
        actions={<ProfileAvatar className="-mr-1 flex-none" onClick={() => setProfileOpen(true)} />}
      />
      <ProfileOverlay open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
