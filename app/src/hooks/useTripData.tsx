"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useTrip, type TripView } from "./useTrip";

const TripContext = createContext<TripView | null>(null);

export function TripDataProvider({ children }: { children: ReactNode }) {
  const trip = useTrip();
  return <TripContext.Provider value={trip}>{children}</TripContext.Provider>;
}

export function useTripData(): TripView {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTripData must be used inside TripDataProvider");
  return ctx;
}
