"use client";

import Link from "next/link";
import { cities } from "@/data/cities";
import type { City } from "@/data/types";
import { useGroupData } from "@/hooks/useGroupData";
import { useTripData } from "@/hooks/useTripData";
import { useVotes } from "@/hooks/useVotes";
import { lsGet, lsSet } from "@/lib/storage";
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
  const raw = lsGet(SORT_KEY);
  if (raw === "distance" || raw === "walk" || raw === "name" || raw === "state") return raw;
  return "distance";
}

export function storeSort(sort: CitySort) {
  lsSet(SORT_KEY, sort);
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
  TX: "Texas",
};

const GRADE_TEXT: Record<string, string> = {
  a: "text-grade-a",
  b: "text-grade-b",
  c: "text-grade-c",
  d: "text-grade-d",
  f: "text-grade-f",
};
const GRADE_BADGE: Record<string, string> = {
  a: "bg-grade-a/10 text-grade-a border border-grade-a/20",
  b: "bg-grade-b/10 text-grade-b border border-grade-b/20",
  c: "bg-grade-c/10 text-grade-c border border-grade-c/20",
  d: "bg-grade-d/10 text-grade-d border border-grade-d/20",
  f: "bg-grade-f/10 text-grade-f border border-grade-f/20",
};

function gradeKey(grade: string): string {
  const k = grade.charAt(0).toLowerCase();
  return k in GRADE_TEXT ? k : "f";
}

interface CityRowProps {
  city: City;
  active: boolean;
  voted: boolean;
  locked: boolean;
  onVote: (city: City, voted: boolean) => void;
}

function CityRow({ city, active, voted, locked, onVote }: CityRowProps) {
  const k = gradeKey(city.walkGrade);

  return (
    <li>
      <div
        className={`relative flex min-h-[80px] items-center px-4 py-4 transition-all duration-150 active:scale-[0.98] ${
          voted
            ? "border-l-[4px] border-l-accent bg-accent/5"
            : active
              ? "bg-raised"
              : "border-b border-border/10 hover:bg-surface/50"
        }`}
      >
        <Link
          href={`/plan/city/${city.id}`}
          className="absolute inset-0 z-0"
          aria-label={`View ${city.name} details`}
        />

        {/* City — 35% */}
        <div className="pointer-events-none w-[35%] min-w-0 flex-col">
          <div className="flex items-baseline gap-1">
            <span className="truncate text-title font-bold text-ink">{city.name}</span>
            <span className="flex-none text-[11px] font-semibold text-ink-muted">{city.state}</span>
          </div>
          <span className="mt-0.5 block truncate text-meta text-ink-muted opacity-70">
            {city.district}
          </span>
        </div>

        {/* Walk — 20% */}
        <div className="pointer-events-none flex w-[20%] flex-col items-center">
          <span className={`text-display ${GRADE_TEXT[k]}`}>{city.walkScore}</span>
          <div className={`rounded-full px-2 py-0.5 ${GRADE_BADGE[k]}`}>
            <span className="text-[10px] font-extrabold uppercase tracking-tighter">
              Grade {city.walkGrade}
            </span>
          </div>
        </div>

        {/* Distance — 25% */}
        <div className="pointer-events-none flex w-[25%] flex-col items-end">
          <span className="text-title font-bold text-ink">{city.miles} mi</span>
          <span className="text-meta text-ink-muted">{city.drive}</span>
        </div>

        {/* Vote — 15% */}
        <div className="relative z-10 flex w-[15%] justify-end">
          <button
            type="button"
            aria-label={
              locked
                ? "Voting locked"
                : voted
                  ? `Remove your vote for ${city.name}`
                  : `Vote for ${city.name}`
            }
            aria-pressed={voted}
            disabled={locked}
            onClick={(e) => {
              e.stopPropagation();
              onVote(city, voted);
            }}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
              locked
                ? "pointer-events-none opacity-40"
                : voted
                  ? "bg-accent text-bg shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
                  : "text-ink-muted opacity-40 hover:opacity-100"
            }`}
          >
            <Icon name="how_to_vote" filled={voted} />
          </button>
        </div>
      </div>
    </li>
  );
}

function ColumnHeader() {
  return (
    <div className="sticky top-14 z-10 flex items-center border-b border-border/30 bg-bg px-4 py-2">
      <div className="w-[35%]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">City</span>
      </div>
      <div className="w-[20%] text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Walk</span>
      </div>
      <div className="w-[25%] text-right">
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
          Distance
        </span>
      </div>
      <div className="w-[15%] text-right">
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Vote</span>
      </div>
    </div>
  );
}

interface CityListProps {
  sort: CitySort;
  activeCityId?: string;
  withHeader?: boolean;
}

export function CityList({ sort, activeCityId, withHeader = false }: CityListProps) {
  const { setCityVote } = useGroupData();
  const { myCityId } = useVotes();
  const { effectiveStatus } = useTripData();
  const { requireName, prompt } = useNameGate();
  const sorted = sortCities(sort);
  const votingLocked = effectiveStatus === "upcoming" || effectiveStatus === "active";

  const handleVote = (city: City, voted: boolean) =>
    requireName(() => void setCityVote(voted ? null : city.id));

  const row = (city: City) => (
    <CityRow
      key={city.id}
      city={city}
      active={city.id === activeCityId}
      voted={city.id === myCityId}
      locked={votingLocked}
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
          <h2 className="border-b border-border/30 bg-bg px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-ink-muted">
            {STATE_NAMES[group.state] ?? group.state}
          </h2>
          <ul>{group.cities.map(row)}</ul>
        </section>
      ))}
      {prompt}
    </div>
  );
}
