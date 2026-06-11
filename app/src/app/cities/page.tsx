"use client";

import { useMemo, useState } from "react";
import { cities } from "@/data/cities";
import type { VibeTag, WalkabilityTier } from "@/data/types";
import { cityMeta } from "@/lib/score";
import { useVotes } from "@/hooks/useVotes";
import { useAvailability } from "@/hooks/useAvailability";
import { CityCard } from "@/components/CityCard";
import { Icon } from "@/components/Icon";

type SortKey = "distance" | "score" | "az" | "votes";

const SORTS: { id: SortKey; label: string }[] = [
  { id: "distance", label: "Distance" },
  { id: "score", label: "Score" },
  { id: "az", label: "A–Z" },
  { id: "votes", label: "Most Votes" },
];

const TIERS: WalkabilityTier[] = ["Walk Everything", "Walk Most", "Need a Ride"];

const ALL_VIBES = [...new Set(cities.flatMap((c) => c.vibes))].sort() as VibeTag[];

export default function CitiesPage() {
  const votes = useVotes();
  const avail = useAvailability();
  const [sort, setSort] = useState<SortKey>("distance");
  const [vibeFilter, setVibeFilter] = useState<Set<VibeTag>>(new Set());
  const [tierFilter, setTierFilter] = useState<WalkabilityTier | null>(null);

  const list = useMemo(() => {
    let out = [...cities];
    if (vibeFilter.size > 0) out = out.filter((c) => c.vibes.some((v) => vibeFilter.has(v)));
    if (tierFilter) out = out.filter((c) => cityMeta[c.id].tier === tierFilter);
    switch (sort) {
      case "distance":
        out.sort((a, b) => a.miles - b.miles);
        break;
      case "score":
        out.sort((a, b) => cityMeta[b.id].score - cityMeta[a.id].score);
        break;
      case "az":
        out.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "votes":
        out.sort((a, b) => votes.countFor(b.id) - votes.countFor(a.id) || a.miles - b.miles);
        break;
    }
    return out;
  }, [sort, vibeFilter, tierFilter, votes]);

  const toggleVibe = (tag: VibeTag) => {
    setVibeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  return (
    <div className="anim-fade flex flex-col gap-4">
      <section>
        <h1 className="text-2xl font-extrabold tracking-tight">Cities</h1>
        <p className="mt-1 text-sm text-muted">
          {cities.length} destinations, every one judged by the same bar: walk to dinner, hop on foot, walk back.
        </p>
      </section>

      {/* Sort */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 min-[840px]:mx-0 min-[840px]:px-0">
        {SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSort(s.id)}
            aria-pressed={sort === s.id}
            className={`chip ${sort === s.id ? "chip-on" : ""}`}
          >
            {s.id === "distance" && <Icon name="route" size={16} />}
            {s.id === "score" && <Icon name="leaderboard" size={16} />}
            {s.id === "az" && <Icon name="sort_by_alpha" size={16} />}
            {s.id === "votes" && <Icon name="how_to_vote" size={16} />}
            {s.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 min-[840px]:mx-0 min-[840px]:flex-wrap min-[840px]:px-0">
        {TIERS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTierFilter((prev) => (prev === t ? null : t))}
            aria-pressed={tierFilter === t}
            className={`chip ${tierFilter === t ? "chip-on" : ""}`}
          >
            <Icon name="directions_walk" size={16} />
            {t}
          </button>
        ))}
        <span className="my-1 w-px flex-none bg-line" aria-hidden />
        {ALL_VIBES.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleVibe(tag)}
            aria-pressed={vibeFilter.has(tag)}
            className={`chip ${vibeFilter.has(tag) ? "chip-on" : ""}`}
          >
            {tag}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-10 text-center text-muted">
          <Icon name="search_off" size={32} />
          <p className="text-sm font-semibold">Nothing matches those filters.</p>
          <button
            type="button"
            className="btn-ghost mt-2"
            onClick={() => {
              setVibeFilter(new Set());
              setTierFilter(null);
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-3 min-[840px]:grid-cols-2">
          {list.map((city) => (
            <CityCard
              key={city.id}
              city={city}
              votes={votes.countFor(city.id)}
              bestDate={avail.bestDate?.date ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
