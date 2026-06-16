"use client";

import Link from "next/link";
import { cities } from "@/data/cities";
import type { City } from "@/data/types";
import { useGroupData } from "@/hooks/useGroupData";
import { useTripData } from "@/hooks/useTripData";
import { useVotes } from "@/hooks/useVotes";
import { lsGet, lsSet } from "@/lib/storage";
import { useNameGate } from "./NamePrompt";
import {
  ColumnHeaders,
  GradeBadge,
  SectionLabel,
  VoteButton,
  WalkScoreDisplay,
} from "@hoppz-ui";

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
};

import type { GradeBadgeColorScheme } from "@hoppz-ui";

function gradeColorScheme(grade: string): GradeBadgeColorScheme {
  const k = grade.charAt(0).toLowerCase();
  if (k === "a" || k === "b") return "secondary";
  if (k === "c") return "tertiary";
  return "error";
}

interface CityRowProps {
  city: City;
  active: boolean;
  voted: boolean;
  locked: boolean;
  onVote: (city: City, voted: boolean) => void;
}

function CityRow({ city, active, voted, locked, onVote }: CityRowProps) {
  const colorScheme = gradeColorScheme(city.walkGrade);

  return (
    <li className={`border-b ${active ? "bg-raised" : ""}`}>
      <div className="flex min-h-[72px] items-center gap-2 pl-4 pr-2">
        <Link
          href={`/plan/city/${city.id}`}
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
          <span className="flex w-[96px] flex-none items-center justify-center">
            <WalkScoreDisplay score={city.walkScore} grade={city.walkGrade} colorScheme={colorScheme} />
          </span>
          <span className="w-[72px] flex-none text-right">
            <span className="block text-title font-bold text-ink">{city.miles} mi</span>
            <span className="block whitespace-nowrap text-meta font-normal text-ink-muted">
              {city.drive}
            </span>
          </span>
        </Link>
        <span className={locked ? "opacity-40 pointer-events-none" : ""}>
          <VoteButton
            voted={voted}
            onClick={(e) => {
              e.stopPropagation();
              onVote(city, voted);
            }}
          />
        </span>
      </div>
    </li>
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

  const columnHeader = withHeader && (
    <ColumnHeaders
      columns={[
        { label: "City", width: "35%", align: "left" },
        { label: "Walkability", width: "20%", align: "center" },
        { label: "Distance", width: "25%", align: "right" },
        { label: "Vote", width: "15%", align: "right" },
      ]}
      sticky
      topOffset={56}
    />
  );

  if (sort !== "state") {
    return (
      <>
        {columnHeader}
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
      {columnHeader}
      {groups.map((group) => (
        <section key={group.state}>
          <div className="border-b bg-bg px-4 pb-2 pt-5">
            <SectionLabel>{STATE_NAMES[group.state] ?? group.state}</SectionLabel>
          </div>
          <ul>{group.cities.map(row)}</ul>
        </section>
      ))}
      {prompt}
    </div>
  );
}
