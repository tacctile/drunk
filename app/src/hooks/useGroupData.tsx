"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getSupabase,
  safeSelect,
  type AvailabilityRow,
  type CityVoteRow,
  type HotelVoteRow,
  type VoterRow,
} from "@/lib/supabase";
import { compare as comparePin, hash as hashPin } from "bcryptjs";
import { assignColor, PIN_COLORS } from "@/lib/colors";
import {
  buildDisplayName,
  clearIdentity,
  getStoredAvatarUrl,
  getStoredName,
  getStoredPinColor,
  getVoterId,
  isValidPin,
  newVoterId,
  storeAvatarUrl,
  storeIdentity,
  storePinColor,
} from "@/lib/identity";

// Silent-fallback caches. Every successful server write mirrors into these;
// when Supabase is unreachable the app keeps working from them (the rest of
// the group's data simply isn't visible until we're back online).
const CITY_VOTE_CACHE = "bh2-city-vote-cache"; // CityVoteRow | null
const HOTEL_VOTE_CACHE = "bh2-hotel-vote-cache"; // Record<cityId, HotelVoteRow>
const AVAIL_CACHE = "bh2-avail-cache"; // Record<dateKey, status>

function readCache<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable — nothing to do, never surface it
  }
}

/** Cached writes belong to the previous identity — drop them on switch. */
function clearWriteCaches() {
  writeCache(CITY_VOTE_CACHE, null);
  writeCache(HOTEL_VOTE_CACHE, null);
  writeCache(AVAIL_CACHE, null);
}

export type SignInResult = "ok" | "wrong-pin" | "error";

export interface HotelPref {
  placeId: string;
  name: string;
}

interface GroupDataValue {
  /** First load has settled (server or fallback). */
  ready: boolean;
  voterId: string;
  /** Current voter's name; empty string until they introduce themselves. */
  name: string;
  voters: VoterRow[];
  cityVotes: CityVoteRow[];
  hotelVotes: HotelVoteRow[];
  availability: AvailabilityRow[];
  /** localStorage holds an identity the server roster can't verify. */
  identityInvalid: boolean;
  /** New account: name + last initial + 2-digit PIN (stored bcrypt-hashed). */
  createIdentity: (first: string, lastInitial: string, pin: string) => Promise<boolean>;
  /** Cross-device sign-in: verify PIN against the stored hash, adopt the identity. */
  signIn: (targetVoterId: string, pin: string) => Promise<SignInResult>;
  /** Profile edits — rename, re-PIN, or update avatar for the current voter. */
  updateProfile: (changes: { displayName?: string; pin?: string; avatar_url?: string | null }) => Promise<void>;
  /** Set or clear moderator role on a target voter. */
  setModeratorRole: (targetVoterId: string, isModerator: boolean) => Promise<void>;
  /** Forget this device's identity. The voter row and their group data remain. */
  signOut: () => void;
  /** One city vote per person; null clears it. */
  setCityVote: (cityId: string | null) => Promise<void>;
  /** One preferred hotel per person per city; null clears that city's pick. */
  setHotelPref: (cityId: string, pref: HotelPref | null) => Promise<void>;
  setAvailability: (dateKey: string, status: "available" | "unavailable" | null) => Promise<void>;
}

const GroupDataContext = createContext<GroupDataValue | null>(null);

