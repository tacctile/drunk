"use client";

import { cities } from "@/data/cities";
import { useGroupData } from "@/hooks/useGroupData";
import { useVotes } from "@/hooks/useVotes";

export function VoteCard({ onGoVote }: { onGoVote: () => void }) {
  const { voterId, hotelVotes } = useGroupData();
  const { myCityId, hasVoted } = useVotes();
  const cityName = myCityId ? cities.find((c) => c.id === myCityId)?.name ?? myCityId : null;
  const hotelName = myCityId
    ? hotelVotes.find((r) => r.voter_id === voterId && r.city_id === myCityId)?.hotel_name ?? null
    : null;

  return (
    <section>
      <h2 className="label">My vote</h2>
      <div className="card mt-2">
        {hasVoted ? (
          <>
            <p className="text-title text-ink">{cityName}</p>
            <p className="mt-0.5 text-meta font-normal text-ink-dim">You voted for this city</p>
            {hotelName && (
              <p className="mt-1 text-meta font-normal text-ink-muted">Preferred hotel: {hotelName}</p>
            )}
          </>
        ) : (
          <>
            <p className="text-base text-ink-dim">No vote cast yet</p>
            <button
              type="button"
              onClick={onGoVote}
              className="flex h-11 items-center text-base font-semibold text-accent"
            >
              Go vote
            </button>
          </>
        )}
      </div>
    </section>
  );
}
