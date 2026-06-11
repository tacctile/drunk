"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cities, cityById } from "@/data/cities";
import { cityMeta } from "@/lib/score";
import { useVotes } from "@/hooks/useVotes";
import { CityCard } from "@/components/CityCard";
import { Icon } from "@/components/Icon";

type SortKey = "nearest" | "walk" | "votes" | "az";

const SORTS: { id: SortKey; label: string }[] = [
  { id: "nearest", label: "Nearest" },
  { id: "walk", label: "Best walk" },
  { id: "votes", label: "Most votes" },
  { id: "az", label: "A–Z" },
];

const STATES = ["NE", "IA", "SD", "MO", "KS"];

export default function CitiesPage() {
  const votes = useVotes();
  const [sort, setSort] = useState<SortKey>("nearest");
  const [stateFilter, setStateFilter] = useState<Set<string>>(new Set());

  const list = useMemo(() => {
    let out = [...cities];
    if (stateFilter.size > 0) out = out.filter((c) => stateFilter.has(c.state));
    switch (sort) {
      case "nearest":
        out.sort((a, b) => a.miles - b.miles);
        break;
      case "walk":
        // The composite score survives only here, as an invisible sort key.
        out.sort((a, b) => cityMeta[b.id].score - cityMeta[a.id].score || a.miles - b.miles);
        break;
      case "votes":
        out.sort((a, b) => votes.countFor(b.id) - votes.countFor(a.id) || a.miles - b.miles);
        break;
      case "az":
        out.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return out;
  }, [sort, stateFilter, votes]);

  const toggleState = (st: string) => {
    setStateFilter((prev) => {
      const next = new Set(prev);
      if (next.has(st)) next.delete(st);
      else next.add(st);
      return next;
    });
  };

  const myCity = votes.myCityId ? cityById(votes.myCityId) : null;

  return (
    <div className="anim-fade flex flex-col gap-8 pb-20">
      <section>
        <h1 className="text-display tracking-tight">Cities</h1>
        <p className="mt-2 text-base text-muted">
          {cities.length} destinations, all judged the same way: hotel by the bars, never touch
          the car.
        </p>

        {/* Sort */}
        <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 min-[840px]:mx-0 min-[840px]:px-0">
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSort(s.id)}
              aria-pressed={sort === s.id}
              className={`chip ${sort === s.id ? "chip-on" : ""}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* State filter — secondary weight */}
        <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 min-[840px]:mx-0 min-[840px]:px-0">
          {STATES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => toggleState(st)}
              aria-pressed={stateFilter.has(st)}
              className={`chip border-transparent ${
                stateFilter.has(st) ? "bg-raised text-ink" : "bg-transparent text-dim"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </section>

      {list.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-10 text-center">
          <Icon name="search_off" size={32} className="text-dim" />
          <p className="text-base text-muted">Nothing matches</p>
          <button type="button" className="btn-ghost" onClick={() => setStateFilter(new Set())}>
            Clear
          </button>
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          {list.map((city) => {
            const tally = votes.ranking.find((t) => t.city.id === city.id);
            return (
              <CityCard
                key={city.id}
                city={city}
                voters={tally?.voters ?? []}
                pulse={votes.recentlyChangedCityIds.has(city.id)}
              />
            );
          })}
        </section>
      )}

      {/* Sticky vote pill — sits above the bottom nav */}
      <Link
        href="/vote"
        className={`fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-1/2 z-20 flex h-11 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full px-5 text-base font-semibold shadow-overlay transition min-[840px]:bottom-8 min-[840px]:left-[calc(50%+112px)] ${
          myCity
            ? "border border-line-strong bg-raised text-ink"
            : "bg-accent text-accent-ink hover:brightness-110"
        }`}
      >
        {myCity ? (
          <>
            <span className="text-muted">Your vote:</span> {myCity.name}
          </>
        ) : (
          <>
            Cast your vote
            <Icon name="arrow_forward" size={18} />
          </>
        )}
      </Link>
    </div>
  );
}
