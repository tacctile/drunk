"use client";

import { useMemo } from "react";
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
  hotelRanking: HotelTally[]; // only hotels with votes, sorted desc
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
}

export function useVotes(): VotesView {
  const { cityVotes, hotelVotes, voters, voterId, name } = useGroupData();

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
    };
  }, [cityVotes, hotelVotes, voters, voterId, name]);
}
