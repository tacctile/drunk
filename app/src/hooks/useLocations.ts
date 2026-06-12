"use client";

// Live location sharing (v2_locations). Sharing is opt-in and off by default,
// always. Toggling on writes a row that dies 72 hours later; toggling off
// deletes it. Only the Bar Hoppers row is ever touched — device location
// settings never are. Muting is one-directional: your muted_ids hides YOUR
// pin from those people, and they are never told.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGroupData } from "@/hooks/useGroupData";
import { PIN_COLORS } from "@/lib/colors";
import { getStoredPinColor } from "@/lib/identity";
import { getSupabase, safeSelect, type LocationRow } from "@/lib/supabase";

const MUTED_IDS_KEY = "bh2-muted-ids";
const SHARING_PREF_KEY = "bh2-sharing-preference";
// Each hook instance subscribes under its own channel topic. Two mounts can
// coexist (the locate page + the profile overlay) — a shared topic would make
// the second join close the first and silently kill its realtime feed.
let channelSeq = 0;
const LOCATION_COLUMNS =
  "voter_id,display_name,lat,lng,pin_color,sharing_since,expires_at,updated_at,muted_ids";
const UPDATE_MS = 60_000; // sharer re-sends coords every minute
const CLOCK_MS = 30_000; // expiry filter + "min ago" labels re-evaluate
const EXPIRY_MS = 72 * 60 * 60 * 1000;

export type ToggleSharingResult = "on" | "off" | "denied" | "error";

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage unavailable — prefs live for the session only
  }
}

function readStoredMutedIds(): string[] {
  try {
    const parsed: unknown = JSON.parse(readStorage(MUTED_IDS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** One browser fix. Resolves (never rejects) so callers can branch on denial. */
function getPosition(): Promise<{ lat: number; lng: number } | "denied" | "error"> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => resolve(err.code === err.PERMISSION_DENIED ? "denied" : "error"),
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 20_000 },
    );
  });
}

export interface LocationsValue {
  /** Everyone visible to this user — unexpired, not hiding from you, you first. */
  activeLocations: LocationRow[];
  /** Your own unexpired row, when sharing. */
  myLocation: LocationRow | null;
  isSharing: boolean;
  mutedIds: string[];
  /** Re-render clock (ms) — keeps "X min ago" and expiry honest. */
  now: number;
  /** voter_id → pin_color for all registered users, from v2_voters. */
  voterColors: Record<string, string>;
  toggleSharing: () => Promise<ToggleSharingResult>;
  muteUser: (voterId: string) => Promise<void>;
  unmuteUser: (voterId: string) => Promise<void>;
}

