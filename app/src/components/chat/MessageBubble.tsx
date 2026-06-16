"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import {
  formatMessageTime,
  groupReactions,
  type MessageRow,
} from "@/lib/chat";
import { ChatBubble, ReactionPill, type ChatReaction } from "@hoppz-ui";

function SenderAvatar({
  name,
  color,
  avatarUrl,
  size = 24,
}: {
  name: string;
  color: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  return (
    <Avatar
      voter={{ display_name: name, name, pin_color: color, avatar_url: avatarUrl }}
      size={size}
    />
  );
}

export interface MessageBubbleProps {
  msg: MessageRow;
  isOwn: boolean;
  grouped: boolean;
  isLast: boolean;
  voter: { name: string; color: string; avatarUrl: string | null };
  groupedReactions: ReturnType<typeof groupReactions>;
  msgReads: { voter_id: string; read_at: string; message_id: string }[];
  replyMsg: MessageRow | null;
  voterId: string;
  highlighted: boolean;
  nudged: boolean;
  getVoter: (vid: string) => { name: string; color: string; avatarUrl: string | null };
  onObserve: (node: HTMLDivElement | null, msg: MessageRow) => void;
  onTouchStart: (
    e: React.TouchEvent,
    msg: MessageRow,
    el: HTMLDivElement | null
  ) => void;
  onTouchMove: (e: React.TouchEvent, msg: MessageRow) => void;
  onTouchEnd: () => void;
  onMouseDown: (
    e: React.MouseEvent,
    msg: MessageRow,
    el: HTMLDivElement | null
  ) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onReactionTap: (emoji: string) => void;
  onReplyTap: () => void;
  onScrollToReply: (msgId: string) => void;
  onSeenByTap: () => void;
  onRefSet: (node: HTMLDivElement | null) => void;
  onImageExpand: (url: string) => void;
}

export function MessageBubble({
  msg,
  isOwn,
  grouped,
  isLast,
  voter,
  groupedReactions,
  msgReads,
  replyMsg,
  voterId,
  highlighted,
  nudged,
  getVoter,
  onObserve,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onContextMenu,
  onReactionTap,
  onReplyTap,
  onScrollToReply,
  onSeenByTap,
  onRefSet,
  onImageExpand,
}: MessageBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const replyVoter = replyMsg
    ? getVoter(replyMsg.voter_id)
    : null;

  const senderInitials = voter.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const reactions: ChatReaction[] = groupedReactions.map((g) => ({
    emoji: g.emoji,
    count: g.count,
    active: g.voterIds.includes(voterId),
  }));

  return (
    <div
      ref={(node) => {
        onObserve(node, msg);
        onRefSet(node);
      }}
      className={`flex flex-col ${isOwn ? "items-end" : "items-start"} ${
        grouped ? "mt-0.5" : "mt-3"
      } ${highlighted ? "rounded-card bg-accent/10 transition-colors duration-[800ms]" : ""}`}
    >
      {/* Bubble + desktop reply button wrapper */}
      <div
        className={`group relative flex items-center gap-1 max-w-[75%] ${
          isOwn ? "flex-row-reverse" : "flex-row"
        }`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          onMouseLeave();
        }}
      >
        <div
          ref={bubbleRef}
          className="transition-transform duration-200"
          style={{
            transform: nudged ? "translateX(8px)" : undefined,
          }}
          onTouchStart={(e) => onTouchStart(e, msg, bubbleRef.current)}
          onTouchMove={(e) => onTouchMove(e, msg)}
          onTouchEnd={onTouchEnd}
          onMouseDown={(e) => onMouseDown(e, msg, bubbleRef.current)}
          onMouseUp={onMouseUp}
          onContextMenu={onContextMenu}
        >
          {/* Reply quote preview — ChatBubble doesn't have a reply slot */}
          {msg.reply_to_id && (
            <button
              type="button"
              className={`mb-1 block w-full rounded-t-lg border-l-2 border-accent px-2 py-1 text-left ${
                isOwn ? "bg-black/15" : "bg-surface"
              }`}
              onClick={() => {
                if (msg.reply_to_id) onScrollToReply(msg.reply_to_id);
              }}
            >
              <p className={`text-[11px] ${isOwn ? "text-bg/70" : "text-ink-muted"}`}>
                {replyVoter
                  ? replyVoter.name
                  : "Someone"}
              </p>
              <p className={`truncate text-[12px] ${isOwn ? "text-bg/60" : "text-ink-dim"}`}>
                {replyMsg
                  ? replyMsg.is_deleted
                    ? "Original message deleted"
                    : replyMsg.image_url && !replyMsg.content
                      ? "📷 Photo"
                      : replyMsg.content ?? ""
                  : "Original message deleted"}
              </p>
            </button>
          )}

          <ChatBubble
            variant={isOwn ? "own" : "other"}
            text={msg.content ?? undefined}
            imageUrl={msg.image_url ?? undefined}
            senderName={!isOwn ? voter.name : undefined}
            senderInitials={senderInitials}
            senderColor={voter.color}
            senderAvatarUrl={voter.avatarUrl ?? undefined}
            timestamp={isLast ? formatMessageTime(msg.created_at) : undefined}
            grouped={grouped}
            reactions={reactions.length > 0 ? reactions : undefined}
            onReactionClick={onReactionTap}
            onClick={msg.image_url ? () => onImageExpand(msg.image_url!) : undefined}
          />
        </div>

        {/* Desktop reply button — appears on hover */}
        {hovered && (
          <button
            type="button"
            onClick={onReplyTap}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-dim transition hover:bg-surface-raised hover:text-ink-muted"
          >
            <Icon name="reply" size={18} />
          </button>
        )}
      </div>

      {/* Read receipts — custom, uses Wave 1 Avatar */}
      {msgReads.length > 0 && (
        <div
          className={`mt-0.5 flex items-center ${
            isOwn ? "justify-end" : "justify-start"
          }`}
        >
          {msgReads.length === 1 && (
            <button type="button" onClick={onSeenByTap}>
              <SenderAvatar
                name={getVoter(msgReads[0].voter_id).name}
                color={getVoter(msgReads[0].voter_id).color}
                avatarUrl={getVoter(msgReads[0].voter_id).avatarUrl}
                size={16}
              />
            </button>
          )}
          {msgReads.length === 2 && (
            <button type="button" onClick={onSeenByTap} className="flex">
              <SenderAvatar
                name={getVoter(msgReads[0].voter_id).name}
                color={getVoter(msgReads[0].voter_id).color}
                avatarUrl={getVoter(msgReads[0].voter_id).avatarUrl}
                size={16}
              />
              <div className="-ml-1 relative z-10">
                <SenderAvatar
                  name={getVoter(msgReads[1].voter_id).name}
                  color={getVoter(msgReads[1].voter_id).color}
                  avatarUrl={getVoter(msgReads[1].voter_id).avatarUrl}
                  size={16}
                />
              </div>
            </button>
          )}
          {msgReads.length >= 3 && (
            <button
              type="button"
              onClick={onSeenByTap}
              className="text-[11px] text-ink-dim"
            >
              Seen by {msgReads.length}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