export function GroupDataProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [voterId, setVoterId] = useState("");
  const [name, setName] = useState("");
  const [voters, setVoters] = useState<VoterRow[]>([]);
  const [cityVotes, setCityVotes] = useState<CityVoteRow[]>([]);
  const [hotelVotes, setHotelVotes] = useState<HotelVoteRow[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [identityInvalid, setIdentityInvalid] = useState(false);
  const voterIdRef = useRef("");
  const nameRef = useRef("");
  // An identity created or signed into this session is trusted even before
  // the server roster reflects it (it syncs on the first write).
  const adoptedRef = useRef(false);

  /** Overlay this device's cached writes wherever the server copy lacks them. */
  const overlayLocal = useCallback(
    (
      serverVoters: VoterRow[] | null,
      serverCity: CityVoteRow[] | null,
      serverHotel: HotelVoteRow[] | null,
      serverAvail: AvailabilityRow[] | null,
    ) => {
      const me = voterIdRef.current;
      const myName = nameRef.current;

      const v = serverVoters ? [...serverVoters] : [];
      if (myName && !v.some((r) => r.voter_id === me)) {
        v.push({
          voter_id: me,
          name: myName,
          display_name: myName,
          pin_color: getStoredPinColor() ?? PIN_COLORS[0],
          is_active: true,
          avatar_url: null,
          role: null,
        });
      }

      const cv = serverCity ? [...serverCity] : [];
      const cachedCity = readCache<CityVoteRow>(CITY_VOTE_CACHE);
      if (cachedCity && !cv.some((r) => r.voter_id === me)) cv.push({ ...cachedCity, voter_id: me });

      const hv = serverHotel ? [...serverHotel] : [];
      const cachedHotel = readCache<Record<string, HotelVoteRow>>(HOTEL_VOTE_CACHE);
      if (cachedHotel) {
        for (const row of Object.values(cachedHotel)) {
          if (!hv.some((r) => r.voter_id === me && r.city_id === row.city_id)) {
            hv.push({ ...row, voter_id: me });
          }
        }
      }

      const av = serverAvail ? [...serverAvail] : [];
      const cachedAvail = readCache<Record<string, "available" | "unavailable">>(AVAIL_CACHE);
      if (cachedAvail) {
        for (const [date, status] of Object.entries(cachedAvail)) {
          if (!av.some((r) => r.voter_id === me && r.date === date)) {
            av.push({ voter_id: me, date, status });
          }
        }
      }

      setVoters(v);
      setCityVotes(cv);
      setHotelVotes(hv);
      setAvailability(av);
    },
    [],
  );

  const refetch = useCallback(async () => {
    const [sv, sc, sh, sa] = await Promise.all([
      safeSelect<VoterRow>("v2_voters", "voter_id,name,display_name,pin_color,is_active,avatar_url,role"),
      safeSelect<CityVoteRow>("v2_city_votes", "voter_id,city_id,updated_at"),
      safeSelect<HotelVoteRow>(
        "v2_hotel_votes",
        "voter_id,city_id,hotel_place_id,hotel_name,updated_at",
      ),
      safeSelect<AvailabilityRow>("v2_availability", "voter_id,date,status"),
    ]);
    // Keep caches in sync with server truth for this voter.
    const me = voterIdRef.current;
    // A stored identity the live roster doesn't know can't be verified —
    // the return-user flow is auto-shown so they can sign back in.
    if (sv && !adoptedRef.current) {
      setIdentityInvalid(Boolean(me && nameRef.current && !sv.some((r) => r.voter_id === me)));
    }
    // The server-assigned color is the truth — keep the avatar cache aligned
    // (also retires colors picked with the deleted swatch picker).
    if (sv) {
      const mine = sv.find((r) => r.voter_id === me);
      if (mine?.pin_color) storePinColor(mine.pin_color);
      if (mine?.avatar_url !== undefined) storeAvatarUrl(mine.avatar_url ?? null);
    }
    if (sc) {
      const mine = sc.find((r) => r.voter_id === me);
      writeCache(CITY_VOTE_CACHE, mine ?? null);
    }
    if (sh) {
      const mine: Record<string, HotelVoteRow> = {};
      for (const r of sh) if (r.voter_id === me) mine[r.city_id] = r;
      writeCache(HOTEL_VOTE_CACHE, mine);
    }
    if (sa) {
      const mine: Record<string, string> = {};
      for (const r of sa) if (r.voter_id === me) mine[r.date] = r.status;
      writeCache(AVAIL_CACHE, mine);
    }
    overlayLocal(sv, sc, sh, sa);
    setReady(true);
  }, [overlayLocal]);

  // Bootstrap identity, first fetch, realtime, and refresh-on-focus.
  useEffect(() => {
    const id = getVoterId();
    voterIdRef.current = id;
    setVoterId(id);
    const storedName = getStoredName();
    nameRef.current = storedName;
    setName(storedName);

    void refetch();

    const sb = getSupabase();
    let channel: ReturnType<NonNullable<typeof sb>["channel"]> | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const queueRefetch = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void refetch(), 250);
    };
    if (sb) {
      try {
        channel = sb.channel("bh2-live");
        for (const table of ["v2_voters", "v2_city_votes", "v2_hotel_votes", "v2_availability"]) {
          channel.on("postgres_changes", { event: "*", schema: "public", table }, queueRefetch);
        }
        channel.subscribe();
      } catch {
        channel = null;
      }
    }

    const onFocus = () => void refetch();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      if (timer) clearTimeout(timer);
      if (channel && sb) void sb.removeChannel(channel);
    };
  }, [refetch]);

  /** Switch this device to the given identity and drop the old one's caches. */
  const adoptIdentity = useCallback((id: string, displayName: string) => {
    adoptedRef.current = true;
    voterIdRef.current = id;
    nameRef.current = displayName;
    setVoterId(id);
    setName(displayName);
    setIdentityInvalid(false);
    storeIdentity(id, displayName);
    clearWriteCaches();
    setVoters((prev) => {
      const next = prev.filter((v) => v.voter_id !== id);
      next.push({
        voter_id: id,
        name: displayName,
        display_name: displayName,
        pin_color: getStoredPinColor() ?? PIN_COLORS[0],
        is_active: true,
        avatar_url: getStoredAvatarUrl(),
        role: null,
      });
      return next;
    });
  }, []);

  const createIdentity = useCallback(
    async (first: string, lastInitial: string, pin: string) => {
      const displayName = buildDisplayName(first, lastInitial);
      if (!displayName || !isValidPin(pin)) return false;
      // Always a fresh uuid — reusing the device id could hijack the row of
      // whoever was signed in here before.
      const id = newVoterId();
      adoptIdentity(id, displayName);
      try {
        const sb = getSupabase();
        // Auto-assigned, never user-selectable: the Nth registered voter gets
        // the Nth pool color, cycling at 25. Offline the count is 0, which
        // matches the column default the row gets when ensureVoter syncs it.
        let existingCount = 0;
        if (sb) {
          const { count, error } = await sb
            .from("v2_voters")
            .select("voter_id", { count: "exact", head: true });
          if (!error && typeof count === "number") existingCount = count;
        }
        const pinColor = assignColor(existingCount);
        storePinColor(pinColor); // instant avatar rendering without a query
        const pinHash = await hashPin(pin, 10);
        await sb?.from("v2_voters").upsert({
          voter_id: id,
          name: displayName,
          display_name: displayName,
          pin_hash: pinHash,
          pin_color: pinColor,
          updated_at: new Date().toISOString(),
        });
      } catch {
        // offline — identity lives locally; ensureVoter syncs the row
        // (without a PIN) on the first successful write
      }
      void refetch();
      return true;
    },
    [adoptIdentity, refetch],
  );

  const signIn = useCallback(
    async (targetVoterId: string, pin: string): Promise<SignInResult> => {
      if (!isValidPin(pin)) return "wrong-pin";
      const sb = getSupabase();
      if (!sb) return "error";
      try {
        const { data, error } = await sb
          .from("v2_voters")
          .select("voter_id,name,display_name,pin_hash,pin_color")
          .eq("voter_id", targetVoterId)
          .maybeSingle();
        if (error || !data) return "error";
        const row = data as VoterRow & { pin_hash: string | null };
        if (row.pin_hash) {
          if (!(await comparePin(pin, row.pin_hash))) return "wrong-pin";
        } else {
          // Voter from before the PIN system — their first sign-in sets it.
          const pinHash = await hashPin(pin, 10);
          await sb
            .from("v2_voters")
            .update({
              pin_hash: pinHash,
              display_name: row.display_name ?? row.name,
              updated_at: new Date().toISOString(),
            })
            .eq("voter_id", targetVoterId);
        }
        // Cache the server-assigned color so the avatar renders instantly.
        if (row.pin_color) storePinColor(row.pin_color);
        adoptIdentity(targetVoterId, row.display_name ?? row.name);
        void refetch();
        return "ok";
      } catch {
        return "error";
      }
    },
    [adoptIdentity, refetch],
  );

  const updateProfile = useCallback(
    async (changes: { displayName?: string; pin?: string; avatar_url?: string | null }) => {
      const me = voterIdRef.current;
      if (!me) return;
      const dn = changes.displayName;
      if (dn) {
        nameRef.current = dn;
        setName(dn);
        storeIdentity(me, dn);
        setVoters((prev) =>
          prev.map((v) => (v.voter_id === me ? { ...v, name: dn, display_name: dn } : v)),
        );
      }
      if (changes.avatar_url !== undefined) {
        setVoters((prev) =>
          prev.map((v) => (v.voter_id === me ? { ...v, avatar_url: changes.avatar_url ?? null } : v)),
        );
      }
      const sb = getSupabase();
      if (!sb) return;
      try {
        const payload: Record<string, unknown> = {
          voter_id: me,
          name: nameRef.current || "Someone",
          display_name: nameRef.current || null,
          updated_at: new Date().toISOString(),
        };
        if (changes.pin && isValidPin(changes.pin)) {
          payload.pin_hash = await hashPin(changes.pin, 10);
          payload.pin_plain = changes.pin;
        }
        if (changes.avatar_url !== undefined) {
          payload.avatar_url = changes.avatar_url;
        }
        await sb.from("v2_voters").upsert(payload);
      } catch {
        // offline — the rename converges via ensureVoter on the next write;
        // a PIN change is dropped (the old PIN keeps working)
      }
      void refetch();
    },
    [refetch],
  );

  const setModeratorRole = useCallback(
    async (targetVoterId: string, isMod: boolean) => {
      setVoters((prev) =>
        prev.map((v) =>
          v.voter_id === targetVoterId ? { ...v, role: isMod ? "moderator" : null } : v,
        ),
      );
      const sb = getSupabase();
      if (!sb) return;
      try {
        await sb
          .from("v2_voters")
          .update({ role: isMod ? "moderator" : null, updated_at: new Date().toISOString() })
          .eq("voter_id", targetVoterId);
      } catch {
        // silent
      }
    },
    [],
  );

  const signOut = useCallback(() => {
    // Forget who this device is — bh2-voter-id / -name / -pin-color go, and
    // the cached writes belong to the departing identity. Server rows stay.
    clearIdentity();
    clearWriteCaches();
    adoptedRef.current = false;
    voterIdRef.current = "";
    nameRef.current = "";
    setVoterId("");
    setName("");
    setIdentityInvalid(false);
  }, []);

  /** Voter row must exist before any FK write lands. Never touches pin_hash
   *  or pin_color (an insert takes the column default; an update keeps the
   *  assigned color). */
  const ensureVoter = useCallback(async (now: string) => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from("v2_voters").upsert({
      voter_id: voterIdRef.current,
      name: nameRef.current || "Someone",
      display_name: nameRef.current || null,
      updated_at: now,
    });
  }, []);

  const setCityVote = useCallback(
    async (cityId: string | null) => {
      const me = voterIdRef.current;
      const now = new Date().toISOString();
      const row: CityVoteRow | null = cityId ? { voter_id: me, city_id: cityId, updated_at: now } : null;

      // Optimistic — one city per person, no spinners.
      setCityVotes((prev) => {
        const next = prev.filter((r) => r.voter_id !== me);
        if (row) next.push(row);
        return next;
      });
      writeCache(CITY_VOTE_CACHE, row);

      const sb = getSupabase();
      if (!sb) return;
      try {
        await ensureVoter(now);
        if (row) await sb.from("v2_city_votes").upsert(row);
        else await sb.from("v2_city_votes").delete().eq("voter_id", me);
      } catch {
        // cached locally; converges on next successful refetch
      }
    },
    [ensureVoter],
  );

  const setHotelPref = useCallback(
    async (cityId: string, pref: HotelPref | null) => {
      const me = voterIdRef.current;
      const now = new Date().toISOString();
      const row: HotelVoteRow | null = pref
        ? {
            voter_id: me,
            city_id: cityId,
            hotel_place_id: pref.placeId,
            hotel_name: pref.name,
            updated_at: now,
          }
        : null;

      setHotelVotes((prev) => {
        const next = prev.filter((r) => !(r.voter_id === me && r.city_id === cityId));
        if (row) next.push(row);
        return next;
      });
      const cached = readCache<Record<string, HotelVoteRow>>(HOTEL_VOTE_CACHE) ?? {};
      if (row) cached[cityId] = row;
      else delete cached[cityId];
      writeCache(HOTEL_VOTE_CACHE, cached);

      const sb = getSupabase();
      if (!sb) return;
      try {
        await ensureVoter(now);
        if (row) await sb.from("v2_hotel_votes").upsert(row, { onConflict: "voter_id,city_id" });
        else await sb.from("v2_hotel_votes").delete().eq("voter_id", me).eq("city_id", cityId);
      } catch {
        // cached locally; converges on next successful refetch
      }
    },
    [ensureVoter],
  );

  const setAvailabilityFor = useCallback(
    async (dateKey: string, status: "available" | "unavailable" | null) => {
      const me = voterIdRef.current;
      setAvailability((prev) => {
        const next = prev.filter((r) => !(r.voter_id === me && r.date === dateKey));
        if (status) next.push({ voter_id: me, date: dateKey, status });
        return next;
      });
      const cached = readCache<Record<string, "available" | "unavailable">>(AVAIL_CACHE) ?? {};
      if (status) cached[dateKey] = status;
      else delete cached[dateKey];
      writeCache(AVAIL_CACHE, cached);

      const sb = getSupabase();
      if (!sb) return;
      const now = new Date().toISOString();
      try {
        await ensureVoter(now);
        if (status) {
          await sb
            .from("v2_availability")
            .upsert(
              { voter_id: me, date: dateKey, status, updated_at: now },
              { onConflict: "voter_id,date" },
            );
        } else {
          await sb.from("v2_availability").delete().eq("voter_id", me).eq("date", dateKey);
        }
      } catch {
        // cached locally; converges on next successful refetch
      }
    },
    [ensureVoter],
  );

  const value = useMemo<GroupDataValue>(
    () => ({
      ready,
      voterId,
      name,
      voters,
      cityVotes,
      hotelVotes,
      availability,
      identityInvalid,
      createIdentity,
      signIn,
      updateProfile,
      signOut,
      setCityVote,
      setHotelPref,
      setAvailability: setAvailabilityFor,
      setModeratorRole,
    }),
    [ready, voterId, name, voters, cityVotes, hotelVotes, availability, identityInvalid, createIdentity, signIn, updateProfile, signOut, setCityVote, setHotelPref, setAvailabilityFor, setModeratorRole],
  );

  return <GroupDataContext.Provider value={value}>{children}</GroupDataContext.Provider>;
}

export function useGroupData(): GroupDataValue {
  const ctx = useContext(GroupDataContext);
  if (!ctx) throw new Error("useGroupData must be used inside GroupDataProvider");
  return ctx;
}
