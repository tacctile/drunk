"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cities } from "@/data/cities";
import type { City, Hotel } from "@/data/types";
import { useGroupData } from "./useGroupData";

export interface VoterTag {
  voterId: string;
  name: string;
  isYou: boolean;
}

export interface HotelTally {
  hotel: Hotel;
  count: number;
  voters: VoterTag[];
}

export interface CityTally {
  city: City;
  count: number;
  voters: VoterTag[];
  hotelRanking: HotelTally[]; // only hotels present in city data with votes, sorted desc
  leadingHotel: HotelTally | null;
}

export interface VotesView {
  ranking: CityTally[]; // every city with >= 1 vote, sorted desc then A–Z
  countFor: (cityId: string) => number;
  leader: CityTally | null;
  runnerUp: CityTally | null;
  totalVotes: number;
  myCityId: string | null;
  myHotelId: string | null;
  myName: string;
  hasVoted: boolean;
  /**
   * City ids whose vote state just changed because of OTHER voters — drives
   * the one-shot row/hero pulse, then clears after a short TTL. Your own
   * optimistic writes never land here.
   */
  recentlyChangedCityIds: ReadonlySet<string>;
}

const EMPTY_SET: ReadonlySet<string> = new Set();
const PULSE_TTL_MS = 1600;

export function useVotes(): VotesView {
  const { cityVotes, hotelVotes, voters, voterId, name } = useGroupData();

  const [recentlyChangedCityIds, setRecentlyChangedCityIds] =
    useState<ReadonlySet<string>>(EMPTY_SET);
  const prevOthersRef = useRef<Map<string, string> | null>(null);

  // Diff other people's votes between renders; a new, moved, or removed vote
  // marks both the city it landed on and the one it left.
  useEffect(() => {
    const next = new Map(
      cityVotes.filter((r) => r.voter_id !== voterId).map((r) => [r.voter_id, r.city_id]),
    );
    const prev = prevOthersRef.current;
    prevOthersRef.current = next;
    if (!prev) return; // first settle — nothing to pulse

    const changed = new Set<string>();
    for (const [vid, cid] of next) {
      const before = prev.get(vid);
      if (before !== cid) {
        changed.add(cid);
        if (before) changed.add(before);
      }
    }
    for (const [vid, cid] of prev) {
      if (!next.has(vid)) changed.add(cid);
    }
    if (changed.size === 0) return;

    setRecentlyChangedCityIds(changed);
    const timer = setTimeout(() => setRecentlyChangedCityIds(EMPTY_SET), PULSE_TTL_MS);
    return () => clearTimeout(timer);
  }, [cityVotes, voterId]);

  return useMemo(() => {
    const nameOf = (id: string) =>
      voters.find((v) => v.voter_id === id)?.name ?? "Someone";
    const tag = (id: string): VoterTag => ({
      voterId: id,
      name: nameOf(id),
      isYou: id === voterId,
    });

    const ranking: CityTally[] = [];
    for (const city of cities) {
      const cv = cityVotes.filter((r) => r.city_id === city.id);
      if (cv.length === 0) continue;
      const hv = hotelVotes.filter((r) => r.city_id === city.id);
      // Iterating city.hotels means hotel ids missing from the data (removed
      // placeholders, stale rows) are skipped gracefully by construction.
      const hotelRanking: HotelTally[] = [];
      for (const hotel of city.hotels) {
        const hvs = hv.filter((r) => r.hotel_id === hotel.id);
        if (hvs.length === 0) continue;
        hotelRanking.push({ hotel, count: hvs.length, voters: hvs.map((r) => tag(r.voter_id)) });
      }
      hotelRanking.sort((a, b) => b.count - a.count || a.hotel.name.localeCompare(b.hotel.name));
      ranking.push({
        city,
        count: cv.length,
        voters: cv.map((r) => tag(r.voter_id)),
        hotelRanking,
        leadingHotel: hotelRanking[0] ?? null,
      });
    }
    ranking.sort((a, b) => b.count - a.count || a.city.name.localeCompare(b.city.name));

    const mine = cityVotes.find((r) => r.voter_id === voterId) ?? null;
    const myHotel = hotelVotes.find((r) => r.voter_id === voterId) ?? null;

    return {
      ranking,
      countFor: (cityId: string) => ranking.find((t) => t.city.id === cityId)?.count ?? 0,
      leader: ranking[0] ?? null,
      runnerUp: ranking[1] ?? null,
      totalVotes: cityVotes.length,
      myCityId: mine?.city_id ?? null,
      myHotelId: myHotel?.hotel_id ?? null,
      myName: name,
      hasVoted: mine !== null,
      recentlyChangedCityIds,
    };
  }, [cityVotes, hotelVotes, voters, voterId, name, recentlyChangedCityIds]);
}
