"use client";

import { useEffect, useState } from "react";
import type { City, Coords, VenueKind } from "@/data/types";
import { loadGoogleMaps } from "@/lib/maps";
import { getSupabase, type DbVenueRow } from "@/lib/supabase";
import { EMPTY_VENUES, type CityVenues, type Venue } from "@/lib/venues";

// Curated Supabase tables — the only source for venue lists.
const TABLES: Record<VenueKind, string> = {
  hotel: "v2_hotels",
  bar: "v2_bars",
  food: "v2_food",
};

// How many geocode requests run at once — kept low to stay under the
// Geocoder's client-side rate limit.
const GEOCODE_CONCURRENCY = 3;

function toVenue(kind: VenueKind, row: DbVenueRow): Venue {
  const venue: Venue = {
    id: row.id,
    kind,
    city_id: row.city_id,
    name: row.name,
    address: row.address ?? "",
    descriptor: row.descriptor ?? "",
    coords: null,
  };
  if (row.stars != null) venue.stars = row.stars;
  if (row.price_range != null) venue.price_range = row.price_range;
  if (row.distance_note != null) venue.distance_note = row.distance_note;
  if (row.has_food != null) venue.has_food = row.has_food;
  if (row.has_bar != null) venue.has_bar = row.has_bar;
  return venue;
}

/** One category from Supabase. Failures collapse to an empty list — no error UI. */
async function fetchKind(kind: VenueKind, cityId: string): Promise<Venue[]> {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const base = sb.from(TABLES[kind]).select("*").eq("city_id", cityId);
    // Hotels carry a proximity note from the curated research; bars and food
    // were inserted in display order already.
    const { data, error } = await (kind === "hotel" ? base.order("distance_note") : base);
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

// venue id → geocoded coords (null = lookup failed; no pin this session)
const coordsCache = new Map<string, Coords | null>();
const inflight = new Map<string, Promise<Coords | null>>();

async function geocodeQuery(
  geocoder: google.maps.Geocoder,
  address: string,
): Promise<Coords | null> {
  for (let attempt = 0; ; attempt++) {
    try {
      const { results } = await geocoder.geocode({ address });
      const location = results?.[0]?.geometry?.location;
      return location ? { lat: location.lat(), lng: location.lng() } : null;
    } catch (err) {
      // One backoff retry when rate-limited; anything else means no pin.
      const code = (err as { code?: string } | null)?.code;
      if (attempt === 0 && code === "OVER_QUERY_LIMIT") {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        continue;
      }
      return null;
    }
  }
}

function geocodeVenue(
  geocoder: google.maps.Geocoder,
  venue: Venue,
  city: City,
): Promise<Coords | null> {
  const cached = coordsCache.get(venue.id);
  if (cached !== undefined) return Promise.resolve(cached);
  let promise = inflight.get(venue.id);
  if (!promise) {
    const query = venue.address
      ? `${venue.name}, ${venue.address}`
      : `${venue.name}, ${city.name}, ${city.state}`;
    promise = geocodeQuery(geocoder, query).then((coords) => {
      coordsCache.set(venue.id, coords);
      inflight.delete(venue.id);
      return coords;
    });
    inflight.set(venue.id, promise);
  }
  return promise;
}

/**
 * Resolves map-pin coordinates in the background, a few venues at a time.
 * Never blocks the lists; a venue whose geocode fails simply has no pin.
 */
async function resolveCoords(
  venues: Venue[],
  city: City,
  onCoords: (venueId: string, coords: Coords) => void,
): Promise<void> {
  let geocoder: google.maps.Geocoder;
  try {
    const g = await loadGoogleMaps();
    geocoder = new g.maps.Geocoder();
  } catch {
    return; // Maps unavailable — lists render without pins
  }
  const queue = [...venues];
  const worker = async () => {
    for (let venue = queue.shift(); venue; venue = queue.shift()) {
      const coords = await geocodeVenue(geocoder, venue, city);
      if (coords) onCoords(venue.id, coords);
    }
  };
  await Promise.allSettled(Array.from({ length: GEOCODE_CONCURRENCY }, () => worker()));
}

function mapVenues(venues: CityVenues, fn: (venue: Venue) => Venue): CityVenues {
  return { hotel: venues.hotel.map(fn), bar: venues.bar.map(fn), food: venues.food.map(fn) };
}

/** Coords already resolved in a previous visit attach without re-geocoding. */
function withKnownCoords(venues: CityVenues): CityVenues {
  return mapVenues(venues, (venue) => {
    const coords = coordsCache.get(venue.id);
    return coords ? { ...venue, coords } : venue;
  });
}

export interface VenuesView {
  venues: CityVenues;
  /** False until the Supabase lists settle. Pins keep resolving afterwards. */
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
        if (cancelled) return;
        // The list renders immediately; pins stream in as geocoding resolves.
        setState({ cityId: city.id, venues: withKnownCoords(venues), ready: true });
        const all = [...venues.hotel, ...venues.bar, ...venues.food];
        void resolveCoords(all, city, (venueId, coords) => {
          if (cancelled) return;
          setState((prev) =>
            prev.cityId === city.id
              ? {
                  ...prev,
                  venues: mapVenues(prev.venues, (venue) =>
                    venue.id === venueId ? { ...venue, coords } : venue,
                  ),
                }
              : prev,
          );
        });
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
