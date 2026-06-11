"use client";

import { useState } from "react";
import type { City } from "@/data/types";
import { useGroupData } from "@/hooks/useGroupData";
import { useVotes } from "@/hooks/useVotes";
import { Dialog } from "./Dialog";
import { Icon } from "./Icon";
import { NamePrompt } from "./NamePrompt";
import { Stars, UnverifiedFlag } from "./Pills";

interface VoteFlowProps {
  city: City;
  open: boolean;
  onClose: () => void;
}

/**
 * The two-part vote, committed as one action: pick a hotel for the city,
 * lock both in together. Asks for a name first if we don't have one.
 */
export function VoteFlow({ city, open, onClose }: VoteFlowProps) {
  const { name, saveName, castVote } = useGroupData();
  const { myCityId, myHotelId } = useVotes();
  const [hotelId, setHotelId] = useState<string | null>(null);

  const needsName = !name;
  const selected = hotelId ?? (myCityId === city.id ? myHotelId : null) ?? city.hotels[0]?.id ?? null;

  const lockIn = () => {
    if (!selected) return;
    void castVote(city.id, selected);
    onClose();
    setHotelId(null);
  };

  if (needsName) {
    return (
      <NamePrompt
        open={open}
        onClose={onClose}
        onSave={(n) => void saveName(n)}
        title="What's your name?"
      />
    );
  }

  return (
    <Dialog open={open} onClose={onClose} title={`Vote ${city.name}`}>
      <p className="mb-4 text-sm text-muted">
        {myCityId && myCityId !== city.id
          ? "This moves your vote here — one city, one hotel per person."
          : "Pick the hotel you'd book. City and hotel lock in together."}
      </p>
      <div className="mb-5 flex max-h-[50dvh] flex-col gap-2 overflow-y-auto">
        {city.hotels.map((hotel) => {
          const on = selected === hotel.id;
          return (
            <button
              key={hotel.id}
              type="button"
              onClick={() => setHotelId(hotel.id)}
              className={`flex min-h-11 items-center gap-3 rounded-lg border p-3 text-left transition ${
                on ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-surface-2"
              }`}
            >
              <Icon
                name={on ? "radio_button_checked" : "radio_button_unchecked"}
                size={22}
                className={on ? "text-accent" : "text-faint"}
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold">{hotel.name}</span>
                  {!hotel.verified && <UnverifiedFlag note={hotel.unverifiedNote} />}
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                  <Stars count={hotel.stars} />
                  {hotel.priceRange}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <button type="button" className="btn-accent w-full" onClick={lockIn} disabled={!selected}>
        <Icon name="how_to_vote" size={20} />
        Lock in {city.name}
      </button>
    </Dialog>
  );
}
