"use client";

// Live location sharing (v2_locations). Sharing is opt-in and off by default,
// always. Toggling on writes a row that dies 72 hours later; toggling off
// deletes it. Only the Bar Hoppers row is ever touched — device location
// settings never are. Muting is one-directional: your muted_ids hides YOUR
// pin from those people, and they are never told.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGroupData } from "@/hooks/useGroupData";
import { getSupabase, safeSelect, type LocationRow } from "@/lib/supabase";

/** Preset pin palette — the user picks once and it persists (bh2-pin-color). */
export const PIN_PALETTE = [
  "#FF8C42", // amber-orange (default)
  "#34D399", // green
  "#60A5FA", // blue
  "#F472B6", // pink
  "#A78BFA", // purple
  "#FBBF24", // yellow
  "#F87171", // red
  "#22D3EE", // cyan
  "#FB923C", // orange
  "#E2E8F0", // near-white
] as const;
export const DEFAULT_PIN_COLOR: string = PIN_PALETTE[0];

const PIN_COLOR_KEY = "bh2-pin-color";
const MUTED_IDS_KEY = "bh2-muted-ids";
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
  pinColor: string;
  mutedIds: string[];
  /** Re-render clock (ms) — keeps "X min ago" and expiry honest. */
  now: number;
  toggleSharing: () => Promise<ToggleSharingResult>;
  updatePinColor: (color: string) => Promise<void>;
  muteUser: (voterId: string) => Promise<void>;
  unmuteUser: (voterId: string) => Promise<void>;
}

export function useLocations(): LocationsValue {
  const { voterId, name } = useGroupData();
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [pinColor, setPinColor] = useState<string>(DEFAULT_PIN_COLOR);
  const [mutedIds, setMutedIds] = useState<string[]>([]);

  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const voterIdRef = useRef(voterId);
  voterIdRef.current = voterId;
  const nameRef = useRef(name);
  nameRef.current = name;
  const pinColorRef = useRef(pinColor);
  pinColorRef.current = pinColor;
  const mutedRef = useRef(mutedIds);
  mutedRef.current = mutedIds;
  // Local intent while a write is in flight (true = just enabled, false =
  // just disabled, null = follow the server) so a racing refetch can't
  // flicker the toggle.
  const desiredRef = useRef<boolean | null>(null);
  const syncedFromServerRef = useRef(false);

  // Seed prefs from localStorage so the picker pre-selects next time.
  useEffect(() => {
    const stored = readStorage(PIN_COLOR_KEY);
    if (stored && (PIN_PALETTE as readonly string[]).includes(stored)) setPinColor(stored);
    setMutedIds(readStoredMutedIds());
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
    // The first server copy of my row wins over localStorage prefs.
    if (serverMine && !syncedFromServerRef.current) {
      syncedFromServerRef.current = true;
      if ((PIN_PALETTE as readonly string[]).includes(serverMine.pin_color)) {
        setPinColor(serverMine.pin_color);
        writeStorage(PIN_COLOR_KEY, serverMine.pin_color);
      }
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
        channel = sb.channel("bh2-locations");
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

    const nowIso = new Date().toISOString();
    const row: LocationRow = {
      voter_id: me,
      display_name: nameRef.current || "Someone",
      lat: pos.lat,
      lng: pos.lng,
      pin_color: pinColorRef.current,
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

  const updatePinColor = useCallback(async (color: string) => {
    setPinColor(color);
    writeStorage(PIN_COLOR_KEY, color);
    if (!isSharingRef.current) return;
    const me = voterIdRef.current;
    const nowIso = new Date().toISOString();
    setRows((prev) =>
      prev.map((r) => (r.voter_id === me ? { ...r, pin_color: color, updated_at: nowIso } : r)),
    );
    try {
      await getSupabase()
        ?.from("v2_locations")
        .update({ pin_color: color, updated_at: nowIso })
        .eq("voter_id", me);
    } catch {
      // offline — the color is saved locally either way
    }
  }, []);

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
      pinColor,
      mutedIds,
      now,
      toggleSharing,
      updatePinColor,
      muteUser,
      unmuteUser,
    }),
    [activeLocations, myLocation, isSharing, pinColor, mutedIds, now, toggleSharing, updatePinColor, muteUser, unmuteUser],
  );
}
