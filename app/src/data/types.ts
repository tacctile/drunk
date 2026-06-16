export interface Coords {
  lat: number;
  lng: number;
}

export interface City {
  id: string;
  name: string;
  state: string;
  miles: number; // from Ralston, NE (68127)
  drive: string; // from Ralston, NE
  walkScore: number; // 0–100 — hardcoded research, never calculated
  walkGrade: string; // "A+" | "A" | "A-" | "B+" | … | "F" — hardcoded research
  district: string; // the social gathering district name
  mapCenter: Coords;
  mapZoom: number;
}

export type VenueKind = "hotel" | "bar" | "food";
