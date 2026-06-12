"use client";

// Live location sharing (v2_locations). Sharing is ON by default for
// registered users: the first time a registered device mounts this hook with
// no stored preference, sharing starts automatically — turning it off is
// always an explicit act, persisted in bh2-sharing-preference. Toggling on
// writes a row that dies 72 hours later; toggling off deletes it. Only the
// Bar Hoppers row is ever touched — device location settings never are.
// Muting is one-directional and EMPTY by default (everyone can see you):
// your muted_ids hides YOUR pin from those people, and they are never told.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGroupData } from "@/hooks/useGroupData";
import { PIN_COLORS } from "@/lib/colors";
import { getStoredPinColor, newVoterId } from "@/lib/identity";
import { getSupabase, safeSelect, type LocationRow } from "@/lib/supabase";

const MUTED_IDS_KEY = "bh2-muted-ids";
const SHARING_PREF_KEY = "bh2-sharing-preference";
// Single-device broadcast lock: a fresh uuid is written here on every
// toggle-ON and stamped onto the v2_locations row. Only the device whose
// stored id matches the row may push coords — the newest activation wins.
const SESSION_ID_KEY = "bh2-session-id";
// Each hook instance subscribes under its own channel topic. Two mounts can
// coexist (the locate page + the profile overlay) — a shared topic would make
// the second join close the first and silently kill its realtime feed.
let channelSeq = 0;
const LOCATION_COLUMNS =
  "voter_id,display_name,lat,lng,pin_color,sharing_since,expires_at,updated_at,muted_ids,session_id";
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

// ---------------------------------------------------------------------------
// Shared state. The locate screen and the profile overlay mount this hook at
// the same time, and their sharing toggles must be ONE source of truth. Rows,
// the mute list, and the in-flight intent live at module scope and broadcast
// to every live instance, so flipping the toggle anywhere reflects everywhere
// in the same frame — no waiting on the realtime round trip.

function createShared<T>(initial: T) {
  let value = initial;
  const listeners = new Set<(next: T) => void>();
  return {
    get: () => value,
    set(next: T | ((prev: T) => T)) {
      value = typeof next === "function" ? (next as (prev: T) => T)(value) : next;
      for (const notify of listeners) notify(value);
    },
    subscribe(notify: (next: T) => void) {
      listeners.add(notify);
      return () => {
        listeners.delete(notify);
      };
    },
  };
}

const sharedRows = createShared<LocationRow[]>([]);
/** null until the first instance seeds it from localStorage. */
const sharedMutedIds = createShared<string[] | null>(null);
// Local intent while a write is in flight (true = just enabled, false = just
// disabled, null = follow the server) so a racing refetch in ANY instance
// can't flicker the toggle.
let desiredSharing: boolean | null = null;
// One-shot guards keyed by voter id so an identity switch re-runs them.
let mutedSyncedFromServerFor: string | null = null;
let autoStartAttemptedFor: string | null = null;

function currentMutedIds(): string[] {
  return sharedMutedIds.get() ?? [];
}

export interface LocationsValue {
  /** Everyone visible to this user — unexpired, not hiding from you, you first. */
  activeLocations: LocationRow[];
  /** Your own unexpired row, when sharing. */
  myLocation: LocationRow | null;
  isSharing: boolean;
  /** Admin disabled this voter (v2_voters.is_active = false): the sharing
   *  toggle is locked off and any live row is torn down. Tracks the roster
   *  reactively, so an admin re-enable restores the toggle mid-session. */
  amDisabled: boolean;
  mutedIds: string[];
  /** Re-render clock (ms) — keeps "X min ago" and expiry honest. */
  now: number;
  /** voter_id → pin_color for all registered voters (used for mute-list circles). */
  voterColors: Record<string, string>;
  toggleSharing: () => Promise<ToggleSharingResult>;
  muteUser: (voterId: string) => Promise<void>;
  unmuteUser: (voterId: string) => Promise<void>;
}

