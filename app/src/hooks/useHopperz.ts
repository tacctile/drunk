"use client";

import { useEffect, useMemo, useState } from "react";
import { useGroupData } from "@/hooks/useGroupData";
import { useLocations } from "@/hooks/useLocations";
import { getRoleForVoter, type UserRole } from "@/lib/roles";
import { getSupabase } from "@/lib/supabase";

export interface HopperzVoter {
  voter_id: string;
  display_name: string;
  pin_color: string;
  avatar_url: string | null;
  role: UserRole;
  isYou: boolean;
  isSharing: boolean;
  noteCount: number;
}

export function useHopperz() {
  const { voters, voterId } = useGroupData();
  const { activeLocations } = useLocations();
  const [noteCounts, setNoteCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  const activeVoters = useMemo(
    () => voters.filter((v) => v.is_active),
    [voters],
  );

  useEffect(() => {
    const ids = activeVoters.map((v) => v.voter_id);
    if (ids.length === 0) {
      setNoteCounts(new Map());
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const sb = getSupabase();
      if (!sb) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const { data } = await sb
          .from("v2_voter_notes")
          .select("voter_id, id")
          .in("voter_id", ids);
        if (cancelled) return;
        const map = new Map<string, number>();
        if (data) {
          for (const row of data) {
            map.set(row.voter_id, (map.get(row.voter_id) ?? 0) + 1);
          }
        }
        setNoteCounts(map);
      } catch {
        // silent
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [activeVoters]);

  const sharingSet = useMemo(
    () => new Set(activeLocations.map((l) => l.voter_id)),
    [activeLocations],
  );

  const hopperzVoters = useMemo<HopperzVoter[]>(() => {
    const list = activeVoters.map((v): HopperzVoter => ({
      voter_id: v.voter_id,
      display_name: v.display_name ?? v.name,
      pin_color: v.pin_color,
      avatar_url: v.avatar_url ?? null,
      role: getRoleForVoter(v.voter_id, v.role ?? null),
      isYou: v.voter_id === voterId,
      isSharing: sharingSet.has(v.voter_id),
      noteCount: noteCounts.get(v.voter_id) ?? 0,
    }));
    list.sort((a, b) => {
      if (a.isYou) return -1;
      if (b.isYou) return 1;
      return a.display_name.localeCompare(b.display_name);
    });
    return list;
  }, [activeVoters, voterId, sharingSet, noteCounts]);

  return { voters: hopperzVoters, loading };
}
