"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { useGroupData } from "@/hooks/useGroupData";
import { useChat } from "@/hooks/useChat";
import {
  formatMessageTime,
  formatDayDivider,
  isDifferentDay,
  shouldGroup,
  type MessageRow,
} from "@/lib/chat";
import { contrastColor, getInitials } from "@/lib/colors";

function SenderAvatar({
  name,
  color,
}: {
  name: string;
  color: string;
}) {
  return (
    <span
      className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-[10px] font-bold"
      style={{ background: color, color: contrastColor(color) }}
    >
      {getInitials(name)}
    </span>
  );
}

function DayDivider({ iso }: { iso: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-px flex-1 bg-ink-dim" />
      <span className="text-meta font-normal text-ink-dim">
        {formatDayDivider(iso)}
      </span>
      <div className="h-px flex-1 bg-ink-dim" />
    </div>
  );
}

export default function ChatPage() {
  const { voterId, voters } = useGroupData();
  const {
    messages,
    reads,
    hasMore,
    loading,
    loadingMore,
    loadMore,
    sendMessage,
    markRead,
  } = useChat();

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showNewPill, setShowNewPill] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialScrollDone = useRef(false);
  const prevScrollHeight = useRef(0);
  const prevMessageCount = useRef(0);

  const isNearBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView(
      smooth ? { behavior: "smooth" } : undefined
    );
  }, []);

  useEffect(() => {
    if (loading || messages.length === 0) return;
    if (!initialScrollDone.current) {
      initialScrollDone.current = true;
      scrollToBottom(false);
      prevMessageCount.current = messages.length;
      return;
    }

    if (messages.length > prevMessageCount.current) {
      const newMessages = messages.slice(prevMessageCount.current);
      const hasOwnNew = newMessages.some((m) => m.voter_id === voterId);

      if (hasOwnNew || isNearBottom()) {
        scrollToBottom(true);
        setShowNewPill(false);
      } else {
        setShowNewPill(true);
      }
    }
    prevMessageCount.current = messages.length;
  }, [messages, loading, voterId, isNearBottom, scrollToBottom]);

  useEffect(() => {
    if (!loadingMore) return;
    const el = listRef.current;
    if (el) prevScrollHeight.current = el.scrollHeight;
  }, [loadingMore]);

  useEffect(() => {
    if (loadingMore) return;
    const el = listRef.current;
    if (el && prevScrollHeight.current > 0) {
      const diff = el.scrollHeight - prevScrollHeight.current;
      el.scrollTop += diff;
      prevScrollHeight.current = 0;
    }
  }, [loadingMore, messages]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollTop < 100 && hasMore && !loadingMore) {
      void loadMore();
    }
    if (isNearBottom()) {
      setShowNewPill(false);
    }
  }, [hasMore, loadingMore, loadMore, isNearBottom]);

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;
    void sendMessage(text);
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    scrollToBottom(true);
  }, [inputValue, sendMessage, scrollToBottom]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const isMobile =
        typeof navigator !== "undefined" &&
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (e.key === "Enter" && !e.shiftKey && !isMobile) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInput = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const lineHeight = 22;
    const maxHeight = lineHeight * 4 + 16;
    ta.style.height = `${Math.min(ta.scrollHeight, maxHeight)}px`;
  }, []);

  const voterMap = useRef<Map<string, { name: string; color: string }>>(
    new Map()
  );
  useEffect(() => {
    const m = new Map<string, { name: string; color: string }>();
    for (const v of voters) {
      m.set(v.voter_id, {
        name: v.display_name ?? v.name,
        color: v.pin_color,
      });
    }
    voterMap.current = m;
  }, [voters]);

  const getVoter = (vid: string) =>
    voterMap.current.get(vid) ?? { name: "Someone", color: "#4A5468" };

  const readSet = useRef(new Set<string>());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedNodes = useRef(new Map<Element, string>());

  useEffect(() => {
    readSet.current = new Set(
      reads
        .filter((r) => r.voter_id === voterId)
        .map((r) => r.message_id)
    );
  }, [reads, voterId]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const msgId = observedNodes.current.get(entry.target);
          if (msgId && !readSet.current.has(msgId)) {
            readSet.current.add(msgId);
            void markRead(msgId);
          }
        }
      },
      { threshold: 0.5 }
    );
    return () => observerRef.current?.disconnect();
  }, [markRead]);

  const observeMessage = useCallback(
    (node: HTMLDivElement | null, msg: MessageRow) => {
      if (!node || msg.voter_id === voterId) return;
      if (readSet.current.has(msg.id)) return;
      observedNodes.current.set(node, msg.id);
      observerRef.current?.observe(node);
    },
    [voterId]
  );

  const renderMessages = () => {
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const prev = i > 0 ? messages[i - 1] : null;
      const isOwn = msg.voter_id === voterId;

      if (prev && isDifferentDay(prev.created_at, msg.created_at)) {
        elements.push(<DayDivider key={`day-${msg.id}`} iso={msg.created_at} />);
      }

      const grouped = prev ? shouldGroup(prev, msg) : false;
      const isLast =
        i === messages.length - 1 ||
        !shouldGroup(msg, messages[i + 1]) ||
        isDifferentDay(msg.created_at, messages[i + 1].created_at);

      const voter = getVoter(msg.voter_id);

      if (msg.is_deleted) {
        elements.push(
          <div
            key={msg.id}
            ref={(node) => observeMessage(node, msg)}
            className={`flex ${isOwn ? "justify-end" : "justify-start"} ${
              grouped ? "mt-0.5" : "mt-3"
            }`}
          >
            <p className="max-w-[75%] px-3 py-2 text-base italic text-ink-dim">
              This message was deleted
            </p>
          </div>
        );
        continue;
      }

      elements.push(
        <div
          key={msg.id}
          ref={(node) => observeMessage(node, msg)}
          className={`flex flex-col ${isOwn ? "items-end" : "items-start"} ${
            grouped ? "mt-0.5" : "mt-3"
          }`}
        >
          {!grouped && !isOwn && (
            <div className="mb-1 flex items-center gap-1.5">
              <SenderAvatar name={voter.name} color={voter.color} />
              <span className="text-meta text-ink-muted">{voter.name}</span>
            </div>
          )}

          <div
            className={`max-w-[75%] px-3 py-2 ${
              isOwn
                ? "rounded-card rounded-br-none bg-accent text-bg"
                : "rounded-card rounded-bl-none bg-raised text-ink"
            }`}
          >
            {msg.image_url && (
              <button
                type="button"
                onClick={() => console.log("expand image")}
                className="mb-1 block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={msg.image_url}
                  alt=""
                  className="max-h-[300px] max-w-full rounded-card object-contain"
                />
              </button>
            )}
            {msg.content && <p className="text-base">{msg.content}</p>}
          </div>

          {isLast && (
            <span
              className={`mt-0.5 text-[11px] font-normal text-ink-dim ${
                isOwn ? "text-right" : "text-left"
              }`}
            >
              {formatMessageTime(msg.created_at)}
            </span>
          )}
        </div>
      );
    }

    return elements;
  };

  const hasContent = inputValue.trim().length > 0;

  return (
    <div className="flex h-[calc(100dvh-3.5rem-64px-env(safe-area-inset-bottom))] flex-col">
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4"
      >
        {loadingMore && (
          <div className="flex justify-center py-3">
            <Icon name="progress_activity" size={24} className="animate-spin text-ink-dim" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <Icon name="sports_bar" size={48} className="text-ink-dim" />
            <h2 className="text-title font-bold text-ink">No messages yet</h2>
            <p className="text-meta font-normal text-ink-muted">
              Send the first one
            </p>
          </div>
        )}

        {renderMessages()}
        <div ref={bottomRef} />
      </div>

      {showNewPill && (
        <div className="pointer-events-none flex justify-center pb-2">
          <button
            type="button"
            onClick={() => {
              scrollToBottom(true);
              setShowNewPill(false);
            }}
            className="pointer-events-auto rounded-full bg-accent px-4 py-1.5 text-meta font-semibold text-bg shadow-overlay"
          >
            New message ↓
          </button>
        </div>
      )}

      <div className="flex-none border-t border-border bg-bg px-3 py-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => console.log("open camera")}
            className="flex h-11 w-11 flex-none items-center justify-center text-ink-muted"
          >
            <Icon name="photo_camera" size={24} />
          </button>

          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              handleInput();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            className="input flex-1 resize-none !h-auto min-h-[44px] py-2.5"
          />

          <button
            type="button"
            onClick={() => console.log("open gallery")}
            className="flex h-11 w-11 flex-none items-center justify-center text-ink-muted"
          >
            <Icon name="photo" size={24} />
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={!hasContent}
            className={`flex h-11 w-11 flex-none items-center justify-center ${
              hasContent ? "text-accent" : "text-ink-dim"
            }`}
          >
            <Icon name="send" size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
