"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import {
  formatMessageTime,
  groupReactions,
  type MessageRow,
} from "@/lib/chat";

function SenderAvatar({
  name,
  color,
  avatarUrl,
  size = 32,
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

  const replyQuote = msg.reply_to_id ? (
    <button
      type="button"
      className={`mb-1 block w-full rounded-lg border-l-2 border-accent px-2 py-1 text-left ${
        isOwn ? "bg-black/15" : "bg-surface"
      }`}
      onClick={() => {
        if (msg.reply_to_id) onScrollToReply(msg.reply_to_id);
      }}
    >
      <p className={`text-[11px] ${isOwn ? "text-bg/70" : "text-ink-muted"}`}>
        {replyVoter ? replyVoter.name : "Someone"}
      </p>
      <p className={`truncate text-[12px] ${isOwn ? "text-bg/60" : "text-ink-dim"}`}>
        {replyMsg
          ? replyMsg.is_deleted
            ? "Original message deleted"
            : replyMsg.image_url && !replyMsg.content
              ? "Photo"
              : replyMsg.content ?? ""
          : "Original message deleted"}
      </p>
    </button>
  ) : null;

  const imageBlock = msg.image_url ? (
    <button
      type="button"
      onClick={() => onImageExpand(msg.image_url!)}
      className="block"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={msg.image_url}
        alt=""
        loading="lazy"
        className="block max-h-[300px] max-w-full rounded-card object-contain"
        style={{ aspectRatio: "4/3" }}
        onLoad={(e) => {
          (e.currentTarget as HTMLImageElement).style.aspectRatio = "";
        }}
      />
    </button>
  ) : null;

  const textBlock = msg.content ? (
    <p className={`text-base${msg.image_url ? " pt-1" : ""} ${isOwn ? "font-bold" : ""}`}>
      {msg.content}
    </p>
  ) : null;

  const reactionRow = groupedReactions.length > 0 ? (
    <div className={`flex min-h-[28px] flex-wrap gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
      {groupedReactions.map((g) => {
        const isOwnReaction = g.voterIds.includes(voterId);
        return (
          <button
            key={g.emoji}
            type="button"
            onClick={() => onReactionTap(g.emoji)}
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-[13px] ${
              isOwnReaction
                ? "border border-accent bg-white/5"
                : "border border-white/10 bg-white/5"
            }`}
          >
            <span className="text-[12px]">{g.emoji}</span>
            <span className="text-ink-muted text-label">{g.count}</span>
          </button>
        );
      })}
    </div>
  ) : null;

  const timestamp = isLast ? (
    <span className={`mt-1 text-[11px] font-normal text-ink-dim opacity-60 ${isOwn ? "text-right" : "text-left"}`}>
      {formatMessageTime(msg.created_at)}
    </span>
  ) : null;

  const readReceipts = msgReads.length > 0 ? (
    <div className={`mt-0.5 flex items-center ${isOwn ? "justify-end" : "justify-start"}`}>
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
  ) : null;

  const desktopReplyBtn = hovered ? (
    <button
      type="button"
      onClick={onReplyTap}
      className="flex h-8 w-8 items-center justify-center rounded-full text-ink-dim transition hover:bg-raised hover:text-ink-muted"
    >
      <Icon name="reply" size={18} />
    </button>
  ) : null;

  const bubbleHandlers = {
    onTouchStart: (e: React.TouchEvent) => onTouchStart(e, msg, bubbleRef.current),
    onTouchMove: (e: React.TouchEvent) => onTouchMove(e, msg),
    onTouchEnd,
    onMouseDown: (e: React.MouseEvent) => onMouseDown(e, msg, bubbleRef.current),
    onMouseUp,
    onContextMenu,
  };

  if (isOwn) {
    return (
      <div
        ref={(node) => {
          onObserve(node, msg);
          onRefSet(node);
        }}
        className={`flex flex-col items-end gap-1 max-w-[85%] self-end ${
          grouped ? "mt-[2px]" : "mt-4"
        } ${highlighted ? "rounded-card bg-accent/10 transition-colors duration-[800ms]" : ""}`}
      >
        <div
          className="group relative flex items-center gap-1 flex-row-reverse"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => {
            setHovered(false);
            onMouseLeave();
          }}
        >
          <div
            ref={bubbleRef}
            className={`p-3 bg-green text-bg shadow-sm transition-transform duration-200 ${
              msg.image_url ? "p-1" : ""
            }`}
            style={{
              borderRadius: "12px 12px 4px 12px",
              transform: nudged ? "translateX(8px)" : undefined,
            }}
            {...bubbleHandlers}
          >
            {replyQuote}
            {msg.image_url ? (
              <>
                <div className="rounded-[10px] overflow-hidden">
                  {imageBlock}
                </div>
                {msg.content && (
                  <div className="px-2 py-2">
                    <p className="text-base font-bold text-bg">{msg.content}</p>
                  </div>
                )}
              </>
            ) : (
              textBlock
            )}
          </div>
          {desktopReplyBtn}
        </div>
        {reactionRow}
        <div className="flex gap-1 items-center">
          {timestamp}
        </div>
        {readReceipts}
      </div>
    );
  }

  return (
    <div
      ref={(node) => {
        onObserve(node, msg);
        onRefSet(node);
      }}
      className={`flex items-end gap-2 max-w-[85%] ${
        grouped ? "mt-[2px]" : "mt-6"
      } ${highlighted ? "rounded-card bg-accent/10 transition-colors duration-[800ms]" : ""}`}
    >
      {grouped ? (
        <div className="h-8 w-8 flex-shrink-0" />
      ) : (
        <div className="flex-shrink-0">
          <SenderAvatar name={voter.name} color={voter.color} avatarUrl={voter.avatarUrl} size={32} />
        </div>
      )}
      <div className="flex flex-col gap-1 min-w-0">
        {!grouped && (
          <span className="text-label font-semibold text-accent ml-1">{voter.name}</span>
        )}
        <div
          className="group relative flex items-center gap-1 flex-row"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => {
            setHovered(false);
            onMouseLeave();
          }}
        >
          <div
            ref={bubbleRef}
            className="p-3 bg-raised text-ink border-t border-white/[0.07] shadow-sm transition-transform duration-200"
            style={{
              borderRadius: "4px 12px 12px 12px",
              transform: nudged ? "translateX(8px)" : undefined,
            }}
            {...bubbleHandlers}
          >
            {replyQuote}
            {imageBlock}
            {textBlock}
          </div>
          {desktopReplyBtn}
        </div>
        {reactionRow}
        {timestamp}
        {readReceipts}
      </div>
    </div>
  );
}
