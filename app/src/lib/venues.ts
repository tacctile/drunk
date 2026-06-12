"use client";

import type { Coords, VenueKind } from "@/data/types";

/**
 * The one venue shape the UI renders, whichever source it came from.
 * `id` is the Google Places place_id, or the v2_* table uuid in fallback
 * mode — either way it is stable and unique, and it is what
 * v2_hotel_votes.hotel_place_id stores.
 */
export interface Venue {
  id: string;
  kind: VenueKind;
  name: string;
  address: string;
  coords: Coords | null; // null in Supabase-fallback mode → no map pin
  rating: number | null;
  ratingCount: number | null;
  priceLevel: number | null; // Places 0–4 → rendered as $ symbols
  priceText: string | null; // fallback rows carry a text range instead
  descriptor: string; // readable line from Places types or the curated descriptor
}

export interface CityVenues {
  hotel: Venue[];
  bar: Venue[];
  food: Venue[];
}

export const EMPTY_VENUES: CityVenues = { hotel: [], bar: [], food: [] };

// Major chain patterns — excluded from bar and food results. The trip is
// about local rooms; nobody drives two hours for an Applebee's.
const CHAIN_PATTERN = new RegExp(
  [
    "mcdonald", "burger king", "wendy'?s", "taco bell", "taco john", "subway",
    "pizza hut", "domino'?s", "papa john", "papa murphy", "kfc", "arby'?s",
    "sonic drive", "dairy queen", "culver'?s", "hardee'?s", "jimmy john",
    "little caesars", "chipotle", "panera", "starbucks", "dunkin", "scooter'?s",
    "applebee", "chili'?s", "olive garden", "texas roadhouse", "outback",
    "ihop", "denny'?s", "perkins", "buffalo wild wings", "hooters",
    "red lobster", "cracker barrel", "five guys", "freddy'?s", "qdoba",
    "panda express", "popeyes", "raising cane", "casey'?s", "godfather'?s",
    "pizza ranch", "jersey mike", "firehouse subs", "fazoli", "long john silver",
    "village inn", "old chicago", "hu\\s?hot", "noodles & company", "jimmy'?s egg",
  ].join("|"),
  "i",
);

export function isChain(name: string): boolean {
  return CHAIN_PATTERN.test(name);
}

// Places `types` values that say nothing useful about a venue.
const GENERIC_TYPES = new Set([
  "point_of_interest",
  "establishment",
  "food",
  "store",
  "health",
  "place_of_worship",
  "premise",
  "political",
]);

/** "night_club" + "bar" → "Night club · Bar" — a readable descriptor line. */
export function formatTypes(types: string[] | undefined): string {
  if (!types) return "";
  const readable = types
    .filter((t) => !GENERIC_TYPES.has(t))
    .slice(0, 2)
    .map((t) => {
      const words = t.replace(/_/g, " ");
      return words.charAt(0).toUpperCase() + words.slice(1);
    });
  return readable.join(" · ");
}

/** "$" through "$$$$" — empty when the price level is unknown. */
export function priceSymbols(priceLevel: number | null): string {
  if (priceLevel === null || priceLevel <= 0) return "";
  return "$".repeat(Math.min(priceLevel, 4));
}

/** Tappable address target — opens Google Maps in a new tab. */
export function mapsUrl(name: string, address: string): string {
  return `https://maps.google.com/?q=${encodeURIComponent(`${name} ${address}`.trim())}`;
}
