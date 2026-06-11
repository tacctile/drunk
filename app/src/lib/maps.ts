"use client";

import { Loader } from "@googlemaps/js-api-loader";

const MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "AIzaSyAKzTDijoSvxp9Gb2oEqYXW4kmnEzkbMWQ";

// Fixed pin palette per spec — identical in both themes.
export const PIN_COLORS = {
  hotel: "#E8A030",
  bar: "#4CAF50",
  food: "#2196F3",
} as const;

let loaderPromise: Promise<typeof google> | null = null;

export function loadGoogleMaps(): Promise<typeof google> {
  if (!loaderPromise) {
    const loader = new Loader({ apiKey: MAPS_API_KEY, version: "weekly" });
    loaderPromise = loader.load();
  }
  return loaderPromise;
}

// Map styles tuned to the app surfaces: deep warm blacks in dark mode,
// warm paper whites in light mode. POI clutter off in both.
export const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#16130d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#a79d89" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0e0c08" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#2b2517" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#241f15" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8170" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#2c2618" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3522" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#13100b" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#1a2026" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#5d6a75" }] },
];

export const LIGHT_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f4f0e6" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6e6555" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f8f5ef" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#d3c9b1" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e5ddcb" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#99907d" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f0e6cf" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f1ece1" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#cfdde6" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#7b8e9a" }] },
];

export const BASE_MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  gestureHandling: "cooperative",
  clickableIcons: false,
  backgroundColor: "transparent",
};
