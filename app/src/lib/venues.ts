"use client";

import type { Coords, VenueKind } from "@/data/types";

/**
 * The one venue shape the UI renders. Rows come straight from the curated
 * v2_hotels / v2_bars / v2_food Supabase tables — `id` is the row uuid, and
 * it is what v2_hotel_votes.hotel_place_id stores. `coords` is resolved in
 * the background by the Geocoding API purely for map pins; null = no pin.
 */
export interface Venue {
  id: string;
  kind: VenueKind;
  city_id: string;
  name: string;
  address: string;
  descriptor: string;
  /** v2_hotels only — hotel class, rendered as filled star icons. */
  stars?: number;
  /** v2_hotels only — e.g. "$104–$147/night". */
  price_range?: string;
  /** v2_hotels only — proximity note from the curated research. */
  distance_note?: string;
  /** v2_bars only — bar also has a kitchen. */
  has_food?: boolean;
  /** v2_food only — restaurant also has a full bar. */
  has_bar?: boolean;
  coords: Coords | null;
}

export interface CityVenues {
  hotel: Venue[];
  bar: Venue[];
  food: Venue[];
}

export const EMPTY_VENUES: CityVenues = { hotel: [], bar: [], food: [] };
