"use client";

import { Loader } from "@googlemaps/js-api-loader";

const MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "AIzaSyAKzTDijoSvxp9Gb2oEqYXW4kmnEzkbMWQ";

// Pins differentiate by SHAPE, not color: hotel = filled accent square,
// bar = filled near-white circle, food = outlined muted circle. These inks
// match the constellation and the walk strip.
export const PIN_COLORS = {
  hotel: "#FF9433",
  bar: "#E8ECF4",
  food: "#8E99AC",
} as const;

let loaderPromise: Promise<typeof google> | null = null;

export function loadGoogleMaps(): Promise<typeof google> {
  if (!loaderPromise) {
    const loader = new Loader({ apiKey: MAPS_API_KEY, version: "weekly" });
    loaderPromise = loader.load();
  }
  return loaderPromise;
}

// Single dark style tuned to the app's blue-black surfaces. POI clutter off.
export const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#12161f" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8e99ac" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0d14" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#232a38" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a2130" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#5c6678" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#1e2636" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2a3447" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#0d1119" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#14202e" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#46566b" }] },
];

export const BASE_MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  gestureHandling: "cooperative",
  clickableIcons: false,
  backgroundColor: "transparent",
};
