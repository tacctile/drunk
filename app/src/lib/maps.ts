"use client";

import { Loader } from "@googlemaps/js-api-loader";
import type { VenueKind } from "@/data/types";

const MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "AIzaSyAKzTDijoSvxp9Gb2oEqYXW4kmnEzkbMWQ";

// Pin fills per venue kind. Every pin is a filled 10px circle with a white
// 2px stroke — color is the only differentiator.
export const PIN_COLORS: Record<VenueKind, string> = {
  hotel: "#FF8C42",
  bar: "#34D399",
  food: "#60A5FA",
};

let loaderPromise: Promise<typeof google> | null = null;

export function loadGoogleMaps(): Promise<typeof google> {
  if (!loaderPromise) {
    const loader = new Loader({ apiKey: MAPS_API_KEY, version: "weekly", libraries: ["places"] });
    loaderPromise = loader.load();
  }
  return loaderPromise;
}

// Single dark style: deep blue-black land (#0A0D14), dark roads (#1A1F2B),
// muted labels (--ink-dim). No POI icons, no transit.
export const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0a0d14" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4a5468" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0d14" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#252b3a" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#0a0d14" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1f2b" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#4a5468" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#10141d" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4a5468" }] },
];

export const BASE_MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  gestureHandling: "cooperative",
  clickableIcons: false,
  backgroundColor: "#0a0d14",
};
