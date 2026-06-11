"use client";

import Link from "next/link";
import { cities } from "@/data/cities";
import { cityMeta } from "@/lib/score";
import { formatShortDate } from "@/lib/format";
import { useGroupData } from "@/hooks/useGroupData";
import { useVotes } from "@/hooks/useVotes";
import { useAvailability } from "@/hooks/useAvailability";
import { Icon } from "@/components/Icon";
import { ScoreBadge, TierPill } from "@/components/Pills";
import { VoteMeter } from "@/components/VoteMeter";

/** Live group dashboard — leaders, best weekend, roster, quick actions. */
export default function DashboardPage() {
  const { ready, voters } = useGroupData();
  const votes = useVotes();
  const avail = useAvailability();

  const topByScore = [...cities]
    .sort((a, b) => cityMeta[b.id].score - cityMeta[a.id].score)
    .slice(0, 3);

  const lead = votes.leader;
  const margin = lead ? lead.count - (votes.runnerUp?.count ?? 0) : 0;

  return (
    <div className="anim-fade flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-extrabold tracking-tight">The next trip</h1>
        <p className="mt-1 text-sm text-muted">
          Overnight bar-hop from Ralston. Hotel by the bars, never touch the car.
        </p>
      </section>

      {/* Quick actions for anyone who hasn't weighed in yet */}
      {ready && (!votes.hasVoted || !avail.hasMarkedDates) && (
        <section className="grid gap-3 min-[840px]:grid-cols-2">
          {!votes.hasVoted && (
            <Link href="/vote" className="card flex items-center gap-3 border-accent/40 bg-accent-soft p-4 transition hover:brightness-110">
              <Icon name="how_to_vote" size={26} className="text-accent" />
              <span className="flex-1">
                <span className="block text-base font-extrabold">Cast your vote</span>
                <span className="block text-xs text-muted">Pick a city and the hotel you&apos;d book.</span>
              </span>
              <Icon name="arrow_forward" size={20} className="text-accent" />
            </Link>
          )}
          {!avail.hasMarkedDates && (
            <Link href="/dates" className="card flex items-center gap-3 border-good/40 bg-good-soft p-4 transition hover:brightness-110">
              <Icon name="event_available" size={26} className="text-good" />
              <span className="flex-1">
                <span className="block text-base font-extrabold">Mark your dates</span>
                <span className="block text-xs text-muted">Tell the crew which nights you&apos;re free.</span>
              </span>
              <Icon name="arrow_forward" size={20} className="text-good" />
            </Link>
          )}
        </section>
      )}

      {/* Leaders */}
      <section className="grid gap-3 min-[840px]:grid-cols-2">
        <div className="card p-4">
          <p className="flex items-center gap-1.5 text-2xs font-extrabold uppercase tracking-wider text-muted">
            <Icon name="trophy" size={15} className="text-accent" />
            Vote leader
          </p>
          {lead ? (
            <div className="mt-2">
              <div className="flex items-center justify-between gap-3">
                <Link href={`/city/${lead.city.id}`} className="text-xl font-extrabold tracking-tight hover:text-accent">
                  {lead.city.name}, {lead.city.state}
                </Link>
                <span className="flex items-center gap-1.5">
                  {margin > 0 && votes.runnerUp && (
                    <span className="inline-flex h-6 items-center gap-0.5 rounded-full bg-good-soft px-2 text-2xs font-extrabold text-good">
                      <Icon name="trending_up" size={13} />+{margin} ahead
                    </span>
                  )}
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="anim-pulse absolute h-full w-full rounded-full bg-accent" />
                  </span>
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <VoteMeter count={lead.count} max={Math.max(lead.count, 1)} />
                <span className="whitespace-nowrap text-sm font-extrabold tabular-nums">
                  {lead.count} vote{lead.count === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted">
                {lead.voters.map((v) => (v.isYou ? "You" : v.name)).join(", ")}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">No votes yet — someone has to go first.</p>
          )}
        </div>

        <div className="card p-4">
          <p className="flex items-center gap-1.5 text-2xs font-extrabold uppercase tracking-wider text-muted">
            <Icon name="hotel" size={15} className="text-accent" />
            Hotel leader
          </p>
          {lead?.leadingHotel ? (
            <div className="mt-2">
              <p className="text-base font-extrabold">{lead.leadingHotel.hotel.name}</p>
              <p className="mt-0.5 text-xs text-muted">
                Winning in {lead.city.name} · {lead.leadingHotel.count} of {lead.count}
              </p>
              <p className="mt-2 text-xs text-muted">
                {lead.leadingHotel.voters.map((v) => (v.isYou ? "You" : v.name)).join(", ")}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">Hotel picks show up once city votes land.</p>
          )}
        </div>
      </section>

      {/* Best weekend + roster */}
      <section className="grid gap-3 min-[840px]:grid-cols-2">
        <div className="card p-4">
          <p className="flex items-center gap-1.5 text-2xs font-extrabold uppercase tracking-wider text-muted">
            <Icon name="event_available" size={15} className="text-good" />
            Group availability
          </p>
          {avail.bestDate ? (
            <div className="mt-2">
              <p className="text-xl font-extrabold tracking-tight">
                {formatShortDate(avail.bestDate.date)}
              </p>
              <p className="mt-0.5 text-sm font-bold text-good">
                {avail.bestDate.available} of {avail.bestDate.total} available
              </p>
              <Link href="/dates" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline">
                See the heat map <Icon name="arrow_forward" size={14} />
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">No dates marked yet.</p>
          )}
        </div>

        <div className="card p-4">
          <p className="flex items-center gap-1.5 text-2xs font-extrabold uppercase tracking-wider text-muted">
            <Icon name="group" size={15} />
            Who&apos;s in
          </p>
          {voters.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {voters.map((v) => (
                <li
                  key={v.voter_id}
                  className="inline-flex h-7 items-center rounded-full bg-surface-2 px-2.5 text-xs font-bold"
                >
                  {v.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">Nobody yet. Vote or mark dates to join the roster.</p>
          )}
        </div>
      </section>

      {/* Top cities by composite score */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-extrabold">Top rated trips</h2>
          <Link href="/cities" className="flex h-11 items-center gap-1 text-sm font-bold text-accent hover:underline">
            All {cities.length} cities <Icon name="arrow_forward" size={16} />
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {topByScore.map((city, i) => {
            const meta = cityMeta[city.id];
            return (
              <Link
                key={city.id}
                href={`/city/${city.id}`}
                className="card flex items-center gap-4 p-4 transition hover:border-line-strong hover:bg-surface-2"
              >
                <span className="w-5 text-center text-lg font-extrabold text-faint">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-extrabold">
                    {city.name}, {city.state}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                    <TierPill tier={meta.tier} />
                    <span className="text-xs font-semibold text-muted">
                      {city.bars.length} bars · {city.miles} mi
                    </span>
                  </span>
                </span>
                <ScoreBadge score={meta.score} size="lg" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Score leaders vs vote leader cross-reference */}
      {votes.ranking.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-extrabold">Current standings</h2>
          <div className="card divide-y divide-line">
            {votes.ranking.slice(0, 5).map((t) => (
              <Link
                key={t.city.id}
                href={`/city/${t.city.id}`}
                className="flex items-center gap-3 p-3 transition hover:bg-surface-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-bold">{t.city.name}</span>
                <span className="w-24 min-[840px]:w-40">
                  <VoteMeter count={t.count} max={votes.leader?.count ?? 1} tone={t === lead ? "accent" : "muted"} />
                </span>
                <span className="w-6 text-right text-sm font-extrabold tabular-nums">{t.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