export function useLocations(): LocationsValue {
  const { voterId, name, identityInvalid, voters } = useGroupData();
  const [rows, setRows] = useState<LocationRow[]>(sharedRows.get);
  const [now, setNow] = useState(() => Date.now());
  const [mutedIds, setMutedIds] = useState<string[]>(currentMutedIds);
  const [voterColors, setVoterColors] = useState<Record<string, string>>({});
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  const voterIdRef = useRef(voterId);
  voterIdRef.current = voterId;
  const nameRef = useRef(name);
  nameRef.current = name;

  // Voters the admin has disabled. Only a roster row that SAYS false counts —
  // an unreachable roster (offline) never hides anyone. useGroupData keeps
  // this current via its v2_voters realtime subscription + focus refetch, so
  // a mid-session disable/re-enable lands here without a reload.
  const inactiveIds = useMemo(
    () => new Set(voters.filter((v) => v.is_active === false).map((v) => v.voter_id)),
    [voters],
  );
  const amDisabled = inactiveIds.has(voterId);
  const amDisabledRef = useRef(amDisabled);
  amDisabledRef.current = amDisabled;

  // Mirror the module-scoped stores into this instance's render state. The
  // first instance up seeds the mute prefs from localStorage so they apply
  // when sharing starts.
  useEffect(() => {
    const unsubRows = sharedRows.subscribe(setRows);
    const unsubMuted = sharedMutedIds.subscribe((next) => setMutedIds(next ?? []));
    setRows(sharedRows.get());
    if (sharedMutedIds.get() === null) sharedMutedIds.set(readStoredMutedIds());
    else setMutedIds(currentMutedIds());
    return () => {
      unsubRows();
      unsubMuted();
    };
  }, []);

  // Fetch pin_colors for all voters once so the mute list can show colored dots
  // even for people who are not currently sharing.
  useEffect(() => {
    void (async () => {
      const data = await safeSelect<{ voter_id: string; pin_color: string | null }>(
        "v2_voters",
        "voter_id,pin_color",
      );
      if (!data) return;
      const map: Record<string, string> = {};
      for (const v of data) if (v.pin_color) map[v.voter_id] = v.pin_color;
      setVoterColors(map);
    })();
  }, []);

  const refetch = useCallback(async () => {
    const data = await safeSelect<LocationRow>("v2_locations", LOCATION_COLUMNS);
    if (!data) return; // offline — keep what we have
    const me = voterIdRef.current;
    const serverMine = data.find((r) => r.voter_id === me);
    let next = data;
    if (desiredSharing === true && !serverMine) {
      const localMine = sharedRows.get().find((r) => r.voter_id === me);
      if (localMine) next = [...data, localMine];
    } else if (desiredSharing === false && serverMine) {
      next = data.filter((r) => r.voter_id !== me);
    } else {
      desiredSharing = null; // server caught up with local intent
    }
    sharedRows.set(next);
    // The first server copy of my row wins over localStorage mute prefs.
    if (serverMine && mutedSyncedFromServerFor !== me) {
      mutedSyncedFromServerFor = me;
      const muted = Array.isArray(serverMine.muted_ids) ? serverMine.muted_ids : [];
      sharedMutedIds.set(muted);
      writeStorage(MUTED_IDS_KEY, JSON.stringify(muted));
    }
    setInitialFetchDone(true);
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

  // Expired rows, rows hiding from this user, and rows belonging to disabled
  // voters never leave the hook. An absent or empty muted_ids means visible
  // to everyone — nothing is ever hidden by default.
  const activeLocations = useMemo(() => {
    return rows
      .filter(
        (r) =>
          new Date(r.expires_at).getTime() > now &&
          !inactiveIds.has(r.voter_id) &&
          (r.voter_id === voterId || !(r.muted_ids ?? []).includes(voterId)),
      )
      .sort((a, b) => {
        if (a.voter_id === voterId) return -1;
        if (b.voter_id === voterId) return 1;
        return a.display_name.localeCompare(b.display_name);
      });
  }, [rows, voterId, now, inactiveIds]);

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
    sharedRows.set((prev) =>
      prev.map((r) => (r.voter_id === me ? { ...r, lat, lng, updated_at: nowIso } : r)),
    );
    try {
      const sb = getSupabase();
      if (!sb) return;
      // Session-guarded: even if the takeover check below races, a stale
      // device can never overwrite a newer device's position. Rows from
      // before the session system (session_id NULL) pair with devices that
      // never stored a session id.
      const session = readStorage(SESSION_ID_KEY);
      let query = sb
        .from("v2_locations")
        .update({ lat, lng, updated_at: nowIso })
        .eq("voter_id", me);
      query = session ? query.eq("session_id", session) : query.is("session_id", null);
      await query;
    } catch {
      // offline — the next tick converges
    }
  }, []);

  // While sharing: refresh coords every minute. Resumes only when the browser
  // permission is already granted — a live row from an earlier session must
  // never cause a surprise permission prompt. Each tick first verifies this
  // device still owns the broadcast (the row's session_id matches ours); if
  // another device toggled sharing on since, this one stops pushing for good.
  useEffect(() => {
    if (!isSharing) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    const tick = async () => {
      const sb = getSupabase();
      if (sb) {
        try {
          const { data, error } = await sb
            .from("v2_locations")
            .select("session_id")
            .eq("voter_id", voterIdRef.current)
            .maybeSingle();
          if (
            !cancelled &&
            !error &&
            data &&
            (data.session_id ?? null) !== readStorage(SESSION_ID_KEY)
          ) {
            stop(); // another device took over — stop broadcasting from this one
            return;
          }
        } catch {
          // offline — push anyway; the update itself is session-guarded
        }
      }
      if (cancelled) return;
      const pos = await getPosition();
      if (!cancelled && typeof pos === "object") void pushCoords(pos.lat, pos.lng);
    };
    const arm = () => {
      if (!cancelled && !timer) timer = setInterval(() => void tick(), UPDATE_MS);
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
      desiredSharing = false;
      sharedRows.set((prev) => prev.filter((r) => r.voter_id !== me));
      try {
        await sb?.from("v2_locations").delete().eq("voter_id", me);
      } catch {
        // offline — the row dies on its own at expires_at
      }
      writeStorage(SHARING_PREF_KEY, "false");
      return "off";
    }

    // Locked off while admin-disabled — the toggles are grayed out, this is
    // the backstop for any path that still reaches here (e.g. auto-start).
    if (amDisabledRef.current) return "error";

    const pos = await getPosition();
    if (pos === "denied" || pos === "error") return pos;

    // Fresh session id per activation — this device becomes THE broadcaster;
    // any other device's next takeover check sees the mismatch and stops.
    const sessionId = newVoterId();
    writeStorage(SESSION_ID_KEY, sessionId);

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
      muted_ids: currentMutedIds(),
      session_id: sessionId,
    };
    desiredSharing = true;
    sharedRows.set((prev) => [...prev.filter((r) => r.voter_id !== me), row]);
    try {
      await ensureVoter(nowIso);
      await sb?.from("v2_locations").upsert(row);
    } catch {
      // offline — sharing shows locally; converges when we're back
    }
    writeStorage(SHARING_PREF_KEY, "true");
    return "on";
  }, [ensureVoter]);

  // Sharing is ON by default. The first time a REGISTERED identity reaches
  // this hook with no stored bh2-sharing-preference, start sharing
  // automatically (one attempt per identity per session, shared across every
  // mounted instance). Success records "true" inside toggleSharing; a denied
  // prompt or failed fix records "false" so the person is never re-prompted —
  // from then on only the explicit toggles move the preference. Unregistered
  // visitors never auto-start and never burn the key: getVoterId() mints an
  // id for every device, so "registered" here means a verified name — the
  // same gate the locate screen uses.
  useEffect(() => {
    if (!voterId || !name || identityInvalid) return;
    // Admin-disabled voters never auto-start — and the attempt/pref keys stay
    // untouched, so a later re-enable behaves like any registered user.
    if (amDisabled) return;
    if (!initialFetchDone || isSharing) return;
    if (autoStartAttemptedFor === voterId) return;
    if (readStorage(SHARING_PREF_KEY) !== null) return;
    autoStartAttemptedFor = voterId;
    void toggleSharing().then((result) => {
      if (result === "denied" || result === "error") {
        writeStorage(SHARING_PREF_KEY, "false");
      }
    });
  }, [voterId, name, identityInvalid, amDisabled, initialFetchDone, isSharing, toggleSharing]);

  // Admin disabled this voter while they had a live row (or the row outraced
  // the disable): tear sharing down immediately. toggleSharing's off branch
  // deletes the row and records the explicit-off preference — re-enabling
  // never auto-resumes sharing, the person flips the toggle themselves.
  useEffect(() => {
    if (!amDisabled || !isSharing) return;
    void toggleSharing();
  }, [amDisabled, isSharing, toggleSharing]);

  const setMuted = useCallback(async (targetId: string, muted: boolean) => {
    const current = currentMutedIds();
    const next = muted
      ? current.includes(targetId)
        ? current
        : [...current, targetId]
      : current.filter((id) => id !== targetId);
    sharedMutedIds.set(next);
    writeStorage(MUTED_IDS_KEY, JSON.stringify(next));
    if (!isSharingRef.current) return; // applies when sharing starts
    const me = voterIdRef.current;
    const nowIso = new Date().toISOString();
    sharedRows.set((prev) =>
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
      amDisabled,
      mutedIds,
      now,
      voterColors,
      toggleSharing,
      muteUser,
      unmuteUser,
    }),
    [activeLocations, myLocation, isSharing, amDisabled, mutedIds, now, voterColors, toggleSharing, muteUser, unmuteUser],
  );
}
