"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { PlanNav } from "./PlanNav";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const bare = pathname === "/login" || pathname === "/";
  const inPlan = pathname.startsWith("/plan");

  if (bare) return <>{children}</>;

  return (
    <div className="min-h-dvh min-[840px]:flex">
      <PlanNav />

      <div className="min-w-0 flex-1">
        <TopBar />
        <main className={inPlan ? "pb-[calc(140px+env(safe-area-inset-bottom))] min-[840px]:pb-10" : ""}>
          {children}
        </main>
      </div>
    </div>
  );
}
