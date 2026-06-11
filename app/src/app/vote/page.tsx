"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cities } from "@/data/cities";
import type { City } from "@/data/types";
import { cityMeta } from "@/lib/score";
import { useGroupData } from "@/hooks/useGroupData";
import { useVotes, type CityTally } from "@/hooks/useVotes";
import { Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { NamePrompt } from "@/components/NamePrompt";
import { TierPill } from "@/components/Pills";
import { VoteFlow } from "@/components/VoteFlow";
import { VoteMeter } from "@/components/VoteMeter";

export default function VotePage() {
  const { name, saveName } = useGroupData();
  const votes = useVotes();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [voteCity, setVoteCity] = useState<City | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);

  const myCity = votes.myCityId ? cities.find((c) => c.id === votes.myCityId) : null;

  return (
    <div className="anim-fade flex flex-col gap-5">
      <section className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Vote</h1>
          <p className="mt-1 text-sm text-muted">
            One city, one hotel per person. Changing your mind moves your vote.
          </p>
        </div>
        {name && (
          <button
            type="button"
            onClick={() => setRenameOpen(true)}
            className="btn-ghost gap-1.5 whitespace-nowrap px-3"
            title="Change your name"
          >
            <Icon name="edit" size={16} />
            {name}
          </button>
        )}
      </section>

      {/* My vote / CTA */}
      <section className="card flex items-center gap-3 p-4">
        {myCity ? (
          <>
            <Icon name="verified" size={26} className="text-good" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">
                You&apos;re on {myCity.name}
                {votes.myHotelId && (
                  <span className="font-semibold text-muted">
                    {" "}
                    · {myCity.hotels.find((h) => h.id === votes.myHotelId)?.name ?? "hotel picked"}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted">Tap to move it or switch hotels.</p>
            </div>
            <button type="button" className="btn-ghost" onClick={() => setPickerOpen(true)}>
              Change
            </button>
          </>
        ) : (
          <>
            <Icon name="how_to_vote" size={26} className="text-accent" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">You haven&apos;t voted yet</p>
              <p className="text-xs text-muted">Pick a city, then the hotel you&apos;d book.</p>
            </div>
            <button type="button" className="btn-accent" onClick={() => setPickerOpen(true)}>
              Cast vote
            </button>
          </>
        )}
      </section>

      {/* Results */}
      <section>
        <h2 className="mb-3 text-base font-extrabold">
          Results
          <span className="ml-2 text-sm font-bold text-faint">
            {votes.totalVotes} vote{votes.totalVotes === 1 ? "" : "s"}
          </span>
        </h2>
        {votes.ranking.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 p-10 text-center text-muted">
            <Icon name="ballot" size={32} />
            <p className="text-sm font-semibold">No votes on the board yet.</p>
            <p className="text-xs">Be the one who picks the city everyone complains about.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {votes.ranking.map((tally, i) => (
              <ResultRow
                key={tally.city.id}
                tally={tally}
                rank={i + 1}
                max={votes.leader?.count ?? 1}
              />
            ))}
          </div>
        )}
      </section>

      {/* City picker -> hotel flow */}
      <Dialog open={pickerOpen} onClose={() => setPickerOpen(false)} title="Pick your city">
        <div className="flex max-h-[60dvh] flex-col gap-2 overflow-y-auto">
          {[...cities]
            .sort((a, b) => a.miles - b.miles)
            .map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setPickerOpen(false);
                  setVoteCity(c);
                }}
                className={`flex min-h-11 items-center gap-3 rounded-lg border p-3 text-left transition ${
                  votes.myCityId === c.id
                    ? "border-accent bg-accent-soft"
                    : "border-line bg-surface hover:bg-surface-2"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold">
                    {c.name}, {c.state}
                  </span>
                  <span className="text-xs text-muted">
                    {c.miles} mi · {c.bars.length} bars
                  </span>
                </span>
                <TierPill tier={cityMeta[c.id].tier} />
              </button>
            ))}
        </div>
      </Dialog>

      {voteCity && (
        <VoteFlow
          city={voteCity}
          open={voteCity !== null}
          onClose={() => setVoteCity(null)}
        />
      )}

      <NamePrompt
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        onSave={(n) => {
          void saveName(n);
          setRenameOpen(false);
        }}
        initial={name}
        title="Change your name"
      />
    </div>
  );
}

function ResultRow({ tally, rank, max }: { tally: CityTally; rank: number; max: number }) {
  const [open, setOpen] = useState(false);
  const youVotedHere = useMemo(() => tally.voters.some((v) => v.isYou), [tally]);

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-surface-2"
      >
        <span
          className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-extrabold ${
            rank === 1 ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted"
          }`}
        >
          {rank}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-base font-extrabold">
              {tally.city.name}, {tally.city.state}
            </span>
            {youVotedHere && (
              <span className="inline-flex h-5 items-center rounded-full bg-accent-soft px-1.5 text-2xs font-extrabold text-accent">
                you
              </span>
            )}
          </span>
          <span className="mt-1.5 block">
            <VoteMeter count={tally.count} max={max} tone={rank === 1 ? "accent" : "muted"} />
          </span>
        </span>
        <span className="text-lg font-extrabold tabular-nums">{tally.count}</span>
        <Icon name="expand_more" size={20} className={`text-faint transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="anim-fade border-t border-line bg-surface-2/50 p-4">
          <p className="mb-1 text-2xs font-extrabold uppercase tracking-wider text-muted">Voters</p>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {tally.voters.map((v) => (
              <span
                key={v.voterId}
                className={`inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold ${
                  v.isYou ? "bg-accent text-accent-ink" : "bg-surface-2"
                }`}
              >
                {v.isYou ? "You" : v.name}
              </span>
            ))}
          </div>

          <p className="mb-1 text-2xs font-extrabold uppercase tracking-wider text-muted">Hotel race</p>
          {tally.hotelRanking.length === 0 ? (
            <p className="text-sm text-muted">No hotel picks yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {tally.hotelRanking.map((h, i) => (
                <li key={h.hotel.id} className="flex items-center gap-2 text-sm">
                  <Icon
                    name={i === 0 ? "trophy" : "hotel"}
                    size={16}
                    className={i === 0 ? "text-accent" : "text-faint"}
                  />
                  <span className="min-w-0 flex-1 truncate font-bold">{h.hotel.name}</span>
                  <span className="flex flex-wrap justify-end gap-1">
                    {h.voters.map((v) => (
                      <span
                        key={v.voterId}
                        className={`inline-flex h-5 items-center rounded-full px-1.5 text-2xs font-bold ${
                          v.isYou ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted"
                        }`}
                      >
                        {v.isYou ? "You" : v.name}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <Link
            href={`/city/${tally.city.id}`}
            className="mt-4 inline-flex h-11 items-center gap-1 text-sm font-bold text-accent hover:underline"
          >
            Trip brief <Icon name="arrow_forward" size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
