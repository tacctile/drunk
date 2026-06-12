"use client";

import { useMemo } from "react";
import { todayKey } from "@/lib/format";
import { useGroupData } from "./useGroupData";

export type DayStatus = "available" | "unavailable";

export interface DayBreakdown {
  date: string;
  available: { voterId: string; name: string; isYou: boolean }[];
  unavailable: { voterId: string; name: string; isYou: boolean }[];
  noResponse: { voterId: string; name: string; isYou: boolean }[];
}

export interface AvailabilityView {
  /** My own calendar: dateKey -> status. */
  mine: Record<string, DayStatus>;
  /** Group breakdown for a date (includes who hasn't responded). */
  breakdownFor: (date: string) => DayBreakdown;
  /** available-count / roster-size heat, 0..1. */
  heatFor: (date: string) => number;
  availableCountFor: (date: string) => number;
  hasResponsesFor: (date: string) => boolean;
  /** Upcoming date where the most people are free. */
  bestDate: { date: string; available: number; total: number } | null;
  /** Every date with at least one response, chronological. */
  allResponseDates: string[];
  rosterSize: number;
  /** Whether the current voter has marked any dates. */
  hasMarkedDates: boolean;
}

export function useAvailability(): AvailabilityView {
  const { availability, voters, voterId } = useGroupData();

  return useMemo(() => {
    const today = todayKey();
    const tagOf = (id: string) => {
      const voter = voters.find((v) => v.voter_id === id);
      return {
        voterId: id,
        name: voter ? voter.display_name ?? voter.name : "Someone",
        isYou: id === voterId,
      };
    };

    const mine: Record<string, DayStatus> = {};
    const byDate = new Map<string, { available: string[]; unavailable: string[] }>();
    for (const row of availability) {
      if (row.voter_id === voterId) mine[row.date] = row.status;
      let entry = byDate.get(row.date);
      if (!entry) {
        entry = { available: [], unavailable: [] };
        byDate.set(row.date, entry);
      }
      entry[row.status].push(row.voter_id);
    }

    const rosterSize = Math.max(voters.length, 1);

    let bestDate: AvailabilityView["bestDate"] = null;
    for (const [date, entry] of byDate) {
      if (date < today || entry.available.length === 0) continue;
      if (
        !bestDate ||
        entry.available.length > bestDate.available ||
        (entry.available.length === bestDate.available && date < bestDate.date)
      ) {
        bestDate = { date, available: entry.available.length, total: rosterSize };
      }
    }

    const allResponseDates = [...byDate.keys()].sort();

    return {
      mine,
      breakdownFor: (date: string) => {
        const entry = byDate.get(date) ?? { available: [], unavailable: [] };
        const responded = new Set([...entry.available, ...entry.unavailable]);
        return {
          date,
          available: entry.available.map(tagOf),
          unavailable: entry.unavailable.map(tagOf),
          noResponse: voters.filter((v) => !responded.has(v.voter_id)).map((v) => tagOf(v.voter_id)),
        };
      },
      heatFor: (date: string) => (byDate.get(date)?.available.length ?? 0) / rosterSize,
      availableCountFor: (date: string) => byDate.get(date)?.available.length ?? 0,
      hasResponsesFor: (date: string) => byDate.has(date),
      bestDate,
      allResponseDates,
      rosterSize,
      hasMarkedDates: Object.keys(mine).length > 0,
    };
  }, [availability, voters, voterId]);
}
