import { cities } from "@/data/cities";
import type { City, Coords, WalkabilityTier } from "@/data/types";
import { centroid, haversineMiles } from "./geo";

export interface CityMeta {
  /** Centroid of the city's main bar cluster. */
  barCentroid: Coords | null;
  /** Distance from the closest hotel (with coords) to the bar centroid, miles. */
  nearestHotelMi: number | null;
  /** id of that closest hotel. */
  nearestHotelId: string | null;
  /** Cluster radius: farthest in-cluster bar from the centroid, miles. */
  barSpreadMi: number;
  /** Bars with coords sitting within 0.5 mi of the centroid. */
  walkableBarCount: number;
  tier: WalkabilityTier;
  /** Composite 0–100: walkability 40% + bar count 30% + hotel proximity 30%. */
  score: number;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * The main bar cluster: seeded from the bar with the most neighbors within
 * 1 mi, keeping everything within 2.5 mi of the seed. A single far-flung
 * venue (e.g. Blair's list includes a cigar bar over in Fremont) shouldn't
 * define a city's walkability.
 */
function mainCluster(points: Coords[]): Coords[] {
  if (points.length <= 1) return points;
  let seed = points[0];
  let best = -1;
  for (const p of points) {
    const n = points.filter((q) => haversineMiles(p, q) <= 1).length;
    if (n > best) {
      best = n;
      seed = p;
    }
  }
  return points.filter((p) => haversineMiles(seed, p) <= 2.5);
}

function computeMeta(city: City): CityMeta {
  const allBarPts = city.bars.flatMap((b) => (b.coords ? [b.coords] : []));
  const cluster = mainCluster(allBarPts);
  const barCentroid = centroid(cluster);
  // Tier thresholds read "bars within X mi of each other" as cluster radius:
  // how far the farthest bar sits from the heart of the strip.
  const barSpreadMi = barCentroid
    ? Math.max(0, ...cluster.map((p) => haversineMiles(p, barCentroid)))
    : 0;

  let nearestHotelMi: number | null = null;
  let nearestHotelId: string | null = null;
  if (barCentroid) {
    for (const h of city.hotels) {
      if (!h.coords) continue;
      const d = haversineMiles(h.coords, barCentroid);
      if (nearestHotelMi === null || d < nearestHotelMi) {
        nearestHotelMi = d;
        nearestHotelId = h.id;
      }
    }
  }

  const walkableBarCount = barCentroid
    ? allBarPts.filter((p) => haversineMiles(p, barCentroid) <= 0.5).length
    : 0;

  let tier: WalkabilityTier = "Need a Ride";
  if (nearestHotelMi !== null && cluster.length > 0) {
    if (nearestHotelMi <= 0.2 && barSpreadMi <= 0.3) tier = "Walk Everything";
    else if (nearestHotelMi <= 0.5 && barSpreadMi <= 0.5) tier = "Walk Most";
  }

  // Walkability (40 pts): cluster tightness + hotel-to-centroid distance,
  // both continuous so similar cities don't collapse onto identical scores.
  const tightness = clamp01(1 - barSpreadMi / 0.8);
  const hotelReach = nearestHotelMi === null ? 0 : clamp01(1 - nearestHotelMi / 1.2);
  const walkPts = (tightness * 0.55 + hotelReach * 0.45) * 40;

  // Bar count (30 pts): 8+ bars inside the walkable cluster maxes it out.
  const barPts30 = clamp01(walkableBarCount / 8) * 30;

  // Hotel proximity (30 pts): how close the best-positioned hotel actually is.
  const proxPts = nearestHotelMi === null ? 0 : clamp01(1 - nearestHotelMi / 1.0) * 30;

  return {
    barCentroid,
    nearestHotelMi,
    nearestHotelId,
    barSpreadMi,
    walkableBarCount,
    tier,
    score: Math.round(walkPts + barPts30 + proxPts),
  };
}

/** Computed once at module load; keyed by city id. */
export const cityMeta: Record<string, CityMeta> = Object.fromEntries(
  cities.map((c) => [c.id, computeMeta(c)]),
);

export function hotelToVenueMiles(
  city: City,
  hotelId: string,
  venueCoords: Coords | undefined,
): number | null {
  const hotel = city.hotels.find((h) => h.id === hotelId);
  if (!hotel?.coords || !venueCoords) return null;
  return haversineMiles(hotel.coords, venueCoords);
}

export function tierTone(tier: WalkabilityTier): "good" | "accent" | "muted" {
  if (tier === "Walk Everything") return "good";
  if (tier === "Walk Most") return "accent";
  return "muted";
}
