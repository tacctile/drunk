"use client";

import { Icon } from "@/components/Icon";
import { NotYouLink } from "@/components/NamePrompt";
import { useAvailability } from "@/hooks/useAvailability";
import { useVotes } from "@/hooks/useVotes";
import { formatShortDate } from "@/lib/format";

/**
 * The Board — group truth, read-only. Two columns (stacking below 480px):
 * city vote standings on the left, available dates by response count on the
 * right. Nothing here is sortable or interactive beyond scrolling.
 */
export default function BoardPage() {
  const { breakdownFor, allResponseDates, rosterSize } = useAvailability();
  const { ranking } = useVotes();

  const maxVotes = ranking[0]?.count ?? 1;
  // Dates with at least one response, most available people first.
  const dates = allResponseDates
    .map((date) => breakdownFor(date))
    .sort((a, b) => b.available.length - a.available.length || a.date.localeCompare(b.date));

  return (
    <div className="mx-auto max-w-2xl px-4 pt-4">
      <div className="grid grid-cols-1 items-start gap-6 min-[480px]:grid-cols-2">
        {/* Left column — city vote standings */}
        <section>
          <h2 className="label pb-2 !text-ink-dim">Standings</h2>
          {ranking.length === 0 ? (
            <p className="py-10 text-center text-meta font-normal text-ink-dim">No votes yet.</p>
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
                      <span className="min-w-0 flex-1 break-words">{pref.name}</span>
                      <span className="flex-none">{pref.count}</span>
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Right column — available dates, most available first */}
        <section>
          <h2 className="label pb-2 !text-ink-dim">Hot dates</h2>
          {dates.length === 0 ? (
            <p className="py-10 text-center text-meta font-normal text-ink-dim">
              No availability marked yet.
            </p>
          ) : (
            <ul>
              {dates.map((day) => (
                <li key={day.date} className="border-b py-4">
                  <div className="flex items-baseline gap-3">
                    <span className="min-w-0 flex-1 truncate text-title font-bold text-ink">
                      {formatShortDate(day.date)}
                    </span>
                    <span className="flex-none whitespace-nowrap text-meta font-semibold text-accent">
                      {day.available.length} available
                    </span>
                  </div>
                  <div className="mt-2 h-1 w-full rounded-full bg-border">
                    <div
                      className="h-1 rounded-full bg-accent"
                      style={{
                        width: `${Math.round((day.available.length / rosterSize) * 100)}%`,
                      }}
                    />
                  </div>
                  {day.available.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {day.available.map((person) => (
                        <span
                          key={person.voterId}
                          className="rounded-full bg-raised px-2.5 py-1 text-meta font-normal text-ink-muted"
                        >
                          {person.name}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="flex justify-center py-4">
        <NotYouLink />
      </div>
    </div>
  );
}
