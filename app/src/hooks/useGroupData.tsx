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
import { getStoredName, getVoterId, sanitizeName, storeName } from "@/lib/identity";

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
  saveName: (raw: string) => Promise<void>;
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
  const voterIdRef = useRef("");
  const nameRef = useRef("");

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
      if (myName && !v.some((r) => r.voter_id === me)) v.push({ voter_id: me, name: myName });

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
      safeSelect<VoterRow>("v2_voters", "voter_id,name"),
      safeSelect<CityVoteRow>("v2_city_votes", "voter_id,city_id,updated_at"),
      safeSelect<HotelVoteRow>(
        "v2_hotel_votes",
        "voter_id,city_id,hotel_place_id,hotel_name,updated_at",
      ),
      safeSelect<AvailabilityRow>("v2_availability", "voter_id,date,status"),
    ]);
    // Keep caches in sync with server truth for this voter.
    const me = voterIdRef.current;
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

    // If we have a name (maybe saved while offline), make sure the roster has us.
    if (storedName) {
      void getSupabase()
        ?.from("v2_voters")
        .upsert({ voter_id: id, name: storedName, updated_at: new Date().toISOString() })
        .then(() => undefined, () => undefined);
    }

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

  const saveName = useCallback(async (raw: string) => {
    const clean = sanitizeName(raw);
    if (!clean) return;
    nameRef.current = clean;
    setName(clean);
    storeName(clean);
    const me = voterIdRef.current;
    setVoters((prev) => {
      const next = prev.filter((v) => v.voter_id !== me);
      next.push({ voter_id: me, name: clean });
      return next;
    });
    try {
      await getSupabase()
        ?.from("v2_voters")
        .upsert({ voter_id: me, name: clean, updated_at: new Date().toISOString() });
    } catch {
      // offline — name is already in localStorage, roster syncs next time
    }
  }, []);

  /** Voter row must exist before any FK write lands. */
  const ensureVoter = useCallback(async (now: string) => {
    const sb = getSupabase();
    if (!sb) return;
    await sb
      .from("v2_voters")
      .upsert({ voter_id: voterIdRef.current, name: nameRef.current || "Someone", updated_at: now });
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
      saveName,
      setCityVote,
      setHotelPref,
      setAvailability: setAvailabilityFor,
    }),
    [ready, voterId, name, voters, cityVotes, hotelVotes, availability, saveName, setCityVote, setHotelPref, setAvailabilityFor],
  );

  return <GroupDataContext.Provider value={value}>{children}</GroupDataContext.Provider>;
}

export function useGroupData(): GroupDataValue {
  const ctx = useContext(GroupDataContext);
  if (!ctx) throw new Error("useGroupData must be used inside GroupDataProvider");
  return ctx;
}
