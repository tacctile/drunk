"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { VoterNoteRow } from "@/lib/supabase";

export interface VoterNotesValue {
  notes: VoterNoteRow[];
  loading: boolean;
  addNote: (voterId: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  refetch: (voterId: string) => Promise<void>;
}

export function useVoterNotes(voterId: string | null): VoterNotesValue {
  const [notes, setNotes] = useState<VoterNoteRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async (id: string) => {
    if (!id) return;
    const sb = getSupabase();
    if (!sb) return;
    setLoading(true);
    try {
      const { data } = await sb
        .from("v2_voter_notes")
        .select("*")
        .eq("voter_id", id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      setNotes((data as VoterNoteRow[]) ?? []);
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (voterId) void refetch(voterId);
  }, [voterId, refetch]);

  const addNote = useCallback(async (id: string, content: string) => {
    const sb = getSupabase();
    if (!sb || !content.trim()) return;
    const optimistic: VoterNoteRow = {
      id: `temp-${Date.now()}`,
      voter_id: id,
      content: content.trim(),
      sort_order: notes.length,
      created_at: new Date().toISOString(),
    };
    setNotes((prev) => [...prev, optimistic]);
    try {
      await sb.from("v2_voter_notes").insert({
        voter_id: id,
        content: content.trim(),
        sort_order: notes.length,
      });
      await refetch(id);
    } catch {
      setNotes((prev) => prev.filter((n) => n.id !== optimistic.id));
    }
  }, [notes.length, refetch]);

  const deleteNote = useCallback(async (id: string) => {
    const prev = notes;
    setNotes((n) => n.filter((note) => note.id !== id));
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb.from("v2_voter_notes").delete().eq("id", id);
    } catch {
      setNotes(prev);
    }
  }, [notes]);

  return { notes, loading, addNote, deleteNote, refetch };
}
