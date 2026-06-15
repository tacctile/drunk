"use client";

import React from "react";
import { InitialsAvatar } from "./InitialsAvatar";
import { ReactionPill } from "./ReactionPill";

export type ChatReaction = {
  emoji: string;
  count: number;
  active?: boolean;
};

export type ChatBubbleProps = {
  variant: "own" | "other";
  text?: string;
  imageUrl?: string;
  imageAlt?: string;
  senderName?: string;
  senderNameColor?: string;
  senderInitials?: string;
  senderColor?: string;
  senderAvatarUrl?: string;
  timestamp?: string;
  grouped?: boolean;
  reactions?: ChatReaction[];
  onReactionClick?: (emoji: string) => void;
  onClick?: () => void;
};

export function ChatBubble({
  variant,
  text,
  imageUrl,
  imageAlt = "",
  senderName,
  senderNameColor = "text-primary",
  senderInitials,
  senderColor,
  senderAvatarUrl,
  timestamp,
  grouped = false,
  reactions,
  onReactionClick,
  onClick,
}: ChatBubbleProps) {
  if (variant === "own") {
    const hasImage = !!imageUrl;

    return (
      <div className="flex flex-col items-end gap-1 max-w-[85%] self-end">
        <div
          className={`bg-secondary shadow-md ${hasImage ? "p-1" : "p-3"} rounded-tl-[16px] rounded-tr-[16px] rounded-br-[4px] rounded-bl-[16px]`}
          onClick={onClick}
          role={onClick ? "button" : undefined}
          tabIndex={onClick ? 0 : undefined}
        >
          {hasImage && (
            <div className="rounded-xl overflow-hidden">
              <img
                src={imageUrl}
                alt={imageAlt}
                className="w-full object-cover"
              />
            </div>
          )}
          {text && (
            <p
              className={`font-body-md text-body-md text-surface-dim font-bold ${hasImage ? "px-2 py-2" : ""}`}
            >
              {text}
            </p>
          )}
        </div>
        {timestamp && (
          <span className="font-meta-xs text-meta-xs text-on-surface-variant opacity-60">
            {timestamp}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-sm max-w-[85%]">
      {grouped ? (
        <div className="w-8 h-8 flex-shrink-0" />
      ) : (
        <InitialsAvatar
          initials={senderInitials ?? ""}
          size="xs"
          color={senderColor}
          avatarUrl={senderAvatarUrl}
        />
      )}
      <div className="flex flex-col gap-1">
        {!grouped && senderName && (
          <span
            className={`font-label-sm text-label-sm ${senderNameColor} ml-1`}
          >
            {senderName}
          </span>
        )}
        <div
          className="bg-surface-variant p-3 border-t border-white/[0.07] shadow-sm rounded-tl-[4px] rounded-tr-[16px] rounded-br-[16px] rounded-bl-[16px]"
          onClick={onClick}
          role={onClick ? "button" : undefined}
          tabIndex={onClick ? 0 : undefined}
        >
          {imageUrl && (
            <div className="rounded-xl overflow-hidden mb-2">
              <img
                src={imageUrl}
                alt={imageAlt}
                className="w-full object-cover"
              />
            </div>
          )}
          {text && (
            <p className="font-body-md text-body-md text-on-surface">{text}</p>
          )}
        </div>
        {reactions && reactions.length > 0 && (
          <div className="flex gap-1 mt-1">
            {reactions.map((r) => (
              <ReactionPill
                key={r.emoji}
                emoji={r.emoji}
                count={r.count}
                active={r.active}
                onClick={
                  onReactionClick
                    ? () => onReactionClick(r.emoji)
                    : undefined
                }
              />
            ))}
          </div>
        )}
        {timestamp && (
          <span className="font-meta-xs text-meta-xs text-on-surface-variant opacity-60 ml-1">
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
