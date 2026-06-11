"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cities, cityById } from "@/data/cities";
import type { City, Hotel } from "@/data/types";
import { useGroupData } from "@/hooks/useGroupData";
import { useVotes } from "@/hooks/useVotes";
import { MAX_NAME_LENGTH, sanitizeName } from "@/lib/identity";
import { Icon } from "@/components/Icon";
import { Stars } from "@/components/Stars";
import { VoterAvatars } from "@/components/VoterAvatars";
import { WalkStrip } from "@/components/WalkStrip";

/**
 * The vote, full screen, three beats: city -> hotel -> confirm. No app chrome
 * (the AppShell steps aside on /vote). Entering with ?city= skips straight to
 * beat 2. X exits without committing; confirming fires the one atomic
 * optimistic castVote and returns wherever you came from.
 */
export default function VotePage() {
  return (
    <Suspense fallback={null}>
      <VoteFlowScreen />
    </Suspense>
  );
}

function VoteFlowScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { name, saveName, castVote } = useGroupData();
  const votes = useVotes();

  const [cityPick, setCityPick] = useState<City | null>(
    () => cityById(params.get("city") ?? "") ?? null,
  );
  const [hotelPick, setHotelPick] = useState<Hotel | null>(null);
  const [nameDraft, setNameDraft] = useState("");

  const beat = cityPick ? (hotelPick ? 3 : 2) : 1;

  const leave = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  const back = () => {
    if (hotelPick) setHotelPick(null);
    else setCityPick(null);
  };

  const confirm = () => {
    if (!cityPick || !hotelPick) return;
    if (!name) {
      const clean = sanitizeName(nameDraft);
      if (!clean) return;
      void saveName(clean);
    }
    void castVote(cityPick.id, hotelPick.id);
    leave();
  };

  const byDistance = [...cities].sort((a, b) => a.miles - b.miles);

  return (
    <div className="anim-fade mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-[calc(24px+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-20 -mx-4 flex h-14 items-center justify-between bg-bg/90 px-2 pt-[env(safe-area-inset-top)] backdrop-blur">
        {beat > 1 ? (
          <button
            type="button"
            onClick={back}
            aria-label="Back"
            className="flex h-11 w-11 items-center justify-center rounded text-muted transition hover:bg-raised hover:text-ink"
          >
            <Icon name="arrow_back" size={22} />
          </button>
        ) : (
          <span className="h-11 w-11" aria-hidden />
        )}
        <p className="label tabular-nums">{beat} of 3</p>
        <button
          type="button"
          onClick={leave}
          aria-label="Close without voting"
          className="flex h-11 w-11 items-center justify-center rounded text-muted transition hover:bg-raised hover:text-ink"
        >
          <Icon name="close" size={22} />
        </button>
      </header>

      {beat === 1 && (
        <section className="anim-fade">
          <h1 className="mt-4 text-display tracking-tight">Pick your city</h1>
          <div className="mt-4 flex flex-col">
            {byDistance.map((c) => {
              const tally = votes.ranking.find((t) => t.city.id === c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCityPick(c)}
                  className="flex w-full flex-col gap-2 border-b border-line py-4 text-left transition last:border-0 hover:bg-raised/40"
                >
                  <span className="flex w-full items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-lg font-bold">{c.name}</span>
                    <span className="label flex-none">{c.state}</span>
                  </span>
                  <span className="block w-full truncate text-sm text-muted">{c.tagline}</span>
                  <WalkStrip city={c} compact />
                  {tally && <VoterAvatars voters={tally.voters} size="sm" />}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {beat === 2 && cityPick && (
        <section className="anim-fade">
          <h1 className="mt-4 text-display tracking-tight">Pick your hotel</h1>
          <p className="label mt-1">
            {cityPick.name} · {cityPick.state}
          </p>
          <div className="mt-5 flex flex-col gap-4">
            {cityPick.hotels.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setHotelPick(h)}
                className="card w-full p-5 text-left transition hover:border-line-strong hover:bg-raised/40"
              >
                <span className="block text-base font-bold">{h.name}</span>
                <span className="mt-1 flex items-center gap-2 text-sm text-muted">
                  <Stars count={h.stars} />
                  <span className="tabular-nums">{h.priceRange}</span>
                </span>
                <span className="mt-4 block">
                  <WalkStrip city={cityPick} hotel={h} />
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {beat === 3 && cityPick && hotelPick && (
        <section className="anim-fade flex flex-1 flex-col">
          <h1 className="mt-4 text-display tracking-tight">Lock it in</h1>
          <div className="card mt-5 p-5">
            <p className="label">Your vote</p>
            <p className="mt-2 text-display tracking-tight">{cityPick.name}</p>
            <p className="label mt-1 text-muted">{cityPick.state}</p>
            <div className="mt-4 border-t border-line pt-4">
              <p className="text-base font-bold">{hotelPick.name}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                <Stars count={hotelPick.stars} />
                <span className="tabular-nums">{hotelPick.priceRange}</span>
              </p>
            </div>
          </div>
          {!name && (
            <div className="mt-6">
              <label className="label" htmlFor="vote-name">
                Your first name
              </label>
              <input
                id="vote-name"
                className="input mt-2"
                placeholder="First name"
                value={nameDraft}
                maxLength={MAX_NAME_LENGTH}
                onChange={(e) => setNameDraft(e.target.value)}
                autoFocus
              />
            </div>
          )}
          <button
            type="button"
            className="btn-accent mt-6 w-full"
            disabled={!name && !sanitizeName(nameDraft)}
            onClick={confirm}
          >
            Confirm vote
          </button>
        </section>
      )}
    </div>
  );
}
