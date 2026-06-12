"use client";

import Link from "next/link";
import { cities } from "@/data/cities";
import type { City } from "@/data/types";
import { useGroupData } from "@/hooks/useGroupData";
import { useVotes } from "@/hooks/useVotes";
import { useNameGate } from "./NamePrompt";
import { Icon } from "./Icon";

export type CitySort = "distance" | "walk" | "name" | "state";

export const SORT_OPTIONS: { value: CitySort; label: string; pillLabel: string }[] = [
  { value: "distance", label: "Distance from Ralston", pillLabel: "Distance" },
  { value: "walk", label: "Walkability Score", pillLabel: "Walk Score" },
  { value: "name", label: "City Name A–Z", pillLabel: "City Name" },
  { value: "state", label: "By State", pillLabel: "State" },
];

const SORT_KEY = "bh2-city-sort";

export function loadSort(): CitySort {
  try {
    const raw = window.localStorage.getItem(SORT_KEY);
    if (raw === "distance" || raw === "walk" || raw === "name" || raw === "state") return raw;
  } catch {
    // storage unavailable — default below
  }
  return "distance";
}

export function storeSort(sort: CitySort) {
  try {
    window.localStorage.setItem(SORT_KEY, sort);
  } catch {
    // storage unavailable — sort lives for the session only
  }
}

function sortCities(sort: CitySort): City[] {
  const list = [...cities];
  switch (sort) {
    case "distance":
      return list.sort((a, b) => a.miles - b.miles || a.name.localeCompare(b.name));
    case "walk":
      return list.sort((a, b) => b.walkScore - a.walkScore || a.name.localeCompare(b.name));
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case "state":
      return list.sort((a, b) => a.state.localeCompare(b.state) || a.name.localeCompare(b.name));
  }
}

const STATE_NAMES: Record<string, string> = {
  IA: "Iowa",
  KS: "Kansas",
  MO: "Missouri",
  NE: "Nebraska",
  SD: "South Dakota",
};

// Static class lookups so Tailwind sees every grade utility.
const GRADE_TEXT: Record<string, string> = {
  a: "text-grade-a",
  b: "text-grade-b",
  c: "text-grade-c",
  d: "text-grade-d",
  f: "text-grade-f",
};
const GRADE_BADGE: Record<string, string> = {
  a: "bg-grade-a/15 text-grade-a",
  b: "bg-grade-b/15 text-grade-b",
  c: "bg-grade-c/15 text-grade-c",
  d: "bg-grade-d/15 text-grade-d",
  f: "bg-grade-f/15 text-grade-f",
};

function gradeKey(grade: string): string {
  const k = grade.charAt(0).toLowerCase();
  return k in GRADE_TEXT ? k : "f";
}

interface CityRowProps {
  city: City;
  active: boolean;
  voted: boolean;
  onVote: (city: City, voted: boolean) => void;
}

function CityRow({ city, active, voted, onVote }: CityRowProps) {
  const k = gradeKey(city.walkGrade);

  return (
    <li className={`border-b ${active ? "bg-raised" : ""}`}>
      <div className="flex min-h-[72px] items-center gap-2 pl-4 pr-2">
        <Link
          href={`/city/${city.id}`}
          className="flex min-h-[72px] min-w-0 flex-1 items-center gap-3 py-2"
        >
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-1.5">
              <span className="truncate text-title font-bold text-ink">{city.name}</span>
              <span className="label flex-none">{city.state}</span>
            </span>
            <span className="mt-0.5 block truncate text-meta font-normal text-ink-dim">
              {city.district}
            </span>
          </span>
          <span className="flex w-[96px] flex-none items-center justify-center gap-1.5">
            <span className={`text-display ${GRADE_TEXT[k]}`}>{city.walkScore}</span>
            <span className={`rounded-full px-2 py-0.5 text-meta font-bold ${GRADE_BADGE[k]}`}>
              {city.walkGrade}
            </span>
          </span>
          <span className="w-[72px] flex-none text-right">
            <span className="block text-title font-bold text-ink">{city.miles} mi</span>
            <span className="block whitespace-nowrap text-meta font-normal text-ink-muted">
              {city.drive}
            </span>
          </span>
        </Link>
        <button
          type="button"
          aria-label={voted ? `Remove your vote for ${city.name}` : `Vote for ${city.name}`}
          aria-pressed={voted}
          onClick={() => onVote(city, voted)}
          className={`flex h-11 w-11 flex-none items-center justify-center rounded-btn transition ${
            voted ? "text-accent" : "text-ink-dim hover:text-ink-muted"
          }`}
        >
          <Icon name="how_to_vote" filled={voted} size={22} />
        </button>
      </div>
    </li>
  );
}

/**
 * Sticky column labels for the index — rides just below the 56px wordmark
 * bar, fully opaque, and mirrors the row grid exactly (flex-1 name column,
 * 96px walkability, 72px distance, 44px vote, same gaps and padding).
 */
function ColumnHeader() {
  return (
    <div className="sticky top-14 z-10 flex h-9 items-center gap-2 border-b bg-bg pl-4 pr-2">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="label min-w-0 flex-1 !text-ink-dim">City</span>
        <span className="label w-[96px] flex-none whitespace-nowrap text-center !text-ink-dim">
          Walkability
        </span>
        <span className="label w-[72px] flex-none text-right !text-ink-dim">Distance</span>
      </div>
      <span className="label w-11 flex-none text-center !text-ink-dim">Vote</span>
    </div>
  );
}

interface CityListProps {
  sort: CitySort;
  /** Highlights the open city when the list rides along on desktop detail. */
  activeCityId?: string;
  /** Sticky column header row — the /cities page only. */
  withHeader?: boolean;
}

/** The walkability index — every city, sorted the user's way. */
export function CityList({ sort, activeCityId, withHeader = false }: CityListProps) {
  const { setCityVote } = useGroupData();
  const { myCityId } = useVotes();
  const { requireName, prompt } = useNameGate();
  const sorted = sortCities(sort);

  const handleVote = (city: City, voted: boolean) =>
    requireName(() => void setCityVote(voted ? null : city.id));

  const row = (city: City) => (
    <CityRow
      key={city.id}
      city={city}
      active={city.id === activeCityId}
      voted={city.id === myCityId}
      onVote={handleVote}
    />
  );

  if (sort !== "state") {
    return (
      <>
        {withHeader && <ColumnHeader />}
        <ul>{sorted.map(row)}</ul>
        {prompt}
      </>
    );
  }

  const groups: { state: string; cities: City[] }[] = [];
  for (const city of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.state === city.state) last.cities.push(city);
    else groups.push({ state: city.state, cities: [city] });
  }

  return (
    <div>
      {withHeader && <ColumnHeader />}
      {groups.map((group) => (
        <section key={group.state}>
          <h2 className="label border-b bg-bg px-4 pb-2 pt-5">
            {STATE_NAMES[group.state] ?? group.state}
          </h2>
          <ul>{group.cities.map(row)}</ul>
        </section>
      ))}
      {prompt}
    </div>
  );
}
