"use client";

import { useEffect, useState } from "react";
import { useGroupData } from "@/hooks/useGroupData";
import { useAdminHold } from "@/hooks/useAdminHold";
import { getStoredName, getStoredPinColor, getStoredAvatarUrl } from "@/lib/identity";
import { getRoleForVoter } from "@/lib/roles";
import { PIN_COLORS } from "@/lib/colors";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

const HOLD_CLASS = "select-none [-webkit-touch-callout:none]";

export function ProfileAvatar({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  const { name, voters, voterId } = useGroupData();
  const [profile, setProfile] = useState<{
    name: string;
    color: string | null;
    avatarUrl: string | null;
  }>({ name: "", color: null, avatarUrl: null });

  const myRow = voters.find((v) => v.voter_id === voterId);
  const role = getRoleForVoter(voterId, myRow?.role ?? null);
  const isMod = role === "moderator";
  const modHold = useAdminHold(500, "/plan/moderator");
  const { onClick: holdClick, ...holdHandlers } = modHold.handlers;

  useEffect(() => {
    const read = () => {
      const next = {
        name: getStoredName(),
        color: getStoredPinColor(),
        avatarUrl: getStoredAvatarUrl(),
      };
      setProfile((prev) =>
        prev.name === next.name && prev.color === next.color && prev.avatarUrl === next.avatarUrl
          ? prev
          : next,
      );
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, [name, voters]);

  const registered = profile.name.length > 0;
  const avatarUrl = myRow?.avatar_url ?? profile.avatarUrl;

  const handleClick = (e: React.MouseEvent) => {
    if (isMod) {
      holdClick(e);
      if (!e.defaultPrevented) onClick();
    } else {
      onClick();
    }
  };

  return (
    <button
      type="button"
      aria-label="Your profile"
      {...(isMod ? holdHandlers : {})}
      onClick={handleClick}
      className={`flex h-11 w-11 flex-none items-center justify-center ${isMod ? HOLD_CLASS : ""} ${className}`}
    >
      {registered ? (
        <Avatar
          voter={{
            display_name: profile.name,
            name: profile.name,
            pin_color: profile.color ?? PIN_COLORS[0],
            avatar_url: avatarUrl,
          }}
          size={36}
        />
      ) : (
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-meta font-bold"
          style={{
            background: "var(--surface-raised)",
            border: "1.5px solid var(--border)",
            color: "var(--ink)",
          }}
        >
          <Icon name="person" size={20} className="text-ink-dim" />
        </span>
      )}
    </button>
  );
}
