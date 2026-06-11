export interface Coords {
  lat: number;
  lng: number;
}

export type VibeTag =
  | "Craft Beer"
  | "Dive Bars"
  | "Casino Night"
  | "College Town"
  | "Rooftop Scene"
  | "Small Town"
  | "River Town"
  | "Live Music"
  | "Steakhouse Row"
  | "Lake Town";

export interface Hotel {
  id: string; // kebab-case slug of the hotel name; referenced by v2_hotel_votes.hotel_id
  name: string;
  address: string; // empty string when unknown
  stars: number;
  priceRange: string;
  distanceNote: string;
  onSite?: string;
  website: string; // the ONLY external link the app ever renders
  coords?: Coords;
  verified: boolean;
  unverifiedNote?: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  description: string;
  hours?: string;
  coords?: Coords;
  verified: boolean;
  unverifiedNote?: string;
}

export interface City {
  id: string;
  name: string;
  state: string;
  miles: number;
  drive: string;
  tagline: string; // hand-written one-sentence hook; editorial, never generated
  mapCenter: Coords;
  mapZoom: number;
  vibes: VibeTag[];
  hotels: Hotel[];
  bars: Venue[];
  food: Venue[];
}

export type WalkabilityTier = "Walk Everything" | "Walk Most" | "Need a Ride";

export type VenueKind = "hotel" | "bar" | "food";
