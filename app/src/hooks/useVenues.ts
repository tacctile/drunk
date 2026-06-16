"use client";

import { useEffect, useState } from "react";
import type { City, VenueKind } from "@/data/types";
import { getSupabase, type DbVenueRow } from "@/lib/supabase";
import { EMPTY_VENUES, type CityVenues, type Venue } from "@/lib/venues";

// Curated Supabase tables — the only source for venue lists.
const TABLES: Record<VenueKind, string> = {
  hotel: "v2_hotels",
  bar: "v2_bars",
  food: "v2_food",
};

function toVenue(kind: VenueKind, row: DbVenueRow): Venue {
  const venue: Venue = {
    id: row.id,
    kind,
    city_id: row.city_id,
    name: row.name,
    address: row.address ?? "",
    descriptor: row.descriptor ?? "",
    // Pin coordinates come straight from the curated lat/lng columns.
    // Null (not yet backfilled) just means no pin — the row still renders.
    lat: row.lat ?? null,
    lng: row.lng ?? null,
  };
  if (row.stars != null) venue.stars = row.stars;
  if (row.price_range != null) venue.price_range = row.price_range;
  if (row.distance_note != null) venue.distance_note = row.distance_note;
  if (row.has_food != null) venue.has_food = row.has_food;
  if (row.has_bar != null) venue.has_bar = row.has_bar;
  return venue;
}

/**
 * One category from Supabase. Every row for the city — no LIMIT, no ORDER BY
 * (insertion order is already proximity/rating order from the curated SQL).
 * Hotels are filtered to 3 stars and above. Failures collapse to an empty
 * list — no error UI.
 */
async function fetchKind(kind: VenueKind, cityId: string): Promise<Venue[]> {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const base = sb.from(TABLES[kind]).select("*").eq("city_id", cityId);
    const { data, error } = await (kind === "hotel" ? base.gte("stars", 3) : base);
    if (error || !data) return [];
    return (data as DbVenueRow[]).map((row) => toVenue(kind, row));
  } catch {
    return [];
  }
}

async function fetchCityVenues(cityId: string): Promise<CityVenues> {
  const [hotel, bar, food] = await Promise.all([
    fetchKind("hotel", cityId),
    fetchKind("bar", cityId),
    fetchKind("food", cityId),
  ]);
  return { hotel, bar, food };
}

// One list fetch per city per session — curated rows don't change mid-visit.
const listCache = new Map<string, Promise<CityVenues>>();

export interface VenuesView {
  venues: CityVenues;
  /** False until the Supabase lists settle. */
  ready: boolean;
}

export function useVenues(city: City): VenuesView {
  const [state, setState] = useState<{ cityId: string; venues: CityVenues; ready: boolean }>({
    cityId: city.id,
    venues: EMPTY_VENUES,
    ready: false,
  });

  useEffect(() => {
    let cancelled = false;
    let promise = listCache.get(city.id);
    if (!promise) {
      promise = fetchCityVenues(city.id);
      listCache.set(city.id, promise);
    }
    promise.then(
      (venues) => {
        if (!cancelled) setState({ cityId: city.id, venues, ready: true });
      },
      () => {
        listCache.delete(city.id);
        if (!cancelled) setState({ cityId: city.id, venues: EMPTY_VENUES, ready: true });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [city]);

  if (state.cityId !== city.id) return { venues: EMPTY_VENUES, ready: false };
  return { venues: state.venues, ready: state.ready };
}
