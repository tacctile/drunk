"use client";

import type { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { HopNav } from "./HopNav";

// Desktop rail can be added here in a future pass.

export function HopShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <TopBar />
      <main className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <HopNav />
    </div>
  );
}
