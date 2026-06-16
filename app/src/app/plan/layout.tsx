"use client";

import { useEffect, type ReactNode } from "react";
import { isAuthenticated, setLastWing } from "@/lib/auth";

/**
 * Plan-wing wrapper. The shared chrome (AppShell header, the four plan tabs,
 * and the desktop rail) is provided globally by the root layout and shown for
 * any /plan/* route — so here we only record that the user is in the plan wing
 * (a cold open resumes the right side) and keep the soft-guard cookie fresh.
 */
export default function PlanLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    setLastWing("plan");
    isAuthenticated();
  }, []);

  return <>{children}</>;
}
