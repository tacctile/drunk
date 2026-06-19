"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar as ChatAvatar } from "@/components/Avatar";
import { MessageBubble } from "@/components/chat";
import { Icon } from "@/components/Icon";
import { BottomSheet } from "@/components/BottomSheet";
import { ImageViewer } from "@/components/ImageViewer";
import { Toast } from "@/components/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useGroupData } from "@/hooks/useGroupData";
import { useChat } from "@/hooks/useChat";
import {
  formatMessageTime,
  formatDayDivider,
  isDifferentDay,
  shouldGroup,
  groupReactions,
  EMOJI_REACTIONS,
  type MessageRow,
} from "@/lib/chat";
import { uploadChatImage } from "@/lib/storage";
import { SUPERADMIN_VOTER_ID } from "@/lib/superadmin";

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
    <ChatAvatar
      voter={{ display_name: name, name, pin_color: color, avatar_url: avatarUrl }}
      size={size}
    />
  );
}

function DayDivider({ iso }: { iso: string }) {
  return (
    <div className="flex justify-center my-6">
      <span className="bg-raised text-ink-muted text-label font-semibold uppercase tracking-label px-4 py-1 rounded-full">
        {formatDayDivider(iso)}
      </span>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatInner />
    </Suspense>
  );
}

function ChatInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { voterId, voters } = useGroupData();
  const {
    messages,
    reactions,
    reads,
    hasMore,
    loading,
    loadingMore,
    replyingTo,
    setReplyingTo,
    loadMore,
    sendMessage,
    markRead,
    addReaction,
    removeReaction,
    hardDeleteMessage,
  } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showNewPill, setShowNewPill] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialScrollDone = useRef(false);
  const prevScrollHeight = useRef(0);
  const prevMessageCount = useRef(0);

  // Reaction picker state
  const [pickerMessageId, setPickerMessageId] = useState<string | null>(null);
  const [pickerPos, setPickerPos] = useState<{
    x: number;
    y: number;
    above: boolean;
  } | null>(null);

  // Seen-by sheet state
  const [seenByMessageId, setSeenByMessageId] = useState<string | null>(null);

  // Reply swipe nudge state
  const [nudgedMessageId, setNudgedMessageId] = useState<string | null>(null);

  // Scroll-to highlight
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Image upload + viewer + toast state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const pendingImageHandled = useRef(false);

  useEffect(() => {
    if (pendingImageHandled.current) return;
    const pendingImage = searchParams.get("pendingImage");
    if (pendingImage) {
      pendingImageHandled.current = true;
      const url = decodeURIComponent(pendingImage);
      void sendMessage(null, url);
      router.replace("/social", { scroll: false });
    }
  }, [searchParams, sendMessage, router]);

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  useEffect(() => {
    if (loading) return;
    if (messages.length === 0) return;

    if (!initialScrollDone.current) {
      initialScrollDone.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({ behavior: "instant" });
        });
      });
      prevMessageCount.current = messages.length;
      return;
    }

    if (messages.length > prevMessageCount.current) {
      const newMessages = messages.slice(prevMessageCount.current);
      const hasOwnNew = newMessages.some((m) => m.voter_id === voterId);

      if (hasOwnNew || isNearBottom()) {
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({ behavior: "instant" });
        });
        setShowNewPill(false);
        setShowScrollButton(false);
      } else {
        setShowNewPill(true);
      }
    }
    prevMessageCount.current = messages.length;
  }, [messages, loading, voterId, isNearBottom]);

  useEffect(() => {
    if (!loadingMore) return;
    const el = scrollRef.current;
    if (el) prevScrollHeight.current = el.scrollHeight;
  }, [loadingMore]);

  useEffect(() => {
    if (loadingMore) return;
    const el = scrollRef.current;
    if (el && prevScrollHeight.current > 0) {
      const diff = el.scrollHeight - prevScrollHeight.current;
      el.scrollTop += diff;
      prevScrollHeight.current = 0;
    }
  }, [loadingMore, messages]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop < 100 && hasMore && !loadingMore) {
      void loadMore();
    }
    const nearBottom = isNearBottom();
    setShowScrollButton(!nearBottom);
    if (nearBottom) {
      setShowNewPill(false);
    }
  }, [hasMore, loadingMore, loadMore, isNearBottom]);

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;
    void sendMessage(text, null);
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    });
  }, [inputValue, sendMessage]);

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
    ta.style.height = `${Math.min(ta.scrollHeight, 96)}px`;
  }, []);

  const voterMap = useRef<Map<string, { name: string; color: string; avatarUrl: string | null }>>(
    new Map()
  );
  useEffect(() => {
    const m = new Map<string, { name: string; color: string; avatarUrl: string | null }>();
    for (const v of voters) {
      m.set(v.voter_id, {
        name: v.display_name ?? v.name,
        color: v.pin_color,
        avatarUrl: v.avatar_url ?? null,
      });
    }
    voterMap.current = m;
  }, [voters]);

  const getVoter = (vid: string) =>
    voterMap.current.get(vid) ?? { name: "Someone", color: "#4A5468", avatarUrl: null };

  const readSet = useRef(new Set<string>());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedNodes = useRef(new Map<Element, string>());

  useEffect(() => {
    readSet.current = new Set<string>();
    for (const [msgId, arr] of Object.entries(reads)) {
      if (arr.some((r) => r.voter_id === voterId)) {
        readSet.current.add(msgId);
      }
    }
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

  // --- Long-press / swipe conflict resolution ---
  const touchState = useRef<{
    startX: number;
    startY: number;
    timer: ReturnType<typeof setTimeout> | null;
    msgId: string;
    swiped: boolean;
  } | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, msg: MessageRow, bubbleEl: HTMLDivElement | null) => {
      const touch = e.touches[0];
      const state = {
        startX: touch.clientX,
        startY: touch.clientY,
        timer: null as ReturnType<typeof setTimeout> | null,
        msgId: msg.id,
        swiped: false,
      };
      state.timer = setTimeout(() => {
        if (state.swiped) return;
        if (!bubbleEl) return;
        e.preventDefault();
        const rect = bubbleEl.getBoundingClientRect();
        const viewH = window.innerHeight;
        const isTopArea = rect.top < viewH * 0.2;
        const PICKER_HALF_WIDTH = 140;
        const rawX = rect.left + rect.width / 2;
        const clampedX = Math.max(PICKER_HALF_WIDTH, Math.min(rawX, window.innerWidth - PICKER_HALF_WIDTH));
        setPickerPos({
          x: clampedX,
          y: isTopArea ? rect.bottom + 8 : rect.top - 8,
          above: !isTopArea,
        });
        setPickerMessageId(msg.id);
      }, 500);
      touchState.current = state;
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent, msg: MessageRow) => {
      const state = touchState.current;
      if (!state || state.msgId !== msg.id) return;
      const touch = e.touches[0];
      const dx = touch.clientX - state.startX;
      const dy = Math.abs(touch.clientY - state.startY);

      if (Math.abs(dx) > 10 || dy > 10) {
        if (state.timer) {
          clearTimeout(state.timer);
          state.timer = null;
        }
      }

      if (!state.swiped && dx > 40 && dy < 30) {
        state.swiped = true;
        setNudgedMessageId(msg.id);
        setReplyingTo(msg);
        setTimeout(() => setNudgedMessageId(null), 300);
      }
    },
    [setReplyingTo]
  );

  const handleTouchEnd = useCallback(() => {
    const state = touchState.current;
    if (state?.timer) {
      clearTimeout(state.timer);
    }
    touchState.current = null;
  }, []);

  // Desktop long-press via mouse
  const mouseState = useRef<{
    timer: ReturnType<typeof setTimeout> | null;
    msgId: string;
  } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, msg: MessageRow, bubbleEl: HTMLDivElement | null) => {
      if (e.button !== 0) return;
      const state = {
        timer: null as ReturnType<typeof setTimeout> | null,
        msgId: msg.id,
      };
      state.timer = setTimeout(() => {
        if (!bubbleEl) return;
        const rect = bubbleEl.getBoundingClientRect();
        const viewH = window.innerHeight;
        const isTopArea = rect.top < viewH * 0.2;
        const PICKER_HALF_WIDTH = 140;
        const rawX = rect.left + rect.width / 2;
        const clampedX = Math.max(PICKER_HALF_WIDTH, Math.min(rawX, window.innerWidth - PICKER_HALF_WIDTH));
        setPickerPos({
          x: clampedX,
          y: isTopArea ? rect.bottom + 8 : rect.top - 8,
          above: !isTopArea,
        });
        setPickerMessageId(msg.id);
      }, 500);
      mouseState.current = state;
    },
    []
  );

  const handleMouseUp = useCallback(() => {
    if (mouseState.current?.timer) {
      clearTimeout(mouseState.current.timer);
    }
    mouseState.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (mouseState.current?.timer) {
      clearTimeout(mouseState.current.timer);
    }
    mouseState.current = null;
  }, []);

  // Prevent native context menu on long-press
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Dismiss reaction picker
  useEffect(() => {
    if (!pickerMessageId) return;
    const dismiss = () => {
      setPickerMessageId(null);
      setPickerPos(null);
    };
    const handle = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-reaction-picker]")) return;
      dismiss();
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [pickerMessageId]);

  // Scroll to original message on reply quote tap
  const scrollToMessage = useCallback((msgId: string) => {
    const node = messageRefs.current.get(msgId);
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedId(msgId);
    setTimeout(() => setHighlightedId(null), 800);
  }, []);

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        setToastMsg("Image must be under 10MB");
        return;
      }
      const tempId = `uploading-${Date.now()}`;
      setUploadingId(tempId);
      const result = await uploadChatImage(file);
      setUploadingId(null);
      if (!result.ok) {
        setToastMsg("Couldn't upload image. Try again.");
        return;
      }
      await sendMessage(null, result.url);
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "instant" });
      });
    },
    [sendMessage]
  );

  const renderedMessages = useMemo(() => {
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
      const msgReactions = reactions[msg.id] ?? [];
      const groupedR = groupReactions(msgReactions);
      const msgReads = (reads[msg.id] ?? []).filter(
        (r) => r.voter_id !== msg.voter_id
      );

      const replyMsg = msg.reply_to_id
        ? messages.find((m) => m.id === msg.reply_to_id) ?? null
        : null;

      if (msg.is_deleted) {
        elements.push(
          <div
            key={msg.id}
            ref={(node) => {
              observeMessage(node, msg);
              if (node) messageRefs.current.set(msg.id, node);
            }}
            className={`flex ${isOwn ? "justify-end" : "justify-start"} ${
              grouped ? "mt-[2px]" : "mt-4"
            } ${highlightedId === msg.id ? "rounded-card bg-accent/10 transition-colors duration-[800ms]" : ""}`}
          >
            <p className="max-w-[85%] px-3 py-2 text-base italic text-ink-dim">
              This message was deleted
            </p>
          </div>
        );
        continue;
      }

      elements.push(
        <MessageBubble
          key={msg.id}
          msg={msg}
          isOwn={isOwn}
          grouped={grouped}
          isLast={isLast}
          voter={voter}
          groupedReactions={groupedR}
          msgReads={msgReads}
          replyMsg={replyMsg}
          voterId={voterId}
          highlighted={highlightedId === msg.id}
          nudged={nudgedMessageId === msg.id}
          getVoter={getVoter}
          onObserve={observeMessage}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onContextMenu={handleContextMenu}
          onReactionTap={(emoji) => {
            const existing = msgReactions.find(
              (r) => r.voter_id === voterId && r.emoji === emoji
            );
            if (existing) {
              void removeReaction(msg.id);
            } else {
              void addReaction(msg.id, emoji);
            }
          }}
          onReplyTap={() => setReplyingTo(msg)}
          onScrollToReply={scrollToMessage}
          onSeenByTap={() => setSeenByMessageId(msg.id)}
          onRefSet={(node) => {
            if (node) messageRefs.current.set(msg.id, node);
          }}
          onImageExpand={(url) => setViewerUrl(url)}
        />
      );
    }

    return elements;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- voters updates voterMap ref; including it ensures name/color changes re-render
  }, [messages, reactions, reads, voterId, highlightedId, nudgedMessageId, voters, observeMessage, handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseUp, handleMouseLeave, handleContextMenu, addReaction, removeReaction, setReplyingTo, scrollToMessage]);

  const hasContent = inputValue.trim().length > 0;

  // Seen-by sheet data
  const seenByReads = seenByMessageId
    ? (reads[seenByMessageId] ?? [])
        .filter((r) => {
          const msg = messages.find((m) => m.id === seenByMessageId);
          return msg ? r.voter_id !== msg.voter_id : true;
        })
        .sort(
          (a, b) =>
            new Date(a.read_at).getTime() - new Date(b.read_at).getTime()
        )
    : [];

  return (
    <div className="flex h-[calc(100dvh-3.5rem-64px-env(safe-area-inset-bottom))] flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex flex-1 flex-col justify-start overflow-y-scroll px-4 pt-6 pb-6"
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

        <div className="flex-1 min-h-0" />

        <ErrorBoundary
          fallback={
            <div className="flex flex-1 items-center justify-center">
              <p className="text-meta text-ink-muted">
                Couldn&apos;t load messages. Pull to refresh.
              </p>
            </div>
          }
        >
          {renderedMessages}
        </ErrorBoundary>

        {uploadingId && (
          <div className="mt-4 flex justify-end">
            <div
              className="flex max-w-[85%] items-center gap-2 bg-green px-3 py-3 opacity-60 shadow-sm"
              style={{ borderRadius: "12px 12px 4px 12px" }}
            >
              <Icon name="progress_activity" size={20} className="animate-spin text-bg" />
              <span className="text-base font-bold text-bg">Uploading...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {showNewPill && (
        <div className="pointer-events-none flex justify-center pb-2">
          <button
            type="button"
            onClick={() => {
              requestAnimationFrame(() => {
                bottomRef.current?.scrollIntoView({ behavior: "instant" });
              });
              setShowNewPill(false);
            }}
            className="pointer-events-auto rounded-full bg-green px-4 py-1.5 text-meta font-semibold text-bg shadow-overlay"
          >
            New message ↓
          </button>
        </div>
      )}

      {showScrollButton && (
        <button
          type="button"
          aria-label="Scroll to bottom"
          onClick={() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                bottomRef.current?.scrollIntoView({ behavior: "instant" });
              });
            });
            setShowScrollButton(false);
          }}
          className="fixed left-1/2 -translate-x-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-surface border border-border shadow-overlay text-ink-muted"
          style={{ bottom: "calc(64px + env(safe-area-inset-bottom) + 88px)" }}
        >
          <Icon name="expand_circle_down" size={24} />
        </button>
      )}

      {/* Reaction picker overlay */}
      {pickerMessageId && pickerPos && (
        <div
          data-reaction-picker
          className="fixed z-50 flex items-center gap-1 rounded-full border border-border-strong bg-raised px-3 py-2 shadow-overlay"
          style={{
            left: pickerPos.x,
            top: pickerPos.y,
            transform: pickerPos.above
              ? "translate(-50%, -100%)"
              : "translate(-50%, 0)",
          }}
        >
          {EMOJI_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="flex h-8 w-8 items-center justify-center text-[22px]"
              onClick={() => {
                const existing = (reactions[pickerMessageId] ?? []).find(
                  (r) => r.voter_id === voterId && r.emoji === emoji
                );
                if (existing) {
                  void removeReaction(pickerMessageId);
                } else {
                  void addReaction(pickerMessageId, emoji);
                }
                setPickerMessageId(null);
                setPickerPos(null);
              }}
            >
              {emoji}
            </button>
          ))}
          {voterId === SUPERADMIN_VOTER_ID && (
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center text-red"
              aria-label="Delete message (admin)"
              onClick={() => {
                void hardDeleteMessage(pickerMessageId);
                setPickerMessageId(null);
                setPickerPos(null);
              }}
            >
              <Icon name="delete" size={20} />
            </button>
          )}
        </div>
      )}

      <div className="flex-none bg-raised border-t border-white/[0.07] py-0 pb-[env(safe-area-inset-bottom)]" style={{ boxShadow: "0 -4px 16px rgba(0,0,0,0.5)" }}>
        {/* Reply preview bar */}
        <div
          className="overflow-hidden transition-all duration-[160ms] ease-out"
          style={{ maxHeight: replyingTo ? 64 : 0 }}
        >
          {replyingTo && (
            <div className="flex items-center gap-2 border-l-2 border-accent bg-surface px-3 py-2 mb-1">
              <div className="min-w-0 flex-1">
                <p className="truncate text-meta text-ink-muted">
                  Replying to {getVoter(replyingTo.voter_id).name}
                </p>
                <p className="truncate text-meta text-ink-dim">
                  {replyingTo.image_url && !replyingTo.content
                    ? "Photo"
                    : replyingTo.content ?? ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="flex h-11 w-11 flex-none items-center justify-center text-ink-muted"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-end gap-2 py-3 px-4">
          <button
            type="button"
            onClick={() => router.push("/social/camera?from=chat")}
            aria-label="Take a photo"
            className="flex h-11 w-11 flex-none items-center justify-center text-ink-muted transition-opacity hover:opacity-80"
          >
            <Icon name="photo_camera" size={24} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.heic,.heif,.webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImageUpload(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload an image"
            className="flex h-11 w-11 flex-none items-center justify-center text-ink-muted transition-opacity hover:opacity-80"
          >
            <Icon name="photo_library" size={24} />
          </button>

          <div className="flex-1 flex items-center bg-surface rounded-card px-4 py-2 min-h-[44px] focus-within:ring-2 ring-accent transition-all">
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
              className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-base text-ink resize-none py-1 h-auto max-h-[120px] placeholder:text-ink-dim"
            />
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={!hasContent}
            aria-label="Send message"
            className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-green text-bg active:scale-95 transition-all disabled:opacity-50 shadow-lg"
          >
            <Icon name="send" size={24} />
          </button>
        </div>
      </div>

      {/* Seen-by bottom sheet */}
      <BottomSheet
        open={!!seenByMessageId}
        onClose={() => setSeenByMessageId(null)}
        label="Seen by"
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="min-w-0 flex-1 truncate text-title font-bold text-ink">
            Seen by
          </h2>
          <button
            type="button"
            onClick={() => setSeenByMessageId(null)}
            aria-label="Close"
            className="flex h-11 w-11 flex-none items-center justify-center text-ink-muted transition hover:text-ink"
          >
            <Icon name="close" size={22} />
          </button>
        </div>
        <div className="space-y-0">
          {seenByReads.map((r) => {
            const v = getVoter(r.voter_id);
            return (
              <div
                key={r.voter_id}
                className="flex h-11 items-center gap-3"
              >
                <SenderAvatar name={v.name} color={v.color} avatarUrl={v.avatarUrl} />
                <span className="min-w-0 flex-1 truncate text-base text-ink">
                  {v.name}
                </span>
                <span className="text-meta text-ink-dim">
                  at{" "}
                  {new Date(r.read_at).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </BottomSheet>

      {viewerUrl && (
        <ImageViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />
      )}

      {toastMsg && (
        <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />
      )}
    </div>
  );
}

