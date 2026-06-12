"use client";

import { useEffect, useState } from "react";
import { useGroupData } from "@/hooks/useGroupData";
import { contrastColor, getInitials } from "@/lib/colors";
import { getStoredName, getStoredPinColor } from "@/lib/identity";
import { Icon } from "./Icon";

/**
 * The profile avatar: initials on the auto-assigned pin color once
 * registered, a quiet person icon before that. Shared by the AppShell
 * wordmark bar and the city detail header so the avatar persists on every
 * screen. localStorage is re-read whenever the identity layer moves
 * (registration, sign-in, roster re-sync, profile rename, sign-out) so it
 * updates without a reload; the storage listener covers other tabs.
 * Tapping it opens the profile overlay.
 */
export function ProfileAvatar({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
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
      onClick={onClick}
      className={`flex h-11 w-11 flex-none items-center justify-center ${className}`}
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
