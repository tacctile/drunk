"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { HeatCalendar, MonthHeader, useMonthNav } from "@/components/Calendar";
import { Icon } from "@/components/Icon";
import { useAvailability } from "@/hooks/useAvailability";
import { useVotes } from "@/hooks/useVotes";
import { formatShortDate } from "@/lib/format";

/** The Board — group truth: hot dates, vote standings, hotel preferences. */
export default function BoardPage() {
  const { year, month, ready, prev, next } = useMonthNav();
  const { breakdownFor, allResponseDates } = useAvailability();
  const { ranking } = useVotes();
  const [day, setDay] = useState<string | null>(null);
  if (!ready) return null;

  const breakdown = day ? breakdownFor(day) : null;
  const maxVotes = ranking[0]?.count ?? 1;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-4">
      <section>
        <h2 className="label pb-2">Hot dates</h2>
        <MonthHeader year={year} month={month} onPrev={prev} onNext={next} />
        <div className="mt-2">
          <HeatCalendar year={year} month={month} onDayTap={setDay} />
        </div>
        {allResponseDates.length === 0 && (
          <p className="mt-3 text-meta font-normal text-ink-dim">
            No availability marked yet.
          </p>
        )}
      </section>

      <section>
        <h2 className="label pb-2">Standings</h2>
        {ranking.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Icon name="how_to_vote" size={32} className="text-ink-dim" />
            <p className="text-base text-ink-muted">No votes yet. Open a city and cast yours.</p>
          </div>
        ) : (
          <ul>
            {ranking.map((tally, index) => (
              <li key={tally.city.id} className="border-b py-4">
                <div className="flex items-baseline gap-3">
                  <span className="w-8 flex-none text-display text-ink-dim">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-title font-bold text-ink">
                    {tally.city.name}
                  </span>
                  <span className="flex-none text-title font-bold text-accent">{tally.count}</span>
                </div>
                <div className="mt-2 h-1 w-full rounded-full bg-border">
                  <div
                    className="h-1 rounded-full bg-accent"
                    style={{ width: `${Math.round((tally.count / maxVotes) * 100)}%` }}
                  />
                </div>
                {tally.voters.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tally.voters.map((voter) => (
                      <span
                        key={voter.voterId}
                        className="rounded-full bg-raised px-2.5 py-1 text-meta font-normal text-ink-muted"
                      >
                        {voter.name}
                      </span>
                    ))}
                  </div>
                )}
                {tally.hotelPrefs.map((pref) => (
                  <div
                    key={pref.placeId}
                    className="mt-2 flex items-center gap-2 pl-11 text-meta font-normal text-ink-muted"
                  >
                    <Icon name="hotel" size={16} className="text-ink-dim" />
                    <span className="min-w-0 flex-1 truncate">{pref.name}</span>
                    <span className="flex-none">{pref.count}</span>
                  </div>
                ))}
              </li>
            ))}
          </ul>
        )}
      </section>

      <BottomSheet
        open={breakdown !== null}
        onClose={() => setDay(null)}
        label={breakdown ? `Availability for ${formatShortDate(breakdown.date)}` : "Availability"}
      >
        {breakdown && (
          <div className="flex flex-col gap-4 px-1 pb-2">
            <h2 className="text-title font-bold text-ink">{formatShortDate(breakdown.date)}</h2>
            <div>
              <h3 className="label pb-1.5">Available</h3>
              {breakdown.available.length === 0 ? (
                <p className="text-meta font-normal text-ink-dim">Nobody yet.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {breakdown.available.map((p) => (
                    <li key={p.voterId} className="flex min-h-7 items-center gap-2 text-base text-ink">
                      <span className="h-2 w-2 flex-none rounded-full bg-green" />
                      {p.name}
                      {p.isYou && <span className="label !text-ink-dim">you</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="label pb-1.5">Not available</h3>
              {breakdown.unavailable.length === 0 ? (
                <p className="text-meta font-normal text-ink-dim">Nobody yet.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {breakdown.unavailable.map((p) => (
                    <li key={p.voterId} className="flex min-h-7 items-center gap-2 text-base text-ink">
                      <span className="h-2 w-2 flex-none rounded-full bg-red" />
                      {p.name}
                      {p.isYou && <span className="label !text-ink-dim">you</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
