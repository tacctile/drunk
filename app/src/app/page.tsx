"use client";

import Link from "next/link";
import { cities } from "@/data/cities";
import { cityMeta } from "@/lib/score";
import { formatShortDate } from "@/lib/format";
import { useGroupData } from "@/hooks/useGroupData";
import { useVotes } from "@/hooks/useVotes";
import { useAvailability } from "@/hooks/useAvailability";
import { Icon } from "@/components/Icon";
import { VoterAvatars } from "@/components/VoterAvatars";
import { WalkStrip } from "@/components/WalkStrip";

/**
 * Trip — the decision board. The hero IS the vote surface: the current
 * leader (or the best walk when nobody's voted yet), then standings,
 * closest picks, and the roster. Nothing else.
 */
export default function TripPage() {
  const { ready, voters, cityVotes, availability } = useGroupData();
  const votes = useVotes();
  const avail = useAvailability();

  const lead = votes.leader;
  const topPick = [...cities].sort((a, b) => cityMeta[b.id].score - cityMeta[a.id].score)[0];
  const heroCity = lead?.city ?? topPick;
  const heroIsMyVote = votes.myCityId === heroCity.id;
  const heroPulse = votes.recentlyChangedCityIds.has(heroCity.id);

  const closest = [...cities].sort((a, b) => a.miles - b.miles);

  const activeIds = new Set<string>([
    ...cityVotes.map((r) => r.voter_id),
    ...availability.map((r) => r.voter_id),
  ]);
  const roster = voters.filter((v) => activeIds.has(v.voter_id));

  return (
    <div className="anim-fade flex flex-col gap-8">
      {/* Hero — the vote surface */}
      <section
        className={`card relative flex min-h-[60dvh] flex-col justify-between gap-6 p-5 min-[840px]:min-h-[400px] ${
          heroPulse ? "anim-pulse-once" : ""
        }`}
      >
        <Link
          href={`/city/${heroCity.id}`}
          aria-label={`Open ${heroCity.name}`}
          className="absolute inset-0 rounded"
        />
        <div className="pointer-events-none relative">
          <p className="label">{lead ? "In the lead" : "Top pick"}</p>
          <h1 className="mt-2 text-display tracking-tight">{heroCity.name}</h1>
          <p className="label mt-1 text-muted">{heroCity.state}</p>
          <p className="mt-3 max-w-prose text-base text-muted">{heroCity.tagline}</p>
        </div>
        <div className="pointer-events-none relative flex flex-col gap-5">
          <WalkStrip city={heroCity} />
          {lead && lead.voters.length > 0 && <VoterAvatars voters={lead.voters} />}
          {avail.bestDate && (
            <p className="text-base text-muted">
              Best weekend so far: {formatShortDate(avail.bestDate.date)} —{" "}
              <span className="tabular-nums">
                {avail.bestDate.available} of {avail.bestDate.total}
              </span>{" "}
              free
            </p>
          )}
          <Link
            href={`/vote?city=${heroCity.id}`}
            className="btn-accent pointer-events-auto w-full min-[840px]:w-auto min-[840px]:self-start"
          >
            {lead ? (heroIsMyVote ? "Change your vote" : "Make this your vote") : "Cast the first vote"}
          </Link>
        </div>
      </section>

      {/* Standings — only when at least one vote exists */}
      {votes.ranking.length > 0 && (
        <section>
          <h2 className="label mb-3">Standings</h2>
          <div className="flex flex-col">
            {votes.ranking.slice(0, 5).map((tally, i) => {
              const leaderRow = i === 0;
              const pulse = votes.recentlyChangedCityIds.has(tally.city.id);
              return (
                <Link
                  key={tally.city.id}
                  href={`/city/${tally.city.id}`}
                  className={`flex min-h-14 items-center gap-3 border-b border-line py-2.5 transition last:border-0 hover:bg-raised/40 ${
                    pulse ? "anim-pulse-once" : ""
                  }`}
                >
                  <span
                    className={`w-5 flex-none text-center text-base font-bold tabular-nums ${
                      leaderRow ? "text-accent" : "text-dim"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-bold">{tally.city.name}</span>
                    <WalkStrip city={tally.city} compact />
                  </span>
                  <VoterAvatars voters={tally.voters} size="sm" />
                  <span
                    className={`w-6 flex-none text-right text-base font-bold tabular-nums ${
                      leaderRow ? "text-accent" : "text-muted"
                    }`}
                  >
                    {tally.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Closest picks — the app's only horizontal scroller */}
      <section>
        <h2 className="label mb-3">Closest picks</h2>
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 min-[840px]:-mx-8 min-[840px]:px-8">
          {closest.map((city) => (
            <Link
              key={city.id}
              href={`/city/${city.id}`}
              className="card w-60 flex-none snap-start p-5 transition hover:border-line-strong"
            >
              <p className="truncate text-base font-bold">{city.name}</p>
              <p className="label mt-0.5 tabular-nums">{city.drive}</p>
              <div className="mt-4">
                <WalkStrip city={city} compact />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Roster */}
      {roster.length > 0 && (
        <section>
          <h2 className="label mb-3">Who&apos;s in</h2>
          <ul className="flex flex-wrap gap-2">
            {roster.map((v) => (
              <li key={v.voter_id} className="rounded bg-raised px-3 py-1.5 text-sm font-semibold">
                {v.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Date nudge — disappears the moment you've marked anything */}
      {ready && !avail.hasMarkedDates && (
        <section className="card flex items-center gap-4 p-5">
          <Icon name="calendar_month" size={24} className="text-muted" />
          <p className="min-w-0 flex-1 text-base">You haven&apos;t marked your dates yet</p>
          <Link href="/dates" className="btn-accent flex-none">
            Mark dates
          </Link>
        </section>
      )}
    </div>
  );
}
