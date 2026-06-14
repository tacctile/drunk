"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileOverlay } from "./ProfileOverlay";

export function TopBar() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  const hasOwnHeader =
    pathname.startsWith("/plan/city/") || pathname.startsWith("/plan/admin");

  if (hasOwnHeader) return null;

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-bg">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link
            href="/home"
            className="flex h-11 items-center text-title font-extrabold tracking-tight"
          >
            Hoppz
          </Link>
          <ProfileAvatar className="-mr-1" onClick={() => setProfileOpen(true)} />
        </div>
      </header>
      <ProfileOverlay open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
