"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { useGroupData } from "./useGroupData";
import {
  CHAT_PAGE_SIZE,
  type MessageRow,
  type ReactionRow,
  type ReadRow,
} from "@/lib/chat";

export function useChat() {
  const { voterId } = useGroupData();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [reactions, setReactions] = useState<Record<string, ReactionRow[]>>({});
  const [reads, setReads] = useState<Record<string, ReadRow[]>>({});
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageRow | null>(null);
  const voterIdRef = useRef(voterId);
  voterIdRef.current = voterId;

  const fetchReactionsForMessages = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const sb = getSupabase();
    if (!sb) return;
    try {
      const { data } = await sb
        .from("v2_message_reactions")
        .select("message_id,voter_id,emoji,created_at")
        .in("message_id", ids);
      if (data) {
        setReactions((prev) => {
          const next = { ...prev };
          for (const row of data as ReactionRow[]) {
            const arr = next[row.message_id] ?? [];
            if (
              !arr.some(
                (r) => r.voter_id === row.voter_id && r.emoji === row.emoji
              )
            ) {
              next[row.message_id] = [...arr, row];
            }
          }
          return next;
        });
      }
    } catch {
      // silent
    }
  }, []);

  const fetchReadsForMessages = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const sb = getSupabase();
    if (!sb) return;
    try {
      const { data } = await sb
        .from("v2_message_reads")
        .select("message_id,voter_id,read_at")
        .in("message_id", ids);
      if (data) {
        setReads((prev) => {
          const next = { ...prev };
          for (const row of data as ReadRow[]) {
            const arr = next[row.message_id] ?? [];
            if (!arr.some((r) => r.voter_id === row.voter_id)) {
              next[row.message_id] = [...arr, row];
            }
          }
          return next;
        });
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const sb = getSupabase();
      if (!sb) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await sb
          .from("v2_messages")
          .select("id,voter_id,content,image_url,reply_to_id,is_deleted,created_at")
          .order("created_at", { ascending: false })
          .limit(CHAT_PAGE_SIZE);
        if (cancelled) return;
        const rows = ((data as MessageRow[]) ?? []).reverse();
        setMessages(rows);
        setHasMore(rows.length === CHAT_PAGE_SIZE);
        const ids = rows.map((m) => m.id);
        void fetchReactionsForMessages(ids);
        void fetchReadsForMessages(ids);
      } catch {
        // silent
      }
      if (!cancelled) setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [fetchReactionsForMessages, fetchReadsForMessages]);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;

    let channel: ReturnType<typeof sb.channel> | null = null;
    try {
      channel = sb.channel("hoppz-chat");

      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "v2_messages" },
        (payload) => {
          const row = payload.new as MessageRow;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            const last = prev[prev.length - 1];
            if (last && new Date(row.created_at) < new Date(last.created_at))
              return prev;
            return [...prev, row];
          });
        }
      );

      channel.on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "v2_messages" },
        (payload) => {
          const row = payload.new as MessageRow;
          setMessages((prev) =>
            prev.map((m) => (m.id === row.id ? row : m))
          );
        }
      );

      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "v2_message_reactions" },
        (payload) => {
          const row = payload.new as ReactionRow;
          setReactions((prev) => {
            const arr = prev[row.message_id] ?? [];
            if (
              arr.some(
                (r) => r.voter_id === row.voter_id && r.emoji === row.emoji
              )
            )
              return prev;
            return { ...prev, [row.message_id]: [...arr, row] };
          });
        }
      );

      channel.on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "v2_message_reactions" },
        (payload) => {
          const old = payload.old as Partial<ReactionRow>;
          setReactions((prev) => {
            const msgId = old.message_id;
            if (!msgId) return prev;
            const arr = prev[msgId];
            if (!arr) return prev;
            const filtered = arr.filter(
              (r) =>
                !(r.voter_id === old.voter_id && r.emoji === old.emoji)
            );
            if (filtered.length === arr.length) return prev;
            const next = { ...prev };
            if (filtered.length === 0) {
              delete next[msgId];
            } else {
              next[msgId] = filtered;
            }
            return next;
          });
        }
      );

      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "v2_message_reads" },
        (payload) => {
          const row = payload.new as ReadRow;
          setReads((prev) => {
            const arr = prev[row.message_id] ?? [];
            if (arr.some((r) => r.voter_id === row.voter_id)) return prev;
            return { ...prev, [row.message_id]: [...arr, row] };
          });
        }
      );

      channel.subscribe();
    } catch {
      channel = null;
    }

    return () => {
      if (channel && sb) void sb.removeChannel(channel);
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const sb = getSupabase();
    if (!sb) {
      setLoadingMore(false);
      return;
    }
    const oldest = messages[0];
    if (!oldest) {
      setLoadingMore(false);
      return;
    }
    try {
      const { data } = await sb
        .from("v2_messages")
        .select("id,voter_id,content,image_url,reply_to_id,is_deleted,created_at")
        .lt("created_at", oldest.created_at)
        .order("created_at", { ascending: false })
        .limit(CHAT_PAGE_SIZE);
      const rows = ((data as MessageRow[]) ?? []).reverse();
      setMessages((prev) => [...rows, ...prev]);
      setHasMore(rows.length === CHAT_PAGE_SIZE);
      const ids = rows.map((m) => m.id);
      void fetchReactionsForMessages(ids);
      void fetchReadsForMessages(ids);
    } catch {
      // silent
    }
    setLoadingMore(false);
  }, [loadingMore, hasMore, messages, fetchReactionsForMessages, fetchReadsForMessages]);

  const sendMessage = useCallback(
    async (content: string | null, imageUrl?: string | null) => {
      const me = voterIdRef.current;
      const trimmed = content?.trim() || null;
      if (!me || (!trimmed && !imageUrl)) return;
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const now = new Date().toISOString();
      const replyId = replyingTo?.id ?? null;
      const optimistic: MessageRow = {
        id: tempId,
        voter_id: me,
        content: trimmed,
        image_url: imageUrl ?? null,
        reply_to_id: replyId,
        is_deleted: false,
        created_at: now,
      };
      setMessages((prev) => [...prev, optimistic]);
      setReplyingTo(null);
      const sb = getSupabase();
      if (!sb) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }
      try {
        const insertPayload: Record<string, unknown> = {
          voter_id: me,
        };
        if (trimmed) insertPayload.content = trimmed;
        if (imageUrl) insertPayload.image_url = imageUrl;
        if (replyId) insertPayload.reply_to_id = replyId;
        const { data, error } = await sb
          .from("v2_messages")
          .insert(insertPayload)
          .select("id,voter_id,content,image_url,reply_to_id,is_deleted,created_at")
          .single();
        if (error || !data) {
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          return;
        }
        const real = data as MessageRow;
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? real : m))
        );
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    },
    [replyingTo]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      const me = voterIdRef.current;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, is_deleted: true } : m
        )
      );
      const sb = getSupabase();
      if (!sb) return;
      try {
        await sb
          .from("v2_messages")
          .update({ is_deleted: true })
          .eq("id", messageId)
          .eq("voter_id", me);
      } catch {
        // silent
      }
    },
    []
  );

  const markRead = useCallback(
    async (messageId: string) => {
      const me = voterIdRef.current;
      if (!me) return;
      setReads((prev) => {
        const arr = prev[messageId] ?? [];
        if (arr.some((r) => r.voter_id === me)) return prev;
        return {
          ...prev,
          [messageId]: [
            ...arr,
            { message_id: messageId, voter_id: me, read_at: new Date().toISOString() },
          ],
        };
      });
      const sb = getSupabase();
      if (!sb) return;
      try {
        await sb.from("v2_message_reads").upsert(
          {
            message_id: messageId,
            voter_id: me,
            read_at: new Date().toISOString(),
          },
          { onConflict: "message_id,voter_id" }
        );
      } catch {
        // silent
      }
    },
    []
  );

  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const me = voterIdRef.current;
      if (!me) return;

      // Check if user already has a reaction on this message
      const existing = (reactions[messageId] ?? []).find(
        (r) => r.voter_id === me
      );
      if (existing) {
        if (existing.emoji === emoji) return;
        await removeReaction(messageId);
      }

      const now = new Date().toISOString();
      const optimistic: ReactionRow = {
        message_id: messageId,
        voter_id: me,
        emoji,
        created_at: now,
      };
      setReactions((prev) => ({
        ...prev,
        [messageId]: [...(prev[messageId] ?? []), optimistic],
      }));

      const sb = getSupabase();
      if (!sb) return;
      try {
        await sb.from("v2_message_reactions").upsert(
          { message_id: messageId, voter_id: me, emoji, created_at: now },
          { onConflict: "message_id,voter_id" }
        );
      } catch {
        // silent
      }
    },
    [reactions]
  );

  const removeReaction = useCallback(
    async (messageId: string) => {
      const me = voterIdRef.current;
      if (!me) return;
      setReactions((prev) => {
        const arr = prev[messageId];
        if (!arr) return prev;
        const filtered = arr.filter((r) => r.voter_id !== me);
        const next = { ...prev };
        if (filtered.length === 0) {
          delete next[messageId];
        } else {
          next[messageId] = filtered;
        }
        return next;
      });
      const sb = getSupabase();
      if (!sb) return;
      try {
        await sb
          .from("v2_message_reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("voter_id", me);
      } catch {
        // silent
      }
    },
    []
  );

  return {
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
    deleteMessage,
    markRead,
    addReaction,
    removeReaction,
  };
}
