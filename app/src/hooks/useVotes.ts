"use client";

import { useMemo } from "react";
import { cities } from "@/data/cities";
import type { City } from "@/data/types";
import { useGroupData } from "./useGroupData";

export interface VoterTag {
  voterId: string;
  name: string;
  isYou: boolean;
}

export interface HotelPrefTally {
  placeId: string;
  name: string;
  count: number;
  voters: VoterTag[];
}

export interface CityTally {
  city: City;
  count: number;
  voters: VoterTag[];
  /** Hotel preferences cast for this city, most-preferred first. */
  hotelPrefs: HotelPrefTally[];
}

export interface VotesView {
  /** Every city with >= 1 vote, sorted desc then A–Z. */
  ranking: CityTally[];
  countFor: (cityId: string) => number;
  totalVotes: number;
  myCityId: string | null;
  /** My preferred hotel place_id for a city, or null. */
  myHotelPrefFor: (cityId: string) => string | null;
  myName: string;
  hasVoted: boolean;
}

export function useVotes(): VotesView {
  const { cityVotes, hotelVotes, voters, voterId, name } = useGroupData();

  return useMemo(() => {
    const nameOf = (id: string) => {
      const voter = voters.find((v) => v.voter_id === id);
      return voter ? voter.display_name ?? voter.name : "Someone";
    };
    const tag = (id: string): VoterTag => ({
      voterId: id,
      name: nameOf(id),
      isYou: id === voterId,
    });

    // Disabled voters (is_active = false) are excluded from every group-facing
    // tally — counts, voter tags, hotel preferences. Their rows still exist
    // (re-enabling restores them instantly); only KNOWN-inactive voters are
    // dropped, so an unreachable roster never hides anyone's data. Personal
    // values below (myCityId, myHotelPrefFor) stay unfiltered on purpose.
    const inactive = new Set(
      voters.filter((v) => v.is_active === false).map((v) => v.voter_id),
    );
    const groupCityVotes = cityVotes.filter((r) => !inactive.has(r.voter_id));
    const groupHotelVotes = hotelVotes.filter((r) => !inactive.has(r.voter_id));

    const ranking: CityTally[] = [];
    for (const city of cities) {
      const cv = groupCityVotes.filter((r) => r.city_id === city.id);
      if (cv.length === 0) continue;

      // Group hotel preferences by place_id; the row carries the display name.
      const byPlace = new Map<string, HotelPrefTally>();
      for (const r of groupHotelVotes) {
        if (r.city_id !== city.id) continue;
        let entry = byPlace.get(r.hotel_place_id);
        if (!entry) {
          entry = { placeId: r.hotel_place_id, name: r.hotel_name, count: 0, voters: [] };
          byPlace.set(r.hotel_place_id, entry);
        }
        entry.count++;
        entry.voters.push(tag(r.voter_id));
      }
      const hotelPrefs = [...byPlace.values()].sort(
        (a, b) => b.count - a.count || a.name.localeCompare(b.name),
      );

      ranking.push({ city, count: cv.length, voters: cv.map((r) => tag(r.voter_id)), hotelPrefs });
    }
    ranking.sort((a, b) => b.count - a.count || a.city.name.localeCompare(b.city.name));

    const mine = cityVotes.find((r) => r.voter_id === voterId) ?? null;
    const myHotelPrefs = new Map(
      hotelVotes.filter((r) => r.voter_id === voterId).map((r) => [r.city_id, r.hotel_place_id]),
    );

    return {
      ranking,
      countFor: (cityId: string) => ranking.find((t) => t.city.id === cityId)?.count ?? 0,
      totalVotes: groupCityVotes.length,
      myCityId: mine?.city_id ?? null,
      myHotelPrefFor: (cityId: string) => myHotelPrefs.get(cityId) ?? null,
      myName: name,
      hasVoted: mine !== null,
    };
  }, [cityVotes, hotelVotes, voters, voterId, name]);
}