export function useLocations(): LocationsValue {
  const { voterId, name } = useGroupData();
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [mutedIds, setMutedIds] = useState<string[]>([]);
  const [voterColors, setVoterColors] = useState<Record<string, string>>({});
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const autoShareRef = useRef(false);

  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const voterIdRef = useRef(voterId);
  voterIdRef.current = voterId;
  const nameRef = useRef(name);
  nameRef.current = name;
  const mutedRef = useRef(mutedIds);
  mutedRef.current = mutedIds;
  // Local intent while a write is in flight (true = just enabled, false =
  // just disabled, null = follow the server) so a racing refetch can't
  // flicker the toggle.
  const desiredRef = useRef<boolean | null>(null);
  const syncedFromServerRef = useRef(false);

  // Seed the mute prefs from localStorage so they apply when sharing starts.
  useEffect(() => {
    setMutedIds(readStoredMutedIds());
  }, []);

  // Fetch pin_colors for all registered voters once on mount.
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    void sb
      .from("v2_voters")
      .select("voter_id,pin_color")
      .then((res: { data: Array<{ voter_id: string; pin_color: string | null }> | null }) => {
        if (!res.data) return;
        const map: Record<string, string> = {};
        for (const row of res.data) {
          if (row.voter_id && row.pin_color) map[row.voter_id] = row.pin_color;
        }
        setVoterColors(map);
      });
  }, []);

  const refetch = useCallback(async () => {
    const data = await safeSelect<LocationRow>("v2_locations", LOCATION_COLUMNS);
    if (!data) return; // offline — keep what we have
    const me = voterIdRef.current;
    const serverMine = data.find((r) => r.voter_id === me);
    let next = data;
    if (desiredRef.current === true && !serverMine) {
      const localMine = rowsRef.current.find((r) => r.voter_id === me);
      if (localMine) next = [...data, localMine];
    } else if (desiredRef.current === false && serverMine) {
      next = data.filter((r) => r.voter_id !== me);
    } else {
      desiredRef.current = null; // server caught up with local intent
    }
    setRows(next);
    setInitialFetchDone(true);
    // The first server copy of my row wins over localStorage mute prefs.
    if (serverMine && !syncedFromServerRef.current) {
      syncedFromServerRef.current = true;
      const muted = Array.isArray(serverMine.muted_ids) ? serverMine.muted_ids : [];
      setMutedIds(muted);
      writeStorage(MUTED_IDS_KEY, JSON.stringify(muted));
    }
  }, []);

  // First fetch, realtime subscription, label clock, refresh on focus.
  useEffect(() => {
    void refetch();

    const sb = getSupabase();
    let channel: ReturnType<NonNullable<typeof sb>["channel"]> | null = null;
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const queueRefetch = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => void refetch(), 250);
    };
    if (sb) {
      try {
        channel = sb.channel(`bh2-locations-${++channelSeq}`);
        channel.on(
          "postgres_changes",
          { event: "*", schema: "public", table: "v2_locations" },
          queueRefetch,
        );
        channel.subscribe();
      } catch {
        channel = null;
      }
    }

    const clock = setInterval(() => setNow(Date.now()), CLOCK_MS);
    const onFocus = () => void refetch();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(clock);
      if (debounce) clearTimeout(debounce);
      if (channel && sb) void sb.removeChannel(channel);
    };
  }, [refetch]);

  const myLocation = useMemo(
    () =>
      rows.find(
        (r) => r.voter_id === voterId && new Date(r.expires_at).getTime() > now,
      ) ?? null,
    [rows, voterId, now],
  );
  const isSharing = myLocation !== null;
  const isSharingRef = useRef(isSharing);
  isSharingRef.current = isSharing;

  // Expired rows and rows hiding from this user never leave the hook.
  const activeLocations = useMemo(() => {
    return rows
      .filter(
        (r) =>
          new Date(r.expires_at).getTime() > now &&
          (r.voter_id === voterId || !(r.muted_ids ?? []).includes(voterId)),
      )
      .sort((a, b) => {
        if (a.voter_id === voterId) return -1;
        if (b.voter_id === voterId) return 1;
        return a.display_name.localeCompare(b.display_name);
      });
  }, [rows, voterId, now]);

  /** Voter row must exist before the FK write lands. Never touches pin_hash. */
  const ensureVoter = useCallback(async (nowIso: string) => {
    await getSupabase()?.from("v2_voters").upsert({
      voter_id: voterIdRef.current,
      name: nameRef.current || "Someone",
      display_name: nameRef.current || null,
      updated_at: nowIso,
    });
  }, []);

  const pushCoords = useCallback(async (lat: number, lng: number) => {
    const me = voterIdRef.current;
    const nowIso = new Date().toISOString();
    setRows((prev) =>
      prev.map((r) => (r.voter_id === me ? { ...r, lat, lng, updated_at: nowIso } : r)),
    );
    try {
      await getSupabase()
        ?.from("v2_locations")
        .update({ lat, lng, updated_at: nowIso })
        .eq("voter_id", me);
    } catch {
      // offline — the next tick converges
    }
  }, []);

  // While sharing: refresh coords every minute. Resumes only when the browser
  // permission is already granted — a live row from an earlier session must
  // never cause a surprise permission prompt.
  useEffect(() => {
    if (!isSharing) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      void getPosition().then((pos) => {
        if (!cancelled && typeof pos === "object") void pushCoords(pos.lat, pos.lng);
      });
    };
    const arm = () => {
      if (!cancelled && !timer) timer = setInterval(tick, UPDATE_MS);
    };

    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((status) => {
          if (status.state === "granted") arm();
        })
        .catch(arm);
    } else {
      arm();
    }

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [isSharing, pushCoords]);

  const toggleSharing = useCallback(async (): Promise<ToggleSharingResult> => {
    const me = voterIdRef.current;
    if (!me) return "error";
    const sb = getSupabase();

    if (isSharingRef.current) {
      // Stop sharing within Bar Hoppers only — delete the row, touch nothing
      // on the device.
      writeStorage(SHARING_PREF_KEY, "false");
      desiredRef.current = false;
      setRows((prev) => prev.filter((r) => r.voter_id !== me));
      try {
        await sb?.from("v2_locations").delete().eq("voter_id", me);
      } catch {
        // offline — the row dies on its own at expires_at
      }
      return "off";
    }

    const pos = await getPosition();
    if (pos === "denied" || pos === "error") return pos;
    writeStorage(SHARING_PREF_KEY, "true");

    const nowIso = new Date().toISOString();
    const row: LocationRow = {
      voter_id: me,
      display_name: nameRef.current || "Someone",
      lat: pos.lat,
      lng: pos.lng,
      // Auto-assigned at registration (v2_voters.pin_color), cached by the
      // identity layer — never picked here.
      pin_color: getStoredPinColor() ?? PIN_COLORS[0],
      sharing_since: nowIso,
      expires_at: new Date(Date.now() + EXPIRY_MS).toISOString(),
      updated_at: nowIso,
      muted_ids: mutedRef.current,
    };
    desiredRef.current = true;
    setRows((prev) => [...prev.filter((r) => r.voter_id !== me), row]);
    try {
      await ensureVoter(nowIso);
      await sb?.from("v2_locations").upsert(row);
    } catch {
      // offline — sharing shows locally; converges when we're back
    }
    return "on";
  }, [ensureVoter]);

  // Auto-start sharing for first-time visitors (no stored preference).
  useEffect(() => {
    if (!initialFetchDone || autoShareRef.current) return;
    autoShareRef.current = true;
    if (readStorage(SHARING_PREF_KEY) !== null) return;
    if (isSharingRef.current) {
      writeStorage(SHARING_PREF_KEY, "true");
      return;
    }
    void toggleSharing();
  }, [initialFetchDone, toggleSharing]);

  const setMuted = useCallback(async (targetId: string, muted: boolean) => {
    const current = mutedRef.current;
    const next = muted
      ? current.includes(targetId)
        ? current
        : [...current, targetId]
      : current.filter((id) => id !== targetId);
    setMutedIds(next);
    writeStorage(MUTED_IDS_KEY, JSON.stringify(next));
    if (!isSharingRef.current) return; // applies when sharing starts
    const me = voterIdRef.current;
    const nowIso = new Date().toISOString();
    setRows((prev) =>
      prev.map((r) => (r.voter_id === me ? { ...r, muted_ids: next, updated_at: nowIso } : r)),
    );
    try {
      await getSupabase()
        ?.from("v2_locations")
        .update({ muted_ids: next, updated_at: nowIso })
        .eq("voter_id", me);
    } catch {
      // offline — the localStorage copy re-applies on the next share
    }
  }, []);

  const muteUser = useCallback((id: string) => setMuted(id, true), [setMuted]);
  const unmuteUser = useCallback((id: string) => setMuted(id, false), [setMuted]);

  return useMemo(
    () => ({
      activeLocations,
      myLocation,
      isSharing,
      mutedIds,
      now,
      voterColors,
      toggleSharing,
      muteUser,
      unmuteUser,
    }),
    [activeLocations, myLocation, isSharing, mutedIds, now, voterColors, toggleSharing, muteUser, unmuteUser],
  );
}
